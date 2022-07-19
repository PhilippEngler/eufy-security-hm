import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { EufySecurityEvents } from './interfaces';
import { HTTPApi, Hubs, Station, GuardMode, PropertyValue, RawValues, Device, StationListResponse, DeviceType } from './http';
import { sleep } from './push/utils';
import { Devices } from "./devices";
import { CommandResult, StreamMetadata } from ".";
import internal from "stream";
import { AlarmEvent, P2PConnectionType } from "./p2p";
import { TalkbackStream } from "./p2p/talkback";

/**
 * Represents all the Bases in the account.
 */
export class Bases extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private serialNumbers : string[];
    private resBases !: Hubs;
    private bases : { [stationSerial : string ] : Station} = {};
    private devices !: Devices;
    private skipNextModeChangeEvent : { [stationSerial : string] : boolean } = {};
    private reconnectTimeout : { [stationSerial : string] : NodeJS.Timeout | undefined} = {};

    private readonly P2P_REFRESH_INTERVAL_MIN = 720;
    private refreshEufySecurityP2PTimeout: {
        [dataType: string]: NodeJS.Timeout;
    } = {};

    /**
     * Create the Bases objects holding all bases in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];

        this.httpService.on("hubs", (hubs: Hubs) => this.handleHubs(hubs));
    }

    /**
     * Put all bases and their settings in format so that we can work with them.
     * @param hubs The object containing the bases.
     */
    private handleHubs(hubs: Hubs): void
    {
        this.api.logDebug("Got hubs:", hubs);
        this.resBases = hubs;

        for (var stationSerial in this.resBases)
        {
            if(this.bases[stationSerial])
            {
                this.updateStation(this.resBases[stationSerial]);
            }
            else
            {
                this.bases[stationSerial] = new Station(this.api, this.httpService, this.resBases[stationSerial]);
                this.skipNextModeChangeEvent[stationSerial] = false;
                this.reconnectTimeout[stationSerial] = undefined;
                this.serialNumbers.push(stationSerial);
                this.bases[stationSerial].connect();

                if(this.api.getApiUseUpdateStateEvent())
                {
                    this.addEventListener(this.bases[stationSerial], "GuardModeChanged", false);
                    this.addEventListener(this.bases[stationSerial], "CurrentMode", false);
                    this.addEventListener(this.bases[stationSerial], "PropertyChanged", false);
                    this.addEventListener(this.bases[stationSerial], "RawPropertyChanged", false);
                }

                this.addEventListener(this.bases[stationSerial], "Connect", false);
                this.addEventListener(this.bases[stationSerial], "Close", false);
                this.addEventListener(this.bases[stationSerial], "RawDevicePropertyChanged", false);
                this.addEventListener(this.bases[stationSerial], "LivestreamStart", false);
                this.addEventListener(this.bases[stationSerial], "LivestreamStop", false);
                this.addEventListener(this.bases[stationSerial], "LivestreamError", false);
                this.addEventListener(this.bases[stationSerial], "DownloadStart", false);
                this.addEventListener(this.bases[stationSerial], "DownloadFinish", false);
                this.addEventListener(this.bases[stationSerial], "CommandResult", false);
                this.addEventListener(this.bases[stationSerial], "RTSPLivestreamStart", false);
                this.addEventListener(this.bases[stationSerial], "RTSPLivestreamStop", false);
                this.addEventListener(this.bases[stationSerial], "RTSPUrl", false);
                this.addEventListener(this.bases[stationSerial], "AlarmEvent", false);
                this.addEventListener(this.bases[stationSerial], "RuntimeState", false);
                this.addEventListener(this.bases[stationSerial], "ChargingState", false);
                this.addEventListener(this.bases[stationSerial], "WifiRssi", false);
                this.addEventListener(this.bases[stationSerial], "FloodlightManualSwitch", false);
                this.addEventListener(this.bases[stationSerial], "AlarmDelayEvent", false);
                this.addEventListener(this.bases[stationSerial], "TalkbackStarted", false);
                this.addEventListener(this.bases[stationSerial], "TalkbackStopped", false);
                this.addEventListener(this.bases[stationSerial], "TalkbackError", false);
                this.addEventListener(this.bases[stationSerial], "AlarmArmedEvent", false);
                this.addEventListener(this.bases[stationSerial], "AlarmArmDelayEvent", false);
            }
        }
        this.saveBasesSettings();
    }

    /**
     * Update the base information.
     * @param hub The object containg the specific hub.
     */
    private updateStation(hub : StationListResponse) : void
    {
        if (Object.keys(this.bases).includes(hub.station_sn))
        {
            this.bases[hub.station_sn].update(hub, this.bases[hub.station_sn] !== undefined && this.bases[hub.station_sn].isConnected());
            if (!this.bases[hub.station_sn].isConnected() && !this.bases[hub.station_sn].isEnergySavingDevice())
            {
                if(this.bases[hub.station_sn].getDeviceType() == DeviceType.STATION)
                {
                    this.bases[hub.station_sn].setConnectionType(this.api.getP2PConnectionType());
                }
                else
                {
                    this.bases[hub.station_sn].setConnectionType(P2PConnectionType.QUICKEST);
                }
                this.bases[hub.station_sn].connect();
            }
        }
        else
        {
            this.api.logError(`Station with this serial ${hub.station_sn} doesn't exists and couldn't be updated!`);
        }
    }

    /**
     * Set the devices connected with the account.
     * @param devices The devices to set.
     */
    public setDevices(devices : Devices) : void
    {
        this.devices = devices;
    }

    /**
     * (Re)Loads all bases and the settings of them.
     */
    public async loadBases() : Promise<void>
    {
        try
        {
            this.resBases = this.httpService.getHubs();
        }
        catch (e : any)
        {
            this.bases = {};
            throw new Error(e);
        }
    }

    /**
     * Close all P2P connection for all bases.
     */
    public async closeP2PConnections() : Promise<void>
    {
        if(this.resBases != null)
        {
            for (var stationSerial in this.resBases)
            {
                if(this.bases[stationSerial])
                {
                    await this.bases[stationSerial].close();
                    
                    this.removeEventListener(this.bases[stationSerial], "GuardModeChanged");
                    this.removeEventListener(this.bases[stationSerial], "CurrentMode");
                    this.removeEventListener(this.bases[stationSerial], "PropertyChanged");
                    this.removeEventListener(this.bases[stationSerial], "RawPropertyChanged");
                    this.removeEventListener(this.bases[stationSerial], "Connect");
                    this.removeEventListener(this.bases[stationSerial], "Close");
                    this.removeEventListener(this.bases[stationSerial], "RawDevicePropertyChanged");
                    this.removeEventListener(this.bases[stationSerial], "LivestreamStart");
                    this.removeEventListener(this.bases[stationSerial], "LivestreamStop");
                    this.removeEventListener(this.bases[stationSerial], "LivestreamError");
                    this.removeEventListener(this.bases[stationSerial], "DownloadStart");
                    this.removeEventListener(this.bases[stationSerial], "DownloadFinish");
                    this.removeEventListener(this.bases[stationSerial], "CommandResult");
                    this.removeEventListener(this.bases[stationSerial], "RTSPLivestreamStart");
                    this.removeEventListener(this.bases[stationSerial], "RTSPLivestreamStop");
                    this.removeEventListener(this.bases[stationSerial], "RTSPUrl");
                    this.removeEventListener(this.bases[stationSerial], "AlarmEvent");
                    this.removeEventListener(this.bases[stationSerial], "RuntimeState");
                    this.removeEventListener(this.bases[stationSerial], "ChargingState");
                    this.removeEventListener(this.bases[stationSerial], "WifiRssi");
                    this.removeEventListener(this.bases[stationSerial], "FloodlightManualSwitch");
                    this.removeEventListener(this.bases[stationSerial], "AlarmDelayEvent");
                    this.removeEventListener(this.bases[stationSerial], "TalkbackStarted");
                    this.removeEventListener(this.bases[stationSerial], "TalkbackStopped");
                    this.removeEventListener(this.bases[stationSerial], "TalkbackError");
                    this.removeEventListener(this.bases[stationSerial], "AlarmArmedEvent");
                    this.removeEventListener(this.bases[stationSerial], "AlarmArmDelayEvent");

                    clearTimeout(this.refreshEufySecurityP2PTimeout[stationSerial]);
                }                
            }
        }
    }

    /**
     * Update the infos of all connected devices over P2P.
     */
    public async updateDeviceData() : Promise<void>
    {
        await this.httpService.refreshAllData().catch(error => {
            this.api.logError("Error occured at updateDeviceData while API data refreshing.", error);
        });
        Object.values(this.bases).forEach(async (station: Station) => {
            if (station.isConnected() && station.getDeviceType() !== DeviceType.DOORBELL)
            {
                await station.getCameraInfo().catch(error => {
                    this.api.logError(`Error occured at updateDeviceData while station ${station.getSerial()} p2p data refreshing.`, error);
                });
            }
        });
    }

    /**
     * Save the relevant settings (mainly for P2P-Connection) to the config
     */
    public async saveBasesSettings() : Promise<void>
    {
        await this.api.saveBasesSettings(this.bases, this.serialNumbers);
    }

    /**
     * Returns a Array of all Bases.
     */
    public getBases() : {[stationSerial: string] : Station}
    {
        return this.bases;
    }

    /**
     * Get the guard mode for all bases.
     */
    public getGuardMode() : {[stationSerial: string] : Station}
    {
        return this.getBases();
    }

    /**
     * Set the guard mode of all bases to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode : GuardMode) : Promise<boolean>
    {
        for (var stationSerial in this.bases)
        {
            this.skipNextModeChangeEvent[stationSerial] = true;
            await this.bases[stationSerial].setGuardMode(guardMode)
            await sleep(500);
        }
        return await this.checkChangedGuardMode(guardMode, true, "");
    }

    /**
     * Set the guard mode for the given base to the given mode.
     * @param baseSerial The serial of the base the mode to change.
     * @param guardMode The target guard mode.
     */
    public async setGuardModeBase(baseSerial : string, guardMode : GuardMode) : Promise<boolean>
    {
        this.skipNextModeChangeEvent[baseSerial] = true;
        await this.bases[baseSerial].setGuardMode(guardMode);
        return await this.checkChangedGuardMode(guardMode, false, this.bases[baseSerial].getSerial());
    }

    /**
     * Check the guardMode after changing if the guardMode has changed.
     * @param guardMode The guradMode the base should be set to.
     * @param checkAllBases true, if all bases should be checked, otherwise false
     * @param baseSerial The serial of the base the mode to change.
     */
    private async checkChangedGuardMode(guardMode : GuardMode, checkAllBases : boolean, baseSerial : string) : Promise<boolean>
    {
        var res = false;
        if(checkAllBases == true)
        {
            var cnt = 0;
            for (var stationSerial in this.bases)
            {
                for(var i=0; i<20; i++)
                {
                    await sleep(1000);
                    await this.loadBases();
                    if(this.bases[stationSerial].getGuardMode() as number == guardMode)
                    {
                        this.api.logInfo(`Detected changed alarm mode for station ${stationSerial} after ${(i+1)} iterations.`);
                        res = true;
                        break;
                    }
                }
                if(res == false)
                {
                    this.api.logInfo(`Changed alarm mode for station ${stationSerial} could not be detected after 20 iterations.`);
                    cnt = cnt + 1;
                }
            }
            if(cnt == 0)
            {
                res = true;
            }
            else
            {
                res = false;
            }
        }
        else
        {
            for(var i=0; i<20; i++)
            {
                await sleep(1000);
                await this.loadBases();
                if(this.bases[baseSerial].getGuardMode() as number == guardMode)
                {
                    this.api.logInfo(`Detected changed alarm mode for station ${baseSerial} after ${(i+1)} iterations.`);
                    res = true;
                    break;
                }
            }
            if(res == false)
            {
                this.api.logInfo(`Changed alarm mode for station ${baseSerial} could not be detected after 20 iterations.`);
            }
        }

        if(res == true)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Force reconnect to a given base.
     * @param stationSerial The serial of the base to reconnect.
     */
    private async forceReconnect(stationSerial : string) : Promise<void>
    {
        if(this.bases[stationSerial].isConnected() == false)
        {
            this.api.logInfo(`Reconnect for base ${stationSerial} forced after 5 minutes.`);
            clearTimeout(this.reconnectTimeout[stationSerial]);
            this.reconnectTimeout[stationSerial] = undefined;
            await this.bases[stationSerial].connect();
        }
        else
        {
            this.api.logInfo(`Reconnect for base ${stationSerial} already done.`);
        }
    }

    /**
     * Add a given event listener for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     * @param delayed false if add instantly, for a 5s delay set true. 
     */
    public async addEventListener(base : Station, eventListenerName : string, delayed : boolean) : Promise<void>
    {
        if(delayed == true)
        {
            await sleep(5000);
        }
        switch (eventListenerName)
        {
            case "Connect":
                base.on("connect", (station : Station) => this.onStationConnect(station));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("connect")} Listener.`);
                break;
            case "Close":
                base.on("close", (station : Station) => this.onStationClose(station));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.on("raw device property changed", (deviceSN: string, params: RawValues) => this.onStationRawDevicePropertyChanged(deviceSN, params));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                base.on("livestream start", (station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable) => this.onStationLivestreamStart(station, channel, metadata, videoStream, audioStream));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                base.on("livestream stop", (station : Station, channel : number) => this.onStationLivestreamStop(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                base.on("livestream error", (station : Station, channel : number) => this.onStationLivestreamError(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                base.on("download start", (station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable) => this.onStationDownloadStart(station, channel, metadata, videoStream, audioStream));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                base.on("download finish", (station : Station, channel : number) => this.onStationDownloadFinish(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                base.on("command result", (station : Station, result : CommandResult) => this.onStationCommandResult(station, result));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("command result")} Listener.`);
                break;
            case "GuardModeChanged":
                base.on("guard mode", (station : Station, guardMode : number) => this.onStationGuardMode(station, guardMode));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                base.on("current mode", (station : Station, guardMode : number) => this.onStationCurrentMode(station, guardMode));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                base.on("rtsp livestream start", (station : Station, channel : number) => this.onStationRTSPLivestreamStart(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                base.on("rtsp livestream stop", (station : Station, channel : number) => this.onStationRTSPLivestreamStop(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                base.on("rtsp url", (station : Station, channel : number) => this.onStationRTSPURL(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station : Station, name : string, value : PropertyValue) => this.onStationPropertyChanged(station, name, value));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station : Station, type : number, value : string) => this.onStationRawPropertyChanged(station, type, value));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                base.on("alarm event", (station : Station, alarmEvent : AlarmEvent) => this.onStationAlarmEvent(station, alarmEvent));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                base.on("runtime state", (station: Station, channel: number, batteryLevel: number, temperature: number) => this.onStationRuntimeState(station, channel, batteryLevel, temperature));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.on("charging state", (station: Station, channel: number, chargeType: number, batteryLevel: number) => this.onStationChargingState(station, channel, chargeType, batteryLevel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.on("wifi rssi", (station: Station, channel: number, rssi: number) => this.onStationWifiRssi(station, channel, rssi));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                base.on("floodlight manual switch", (station: Station, channel: number, enabled : boolean) => this.onStationFloodlightManualSwitch(station, channel, enabled));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                base.on("alarm delay event", (station: Station, alarmDelayEvent: AlarmEvent, alarmDelay : number) => this.onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                base.on("talkback started", (station: Station, channel: number, talkbackStream : TalkbackStream) => this.onStationTalkbackStarted(station, channel, talkbackStream));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                base.on("talkback stopped", (station: Station, channel: number) => this.onStationTalkbackStopped(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("talkback stopped")} Listener.`);
                break;
            case "talkback error":
                base.on("talkback error", (station: Station, channel: number, error : Error) => this.onStationTalkbackError(station, channel, error));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                base.on("alarm armed event", (station: Station) => this.onStationAlarmArmedEvent(station));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                base.on("alarm arm delay event", (station: Station, alarmDelay: number) => this.onStationAlarmArmDelayEvent(station, alarmDelay));
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} added. Total ${base.listenerCount("alarm arm delay event")} Listener.`);
                break;
            default:
                this.api.logInfo(`The listener '${eventListenerName}' for bases is unknown.`);
                break;
        }
    }

    /**
     * Remove all event listeners for a given event type for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     */
    public removeEventListener(base : Station, eventListenerName : string) : void
    {
        switch (eventListenerName)
        {
            case "Connect":
                base.removeAllListeners("connect");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("connect")} Listener.`);
                break;
            case "Close":
                base.removeAllListeners("close");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.removeAllListeners("raw device property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                base.removeAllListeners("livestream start");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                base.removeAllListeners("livestream stop");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                base.removeAllListeners("livestream error");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("livestream stop")} Listener.`);
                break;
            case "DownloadStart":
                base.removeAllListeners("download start");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                base.removeAllListeners("download finish");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                base.removeAllListeners("command result");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("command result")} Listener.`);
                break;
            case "GuardModeChanged":
                base.removeAllListeners("guard mode");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                base.removeAllListeners("current mode");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                base.removeAllListeners("rtsp livestream start");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                base.removeAllListeners("rtsp livestream stop");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPURL":
                base.removeAllListeners("rtsp url");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                base.removeAllListeners("property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                base.removeAllListeners("alarm event");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                base.removeAllListeners("runtime state");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.removeAllListeners("charging state");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.removeAllListeners("wifi rssi");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                base.removeAllListeners("floodlight manual switch");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                base.removeAllListeners("alarm delay event");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                base.removeAllListeners("talkback started");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                base.removeAllListeners("talkback stopped");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("talkback stopped")} Listener.`);
                break;
            case "talkback error":
                base.removeAllListeners("talkback error");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                base.removeAllListeners("alarm armed event");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                base.removeAllListeners("alarm arm delay event");
                this.api.logDebug(`Listener '${eventListenerName}' for base ${base.getSerial()} removed. Total ${base.listenerCount("alarm arm delay event")} Listener.`);
                break;
            default:
                this.api.logInfo(`The listener '${eventListenerName}' for bases is unknown.`);
                break;
        }
    }

    /**
     * Returns the number of attached listeners for a given base and a given event.
     * @param base The base the number of attached listners to count.
     * @param eventListenerName The name of the event the attached listeners to count.
     */
    public countEventListener(base : Station, eventListenerName : string) : number
    {
        switch (eventListenerName)
        {
            case "Connect":
                return base.listenerCount("connect");
            case "Close":
                return base.listenerCount("close");
            case "RawDevicePropertyChanged":
                return base.listenerCount("raw device property changed");
            case "LivestreamStart":
                return base.listenerCount("livestream start");
            case "LivestreamStop":
                return base.listenerCount("livestream stop");
            case "LivestreamError":
                return base.listenerCount("livestream error");
            case "DownloadStart":
                return base.listenerCount("download start");
            case "DownloadFinish":
                return base.listenerCount("download finish");
            case "CommandResult":
                return base.listenerCount("command result");
            case "GuardMode":
                return base.listenerCount("guard mode");
            case "CurrentMode":
                return base.listenerCount("current mode");
            case "RTSPLivestreamStart":
                return base.listenerCount("rtsp livestream start");
            case "RTSPLivestreamStop":
                return base.listenerCount("rtsp livestream stop");
            case "RTSPURL":
                return base.listenerCount("rtsp url");
            case "PropertyChanged":
                return base.listenerCount("property changed");
            case "RawPropertyChanged":
                return base.listenerCount("raw property changed");
            case "AlarmEvent":
                return base.listenerCount("alarm event");
            case "RuntimeState":
                return base.listenerCount("runtime state");
            case "ChargingState":
                return base.listenerCount("charging state");
            case "WifiRssi":
                return base.listenerCount("wifi rssi");
            case "FloodlightManualSwitch":
                return base.listenerCount("floodlight manual switch");
            case "AlarmDelayEvent":
                return base.listenerCount("alarm delay event");
            case "TalkbackStarted":
                return base.listenerCount("talkback started");
            case "TalkbackStopped":
                return base.listenerCount("talkback stopped");
            case "talkback error":
                return base.listenerCount("talkback error");
            case "AlarmArmedEvent":
                return base.listenerCount("alarm armed event");
            case "AlarmArmDelayEvent":
                return base.listenerCount("alarm arm delay event");
        }
        return -1;
    }

    /**
     * The action to be done when event Connect is fired.
     * @param station The base as Station object.
     */
    private async onStationConnect(station : Station) : Promise<void>
    {
        this.api.logDebug(`Event "Connect": base: ${station.getSerial()}`);
        this.emit("station connect", station);
        //disable timeout after connected
        clearTimeout(this.reconnectTimeout[station.getSerial()]);
        this.reconnectTimeout[station.getSerial()] = undefined;
        if (Device.isCamera(station.getDeviceType()) && !Device.isWiredDoorbell(station.getDeviceType()))
        {
            station.getCameraInfo().catch(error => {
                this.api.logError(`Error during station ${station.getSerial()} p2p data refreshing`, error);
            });
            if (this.refreshEufySecurityP2PTimeout[station.getSerial()] !== undefined)
            {
                clearTimeout(this.refreshEufySecurityP2PTimeout[station.getSerial()]);
            }
            this.refreshEufySecurityP2PTimeout[station.getSerial()] = setTimeout(() => {
                station.getCameraInfo().catch(error => {
                    this.api.logError(`Error during station ${station.getSerial()} p2p data refreshing`, error);
                });
            }, this.P2P_REFRESH_INTERVAL_MIN * 60 * 1000);
        }
    }

    /**
     * The action to be done when event Close is fired.
     * @param station The base as Station object.
     */
    private async onStationClose(station : Station): Promise<void>
    {
        this.api.logInfo(`Event "Close": base: ${station.getSerial()}`);
        this.emit("station close", station);

        if(this.api.getServiceState() != "shutdown")
        {
            //start timeout for 5 mins
            this.reconnectTimeout[station.getSerial()] = setTimeout(async() => { await this.forceReconnect(station.getSerial()) }, 300000);
        }
        /*for (const device_sn of this.cameraStationLivestreamTimeout.keys())
        {
            this.devices.getDevice(device_sn).then((device: Device) => {
                if (device !== null && device.getStationSerial() === station.getSerial()) {
                    clearTimeout(this.cameraStationLivestreamTimeout.get(device_sn)!);
                    this.cameraStationLivestreamTimeout.delete(device_sn);
                }
            }).catch((error) => {
                this.api.logError(`Station ${station.getSerial()} - Error:`, error);
            });
        }*/
    }

    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    private async onStationRawDevicePropertyChanged(deviceSerial: string, values: RawValues): Promise<void>
    {
        this.api.logDebug(`Event "RawDevicePropertyChanged": device: ${deviceSerial} | values: ${values}`);
        this.devices.updateDeviceProperties(deviceSerial, values);
    }

    /**
     * The action to be done when event LivestreamStart is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     * @param metadata The metadata.
     * @param videoStream The videoStream.
     * @param audioStream  The audioStream.
     */
    private async onStationLivestreamStart(station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable): Promise<void>
    {
        this.api.logDebug(`Event "LivestreamStart": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event LivestreamStop is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationLivestreamStop(station : Station, channel : number): Promise<void>
    {
        this.api.logDebug(`Event "LivestreamStop": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event LivestreamError is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationLivestreamError(station : Station, channel : number): Promise<void>
    {
        this.api.logDebug(`Event "LivestreamError": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event DownloadStart is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     * @param metadata The metadata.
     * @param videoStream The videoStream.
     * @param audioStream  The audioStream.
     */
    private async onStationDownloadStart(station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable): Promise<void>
    {
        this.api.logDebug(`Event "DownloadStart": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event DownloadFinish is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationDownloadFinish(station : Station, channel : number): Promise<void>
    {
        this.api.logDebug(`Event "DownloadFinish": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event StationResult is fired.
     * @param station The base as Station object.
     * @param command The result.
     */
    private async onStationCommandResult(station : Station, command : CommandResult): Promise<void>
    {
        this.api.logDebug(`Event "DownloadFinish": base: ${station.getSerial()} | result: ${command}`);
    }

    /**
     * The action to be done when event GuardMode is fired.
     * @param station The base as Station object.
     * @param guardMode The new guard mode as GuardMode.
     */
    private async onStationGuardMode(station : Station, guardMode : number): Promise<void>
    {
        if(this.skipNextModeChangeEvent[station.getSerial()] == true)
        {
            this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else
        {
            this.api.logDebug(`Event "GuardMode": base: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeBase(station.getSerial());
        }
    }

    /**
     * The action to be done when event CurrentMode is fired.
     * @param station The base as Station object.
     * @param guardMode The new guard mode as GuardMode.
     */
    private async onStationCurrentMode(station : Station, guardMode : number): Promise<void>
    {
        if(this.skipNextModeChangeEvent[station.getSerial()] == true)
        {
            this.api.logDebug("Event skipped due to locally forced changeCurrentMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else
        {
            this.api.logDebug(`Event "CurrentMode": base: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeBase(station.getSerial());
        }
    }

    /**
     * The action to be done when event RTSPLivestreamStart is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationRTSPLivestreamStart(station : Station, channel : number): Promise<void>
    {
        this.api.logDebug(`Event "RTSPLivestreamStart": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event RTSPLivestreamStop is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationRTSPLivestreamStop(station : Station, channel : number): Promise<void>
    {
        this.api.logDebug(`Event "RTSPLivestreamStop": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event RTSPURL is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationRTSPURL(station : Station, channel : number): Promise<void>
    {
        this.api.logDebug(`Event "RTSPURL": base: ${station.getSerial()} | channel: ${channel}`);
    }

    /**
     * The action to be done when event PropertyChanged is fired.
     * @param station The base as Station object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    private async onStationPropertyChanged(station : Station, name : string, value : PropertyValue): Promise<void>
    {
        if(name != "guardMode" && name != "currentMode")
        {
            this.api.logDebug(`Event "PropertyChanged": base: ${station.getSerial()} | name: ${name} | value: ${value}`);
        }
    }

    /**
     * The action to be done when event RawPropertyChanged is fired.
     * @param station The base as Station object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    private async onStationRawPropertyChanged(station : Station, type : number, value : string): Promise<void>
    {
        if(type != 1102 && type != 1137 && type != 1147 && type != 1151 && type != 1154 && type != 1162 && type != 1165 && type != 1224 && type != 1279 && type != 1281 && type != 1282 && type != 1283 && type != 1284 && type != 1285 && type != 1660 && type != 1664 && type != 1665)
        {
            this.api.logDebug(`Event "RawPropertyChanged": base: ${station.getSerial()} | type: ${type} | value: ${value}`);
        }
    }

    /**
     * The action to be done when event AlarmEvent is fired.
     * @param station The base as Station object.
     * @param alarmEvent The alarmEvent.
     */
    private async onStationAlarmEvent(station : Station, alarmEvent : AlarmEvent): Promise<void>
    {
        this.api.logDebug(`Event "AlarmEvent": base: ${station.getSerial()} | alarmEvent: ${alarmEvent}`);
    }

    /**
     * The action to be done when event StationRuntimeState is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     * @param batteryLevel The battery level as percentage value.
     * @param temperature The temperature as degree value.
     */
    private async onStationRuntimeState(station: Station, channel: number, batteryLevel: number, temperature: number): Promise<void>
    {
        this.api.logDebug(`Event "RuntimeState": base: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | temperature: ${temperature}`);
        this.devices.updateBatteryValues(station.getSerial(), channel, batteryLevel, temperature);
    }

    /**
     * The action to be done when event StationChargingState is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     * @param chargeType The current carge state.
     * @param batteryLevel The battery level as percentage value.
     */
    private async onStationChargingState(station: Station, channel: number, chargeType: number, batteryLevel: number): Promise<void>
    {
        this.api.logDebug(`Event "ChargingState": base: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | type: ${chargeType}`);
        this.devices.updateChargingState(station.getSerial(), channel, chargeType, batteryLevel);
    }

    /**
     * The action to be done when event StationWifiRssi is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     * @param rssi The current rssi value.
     */
    private async onStationWifiRssi(station: Station, channel: number, rssi: number): Promise<void>
    {
        this.api.logDebug(`Event "WifiRssi": base: ${station.getSerial()} | channel: ${channel} | rssi: ${rssi}`);
        this.devices.updateWifiRssi(station.getSerial(), channel, rssi);
    }

    /**
     * The action to be done when event FloodlightManualSwitch is fired.
     * @param station The base as Station object.
     * @param channel The channel to define the device.
     * @param enabled The value for the floodlight.
     */
    private async onStationFloodlightManualSwitch(station : Station, channel : number, enabled : boolean): Promise<void>
    {
        this.api.logDebug(`Event "FloodlightManualSwitch": base: ${station.getSerial()} | channel: ${channel} | enabled: ${enabled}`);
    }

    private async onStationAlarmDelayEvent(station : Station, alarmDelayEvent : AlarmEvent, alarmDelay : number): Promise<void>
    {
        this.api.logDebug(`Event "AlarmDelayEvent": base: ${station.getSerial()} | alarmDeleayEvent: ${alarmDelayEvent} | alarmDeleay: ${alarmDelay}`);
    }

    private async onStationTalkbackStarted(station: Station, channel: number, talkbackStream : TalkbackStream): Promise<void>
    {
        this.api.logDebug(`Event "TalkbackStarted": base: ${station.getSerial()} | channel: ${channel} | talkbackStream: ${talkbackStream}`);
    }

    private async onStationTalkbackStopped(station: Station, channel: number): Promise<void>
    {
        this.api.logDebug(`Event "TalkbackStopped": base: ${station.getSerial()} | channel: ${channel}`);
    }

    private async onStationTalkbackError(station: Station, channel: number, error : Error): Promise<void>
    {
        this.api.logDebug(`Event "TalkbackError": base: ${station.getSerial()} | channel: ${channel} | error: ${error}`);
    }

    private async onStationAlarmArmedEvent(station: Station): Promise<void>
    {
        this.api.logDebug(`Event "AlarmArmedEvent": base: ${station.getSerial()}`);
    }

    private async onStationAlarmArmDelayEvent(station: Station, alarmDelay: number): Promise<void>
    {
        this.api.logDebug(`Event "AlarmArmDelayEvent": base: ${station.getSerial()} | alarmDelay: ${alarmDelay}`);
    }
}