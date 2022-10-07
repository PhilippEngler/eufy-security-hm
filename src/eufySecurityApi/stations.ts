import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { EufySecurityEvents } from './interfaces';
import { HTTPApi, Hubs, Station, GuardMode, PropertyValue, RawValues, Device, StationListResponse, DeviceType, PropertyName, NotificationSwitchMode, CommandName, SmartSafe, Camera, InvalidPropertyError } from './http';
import { sleep } from './push/utils';
import { DeviceNotFoundError, NotSupportedError, ReadOnlyPropertyError, StationNotFoundError } from "./error";
import internal from "stream";
import { AlarmEvent, ChargingType, CommandResult, CommandType, P2PConnectionType, SmartSafeAlarm911Event, SmartSafeShakeAlarmEvent, StreamMetadata } from "./p2p";
import { TalkbackStream } from "./p2p/talkback";
import { parseValue } from "./utils";

/**
 * Represents all the stations in the account.
 */
export class Stations extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private serialNumbers : string[];
    private stations : { [stationSerial : string ] : Station } = {};
    private skipNextModeChangeEvent : { [stationSerial : string] : boolean } = {};
    private lastGuardModeChangeTimeForStations : { [stationSerial : string] : any } = {};

    private readonly P2P_REFRESH_INTERVAL_MIN = 720;

    private cameraMaxLivestreamSeconds = 30;
    private cameraStationLivestreamTimeout: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();
    private cameraCloudLivestreamTimeout: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

    private refreshEufySecurityP2PTimeout : {
        [dataType : string] : NodeJS.Timeout;
    } = {};

    /**
     * Create the Bases objects holding all stations in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];

        if(this.api.getApiUseUpdateStateEvent() == false)
        {
            this.api.logInfoBasic("Retrieving last guard mode change times disabled in settings.");
        }

        this.httpService.on("hubs", (hubs: Hubs) => this.handleHubs(hubs));
    }

    /**
     * Put all stations and their settings in format so that we can work with them.
     * @param hubs The object containing the stations.
     */
    private handleHubs(hubs: Hubs) : void
    {
        this.api.logDebug("Got hubs:", hubs);
        const resStations = hubs;

        var station : Station;
        const stationsSNs : string[] = Object.keys(this.stations);
        const newStationsSNs = Object.keys(hubs);

        for (var stationSerial in resStations)
        {
            if(this.stations[stationSerial])
            {
                this.updateStation(resStations[stationSerial]);
            }
            else
            {
                station = new Station(this.api, this.httpService, resStations[stationSerial]);
                this.skipNextModeChangeEvent[stationSerial] = false;
                this.lastGuardModeChangeTimeForStations[stationSerial] = undefined;
                this.serialNumbers.push(stationSerial);
                if(station.getDeviceType() == DeviceType.STATION)
                {
                    station.setConnectionType(this.api.getP2PConnectionType());
                }
                else
                {
                    station.setConnectionType(P2PConnectionType.QUICKEST);
                }
                station.connect();

                if(this.api.getApiUseUpdateStateEvent())
                {
                    this.addEventListener(station, "GuardModeChanged", false);
                    this.addEventListener(station, "CurrentMode", false);
                    this.addEventListener(station, "PropertyChanged", false);
                    this.addEventListener(station, "RawPropertyChanged", false);
                    this.setLastGuardModeChangeTimeFromCloud(stationSerial);
                }

                this.addEventListener(station, "Connect", false);
                this.addEventListener(station, "ConnectionError", false);
                this.addEventListener(station, "Close", false);
                this.addEventListener(station, "RawDevicePropertyChanged", false);
                this.addEventListener(station, "LivestreamStart", false);
                this.addEventListener(station, "LivestreamStop", false);
                this.addEventListener(station, "LivestreamError", false);
                this.addEventListener(station, "DownloadStart", false);
                this.addEventListener(station, "DownloadFinish", false);
                this.addEventListener(station, "CommandResult", false);
                this.addEventListener(station, "RTSPLivestreamStart", false);
                this.addEventListener(station, "RTSPLivestreamStop", false);
                this.addEventListener(station, "RTSPUrl", false);
                this.addEventListener(station, "AlarmEvent", false);
                this.addEventListener(station, "RuntimeState", false);
                this.addEventListener(station, "ChargingState", false);
                this.addEventListener(station, "WifiRssi", false);
                this.addEventListener(station, "FloodlightManualSwitch", false);
                this.addEventListener(station, "AlarmDelayEvent", false);
                this.addEventListener(station, "TalkbackStarted", false);
                this.addEventListener(station, "TalkbackStopped", false);
                this.addEventListener(station, "TalkbackError", false);
                this.addEventListener(station, "AlarmArmedEvent", false);
                this.addEventListener(station, "AlarmArmDelayEvent", false);
                this.addEventListener(station, "SecondaryCommandResult", false);
                this.addEventListener(station, "DeviceShakeAlarm", false);
                this.addEventListener(station, "Device911Alarm", false);
                this.addEventListener(station, "DeviceJammed", false);
                this.addEventListener(station, "DeviceLowBattery", false);
                this.addEventListener(station, "DeviceWrongTryProtectAlarm", false);

                this.addStation(station);
            }
        }
        
        for (const stationSN of stationsSNs)
        {
            if (!newStationsSNs.includes(stationSN))
            {
                this.removeStation(this.getStation(stationSN));
            }
        }

        this.saveStationsSettings();
    }

    /**
     * Add the given station for using.
     * @param station The station object to add.
     */
    private addStation(station : Station) : void
    {
        const serial = station.getSerial();
        if (serial && !Object.keys(this.stations).includes(serial))
        {
            this.stations[serial] = station;
            this.emit("station added", station);
        }
        else
        {
            this.api.logDebug(`Station with this serial ${station.getSerial()} exists already and couldn't be added again!`);
        }
    }

    /**
     * Remove the given station.
     * @param station The station object to remove.
     */
    private removeStation(station : Station) : void
    {
        const serial = station.getSerial();
        if (serial && Object.keys(this.stations).includes(serial))
        {
            delete this.stations[serial];
            station.removeAllListeners();
            if (station.isConnected())
            {
                station.close();
            }
            this.emit("station removed", station);
        }
        else
        {
            this.api.logDebug(`Station with this serial ${station.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }

    /**
     * Update the station information.
     * @param hub The object containg the specific hub.
     */
    private updateStation(hub : StationListResponse) : void
    {
        if (Object.keys(this.stations).includes(hub.station_sn))
        {
            this.stations[hub.station_sn].update(hub, this.stations[hub.station_sn] !== undefined && this.stations[hub.station_sn].isConnected());
            if (!this.stations[hub.station_sn].isConnected() && !this.stations[hub.station_sn].isEnergySavingDevice())
            {
                if(this.stations[hub.station_sn].getDeviceType() == DeviceType.STATION)
                {
                    this.stations[hub.station_sn].setConnectionType(this.api.getP2PConnectionType());
                }
                else
                {
                    this.stations[hub.station_sn].setConnectionType(P2PConnectionType.QUICKEST);
                }
                this.stations[hub.station_sn].connect();
            }
        }
        else
        {
            this.api.logError(`Station with this serial ${hub.station_sn} doesn't exists and couldn't be updated!`);
        }
    }

    /**
     * (Re)Loads all stations and the settings of them.
     */
    public async loadStations() : Promise<void>
    {
        try
        {
            this.handleHubs(this.httpService.getHubs());
        }
        catch (e : any)
        {
            this.stations = {};
            throw new Error(e);
        }
    }

    /**
     * Close all Livestreams.
     */
    public async close() : Promise<void>
    {
        for (const device_sn of this.cameraStationLivestreamTimeout.keys())
        {
            this.stopStationLivestream(device_sn);
        }
        for (const device_sn of this.cameraCloudLivestreamTimeout.keys())
        {
            this.stopCloudLivestream(device_sn);
        }

        await this.closeP2PConnections();
    }

    /**
     * Close all P2P connection for all stations.
     */
    public async closeP2PConnections() : Promise<void>
    {
        if(this.stations != null)
        {
            for (var stationSerial in this.stations)
            {
                if(this.stations[stationSerial])
                {
                    await this.stations[stationSerial].close();
                    
                    this.removeEventListener(this.stations[stationSerial], "GuardModeChanged");
                    this.removeEventListener(this.stations[stationSerial], "CurrentMode");
                    this.removeEventListener(this.stations[stationSerial], "PropertyChanged");
                    this.removeEventListener(this.stations[stationSerial], "RawPropertyChanged");
                    this.removeEventListener(this.stations[stationSerial], "Connect");
                    this.removeEventListener(this.stations[stationSerial], "ConnectionError");
                    this.removeEventListener(this.stations[stationSerial], "Close");
                    this.removeEventListener(this.stations[stationSerial], "RawDevicePropertyChanged");
                    this.removeEventListener(this.stations[stationSerial], "LivestreamStart");
                    this.removeEventListener(this.stations[stationSerial], "LivestreamStop");
                    this.removeEventListener(this.stations[stationSerial], "LivestreamError");
                    this.removeEventListener(this.stations[stationSerial], "DownloadStart");
                    this.removeEventListener(this.stations[stationSerial], "DownloadFinish");
                    this.removeEventListener(this.stations[stationSerial], "CommandResult");
                    this.removeEventListener(this.stations[stationSerial], "RTSPLivestreamStart");
                    this.removeEventListener(this.stations[stationSerial], "RTSPLivestreamStop");
                    this.removeEventListener(this.stations[stationSerial], "RTSPUrl");
                    this.removeEventListener(this.stations[stationSerial], "AlarmEvent");
                    this.removeEventListener(this.stations[stationSerial], "RuntimeState");
                    this.removeEventListener(this.stations[stationSerial], "ChargingState");
                    this.removeEventListener(this.stations[stationSerial], "WifiRssi");
                    this.removeEventListener(this.stations[stationSerial], "FloodlightManualSwitch");
                    this.removeEventListener(this.stations[stationSerial], "AlarmDelayEvent");
                    this.removeEventListener(this.stations[stationSerial], "TalkbackStarted");
                    this.removeEventListener(this.stations[stationSerial], "TalkbackStopped");
                    this.removeEventListener(this.stations[stationSerial], "TalkbackError");
                    this.removeEventListener(this.stations[stationSerial], "AlarmArmedEvent");
                    this.removeEventListener(this.stations[stationSerial], "AlarmArmDelayEvent");
                    this.removeEventListener(this.stations[stationSerial], "SecondaryCommandResult");
                    this.removeEventListener(this.stations[stationSerial], "DeviceShakeAlarm");
                    this.removeEventListener(this.stations[stationSerial], "Device911Alarm");
                    this.removeEventListener(this.stations[stationSerial], "DeviceJammed");
                    this.removeEventListener(this.stations[stationSerial], "DeviceLowBattery");
                    this.removeEventListener(this.stations[stationSerial], "DeviceWrongTryProtectAlarm");

                    clearTimeout(this.refreshEufySecurityP2PTimeout[stationSerial]);
                    delete this.refreshEufySecurityP2PTimeout[stationSerial];
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
        Object.values(this.stations).forEach(async (station: Station) => {
            if (station.isConnected() && station.getDeviceType() !== DeviceType.DOORBELL)
            {
                await station.getCameraInfo().catch(error => {
                    this.api.logError(`Error occured at updateDeviceData while station ${station.getSerial()} p2p data refreshing.`, error);
                });
            }
        });
    }

    /**
     * Set the maximum livestream duration.
     * @param seconds The maximum duration in secons.
     */
    public setCameraMaxLivestreamDuration(seconds : number) : void
    {
        this.cameraMaxLivestreamSeconds = seconds;
    }

    /**
     * Get the maximum livestream duration.
     */
    public getCameraMaxLivestreamDuration() : number
    {
        return this.cameraMaxLivestreamSeconds;
    }

    /**
     * Start the livestream from station for a given device.
     * @param deviceSerial The serial of the device.
     */
    public async startStationLivestream(deviceSerial : string) : Promise<void>
    {
        const device = await this.api.getDevice(deviceSerial);
        const station = this.getStation(device.getStationSerial());

        if(!device.hasCommand(CommandName.DeviceStartLivestream))
        {
            throw new NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }

        const camera = device as Camera;
        if(!station.isLiveStreaming(camera))
        {
            station.startLivestream(camera);

            this.cameraStationLivestreamTimeout.set(deviceSerial, setTimeout(() => {
                this.api.logInfo(`Stopping the station stream for the device ${deviceSerial}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                this.stopStationLivestream(deviceSerial);
            }, this.cameraMaxLivestreamSeconds * 1000));
        }
        else
        {
            this.api.logWarn(`The station stream for the device ${deviceSerial} cannot be started, because it is already streaming!`);
        }
    }

    /**
     * Start the livestream from cloud for a given device.
     * @param deviceSerial The serial of the device.
     */
    public async startCloudLivestream(deviceSerial : string) : Promise<void>
    {
        const device = await this.api.getDevice(deviceSerial);
        const station = this.getStation(device.getStationSerial());

        if(!device.hasCommand(CommandName.DeviceStartLivestream))
        {
            throw new NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }

        const camera = device as Camera;
        if(!camera.isStreaming())
        {
            const url = await camera.startStream();
            if (url !== "") {
                this.cameraCloudLivestreamTimeout.set(deviceSerial, setTimeout(() => {
                    this.api.logInfo(`Stopping the station stream for the device ${deviceSerial}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                    this.stopCloudLivestream(deviceSerial);
                }, this.cameraMaxLivestreamSeconds * 1000));
                this.emit("cloud livestream start", station, camera, url);
            }
            else
            {
                this.api.logError(`Failed to start cloud stream for the device ${deviceSerial}`);
            }
        }
        else
        {
            this.api.logWarn(`The cloud stream for the device ${deviceSerial} cannot be started, because it is already streaming!`);
        }
    }

    /**
     * Stop the livestream from station for a given device.
     * @param deviceSerial The serial of the device.
     */
    public async stopStationLivestream(deviceSerial : string) : Promise<void>
    {
        const device = await this.api.getDevice(deviceSerial);
        const station = this.getStation(device.getStationSerial());

        if(!device.hasCommand(CommandName.DeviceStopLivestream))
        {
            throw new NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }

        if(station.isConnected() && station.isLiveStreaming(device))
        {
            await station.stopLivestream(device);
        }
        else
        {
            this.api.logWarn(`The station stream for the device ${deviceSerial} cannot be stopped, because it isn't streaming!`);
        }

        const timeout = this.cameraStationLivestreamTimeout.get(deviceSerial);
        if(timeout) {
            clearTimeout(timeout);
            this.cameraStationLivestreamTimeout.delete(deviceSerial);
        }
    }

    /**
     * Stop the livestream from cloud for a given device.
     * @param deviceSerial The serial of the device.
     */
    public async stopCloudLivestream(deviceSerial: string): Promise<void> {
        const device = await this.api.getDevice(deviceSerial);
        const station = this.getStation(device.getStationSerial());

        if(!device.hasCommand(CommandName.DeviceStopLivestream))
        {
            throw new NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }

        const camera = device as Camera;
        if(camera.isStreaming())
        {
            await camera.stopStream();
            this.emit("cloud livestream stop", station, camera);
        }
        else
        {
            this.api.logWarn(`The cloud stream for the device ${deviceSerial} cannot be stopped, because it isn't streaming!`);
        }

        const timeout = this.cameraCloudLivestreamTimeout.get(deviceSerial);
        if(timeout)
        {
            clearTimeout(timeout);
            this.cameraCloudLivestreamTimeout.delete(deviceSerial);
        }
    }

    /**
     * Save the relevant settings (mainly for P2P-Connection) to the config
     */
    public async saveStationsSettings() : Promise<void>
    {
        await this.api.saveStationsSettings(this.stations, this.serialNumbers);
    }

    /**
     * Returns a Array of all stations.
     */
    public getStations() : { [stationSerial : string] : Station}
    {
        return this.stations;
    }

    /**
     * Returns the serial object specified by the station serial.
     * @param stationSerial The serial of the station to retrive.
     * @returns The station object.
     */
    public getStation(stationSerial : string) : Station
    {
        if (Object.keys(this.stations).includes(stationSerial))
        {
            return this.stations[stationSerial];
        }
        throw new StationNotFoundError(`No station with serial number: ${stationSerial}!`);
    }

    /**
     * Checks if a station with the given serial exists.
     * @param stationSerial The stationSerial of the station to check.
     * @returns True if station exists, otherwise false.
     */
    public existStation(stationSerial : string) : boolean
    {
        var res = this.stations[stationSerial];
        if(res)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Get the guard mode for all stations.
     */
    public getGuardMode() : { [stationSerial : string ] : Station}
    {
        return this.getStations();
    }

    /**
     * Set the guard mode of all stations to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode : GuardMode) : Promise<boolean>
    {
        var err = 0;
        for (var stationSerial in this.stations)
        {
            if (await this.setGuardModeStation(stationSerial, guardMode) == false)
            {
                err = err + 1;
            }
        }
        if (err == 0)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the guard mode for the given station to the given mode.
     * @param stationSerial The serial of the station the mode to change.
     * @param guardMode The target guard mode.
     */
    public async setGuardModeStation(stationSerial : string, guardMode : GuardMode) : Promise<boolean>
    {
        if (this.stations[stationSerial].getGuardMode() === guardMode)
        {
            return true;
        }
        else
        {
            var res : boolean;
            res = await this.waitForGuardModeEvent(this.stations[stationSerial], guardMode, 10000).then(() => {
                return true;
            }, () => {
                return false;
            });
            if(res == true)
            {
                this.setLastGuardModeChangeTimeNow(stationSerial);
                this.api.updateStationGuardModeSystemVariable(stationSerial, guardMode);
            }
            return res;
        }
    }

    /**
     * Wait for the GuardModeEvent after changing guardMode for a given base.
     * @param station The sation for waiting for the GuardModeChanged event.
     * @param guardMode The guard mode to set.
     * @param timeout The timespan in ms maximal to wait for the event.
     * @returns Returns true or false.
     */
    private async waitForGuardModeEvent(station : Station, guardMode : number, timeout : number) : Promise<boolean>
    {
        return new Promise<boolean>(async (resolve, reject) => {
            var timer : NodeJS.Timeout;
            var funcListener = () => listener();

            function listener() {
                station.removeListener("guard mode", funcListener);
                clearTimeout(timer);
                resolve(true);
            }

            station.addListener("guard mode", funcListener);
            timer = setTimeout(() => {
                station.removeListener("guard mode", funcListener);
                reject(false);
            }, timeout);
            await this.setStationProperty(station.getSerial(), PropertyName.StationGuardMode, guardMode);
        });
    }

    /**
     * Retrieve the model name of a given station.
     * @param station The station object.
     * @returns A string with the model name of the device.
     */
    getStationModelName(station : Station) : string
    {
        switch (station.getModel().substring(0,5))
        {
            //HomeBases
            case "T8001":
                return "HomeBase";
            case "T8002":
                return "HomeBase E";
            case "T8010":
                return "HomeBase 2";
            case "T8030":
                return "HomeBase 3";
            //SoloDevices
            //IndoorCams
            case "T8400":
                return "IndoorCam C24";
            case "T8401":
                return "IndoorCam C22";
            case "T8410":
                return "IndoorCam P24";
            case "T8411":
                return "IndoorCam P22";
            case "T8414":
                return "IndoorCam Mini 2k";
            //SoloCams
            case "T8122":
                return "SoloCam L20";
            case "T8123":
                return "SoloCam L40";
            case "T8424":
                return "SoloCam S40";
            case "T8130":
                return "SoloCam E20";
            case "T8131":
                return "SoloCam E40";
            case "T8150":
                return "4G Starlight Camera";
            //Doorbels
            //Floodlight
            case "T8420":
                return "FloodlightCam 1080p";
            case "T8422":
                return "FloodlightCam E 2k";
            case "T8423":
                return "FloodlightCam 2 Pro";
            case "T8424":
                return "FloodlightCam 2k";
            //Lock
            case "T8500":
                return "Smart Lock Front Door";
            case "T8501":
                return "Solo Smart Lock D20";
            case "T8503":
                return "Smart Lock R10";
            case "T8503":
                return "Smart Lock R20";
            case "T8519":
                return "Smart Lock Touch";
            case "T8520":
                return "Smart Lock Touch und Wi-Fi";
            case "T8530":
                return "Video Smart Lock"
            //Bridges
            case "T8021":
                return "Wi-Fi Bridge und Doorbell Chime";
            case "T8592":
                return "Keypad";
            default:
                return "unbekannte Station";
        }
    }

    /**
     * Add a given event listener for a given station.
     * @param station The station as Station object.
     * @param eventListenerName The event listener name as string.
     * @param delayed false if add instantly, for a 5s delay set true. 
     */
    public async addEventListener(station : Station, eventListenerName : string, delayed : boolean) : Promise<void>
    {
        if(delayed == true)
        {
            await sleep(5000);
        }
        switch (eventListenerName)
        {
            case "Connect":
                station.on("connect", (station : Station) => this.onStationConnect(station));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("connect")} Listener.`);
                break;
            case "ConnectionError":
                station.on("connection error", (station : Station, error : Error) => this.onStationConnectionError(station, error));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("connection error")} Listeners.`);
            case "Close":
                station.on("close", (station : Station) => this.onStationClose(station));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                station.on("raw device property changed", (deviceSerial: string, params: RawValues) => this.onStationRawDevicePropertyChanged(deviceSerial, params));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                station.on("livestream start", (station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable) => this.onStationLivestreamStart(station, channel, metadata, videoStream, audioStream));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                station.on("livestream stop", (station : Station, channel : number) => this.onStationLivestreamStop(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                station.on("livestream error", (station : Station, channel : number) => this.onStationLivestreamError(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                station.on("download start", (station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable) => this.onStationDownloadStart(station, channel, metadata, videoStream, audioStream));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                station.on("download finish", (station : Station, channel : number) => this.onStationDownloadFinish(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                station.on("command result", (station : Station, result : CommandResult) => this.onStationCommandResult(station, result));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("command result")} Listener.`);
                break;
            case "GuardModeChanged":
                station.on("guard mode", (station : Station, guardMode : number) => this.onStationGuardMode(station, guardMode));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                station.on("current mode", (station : Station, guardMode : number) => this.onStationCurrentMode(station, guardMode));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                station.on("rtsp livestream start", (station : Station, channel : number) => this.onStationRTSPLivestreamStart(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                station.on("rtsp livestream stop", (station : Station, channel : number) => this.onStationRTSPLivestreamStop(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                station.on("rtsp url", (station : Station, channel : number, value: string) => this.onStationRTSPURL(station, channel, value));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                station.on("property changed", (station : Station, name : string, value : PropertyValue) => this.onStationPropertyChanged(station, name, value));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                station.on("raw property changed", (station : Station, type : number, value : string) => this.onStationRawPropertyChanged(station, type, value));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                station.on("alarm event", (station : Station, alarmEvent : AlarmEvent) => this.onStationAlarmEvent(station, alarmEvent));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                station.on("runtime state", (station: Station, channel: number, batteryLevel: number, temperature: number) => this.onStationRuntimeState(station, channel, batteryLevel, temperature));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                station.on("charging state", (station: Station, channel: number, chargeType: number, batteryLevel: number) => this.onStationChargingState(station, channel, chargeType, batteryLevel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                station.on("wifi rssi", (station: Station, channel: number, rssi: number) => this.onStationWifiRssi(station, channel, rssi));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                station.on("floodlight manual switch", (station: Station, channel: number, enabled : boolean) => this.onStationFloodlightManualSwitch(station, channel, enabled));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                station.on("alarm delay event", (station: Station, alarmDelayEvent: AlarmEvent, alarmDelay : number) => this.onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                station.on("talkback started", (station: Station, channel: number, talkbackStream : TalkbackStream) => this.onStationTalkbackStarted(station, channel, talkbackStream));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                station.on("talkback stopped", (station: Station, channel: number) => this.onStationTalkbackStopped(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback stopped")} Listener.`);
                break;
            case "TalkbackError":
                station.on("talkback error", (station: Station, channel: number, error : Error) => this.onStationTalkbackError(station, channel, error));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                station.on("alarm armed event", (station: Station) => this.onStationAlarmArmedEvent(station));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                station.on("alarm arm delay event", (station: Station, alarmDelay: number) => this.onStationArmDelayEvent(station, alarmDelay));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm arm delay event")} Listener.`);
                break;
            case "SecondaryCommandResult":
                station.on("secondary command result", (station: Station, result: CommandResult) => this.onStationSecondaryCommandResult(station, result));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("secondary command result")} Listener.`);
                break;
            case "DeviceShakeAlarm":
                station.on("device shake alarm", (deviceSerial: string, event: SmartSafeShakeAlarmEvent) => this.onStationDeviceShakeAlarm(deviceSerial, event));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device shake alarm")} Listener.`);
                break;
            case "Device911Alarm":
                station.on("device 911 alarm", (deviceSerial: string, event: SmartSafeAlarm911Event) => this.onStationDevice911Alarm(deviceSerial, event));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device 911 alarm")} Listener.`);
                break;
            case "DeviceJammed":
                station.on("device jammed", (deviceSerial: string) => this.onStationDeviceJammed(deviceSerial));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device jammed")} Listener.`);
                break;
            case "DeviceLowBattery":
                station.on("device low battery", (deviceSerial: string) => this.onStationDeviceLowBattery(deviceSerial));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device low battery")} Listener.`);
                break;
            case "DeviceWrongTryProtectAlarm":
                station.on("device wrong try-protect alarm", (deviceSerial: string) => this.onStationDeviceWrongTryProtectAlarm(deviceSerial));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device wrong try-protect alarm")} Listener.`);
                break;
            default:
                this.api.logInfo(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown.`);
                break;
        }
    }

    /**
     * Remove all event listeners for a given event type for a given station.
     * @param station The station as Station object.
     * @param eventListenerName The event listener name as string.
     */
    public removeEventListener(station : Station, eventListenerName : string) : void
    {
        switch (eventListenerName)
        {
            case "Connect":
                station.removeAllListeners("connect");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("connect")} Listener.`);
                break;
            case "ConnectionError":
                station.removeAllListeners("connection error");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("connection error")} Listener.`);
                break;
            case "Close":
                station.removeAllListeners("close");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                station.removeAllListeners("raw device property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                station.removeAllListeners("livestream start");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                station.removeAllListeners("livestream stop");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                station.removeAllListeners("livestream error");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                station.removeAllListeners("download start");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                station.removeAllListeners("download finish");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                station.removeAllListeners("command result");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("command result")} Listener.`);
                break;
            case "GuardModeChanged":
                station.removeAllListeners("guard mode");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                station.removeAllListeners("current mode");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                station.removeAllListeners("rtsp livestream start");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                station.removeAllListeners("rtsp livestream stop");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                station.removeAllListeners("rtsp url");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                station.removeAllListeners("property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                station.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                station.removeAllListeners("alarm event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                station.removeAllListeners("runtime state");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                station.removeAllListeners("charging state");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                station.removeAllListeners("wifi rssi");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                station.removeAllListeners("floodlight manual switch");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                station.removeAllListeners("alarm delay event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                station.removeAllListeners("talkback started");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                station.removeAllListeners("talkback stopped");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback stopped")} Listener.`);
                break;
            case "TalkbackError":
                station.removeAllListeners("talkback error");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                station.removeAllListeners("alarm armed event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                station.removeAllListeners("alarm arm delay event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm arm delay event")} Listener.`);
                break;
            case "SecondaryCommandResult":
                station.removeAllListeners("secondary command result");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("secondary command result")} Listener.`);
                break;
            case "DeviceShakeAlarm":
                station.removeAllListeners("device shake alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device shake alarm")} Listener.`);
                break;
            case "Device911Alarm":
                station.removeAllListeners("device 911 alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device 911 alarm")} Listener.`);
                break;
            case "DeviceJammed":
                station.removeAllListeners("device jammed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device jammed")} Listener.`);
                break;
            case "DeviceLowBattery":
                station.removeAllListeners("device low battery");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device low battery")} Listener.`);
                break;
            case "DeviceWrongTryProtectAlarm":
                station.removeAllListeners("device wrong try-protect alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device wrong try-protect alarm")} Listener.`);
                break;
            default:
                this.api.logInfo(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown.`);
                break;
        }
    }

    /**
     * Returns the number of attached listeners for a given station and a given event.
     * @param station The station the number of attached listners to count.
     * @param eventListenerName The name of the event the attached listeners to count.
     */
    public countEventListener(station : Station, eventListenerName : string) : number
    {
        switch (eventListenerName)
        {
            case "Connect":
                return station.listenerCount("connect");
            case "ConnectionError":
                return station.listenerCount("connection error");
            case "Close":
                return station.listenerCount("close");
            case "RawDevicePropertyChanged":
                return station.listenerCount("raw device property changed");
            case "LivestreamStart":
                return station.listenerCount("livestream start");
            case "LivestreamStop":
                return station.listenerCount("livestream stop");
            case "LivestreamError":
                return station.listenerCount("livestream error");
            case "DownloadStart":
                return station.listenerCount("download start");
            case "DownloadFinish":
                return station.listenerCount("download finish");
            case "CommandResult":
                return station.listenerCount("command result");
            case "GuardMode":
                return station.listenerCount("guard mode");
            case "CurrentMode":
                return station.listenerCount("current mode");
            case "RTSPLivestreamStart":
                return station.listenerCount("rtsp livestream start");
            case "RTSPLivestreamStop":
                return station.listenerCount("rtsp livestream stop");
            case "RTSPUrl":
                return station.listenerCount("rtsp url");
            case "PropertyChanged":
                return station.listenerCount("property changed");
            case "RawPropertyChanged":
                return station.listenerCount("raw property changed");
            case "AlarmEvent":
                return station.listenerCount("alarm event");
            case "RuntimeState":
                return station.listenerCount("runtime state");
            case "ChargingState":
                return station.listenerCount("charging state");
            case "WifiRssi":
                return station.listenerCount("wifi rssi");
            case "FloodlightManualSwitch":
                return station.listenerCount("floodlight manual switch");
            case "AlarmDelayEvent":
                return station.listenerCount("alarm delay event");
            case "TalkbackStarted":
                return station.listenerCount("talkback started");
            case "TalkbackStopped":
                return station.listenerCount("talkback stopped");
            case "TalkbackError":
                return station.listenerCount("talkback error");
            case "AlarmArmedEvent":
                return station.listenerCount("alarm armed event");
            case "AlarmArmDelayEvent":
                return station.listenerCount("alarm arm delay event");
            case "SecondaryCommandResult":
                return station.listenerCount("secondary command result");
            case "DeviceShakeAlarm":
                return station.listenerCount("device shake alarm");
            case "Device911Alarm":
                return station.listenerCount("device 911 alarm");
            case "DeviceJammed":
                return station.listenerCount("device jammed");
            case "DeviceLowBattery":
                return station.listenerCount("device low battery");
            case "DeviceWrongTryProtectAlarm":
                return station.listenerCount("device wrong try-protect alarm");
        }
        return -1;
    }

    /**
     * The action to be done when event Connect is fired.
     * @param station The station as Station object.
     */
    private async onStationConnect(station : Station) : Promise<void>
    {
        this.api.logDebug(`Event "Connect": station: ${station.getSerial()}`);
        this.emit("station connect", station);
        if ((Device.isCamera(station.getDeviceType()) && !Device.isWiredDoorbell(station.getDeviceType()) || Device.isSmartSafe(station.getDeviceType())))
        {
            station.getCameraInfo().catch(error => {
                this.api.logError(`Error during station ${station.getSerial()} p2p data refreshing`, error);
            });
            if (this.refreshEufySecurityP2PTimeout[station.getSerial()] !== undefined)
            {
                clearTimeout(this.refreshEufySecurityP2PTimeout[station.getSerial()]);
                delete this.refreshEufySecurityP2PTimeout[station.getSerial()];
            }
            if (!station.isEnergySavingDevice())
            {
                this.refreshEufySecurityP2PTimeout[station.getSerial()] = setTimeout(() => {
                    station.getCameraInfo().catch(error => {
                        this.api.logError(`Error during station ${station.getSerial()} p2p data refreshing`, error);
                    });
                }, this.P2P_REFRESH_INTERVAL_MIN * 60 * 1000);
            }
        }
    }

    /**
     * The action to be done when event Connection Error is fired.
     * @param station The station as Station object.
     * @param error Ther error occured.
     */
    private onStationConnectionError(station : Station, error : Error) : void
    {
        this.api.logDebug(`Event "ConnectionError": station: ${station.getSerial()}`);
        this.emit("station connection error", station, error);
    }

    /**
     * The action to be done when event Close is fired.
     * @param station The station as Station object.
     */
    private async onStationClose(station : Station) : Promise<void>
    {
        this.api.logInfo(`Event "Close": station: ${station.getSerial()}`);
        //this.emit("station close", station);

        if(this.api.getServiceState() != "shutdown")
        {
            
        }
        for (const device_sn of this.cameraStationLivestreamTimeout.keys())
        {
            this.api.getDevice(device_sn).then((device: Device) => {
                if (device !== null && device.getStationSerial() === station.getSerial())
                {
                    clearTimeout(this.cameraStationLivestreamTimeout.get(device_sn)!);
                    this.cameraStationLivestreamTimeout.delete(device_sn);
                }
            }).catch((error) => {
                this.api.logError(`Station ${station.getSerial()} - Error:`, error);
            });
        }
    }

    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    private async onStationRawDevicePropertyChanged(deviceSerial : string, values : RawValues) : Promise<void>
    {
        this.api.logDebug(`Event "RawDevicePropertyChanged": device: ${deviceSerial} | values: ${values}`);
        this.api.updateDeviceProperties(deviceSerial, values);
    }

    /**
     * The action to be done when event LivestreamStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param metadata The metadata.
     * @param videoStream The videoStream.
     * @param audioStream  The audioStream.
     */
    private async onStationLivestreamStart(station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable) : Promise<void>
    {
        this.api.logDebug(`Event "LivestreamStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station livestream start", station, device, metadata, videoStream, audioStream);
        }).catch((error) => {
            this.api.logError(`Station start livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event LivestreamStop is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationLivestreamStop(station : Station, channel : number) : Promise<void>
    {
        this.api.logDebug(`Event "LivestreamStop": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station livestream stop", station, device);
        }).catch((error) => {
            this.api.logError(`Station stop livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event LivestreamError is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationLivestreamError(station : Station, channel : number) : Promise<void>
    {
        this.api.logDebug(`Event "LivestreamError": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            station.stopLivestream(device);
        }).catch((error) => {
            this.api.logError(`Station livestream error (station: ${station.getSerial()} channel: ${channel} error: ${error}})`, error);
        });
    }

    /**
     * The action to be done when event DownloadStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param metadata The metadata.
     * @param videoStream The videoStream.
     * @param audioStream  The audioStream.
     */
    private async onStationDownloadStart(station : Station, channel : number, metadata : StreamMetadata, videoStream : internal.Readable, audioStream : internal.Readable) : Promise<void>
    {
        this.api.logDebug(`Event "DownloadStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station download start", station, device, metadata, videoStream, audioStream);
        }).catch((error) => {
            this.api.logError(`Station start download error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event DownloadFinish is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationDownloadFinish(station : Station, channel : number) : Promise<void>
    {
        this.api.logDebug(`Event "DownloadFinish": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station download finish", station, device);
        }).catch((error) => {
            this.api.logError(`Station finish download error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event StationCommandResult is fired.
     * @param station The station as Station object.
     * @param result The result.
     */
    private async onStationCommandResult(station : Station, result : CommandResult) : Promise<void>
    {
        this.api.logDebug(`Event "CommandResult": station: ${station.getSerial()} | result: ${result}`);
        if (result.return_code === 0) {
            this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device: Device) => {
                //TODO: Finish SmartSafe implementation - check better the if below
                if ((result.customData !== undefined && result.customData.property !== undefined && !device.isLock()) || (result.customData !== undefined && result.customData.property !== undefined && device.isSmartSafe() && result.command_type !== CommandType.CMD_SMARTSAFE_SETTINGS))
                {
                    if (device.hasProperty(result.customData.property.name))
                    {
                        device.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                    else if (station.hasProperty(result.customData.property.name))
                    {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else if (result.customData !== undefined && result.customData.command !== undefined && result.customData.command.name === CommandName.DeviceSnooze)
                {
                    const snoozeTime = result.customData.command.value !== undefined && result.customData.command.value.snooze_time !== undefined ? result.customData.command.value.snooze_time as number : 0;
                    if (snoozeTime > 0)
                    {
                        device.updateProperty(PropertyName.DeviceSnooze, true);
                        device.updateProperty(PropertyName.DeviceSnoozeTime, snoozeTime);
                    }
                    this.httpService.refreshAllData().then(() => {
                        const snoozeStartTime = device.getPropertyValue(PropertyName.DeviceHiddenSnoozeStartTime) as number;
                        const currentTime = Math.trunc(new Date().getTime() / 1000);
                        let timeoutMS;
                        if (snoozeStartTime !== undefined && snoozeStartTime !== 0)
                        {
                            timeoutMS = (snoozeStartTime + snoozeTime - currentTime) * 1000;
                        }
                        else
                        {
                            timeoutMS = snoozeTime * 1000;
                        }
                        this.api.setDeviceSnooze(device, timeoutMS);
                    }).catch(error => {
                        this.api.logError("Error during API data refreshing", error);
                    });
                }
            }).catch((error) => {
                if (error instanceof DeviceNotFoundError)
                {
                    if (result.customData !== undefined && result.customData.property !== undefined)
                    {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else
                {
                    this.api.logError(`Station command result error (station: ${station.getSerial()})`, error);
                }
            });
            if (station.isIntegratedDevice() && result.command_type === CommandType.CMD_SET_ARMING && station.isConnected() && station.getDeviceType() !== DeviceType.DOORBELL)
            {
                this.api.logInfo(`Event "CommandResult": station: ${station.getSerial()} | result.customData: ${result.customData}`);
                station.getCameraInfo();
            }
        }
    }

    /**
     * The action to be done when event SecondaryCommandResult is fired.
     * @param station The station as Station object.
     * @param result The result.
     */
    private onStationSecondaryCommandResult(station : Station, result : CommandResult) : void
    {
        this.api.logDebug(`Event "SecondaryCommandResult": station: ${station.getSerial()} | result: ${result}`);
        if (result.return_code === 0)
        {
            this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device: Device) => {
                if (result.customData !== undefined && result.customData.property !== undefined)
                {
                    if (device.hasProperty(result.customData.property.name))
                    {
                        device.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                    else if (station.hasProperty(result.customData.property.name))
                    {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
            }).catch((error) => {
                if (error instanceof DeviceNotFoundError)
                {
                    if (result.customData !== undefined && result.customData.property !== undefined)
                    {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else
                {
                    this.api.logError(`Station secondary command result error (station: ${station.getSerial()})`, error);
                }
            });
        }
    }

    /**
     * The action to be done when event GuardMode is fired.
     * @param station The station as Station object.
     * @param guardMode The new guard mode as GuardMode.
     */
    private async onStationGuardMode(station : Station, guardMode : number) : Promise<void>
    {
        this.setLastGuardModeChangeTimeNow(station.getSerial());
        this.api.updateStationGuardModeSystemVariable(station.getSerial(), guardMode);
        if(this.skipNextModeChangeEvent[station.getSerial()] == true)
        {
            this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else
        {
            this.api.logDebug(`Event "GuardMode": station: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeStation(station.getSerial());
        }
    }

    /**
     * The action to be done when event CurrentMode is fired.
     * @param station The station as Station object.
     * @param guardMode The new guard mode as GuardMode.
     */
    private async onStationCurrentMode(station : Station, guardMode : number) : Promise<void>
    {
        if(this.skipNextModeChangeEvent[station.getSerial()] == true)
        {
            this.api.logDebug("Event skipped due to locally forced changeCurrentMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else
        {
            this.api.logDebug(`Event "CurrentMode": station: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeStation(station.getSerial());
        }
    }

    /**
     * The action to be done when event RTSPLivestreamStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationRTSPLivestreamStart(station : Station, channel : number) : Promise<void>
    {
        this.api.logDebug(`Event "RTSPLivestreamStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station rtsp livestream start", station, device);
        }).catch((error) => {
            this.api.logError(`Station start rtsp livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event RTSPLivestreamStop is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationRTSPLivestreamStop(station : Station, channel : number) : Promise<void>
    {
        this.api.logDebug(`Event "RTSPLivestreamStop": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station rtsp livestream stop", station, device);
        }).catch((error) => {
            this.api.logError(`Station stop rtsp livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event RTSPURL is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationRTSPURL(station : Station, channel : number, value : string) : Promise<void>
    {
        this.api.logDebug(`Event "RTSPURL": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station rtsp url", station, device, value);
            device.setCustomPropertyValue(PropertyName.DeviceRTSPStreamUrl, value);
        }).catch((error) => {
            this.api.logError(`Station rtsp url error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event PropertyChanged is fired.
     * @param station The station as Station object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    private async onStationPropertyChanged(station : Station, name : string, value : PropertyValue) : Promise<void>
    {
        if(name != "guardMode" && name != "currentMode")
        {
            this.api.logDebug(`Event "PropertyChanged": station: ${station.getSerial()} | name: ${name} | value: ${value}`);
        }
    }

    /**
     * The action to be done when event RawPropertyChanged is fired.
     * @param station The station as Station object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    private async onStationRawPropertyChanged(station : Station, type : number, value : string) : Promise<void>
    {
        if(type != 1102 && type != 1137 && type != 1147 && type != 1151 && type != 1154 && type != 1162 && type != 1165 && type != 1224 && type != 1279 && type != 1281 && type != 1282 && type != 1283 && type != 1284 && type != 1285 && type != 1660 && type != 1664 && type != 1665)
        {
            this.api.logDebug(`Event "RawPropertyChanged": station: ${station.getSerial()} | type: ${type} | value: ${value}`);
        }
    }

    /**
     * The action to be done when event AlarmEvent is fired.
     * @param station The station as Station object.
     * @param alarmEvent The alarmEvent.
     */
    private async onStationAlarmEvent(station : Station, alarmEvent : AlarmEvent) : Promise<void>
    {
        this.api.logDebug(`Event "AlarmEvent": station: ${station.getSerial()} | alarmEvent: ${alarmEvent}`);
    }

    /**
     * The action to be done when event StationRuntimeState is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param batteryLevel The battery level as percentage value.
     * @param temperature The temperature as degree value.
     */
    private async onStationRuntimeState(station : Station, channel : number, batteryLevel : number, temperature : number) : Promise<void>
    {
        this.api.logDebug(`Event "RuntimeState": station: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | temperature: ${temperature}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            if (device.hasProperty(PropertyName.DeviceBattery))
            {
                const metadataBattery = device.getPropertyMetadata(PropertyName.DeviceBattery);
                device.updateRawProperty(metadataBattery.key as number, batteryLevel.toString());
            }
            if (device.hasProperty(PropertyName.DeviceBatteryTemp))
            {
                const metadataBatteryTemperature = device.getPropertyMetadata(PropertyName.DeviceBatteryTemp);
                device.updateRawProperty(metadataBatteryTemperature.key as number, temperature.toString());
            }
        }).catch((error) => {
            this.api.logError(`Station runtime state error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event StationChargingState is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param chargeType The current carge state.
     * @param batteryLevel The battery level as percentage value.
     */
    private async onStationChargingState(station : Station, channel : number, chargeType : number, batteryLevel : number) : Promise<void>
    {
        this.api.logDebug(`Event "ChargingState": station: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | type: ${chargeType}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            if (device.hasProperty(PropertyName.DeviceBattery))
            {
                const metadataBattery = device.getPropertyMetadata(PropertyName.DeviceBattery);
                if (chargeType !== ChargingType.PLUGGED && batteryLevel > 0)
                    device.updateRawProperty(metadataBattery.key as number, batteryLevel.toString());
            }
            if (device.hasProperty(PropertyName.DeviceChargingStatus))
            {
                const metadataChargingStatus = device.getPropertyMetadata(PropertyName.DeviceChargingStatus);
                device.updateRawProperty(metadataChargingStatus.key as number, chargeType.toString());
            }
        }).catch((error) => {
            this.api.logError(`Station charging state error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event StationWifiRssi is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param rssi The current rssi value.
     */
    private async onStationWifiRssi(station : Station, channel : number, rssi : number) : Promise<void>
    {
        this.api.logDebug(`Event "WifiRssi": station: ${station.getSerial()} | channel: ${channel} | rssi: ${rssi}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            if (device.hasProperty(PropertyName.DeviceWifiRSSI))
            {
                const metadataWifiRssi = device.getPropertyMetadata(PropertyName.DeviceWifiRSSI);
                device.updateRawProperty(metadataWifiRssi.key as number, rssi.toString());
            }
        }).catch((error) => {
            this.api.logError(`Station wifi rssi error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event FloodlightManualSwitch is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param enabled The value for the floodlight.
     */
    private async onStationFloodlightManualSwitch(station : Station, channel : number, enabled : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "FloodlightManualSwitch": station: ${station.getSerial()} | channel: ${channel} | enabled: ${enabled}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            if (device.hasProperty(PropertyName.DeviceLight)) {
                const metadataLight = device.getPropertyMetadata(PropertyName.DeviceLight);
                device.updateRawProperty(metadataLight.key as number, enabled === true ? "1" : "0");
            }
        }).catch((error) => {
            this.api.logError(`Station floodlight manual switch error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event AlarmDelayEvent is fired.
     * @param station The station as Station object.
     * @param alarmDelayEvent The AlarmDelayedEvent.
     * @param alarmDelay The delay in ms.
     */
    private async onStationAlarmDelayEvent(station : Station, alarmDelayEvent : AlarmEvent, alarmDelay : number) : Promise<void>
    {
        this.api.logDebug(`Event "AlarmDelayEvent": station: ${station.getSerial()} | alarmDeleayEvent: ${alarmDelayEvent} | alarmDeleay: ${alarmDelay}`);
    }

    /**
     * The action to be done when event TalkbackStarted is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param talkbackStream The TalbackStream object.
     */
    private async onStationTalkbackStarted(station : Station, channel : number, talkbackStream : TalkbackStream) : Promise<void>
    {
        this.api.logDebug(`Event "TalkbackStarted": station: ${station.getSerial()} | channel: ${channel} | talkbackStream: ${talkbackStream}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station talkback start", station, device, talkbackStream);
        }).catch((error) => {
            this.api.logError(`Station talkback start error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event TalkbackStopped is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    private async onStationTalkbackStopped(station : Station, channel : number) : Promise<void>
    {
        this.api.logDebug(`Event "TalkbackStopped": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            this.emit("station talkback stop", station, device);
        }).catch((error) => {
            this.api.logError(`Station talkback stop error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }

    /**
     * The action to be done when event TalkbackError is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param error The error object.
     */
    private async onStationTalkbackError(station : Station, channel : number, error : Error) : Promise<void>
    {
        this.api.logDebug(`Event "TalkbackError": station: ${station.getSerial()} | channel: ${channel} | error: ${error}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device: Device) => {
            station.stopTalkback(device);
        }).catch((error) => {
            this.api.logError(`Station talkback error (station: ${station.getSerial()} channel: ${channel} error: ${error}})`, error);
        });
    }

    /**
     * The action to be done when event AlarmArmedEvent is fired.
     * @param station The station as Station object.
     */
    private async onStationAlarmArmedEvent(station : Station) : Promise<void>
    {
        this.api.logDebug(`Event "AlarmArmedEvent": station: ${station.getSerial()}`);
    }

    /**
     * The action to be done when event AlarmArmDelayEvent is fired.
     * @param station The station as Station object.
     * @param alarmDelay The delay in ms.
     */
    private async onStationArmDelayEvent(station : Station, alarmDelay : number) : Promise<void>
    {
        this.api.logDebug(`Event "ArmDelayEvent": station: ${station.getSerial()} | alarmDelay: ${alarmDelay}`);
    }

    /**
     * The action to be done when event DeviceShakeAlarm is fired.
     * @param deviceSerial The device serial.
     * @param event The SmartSafeShakeAlarmEvent event.
     */
    private onStationDeviceShakeAlarm(deviceSerial : string, event : SmartSafeShakeAlarmEvent) : void
    {
        this.api.logDebug(`Event "DeviceShakeAlarm": device: ${deviceSerial} | event: ${event}`);
        this.api.getDevice(deviceSerial).then((device: Device) => {
            if (device.isSmartSafe())
                (device as SmartSafe).shakeEvent(event, this.api.getConfig().getEventDurationSecondsAsNumber());
        }).catch((error) => {
            this.api.logError(`onStationShakeAlarm device ${deviceSerial} error`, error);
        });
    }

    /**
     * The action to be done when event Device911Alarm is fired.
     * @param deviceSerial The device serial.
     * @param event The SmartSafeAlarm911Event event.
     */
    private onStationDevice911Alarm(deviceSerial : string, event : SmartSafeAlarm911Event) : void
    {
        this.api.logDebug(`Event "Device911Alarm": device: ${deviceSerial} | event: ${event}`);
        this.api.getDevice(deviceSerial).then((device: Device) => {
            if (device.isSmartSafe())
                (device as SmartSafe).alarm911Event(event, this.api.getConfig().getEventDurationSecondsAsNumber());
        }).catch((error) => {
            this.api.logError(`onStation911Alarm device ${deviceSerial} error`, error);
        });
    }

    /**
     * The action to be done when event DeviceJammed is fired.
     * @param deviceSerial The device serial.
     */
    private onStationDeviceJammed(deviceSerial : string) : void
    {
        this.api.logDebug(`Event "DeviceJammed": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device: Device) => {
            if (device.isSmartSafe())
                (device as SmartSafe).jammedEvent(this.api.getConfig().getEventDurationSecondsAsNumber());
        }).catch((error) => {
            this.api.logError(`onStationDeviceJammed device ${deviceSerial} error`, error);
        });
    }

    /**
     * The action to be done when event DeviceLowBattery is fired.
     * @param deviceSerial The device serial.
     */
    private onStationDeviceLowBattery(deviceSerial : string) : void
    {
        this.api.logInfo(`Event "DeviceLowBattery": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device: Device) => {
            if (device.isSmartSafe())
                (device as SmartSafe).lowBatteryEvent(this.api.getConfig().getEventDurationSecondsAsNumber());
        }).catch((error) => {
            this.api.logError(`onStationDeviceLowBattery device ${deviceSerial} error`, error);
        });
    }

    /**
     * The action to be done when event DeviceWrongTryProtectAlarm is fired.
     * @param deviceSerial The device serial.
     */
    private onStationDeviceWrongTryProtectAlarm(deviceSerial : string) : void
    {
        this.api.logDebug(`Event "DeviceWrongTryProtectAlarm": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device: Device) => {
            if (device.isSmartSafe())
                (device as SmartSafe).wrongTryProtectAlarmEvent(this.api.getConfig().getEventDurationSecondsAsNumber());
        }).catch((error) => {
            this.api.logError(`onStationDeviceWrongTryProtectAlarm device ${deviceSerial} error`, error);
        });
    }

    /**
     * Retrieves the last guard mode change event for the given station.
     * @param stationSerial The serial of the station.
     * @returns The time as timestamp or undefined.
     */
    private async getLastEventFromCloud(stationSerial : string) : Promise <number | undefined>
    {
        var lastGuardModeChangeTime = await this.httpService.getAllAlarmEvents({deviceSN : stationSerial}, 1);
        if(lastGuardModeChangeTime !== undefined && lastGuardModeChangeTime.length >= 1)
        {
            return lastGuardModeChangeTime[0].create_time;
        }
        else
        {
            return undefined;
        }
    }

    /**
     * Set the last guard mode change time to the array.
     * @param stationSerial The serial of the station.
     * @param time The time as timestamp or undefined.
     */
    private setLastGuardModeChangeTime(stationSerial : string, time : number | undefined, timestampType : string) : void
    {
        if(time !== undefined)
        {
            switch (timestampType)
            {
                case "sec":
                    this.lastGuardModeChangeTimeForStations[stationSerial] = time * 1000;
                    break;
                case "ms":
                    this.lastGuardModeChangeTimeForStations[stationSerial] = time;
                    break;
                default:
                    this.lastGuardModeChangeTimeForStations[stationSerial] = undefined;
            }
        }
        else
        {
            this.lastGuardModeChangeTimeForStations[stationSerial] = undefined;
        }

        this.api.updateStationGuardModeChangeTimeSystemVariable(stationSerial, this.lastGuardModeChangeTimeForStations[stationSerial]);
    }

    /**
     * Helper function to retrieve the last event time from cloud and set the value to the array.
     * @param stationSerial The serial of the station.
     */
    private async setLastGuardModeChangeTimeFromCloud(stationSerial : string) : Promise<void>
    {
        this.setLastGuardModeChangeTime(stationSerial, await this.getLastEventFromCloud(stationSerial), "sec");
    }

    /**
     * Set the time for the last guard mode change to the current time.
     * @param stationSerial The serial of the station.
     */
    private setLastGuardModeChangeTimeNow(stationSerial : string) : void
    {
        this.setLastGuardModeChangeTime(stationSerial, new Date().getTime(), "ms");
    }

    /**
     * Retrieve the last guard mode change time from the array.
     * @param stationSerial The serial of the station.
     * @returns The timestamp as number or undefined.
     */
    public getLastGuardModeChangeTime(stationSerial : string) : number | undefined
    {
        return this.lastGuardModeChangeTimeForStations[stationSerial];
    }

    /**
     * Set the given property for the given station to the given value.
     * @param stationSerial The serial of the station the property is to change.
     * @param name The name of the property.
     * @param value The value of the property.
     */
    public async setStationProperty(stationSerial : string, name : string, value : unknown) : Promise<void>
    {
        const station = this.stations[stationSerial];
        const metadata = station.getPropertyMetadata(name);

        value = parseValue(metadata, value);

        switch (name)
        {
            case PropertyName.StationGuardMode:
                await station.setGuardMode(value as number);
                break;
            case PropertyName.StationAlarmTone:
                await station.setStationAlarmTone(value as number);
                break;
            case PropertyName.StationAlarmVolume:
                await station.setStationAlarmRingtoneVolume(value as number);
                break;
            case PropertyName.StationPromptVolume:
                await station.setStationPromptVolume(value as number);
                break;
            case PropertyName.StationNotificationSwitchModeApp:
                await station.setStationNotificationSwitchMode(NotificationSwitchMode.APP, value as boolean);
                break;
            case PropertyName.StationNotificationSwitchModeGeofence:
                await station.setStationNotificationSwitchMode(NotificationSwitchMode.GEOFENCE, value as boolean);
                break;
            case PropertyName.StationNotificationSwitchModeSchedule:
                await station.setStationNotificationSwitchMode(NotificationSwitchMode.SCHEDULE, value as boolean);
                break;
            case PropertyName.StationNotificationSwitchModeKeypad:
                await station.setStationNotificationSwitchMode(NotificationSwitchMode.KEYPAD, value as boolean);
                break;
            case PropertyName.StationNotificationStartAlarmDelay:
                await station.setStationNotificationStartAlarmDelay(value as boolean);
                break;
            case PropertyName.StationTimeFormat:
                await station.setStationTimeFormat(value as number);
                break;
            case PropertyName.StationSwitchModeWithAccessCode:
                await station.setStationSwitchModeWithAccessCode(value as boolean);
                break;
            case PropertyName.StationAutoEndAlarm:
                await station.setStationAutoEndAlarm(value as boolean);
                break;
            case PropertyName.StationTurnOffAlarmWithButton:
                await station.setStationTurnOffAlarmWithButton(value as boolean);
                break;
            default:
                if (!Object.values(PropertyName).includes(name as PropertyName))
                {
                    throw new ReadOnlyPropertyError(`Property ${name} is read only`);
                }
                throw new InvalidPropertyError(`Station ${stationSerial} has no writable property named ${name}`);
        }
    }
}