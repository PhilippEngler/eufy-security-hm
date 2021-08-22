import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { EufySecurityEvents } from './interfaces';
import { HTTPApi, Hubs, Station, GuardMode, PropertyValue, RawValues } from './http';
import { sleep } from './push/utils';
import { Devices } from "./devices";

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
    }

    public setDevices(devices : Devices) : void
    {
        this.devices = devices;
    }

    /**
     * (Re)Loads all Bases and the settings of them.
     */
    public async loadBases() : Promise<void>
    {
        try
        {
            await this.httpService.updateDeviceInfo();
            this.resBases = this.httpService.getHubs();
            
            if(this.resBases != null)
            {
                for (var stationSerial in this.resBases)
                {
                    if(this.bases[stationSerial])
                    {
                        this.bases[stationSerial].update(this.resBases[stationSerial]);
                    }
                    else
                    {
                        this.bases[stationSerial] = new Station(this.api, this.httpService, this.resBases[stationSerial]);
                        this.skipNextModeChangeEvent[stationSerial] = false;
                        this.serialNumbers.push(stationSerial);
                        await this.bases[stationSerial].connect();

                        if(this.api.getApiUseUpdateStateEvent())
                        {
                            this.addEventListenerInstantly(this.bases[stationSerial], "GuardModeChanged");
                            this.addEventListenerInstantly(this.bases[stationSerial], "PropertyChanged");
                            this.addEventListenerInstantly(this.bases[stationSerial], "RawPropertyChanged");
                        }

                        this.addEventListenerInstantly(this.bases[stationSerial], "RawDevicePropertyChanged");
                        this.addEventListenerInstantly(this.bases[stationSerial], "ChargingState");
                        this.addEventListenerInstantly(this.bases[stationSerial], "WifiRssi");
                        this.addEventListenerInstantly(this.bases[stationSerial], "RuntimeState");
                    }
                }
                
                await this.saveBasesSettings();
            }
            else
            {
                this.bases = {};
            }
        }
        catch (e)
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
                    this.removeEventListener(this.bases[stationSerial], "PropertyChanged");
                    this.removeEventListener(this.bases[stationSerial], "RawPropertyChanged");
                    this.removeEventListener(this.bases[stationSerial], "RawDevicePropertyChanged");
                    this.removeEventListener(this.bases[stationSerial], "ChargingState");
                    this.removeEventListener(this.bases[stationSerial], "WifiRssi");
                    this.removeEventListener(this.bases[stationSerial], "RuntimeState");
                }
            }
        }
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
        var cnt = 0;
        for (var stationSerial in this.bases)
        {
            this.skipNextModeChangeEvent[stationSerial] = true;
            await this.bases[stationSerial].setGuardMode(guardMode)
            await sleep(1500);
            await this.loadBases();
            if(this.bases[stationSerial].getGuardMode().value as number != guardMode)
            {
                cnt = cnt + 1;
            }
        }
        if(cnt == 0)
        {
            return true;
        }
        else
        {
            return false;
        }
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
        await sleep(1500);
        await this.loadBases();
        if(this.bases[baseSerial].getGuardMode().value as number == guardMode)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Add instantly a given event listener for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     */
    public addEventListenerInstantly(base : Station, eventListenerName : string) : void
    {
        switch (eventListenerName)
        {
            case "GuardModeChanged":
                base.on("guard mode", (station : Station, guardMode : number) => this.onStationGuardModeChanged(station, guardMode));
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station : Station, name : string, value : PropertyValue) => this.onPropertyChanged(station, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station : Station, type : number, value : string, modified : number) => this.onRawPropertyChanged(station, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "RuntimeState":
                base.on("runtime state", (station: Station, channel: number, batteryLevel: number, temperature: number, modified: number) => this.onStationRuntimeState(station, channel, batteryLevel, temperature, modified));
                this.api.logDebug(`Listener 'RuntimeState' for base ${base.getSerial()} added. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.on("charging state", (station: Station, channel: number, chargeType: number, batteryLevel: number, modified: number) => this.onStationChargingState(station, channel, chargeType, batteryLevel, modified));
                this.api.logDebug(`Listener 'ChargingState' for base ${base.getSerial()} added. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.on("wifi rssi", (station: Station, channel: number, rssi: number, modified: number) => this.onStationWifiRssi(station, channel, rssi, modified));
                this.api.logDebug(`Listener 'WifiRssi' for base ${base.getSerial()} added. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.on("raw device property changed", (deviceSN: string, params: RawValues) => this.onRawDevicePropertyChanged(deviceSN, params));
                this.api.logDebug(`Listener 'RawDevicePropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("raw device property changed")} Listener.`);
                break;
        }
    }

    /**
     * Add 5 seconds delayed a given event listener for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     */
    public async addEventListenerDelayed(base : Station, eventListenerName : string) : Promise<void>
    {
        await sleep(5000);
        switch (eventListenerName)
        {
            case "GuardModeChanged":
                base.on("guard mode", (station : Station, guardMode : number) => this.onStationGuardModeChanged(station, guardMode));
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station : Station, name : string, value : PropertyValue) => this.onPropertyChanged(station, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station : Station, type : number, value : string, modified : number) => this.onRawPropertyChanged(station, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "RuntimeState":
                base.on("runtime state", (station: Station, channel: number, batteryLevel: number, temperature: number, modified: number) => this.onStationRuntimeState(station, channel, batteryLevel, temperature, modified));
                this.api.logDebug(`Listener 'RuntimeState' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.on("charging state", (station: Station, channel: number, chargeType: number, batteryLevel: number, modified: number) => this.onStationChargingState(station, channel, chargeType, batteryLevel, modified));
                this.api.logDebug(`Listener 'ChargingState' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.on("wifi rssi", (station: Station, channel: number, rssi: number, modified: number) => this.onStationWifiRssi(station, channel, rssi, modified));
                this.api.logDebug(`Listener 'WifiRssi' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.on("raw device property changed", (deviceSN: string, params: RawValues) => this.onRawDevicePropertyChanged(deviceSN, params));
                this.api.logDebug(`Listener 'RawDevicePropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("raw device property changed")} Listener.`);
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
            case "GuardModeChanged":
                base.removeAllListeners("guard mode");
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.removeAllListeners("property changed");
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "RuntimeState":
                base.removeAllListeners("runtime state");
                this.api.logDebug(`Listener 'RuntimeState' for base ${base.getSerial()} removed. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.removeAllListeners("charging state");
                this.api.logDebug(`Listener 'ChargingState' for base ${base.getSerial()} removed. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.removeAllListeners("wifi rssi");
                this.api.logDebug(`Listener 'WifiRssi' for base ${base.getSerial()} removed. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.removeAllListeners("raw device property changed");
                this.api.logDebug(`Listener 'RawDevicePropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("raw device property changed")} Listener.`);
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
            case "GuardModeChanged":
                return base.listenerCount("guard mode");
            case "PropertyChanged":
                return base.listenerCount("property changed");
            case "RawPropertyChanged":
                return base.listenerCount("raw property changed");
            case "RuntimeState":
                return base.listenerCount("runtime state");
            case "ChargingState":
                return base.listenerCount("charging state");
            case "WifiRssi":
                return base.listenerCount("wifi rssi");
            case "RawDevicePropertyChanged":
                return base.listenerCount("raw device property changed");
        }
        return -1;
    }

    /**
     * The action to be one when event GuardModeChanged is fired.
     * @param station The base as Station object.
     * @param guardMode The new guard mode as GuardMode.
     * @param currentMode The new current mode as GuardMode.
     */
    private async onStationGuardModeChanged(station : Station, guardMode : number): Promise<void>
    {
        if(this.skipNextModeChangeEvent[station.getSerial()] == true)
        {
            this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else
        {
            this.api.logDebug(`Event "PropertyChanged": base: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeBase(station.getSerial());
        }
    }

    /**
     * The action to be one when event PropertyChanged is fired.
     * @param station The base as Station object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    private async onPropertyChanged(station : Station, name : string, value : PropertyValue): Promise<void>
    {
        if(name != "guardMode" && name != "currentMode")
        {
            this.api.logDebug(`Event "PropertyChanged": base: ${station.getSerial()} | name: ${name} | value: ${value.value}`);
        }
    }

    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param station The base as Station object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     * @param modified The timestamp of the last change.
     */
    private async onRawPropertyChanged(station : Station, type : number, value : string, modified : number): Promise<void>
    {
        if(type != 1102 && type != 1137 && type != 1147 && type != 1151 && type != 1154 && type != 1162 && type != 1165 && type != 1224 && type != 1279 && type != 1281 && type != 1282 && type != 1283 && type != 1284 && type != 1285 && type != 1660 && type != 1664 && type != 1665)
        {
            this.api.logDebug(`Event "RawPropertyChanged": base: ${station.getSerial()} | type: ${type} | value: ${value}`);
        }
    }

    private onStationRuntimeState(station: Station, channel: number, batteryLevel: number, temperature: number, modified: number): void {
        this.api.logDebug(`Event "RuntimeState": base: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | temperature: ${temperature}`);
        this.devices.updateBatteryValues(station.getSerial(), channel, batteryLevel, temperature, modified);
    }

    private onStationChargingState(station: Station, channel: number, chargeType: number, batteryLevel: number, modified: number): void {
        this.api.logDebug(`Event "ChargingState": base: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | type: ${chargeType}`);
        this.devices.updateChargingState(station.getSerial(), channel, chargeType, batteryLevel, modified);
    }

    private onStationWifiRssi(station: Station, channel: number, rssi: number, modified: number): void {
        this.api.logDebug(`Event "WifiRssi": base: ${station.getSerial()} | channel: ${channel} | rssi: ${rssi}`);
        this.devices.updateWifiRssi(station.getSerial(), channel, rssi, modified);
    }

    private onRawDevicePropertyChanged(deviceSerial: string, values: RawValues): void {
        this.api.logDebug(`Event "RawDevicePropertyChanged": device: ${deviceSerial} | values: ${values}`);
        this.devices.updateDeviceProperties(deviceSerial, values);
    }
}