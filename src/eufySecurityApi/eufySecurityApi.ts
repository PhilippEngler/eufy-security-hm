import { Config } from './config';
import { HTTPApi, GuardMode, Station, Device, PropertyName, Camera, LoginOptions, HouseDetail, PropertyValue, RawValues, InvalidPropertyError } from './http';
import { HomematicApi } from './homematicApi';
import { Logger } from './utils/logging';

import { PushService } from './pushService';
import { MqttService } from './mqttService';
import { generateUDID, generateSerialnumber } from './utils';
import { Devices } from './devices'
import { Stations } from './stations';
import { P2PConnectionType } from './p2p';
import { sleep } from './push/utils';
import { EufyHouses } from './houses';
import { ReadOnlyPropertyError } from './error';

export class EufySecurityApi
{
    private config : Config;
    private logger : Logger;
    private httpService !: HTTPApi;
    private homematicApi !: HomematicApi;
    private pushService !: PushService;
    private mqttService !: MqttService;
    private houses !: EufyHouses;
    private devices !: Devices;
    private stations !: Stations;
    private connected = false;
    private retries = 0;
    private serviceState : string = "init";
    
    private taskUpdateDeviceInfo !: NodeJS.Timeout;
    private taskUpdateState !: NodeJS.Timeout;
    private taskUpdateLinks !: NodeJS.Timeout;
    private taskUpdateLinks24 !: NodeJS.Timeout;
    private waitUpdateState !: NodeJS.Timeout;
    private refreshEufySecurityCloudTimeout?: NodeJS.Timeout;
    
    /**
     * Create the api object.
     */
    constructor()
    {
        this.logger = new Logger(this);
        this.config = new Config(this.logger);
        this.homematicApi = new HomematicApi(this);
        
        this.initialize();
    }

    /**
     * Initialize the api and make basic settings check. 
     */
    private async initialize() : Promise<void>
    {
        if(this.config.getEmailAddress() == "" || this.config.getPassword() == "")
        {
            this.logError("Please check your settings in the 'config.json' file.\r\nIf there was no 'config.json', it should now be there.\r\nYou need to set at least email and password to run this addon.");
        
            this.serviceState = "ok";
        }
        else
        {
            this.httpService = await HTTPApi.initialize(this, this.config.getCountry(), this.config.getEmailAddress(), this.config.getPassword(), this.logger);

            this.httpService.setLanguage(this.config.getLanguage());
            this.httpService.setPhoneModel(this.config.getTrustedDeviceName());

            this.httpService.on("close", () => this.onAPIClose());
            this.httpService.on("connect", () => this.onAPIConnect());

            this.httpService.setToken(this.getToken());
            this.httpService.setTokenExpiration(new Date(this.getTokenExpire()*1000));
            
            if (this.config.getOpenudid() == "")
            {
                this.config.setOpenudid(generateUDID());
                this.logger.debug("Generated new openudid:", this.config.getOpenudid());
            }
            this.httpService.setOpenUDID(this.config.getOpenudid());
    
            if (this.config.getSerialNumber() == "")
            {
                this.config.setSerialNumber(generateSerialnumber(12));
                this.logger.debug("Generated new serial_number:", this.config.getSerialNumber());
            }
            this.httpService.setSerialNumber(this.config.getSerialNumber());

            if(this.config.getPushServiceActive() == true)
            {
                this.logger.logInfoBasic("Started initializing push notification connection.");
                try
                {
                    this.pushService = new PushService(this, this.httpService, this.config, this.logger);
                }
                catch(e)
                {
                    this.logger.logInfoBasic("No country and/or language given. Skipping creating push service.");
                }
            }

            this.mqttService = new MqttService(this, this.config, this.logger);

            await this.connect();
        }
    }

    /**
     * Returns the state of the service.
     * @returns The state of the service.
     */
    public getServiceState() : string
    {
        return this.serviceState;
    }

    /**
     * Set the state of the service to the given value.
     * @returns The state of the service.
     */
    public setServiceState(state : string)
    {
        if(state == "init" || state == "ok" || state == "shutdown")
        {
            this.serviceState = state;
        }
    }

    /**
     * Returns the account info as JSON string.
     * @returns The account info as JSON string.
     */
    public async getAccountInfo() : Promise<string>
    {
        var res = "";
        res = JSON.stringify(await this.httpService.getPassportProfile());
        return res;
    }

    /**
     * Close the EufySecurityApi.
     */
    public async close() : Promise<void>
    {
        /*for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.stopStationLivestream(device_sn);
        }
        for (const device_sn of this.cameraCloudLivestreamTimeout.keys()) {
            this.stopCloudLivestream(device_sn);
        }*/

        if (this.refreshEufySecurityCloudTimeout !== undefined)
        {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        this.closePushService();
        this.closeMqttService();
        
        await this.closeStation();

        this.closeDevice();

        /*if (this.connected)
            this.emit("close");*/

        this.connected = false;
    }

    /**
     * Close all push service connections
     */
    private closePushService() : void
    {
        this.logInfoBasic("Stopping PushService...");
        if(this.pushService)
        {
            this.pushService.close();
        }
    }

    /**
     * Close the MqttService
     */
    private closeMqttService() : void
    {
        this.logInfoBasic("Stopping MqttService...");
        if(this.mqttService)
        {
            this.mqttService.close();
        }
    }

    /**
     * Close all P2P connections from all stations.
     */
    private async closeStation() : Promise<void>
    {
        this.logInfoBasic("Closing connections to all stations...");
        if(this.devices != null || this.devices != undefined)
        {
            this.devices.close();
        }
        if(this.stations != null || this.devices != undefined)
        {
            await this.stations.closeP2PConnections();
        }
    }

    /**
     * Close all devices.
     */
    private async closeDevice() : Promise<void>
    {
        this.logInfoBasic("Closing connections to all devices...");
        if(this.devices != null || this.devices != undefined)
        {
            this.devices.closeDevices();
        }
    }
    
    /**
     * Login with the in the api provoded login information.
     * @param options Options for login.
     */
    public async connect(options? : LoginOptions) : Promise<void>
    {
        await this.httpService.login(options)
            .then(async () => {
                if (options?.verifyCode) {
                    let trusted = false;
                    const trusted_devices = await this.httpService.listTrustDevice();
                    trusted_devices.forEach(trusted_device => {
                        if (trusted_device.is_current_device === 1) {
                            trusted = true;
                        }
                    });
                    if (!trusted)
                        return await this.httpService.addTrustDevice(options?.verifyCode);
                }
            })
            .catch((error) => {
                this.logger.error("Connect Error", error);
            });
    }

    /**
     * Returns a boolean value to indicate the connection state.
     * @returns True if connected to eufy, otherwise false.
     */
    public isConnected() : boolean
    {
        return this.connected;
    }

    /**
     * Returns the connection state of the mqtt service.
     * @returns Connection state of the MqttService as boolean value.
     */
    public isMqttServiceConnected() : boolean
    {
        return this.mqttService.isConnected();
    }

    /**
     * Returns the MqttService object.
     * @returns The MqttSerivce object.
     */
    public getMqttService() : MqttService
    {
        return this.mqttService;
    }

    /**
     * Eventhandler for the API Close event.
     */
    private async onAPIClose() : Promise<void>
    {
        if (this.refreshEufySecurityCloudTimeout !== undefined)
        {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        this.connected = false;
        //this.emit("close");

        if (this.retries < 1)
        {
            this.retries++;
            await this.connect()
        }
        else
        {
            this.logger.error(`Tried to re-authenticate to Eufy cloud, but failed in the process. Manual intervention is required!`);
        }
    }

    /**
     * Eventhandler for the API Connect event.
     */
    private async onAPIConnect() : Promise<void>
    {
        this.connected = true;
        this.retries = 0;
        //this.emit("connect");

        this.saveCloudToken();

        if(this.pushService)
        {
            this.pushService.connect();
        }

        const loginData = this.httpService.getPersistentData();
        if (loginData)
        {
            this.mqttService.connect(loginData.user_id, this.config.getOpenudid(), this.httpService.getAPIBase(), loginData.email);
        }
        else
        {
            this.logger.warn("No mqtt login data received. Skipping creating mqtt service.");
        }

        this.houses = new EufyHouses(this, this.httpService);
        this.stations = new Stations(this, this.httpService);
        this.devices = new Devices(this, this.httpService);

        await sleep(10);
        await this.refreshCloudData();

        this.setupScheduledTasks();

        this.serviceState = "ok";
    }

    /**
     * Returns the all stations as array.
     * @returns The array with all stations.
     */
    public async getStations() : Promise<{ [stationSerial : string ] : Station }>
    {
        return await this.stations.getStations();
    }

    /**
     * Returns the station object specified by the station serial.
     * @param stationSerial The serial of the station to retrive.
     * @returns The station as object.
     */
    public async getStation(stationSerial : string) : Promise<Station>
    {
        return await this.stations.getStation(stationSerial);
    }

    /**
     * Return the Devices object.
     * @returns The Devices object.
     */
    public getDevices() : { [deviceSerial : string] : Device }
    {
        return this.devices.getDevices();
    }

    /**
     * Returns a device specified by a given serial.
     * @param deviceSerial The serial of the device.
     * @returns The device as object.
     */
    public async getDevice(deviceSerial : string) : Promise<Device>
    {
        return await this.devices.getDevice(deviceSerial);
    }

    /**
     * Returns a device specified by station serial and channel.
     * @param stationSerial The serial of the station.
     * @param channel The channel of the device.
     * @returns The device as object.
     */
    public async getDeviceByStationAndChannel(stationSerial : string, channel : number) : Promise<Device>
    {
        return this.devices.getDeviceByStationAndChannel(stationSerial, channel);
    }

    /**
     * Returns all houses of the account.
     * @returns The houses object.
     */
    public getHouses() : { [houseId : string] : any}
    {
        return this.houses.getHouses();
    }

    /**
     * Returns a house specified by houseId.
     * @param houseId The houseId of the house.
     * @returns The house as object.
     */
    public getHouse(houseId : string) : HouseDetail
    {
        return this.houses.getHouse(houseId);
    }

    /**
     * Save the login tokens.
     */
    private saveCloudToken() : void
    {
        const token = this.httpService.getToken();
        const token_expiration = this.httpService.getTokenExpiration();

        if (!!token && !!token_expiration)
        {
            this.logger.debug("Save cloud token and token expiration", { token: token, tokenExpiration: token_expiration });
            this.config.setToken(token);
            this.config.setTokenExpire(token_expiration.getTime() / 1000);
        }
    }

    /**
     * Refreshing cloud data.
     */
    public async refreshCloudData() : Promise<void>
    {
        /*if (this.config.acceptInvitations)
        {
            await this.processInvitations().catch(error => {
                this.log.error("Error in processing invitations", error);
            });
        }*/
        
        await this.httpService.refreshAllData().catch(error => {
            this.logger.error("Error during API data refreshing", error);
        });

        if (this.refreshEufySecurityCloudTimeout !== undefined)
        {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        this.refreshEufySecurityCloudTimeout = setTimeout(() => { this.refreshCloudData() }, this.config.getUpdateDeviceDataIntervall() * 60 * 1000);
    }

    /**
     * (Re)Loads all Stations and Devices and the settings of them.
     */
    public async loadData() : Promise<void>
    {
        await this.httpService.refreshHouseData();
        await this.httpService.refreshStationData();
        await this.httpService.refreshDeviceData();
    }
    
    /**
     * Create a JSON object string for a given house.
     * @param house The house the JSON object created for.
     */
    private makeJsonObjectForHouse(house : HouseDetail) : any
    {
        var json : any = {};

        json = {"houseId":house.house_id, "houseName":house.house_name, "isDefault":house.is_default, "geofenceId":house.geofence_id, "address":house.address, "latitude":house.latitude, "longitude":house.longitude, "radiusRange":house.radius_range, "locationMsg":house.location_msg, "createTime":house.create_time, "awayMode":house.away_mode, "homeMode":house.home_mode};

        return json;
    }
    
    /**
     * Returns a JSON-Representation of all houses.
     */
    public async getHousesAsJSON() : Promise<string> 
    {
        var json : any = {};

        await this.httpService.refreshHouseData();
        try
        {
            if(this.houses)
            {
                var houses = this.getHouses();
                if(houses)
                {
                    json = {"success":true, "data":[]};
                    for (var house_id in houses)
                    {
                        json.data.push(this.makeJsonObjectForHouse(this.getHouse(house_id)));
                    }
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":"No houses found."};
                    this.setLastConnectionInfo(false);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at getHouses().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON-Representation of a given house.
     */
    public async getHouseAsJSON(houseId : string) : Promise<string>
    {
        var json : any = {};
        var house = this.getHouse(houseId);

        await this.httpService.refreshHouseData();
        try
        {
            json = {"success":true, "data":this.makeJsonObjectForHouse(house)};
            this.setLastConnectionInfo(true);
        }
        catch
        {
            json = {"success":false, "reason":`The house with id ${houseId} does not exists.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }
    
    /**
     * Create a JSON object for a given device.
     * @param device The device the JSON object created for.
     */
    private makeJsonObjectForDevice(device : Device) : any
    {
        var properties = device.getProperties();
        var json : any = {};

        json = {"eufyDeviceId":device.getId(), "deviceType":this.devices.getDeviceTypeAsString(device), "model":device.getModel(), "modelName":this.devices.getDeviceModelName(device), "name":device.getName(), "hardwareVersion":device.getHardwareVersion(), "softwareVersion":device.getSoftwareVersion(), "stationSerialNumber":device.getStationSerial()};

        for(var property in properties)
        {
            switch (property)
            {
                case PropertyName.Model:
                case PropertyName.Name:
                case PropertyName.HardwareVersion:
                case PropertyName.SoftwareVersion:
                case PropertyName.DeviceStationSN:
                    break;
                case PropertyName.DevicePictureUrl:
                    json[property] = properties[property] == undefined ? "n/a" : properties[property];
                    json.pictureTime = this.getApiUsePushService() == false ? "n/d" : (this.devices.getLastVideoTime(device.getSerial()) == undefined ? "n/a" : this.devices.getLastVideoTime(device.getSerial()));
                    break;
                default:
                    json[property] = properties[property] == undefined ? "n/a" : properties[property];
            }
        }

        return json;
    }

    /**
     * Returns a JSON-Representation of all devices.
     */
    public async getDevicesAsJSON() : Promise<string> 
    {
        var json : any = {};
        try
        {
            //await this.httpService.refreshStationData();
            await this.httpService.refreshDeviceData();
            
            await this.updateDeviceData();
            await this.devices.loadDevices();
            
            var devices = this.getDevices();
            if(this.devices)
            {
                if(devices)
                {
                    json = {"success":true, "data":[]};
                    for (var deviceSerial in devices)
                    {
                        json.data.push(this.makeJsonObjectForDevice(devices[deviceSerial]));
                    }
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":"No devices found."};
                    this.setLastConnectionInfo(false);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at getDevices().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns all devices as Devices-object
     * @returns All devices as object
     */
    public async getRawDevices() : Promise<Devices> 
    {
        await this.httpService.refreshDeviceData();
        await this.updateDeviceData();
        await this.devices.loadDevices();
            
        return this.devices;
    }

    /**
     * Returns a JSON-Representation of a given devices.
     */
    public async getDeviceAsJSON(deviceSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            //await this.httpService.refreshStationData();
            await this.httpService.refreshDeviceData();
            
            await this.updateDeviceData();
            await this.devices.loadDevices();
            
            var device = this.getDevices()[deviceSerial];
            if(this.devices)
            {
                if(device)
                {
                    json = {"success":true, "data":this.makeJsonObjectForDevice(device)};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":"No devices found."};
                    this.setLastConnectionInfo(false);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at getDevice().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }
        
        return JSON.stringify(json);
    }

    /**
     * Returns a JSON string with the device properties metadata.
     * @param deviceSerial The device serial for the device.
     * @returns JSON string with all properties metadata.
     */
    public async getDevicePropertiesMetadataAsJSON(deviceSerial : string) : Promise<string>
    {
        var device = this.getDevices()[deviceSerial];
        var json : any = {};
        if(device)
        {
            try
            {
                json = {"success":true, "model":device.getModel(), "modelName":this.devices.getDeviceModelName(device), "data":device.getPropertiesMetadata()};
                this.setLastConnectionInfo(true);
            }
            catch (e : any)
            {
                json = {"success":false, "reason":e.message};
                this.setLastConnectionInfo(false);
            }
        }
        else
        {
            json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }


    /**
     * Returns a JSON string with the device properties.
     * @param deviceSerial The device serial for the device.
     * @returns JSON string with all properties.
     */
    public async getDevicePropertiesAsJSON(deviceSerial : string) : Promise<string>
    {
        var device = this.getDevices()[deviceSerial];
        var json : any = {};
        if(device)
        {
            try
            {
                json = {"success":true, "model":device.getModel(), "modelName":this.devices.getDeviceModelName(device), "data":device.getProperties()};
                this.setLastConnectionInfo(true);
            }
            catch (e : any)
            {
                json = {"success":false, "reason":e.message};
                this.setLastConnectionInfo(false);
            }
        }
        else
        {
            json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }

    /**
     * Set a given value to a given property for a given device.
     * @param deviceSerial The serial of the device.
     * @param propertyName The name of the property.
     * @param propertyValue The value of the property.
     * @returns A JSON-String.
     */
    public async setDeviceProperty(deviceSerial : string, propertyName : string, propertyValue : unknown) : Promise<string>
    {
        if(!this.devices.existDevice(deviceSerial))
        {
            return `{"success":false,"reason":"The device with serial ${deviceSerial} does not exists."}`;
        }
        try
        {
            await this.devices.setDeviceProperty(deviceSerial, propertyName, propertyValue);
            await sleep(5000);
            return `{"success":true,"reason":"The property ${propertyName} for device ${deviceSerial} has been processed."}`;
        }
        catch (e)
        {
            if (e instanceof InvalidPropertyError)
            {
                return `{"success":false,"reason":"The device ${deviceSerial} does not support the property ${propertyName}."}`;
            }
            else if (e instanceof ReadOnlyPropertyError)
            {
                return `{"success":false,"reason":"The property ${propertyName} is read only."}`;
            }
            else
            {
                return `{"success":false,"reason":"Other error occured."}`;
            }
        }
    }

    /**
     * Create a JSON object for a given station.
     * @param station The station the JSON object created for.
     */
    private makeJsonObjectForStation(station : Station) : any
    {
        var properties = station.getProperties();
        var json : any = {};

        json = {"eufyDeviceId":station.getId(), "deviceType":station.getDeviceTypeString(), "wanIpAddress":station.getIPAddress(), "isP2PConnected":station.isConnected()};
        for (var property in properties)
        {
            switch (property)
            {
                case PropertyName.Model:
                    json[property] = properties[property];
                    json.modelName = this.stations.getStationModelName(station);
                    break;
                case PropertyName.StationGuardMode:
                    json[property] = properties[property] == undefined ? "n/a" : properties[property];
                    json.guardModeTime = this.getStateUpdateEventActive() == false ? "n/d" : (this.stations.getLastGuardModeChangeTime(station.getSerial()) == undefined ? "n/a" : this.stations.getLastGuardModeChangeTime(station.getSerial()));
                    break;
                case PropertyName.StationHomeSecuritySettings:
                case PropertyName.StationAwaySecuritySettings:
                    json[property] = properties[property];
                    break;
                default:
                    json[property] = properties[property] == undefined ? "n/a" : properties[property];
            }
        }

        return json;
    }

    /**
     * Returns a JSON-Representation of all stations including the guard mode.
     */
    public async getStationsAsJSON() : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                await this.stations.loadStations();

                var stations = await this.getStations();

                if(stations)
                {
                    json = {"success":true, "data":[]};
                    for (var stationSerial in stations)
                    {
                        json.data.push(this.makeJsonObjectForStation(stations[stationSerial]));
                    }
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":"No stations found."};
                    this.setLastConnectionInfo(false);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at getStations().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Get all stations as Stations-object.
     * @returns All stations as object.
     */
    public async getRawStations() : Promise<Stations> 
    {
        await this.httpService.refreshStationData();
        await this.updateDeviceData();
        await this.stations.loadStations();
            
        return this.stations;
    }

    /**
     * Returns a JSON string with the station properties metadata.
     * @param stationSerial The station serial for the station.
     * @returns JSON string with all properties metadata.
     */
    public async getStationPropertiesMetadataAsJSON(stationSerial : string) : Promise<string>
    {
        var station = await this.getStation(stationSerial);
        var json : any = {};
        if(station)
        {
            try
            {
                json = {"success":true, "type":station.getModel(), "modelName":this.stations.getStationModelName(station), "data":station.getPropertiesMetadata()};
                this.setLastConnectionInfo(true);
            }
            catch (e : any)
            {
                json = {"success":false, "reason":e.message};
                this.setLastConnectionInfo(false);
            }
        }
        else
        {
            json = {"success":false, "reason":`The station with serial ${stationSerial} does not exists.`};
            this.setLastConnectionInfo(false);
        }
        return JSON.stringify(json);
    }


    /**
     * Returns a JSON string with the station properties metadata.
     * @param stationSerial The device serial for the station.
     * @returns JSON string with all properties metadata.
     */
    public async getStationPropertiesAsJSON(stationSerial : string) : Promise<string>
    {
        var station = await this.getStation(stationSerial);
        var json : any = {};
        if(station)
        {
            try
            {
                json = {"success":true, "type":station.getModel(), "modelName":this.stations.getStationModelName(station), "data":station.getProperties()};
                this.setLastConnectionInfo(true);
            }
            catch (e : any)
            {
                json = {"success":false, "reason":e.message};
                this.setLastConnectionInfo(false);
            }
        }
        else
        {
            json = {"success":false, "reason":`The station with serial ${stationSerial} does not exists.`};
            this.setLastConnectionInfo(false);
        }
        return JSON.stringify(json);
    }

    /**
     * Set a given value to a given property for a given station.
     * @param stationSerial The serial of the station.
     * @param propertyName The name of the property.
     * @param propertyValue The value of the property.
     * @returns A JSON-String.
     */
    public async setStationProperty(stationSerial : string, propertyName : string, propertyValue : unknown) : Promise<string>
    {
        if(!this.stations.existStation(stationSerial))
        {
            return `{"success":false,"reason":"The station with serial ${stationSerial} does not exists."}`;
        }
        try
        {
            await this.stations.setStationProperty(stationSerial, propertyName, propertyValue);
            await sleep(5000);
            return `{"success":true,"reason":"The property ${propertyName} for station ${stationSerial} has been processed."}`;
        }
        catch (e)
        {
            if (e instanceof InvalidPropertyError)
            {
                return `{"success":false,"reason":"The station ${stationSerial} does not support the property ${propertyName}."}`;
            }
            else if (e instanceof ReadOnlyPropertyError)
            {
                return `{"success":false,"reason":"The property ${propertyName} is read only."}`;
            }
            else
            {
                return `{"success":false,"reason":"Other error occured."}`;
            }
        }
    }

    /**
     * Returns a JSON-Representation of a given station.
     */
    public async getStationAsJSON(stationSerial : string) : Promise<string>
    {
        await this.httpService.refreshStationData();

        await this.stations.loadStations();

        var station = await this.getStation(stationSerial);
        var json : any = {};
        if(station)
        {
            try
            {
                json = {"success":true, "data":this.makeJsonObjectForStation(station)};
                this.setLastConnectionInfo(true);
            }
            catch (e : any)
            {
                json = {"success":false, "reason":e.message};
                this.setLastConnectionInfo(false);
            }
        }
        else
        {
            json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }

    /**
     * Snoozes a given device for a given time.
     * @param device The device as object.
     * @param timeoutMS The snooze time in ms.
     */
    public setDeviceSnooze(device : Device, timeoutMS : number) : void
    {
        this.devices.setDeviceSnooze(device, timeoutMS);
    }

    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    public updateDeviceProperties(deviceSerial : string, values : RawValues) : void
    {
        this.devices.updateDeviceProperties(deviceSerial, values);
    }

    /**
     * Retrieves all config-relevat data for each station and update the config.
     * @param stations All stations in the account.
     */
    public async saveStationsSettings(stations : { [stationSerial : string] : Station }) : Promise<void>
    {
        if(this.stations)
        {
            for (var stationSerial in stations)
            {
                var station = stations[stationSerial];

                var p2pDid = this.config.getP2PDataP2pDid(stationSerial);
                var stationIpAddress = this.config.getP2PDataStationIpAddress(stationSerial);

                var updateNeed = false;

                if(p2pDid != station.getP2pDid() || stationIpAddress != station.getLANIPAddress())
                {
                    updateNeed = true;
                }

                if(updateNeed == true)
                {
                    this.config.setP2PData(stationSerial, station.getP2pDid(), (station.getLANIPAddress()).toString());
                }
            }
        }
    }

    /**
     * Returns the guard mode of all stations as json string.
     */
    public async getGuardMode() : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                await this.stations.loadStations();

                var mode = -1;
                var stations = await this.getStations();

                if(stations)
                {
                    json = {"success":true, "data":[]};
                    for (var stationSerial in stations)
                    {
                        json.data.push(this.makeJsonObjectForStation(stations[stationSerial]));

                        if(mode == -1)
                        {
                            mode = stations[stationSerial].getGuardMode() as number;
                        }
                        else if (mode != stations[stationSerial].getGuardMode())
                        {
                            mode = -2;
                        }
                    
                        this.updateStationGuardModeSystemVariable(stations[stationSerial].getSerial(), stations[stationSerial].getGuardMode());
                    }

                    if(mode > -1)
                    {
                        this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(mode));
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }
                    else
                    {
                        this.setSystemVariableString("eufyCurrentState", "unbenkannt");
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }

                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":"No stations found."};
                    this.setLastConnectionInfo(false);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at getGuardMode().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns the guard mode of all stations.
     */
    public async getGuardModeAsGuardMode() : Promise<GuardMode>
    {
        var mode = -1;
        try
        {
            if(this.stations)
            {
                await this.stations.loadStations();

                var stations = await this.getStations();
                var station : Station;

                if(stations)
                {
                    for (var stationSerial in stations)
                    {
                        station = stations[stationSerial];
                        if(mode == -1)
                        {
                            mode = station.getGuardMode() as number;
                        }
                        else if (mode != station.getGuardMode())
                        {
                            mode = -2;
                        }
                    }
                }
            }
        }
        catch (e)
        {
            mode = -1
        }

        if(mode < -1)
        {
            mode = -1;
        }

        return mode;
    }

    /**
     * Returns the guard mode of one stations.
     */
    public async getGuardModeStation (stationSerial : string) : Promise<string>
    {
        await this.httpService.refreshStationData();

        await this.stations.loadStations();

        var station = await this.getStation(stationSerial);
        var json : any = {};
        if(station)
        {
            try
            {
                json = {"success":true, "data":this.makeJsonObjectForStation(station)};
                this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                this.setLastConnectionInfo(true);
                this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                if(this.stations.getLastGuardModeChangeTime(station.getSerial()) == undefined)
                {
                    this.setSystemVariableString("eufyLastModeChangeTime" + station.getSerial(), "n/a");
                }
                else
                {
                    this.setSystemVariableTime("eufyLastModeChangeTime" + station.getSerial(), new Date(this.stations.getLastGuardModeChangeTime(station.getSerial()) ?? 0));
                }
            }
            catch (e : any)
            {
                this.logError("Error occured at getGuardModeStation().");
                json = {"success":false, "reason":e.message};
                this.setLastConnectionInfo(false);
            }
        }
        else
        {
            json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }

    /**
     * Update the guard mode for a given station.
     * @param stationSerial The serialnumber of the station.
     */
    public async updateGuardModeStation(stationSerial : string) : Promise<void>
    {
        await this.getGuardModeStation(stationSerial);
        if(this.waitUpdateState)
        {
            clearTimeout(this.waitUpdateState);
        }
        this.waitUpdateState = setTimeout(async() => { await this.updateGuardModeStations(); }, 10000);
    }

    /**
     * Update guard mode when changed by event.
     */
    private async updateGuardModeStations() : Promise<void>
    {
        if(this.waitUpdateState)
        {
            clearTimeout(this.waitUpdateState);
        }
        await this.getGuardMode();
    }

    /**
     * Set the guard mode of all stations to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode : GuardMode) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                var err = 0;
                var res = await this.stations.setGuardMode(guardMode);

                if(res == true)
                {
                    var stations = await this.getStations();
                    var station : Station;

                    json = {"success":true, "data":[]};
                    for (var stationSerial in stations)
                    {
                        station = stations[stationSerial];
                        
                        if(guardMode == station.getGuardMode())
                        {
                            json.data.push({"stationSerial":station.getSerial(), "result":"success", "guardMode":station.getGuardMode()});
                            this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                        }
                        else
                        {
                            err = err + 1;
                            json.data.push({"stationSerial":station.getSerial(), "result":"failure", "guardMode":station.getGuardMode()});
                            this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                            this.logError(`Error occured at setGuardMode: Failed to switch mode for station ${station.getSerial()}.`);
                        }
                    }
                    if (err==0)
                    {
                        this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(guardMode));
                        this.setLastConnectionInfo(true);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }
                    else
                    {
                        json.success = false;
                        this.setSystemVariableString("eufyCurrentState", "unbekannt");
                        this.setLastConnectionInfo(false);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                        this.logError("Error occured at setGuardMode: Failed to switch mode for station.");
                    }
                }
                else
                {
                    json = {"success":false, "reason":"Failed to communicate with station."};
                    this.logError("Error occured at setGuardMode: Failed to communicate with station.");
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
                this.setLastConnectionInfo(false);
                this.logError("Error occured at setGuardMode: No connection to eufy.");
            }
        }
        catch (e : any)
        {
            this.logError(`Error occured at setGuardMode: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Set the guard mode for the given station to the given mode.
     * @param stationSerial The serial of the station the mode to change.
     * @param guardMode The target guard mode.
     */
    public async setGuardModeStation(stationSerial : string, guardMode : GuardMode) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                if(this.devices.existDevice(stationSerial) == true)
                {
                    const device : Device = this.getDevices()[stationSerial];
                    if(device.isEnabled() == false)
                    {
                        await this.setPrivacyMode(stationSerial, true);
                    }
                }

                var res = await this.stations.setGuardModeStation(stationSerial, guardMode);

                //var stations = await this.getStations();
                
                var station = await this.getStation(stationSerial);

                if(res)
                {
                    json = {"success":true, "data":[]};
                    json.data.push({"stationSerial":station.getSerial(), "result":"success", "guardMode":station.getGuardMode()});
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(true);
                    if(this.stations.getLastGuardModeChangeTime(station.getSerial()) == undefined)
                    {
                        this.setSystemVariableString("eufyLastModeChangeTime" + station.getSerial(), "n/a");
                    }
                    else
                    {
                        this.setSystemVariableTime("eufyLastModeChangeTime" + station.getSerial(), new Date(this.stations.getLastGuardModeChangeTime(station.getSerial()) ?? 0));
                    }
                }
                else
                {
                    json = {"success":false, "data":[]};
                    json.data.push({"stationSerial":station.getSerial(), "result":"failure", "guardMode":station.getGuardMode()});
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(false);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    this.logError(`Error occured at setGuardMode: Failed to switch mode for station ${station.getSerial()}.`);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
                this.setLastConnectionInfo(false);
                this.logError("Error occured at setGuardMode: No connection eo eufy.");
            }
        }
        catch (e : any)
        {
            this.logError(`Error occured at setGuardMode: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Set the systemvariable for a given station.
     * @param stationSerial The serial of the station.
     * @param guardMode The guard mode to set.
     */
    public updateStationGuardModeSystemVariable(stationSerial : string, guardMode : PropertyValue)
    {
        this.setSystemVariableString("eufyCentralState" + stationSerial, this.convertGuardModeToString(guardMode as GuardMode));
    }

    /**
     * Enable or disable the privacy mode of the device.
     * @param deviceSerial The serial of the device.
     * @param value The value to set.
     * @returns A JSON string with the result.
     */
    public async setPrivacyMode(deviceSerial : string, value : any) : Promise<string>
    {
        if(this.devices.existDevice(deviceSerial) == true)
        {
            const device : Device = await this.getDevices()[deviceSerial];
            if(device.isIndoorCamera())
            {
                if(device.isEnabled() == value)
                {
                    return `{"success":true,"info":"The value for privacy mode on device ${deviceSerial} already set."}`;
                }
                else
                {
                    await this.devices.setDeviceProperty(deviceSerial, PropertyName.DeviceEnabled, value);
                    await sleep(2500);
                    await this.updateDeviceData();
                    await this.httpService.refreshStationData();
                    //await this.httpService.refreshDeviceData();
                    await this.devices.loadDevices();
                    if(await this.getDevices()[deviceSerial].isEnabled() == value as boolean)
                    {
                        return `{"success":true,"enabled":${value as boolean}}`;
                    }
                    else
                    {
                        return `{"success":false,"enabled":${!(value as boolean)}}`;
                    }
                }
            }
            else
            {
                return `{"success":false,"reason":"Device ${deviceSerial} does not support privacy mode."}`;
            }
        }
        else
        {
            return `{"success":false,"reason":"Device ${deviceSerial} does not exists."}`;
        }
    }

    /**
     * Update the library (at this time only image and the corrospondending datetime) from the devices.
     */
    public async getLibrary() : Promise<string>
    {
        await this.httpService.refreshStationData();
        await this.httpService.refreshDeviceData();
                
        var json : any = {};
        try
        {
            if(this.devices)
            {
                await this.updateDeviceData();
                await this.devices.loadDevices();

                var devices = this.getDevices();
                var device;

                if(devices)
                {
                    json = {"success":true, "data":[]};
                    for (var deviceSerial in devices)
                    {
                        device = devices[deviceSerial];
                        if(this.devices.getDeviceTypeAsString(device) == "camera")
                        {
                            device = devices[deviceSerial] as Camera;
                            json.data.push({"deviceSerial":deviceSerial, "pictureUrl":(device.getLastCameraImageURL() != undefined) ? device.getLastCameraImageURL() : "", "pictureTime":this.devices.getLastVideoTime(deviceSerial) == undefined ? "n/a" : this.devices.getLastVideoTime(deviceSerial), "videoUrl":device.getLastCameraVideoURL() == "" ? this.config.getCameraDefaultVideo() : device.getLastCameraVideoURL()});
                            if(device.getLastCameraImageURL() == undefined)
                            {
                                this.setSystemVariableString("eufyCameraImageURL" + deviceSerial, this.config.getCameraDefaultImage());
                            }
                            else
                            {
                                this.setSystemVariableString("eufyCameraImageURL" + deviceSerial, device.getLastCameraImageURL() as string);
                            }
                            if(device.getLastCameraVideoURL() == "")
                            {
                                this.setSystemVariableString("eufyCameraVideoURL" + deviceSerial, this.config.getCameraDefaultVideo());
                            }
                            else
                            {
                                this.setSystemVariableString("eufyCameraVideoURL" + deviceSerial, device.getLastCameraVideoURL());
                            }
                        }
                    }
                    this.setSystemVariableTime("eufyLastLinkUpdateTime", new Date());
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":"No devices found."};
                    this.setLastConnectionInfo(false);
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at getLibrary().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Updates the last guard mode change time systemvariable for a given station.
     * @param stationSerial The serial of the station.
     * @param timestamp The timestamp to set.
     */
    public updateStationGuardModeChangeTimeSystemVariable(stationSerial : string, timestamp : number | undefined)
    {
        if(this.getStateUpdateEventActive() == true && timestamp != undefined)
        {
            this.setSystemVariableTime("eufyLastModeChangeTime" + stationSerial, new Date(timestamp));
        }
        else
        {
            this.setSystemVariableString("eufyLastModeChangeTime" + stationSerial, "n/a");
        }
        this.updateGlobalStationGuardModeChangeTimeSystemVariable();
    }

    /**
     * Update the global station guard mode change time systemvariable.
     */
    public async updateGlobalStationGuardModeChangeTimeSystemVariable()
    {
        var stations = await this.getStations();
        var station;
        var tempModeChange;
        var lastModeChange = new Date(1970, 1, 1);

        for (var stationSerial in stations)
        {
            station = stations[stationSerial]
            tempModeChange = new Date(this.stations.getLastGuardModeChangeTime(station.getSerial()) ?? 0)
            if(lastModeChange < tempModeChange)
            {
                lastModeChange = tempModeChange;
            }
        }
        this.setSystemVariableTime("eufyLastModeChangeTime", lastModeChange);
    }

    /**
     * Updates the last camera event time systemvariable for a given device.
     * @param deviceSerial The serial of the device.
     * @param timestamp The timestamp to set.
     */
    public updateCameraEventTimeSystemVariable(deviceSerial : string, timestamp : number | undefined)
    {
        if(this.getApiUsePushService() == true && timestamp != undefined)
        {
            this.setSystemVariableTime("eufyCameraVideoTime" + deviceSerial, new Date(timestamp));
        }
        else
        {
            this.setSystemVariableString("eufyCameraVideoTime" + deviceSerial, "n/a");
        }
    }

    /**
     * Get the Token from config.
     */
    public getToken() : string
    {
        return this.config.getToken();
    }

    /**
     * Get the time of expire for the token from the config.
     */
    public getTokenExpire() : number
    {
        return this.config.getTokenExpire();
    }

    /**
     * Save the new token and token expire to the config.
     * @param token The token.
     * @param tokenExpire The time the token exprire.
     */
    public setTokenData(token : string, tokenExpire : number) : string
    {
        var res;
        var json = "";
        this.config.setToken(token);
        this.config.setTokenExpire(tokenExpire);
        res = this.config.writeConfig();
        if(res == "saved" || res == "ok")
        {
            json = `{"success":true,"dataRemoved":true}`;
        }
        else
        {
            json = `{"success":false,"dataRemoved":false}`;
        }
        return json;
    }

    /**
     * Returns if the api use HTTP
     */
    public getHttpActive() : boolean
    {
        return this.config.getHttpActive();
    }

    /**
     * Get the port (HTTP) used for the api.
     */
    public getHttpPort() : number
    {
        return this.config.getHttpPort();
    }

    /**
     * Return if the api use HTTPS
     */
    public getHttpsActive() : boolean
    {
        return this.config.getHttpsActive();
    }

    /**
     * Get the port (HTTPS) used for the api.
     */
    public getHttpsPort() : number
    {
        return this.config.getHttpsPort();
    }

    /**
     * Returns the key for the HTTPS connection.
     */
    public getHttpsPKeyFile() : string
    {
        return this.config.getHttpsPKeyFile();
    }

    /**
     * Returns the cert file for https connection.
     */
    public getHttpsCertFile() : string
    {
        return this.config.getHttpsCertFile();
    }

    /**
     * Returns true if static udp ports should be used otherwise false.
     */
    public getLocalStaticUdpPortsActive() : boolean
    {
        return this.config.getLocalStaticUdpPortsActive();
    }

    /**
     * Returns the ports should be used for communication with stations.
     */
    public async getLocalStaticUdpPorts() : Promise<any[]>
    {
        var json : any = [];
        if(this.stations)
        {
            var stations = await this.getStations();

            if(stations)
            {
                for (var stationSerial in stations)
                {
                    json.push({"stationSerial":stationSerial, "port":this.config.getLocalStaticUdpPortPerStation(stationSerial)});
                }
            }
        }
        return json;
    }

    /**
     * Returns the specified UDP port for communication with the station.
     * @param stationSerial The serial for the station.
     * @returns The UDP port for the connection to the station.
     */
    public getLocalStaticUdpPortForStation(stationSerial : string) : number | null
    {
        if(this.getLocalStaticUdpPortsActive() == true)
        {
            try
            {
                return this.config.getLocalStaticUdpPortPerStation(stationSerial);
            }
            catch
            {
                return null;
            }
        }
        else
        {
            return null;
        }
    }

    /**
     * Returns the internal ip address for the given the station.
     * @param stationSerial The serial for the station.
     * @returns The internal ip address.
     */
    public getLocalIpAddressForStation(stationSerial : string) : string
    {
        try
        {
            return this.config.getP2PDataStationIpAddress(stationSerial);
        }
        catch
        {
            return "";
        }
    }

    /**
     * Determines if the updated state runs by event.
     */
    public getStateUpdateEventActive() : boolean
    {
        return this.config.getStateUpdateEventActive();
    }

    public getConfig() : Config
    {
        return this.config;
    }

    /**
     * Get all config data needed for the webui.
     */
    public async getAPIConfig() : Promise<string>
    {
        var json : any = {};
        
        json = {"success":true, "data":{}};
        json.data = {"configVersion":this.config.getConfigFileVersion(), "eMail":this.config.getEmailAddress(), "password":this.config.getPassword(), "country":this.config.getCountry(), "language":this.config.getLanguage(), "httpActive":this.config.getHttpActive(), "httpPort":this.config.getHttpPort(), "httpsActive":this.config.getHttpsActive(), "httpsPort":this.config.getHttpsPort(), "httpsPKeyFile":this.config.getHttpsPKeyFile(), "httpsCertFile":this.config.getHttpsCertFile(), "connectionTypeP2p":this.config.getConnectionType(), "localStaticUdpPortsActive":this.config.getLocalStaticUdpPortsActive(), "localStaticUdpPorts": [], "systemVariableActive":this.config.getSystemVariableActive(), "cameraDefaultImage":this.config.getCameraDefaultImage(), "cameraDefaultVideo":this.config.getCameraDefaultVideo(), "updateCloudInfoIntervall": this.config.getUpdateCloudInfoIntervall(), "updateDeviceDataIntervall": this.config.getUpdateDeviceDataIntervall(), "stateUpdateEventActive":this.config.getStateUpdateEventActive(), "stateUpdateIntervallActive":this.config.getStateUpdateIntervallActive(), "stateUpdateIntervallTimespan":this.config.getStateUpdateIntervallTimespan(), "updateLinksActive":this.config.getUpdateLinksActive(), "updateLinksOnlyWhenArmed":this.config.getUpdateLinksOnlyWhenArmed(), "updateLinksTimespan":this.config.getUpdateLinksTimespan(), "pushServiceActive":this.config.getPushServiceActive(), "logLevel":this.config.getLogLevel()};
        json.data.localStaticUdpPorts = await this.getLocalStaticUdpPorts();
        return JSON.stringify(json);
    }

    /**
     * Save the config got from webui.
     * @param eMail The eMail address for the eufy security account.
     * @param password The password for the eufy security account.
     * @param country The country the eufy account is created for.
     * @param language The language the eufy account is using.
     * @param httpActive Should the api use http.
     * @param httpPort The http port for the api.
     * @param httpsActive Should the api use https.
     * @param httpsPort The https port for the api.
     * @param httpsKeyFile The key for https.
     * @param httpsCertFile The cert for https.
     * @param connectionTypeP2p The connection type for connecting with station.
     * @param localStaticUdpPortsActive Should the api use static ports to connect with station.
     * @param localStaticUdpPorts The local ports for connection with station.
     * @param systemVariableActive Should the api update related systemvariables.
     * @param cameraDefaultImage The path to the default image.
     * @param cameraDefaultVideo The path to the default video.
     * @param stateUpdateEventActive Should the api use station events for updateing the state.
     * @param stateUpdateIntervallActive Should the api schedule a task for updateing the state.
     * @param stateUpdateIntervallTimespan The time between two scheduled runs of update state.
     * @param updateLinksActive Should the api schedule a task for updateing the links.
     * @param updateLinksOnlyWhenArmed Should the api only refreah links when state is active
     * @param updateLinksTimespan The time between two scheduled runs of update links.
     * @param pushServiceActive Should the api use push service.
     * @param logLevel The log level.
     * @returns 
     */
    public async setConfig(eMail : string, password : string, country : string, language : string, httpActive : boolean, httpPort : number, httpsActive : boolean, httpsPort : number, httpsKeyFile : string, httpsCertFile : string, connectionTypeP2p : number, localStaticUdpPortsActive : boolean, localStaticUdpPorts : string[][], systemVariableActive : boolean, cameraDefaultImage : string, cameraDefaultVideo : string, stateUpdateEventActive : boolean, stateUpdateIntervallActive : boolean, stateUpdateIntervallTimespan : number, updateLinksActive : boolean, updateLinksOnlyWhenArmed : boolean, updateLinksTimespan : number, pushServiceActive : boolean, logLevel : number) : Promise<string>
    {
        var serviceRestart = false;
        var taskSetupStateNeeded = false;
        var taskSetupLinksNeeded = false;
        if(this.config.getEmailAddress() != eMail || this.config.getPassword() != password || this.config.getHttpActive() != httpActive || this.config.getHttpPort() != httpPort || this.config.getHttpsActive() != httpsActive || this.config.getHttpsPort() != httpsPort || this.config.getHttpsPKeyFile() != httpsKeyFile || this.config.getHttpsCertFile() != httpsCertFile || this.config.getConnectionType() != connectionTypeP2p || this.config.getLocalStaticUdpPortsActive() != localStaticUdpPortsActive || this.config.getStateUpdateEventActive() != stateUpdateEventActive)
        {
            serviceRestart = true;
        }

        if(this.config.getEmailAddress() != eMail)
        {
            this.setTokenData("", 0);
        }
        this.config.setEmailAddress(eMail);
        this.config.setPassword(password);
        this.config.setCountry(country);
        this.config.setLanguage(language);
        this.config.setHttpActive(httpActive);
        this.config.setHttpPort(httpPort);
        this.config.setHttpsActive(httpsActive);
        this.config.setHttpsPort(httpsPort);
        this.config.setHttpsPKeyFile(httpsKeyFile);
        this.config.setHttpsCertFile(httpsCertFile);
        this.config.setConnectionType(connectionTypeP2p);
        this.config.setLocalStaticUdpPortsActive(localStaticUdpPortsActive);
        if(localStaticUdpPorts[0][0] == undefined || localStaticUdpPortsActive == false)
        {
            if(this.stations)
            {
                var stations = await this.getStations();
                if(stations)
                {
                    for (var stationSerial in stations)
                    {
                        if(this.config.setLocalStaticUdpPortPerStation(stationSerial, null) == true)
                        {
                            serviceRestart = true;
                        }
                    }
                }
            }
        }
        else
        {
            if(this.config.setLocalStaticUdpPorts(localStaticUdpPorts) == true)
            {
                serviceRestart = true;
            }
        }
        this.config.setSystemVariableActive(systemVariableActive);
        this.config.setCameraDefaultImage(cameraDefaultImage);
        this.config.setCameraDefaultVideo(cameraDefaultVideo);
        this.config.setStateUpdateEventActive(stateUpdateEventActive);
        if(this.config.getStateUpdateIntervallActive() == true && stateUpdateIntervallActive == false)
        {
            this.clearScheduledTask(this.taskUpdateState, "getState");
        }
        else if(this.config.getStateUpdateIntervallActive() != stateUpdateIntervallActive)
        {
            taskSetupStateNeeded = true;
        }
        this.config.setStateUpdateIntervallActive(stateUpdateIntervallActive);
        if(this.config.getStateUpdateIntervallTimespan() != stateUpdateIntervallTimespan)
        {
            taskSetupStateNeeded = true;
        }
        this.config.setStateUpdateIntervallTimespan(stateUpdateIntervallTimespan);
        if(this.config.getUpdateLinksActive() == true && updateLinksActive == false)
        {
            this.clearScheduledTask(this.taskUpdateLinks, "getLibrary");
        }
        else if(this.config.getUpdateLinksActive() != updateLinksActive)
        {
            taskSetupLinksNeeded = true;
        }
        this.config.setUpdateLinksActive(updateLinksActive);
        this.config.setUpdateLinksOnlyWhenArmed(updateLinksOnlyWhenArmed);
        if(this.config.getUpdateLinksTimespan() != updateLinksTimespan)
        {
            taskSetupLinksNeeded = true;
        }
        this.config.setUpdateLinksTimespan(updateLinksTimespan);
        if(taskSetupStateNeeded == true)
        {
            this.setupScheduledTask(this.taskUpdateState, "getState");
        }
        if(taskSetupLinksNeeded == true)
        {
            this.setupScheduledTask(this.taskUpdateLinks, "getLibrary");
        }
        this.config.setPushServiceActive(pushServiceActive);
        this.config.setLogLevel(logLevel);

        var res = this.config.writeConfig();
        if(res == "saved")
        {
            return `{"success":true,"serviceRestart":${serviceRestart},"message":"Config saved."}`;
        }
        else if(res == "ok")
        {
            return `{"success":true,"serviceRestart":${serviceRestart},"message":"No change in config. Write config not neccesary."}`;
        }
        else
        {
            return `{"success":false,"serviceRestart":false,"message":"Error during writing config."}`;
        }
    }

    /**
     * Write config to file.
     */
    public writeConfig() : string
    {
        var res = this.config.writeConfig();
        if(res == "saved")
        {
            return `{"success":true,"message":"Config saved."}`;
        }
        else if(res == "ok")
        {
            return `{"success":true,"message":"No new values in config. Write config not neccesary."}`;
        }
        else
        {
            return `{"success":false,"serviceRestart":false,"message":"Error during writing config."}`;
        }
    }

    /**
     * Check if all system variables are created on the CCU
     */
    public async checkSystemVariables() : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.config.getSystemVariableActive() == true)
            {
                if(this.stations && this.devices)
                {
                    await this.loadData();

                    var station : Station;
                    var device : Device;
                    var stations = await this.getStations();
                    var devices = this.getDevices();

                    var commonSystemVariablesName = ["eufyCurrentState", "eufyLastConnectionResult", "eufyLastConnectionTime", "eufyLastLinkUpdateTime", "eufyLastStatusUpdateTime","eufyLastModeChangeTime"];
                    var commonSystemVariablesInfo = ["aktueller Modus des eufy Systems", "Ergebnis der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Aktualisierung der eufy Links", "Zeitpunkt der letzten Aktualisierung des eufy Systemstatus","Zeitpunkt des letzten Moduswechsels"];

                    json = {"success":true, "data":[]};
                    var i = 0;

                    for (var sv of commonSystemVariablesName)
                    {
                        json.data.push({"sysVarName":sv, "sysVarInfo":commonSystemVariablesInfo[i], "sysVarAvailable":await this.homematicApi.isSystemVariableAvailable(sv)});
                        i = i + 1;
                    }

                    for (var stationSerial in stations)
                    {
                        station = stations[stationSerial];
                        
                        json.data.push({"sysVarName":`eufyCentralState${station.getSerial()}`, "sysVarInfo":`aktueller Status der Basis ${station.getSerial()}`, "sysVarAvailable":await this.homematicApi.isSystemVariableAvailable("eufyCentralState" + station.getSerial())});
                        json.data.push({"sysVarName":`eufyLastModeChangeTime${station.getSerial()}`, "sysVarInfo":`Zeitpunkt des letzten Moduswechsels der Basis ${station.getSerial()}`, "sysVarAvailable":await this.homematicApi.isSystemVariableAvailable("eufyLastModeChangeTime" + station.getSerial())});
                    }
                    
                    for (var deviceSerial in devices)
                    {
                        device = devices[deviceSerial];
                        
                        json.data.push({"sysVarName":`eufyCameraImageURL${device.getSerial()}`, "sysVarInfo":`Standbild der Kamera ${device.getSerial()}`, "sysVarAvailable":await this.homematicApi.isSystemVariableAvailable("eufyCameraImageURL" + device.getSerial())});
                        json.data.push({"sysVarName":`eufyCameraVideoTime${device.getSerial()}`, "sysVarInfo":`Zeitpunkt des letzten Videos der Kamera ${device.getSerial()}`, "sysVarAvailable":await this.homematicApi.isSystemVariableAvailable("eufyCameraVideoTime" + device.getSerial())});
                        json.data.push({"sysVarName":`eufyCameraVideoURL${device.getSerial()}`, "sysVarInfo":`letztes Video der Kamera ${device.getSerial()}`, "sysVarAvailable":await this.homematicApi.isSystemVariableAvailable("eufyCameraVideoURL" + device.getSerial())});
                    }
                }
                else
                {
                    json = {"success":false, "reason":"No connection to eufy."};
                }
            }
            else
            {
                json = {"success":false, "reason":"System variables in config disabled."};
            }
        }
        catch (e : any)
        {
            this.logError("Error occured at checkSystemVariables().");
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":"${e.message}"};
        }

        return JSON.stringify(json);
    }

    /**
     * Create a system variable with the given name and the given info.
     * @param variableName The name of the system variable to create.
     * @param variableInfo The Info for the system variable to create.
     */
    public async createSystemVariable(variableName : string, variableInfo : string) : Promise<string>
    {
        var res = await this.homematicApi.createSystemVariable(variableName, variableInfo);

        if(res == variableName)
        {
            return `{"success":true,"message":"System variable created."}`;
        }
        else
        {
            return `{"success":true,"message":"Error while creating system variable."}`;
        }
    }

    /**
     * Set the state of the last connection with eufy to CCU.
     * @param success The state of the last request with eufy.
     */
    private setLastConnectionInfo(success : boolean)
    {
        var nowDateTime = new Date();

        if(success == true)
        {
            this.setSystemVariableString("eufyLastConnectionResult", "erfolgreich");
            this.setSystemVariableTime("eufyLastConnectionTime", nowDateTime);
        }
        else
        {
            this.setSystemVariableString("eufyLastConnectionResult", "fehlerhaft");
            this.setSystemVariableTime("eufyLastConnectionTime", nowDateTime);
        }
    }

    /**
     * Set a dateTime value to a system variable.
     * @param systemVariable Name of the system variable to set.
     * @param dateTime The dateTime value to set.
     */
    private setSystemVariableTime(systemVariable : string, dateTime : Date)
    {
        this.setSystemVariableString(systemVariable, this.makeDateTimeString(dateTime.getTime()));
    }

    /**
     * Set a value value to a system variable.
     * @param systemVariable Name of the system variable to set.
     * @param newValue The value to set.
     */
    private setSystemVariableString(systemVariable : string, newValue : string)
    {
        if(this.config.getSystemVariableActive() == true)
        {
            this.homematicApi.setSystemVariable(systemVariable, newValue);
        }
    }

    /**
     * Converts the given timestamp to the german dd.mm.yyyy hh:mm string.
     * @param timestamp The timestamp as number.
     */
    private	makeDateTimeString(timestamp : number) : string
    {
        var dateTime = new Date(timestamp);
        return (`${dateTime.getDate().toString().padStart(2,'0')}.${(dateTime.getMonth()+1).toString().padStart(2,'0')}.${dateTime.getFullYear().toString()} ${dateTime.getHours().toString().padStart(2,'0')}:${dateTime.getMinutes().toString().padStart(2,'0')}`);
    }

    /**
     * returns the content of the logfile.
     */
    public async getLogFileContent() : Promise<string>
    {
        return await this.homematicApi.getLogFileContent();
    }

    /**
     * Returns the content of the errorfile
     */
    public async getErrorFileContent() : Promise<string>
    {
        return await this.homematicApi.getErrorFileContent();
    }

    /**
     * Converts the guard mode to a string.
     * @param guardMode The guard mode.
     */
    private convertGuardModeToString(guardMode : GuardMode) : string
    {
        var res = "";
        switch (guardMode)
        {
            case GuardMode.AWAY:
                res = "aktiviert";
                break;
            case GuardMode.CUSTOM1 || GuardMode.CUSTOM2 || GuardMode.CUSTOM3:
                res = "personalisiert";
                break;
            case GuardMode.DISARMED:
                res = "deaktiviert";
                break;
            case GuardMode.GEO:
                res = "geofencing";
                break;
            case GuardMode.HOME:
                res = "zu Hause";
                break;
            case GuardMode.OFF:
                res = "ausgeschaltet";
                break;
            case GuardMode.SCHEDULE:
                res = "Zeitplan";
                break;
            default:
                res = "unbekannt";
        }
        return res;
    }

    /**
     * Returns the P2P connection type determine how to connect to the station.
     * @returns The P2PConnection type.
     */
    public getP2PConnectionType() : P2PConnectionType
    {
        try
        {
            var res = this.config.getConnectionType();
            switch (res)
            {
                case 1:
                    return P2PConnectionType.ONLY_LOCAL;
                case 2:
                    return P2PConnectionType.QUICKEST;
                default:
                    return P2PConnectionType.QUICKEST;
            }
        }
        catch
        {
            return P2PConnectionType.QUICKEST;
        }
    }

    /**
     * Add a given message to the logfile.
     * @param message The message to add to the logfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logInfoBasic(message : string, ...additionalMessages : any) : void
    {
        this.logger.logInfoBasic(message, ...additionalMessages);
    }

    /**
     * Add a given message to the logfile if the loglevel is set to info.
     * @param message The message to add to the logfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logInfo(message : string, ...additionalMessages : any) : void
    {
        this.logger.logInfo(this.config.getLogLevel(), message, ...additionalMessages);
    }

    /** Add a given message to the errorfile and to the logfile if loglevel is set to error.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logError(message : string, ...additionalMessages : any) : void
    {
        this.logger.logError(this.config.getLogLevel(), message, ...additionalMessages);
    }

    /**
     * Add a given message to the logfile if loglevel is set to debug.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logDebug(message : string, ...additionalMessages : any) : void
    {
        this.logger.logDebug(this.config.getLogLevel(), message, ...additionalMessages);
    }

    /**
     * Add a given message to the logfile if loglevel is set to warn.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logWarn(message : string, ...additionalMessages : any) : void
    {
        this.logger.logWarn(this.config.getLogLevel(), message, ...additionalMessages);
    }

    /**
     * Returns the current api log level.
     * @returns The current log level.
     */
    public getApiLogLevel() : number
    {
        return this.config.getLogLevel();
    }

    /**
     * Returns the current value for using push service.
     * @returns A boolean value if push service is enabled or not.
     */
    public getApiUsePushService() : boolean
    {
        return this.config.getPushServiceActive();
    }

    /**
     * Setup all scheduled task, when allowed by settings.
     */
    private setupScheduledTasks() : void
    {
        this.logger.logInfoBasic(`Setting up scheduled tasks...`);
        if(this.taskUpdateDeviceInfo)
        {
            this.logger.logInfoBasic(`  updateDeviceData already scheduled, remove scheduling...`);
            clearInterval(this.taskUpdateDeviceInfo);
        }
        this.taskUpdateDeviceInfo = setInterval(async() => { await this.updateDeviceData(); }, (this.config.getUpdateDeviceDataIntervall() * 60 * 1000));
        this.logger.logInfoBasic(`  updateDeviceData scheduled (runs every 5 minutes).`);

        if(this.config.getStateUpdateIntervallActive())
        {
            if(this.taskUpdateState)
            {
                this.logger.logInfoBasic(`  getState already scheduled, remove scheduling...`);
                clearInterval(this.taskUpdateState);
            }
            this.taskUpdateState = setInterval(async() => { await this.setScheduleState(); }, (this.config.getStateUpdateIntervallTimespan() * 60 * 1000));
            this.logger.logInfoBasic(`  getState scheduled (runs every ${this.config.getStateUpdateIntervallTimespan()} minutes).`);
        }
        else
        {
            this.logger.logInfoBasic(`  scheduling getState disabled in settings${this.config.getStateUpdateEventActive() == true ? " (state changes will be received by event)" : ""}.`)
        }

        if(this.config.getUpdateLinksActive())
        {
            if(this.taskUpdateLinks)
            {
                this.logger.logInfoBasic(`  getLibrary already scheduled, remove scheduling...`);
                clearInterval(this.taskUpdateLinks);
            }
            this.taskUpdateLinks = setInterval(async() => { await this.setScheuduleLibrary(); }, (this.config.getUpdateLinksTimespan() * 60 * 1000));
            this.logger.logInfoBasic(`  getLibrary scheduled (runs every ${this.config.getUpdateLinksTimespan()} minutes${this.config.getUpdateLinksOnlyWhenArmed() == true ? " when system is armed" : ""}).`);
        }
        else
        {
            this.logger.logInfoBasic(`  scheduling getLinks disabled in settings.`);
        }
        this.logger.logInfoBasic(`...done setting up scheduled tasks.`);
    }

    /**
     * Clear all scheduled tasks.
     */
    public clearScheduledTasks() : void
    {
        if(this.taskUpdateDeviceInfo)
        {
            this.logger.logInfoBasic(`Remove scheduling for updateDeviceDataData.`);
            clearInterval(this.taskUpdateDeviceInfo);
        }
        if(this.taskUpdateState)
        {
            this.logger.logInfoBasic(`Remove scheduling for getState.`);
            clearInterval(this.taskUpdateState);
        }
        if(this.taskUpdateLinks)
        {
            this.logger.logInfoBasic(`Remove scheduling for getLibrary.`);
            clearInterval(this.taskUpdateLinks);
        }
        this.config.close();
    }

    /**
     * Setup the given scheduled task.
     * @param task The object of the task.
     * @param name The name of the task.
     */
    private setupScheduledTask(task : NodeJS.Timeout, name : string)
    {
        if(task)
        {
            this.logger.logInfoBasic(`Remove scheduling for ${name}.`);
            clearInterval(this.taskUpdateLinks);
        }
        if(name == "updateDeviceData")
        {
            task = setInterval(async() => { await this.updateDeviceData(); }, (5 * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getStateUpdateIntervallTimespan()} minutes).`);
        }
        else if(name == "getState")
        {
            task = setInterval(async() => { await this.setScheduleState(); }, (this.config.getStateUpdateIntervallTimespan() * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getStateUpdateIntervallTimespan()} minutes).`);
        }
        else if(name == "getLibrary")
        {
            task = setInterval(async() => { await this.setScheuduleLibrary(); }, (this.config.getUpdateLinksTimespan() * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getUpdateLinksTimespan()} minutes${this.config.getUpdateLinksOnlyWhenArmed() == true ? " when system is active" : ""}).`);
        }
    }

    /**
     * Clear the given scheduled task.
     * @param task The object of the task.
     * @param name The name of the task.
     */
    private clearScheduledTask(task : NodeJS.Timeout, name : string) : void
    {
        if(task)
        {
            this.logger.logInfoBasic(`Remove scheduling for ${name}.`);
            clearInterval(task);
        }
    }

    /**
     * The method called when scheduleing state is called.
     */
    private async setScheduleState() : Promise<void>
    {
        await this.getGuardMode();
    }

    /**
     * The method called when scheduleing library is called.
     */
    private async setScheuduleLibrary() : Promise<void>
    {
        var mode = await this.getGuardModeAsGuardMode();
        if(this.config.getUpdateLinksOnlyWhenArmed() == false || ((this.config.getUpdateLinksOnlyWhenArmed() == true && mode != GuardMode.DISARMED) && (this.config.getUpdateLinksOnlyWhenArmed() == true && mode != GuardMode.OFF)))
        {
            await this.getLibrary();
        }
    }

    /**
     * The method called when update device data is called.
     */
    public async updateDeviceData() : Promise<void>
    {
        await this.stations.updateDeviceData();
    }

    /**
     * Return the version of this API.
     */
    public getApiVersion() : string
    {
        return `{"success":true,"platform":"${process.platform}","nodeVersion":"${process.version}","nodeArch":"${process.arch}","apiVersion":"${this.getEufySecurityApiVersion()}","homematicApiVersion":"${this.homematicApi.getHomematicApiVersion()}","eufySecurityClientVersion":"${this.getEufySecurityClientVersion()}"}`;
    }

    /**
     * Returns the version of this API.
     * @returns The version of this API.
     */
    public getEufySecurityApiVersion() : string
    {
        return "1.7.0-rc1";
    }

    /**
     * Return the version of the library used for communicating with eufy.
     * @returns The version of the used eufy-security-client.
     */
    public getEufySecurityClientVersion() : string
    {
        return "2.2.1";
    }
}