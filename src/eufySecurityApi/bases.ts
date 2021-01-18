import { EufySecurityApi } from './eufySecurityApi';
import { HttpService } from './http';
import { LocalLookupService, DeviceClientService, CommandType } from './p2p';
import { Hub, GuardMode, DeviceType } from './http/http-response.models';
import { CloudLookupService } from './p2p/cloud-lookup.service';
import { sleep } from './push';

/**
 * Represents all the Bases in the account.
 */
export class Bases
{
    private api : EufySecurityApi;
    private httpService : HttpService;
    private serialNumbers : string[];
    private resBases !: Hub[];
    private bases : {[key:string]:Base} = {};

    /**
     * Create the Bases objects holding all bases in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HttpService)
    {
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];
    }

    /**
     * (Re)Loads all Bases and the settings of them.
     */
    public async loadBases() : Promise<void>
    {
        this.resBases = await this.httpService.listHubs();
        var resBase : Hub;
        var base : Base;

        for (resBase of this.resBases)
        {
            base = new Base(this.api, this.httpService, resBase);
            this.bases[base.getSerialNumber()] = base;
            this.serialNumbers.push(base.getSerialNumber());
        }

        await this.saveBasesSettings();
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
    public getBases() : {[key: string]: Base}
    {
        return this.bases;
    }

    /**
     * Get the guard mode for all bases.
     */
    public getGuardMode() : {[key: string]: Base}
    {
        return this.getBases();
    }

    /**
     * Set the guard mode of all bases to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode : GuardMode) : Promise<void>
    {
        for (var key in this.bases)
        {
            var base = this.bases[key];
            await base.setGuardMode(guardMode);
        }
    }

    /**
     * Set the guard mode for the given base to the given mode.
     * @param baseSerial The serial of the base the mode to change.
     * @param guardMode The target guard mode.
     */
    public async setGuardModeBase(baseSerial : string, guardMode : GuardMode) : Promise<void>
    {
        var base = this.bases[baseSerial];
        await base.setGuardMode(guardMode);
    }
}

/**
 * Represents one Base object.
 */
export class Base
{
    private api : EufySecurityApi;
    private device_info : Hub;
    private httpService : HttpService;
    private localLookupService : LocalLookupService;
    private cloudLookupService : CloudLookupService;
    private dskKeyExpire = 0;
    private localIp = "";
    private guardMode = "";

    /**
     * The constructor for the Base.
     * @param httpService The httpService.
     * @param device_info The device_info object with the data for the base.
     */
    constructor(api : EufySecurityApi, httpService : HttpService, device_info : Hub)
    {
        this.api = api;
        this.httpService = httpService;
        this.device_info = device_info;
        this.localLookupService = new LocalLookupService();
        this.cloudLookupService = new CloudLookupService();
        this.pullValues();
    }

    /**
     * Collect needed values from the params-array so that we need only iterate once trough it...
     */
    private pullValues() : void
    {
        for (var param of this.device_info.params)
        {
            switch (param.param_type)
            {
                case CommandType.CMD_GET_HUB_LAN_IP:
                    this.localIp = param.param_value;
                    break;
                case CommandType.CMD_SET_ARMING:
                    this.guardMode = param.param_value;
                    break;
            }
        }
    }

    /**
     * Get the id of the Base in the eufy system.
     */
    public getId() : number
    {
        return this.device_info.station_id;
    }

    /**
     * Get the serial number of the base.
     */
    public getSerialNumber() : string
    {
        return this.device_info.station_sn;
    }

    /**
     * Get the model name of the base.
     */
    public getModel() : string
    {
        return this.device_info.station_model;
    }

    /**
     * Get the device type of the base.
     */
    public getDeviceType() : number
    {
        return this.device_info.device_type;
    }

    /**
     * Get the device type as string for the base.
     */
    public getDeviceTypeString() : string
    {
        if(this.device_info.device_type == DeviceType.STATION)
        {
            return "basestation";
        }
        else
        {
            return "unknown(" + this.device_info.device_type + ")";
        }
    }

    /**
     * Get the given name of the base.
     */
    public getName() : string
    {
        return this.device_info.station_name;
    }

    /**
     * Get the hardware version of the base.
     */
    public getHardwareVersion() : string
    {
        return this.device_info.main_hw_version;
    }

    /**
     * Get the software version of the base.
     */
    public getSoftwareVersion() : string
    {
        return this.device_info.main_sw_version;
    }

    /**
     * Get the mac address of the base.
     */
    public getMacAddress() : string
    {
        return this.device_info.wifi_mac;
    }

    /**
     * Get the external ip address of the base (i.e. your router got from your isp).
     */
    public getExternalIpAddress() : string
    {
        return this.device_info.ip_addr;
    }

    /**
     * Get the internal ip adress of your base (in your local network).
     */
    public getLocalIpAddress() : string
    {
        return this.localIp;
    }

    /**
     * Get the P2P_DID to connect via P2P to the base.
     */
    public getP2pDid() : string
    {
        return this.device_info.p2p_did;
    }

    /**
     * Get the actor_id to connect via P2P to the base. 
     */
    public getActorId() : string
    {
        return this.device_info.member.action_user_id;
    }

    /**
     * Get the DSK_KEY to connect via P2P to the base.
     */
    public async getDskKey() : Promise<string>
    {
        var dskKey = await this.httpService.stationDskKeys(this.device_info.station_sn);
        this.dskKeyExpire = await dskKey.dsk_keys[0].expiration;
        return await dskKey.dsk_keys[0].dsk_key;
    }

    /**
     * Get the time the DSK_KEY expires.
     */
    public getDskKeyExpiration() : number
    {
        return this.dskKeyExpire;
    }

    /**
     * Get the current guard mode of the base.
     */
    public getGuardMode() : string
    {
        return this.guardMode;
    }

    /**
     * Set the guard mode of the base to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode : GuardMode) : Promise<boolean>
    {
        try
        {
            var address = await this.localLookupService.lookup(this.getLocalIpAddress());
            this.api.addToLog("Base " + this.getSerialNumber() + " found on local side. address: " + address.host + ":" + address.port);
            var devClientService = new DeviceClientService(address, this.getP2pDid(), this.getActorId());

            await devClientService.connect();

            devClientService.sendCommandWithInt(CommandType.CMD_SET_ARMING, guardMode);

            await devClientService.close();

            /*console.log("Try Cloud...");
            var address;
            var addresses = await this.cloudLookupService.lookup(this.getP2pDid(), await this.getDskKey());

            for(address of addresses)
            {
                console.log('Found address', address);
                var devClientService = new DeviceClientService(address, this.getP2pDid(), this.getActorId());

                await devClientService.connect();

                await sleep(10000);

                await devClientService.close();
            }*/
            
            return true;
        }
        catch (e)
        {
            this.api.addToErr("ERROR: setGuardMode: " + e);
            
            return false;
        }
    }
}