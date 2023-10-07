import { Config } from './config';
import { HTTPApi, GuardMode, Station, Device, PropertyName, Camera, LoginOptions, HouseDetail, PropertyValue, RawValues, InvalidPropertyError, PassportProfileResponse, ConfirmInvite, Invite, HouseInviteListResponse, HTTPApiPersistentData, DoorbellCamera, IndoorCamera, SoloCamera, FloodlightCamera, Picture, WallLightCam, GarageCamera } from './http';
import { HomematicApi } from './homematicApi';
import { Logger } from './utils/logging';

import { PushService } from './pushService';
import { MqttService } from './mqttService';
import { generateUDID, generateSerialnumber, getError } from './utils';
import { Devices } from './devices'
import { Stations } from './stations';
import { DatabaseQueryLatestInfo, DatabaseQueryLatestInfoLocal, DatabaseQueryLocal, DatabaseReturnCode, P2PConnectionType } from './p2p';
import { sleep } from './push/utils';
import { EufyHouses } from './houses';
import { NotSupportedError, ReadOnlyPropertyError, ensureError } from './error';
import { randomNumber } from './http/utils';
import { PhoneModels, timeZoneData } from './http/const';
import { getModelName, makeDateTimeString } from './utils/utils';
import { countryData } from './utils/const';
import path from 'path';
import { EventInteractionType } from './utils/types';

export class EufySecurityApi
{
    private config : Config;
    private logger : Logger;
    private httpService !: HTTPApi;
    private homematicApi !: HomematicApi;
    private pushService !: PushService;
    private mqttService !: MqttService;
    private httpApiPersistentData : HTTPApiPersistentData = { user_id: "", email: "", nick_name: "", device_public_keys: {}, clientPrivateKey: "", serverPublicKey: "" };
    private houses !: EufyHouses;
    private devices !: Devices;
    private stations !: Stations;
    private connected = false;
    private retries = 0;
    private serviceState : string = "init";
    private captchaState = { captchaId: "", captcha: "" };
    
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
            var missingSettings = "";
            if(this.config.getEmailAddress() == "")
            {
                missingSettings = "email";
            }
            if(this.config.getPassword() == "")
            {
                if(missingSettings != "")
                {
                    missingSettings += ", ";
                }
                missingSettings += "password";
            }

            this.logError(`Please check your settings in the 'config.json' file.\r\nIf there was no 'config.json', it should now be there.\r\nYou need to set at least email and password to run this addon (missing: ${missingSettings}).`);
        
            this.setServiceState("ok");
        }
        else
        {
            if (this.config.getClientPrivateKey() === undefined || this.config.getClientPrivateKey() === "" || this.config.getServerPublicKey() === undefined || this.config.getServerPublicKey() === "")
            {
                this.logger.logDebug(this.getApiLogLevel(), "Incomplete persistent data for v2 encrypted cloud api communication. Invalidate authenticated session data.");
                this.config.setToken("");
                this.config.setTokenExpire(0);
            }
            this.httpApiPersistentData.user_id = this.config.getUserId();
            this.httpApiPersistentData.email = this.config.getEmailAddress();
            this.httpApiPersistentData.nick_name = this.config.getNickName();
            this.httpApiPersistentData.clientPrivateKey = this.config.getClientPrivateKey();
            this.httpApiPersistentData.serverPublicKey = this.config.getServerPublicKey();
            this.httpApiPersistentData.device_public_keys = this.config.getDevicePublicKeys();
            
            this.httpService = await HTTPApi.initialize(this.config.getCountry(), this.config.getEmailAddress(), this.config.getPassword(), this.logger, this.httpApiPersistentData);

            this.httpService.setLanguage(this.config.getLanguage());

            if (this.config.getTrustedDeviceName() === undefined || this.config.getTrustedDeviceName() == "" || this.config.getTrustedDeviceName() == "eufyclient")
            {
                this.config.setTrustedDeviceName(PhoneModels[randomNumber(0, PhoneModels.length)]);
            }

            this.httpService.setPhoneModel(this.config.getTrustedDeviceName());

            this.httpService.on("close", () => this.onAPIClose());
            this.httpService.on("connect", () => this.onAPIConnect());
            this.httpService.on("captcha request", (captchaId: string, captcha: string) => this.onCaptchaRequest(captchaId, captcha));
            this.httpService.on("auth token renewed", (token, token_expiration) => this.onAuthTokenRenewed(token, token_expiration));
            this.httpService.on("auth token invalidated", () => this.onAuthTokenInvalidated());
            this.httpService.on("tfa request", () => this.onTfaRequest());
            this.httpService.on("connection error", (error: Error) => this.onAPIConnectionError(error));

            this.httpService.setToken(this.getToken());
            this.httpService.setTokenExpiration(new Date(this.getTokenExpire()*1000));
            
            if (this.config.getOpenudid() == "")
            {
                this.config.setOpenudid(generateUDID());
                this.logger.debug("Generated new openudid", { openudid: this.config.getOpenudid() });
            }
            this.httpService.setOpenUDID(this.config.getOpenudid());
    
            if (this.config.getSerialNumber() == "")
            {
                this.config.setSerialNumber(generateSerialnumber(12));
                this.logger.debug("Generated new serial_number", { serialnumber: this.config.getSerialNumber() });
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
     * Returns the account info as PassportProfileResponse.
     * @returns The account info as PassportProfileResponse.
     */
    private async getAccountInfo() : Promise<PassportProfileResponse | null>
    {
        if(this.connected == true)
        {
            return await this.httpService.getPassportProfile();
        }
        else
        {
            return null;
        }
    }

    /**
     * Returns the account info as JSON string.
     * @returns The account info as JSON string.
     */
    public async getAccountInfoAsJson() : Promise<string>
    {
        var json : any = {};

        var passportProfile = await this.getAccountInfo();

        if(passportProfile)
        {
            json = {"success":true,"message":passportProfile};
        }
        else
        {
            json = {"success":false,"reason":"No connection to eufy."};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns the captcha state as JSON string.
     * @returns The captcha state as JSON string.
     */
    public getCaptchaState() : string
    {
        var json : any = {};
        var captchaNeeded = false;

        if(this.captchaState.captchaId != "" || this.captchaState.captcha != "")
        {
            captchaNeeded = true;
        }
        
        json = {"success":true,"captchaNeeded":captchaNeeded,"captcha":this.captchaState};
        return JSON.stringify(json);
    }

    /**
     * Set the code from the captcha image and login again.
     * @param code The code from the captcha image.
     * @returns 
     */
    public setCaptchaCode(code : string) : string
    {
        var json : any = {};
        var success = false;
        var message = "No captcha code requested.";

        if(this.captchaState.captchaId != "" || this.captchaState.captcha != "")
        {
            this.connect({ captcha: { captchaId: this.captchaState.captchaId, captchaCode: code}, force: false });
            success = true;
            message = "Connecting again with the captcha code provided.";
        }
        
        json = {"success":success,"message":message};
        return JSON.stringify(json);
    }

    /**
     * Close the EufySecurityApi.
     */
    public async close() : Promise<void>
    {
        if (this.refreshEufySecurityCloudTimeout !== undefined)
        {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        //this.clearScheduledTasks();

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
        if(this.devices != null || this.devices !== undefined)
        {
            this.devices.close();
        }
        if(this.stations != null || this.devices !== undefined)
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
        if(this.devices != null || this.devices !== undefined)
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
            .catch((err) => {
                const error = ensureError(err);
                this.logger.error("Connect Error", { error: getError(error), options: options });
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

        this.setCaptchaData("", "");
        
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

        if(this.httpService.getPersistentData() !== undefined)
        {
            this.updateApiPersistentData(this.httpService.getPersistentData()!);
        }

        this.stations.on("station image download", (station: Station, file: string, image: Picture) => this.onStationImageDownload(station, file, image));
        this.stations.on("station database query local", (station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLocal[]) => this.onStationDatabaseQueryLocal(station, returnCode, data));
        this.stations.on("station database query latest", (station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLatestInfo[]) => this.onStationDatabaseQueryLatest(station, returnCode, data));

        //this.devices.on("device added", (device: Device) => this.onDeviceAdded(device));
        this.devices.once("devices loaded", () => this.onDevicesLoaded());

        await sleep(10);
        await this.refreshCloudData();

        this.setupScheduledTasks();

        this.setServiceState("ok");

        this.writeConfig();
    }

    /**
     * Eventhandler for API Connection Error event.
     * @param error The error occured.
     */
    private onAPIConnectionError(error: Error): void
    {
        //this.emit("connection error", error);
        this.logError(`APIConnectionError occured. Error: ${error}`);
        this.setServiceState("ok");
    }

    /**
     * Eventhandler for API Captcha Request event.
     * @param captchaId The captchaId.
     * @param captcha The captcha image as base64 encoded string.
     */
    private onCaptchaRequest(captchaId: string, captcha: string): void
    {
        //this.emit("captcha request", id, captcha);
        this.setCaptchaData(captchaId, captcha);
        this.logInfo(`Entering captcha code needed. Please check the addon website.`);
    }

    /**
     * Eventhandler for API Auth Token Renewed event.
     * @param token The new token.
     * @param token_expiration The new token expiration time.
     */
    private onAuthTokenRenewed(token: string | null, token_expiration: Date): void
    {
        if (token == null)
        {
            this.setTokenData(undefined, 0);
        }
        else
        {
            this.setTokenData(token, token_expiration.getTime());
        }
        this.logInfo(`The authentication token has been renewed.`);
    }

    /**
     * Eventhandler for API Auth Token Invalidated event.
     */
    private onAuthTokenInvalidated(): void
    {
        this.setTokenData(undefined, 0);
        this.logInfo(`The authentication token is invalid and have been removed.`);
    }

    /**
     * Eventhandler for API Tfa Request.
     */
    private onTfaRequest(): void
    {
        //this.emit("tfa request");
        this.logInfo(`A tfa (two factor authentication) request received. This addon does not support tfa at the moment.`);
    }

    /**
     * The action to be performed when event station image download is fired.
     * @param station The station as Station object.
     * @param file The file name.
     * @param image The image.
     */
    private async onStationImageDownload(station : Station, file : string, image : Picture)
    {
        /*var filename = path.basename(file);
        var filenameContent = path.parse(file).name.split("_c", 2);
        var channel = filenameContent[1];
        var device = (await this.devices.getStationDevice(station.getSerial(), Number.parseInt(channel))).getSerial();
        try
        {
            if(!existsSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/`))
            {
                mkdirSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/`, { recursive: true });
            }
            else
            {
                var files = readdirSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/`)
                for(var file in files)
                {
                    if(filename !== files[file])
                    {
                        unlinkSync(path.join(`/var/eufySecurity/images/${station.getSerial()}/${device}/`, files[file]));
                    }
                }
            }
            writeFileSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/${filename}`, image.data);
        }
        catch (error : any)
        {
            this.logInfo(`Error occured: ${error.message}`);
        }*/
    }

    /**
     * The action to be performed when event station database query local is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param data The result data.
     */
    private async onStationDatabaseQueryLocal(station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLocal[])
    {
        /*var deviceSerials : string[] = [];
        if(returnCode == 0 && data && data.length > 0)
        {
            for(let i=0; i<data.length; i++)
            {
                let deviceSerial = data[i].device_sn;
                if(deviceSerial)
                {
                    if(!deviceSerials.includes(deviceSerial))
                    {
                        deviceSerials.push(deviceSerial);
                    }
                    this.devices.addEventResultForDevice(deviceSerial, data[i]);
                }
            }

            for(let deviceSerial in deviceSerials)
            {
                this.devices.downloadLatestImageForDevice(deviceSerials[deviceSerial]);
            }
        }*/
    }

    /**
     * The action to be performed when event station database query latest is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param data The result data.
     */
    private async onStationDatabaseQueryLatest(station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLatestInfo[])
    {
        if(returnCode == 0 && data && data.length > 0)
        {
            for(let i=0; i<data.length; i++)
            {
                try
                {
                    var response = data[i] as DatabaseQueryLatestInfoLocal;

                    if(response.crop_local_path === "")
                    {
                        this.logError("DatabaseQueryLatest: Empty path detected.", JSON.stringify(response));
                        continue;
                    }

                    var file = "";
                    var fileName = "";
                    var timeString = "";

                    file = response.crop_local_path;
                    fileName = path.parse(file).name + path.parse(file).ext;

                    if(fileName.includes("_c"))
                    {
                        timeString = fileName.split("_c", 2)[0];
                    }
                    else if(file.includes("/Camera"))
                    {
                        var res = file.split("/");
                        if(file.includes("snapshort.jpg"))
                        {
                            timeString = res[res.length-2];
                        }
                        else
                        {
                            timeString = res[res.length-1].replace("n", "");
                        }
                    }
                    else
                    {
                        this.logError("DatabaseQueryLatest: Unhandled path structure detected.", JSON.stringify(response));
                        continue;
                    }
                    this.devices.addLastEventForDevice(response.device_sn, file, new Date(Number.parseInt(timeString.substring(0,4)), Number.parseInt(timeString.substring(4,6))-1, Number.parseInt(timeString.substring(6,8)), Number.parseInt(timeString.substring(8,10)), Number.parseInt(timeString.substring(10,12)), Number.parseInt(timeString.substring(12,14))));
                    this.devices.downloadLatestImageForDevice(response.device_sn);
                }
                catch (error)
                {
                    continue;
                }
            }
        }
    }

    /**
     * The action to be performed when event device added is fired.
     * @param device The device as Device object.
     */
    private async onDeviceAdded(device : Device)
    {
        //this.devices.getDeviceEvents(device.getSerial());
        this.devices.getDeviceLastEvent(device.getSerial());
    }

    /**
     * The action to be performed when event devices loaded is fired.
     */
    private async onDevicesLoaded()
    {
        //this.devices.getDevicesEvents();
        this.devices.getDevicesLastEvent();
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
     * Returns all devices as object.
     * @returns The object.
     */
    public async getDevices() : Promise<{ [deviceSerial : string] : Device }>
    {
        return await this.devices.getDevices();
    }

    /**
     * Returns all devices of a given station as object.
     * @returns The object.
     */
    public async getDevicesFromStation(baseSerial : string) : Promise<Array<Device>>
    {
        return await this.devices.getDevicesFromStation(baseSerial);
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
    public async getStationDevice(stationSerial : string, channel : number) : Promise<Device>
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
    public async getHouse(houseId : string) : Promise<HouseDetail | null>
    {
        return await this.houses.getHouse(houseId);
    }

    /**
     * Sets the captcha data to the captchaState variable.
     * @param captchaId The value for the captcha id.
     * @param captcha the captcha image as base64 string.
     */
    public setCaptchaData(captchaId : string, captcha : string)
    {
        this.captchaState.captchaId = captchaId;
        this.captchaState.captcha = captcha;
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
     * Save the persistent http api data.
     * @param httpApiPersistentData The persistent data for the http api to save.
     */
    public updateApiPersistentData(httpApiPersistentData : HTTPApiPersistentData)
    {
        this.config.setUserId(httpApiPersistentData.user_id);
        this.config.setNickName(httpApiPersistentData.nick_name);
        this.config.setClientPrivateKey(httpApiPersistentData.clientPrivateKey);
        this.config.setServerPublicKey(httpApiPersistentData.serverPublicKey);
        this.config.setDevicePublicKeys(httpApiPersistentData.device_public_keys);
    }

    /**
     * Refreshing cloud data.
     */
    public async refreshCloudData() : Promise<void>
    {
        if (this.config.getAcceptInvitations())
        {
            await this.processInvitations().catch(err => {
                const error = ensureError(err);
                this.logError("Error in processing invitations", { error: getError(error) });
            });
        }
        
        await this.httpService.refreshAllData().catch(err => {
            const error = ensureError(err);
            this.logger.error("Error during API data refreshing", { error: getError(error) });
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
     * Generate a new random trusted device name from the device name list.
     * @returns The trusted device name.
     */
    private generateNewTrustedDeviceName() : string
    {
        return PhoneModels[randomNumber(0, PhoneModels.length)];
    }

    /**
     * Generate a new random trusted device name and return a JSON resonse.
     * @returns The trusted device name as JSON string.
     */
    public generateNewTrustedDeviceNameJson() : string
    {
        var json : any = {};
        json = {"success":true, "trustedDeviceName":this.generateNewTrustedDeviceName()};
        return JSON.stringify(json);
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
    public async getHousesAsJson() : Promise<string> 
    {
        var json : any = {};
        try
        {
            if(this.houses)
            {
                await this.httpService.refreshHouseData();

                var houses = this.getHouses();

                if(houses)
                {
                    json = {"success":true, "data":[]};
                    for (var house_id in houses)
                    {
                        var house = await this.getHouse(house_id);
                        if(house && house != null)
                        json.data.push(this.makeJsonObjectForHouse(house));
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
            this.logError(`Error occured at getHousesAsJson(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON-Representation of a given house.
     */
    public async getHouseAsJson(houseId : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.houses)
            {
                await this.httpService.refreshHouseData();

                var house = await this.getHouse(houseId);

                if(house && house != null)
                {
                    json = {"success":true, "data":this.makeJsonObjectForHouse(house)};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`No house with id ${houseId} found.`};
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
            this.logError(`Error occured at getHouseAsJson(). Error: ${e.message}`);
            json = {"success":false, "reason":`The house with id ${houseId} does not exists.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }
    
    /**
     * Create a JSON object for a given device.
     * @param device The device the JSON object created for.
     */
    private makeJsonObjectForDevice(device : Device, isStationP2PConnected : boolean) : any
    {
        var properties = device.getProperties();
        var json : any = {};

        json = {"eufyDeviceId":device.getId(), "isStationP2PConnected":isStationP2PConnected, "deviceType":this.devices.getDeviceTypeAsString(device), "model":device.getModel(), "modelName":getModelName(device.getModel()), "name":device.getName(), "hardwareVersion":device.getHardwareVersion(), "softwareVersion":device.getSoftwareVersion(), "stationSerialNumber":device.getStationSerial()};

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
                case PropertyName.DevicePicture:
                    //json[property] = properties[property] === undefined ? "n/a" : properties[property];
                    json.pictureTime = this.getApiUsePushService() == false ? "n/d" : (this.devices.getLastEventTimeForDevice(device.getSerial()) === undefined ? "n/a" : this.devices.getLastEventTimeForDevice(device.getSerial()));
                    break;
                default:
                    json[property] = properties[property] === undefined ? "n/a" : properties[property];
            }
        }

        return json;
    }

    /**
     * Returns a JSON-Representation of all devices.
     */
    public async getDevicesAsJson() : Promise<string> 
    {
        var json : any = {};
        try
        {
            if(this.devices)
            {
                //await this.httpService.refreshStationData();
                await this.httpService.refreshDeviceData();

                await this.updateDeviceData();
                await this.devices.loadDevices();

                var devices = await this.getDevices();
                if(devices)
                {
                    json = {"success":true, "data":[]};
                    for (var deviceSerial in devices)
                    {
                        json.data.push(this.makeJsonObjectForDevice(devices[deviceSerial], (await this.stations.getStation(devices[deviceSerial].getStationSerial())).isConnected()));
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
            this.logError(`Error occured at getDevicesAsJson(). Error: ${e.message}`);
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
     * Returns the last event picture of a given device.
     * @param deviceSerial The serial of the device.
     * @returns The picture.
     */
    public async getDeviceImage(deviceSerial : string) : Promise<any>
    {
        var device = (await this.getDevices())[deviceSerial];
        if(device)
        {
            return device.getPropertyValue(PropertyName.DevicePicture) as Picture
        }
        return null;
    }

    /**
     * Returns a JSON-Representation of a given devices.
     */
    public async getDeviceAsJson(deviceSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.devices)
            {
                //await this.httpService.refreshStationData();
                await this.httpService.refreshDeviceData();

                await this.updateDeviceData();
                await this.devices.loadDevices();

                var device = (await this.getDevices())[deviceSerial];
                if(device)
                {
                    json = {"success":true, "data":this.makeJsonObjectForDevice(device, (await this.stations.getStation(device.getStationSerial())).isConnected())};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
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
            this.logError(`Error occured at getDeviceAsJson(). Error: ${e.message}`);
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
    public async getDevicePropertiesMetadataAsJson(deviceSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.devices)
            {
                //await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.updateDeviceData();
                //await this.devices.loadDevices();

                var device = (await this.getDevices())[deviceSerial];
                if(device)
                {
                    json = {"success":true, "model":device.getModel(), "modelName":getModelName(device.getModel()), "data":device.getPropertiesMetadata()};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
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
            this.logError(`Error occured at getDevicePropertiesMetadataAsJson(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }
        
        return JSON.stringify(json);
    }

    /**
     * Returns a JSON string with the device properties.
     * @param deviceSerial The device serial for the device.
     * @returns JSON string with all properties.
     */
    public async getDevicePropertiesAsJson(deviceSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.devices)
            {
                //await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.updateDeviceData();
                //await this.devices.loadDevices();

                var device = (await this.getDevices())[deviceSerial];
                if(device)
                {
                    var temp = this.devices.getDeviceInteractions(device.getSerial());
                    if(temp === undefined || temp === null)
                    {
                        temp = null;
                    }
                    json = {"success":true, "model":device.getModel(), "modelName":getModelName(device.getModel()), "data":device.getProperties(), "interactions":temp};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
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
            this.logError(`Error occured at getDevicePropertiesAsJson(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON string with the device params.
     * @param deviceSerial The device serial for the device.
     * @returns JSON string with all params.
     */
    public async getDeviceParams(deviceSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.devices)
            {
                //await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.updateDeviceData();
                //await this.devices.loadDevices();

                var device = (await this.getDevices())[deviceSerial];
                if(device)
                {
                    json = device.getRawDevice()
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
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
            this.logError(`Error occured at getDeviceParams(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
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
        var json : any = {};
        try
        {
            if(this.devices)
            {
                if(!this.devices.existDevice(deviceSerial))
                {
                    json = {"success":false,"reason":`The device with serial ${deviceSerial} does not exists.`};
                }
                try
                {
                    await this.devices.setDeviceProperty(deviceSerial, propertyName, propertyValue);
                    await sleep(5000);
                    json = {"success":true,"reason":`The property ${propertyName} for device ${deviceSerial} has been processed.`};
                }
                catch (e)
                {
                    if (e instanceof InvalidPropertyError)
                    {
                        json = {"success":false,"reason":`The device ${deviceSerial} does not support the property ${propertyName}.`};
                    }
                    else if (e instanceof ReadOnlyPropertyError)
                    {
                        json = {"success":false,"reason":`The property ${propertyName} is read only.`};
                    }
                    else
                    {
                        json = {"success":false,"reason":`Other error occured.`};
                    }
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError(`Error occured at setDeviceProperty. Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Create a JSON object for a given station.
     * @param station The station the JSON object created for.
     */
    private async makeJsonObjectForStation(station : Station) : Promise<any>
    {
        var properties = station.getProperties();
        var json : any = {};

        var privacyMode : boolean | undefined = undefined;
        if(this.devices.existDevice(station.getSerial()))
        {
            var device = (await this.devices.getDevices())[station.getSerial()];
            if(device.isPanAndTiltCamera())
            {
                if(device.isEnabled())
                {
                    privacyMode = false;
                }
                else
                {
                    privacyMode = true;
                }
            }
        }

        json = {"eufyDeviceId":station.getId(), "deviceType":station.getDeviceTypeString(), "wanIpAddress":station.getIPAddress(), "isP2PConnected":station.isConnected()};
        for (var property in properties)
        {
            switch (property)
            {
                case PropertyName.Model:
                    json[property] = properties[property];
                    json.modelName = getModelName(station.getModel());
                    break;
                case PropertyName.StationGuardMode:
                    json[property] = properties[property] === undefined ? "n/a" : properties[property];
                    if(privacyMode !== undefined)
                    {
                        json.privacyMode = privacyMode;
                    }
                    json.guardModeTime = this.getStateUpdateEventActive() == false ? "n/d" : (this.stations.getLastGuardModeChangeTime(station.getSerial()) === undefined ? "n/a" : this.stations.getLastGuardModeChangeTime(station.getSerial()));
                    break;
                case PropertyName.StationHomeSecuritySettings:
                case PropertyName.StationAwaySecuritySettings:
                    json[property] = properties[property];
                    break;
                default:
                    json[property] = properties[property] === undefined ? "n/a" : properties[property];
            }
        }

        return json;
    }

    /**
     * Returns a JSON-Representation of all stations including the guard mode.
     */
    public async getStationsAsJson() : Promise<string>
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
                        json.data.push(await this.makeJsonObjectForStation(stations[stationSerial]));
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
            this.logError(`Error occured at getStationsAsJson(). Error: ${e.message}`);
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
    public async getStationPropertiesMetadataAsJson(stationSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                //await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.stations.loadStations();

                var station = await this.getStation(stationSerial);

                if(station)
                {
                    json = {"success":true, "type":station.getModel(), "modelName":getModelName(station.getModel()), "data":station.getPropertiesMetadata()};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
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
            this.logError(`Error occured at getStationPropertiesMetadataAsJson(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON string with the station properties.
     * @param stationSerial The device serial for the station.
     * @returns JSON string with all properties.
     */
    public async getStationPropertiesAsJson(stationSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                //await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.stations.loadStations();

                var station = await this.getStation(stationSerial);

                if(station)
                {
                    json = {"success":true, "type":station.getModel(), "modelName":getModelName(station.getModel()), "isP2PConnected":station.isConnected(), "data":station.getProperties()};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
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
            this.logError(`Error occured at getStationPropertiesAsJson(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON string with the station params.
     * @param stationSerial The device serial for the station.
     * @returns JSON string with all params.
     */
    public async getStationParams(stationSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                //await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.stations.loadStations();

                var station = await this.getStation(stationSerial);

                if(station)
                {
                    json = station.getRawStation();
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
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
            this.logError(`Error occured at getStationParams(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
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
        var json : any = {};
        try
        {
            if(this.stations)
            {
                if(!this.stations.existStation(stationSerial))
                {
                    json = {"success":false,"reason":`The station with serial ${stationSerial} does not exists.`};
                }
                try
                {
                    await this.stations.setStationProperty(stationSerial, propertyName, propertyValue);
                    await sleep(5000);
                    json = {"success":true,"reason":`The property ${propertyName} for station ${stationSerial} has been processed.`};
                }
                catch (e : any)
                {
                    if (e instanceof InvalidPropertyError)
                    {
                        json = {"success":false,"reason":`The station ${stationSerial} does not support the property ${propertyName}.`};
                    }
                    else if (e instanceof ReadOnlyPropertyError)
                    {
                        json = {"success":false,"reason":`The property ${propertyName} is read only.`};
                    }
                    else
                    {
                        json = {"success":false,"reason":`Other error occured. Error: ${e.message}`};
                    }
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError(`Error occured at setStationProperty(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Reboot a given station.
     * @param stationSerial The serial of the station.
     * @returns A JSON-String.
     */
    public async rebootStation(stationSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                if(!this.stations.existStation(stationSerial))
                {
                    json = {"success":false,"reason":`The station with serial ${stationSerial} does not exists.`};
                }
                try
                {
                    await (await this.stations.getStation(stationSerial)).rebootHUB();
                    await sleep(5000);
                    json = {"success":true,"reason":`The station ${stationSerial} is restarting.`};
                }
                catch (e : any)
                {
                    if (e instanceof NotSupportedError)
                    {
                        json = {"success":false,"reason":`This functionality is not implemented or supported by ${stationSerial}`};
                    }
                    else
                    {
                        json = {"success":false,"reason":`Other error occured. Error: ${e.message}`};
                    }
                }
            }
            else
            {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        }
        catch (e : any)
        {
            this.logError(`Error occured at rebootStation(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON-Representation of a given station.
     */
    public async getStationAsJson(stationSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                await this.stations.loadStations();

                var station = await this.getStation(stationSerial);

                if(station)
                {
                    json = {"success":true, "data":await this.makeJsonObjectForStation(station)};
                    this.setLastConnectionInfo(true);
                }
                else
                {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
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
            this.logError(`Error occured at getStationAsJson(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
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
    public async updateDeviceProperties(deviceSerial : string, values : RawValues) : Promise<void>
    {
        await this.devices.updateDeviceProperties(deviceSerial, values);
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
                        json.data.push(await this.makeJsonObjectForStation(stations[stationSerial]));

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
            this.logError(`Error occured at getGuardMode(). Error: ${e.message}`);
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
    public async getGuardModeStation(stationSerial : string) : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.stations)
            {
                await this.httpService.refreshStationData();
                //await this.httpService.refreshDeviceData();

                //await this.stations.loadStations();

                await this.stations.loadStations();

                var station = await this.getStation(stationSerial);

                if(station)
                {
                    json = {"success":true, "data":await this.makeJsonObjectForStation(station)};
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(true);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    if(this.stations.getLastGuardModeChangeTime(station.getSerial()) === undefined)
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
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
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
            this.logError(`Error occured at getGuardModeStation(). Error: ${e.message}`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
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
                    const device : Device = (await this.getDevices())[stationSerial];
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
                    if(this.stations.getLastGuardModeChangeTime(station.getSerial()) === undefined)
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
            }
        }
        catch (e : any)
        {
            this.logError(`Error occured at setGuardMode: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message.replaceAll(`"`, `'`)};
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
            const device : Device = (await this.getDevices())[deviceSerial];
            if(device.isPanAndTiltCamera())
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
                    if((await this.getDevices())[deviceSerial].isEnabled() == value as boolean)
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
     * Forces a new p2p connection to a station specified by serial.
     * @param stationSerial The serial of the station.
     * @returns A JSON string with the result.
     */
    public async connectStation(stationSerial: string) : Promise<string>
    {
        var json : any = {};

        if(this.stations)
        {
            await this.httpService.refreshStationData();
            var station = await this.stations.getStation(stationSerial);

            if(station)
            {
                if(station.isConnected() === true)
                {
                    json = {"success":false, "message":"P2P connection to station already established."};
                }
                else if (station.isP2PConnectableDevice())
                {
                    station.setConnectionType(this.getP2PConnectionType());
                    await station.connect();
                    await sleep(500);

                    await this.httpService.refreshStationData();
                    station = await this.stations.getStation(stationSerial);
                    var connected = station.isConnected();
                    json = {"success":connected, "conneceted":connected};
                }
            }
            else
            {
                json = {"success":false, "message":"The specified station could not be found."};
            }
        }
        else
        {
            json = {"success":false, "message":"No connection to eufy."};
        }

        return JSON.stringify(json);
    }

    /**
     * Retrieves the timezones.
     * @returns A JSON string with the timezones.
     */
    public getTimeZones() : string
    {
        return `{"success":true,"data":${JSON.stringify(timeZoneData)}}`;
    }

    /**
     * Update the library (at this time only image and the corrospondending datetime) from the devices.
     */
    public async getLibrary() : Promise<string>
    {
        var json : any = {};
        try
        {
            if(this.devices)
            {
                await this.httpService.refreshStationData();
                await this.httpService.refreshDeviceData();

                await this.updateDeviceData();
                await this.devices.loadDevices();

                var devices = await this.getDevices();
                var device;

                if(devices)
                {
                    json = {"success":true, "data":[]};
                    for (var deviceSerial in devices)
                    {
                        device = devices[deviceSerial];
                        switch (this.devices.getDeviceTypeAsString(device))
                        {
                            case "camera":
                                device = devices[deviceSerial] as Camera;
                                break;
                            case "doorbell":
                                device = devices[deviceSerial] as DoorbellCamera;
                                break;
                            case "indoorcamera":
                                device = devices[deviceSerial] as IndoorCamera;
                                break;
                            case "solocamera":
                                device = devices[deviceSerial] as SoloCamera;
                                break;
                            case "floodlight":
                                device = devices[deviceSerial] as FloodlightCamera;
                                break;
                            case "walllightcamera":
                                device = devices[deviceSerial] as WallLightCam;
                                break;
                            case "garagecamera":
                                device = devices[deviceSerial] as GarageCamera;
                                break;
                            default:
                                device = undefined;
                        }
                        if(device !== undefined)
                        {
                            json.data.push({"deviceSerial":deviceSerial, "pictureTime":this.devices.getLastEventTimeForDevice(deviceSerial) === undefined ? "n/a" : this.devices.getLastEventTimeForDevice(deviceSerial), "videoUrl":device.getLastCameraVideoURL() == "" ? this.config.getCameraDefaultVideo() : device.getLastCameraVideoURL()});
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
            this.logError(`Error occured at getLibrary(). Error: ${e.message}`);
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
        if(this.getStateUpdateEventActive() == true && timestamp !== undefined)
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
        if(this.getApiUsePushService() == true && timestamp !== undefined)
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
    public setTokenData(token : string | undefined, tokenExpire : number | undefined) : string
    {
        var res;
        var json = "";
        this.config.setToken(token);
        this.config.setTokenExpire(tokenExpire);
        res = this.config.writeCurrentConfig();
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
     * Get the houseId for filtering stations and devices.
     * @returns The houseId as string.
     */
    public getHouseId() : string
    {
        return this.config.getHouseId(); 
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

    /**
     * Get the config object.
     * @returns The config object.
     */
    public getConfig() : Config
    {
        return this.config;
    }

    /**
     * Get all config data needed for the webui.
     */
    public async getAPIConfigAsJson() : Promise<string>
    {
        var json : any = {};
        
        json = {"success":true, "data":{}};
        json.data = {"configVersion":this.config.getConfigFileVersion(), "eMail":this.config.getEmailAddress(), "password":this.config.getPassword(), "country":this.config.getCountry(), "language":this.config.getLanguage(), "trustedDeviceName":this.config.getTrustedDeviceName(), "httpActive":this.config.getHttpActive(), "httpPort":this.config.getHttpPort(), "httpsActive":this.config.getHttpsActive(), "httpsPort":this.config.getHttpsPort(), "httpsPKeyFile":this.config.getHttpsPKeyFile(), "httpsCertFile":this.config.getHttpsCertFile(), "acceptInvitations":this.config.getAcceptInvitations(), "houseId":this.config.getHouseId(), "connectionTypeP2p":this.config.getConnectionType(), "localStaticUdpPortsActive":this.config.getLocalStaticUdpPortsActive(), "localStaticUdpPorts": [], "systemVariableActive":this.config.getSystemVariableActive(), "cameraDefaultImage":this.config.getCameraDefaultImage(), "cameraDefaultVideo":this.config.getCameraDefaultVideo(), "updateCloudInfoIntervall": this.config.getUpdateCloudInfoIntervall(), "updateDeviceDataIntervall": this.config.getUpdateDeviceDataIntervall(), "stateUpdateEventActive":this.config.getStateUpdateEventActive(), "stateUpdateIntervallActive":this.config.getStateUpdateIntervallActive(), "stateUpdateIntervallTimespan":this.config.getStateUpdateIntervallTimespan(), "updateLinksActive":this.config.getUpdateLinksActive(), "updateLinksOnlyWhenArmed":this.config.getUpdateLinksOnlyWhenArmed(), "updateLinksTimespan":this.config.getUpdateLinksTimespan(), "pushServiceActive":this.config.getPushServiceActive(), "logLevel":this.config.getLogLevel(), "tokenExpire":this.config.getTokenExpire()};
        json.data.localStaticUdpPorts = await this.getLocalStaticUdpPorts();
        return JSON.stringify(json);
    }

    /**
     * Save the config got from webui.
     * @param eMail The eMail address for the eufy security account.
     * @param password The password for the eufy security account.
     * @param country The country the eufy account is created for.
     * @param language The language the eufy account is using.
     * @param trustedDeviceName The name of the device.
     * @param httpActive Should the api use http.
     * @param httpPort The http port for the api.
     * @param httpsActive Should the api use https.
     * @param httpsPort The https port for the api.
     * @param httpsKeyFile The key for https.
     * @param httpsCertFile The cert for https.
     * @param houseId The houseId for filtering station and devices.
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
     * @returns A JSON string containing the result.
     */
    public async setConfig(eMail : string, password : string, country : string, language : string, trustedDeviceName : string, httpActive : boolean, httpPort : number, httpsActive : boolean, httpsPort : number, httpsKeyFile : string, httpsCertFile : string, acceptInvitations : boolean, houseId : string, connectionTypeP2p : number, localStaticUdpPortsActive : boolean, localStaticUdpPorts : any[] | undefined, systemVariableActive : boolean, cameraDefaultImage : string, cameraDefaultVideo : string, stateUpdateEventActive : boolean, stateUpdateIntervallActive : boolean, stateUpdateIntervallTimespan : number, updateLinksActive : boolean, updateLinksOnlyWhenArmed : boolean, updateLinksTimespan : number, pushServiceActive : boolean, logLevel : number) : Promise<string>
    {
        var serviceRestart = false;
        var taskSetupStateNeeded = false;
        var taskSetupLinksNeeded = false;
        if(this.config.getEmailAddress() != eMail || this.config.getPassword() != password || this.config.getTrustedDeviceName() != trustedDeviceName || this.config.getHttpActive() != httpActive || this.config.getHttpPort() != httpPort || this.config.getHttpsActive() != httpsActive || this.config.getHttpsPort() != httpsPort || this.config.getHttpsPKeyFile() != httpsKeyFile || this.config.getHttpsCertFile() != httpsCertFile || this.config.getHouseId() != houseId || this.config.getConnectionType() != connectionTypeP2p || this.config.getLocalStaticUdpPortsActive() != localStaticUdpPortsActive || this.config.getStateUpdateEventActive() != stateUpdateEventActive)
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
        this.config.setTrustedDeviceName(trustedDeviceName);
        this.config.setHttpActive(httpActive);
        this.config.setHttpPort(httpPort);
        this.config.setHttpsActive(httpsActive);
        this.config.setHttpsPort(httpsPort);
        this.config.setHttpsPKeyFile(httpsKeyFile);
        this.config.setHttpsCertFile(httpsCertFile);
        this.config.setAcceptInvitations(acceptInvitations);
        this.config.setHouseId(houseId);
        this.config.setConnectionType(connectionTypeP2p);
        if(localStaticUdpPorts !== undefined)
        {
            this.config.setLocalStaticUdpPortsActive(localStaticUdpPortsActive);
            if(this.config.setLocalStaticUdpPorts(localStaticUdpPorts) == true)
            {
                serviceRestart = true;
            }
        }
        else
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
            this.config.setLocalStaticUdpPortsActive(false);
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

        var res = this.config.writeCurrentConfig();
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
        var res = this.config.writeCurrentConfig();
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
     * Get all countries as JSON.
     * @returns The countries as JSON response.
     */
    public getCountriesAsJson() : string
    {
        return `{"success":true,"data":${JSON.stringify(countryData)}}`;
    }

    /**
     * Check if all system variables are created on the CCU
     */
    public async checkSystemVariables() : Promise<string>
    {
        var json : any = {};
        var availableSystemVariables = await this.homematicApi.getSystemVariables("localhost", false, "eufy");
        if(availableSystemVariables === undefined)
        {
            json = {"success":false, "reason":"Faild retrieving system variables from CCU."};
        }
        else
        {
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
                        var devices = await this.getDevices();

                        var commonSystemVariablesName = ["eufyCurrentState", "eufyLastConnectionResult", "eufyLastConnectionTime", "eufyLastLinkUpdateTime", "eufyLastStatusUpdateTime","eufyLastModeChangeTime"];
                        var commonSystemVariablesInfo = ["aktueller Modus des eufy Systems", "Ergebnis der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Aktualisierung der eufy Links", "Zeitpunkt der letzten Aktualisierung des eufy Systemstatus","Zeitpunkt des letzten Moduswechsels"];

                        json = {"success":true, "data":[]};
                        var i = 0;

                        for (var sv of commonSystemVariablesName)
                        {
                            json.data.push({"sysVarName":sv, "sysVarInfo":commonSystemVariablesInfo[i], "sysVarAvailable":availableSystemVariables.includes(sv), "sysVarCurrent":true});
                            if(availableSystemVariables.includes(sv))
                            {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(sv), 1);
                            }
                            i = i + 1;
                        }

                        for (var stationSerial in stations)
                        {
                            station = stations[stationSerial];
                            
                            json.data.push({"sysVarName":`eufyCentralState${station.getSerial()}`, "sysVarInfo":`aktueller Status der Basis ${station.getSerial()}`, "sysVarAvailable":availableSystemVariables.includes("eufyCentralState" + station.getSerial()), "sysVarCurrent":true});
                            if(availableSystemVariables.includes("eufyCentralState" + station.getSerial()))
                            {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCentralState${station.getSerial()}`), 1);
                            }
                            json.data.push({"sysVarName":`eufyLastModeChangeTime${station.getSerial()}`, "sysVarInfo":`Zeitpunkt des letzten Moduswechsels der Basis ${station.getSerial()}`, "sysVarAvailable":availableSystemVariables.includes("eufyLastModeChangeTime" + station.getSerial()), "sysVarCurrent":true});
                            if(availableSystemVariables.includes("eufyLastModeChangeTime" + station.getSerial()))
                            {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyLastModeChangeTime${station.getSerial()}`), 1);
                            }
                        }
                        
                        for (var deviceSerial in devices)
                        {
                            device = devices[deviceSerial];
                            
                            if(availableSystemVariables.includes("eufyCameraImageURL" + device.getSerial()))
                            {
                                json.data.push({"sysVarName":`eufyCameraImageURL${device.getSerial()}`, "sysVarInfo":`Standbild der Kamera ${device.getSerial()}`, "sysVarAvailable":availableSystemVariables.includes("eufyCameraImageURL" + device.getSerial()), "sysVarCurrent":false});
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCameraImageURL${device.getSerial()}`), 1);
                            }
                            json.data.push({"sysVarName":`eufyCameraVideoTime${device.getSerial()}`, "sysVarInfo":`Zeitpunkt des letzten Videos der Kamera ${device.getSerial()}`, "sysVarAvailable":availableSystemVariables.includes("eufyCameraVideoTime" + device.getSerial()), "sysVarCurrent":true});
                            if(availableSystemVariables.includes("eufyCameraVideoTime" + device.getSerial()))
                            {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCameraVideoTime${device.getSerial()}`), 1);
                            }
                            json.data.push({"sysVarName":`eufyCameraVideoURL${device.getSerial()}`, "sysVarInfo":`letztes Video der Kamera ${device.getSerial()}`, "sysVarAvailable":availableSystemVariables.includes("eufyCameraVideoURL" + device.getSerial()), "sysVarCurrent":true});
                            if(availableSystemVariables.includes("eufyCameraVideoURL" + device.getSerial()))
                            {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCameraVideoURL${device.getSerial()}`), 1);
                            }
                        }

                        if(availableSystemVariables.length > 0)
                        {
                            for(let i = 0; i < availableSystemVariables.length; i++)
                            {
                                json.data.push({"sysVarName":`${availableSystemVariables[i]}`, "sysVarInfo":`unbekannte Variable`, "sysVarAvailable":true, "sysVarCurrent":false});
                                availableSystemVariables.splice(availableSystemVariables.indexOf(availableSystemVariables[i]), 1);
                                i--;
                            }
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
                this.logError(`Error occured at checkSystemVariables(). Error: ${e.message}`);
                this.setLastConnectionInfo(false);
                json = {"success":false, "reason":e.message};
            }
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
        var res = await this.homematicApi.createSystemVariable("localhost", false, variableName, variableInfo);

        if(res !== undefined && res == variableName)
        {
            return `{"success":true,"message":"System variable created."}`;
        }
        else if(res === undefined)
        {
            return `{"success":false, "reason":"Error while creating system variable: faild to communicate with CCU."}`;
        }
        else
        {
            return `{"success":false,"message":"Error while creating system variable."}`;
        }
    }

    /**
     * Removes a system variable with the given name.
     * @param variableName The name of the system variable to create.
     */
    public async removeSystemVariable(variableName : string) : Promise<string>
    {
        var res = await this.homematicApi.removeSystemVariable("localhost", false, variableName);

        if(res !== undefined && res === "true")
        {
            return `{"success":true,"message":"System variable removed."}`;
        }
        else if(res === undefined)
        {
            return `{"success":false, "reason":"Error while removing system variable: faild to communicate with CCU."}`;
        }
        else
        {
            return `{"success":true,"message":"Error while removing system variable."}`;
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
        this.setSystemVariableString(systemVariable, makeDateTimeString(dateTime.getTime()));
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
            this.homematicApi.setSystemVariable("localhost", false, systemVariable, newValue);
        }
    }

    /**
     * Send the interaction to the target.
     * @param hostName The hostname.
     * @param useHttps true if use https, otherwise false.
     * @param command The command to be executed.
     */
    public async sendInteractionCommand(hostName: string, useHttps: boolean, command: string): Promise<void>
    {
        await this.homematicApi.sendInteractionCommand(hostName, useHttps, command);
    }

    /**
     * Set the interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     * @param target the target.
     * @param useHttps true if use https, otherwise false.
     * @param command The command to be executed.
     */
    public setInteraction(serialNumber: string, eventInteractionType: EventInteractionType, target: string, useHttps: boolean, command: string): string
    {
        var json = {};
        try
        {
            if(serialNumber !== "" && eventInteractionType >= 0 && eventInteractionType <= 12 && target !== "" && command !== "")
            {
                var res = this.devices.setDeviceInteraction(serialNumber, eventInteractionType, {target: target, useHttps: useHttps, command: command});
                if(res === true)
                {
                    json = {"success":true, "data":`Interaction has been added successfully.`};
                }
                else
                {
                    json = {"success":false, "reason":"Interaction not been added."};
                }
            }
            else
            {
                json = {"success":false, "reason":"One or more arguments not given."};
            }
        }
        catch (error: any)
        {
            json = {"success":false, "reason":`${error.message}`};
        }

        return JSON.stringify(json);
    }

    /**
     * Test the interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public async testInteraction(serialNumber: string, eventInteractionType: EventInteractionType): Promise<string>
    {
        var json = {};
        var deviceInteraction = this.devices.getDeviceInteraction(serialNumber, eventInteractionType);
        if(deviceInteraction !== null)
        {
            await this.sendInteractionCommand(deviceInteraction.target, deviceInteraction.useHttps, deviceInteraction.command);
            json = {"success":true, "data":`Sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
        }
        else
        {
            json = {"success":false, "data":`No interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
        }

        return JSON.stringify(json);
    }

    /**
     * Delete the interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public async deleteInteraction(serialNumber: string, eventInteractionType: EventInteractionType): Promise<string>
    {
        var json = {};
        var deviceInteraction = this.devices.getDeviceInteraction(serialNumber, eventInteractionType);
        try
        {
            if(deviceInteraction !== null)
            {
                this.devices.deleteDeviceInteraction(serialNumber, eventInteractionType);
                json = {"success":true, "data":`Delete interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
            }
            else
            {
                json = {"success":false, "data":`No interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
            }
        }
        catch (error: any)
        {
            json = {"success":false, "reason":`${error.message}`};
        }

        return JSON.stringify(json);
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
            case GuardMode.CUSTOM1:
            case GuardMode.CUSTOM2:
            case GuardMode.CUSTOM3:
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
     * Get the event duration time in seconds.
     * @returns The event duration in seconds.
     */
    public getEventDurationSeconds() : number
    {
        return this.config.getEventDurationSeconds()
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
        this.logger.logInfoBasic(`  updateDeviceData scheduled (runs every ${this.config.getUpdateDeviceDataIntervall()} minutes).`);

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
     * Return the version of this API as Json string.
     */
    public getApiVersionAsJson() : string
    {
        return `{"success":true,"platform":"${process.platform}","nodeVersion":"${process.version}","nodeArch":"${process.arch}","apiVersion":"${this.getEufySecurityApiVersion()}","homematicApiVersion":"${this.homematicApi.getHomematicApiVersion()}","eufySecurityClientVersion":"${this.getEufySecurityClientVersion()}"}`;
    }

    /**
     * Retrieves the state of api objects as Json string.
     * @returns The state of different api elements as Json string.
     */
    public async getApiStateAsJson() : Promise<string>
    {
        var json : any = {};

        json = {"success":true, "data":{"serviceState":this.getServiceState(),"isConnectedToEufy":this.isConnected(),"stations":[]}};

        if(this.stations)
        {
            var stations = await this.getStations();
            for(var stationSerial in stations)
            {
                var station = stations[stationSerial];
                json.data.stations.push({"stationSerial":station.getSerial(),"stationName":station.getName(),"isP2pConnected":station.isConnected()});
            }
        }

        return JSON.stringify(json);
    }

    /**
     * Process and accept invitations.
     */
    public async processInvitations(): Promise<void>
    {
        let refreshCloud = false;

        const invites = await this.httpService.getInvites().catch(err => {
            const error = ensureError(err);
            this.logError("Error getting invites from cloud", { error: getError(error) });
            return error;
        });
        if(Object.keys(invites).length > 0)
        {
            const confirmInvites: Array<ConfirmInvite> = [];
            for(const invite of Object.values(invites) as Invite[])
            {
                const devices: Array<string> = [];
                invite.devices.forEach(device => {
                    devices.push(device.device_sn);
                });
                if(devices.length > 0)
                {
                    confirmInvites.push({
                        invite_id: invite.invite_id,
                        station_sn: invite.station_sn,
                        device_sns: devices
                    });
                }
            }
            if (confirmInvites.length > 0)
            {
                const result = await this.httpService.confirmInvites(confirmInvites).catch(err => {
                    const error = ensureError(err);
                    this.logError("Error in confirmation of invitations", { error: getError(error), confirmInvites: confirmInvites });
                    return error;
                });
                if(result)
                {
                    this.logInfo(`Accepted received invitations`, confirmInvites);
                    refreshCloud = true;
                }
            }
        }

        const houseInvites = await this.httpService.getHouseInviteList().catch(err => {
            const error = ensureError(err);
            this.logError("Error getting house invites from cloud", { error: getError(error) });
            return error;
        });
        if(Object.keys(houseInvites).length > 0)
        {
            for(const invite of Object.values(houseInvites) as HouseInviteListResponse[]) {
                const result = await this.httpService.confirmHouseInvite(invite.house_id, invite.id).catch(err => {
                    const error = ensureError(err);
                    this.logError("Error in confirmation of house invitations", { error: getError(error) });
                    return error;
                });
                if(result)
                {
                    this.logInfo(`Accepted received house invitation from ${invite.action_user_email}`, { invite: invite });
                    refreshCloud = true;
                }
            }
        }
        if(refreshCloud)
        {
            this.refreshCloudData();
        }
    }

    /**
     * Returns the version of this API.
     * @returns The version of this API.
     */
    public getEufySecurityApiVersion() : string
    {
        return "2.2.1";
    }

    /**
     * Return the version of the library used for communicating with eufy.
     * @returns The version of the used eufy-security-client.
     */
    public getEufySecurityClientVersion() : string
    {
        return "2.8.1";
    }
}