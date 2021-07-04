import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { EufySecurityEvents } from './interfaces';
import { HTTPApi, Hubs, Station, GuardMode, PropertyValue } from './http';
import { sleep } from './push/utils';

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
                        await this.bases[stationSerial].connect(this.api.getP2PConnectionType());

                        if(this.api.getApiUseUpdateStateEvent())
                        {
                            this.addEventListenerInstantly(this.bases[stationSerial], "GuardModeChanged");
                            this.addEventListenerInstantly(this.bases[stationSerial], "PropertyChanged");
                            this.addEventListenerInstantly(this.bases[stationSerial], "RawPropertyChanged");
                        }
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
     * Returns a JSON-Representation of all Bases including the guard mode.
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
                base.on("guard mode", (station : Station, guardMode : number, currentMode : number) => this.onStationGuardModeChanged(station, guardMode, currentMode));
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station : Station, name : string, value : PropertyValue) => this.onPropertyChanged(station, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station : Station, type : number, value : string, modified : number) => this.onRawPropertyChanged(station, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
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
                base.on("guard mode", (station : Station, guardMode : number, currentMode : number) => this.onStationGuardModeChanged(station, guardMode, currentMode));
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station : Station, name : string, value : PropertyValue) => this.onPropertyChanged(station, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station : Station, type : number, value : string, modified : number) => this.onRawPropertyChanged(station, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("property changed")} Listener.`);
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
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("property changed")} Listener.`);
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
        }
        return -1;
    }

    /**
     * The action to be one when event GuardModeChanged is fired.
     * @param station The base as Station object.
     * @param guardMode The new guard mode as GuardMode.
     * @param currentMode The new current mode as GuardMode.
     */
    private async onStationGuardModeChanged(station : Station, guardMode : number, currentMode : number): Promise<void>
    {
        if(this.skipNextModeChangeEvent[station.getSerial()] == true)
        {
            this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else
        {
            this.api.logDebug("Station serial: " + station.getSerial() + " ::: Guard Mode: " + guardMode + " ::: Current Mode: " + currentMode);
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
            this.api.logDebug("Station serial: " + station.getSerial() + " ::: Name: " + name + " ::: Value: " + value.value);
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
            this.api.logDebug("Station serial: " + station.getSerial() + " ::: Type: " + type + " ::: Value: " + value + " ::: Modified: " + modified);
        }
    }
}