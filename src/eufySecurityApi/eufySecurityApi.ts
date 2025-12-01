import { TypedEmitter } from "tiny-typed-emitter";

import { Config } from "./config";
import { HTTPApi, GuardMode, Station, Device, PropertyName, LoginOptions, HouseDetail, PropertyValue, RawValues, InvalidPropertyError, PassportProfileResponse, ConfirmInvite, Invite, HouseInviteListResponse, HTTPApiPersistentData, Picture, DeviceType, DeviceConfig } from "./http";
import { OpenCcuApi } from "./openCcuApi";
import { rootAddonLogger, setLoggingLevel } from "./logging";
import { PushService } from "./pushService";
import { MqttService } from "./mqttService";
import { generateUDID, generateSerialnumber, getError } from "./utils";
import { Devices } from "./devices"
import { Stations } from "./stations";
import { DatabaseQueryLatestInfo, DatabaseQueryLatestInfoLocal, DatabaseQueryLocal, DatabaseReturnCode, P2PConnectionType } from "./p2p";
import { sleep } from "./push/utils";
import { EufyHouses } from "./houses";
import { NotSupportedError, ReadOnlyPropertyError, ensureError } from "./error";
import { getDateTimeFromImageFilePath, randomNumber } from "./http/utils";
import { PhoneModels, timeZoneData } from "./http/const";
import { getModelName, getDeviceTypeAsString, makeDateTimeString, getStationTypeString, waitForStationEvent, waitForDeviceEvent, waitForHttpApiEvent, convertMapToObject } from "./utils/utils";
import { countryData } from "./utils/const";
import { apiServiceState, EventInteractionType, RefreshDataTarget } from "./utils/types";
import { Localization } from "./localization/localization";
import { OpenCcuSystemvariableBinary, OpenCcuSystemvariableFloat, OpenCcuSystemvariableGeneric, OpenCcuSystemvariableInteger, OpenCcuSystemvariableString } from "./utils/models";
import { EufySecurityEvents } from "./interfaces";

export class EufySecurityApi extends TypedEmitter<EufySecurityEvents> {
    private config: Config;
    private translator: Localization;
    private httpService !: HTTPApi;
    private openCcuApi !: OpenCcuApi;
    private pushService !: PushService;
    private mqttService !: MqttService;
    private httpApiPersistentData: HTTPApiPersistentData = { user_id: "", email: "", nick_name: "", device_public_keys: {}, clientPrivateKey: "", serverPublicKey: "" };
    private houses !: EufyHouses;
    private devices !: Devices;
    private stations !: Stations;
    private connected = false;
    private retries = 0;
    private serviceState: apiServiceState = "init";
    private captchaState = { captchaId: "", captcha: "" };
    private tfaCodeRequested = false;

    private taskUpdateState !: NodeJS.Timeout;
    private waitUpdateState !: NodeJS.Timeout;
    private refreshEufySecurityCloudTimeout?: NodeJS.Timeout;

    /**
     * Create the api object.
     */
    constructor() {
        super();

        this.config = new Config();
        setLoggingLevel("addon", this.config.getLogLevelAddon());
        setLoggingLevel("main", this.config.getLogLevelMain());
        setLoggingLevel("http", this.config.getLogLevelHttp());
        setLoggingLevel("p2p", this.config.getLogLevelP2p());
        setLoggingLevel("push", this.config.getLogLevelPush());
        setLoggingLevel("mqtt", this.config.getLogLevelMqtt());
        setLoggingLevel("i18n", this.config.getLogLevelAddon());
        this.openCcuApi = new OpenCcuApi(this);
        this.translator = new Localization(this);

        this.initialize();
    }

    /**
     * Initialize the api and make basic settings check.
     */
    private async initialize(): Promise<void> {
        if (this.config.getEmailAddress() === "" || this.config.getPassword() === "") {
            let missingSettings = "";
            if (this.config.getEmailAddress() === "") {
                missingSettings = "email";
            }
            if (this.config.getPassword() === "") {
                if (missingSettings !== "") {
                    missingSettings += ", ";
                }
                missingSettings += "password";
            }

            rootAddonLogger.error(`Please check your settings in the 'config.json' file.\r\nIf there was no 'config.json', it should now be there.\r\nYou need to set at least email and password to run this addon (missing: ${missingSettings}).`);

            this.setServiceState("configNeeded");
        } else {
            if (this.config.getClientPrivateKey() === undefined || this.config.getClientPrivateKey() === "" || this.config.getServerPublicKey() === undefined || this.config.getServerPublicKey() === "") {
                rootAddonLogger.debug("Incomplete persistent data for v2 encrypted cloud api communication. Invalidate authenticated session data.");
                this.config.setToken("");
                this.config.setTokenExpire(0);
            }
            this.httpApiPersistentData.user_id = this.config.getUserId();
            this.httpApiPersistentData.email = this.config.getEmailAddress();
            this.httpApiPersistentData.nick_name = this.config.getNickName();
            this.httpApiPersistentData.clientPrivateKey = this.config.getClientPrivateKey();
            this.httpApiPersistentData.serverPublicKey = this.config.getServerPublicKey();
            this.httpApiPersistentData.device_public_keys = this.config.getDevicePublicKeys();

            this.httpService = await HTTPApi.initialize(this.config.getCountry(), this.config.getEmailAddress(), this.config.getPassword(), this.httpApiPersistentData);

            this.httpService.setLanguage(this.config.getLanguage());

            if (this.config.getTrustedDeviceName() === undefined || this.config.getTrustedDeviceName() === "" || this.config.getTrustedDeviceName() === "eufyclient") {
                this.config.setTrustedDeviceName(PhoneModels[randomNumber(0, PhoneModels.length)]);
            }

            this.httpService.setPhoneModel(this.config.getTrustedDeviceName());

            this.httpService.on("close", () => this.onAPIClose());
            this.httpService.on("logout", () => this.onAPILogout());
            this.httpService.on("connect", () => this.onAPIConnect());
            this.httpService.on("captcha request", (captchaId: string, captcha: string) => this.onCaptchaRequest(captchaId, captcha));
            this.httpService.on("auth token renewed", (token, token_expiration) => this.onAuthTokenRenewed(token, token_expiration));
            this.httpService.on("auth token invalidated", () => this.onAuthTokenInvalidated());
            this.httpService.on("tfa request", () => this.onTfaRequest());
            this.httpService.on("connection error", (error: Error) => this.onAPIConnectionError(error));

            this.httpService.setToken(this.getToken());
            this.httpService.setTokenExpiration(new Date(this.getTokenExpire()));

            if (this.config.getOpenudid() === "") {
                this.config.setOpenudid(generateUDID());
                rootAddonLogger.debug("Generated new openudid", { openudid: this.config.getOpenudid() });
            }
            this.httpService.setOpenUDID(this.config.getOpenudid());

            if (this.config.getSerialNumber() === "") {
                this.config.setSerialNumber(generateSerialnumber(12));
                rootAddonLogger.debug("Generated new serial_number", { serialnumber: this.config.getSerialNumber() });
            }
            this.httpService.setSerialNumber(this.config.getSerialNumber());

            if (this.config.getPushServiceActive() === true) {
                rootAddonLogger.info("Started initializing push notification connection.");
                try {
                    this.pushService = new PushService(this, this.httpService, this.config);
                } catch (e) {
                    rootAddonLogger.info("No country and/or language given. Skipping creating push service.", {error: e});
                }
            }

            this.mqttService = new MqttService(this, this.config);

            await this.connect();
        }

        this.translator = await Localization.initialize(this);
    }

    /**
     * Returns the state of the service.
     * @returns The state of the service.
     */
    public getServiceState(): string {
        return this.serviceState;
    }

    /**
     * Set the state of the service to the given value.
     * @returns The state of the service.
     */
    public setServiceState(state: apiServiceState): void {
        this.serviceState = state;
    }

    public async logout(): Promise<string> {
        if (this.connected === true) {
            return `{"success":${await this.httpService.logout()}}`;
        } else {
            return `{"success":false,"message":"Not connected"}`;
        }
    }

    /**
     * Returns the account info as PassportProfileResponse.
     * @returns The account info as PassportProfileResponse.
     */
    private async getAccountInfo(): Promise<PassportProfileResponse | null> {
        if (this.connected === true) {
            return await this.httpService.getPassportProfile();
        } else {
            return null;
        }
    }

    /**
     * Returns the account info as JSON string.
     * @returns The account info as JSON string.
     */
    public async getAccountInfoAsJson(): Promise<string> {
        let json: any = {};

        const passportProfile = await this.getAccountInfo();

        if (passportProfile) {
            json = {"success":true,"message":passportProfile};
        } else {
            json = {"success":false,"reason":"No connection to eufy."};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns the tfa and captcha state as JSON string.
     * @returns The tfa and captcha state as JSON string.
     */
    public getTfaCaptchaState(): string {
        let json: any = {};
        let captchaNeeded = false;

        if (this.captchaState.captchaId !== "" || this.captchaState.captcha !== "") {
            captchaNeeded = true;
        }

        json = {"success":true,"tfaNeeded":this.tfaCodeRequested,"captchaNeeded":captchaNeeded,"captcha":this.captchaState};
        return JSON.stringify(json);
    }

    /**
     * Set the code from the captcha image and login again.
     * @param code The code from the captcha image.
     * @returns The result as JSON string.
     */
    public setCaptchaCode(code: string): string {
        let json: any = {};
        let success = false;
        let message = "No captcha code requested.";

        if (this.captchaState.captchaId !== "" || this.captchaState.captcha !== "") {
            this.connect({ captcha: { captchaId: this.captchaState.captchaId, captchaCode: code}, force: false });
            success = true;
            message = "Connecting again with the captcha code provided.";
        }

        json = {"success":success,"message":message};
        return JSON.stringify(json);
    }

    /**
     * Set the code from the tfa and login again.
     * @param code The tfa code provided.
     * @returns The result as JSON string.
     */
    public setTfaCode(code: string): string {
        let json: any = {};
        let success = false;
        let message = "No tfa code requested.";

        if (this.tfaCodeRequested === true) {
            this.connect({ verifyCode: code, force: false });
            success = true;
            message = "Connecting again with the tfa code provided.";
        }

        json = {"success":success,"message":message};
        return JSON.stringify(json);
    }

    /**
     * Returns the setting value if access to api is secured by sid.
     * @returns true, if access to api is secured by sid, otherwise false.
     */
    public isSidCheckEnabled(): boolean {
        return this.config.getSecureApiAccessBySid();
    }

    /**
     * Checks if a given sid represents a currently authenticated session.
     * @param sid The sid to check.
     * @returns true, if the sid is correct, otherwise false.
     */
    public async checkSid(sid: string): Promise<boolean> {
        return this.openCcuApi.checkSid(sid);
    }

    /**
     * Close the EufySecurityApi.
     */
    public async close(): Promise<void> {
        if (this.refreshEufySecurityCloudTimeout !== undefined) {
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
    private closePushService(): void {
        rootAddonLogger.info("Stopping PushService...");
        if (this.pushService) {
            this.pushService.close();
        }
    }

    /**
     * Close the MqttService
     */
    private closeMqttService(): void {
        rootAddonLogger.info("Stopping MqttService...");
        if (this.mqttService) {
            this.mqttService.close();
        }
    }

    /**
     * Close all P2P connections from all stations.
     */
    private async closeStation(): Promise<void> {
        rootAddonLogger.info("Closing connections to all stations...");
        if (this.devices !== null && this.devices !== undefined) {
            this.devices.close();
        }
        if (this.stations !== null && this.stations !== undefined) {
            await this.stations.close();
        }
    }

    /**
     * Close all devices.
     */
    private async closeDevice(): Promise<void> {
        rootAddonLogger.info("Closing connections to all devices...");
        if (this.devices !== null && this.devices !== undefined) {
            this.devices.closeDevices();
        }
    }

    /**
     * Checks if the device a solo device.
     * @param serial The serial of the station or device.
     * @returns True if device is a solo device, otherwise false.
     */
    public async isSoloDevice(serial: string): Promise<boolean> {
        return await this.devices.isSoloDevice(serial);
    }

    /**
     * Login with the in the api provoded login information.
     * @param options Options for login.
     */
    public async connect(options?: LoginOptions): Promise<void> {
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
            .catch ((err) => {
                const error = ensureError(err);
                rootAddonLogger.error("Connect Error", { error: getError(error), options: options });
            });
    }

    /**
     * Returns a boolean value to indicate the connection state.
     * @returns True if connected to eufy, otherwise false.
     */
    public isConnected(): boolean {
        return this.connected;
    }

    /**
     * Returns the connection state of the mqtt service.
     * @returns Connection state of the MqttService as boolean value.
     */
    public isMqttServiceConnected(): boolean {
        return this.mqttService.isConnected();
    }

    /**
     * Returns the MqttService object.
     * @returns The MqttSerivce object.
     */
    public getMqttService(): MqttService {
        return this.mqttService;
    }

    /**
     * Eventhandler for the API Close event.
     */
    private async onAPIClose(): Promise<void> {
        if (this.refreshEufySecurityCloudTimeout !== undefined) {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        this.connected = false;
        this.setServiceState("disconnected");
        this.emit("close");

        if (this.retries < 3) {
            this.retries++;
            await this.connect()
        } else {
            rootAddonLogger.error(`Tried to re-authenticate to Eufy cloud, but failed in the process. Manual intervention is required!`);
        }
    }

    /**
     * Eventhandler for the API Logout event.
     */
    private async onAPILogout(): Promise<void> {
        if (this.refreshEufySecurityCloudTimeout !== undefined) {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        this.connected = false;
        this.setServiceState("disconnected");
        await this.close();
        this.emit("logout");
        rootAddonLogger.info(`Successfully logged out. Manual intervention is required!`);
    }

    /**
     * Eventhandler for the API Connect event.
     */
    private async onAPIConnect(): Promise<void> {
        this.connected = true;
        this.retries = 0;
        this.emit("connect");

        this.setCaptchaData("", "");
        this.tfaCodeRequested = false;

        this.saveCloudToken();

        if (this.pushService) {
            this.pushService.connect();
        }

        const loginData = this.httpService.getPersistentData();
        if (loginData) {
            this.mqttService.connect(loginData.user_id, this.config.getOpenudid(), this.httpService.getAPIBase(), loginData.email);
        } else {
            rootAddonLogger.warn("No mqtt login data received. Skipping creating mqtt service.");
        }

        this.houses = new EufyHouses(this, this.httpService);
        this.stations = new Stations(this, this.httpService);
        this.devices = new Devices(this, this.httpService);

        if (this.httpService.getPersistentData() !== undefined) {
            this.updateApiPersistentData(this.httpService.getPersistentData()!);
        }

        this.stations.on("station removed", (station: Station) => this.onStationRemoved(station));
        this.stations.on("station image download", (station: Station, file: string, image: Picture) => this.onStationImageDownload(station, file, image));
        this.stations.on("station database query local", (station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLocal[]) => this.onStationDatabaseQueryLocal(station, returnCode, data));
        this.stations.on("station database query latest", (station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLatestInfo[]) => this.onStationDatabaseQueryLatest(station, returnCode, data));

        //this.devices.on("device added", (device: Device) => this.onDeviceAdded(device));
        //this.devices.once("devices loaded", () => this.onDevicesLoaded());
        this.devices.on("device removed", (device: Device) => this.onDeviceRemoved(device));

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
    private onAPIConnectionError(error: Error): void {
        this.emit("connection error", error);
        rootAddonLogger.error(`APIConnectionError occured. Error: ${error}`);
        this.setServiceState("disconnected");
    }

    /**
     * Eventhandler for API Captcha Request event.
     * @param captchaId The captchaId.
     * @param captcha The captcha image as base64 encoded string.
     */
    private onCaptchaRequest(captchaId: string, captcha: string): void {
        this.emit("captcha request", captchaId, captcha);
        this.setCaptchaData(captchaId, captcha);
        rootAddonLogger.info(`Entering captcha code needed. Please check the addon website.`);
    }

    /**
     * Eventhandler for API Auth Token Renewed event.
     * @param token The new token.
     * @param token_expiration The new token expiration time.
     */
    private onAuthTokenRenewed(token: string | null, token_expiration: Date): void {
        this.emit("auth token renewed", token, token_expiration);
        if (token === null) {
            this.setTokenData(undefined, 0);
        } else {
            this.setTokenData(token, token_expiration.getTime());
        }
        rootAddonLogger.info(`The authentication token has been renewed.`);
    }

    /**
     * Eventhandler for API Auth Token Invalidated event.
     */
    private onAuthTokenInvalidated(): void {
        this.emit("auth token invalidated");
        this.setTokenData(undefined, 0);
        this.setServiceState("disconnected");
        rootAddonLogger.info(`The authentication token is invalid and has been removed.`);
    }

    /**
     * Eventhandler for API Tfa Request.
     */
    private onTfaRequest(): void {
        this.emit("tfa request");
        this.tfaCodeRequested = true
        rootAddonLogger.info(`A tfa (two factor authentication) request received. The tfa support is in beta phase at the moment.`);
    }

    /**
     * The action to be performed when event station removed is fired.
     * @param station The station as Station object.
     */
    private onStationRemoved(station: Station): void {
        rootAddonLogger.info(`The station ${station.getSerial()} has been removed.`);
    }

    /**
     * The action to be performed when event station image download is fired.
     * @param station The station as Station object.
     * @param file The file name.
     * @param image The image.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async onStationImageDownload(station: Station, file: string, image: Picture): Promise<void> {
        /*var filename = path.basename(file);
        var filenameContent = path.parse(file).name.split("_c", 2);
        var channel = filenameContent[1];
        var device = (await this.devices.getStationDevice(station.getSerial(), Number.parseInt(channel))).getSerial();
        try {
            if (!existsSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/`)) {
                mkdirSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/`, { recursive: true });
            } else {
                var files = readdirSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/`)
                for (var file in files) {
                    if (filename !== files[file]) {
                        unlinkSync(path.join(`/var/eufySecurity/images/${station.getSerial()}/${device}/`, files[file]));
                    }
                }
            }
            writeFileSync(`/var/eufySecurity/images/${station.getSerial()}/${device}/${filename}`, image.data);
        } catch (e: any) {
            rootAddonLogger.error(`StationImageDownload: Error occured: ${e.message}`);
        }*/
    }

    /**
     * The action to be performed when event station database query local is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param data The result data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async onStationDatabaseQueryLocal(station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLocal[]): Promise<void> {
        /*var deviceSerials: string[] = [];
        if (returnCode === 0 && data && data.length > 0) {
            for (let i=0; i<data.length; i++) {
                let deviceSerial = data[i].device_sn;
                if (deviceSerial) {
                    if (!deviceSerials.includes(deviceSerial)) {
                        deviceSerials.push(deviceSerial);
                    }
                    this.devices.addEventResultForDevice(deviceSerial, data[i]);
                }
            }

            for (let deviceSerial in deviceSerials) {
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
    private async onStationDatabaseQueryLatest(station: Station, returnCode: DatabaseReturnCode, data: DatabaseQueryLatestInfo[]): Promise<void> {
        if (returnCode === 0 && data && data.length > 0) {
            for (let i=0; i<data.length; i++) {
                try {
                    const response = data[i] as DatabaseQueryLatestInfoLocal;

                    if (response.device_sn === undefined || !(this.devices.existDevice(response.device_sn))) {
                        rootAddonLogger.debug(`StationDatabaseQueryLatest: Station ${station.getSerial()} has no device with serial ${response.device_sn}.`);
                        continue;
                    }

                    if (response.crop_local_path === "") {
                        rootAddonLogger.debug(`StationDatabaseQueryLatest: Empty path detected.`, JSON.stringify(response));
                        continue;
                    }

                    const device = await this.devices.getDevice(response.device_sn);
                    if (device.hasProperty(PropertyName.DevicePictureTime)) {
                        const pictureTimeValue = device.getPropertyValue(PropertyName.DevicePictureTime) as number;

                        if (pictureTimeValue === 0) {
                            rootAddonLogger.debug(`StationDatabaseQueryLatest: Initialize the pictureTime property.`, { station: station.getSerial(), device: device.getSerial(), pictureTimeValue: pictureTimeValue, filePath: response.crop_local_path });

                            const imageTime = getDateTimeFromImageFilePath(response.crop_local_path);
                            if (imageTime === undefined) {
                                this.updateCameraEventTimeSystemVariable(response.device_sn, -1);
                                device.setCustomPropertyValue(PropertyName.DevicePictureTime, -1);
                            } else {
                                this.updateCameraEventTimeSystemVariable(response.device_sn, imageTime.valueOf());
                                device.setCustomPropertyValue(PropertyName.DevicePictureTime, imageTime.valueOf());
                            }
                        } else if (pictureTimeValue > 0) {
                            rootAddonLogger.debug(`StationDatabaseQueryLatest: The pictureTime property already set.`, { station: station.getSerial(), device: device.getSerial(), pictureTimeValue: pictureTimeValue });
                            this.updateCameraEventTimeSystemVariable(response.device_sn, pictureTimeValue);
                        } else {
                            rootAddonLogger.error(`StationDatabaseQueryLatest: There was an previous error retrieving the pictureTime.`, { station: station.getSerial(), device: device.getSerial() });
                        }
                    }
                } catch (e: any) {
                    rootAddonLogger.error(`StationDatabaseQueryLatest: Error occured: ${e.message}`);
                    continue;
                }
            }
        }
    }

    /**
     * The action to be performed when event device added is fired.
     * @param device The device as Device object.
     */
    private async onDeviceAdded(device: Device): Promise<void> {
        //this.devices.getDeviceEvents(device.getSerial());
        this.devices.getDeviceLastEvent(device.getSerial());
    }

    /**
     * The action to be performed when event devices loaded is fired.
     */
    private async onDevicesLoaded(): Promise<void> {
        //this.devices.getDevicesEvents();
        this.devices.getDevicesLastEvent();
    }

    /**
     * The action to be performed when event device removed is fired.
     * @param device The device as Device object.
     */
    private onDeviceRemoved(device: Device): void {
        rootAddonLogger.info(`The device ${device.getSerial()} has been removed.`);
    }

    /**
     * Returns the all stations as array.
     * @returns The array with all stations.
     */
    public async getStations(): Promise<{ [stationSerial: string ]: Station }> {
        return await this.stations.getStations();
    }

    /**
     * Returns the station object specified by the station serial.
     * @param stationSerial The serial of the station to retrive.
     * @returns The station as object.
     */
    public async getStation(stationSerial: string): Promise<Station> {
        return await this.stations.getStation(stationSerial);
    }

    /**
     * Returns all devices as object.
     * @returns The object.
     */
    public async getDevices(): Promise<{ [deviceSerial: string]: Device }> {
        return await this.devices.getDevices();
    }

    /**
     * Returns all devices of a given station as object.
     * @returns The object.
     */
    public async getDevicesFromStation(baseSerial: string): Promise<Array<Device>> {
        return await this.devices.getDevicesFromStation(baseSerial);
    }

    /**
     * Returns a device specified by a given serial.
     * @param deviceSerial The serial of the device.
     * @returns The device as object.
     */
    public async getDevice(deviceSerial: string): Promise<Device> {
        return await this.devices.getDevice(deviceSerial);
    }

    /**
     * Returns a device specified by station serial and channel.
     * @param stationSerial The serial of the station.
     * @param channel The channel of the device.
     * @returns The device as object.
     */
    public async getStationDevice(stationSerial: string, channel: number): Promise<Device> {
        return this.devices.getDeviceByStationAndChannel(stationSerial, channel);
    }

    /**
     * Checks if a device with the given serial exists.
     * @param deviceSerial The deviceSerial of the device to check.
     * @returns True if device exists, otherwise false.
     */
    public existDevice(deviceSerial: string): boolean {
        return this.devices.existDevice(deviceSerial);
    }

    /**
     * Returns all houses of the account.
     * @returns The houses object.
     */
    public getHouses(): { [houseId: string]: any} {
        return this.houses.getHouses();
    }

    /**
     * Returns a house specified by houseId.
     * @param houseId The houseId of the house.
     * @returns The house as object.
     */
    public async getHouse(houseId: string): Promise<HouseDetail | null> {
        return await this.houses.getHouse(houseId);
    }

    /**
     * Sets the captcha data to the captchaState variable.
     * @param captchaId The value for the captcha id.
     * @param captcha the captcha image as base64 string.
     */
    public setCaptchaData(captchaId: string, captcha: string): void {
        this.captchaState.captchaId = captchaId;
        this.captchaState.captcha = captcha;
    }

    /**
     * Save the login tokens.
     */
    private saveCloudToken(): void {
        const token = this.httpService.getToken();
        const token_expiration = this.httpService.getTokenExpiration();

        if (!!token && !!token_expiration) {
            rootAddonLogger.debug("Save cloud token and token expiration", { token: token, tokenExpiration: token_expiration });
            this.config.setToken(token);
            this.config.setTokenExpire(token_expiration.getTime());
        }
    }

    /**
     * Save the persistent http api data.
     * @param httpApiPersistentData The persistent data for the http api to save.
     */
    public updateApiPersistentData(httpApiPersistentData: HTTPApiPersistentData): void {
        this.config.setUserId(httpApiPersistentData.user_id);
        this.config.setNickName(httpApiPersistentData.nick_name);
        this.config.setClientPrivateKey(httpApiPersistentData.clientPrivateKey);
        this.config.setServerPublicKey(httpApiPersistentData.serverPublicKey);
        this.config.setDevicePublicKeys(httpApiPersistentData.device_public_keys);
    }

    /**
     * Refreshing cloud data.
     */
    public async refreshCloudData(): Promise<void> {
        if (this.config.getAcceptInvitations()) {
            await this.processInvitations().catch (err => {
                const error = ensureError(err);
                rootAddonLogger.error("Error in processing invitations", { error: getError(error) });
            });
        }

        await this.httpService.refreshAllData().catch (err => {
            const error = ensureError(err);
            rootAddonLogger.error("Error during API data refreshing", { error: getError(error) });
        });

        if (this.refreshEufySecurityCloudTimeout !== undefined) {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }

        if (this.config.getUpdateDeviceDataIntervall() > 0)
            this.refreshEufySecurityCloudTimeout = setTimeout(() => { this.refreshCloudData() }, this.config.getUpdateDeviceDataIntervall() * 60 * 1000);
        else
            rootAddonLogger.info(`Automatic retrieval of data from the cloud has been deactivated (config pollingIntervalMinutes: ${this.config.getUpdateDeviceDataIntervall()})`);
    }

    /**
     * Refresh all Devices, Station and/or Houses and the settings of them.
     */
    public async refreshData(target: RefreshDataTarget): Promise<Map<RefreshDataTarget, boolean>> {
        const result = new Map<RefreshDataTarget, boolean>();
        switch (target) {
            case "all":
                result.set("devices", await waitForHttpApiEvent(this.httpService, "devices", 1000));
                result.set("houses", await waitForHttpApiEvent(this.httpService, "houses", 1000));
                result.set("stations", await waitForHttpApiEvent(this.httpService, "hubs", 1000));
                break;
            case "devices":
                result.set("devices", await waitForHttpApiEvent(this.httpService, "devices", 1000));
                break;
            case "houses":
                result.set("houses", await waitForHttpApiEvent(this.httpService, "houses", 1000));
                break;
            case "stations":
                result.set("stations", await waitForHttpApiEvent(this.httpService, "hubs", 1000));
                break;
        }
        return result;
    }

    /**
     * Generate a new random trusted device name from the device name list.
     * @returns The trusted device name.
     */
    private generateNewTrustedDeviceName(): string {
        return PhoneModels[randomNumber(0, PhoneModels.length)];
    }

    /**
     * Generate a new random trusted device name and return a JSON resonse.
     * @returns The trusted device name as JSON string.
     */
    public generateNewTrustedDeviceNameJson(): string {
        let json: any = {};
        json = {"success":true, "trustedDeviceName":this.generateNewTrustedDeviceName()};
        return JSON.stringify(json);
    }

    /**
     * Create a JSON object string for a given house.
     * @param house The house the JSON object created for.
     */
    private makeJsonObjectForHouse(house: HouseDetail): any {
        let json: any = {};
        json = {"houseId":house.house_id, "houseName":house.house_name, "isDefault":house.is_default, "geofenceId":house.geofence_id, "address":house.address, "latitude":house.latitude, "longitude":house.longitude, "radiusRange":house.radius_range, "locationMsg":house.location_msg, "createTime":house.create_time, "awayMode":house.away_mode, "homeMode":house.home_mode};
        return json;
    }

    /**
     * Returns a JSON-Representation of all houses.
     */
    public async getHousesAsJson(): Promise<string> {
        let json: any = {};
        try {
            if (this.houses) {
                await this.httpService.refreshHouseData();

                const houses = this.getHouses();

                if (houses) {
                    json = {"success":true, "data":[]};
                    for (const house_id in houses) {
                        const house = await this.getHouse(house_id);
                        if (house && house !== null) {
                            json.data.push(this.makeJsonObjectForHouse(house));
                        }
                    }
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":"No houses found."};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getHousesAsJson. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON-Representation of a given house.
     */
    public async getHouseAsJson(houseId: string): Promise<string> {
        let json: any = {};
        try {
            if (this.houses) {
                await this.httpService.refreshHouseData();

                const house = await this.getHouse(houseId);

                if (house && house !== null) {
                    json = {"success":true, "data":this.makeJsonObjectForHouse(house)};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`No house with id ${houseId} found.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getHouseAsJson. Error: ${e.message}.`, JSON.stringify(e));
            json = {"success":false, "reason":`The house with id ${houseId} does not exists.`};
            this.setLastConnectionInfo(false);
        }

        return JSON.stringify(json);
    }

    /**
     * Create a JSON object for a given device.
     * @param device The device the JSON object created for.
     * @param isEnergySavingDevice True, if the device is an energy saving device, otherwise false.
     * @param isStationP2PConnected True, if the station has an active p2p connection, otherwise false.
    */
    private makeJsonObjectForDevice(device: Device, isEnergySavingDevice: boolean, isStationP2PConnected: boolean): any {
        const properties = device.getProperties();
        let json: any = {};

        json = {"eufyDeviceId":device.getId(), "isEnergySavingDevice":isEnergySavingDevice, "isStationP2PConnected":isStationP2PConnected, "isDeviceKnownByClient":Object.values(DeviceType).includes(device.getDeviceType()), "deviceType":getDeviceTypeAsString(device), "model":device.getModel(), "modelName":getModelName(device.getModel()), "name":device.getName(), "hardwareVersion":device.getHardwareVersion(), "softwareVersion":device.getSoftwareVersion(), "stationSerialNumber":device.getStationSerial()};

        for (const property in properties) {
            switch (property) {
                case PropertyName.Model:
                case PropertyName.Name:
                case PropertyName.HardwareVersion:
                case PropertyName.SoftwareVersion:
                case PropertyName.DeviceStationSN:
                case PropertyName.DevicePicture:
                    break;
                default:
                    json[property] = properties[property] === undefined ? "n/a": properties[property];
            }
        }

        if (device.hasProperty(PropertyName.DevicePicture)) {
            if (device.hasProperty(PropertyName.DevicePictureTime)) {
                const pictureTime = Number(device.getPropertyValue(PropertyName.DevicePictureTime));
                if (pictureTime === undefined || Number.isNaN(pictureTime) || pictureTime <= 0) {
                    json.hasPicture = false;
                } else {
                    json.hasPicture = true;
                }
            }
        }

        return json;
    }

    /**
     * Returns a JSON-Representation of all devices.
     */
    public async getDevicesAsJson(): Promise<string> {
        let json: any = {};
        try {
            if (this.devices) {
                const devices = await this.devices.getDevices();
                if (devices) {
                    json = {"success":true, "data":[]};
                    for (const deviceSerial in devices) {
                        const station = await this.stations.getStation(devices[deviceSerial].getStationSerial());
                        json.data.push(this.makeJsonObjectForDevice(devices[deviceSerial], station.isEnergySavingDevice(), station.isConnected()));
                    }
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":"No devices found."};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getDevicesAsJson. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns all devices as Devices-object
     * @returns All devices as object
     */
    public async getRawDevices(): Promise<Devices> {
        return this.devices;
    }

    /**
     * Returns the last event picture of a given device.
     * @param deviceSerial The serial of the device.
     * @returns The picture.
     */
    public async getDeviceImage(deviceSerial: string): Promise<any> {
        try {
            if (this.devices && this.devices.existDevice(deviceSerial)) {
                const device = await this.devices.getDevice(deviceSerial);
                if (device.hasProperty(PropertyName.DevicePicture)) {
                    return device.getPropertyValue(PropertyName.DevicePicture) as Picture
                }
            } else if (this.devices) {
                if (this.devices.getErrorDeviceImage() !== undefined) {
                    return this.devices.getErrorDeviceImage();
                }
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getDeviceImage. Error: ${e.message}.`, JSON.stringify(e));
        }
        return null;
    }

    /**
     * Returns a JSON-Representation of a given devices.
     */
    public async getDeviceAsJson(deviceSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.devices) {
                const device = await this.devices.getDevice(deviceSerial);
                if (device) {
                    const station = await this.stations.getStation(device.getStationSerial());
                    json = {"success":true, "data":this.makeJsonObjectForDevice(device, station.isEnergySavingDevice(), station.isConnected())};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getDeviceAsJson. Error: ${e.message}.`, JSON.stringify(e));
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
    public async getDevicePropertiesMetadataAsJson(deviceSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.devices) {
                const device = await this.devices.getDevice(deviceSerial);
                if (device) {
                    json = {"success":true, "version":this.getEufySecurityApiVersion(), "model":device.getModel(), "modelName":getModelName(device.getModel()), "isDeviceKnownByClient":Object.values(DeviceType).includes(device.getDeviceType()), "deviceType":getDeviceTypeAsString(device), "data":device.getPropertiesMetadata()};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getDevicePropertiesMetadataAsJson. Error: ${e.message}.`, JSON.stringify(e));
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
    public async getDevicePropertiesAsJson(deviceSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.devices) {
                const device = await this.devices.getDevice(deviceSerial);
                if (device) {
                    let interactions = this.devices.getDeviceInteractions(device.getSerial());
                    if (interactions === undefined || interactions === null) {
                        interactions = null;
                    }
                    json = {"success":true, "version":this.getEufySecurityApiVersion(), "model":device.getModel(), "modelName":getModelName(device.getModel()), "isDeviceKnownByClient":Object.values(DeviceType).includes(device.getDeviceType()), "deviceType":getDeviceTypeAsString(device), "data":{properties: device.getProperties(), "commands": device.getCommands()}, "interactions":interactions};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getDevicePropertiesAsJson. Error: ${e.message}.`, JSON.stringify(e));
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
    public async getDeviceParams(deviceSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.devices) {
                const device = await this.devices.getDevice(deviceSerial);
                if (device) {
                    json = {"success":true, "version":this.getEufySecurityApiVersion(), "params":device.getRawDevice()};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`The device with serial ${deviceSerial} does not exists.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getDeviceParams. Error: ${e.message}.`, JSON.stringify(e));
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
    public async setDeviceProperty(deviceSerial: string, propertyName: string, propertyValue: unknown): Promise<string> {
        let json: any = {};
        try {
            if (this.devices) {
                if (!this.devices.existDevice(deviceSerial)) {
                    json = {"success":false,"reason":`The device with serial ${deviceSerial} does not exists.`};
                }
                try {
                    const res = await waitForDeviceEvent(await this.devices.getDevice(deviceSerial), "property changed", 10000, this.devices, propertyName, propertyValue).then(() => {
                        return true;
                    }, (value: any) => {
                        if (typeof value === "boolean") {
                            return false;
                        } else {
                            throw value;
                        }
                    });
                    json = {"success":res,"reason":`The property change for property ${propertyName} on device ${deviceSerial} ${res === true ? `has been processed` : `has failed`}.`};
                } catch (e) {
                    rootAddonLogger.error(`Error occured at setDeviceProperty.`, JSON.stringify(e));
                    if (e instanceof InvalidPropertyError) {
                        json = {"success":false,"reason":`The device ${deviceSerial} does not support the property ${propertyName}.`};
                    } else if (e instanceof ReadOnlyPropertyError) {
                        json = {"success":false,"reason":`The property ${propertyName} is read only.`};
                    } else {
                        json = {"success":false,"reason":`Other error occured.`};
                    }
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at setDeviceProperty. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Create a JSON object for a given station.
     * @param station The station the JSON object created for.
     */
    private async makeJsonObjectForStation(station: Station): Promise<any> {
        const properties = station.getProperties();
        let json: any = {};

        let privacyMode: boolean | undefined = undefined;
        if (this.devices.existDevice(station.getSerial())) {
            const device = await this.devices.getDevice(station.getSerial());
            if (device.isPanAndTiltCamera()) {
                if (device.isEnabled()) {
                    privacyMode = false;
                } else {
                    privacyMode = true;
                }
            }
        }

        json = {"eufyDeviceId":station.getId(), "isDeviceKnownByClient":Object.values(DeviceType).includes(station.getDeviceType()), "deviceType":getStationTypeString(station), "wanIpAddress":station.getIPAddress(), "isP2PConnected":station.isConnected(), "isEnergySavingDevice":station.isEnergySavingDevice()};
        if (privacyMode !== undefined) {
            json.privacyMode = privacyMode;
        }
        for (const property in properties) {
            switch (property) {
                case PropertyName.Model:
                    json[property] = properties[property];
                    json.modelName = getModelName(station.getModel());
                    break;
                case PropertyName.StationGuardMode:
                    json[property] = properties[property] === undefined ? "n/a": properties[property];
                    break;
                case PropertyName.StationHomeSecuritySettings:
                case PropertyName.StationAwaySecuritySettings:
                    json[property] = properties[property];
                    break;
                default:
                    json[property] = properties[property] === undefined ? "n/a": properties[property];
            }
        }

        return json;
    }

    /**
     * Returns a JSON-Representation of all stations including the guard mode.
     */
    public async getStationsAsJson(): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                const stations = await this.stations.getStations();

                if (stations) {
                    json = {"success":true, "data":[]};
                    for (const stationSerial in stations) {
                        json.data.push(await this.makeJsonObjectForStation(stations[stationSerial]));
                    }
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":"No stations found."};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getStationsAsJson. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Get all stations as Stations-object.
     * @returns All stations as object.
     */
    public async getRawStations(): Promise<Stations> {
        return this.stations;
    }

    /**
     * Returns a JSON string with the station properties metadata.
     * @param stationSerial The station serial for the station.
     * @returns JSON string with all properties metadata.
     */
    public async getStationPropertiesMetadataAsJson(stationSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                const station = await this.stations.getStation(stationSerial);

                if (station) {
                    json = {"success":true, "version":this.getEufySecurityApiVersion(), "type":station.getModel(), "modelName":getModelName(station.getModel()), "isDeviceKnownByClient":Object.values(DeviceType).includes(station.getDeviceType()), "deviceType":getStationTypeString(station), "data":station.getPropertiesMetadata()};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getStationPropertiesMetadataAsJson. Error: ${e.message}.`, JSON.stringify(e));
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
    public async getStationPropertiesAsJson(stationSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                const station = await this.stations.getStation(stationSerial);

                if (station) {
                    json = {"success":true, "version":this.getEufySecurityApiVersion(), "type":station.getModel(), "modelName":getModelName(station.getModel()), "isP2PConnected":station.isConnected(), "isEnergySavingDevice":station.isEnergySavingDevice(), "isDeviceKnownByClient":Object.values(DeviceType).includes(station.getDeviceType()), "deviceType":getStationTypeString(station), "isIntegratedDevice":await this.stations.isStationIntegratedDevice(station), "data":{properties: station.getProperties(), commands: station.getCommands()}};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getStationPropertiesAsJson. Error: ${e.message}.`, JSON.stringify(e));
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
    public async getStationParams(stationSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                const station = await this.stations.getStation(stationSerial);

                if (station) {
                    json = {"success":true, "version":this.getEufySecurityApiVersion(), "params":station.getRawStation()};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getStationParams. Error: ${e.message}.`, JSON.stringify(e));
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
    public async setStationProperty(stationSerial: string, propertyName: string, propertyValue: unknown): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                if (!this.stations.existStation(stationSerial)) {
                    json = {"success":false,"reason":`The station with serial ${stationSerial} does not exists.`};
                }
                try {
                    const res = await waitForStationEvent(await this.stations.getStation(stationSerial), "property changed", 10000, undefined, this.stations, propertyName, propertyValue).then(() => {
                        return true;
                    }, (value: any) => {
                        if (typeof value === "boolean") {
                            return false;
                        } else {
                            throw value;
                        }
                    });
                    json = {"success":res,"reason":`The property change for property ${propertyName} on station ${stationSerial} ${res === true ? `has been processed` : `has failed`}.`};
                } catch (e: any) {
                    if (e instanceof InvalidPropertyError) {
                        json = {"success":false,"reason":`The station ${stationSerial} does not support the property ${propertyName}.`};
                    } else if (e instanceof ReadOnlyPropertyError) {
                        json = {"success":false,"reason":`The property ${propertyName} is read only.`};
                    } else {
                        json = {"success":false,"reason":`Other error occured. Error: ${e.message}.`};
                    }
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at setStationProperty. Error: ${e.message}.`, JSON.stringify(e));
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
    public async rebootStation(stationSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                if (!this.stations.existStation(stationSerial)) {
                    json = {"success":false,"reason":`The station with serial ${stationSerial} does not exists.`};
                }
                try {
                    await (await this.stations.getStation(stationSerial)).rebootHUB();
                    await sleep(5000);
                    json = {"success":true,"reason":`The station ${stationSerial} is restarting.`};
                } catch (e: any) {
                    if (e instanceof NotSupportedError) {
                        json = {"success":false,"reason":`This functionality is not implemented or supported by ${stationSerial}`};
                    } else {
                        json = {"success":false,"reason":`Other error occured. Error: ${e.message}.`};
                    }
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at rebootStation. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Move a given device connected to a given station to a given position.
     * @param deviceSerial The serial of the device.
     * @param presetPosition The preset position as string.
     * @returns A JSON-String.
     */
    public async moveToPresetPosition(deviceSerial: string, presetPosition: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations && this.devices) {
                const device = await this.devices.getDevice(deviceSerial);
                if (device) {
                    const station = await this.stations.getStation(device.getStationSerial());
                    if (station) {
                        try {
                            const presetPositionNumber = Number.parseInt(presetPosition);
                            station.presetPosition(device, presetPositionNumber);
                            await sleep(5000);
                            json = {"success":true,"reason":`The device ${deviceSerial} has been moved to preset ${presetPosition}.`};
                        } catch (e: any) {
                            if (e instanceof NotSupportedError) {
                                json = {"success":false,"reason":`This functionality is not implemented or supported by device ${deviceSerial}`};
                            } else {
                                json = {"success":false,"reason":`Other error occured. Error: ${e.message}.`};
                            }
                            rootAddonLogger.error(`Error occured at moveToPresetPosition. Error: ${e.message}.`, JSON.stringify(e));
                        }
                    } else {
                        json = {"success":false,"reason":`The station with serial ${device.getStationSerial()} does not exists.`};
                    }
                } else {
                    json = {"success":false,"reason":`The device with serial ${deviceSerial} does not exists.`};
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at moveToPresetPosition. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns a JSON-Representation of a given station.
     */
    public async getStationAsJson(stationSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                const station = await this.stations.getStation(stationSerial);

                if (station) {
                    json = {"success":true, "data":await this.makeJsonObjectForStation(station)};
                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getStationAsJson. Error: ${e.message}.`, JSON.stringify(e));
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
    public setDeviceSnooze(device: Device, timeoutMS: number): void {
        this.devices.setDeviceSnooze(device, timeoutMS);
    }

    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    public async updateDeviceProperties(deviceSerial: string, values: RawValues): Promise<void>     {
        await this.devices.updateDeviceProperties(deviceSerial, values);
    }

    /**
     * Retrieves all config-relevat data for each station and update the config.
     * @param stations All stations in the account.
     */
    public async saveStationsSettings(stations: { [stationSerial: string]: Station }): Promise<void> {
        if (this.stations) {
            for (const stationSerial in stations) {
                const station = stations[stationSerial];

                const currentP2pDid = this.config.getP2PDataP2pDid(stationSerial);
                const currentStationIpAddress = this.config.getP2PDataStationIpAddress(stationSerial);

                let newP2pDid: string | undefined = station.getP2pDid();
                let newStationIpAddress: PropertyValue | undefined = station.getLANIPAddress();

                if (newP2pDid === undefined || currentP2pDid === newP2pDid) {
                    newP2pDid = undefined;
                }
                if (newStationIpAddress === undefined || currentStationIpAddress === newStationIpAddress) {
                    newStationIpAddress = undefined;
                }
                if (newP2pDid !== undefined || newStationIpAddress !== undefined) {
                    if (newP2pDid !== undefined) {
                        rootAddonLogger.info(`Updateing p2p did for station ${stationSerial} [new value: ${newP2pDid} | old value: ${currentP2pDid}]`);
                    }
                    if (newStationIpAddress !== undefined) {
                        rootAddonLogger.info(`Updateing ip address for station ${stationSerial} [new value: ${newStationIpAddress} | old value: ${currentStationIpAddress}]`);
                    }
                    try {
                        this.config.setP2PData(stationSerial, newP2pDid, newStationIpAddress);
                    } catch (e: any) {
                        rootAddonLogger.error(`Error occured at saveStationsSettings. Error: ${e.message}.`, JSON.stringify(e));
                    }
                }
            }
        }
    }

    /**
     * Returns the guard mode of all stations as json string.
     */
    public async getGuardMode(): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                let mode = -1;
                const stations = await this.stations.getStations();

                if (stations) {
                    json = {"success":true, "data":[]};
                    for (const stationSerial in stations) {
                        json.data.push(await this.makeJsonObjectForStation(stations[stationSerial]));

                        if (mode === -1) {
                            mode = stations[stationSerial].getGuardMode() as number;
                        } else if (mode !== stations[stationSerial].getGuardMode()) {
                            mode = -2;
                        }

                        this.updateStationGuardModeSystemVariable(stations[stationSerial].getSerial(), stations[stationSerial].getGuardMode());
                    }

                    if (mode > -1) {
                        this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(mode));
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    } else {
                        this.setSystemVariableString("eufyCurrentState", this.translator.translateString("systemVariables:mode.unknown"));
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }

                    this.setLastConnectionInfo(true);
                } else {
                    json = {"success":false, "reason":"No stations found."};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getGuardMode. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Returns the guard mode of all stations.
     */
    public async getGuardModeAsGuardMode(): Promise<GuardMode> {
        let mode = -1;
        try {
            if (this.stations) {
                await this.stations.loadStations();

                const stations = await this.stations.getStations();
                let station: Station;

                if (stations) {
                    for (const stationSerial in stations) {
                        station = stations[stationSerial];
                        if (mode === -1) {
                            mode = station.getGuardMode() as number;
                        } else if (mode !== station.getGuardMode()) {
                            mode = -2;
                        }
                    }
                }
            }
        } catch {
            mode = -1
        }

        if (mode < -1) {
            mode = -1;
        }

        return mode;
    }

    /**
     * Returns the guard mode of one stations.
     */
    public async getGuardModeStation(stationSerial: string): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                await this.stations.loadStations();

                const station = await this.stations.getStation(stationSerial);

                if (station) {
                    json = {"success":true, "data":await this.makeJsonObjectForStation(station)};
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(true);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    if (station.hasProperty(PropertyName.StationGuardModeTime)) {
                        this.setSystemVariableTime("eufyLastModeChangeTime" + station.getSerial(), new Date(station.getPropertyValue(PropertyName.StationGuardModeTime) as number));
                    } else {
                        this.setSystemVariableString("eufyLastModeChangeTime" + station.getSerial(), "n/a");
                    }
                    if (station.hasProperty(PropertyName.StationCurrentModeTime)) {
                        this.setSystemVariableTime("eufyCentralCurrentModeChangeTime" + station.getSerial(), new Date(station.getPropertyValue(PropertyName.StationCurrentModeTime) as number));
                    } else {
                        this.setSystemVariableString("eufyCentralCurrentModeChangeTime" + station.getSerial(), "n/a");
                    }
                } else {
                    json = {"success":false, "reason":`No station with serial ${stationSerial} found.`};
                    this.setLastConnectionInfo(false);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at getGuardModeStation. Error: ${e.message}.`, JSON.stringify(e));
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message};
        }

        return JSON.stringify(json);
    }

    /**
     * Update the guard mode for a given station.
     * @param stationSerial The serialnumber of the station.
     */
    public async updateGuardModeStation(stationSerial: string): Promise<void> {
        await this.getGuardModeStation(stationSerial);
        if (this.waitUpdateState) {
            clearTimeout(this.waitUpdateState);
        }
        this.waitUpdateState = setTimeout(async() => { await this.updateGuardModeStations(); }, 10000);
    }

    /**
     * Update guard mode when changed by event.
     */
    private async updateGuardModeStations(): Promise<void> {
        if (this.waitUpdateState) {
            clearTimeout(this.waitUpdateState);
        }
        await this.getGuardMode();
    }

    /**
     * Set the guard mode of all stations to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode: GuardMode): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                let err = 0;
                const res = await this.stations.setGuardMode(guardMode);

                if (res === true) {
                    const stations = await this.stations.getStations();
                    let station: Station;

                    json = {"success":true, "data":[]};
                    for (const stationSerial in stations) {
                        station = stations[stationSerial];

                        if (guardMode === station.getGuardMode()) {
                            json.data.push({"stationSerial":station.getSerial(), "result":"success", "guardMode":station.getGuardMode()});
                            this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                        } else {
                            err = err + 1;
                            json.data.push({"stationSerial":station.getSerial(), "result":"failure", "guardMode":station.getGuardMode()});
                            this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                            rootAddonLogger.error(`Error occured at setGuardMode: Failed to switch mode for station ${station.getSerial()}.`);
                        }
                    }
                    if (err === 0) {
                        this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(guardMode));
                        this.setLastConnectionInfo(true);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    } else {
                        json.success = false;
                        this.setSystemVariableString("eufyCurrentState", this.translator.translateString("systemVariables:mode.unknown"));
                        this.setLastConnectionInfo(false);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                        rootAddonLogger.error("Error occured at setGuardMode: Failed to switch mode for all stations. Maybe not all stations have been set to new mode.");
                    }
                } else {
                    json = {"success":false, "reason":"Failed to communicate with station."};
                    rootAddonLogger.error("Error occured at setGuardMode: Failed to switch mode for all stations. Maybe not all stations have been set to new mode.");
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at setGuardMode: ${e.message}.`);
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
    public async setGuardModeStation(stationSerial: string, guardMode: GuardMode): Promise<string> {
        let json: any = {};
        try {
            if (this.stations) {
                if (this.devices.existDevice(stationSerial) === true) {
                    const device: Device = await this.devices.getDevice(stationSerial);
                    if (device.isEnabled() === false) {
                        await this.setPrivacyMode(stationSerial, true);
                    }
                }

                const res = await this.stations.setGuardModeStation(stationSerial, guardMode);

                //var stations = await this.stations.getStations();

                const station = await this.stations.getStation(stationSerial);

                if (res) {
                    json = {"success":true, "data":[]};
                    json.data.push({"stationSerial":station.getSerial(), "result":"success", "guardMode":station.getGuardMode()});
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(true);
                    if (station.hasProperty(PropertyName.StationGuardModeTime)) {
                        this.setSystemVariableTime("eufyLastModeChangeTime" + station.getSerial(), new Date(station.getPropertyValue(PropertyName.StationGuardModeTime) as number));
                    } else {
                        this.setSystemVariableString("eufyLastModeChangeTime" + station.getSerial(), "n/a");
                    }
                } else {
                    json = {"success":false, "data":[]};
                    json.data.push({"stationSerial":station.getSerial(), "result":"failure", "guardMode":station.getGuardMode()});
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(false);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    rootAddonLogger.error(`Error occured at setGuardMode: Failed to switch mode for station ${station.getSerial()}.`);
                }
            } else {
                json = {"success":false, "reason":"No connection to eufy."};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at setGuardMode: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message.replaceAll(`"`, `'`)};
        }

        return JSON.stringify(json);
    }

    /**
     * Set the guard mode system variable for a given station.
     * @param stationSerial The serial of the station.
     * @param guardMode The guard mode to set.
     */
    public async updateStationGuardModeSystemVariable(stationSerial: string, guardMode: PropertyValue): Promise<void> {
        const station = await this.stations.getStation(stationSerial);
        this.setSystemVariableString("eufyCentralState" + stationSerial, this.convertGuardModeToString(guardMode as GuardMode));
        if (station.hasProperty(PropertyName.StationGuardModeTime)) {
            this.setSystemVariableTime("eufyLastModeChangeTime" + stationSerial, new Date(station.getPropertyValue(PropertyName.StationGuardModeTime) as number));
        }
    }

    /**
     * Set the current mode system variable for a given station.
     * @param stationSerial The serial of the station.
     * @param guardMode The guard mode to set.
     */
    public async updateStationCurrentModeSystemVariable(stationSerial: string, currentMode: PropertyValue): Promise<void> {
        const station = await this.stations.getStation(stationSerial);
        this.setSystemVariableString("eufyCentralCurrentMode" + stationSerial, this.convertGuardModeToString(currentMode as GuardMode));
        if (station.hasProperty(PropertyName.StationCurrentModeTime)) {
            this.setSystemVariableTime("eufyCentralCurrentModeChangeTime" + stationSerial, new Date(station.getPropertyValue(PropertyName.StationCurrentModeTime) as number));
        }
    }

    /**
     * Enable or disable the privacy mode of the device.
     * @param deviceSerial The serial of the device.
     * @param value The value to set.
     * @returns A JSON string with the result.
     */
    public async setPrivacyMode(deviceSerial: string, value: any): Promise<string> {
        if (this.devices.existDevice(deviceSerial) === true) {
            const device: Device = await this.devices.getDevice(deviceSerial);
            if (device.isPanAndTiltCamera()) {
                if (device.isEnabled() === value) {
                    return `{"success":true,"info":"The value for privacy mode on device ${deviceSerial} already set."}`;
                } else {
                    try {
                        const res = await waitForDeviceEvent(await this.devices.getDevice(deviceSerial), "property changed", 10000, this.devices, PropertyName.DeviceEnabled, value).then(() => {
                            return true;
                        }, (value: any) => {
                            if (typeof value === "boolean") {
                                return false;
                            } else {
                                throw value;
                            }
                        });
                        return `{"success":${res},"enabled":${res === true ? value as boolean : !(value as boolean)}}`;
                    } catch (e: any) {
                        return `{"success":false,"reason":"${JSON.stringify(e)}"}`;
                    }
                }
            } else {
                return `{"success":false,"reason":"Device ${deviceSerial} does not support privacy mode."}`;
            }
        } else {
            return `{"success":false,"reason":"Device ${deviceSerial} does not exists."}`;
        }
    }

    /**
     * Refresh the given type of data from the cloud.
     * @param target The type of the data to refresh.
     * @returns A JSON string with the result.
     */
    public async refreshCloudDeviceData(target: RefreshDataTarget): Promise<string> {
        let json: any = {};

        try {
            const res = await this.refreshData(target);
            rootAddonLogger.info(`res: ${JSON.stringify(res)}`);
            if (target === "all") {
                if (res.get("devices") === true && res.get("houses") === true && res.get("stations") === true) {
                    json = {"success":true, "data":convertMapToObject(res)};
                } else {
                    json = {"success":false, "data":convertMapToObject(res)};
                }
            } else {
                json = {"success":res.get(target), "data":convertMapToObject(res)};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at refreshCloudDeviceData: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = {"success":false, "reason":e.message.replaceAll(`"`, `'`)};
        }

        return JSON.stringify(json);
    }

    /**
     * Forces a new p2p connection to a station specified by serial.
     * @param stationSerial The serial of the station.
     * @returns A JSON string with the result.
     */
    public async connectStation(stationSerial: string): Promise<string> {
        let json: any = {};

        if (this.stations) {
            const station = await this.stations.getStation(stationSerial);

            if (station) {
                if (station.isConnected()) {
                    json = {"success":false, "message":"P2P connection to station already established."};
                } else if (station.isP2PConnectableDevice()) {
                    try {
                        let connected = false;

                        const res = await this.stations.connectStation(station);
                        connected = station.isConnected();

                        json = {"success":res, "connected":connected};
                    } catch (e: any) {
                        json = {"success":false, "message":e.message};
                    }
                }
            } else {
                json = {"success":false, "message":"The specified station could not be found."};
            }
        } else {
            json = {"success":false, "message":"No connection to eufy."};
        }

        return JSON.stringify(json);
    }

    /**
     * Forces to disconnect the p2p connection to a station specified by serial.
     * @param stationSerial The serial of the station.
     * @returns A JSON string with the result.
     */
    public async disconnectStation(stationSerial: string): Promise<string> {
        let json: any = {};

        if (this.stations) {
            const station = await this.stations.getStation(stationSerial);

            if (station) {
                if (!station.isConnected()) {
                    json = {"success":false, "message":"No P2P connection to station established."};
                } else {
                    try {
                        let connected = false;

                        const res = await this.stations.disconnectStation(station);
                        connected = station.isConnected();

                        json = {"success":res, "disconnected":!connected};
                    } catch (e: any) {
                        json = {"success":false, "message":e.message};
                    }
                }
            } else {
                json = {"success":false, "message":"The specified station could not be found."};
            }
        } else {
            json = {"success":false, "message":"No connection to eufy."};
        }

        return JSON.stringify(json);
    }

    /**
     * Forces to reconnect the p2p connection to a station specified by serial.
     * @param stationSerial The serial of the station.
     * @returns A JSON string with the result.
     */

    public async reconnectStation(stationSerial: string): Promise<string> {
        let json: any = {};

        if (this.stations) {
            const station = await this.stations.getStation(stationSerial);

            if (station) {
                if (!station.isP2PConnectableDevice()) {
                    json = {"success":false, "message":"Not a P2P connectable device."};
                } else {
                    const connected = station.isConnected();
                    let res = false;
                    if (connected === true) {
                        try {
                            res = await this.stations.disconnectStation(station);
                        } catch (e: any) {
                            rootAddonLogger.error(`Error during closing p2p connection to station ${stationSerial}. Got value '${JSON.stringify(e)}'.`);
                            json = {"success":false, "message":`Error during closing p2p connection to station ${stationSerial}. Error: '${JSON.stringify(e)}'.`};
                            return JSON.stringify(json);
                        }
                        await sleep(1000);
                    } else {
                        rootAddonLogger.error(`P2p connection to station ${stationSerial} not established.`);
                    }

                    if (connected === false) {
                        try {
                            await sleep(1000);
                            res = await this.stations.connectStation(station);
                        } catch (e: any) {
                            rootAddonLogger.error(`Error during reconnecting p2p connection to station ${stationSerial}. Got value '${JSON.stringify(e)}'.`);
                            json = {"success":false, "message":`Error during reconnecting p2p connection to station ${stationSerial}. Error: '${JSON.stringify(e)}'.`};
                            return JSON.stringify(json);
                        }
                    } else {
                        rootAddonLogger.error(`P2p connection to station ${stationSerial} already established.`);
                    }

                    json = {"success":res, "connected":connected};
                }
            } else {
                json = {"success":false, "message":"The specified station could not be found."};
            }
        } else {
            json = {"success":false, "message":"No connection to eufy."};
        }

        return JSON.stringify(json);
    }

    /**
     * Retrieves the timezones.
     * @returns A JSON string with the timezones.
     */
    public getTimeZones(): string {
        return `{"success":true,"data":${JSON.stringify(timeZoneData)}}`;
    }

    /**
     * Updates the last guard mode change time systemvariable for a given station.
     * @param stationSerial The serial of the station.
     * @param timestamp The timestamp to set.
     */
    public updateStationGuardModeChangeTimeSystemVariable(stationSerial: string, timestamp: number | undefined): void {
        if (this.getStateUpdateEventActive() === true && timestamp !== undefined) {
            this.setSystemVariableTime("eufyLastModeChangeTime" + stationSerial, new Date(timestamp));
        } else {
            this.setSystemVariableString("eufyLastModeChangeTime" + stationSerial, "n/a");
        }
        this.updateGlobalStationGuardModeChangeTimeSystemVariable();
    }

    /**
     * Update the global station guard mode change time systemvariable.
     */
    public async updateGlobalStationGuardModeChangeTimeSystemVariable(): Promise<void> {
        const stations = await this.stations.getStations();
        let station;
        let tempModeChange;
        let lastModeChange = new Date(1970, 1, 1);

        for (const stationSerial in stations) {
            station = stations[stationSerial]
            if (station.hasProperty(PropertyName.StationGuardModeTime)) {
                tempModeChange = new Date(station.getPropertyValue(PropertyName.StationGuardModeTime) as number)
                if (lastModeChange < tempModeChange) {
                    lastModeChange = tempModeChange;
                }
            }
        }
        this.setSystemVariableTime("eufyLastModeChangeTime", lastModeChange);
    }

    /**
     * Updates the last camera event time systemvariable for a given device.
     * @param deviceSerial The serial of the device.
     * @param timestamp The timestamp to set.
     */
    public updateCameraEventTimeSystemVariable(deviceSerial: string, timestamp: number | undefined): void {
        if (this.getApiUsePushService() === true && timestamp !== undefined) {
            this.setSystemVariableTime("eufyCameraVideoTime" + deviceSerial, new Date(timestamp));
        } else {
            this.setSystemVariableString("eufyCameraVideoTime" + deviceSerial, "n/a");
        }
    }

    /**
     * Get the Token from config.
     */
    public getToken(): string {
        return this.config.getToken();
    }

    /**
     * Get the time of expire for the token from the config.
     */
    public getTokenExpire(): number {
        return this.config.getTokenExpire();
    }

    /**
     * Remove all interactions from the config.
     */
    public removeInteractions(): any {
        return this.devices.removeInteractions();
    }

    /**
     * Save the new token and token expire to the config.
     * @param token The token.
     * @param tokenExpire The time the token exprire.
     */
    public setTokenData(token: string | undefined, tokenExpire: number | undefined): string {
        let json: any = {};
        this.config.setToken(token);
        this.config.setTokenExpire(tokenExpire);
        const res = this.config.writeCurrentConfig();
        if (res === "saved" || res === "ok") {
            json = `{"success":true,"dataRemoved":true}`;
        } else {
            json = `{"success":false,"dataRemoved":false}`;
        }
        return json;
    }

    /**
     * Returns if the api use HTTP
     */
    public getHttpActive(): boolean {
        return this.config.getHttpActive();
    }

    /**
     * Get the port (HTTP) used for the api.
     */
    public getHttpPort(): number {
        return this.config.getHttpPort();
    }

    /**
     * Return if the api use HTTPS
     */
    public getHttpsActive(): boolean {
        return this.config.getHttpsActive();
    }

    /**
     * Get the port (HTTPS) used for the api.
     */
    public getHttpsPort(): number {
        return this.config.getHttpsPort();
    }

    /**
     * Returns the key for the HTTPS connection.
     */
    public getHttpsPKeyFile(): string {
        return this.config.getHttpsPKeyFile();
    }

    /**
     * Returns the cert file for https connection.
     */
    public getHttpsCertFile(): string {
        return this.config.getHttpsCertFile();
    }

    /**
     * Get the houseId for filtering stations and devices.
     * @returns The houseId as string.
     */
    public getHouseId(): string {
        return this.config.getHouseId();
    }

    /**
     * Returns true if static udp ports should be used otherwise false.
     */
    public getLocalStaticUdpPortsActive(): boolean {
        return this.config.getLocalStaticUdpPortsActive();
    }

    /**
     * Returns the ports should be used for communication with stations.
     */
    public async getLocalStaticUdpPorts(): Promise<any[]> {
        const json: any = [];
        if (this.stations) {
            const stations = await this.stations.getStations();

            if (stations) {
                for (const stationSerial in stations) {
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
    public getLocalStaticUdpPortForStation(stationSerial: string): number | null {
        if (this.getLocalStaticUdpPortsActive() === true) {
            try {
                return this.config.getLocalStaticUdpPortPerStation(stationSerial);
            } catch {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Retrieves the config setting for enable embedded PKCS1 support.
     * @returns True, if embedded PKCS1 support is enabled, otherwise false.
     */
    public getEnableEmbeddedPKCS1Support(): boolean {
        try {
            return this.config.getEnableEmbeddedPKCS1Support();
        } catch {
            return false;
        }
    }

    /**
     * Retrieves the device config object from settings.
     * @returns The deice config object.
     */
    public getDeviceConfig(): DeviceConfig {
        return this.getConfig().getDeviceConfig() as DeviceConfig;
    }

    /**
     * Returns the internal ip address for the given the station.
     * @param stationSerial The serial for the station.
     * @returns The internal ip address.
     */
    public getLocalIpAddressForStation(stationSerial: string): string {
        try {
            return this.config.getP2PDataStationIpAddress(stationSerial);
        } catch {
            return "";
        }
    }

    /**
     * Determines if the updated state runs by event.
     */
    public getStateUpdateEventActive(): boolean {
        return this.config.getStateUpdateEventActive();
    }

    /**
     * Returns the current language from config.
     * @returns The current language from config.
     */
    public getLanguage(): string {
        return this.config.getLanguage();
    }

    /**
     * Get the config object.
     * @returns The config object.
     */
    public getConfig(): Config {
        return this.config;
    }

    /**
     * Get all config data needed for the webui.
     */
    public async getAPIConfigAsJson(): Promise<string> {
        let json: any = {};

        json = {"success":true, "data":{}};
        json.data = {"configVersion":this.config.getConfigFileVersion(), "eMail":this.config.getEmailAddress(), "password":this.config.getPassword(), "country":this.config.getCountry(), "language":this.config.getLanguage(), "trustedDeviceName":this.config.getTrustedDeviceName(), "httpActive":this.config.getHttpActive(), "httpPort":this.config.getHttpPort(), "httpsActive":this.config.getHttpsActive(), "httpsPort":this.config.getHttpsPort(), "httpsPKeyFile":this.config.getHttpsPKeyFile(), "httpsCertFile":this.config.getHttpsCertFile(), "acceptInvitations":this.config.getAcceptInvitations(), "houseId":this.config.getHouseId(), "connectionTypeP2p":this.config.getConnectionType(), "localStaticUdpPortsActive":this.config.getLocalStaticUdpPortsActive(), "localStaticUdpPorts": [], "systemVariableActive":this.config.getSystemVariableActive(), "updateCloudInfoIntervall": this.config.getUpdateCloudInfoIntervall(), "updateDeviceDataIntervall": this.config.getUpdateDeviceDataIntervall(), "stateUpdateEventActive":this.config.getStateUpdateEventActive(), "stateUpdateIntervallActive":this.config.getStateUpdateIntervallActive(), "stateUpdateIntervallTimespan":this.config.getStateUpdateIntervallTimespan(), "pushServiceActive":this.config.getPushServiceActive(), "secureApiAccessBySid":this.config.getSecureApiAccessBySid(), "enableEmbeddedPKCS1Support":this.config.getEnableEmbeddedPKCS1Support(), "enableEmbeddedPKCS1SupportEditable":Number.parseInt(process.versions.node.split(".")[0]) > 20 ? false : true, "logLevelAddon":this.config.getLogLevelAddon(), "logLevelMain":this.config.getLogLevelMain(), "logLevelHttp":this.config.getLogLevelHttp(), "logLevelP2p":this.config.getLogLevelP2p(), "logLevelPush":this.config.getLogLevelPush(), "logLevelMqtt":this.config.getLogLevelMqtt(), "tokenExpire":this.config.getTokenExpire()};
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
     * @param acceptInvitations: Auto-accept invitations.
     * @param houseId The houseId for filtering station and devices.
     * @param connectionTypeP2p The connection type for connecting with station.
     * @param localStaticUdpPortsActive Should the api use static ports to connect with station.
     * @param localStaticUdpPorts The local ports for connection with station.
     * @param systemVariableActive Should the api update related systemvariables.
     * @param stateUpdateEventActive Should the api use station events for updateing the state.
     * @param stateUpdateIntervallActive Should the api schedule a task for updateing the state.
     * @param stateUpdateIntervallTimespan The time between two scheduled runs of update state.
     * @param pushServiceActive Should the api use push service.
     * @param secureApiAccessSidActive Should the api check if a given sid represents a currently authenticated session.
     * @param enableEmbeddedPKCS1Support Should the internal PKCS#1 functionality be used.
     * @param logLevelAddon The log level for addon.
     * @param logLevelMain The log level for main.
     * @param logLevelHttp The log level for http.
     * @param logLevelP2p The log level for p2p.
     * @param logLevelPush The log level for push.
     * @param logLevelMqtt The log level for mqtt.
     * @returns A JSON string containing the result.
     */
    public async setConfig(eMail: string, password: string, country: string, language: string, trustedDeviceName: string, httpActive: boolean, httpPort: number, httpsActive: boolean, httpsPort: number, httpsKeyFile: string, httpsCertFile: string, acceptInvitations: boolean, houseId: string, connectionTypeP2p: number, localStaticUdpPortsActive: boolean, localStaticUdpPorts: any[] | undefined, systemVariableActive: boolean, stateUpdateEventActive: boolean, stateUpdateIntervallActive: boolean, stateUpdateIntervallTimespan: number, pushServiceActive: boolean, secureApiAccessSidActive: boolean, enableEmbeddedPKCS1Support: boolean, logLevelAddon: number, logLevelMain: number, logLevelHttp: number, logLevelP2p: number, logLevelPush: number, logLevelMqtt: number): Promise<string> {
        let serviceRestart = false;
        let taskSetupStateNeeded = false;
        if (this.config.getEmailAddress() !== eMail || this.config.getPassword() !== password || this.config.getTrustedDeviceName() !== trustedDeviceName || this.config.getHttpActive() !== httpActive || this.config.getHttpPort() !== httpPort || this.config.getHttpsActive() !== httpsActive || this.config.getHttpsPort() !== httpsPort || this.config.getHttpsPKeyFile() !== httpsKeyFile || this.config.getHttpsCertFile() !== httpsCertFile || this.config.getHouseId() !== houseId || this.config.getConnectionType() !== connectionTypeP2p || this.config.getLocalStaticUdpPortsActive() !== localStaticUdpPortsActive || this.config.getStateUpdateEventActive() !== stateUpdateEventActive) {
            serviceRestart = true;
        }

        if (this.config.getEmailAddress() !== eMail) {
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
        if (localStaticUdpPorts !== undefined) {
            this.config.setLocalStaticUdpPortsActive(localStaticUdpPortsActive);
            if (this.config.setLocalStaticUdpPorts(localStaticUdpPorts) === true) {
                serviceRestart = true;
            }
        } else {
            if (this.stations) {
                const stations = await this.stations.getStations();
                if (stations) {
                    for (const stationSerial in stations) {
                        if (this.config.setLocalStaticUdpPortPerStation(stationSerial, null) === true) {
                            serviceRestart = true;
                        }
                    }
                }
            }
            this.config.setLocalStaticUdpPortsActive(false);
        }
        this.config.setSystemVariableActive(systemVariableActive);
        this.config.setStateUpdateEventActive(stateUpdateEventActive);
        if (this.config.getStateUpdateIntervallActive() === true && stateUpdateIntervallActive === false) {
            this.clearScheduledTask(this.taskUpdateState, "getState");
        } else if (this.config.getStateUpdateIntervallActive() !== stateUpdateIntervallActive) {
            taskSetupStateNeeded = true;
        }
        this.config.setStateUpdateIntervallActive(stateUpdateIntervallActive);
        if (this.config.getStateUpdateIntervallTimespan() !== stateUpdateIntervallTimespan) {
            taskSetupStateNeeded = true;
        }
        this.config.setStateUpdateIntervallTimespan(stateUpdateIntervallTimespan);
        if (taskSetupStateNeeded === true) {
            this.setupScheduledTask(this.taskUpdateState, "getState");
        }
        this.config.setPushServiceActive(pushServiceActive);
        this.config.setSecureApiAccessBySid(secureApiAccessSidActive);
        this.config.setEnableEmbeddedPKCS1Support(enableEmbeddedPKCS1Support);
        this.config.setLogLevelAddon(logLevelAddon);
        this.config.setLogLevelMain(logLevelMain);
        this.config.setLogLevelHttp(logLevelHttp);
        this.config.setLogLevelP2p(logLevelP2p);
        this.config.setLogLevelPush(logLevelPush);
        this.config.setLogLevelMqtt(logLevelMqtt);

        const res = this.config.writeCurrentConfig();
        if (res === "saved") {
            return `{"success":true,"serviceRestart":${serviceRestart},"message":"Config saved."}`;
        } else if (res === "ok") {
            return `{"success":true,"serviceRestart":${serviceRestart},"message":"No change in config. Write config not neccesary."}`;
        } else {
            return `{"success":false,"serviceRestart":false,"reason":"Error during writing config."}`;
        }
    }

    /**
     * Write config to file.
     */
    public writeConfig(): string
    {
        const res = this.config.writeCurrentConfig();
        if (res === "saved") {
            return `{"success":true,"message":"Config saved."}`;
        } else if (res === "ok") {
            return `{"success":true,"message":"No new values in config. Write config not neccesary."}`;
        } else {
            return `{"success":false,"serviceRestart":false,"reason":"Error during writing config."}`;
        }
    }

    /**
     * Get all countries as JSON.
     * @returns The countries as JSON response.
     */
    public getCountriesAsJson(): string {
        return `{"success":true,"data":${JSON.stringify(countryData)}}`;
    }

    /**
     * Check if all system variables are created on the CCU
     */
    public async checkSystemVariables(): Promise<string> {
        let json: any = {};
        const availableSystemVariables = await this.openCcuApi.getSystemVariables("localhost", false, "eufy");
        if (availableSystemVariables === undefined) {
            json = {"success":false, "reason":"Faild retrieving system variables from CCU."};
        } else {
            try {
                if (this.config.getSystemVariableActive() === true) {
                    if (this.stations && this.devices) {
                        let station: Station;
                        let device: Device;
                        const stations = await this.stations.getStations();
                        const devices = await this.devices.getDevices();

                        const commonSystemVariables: Array<OpenCcuSystemvariableBinary | OpenCcuSystemvariableFloat | OpenCcuSystemvariableInteger | OpenCcuSystemvariableString> = [];
                        commonSystemVariables.push({"name": "eufyCurrentState", "info": this.translator.translateString("systemVariables:common.eufyCurrentState"), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString);
                        commonSystemVariables.push({"name": "eufyLastConnectionResult", "info": this.translator.translateString("systemVariables:common.eufyLastConnectionResult"), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString);
                        commonSystemVariables.push({"name": "eufyLastConnectionTime", "info": this.translator.translateString("systemVariables:common.eufyLastConnectionTime"), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString);
                        commonSystemVariables.push({"name": "eufyLastStatusUpdateTime", "info": this.translator.translateString("systemVariables:common.eufyLastStatusUpdateTime"), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString);
                        commonSystemVariables.push({"name": "eufyLastModeChangeTime", "info": this.translator.translateString("systemVariables:common.eufyLastModeChangeTime"), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString);

                        json = {"success":true, "data":[]};

                        for (const commonSystemVariable of commonSystemVariables) {
                            let isValueTypeCorrect = false;
                            if (availableSystemVariables.includes(commonSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, commonSystemVariable.name) === commonSystemVariable.valueType) {
                                isValueTypeCorrect = true;
                            }
                            json.data.push({"sysVar":commonSystemVariable,"sysVarName":commonSystemVariable.name, "sysVarInfo":commonSystemVariable.info, "sysVarAvailable":availableSystemVariables.includes(commonSystemVariable.name), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":true});
                            if (availableSystemVariables.includes(commonSystemVariable.name)) {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(commonSystemVariable.name), 1);
                            }
                        }

                        let tempSystemVariable: OpenCcuSystemvariableBinary | OpenCcuSystemvariableFloat | OpenCcuSystemvariableInteger | OpenCcuSystemvariableString;
                        let isValueTypeCorrect = false;

                        for (const stationSerial in stations) {
                            station = stations[stationSerial];

                            isValueTypeCorrect = false;
                            tempSystemVariable = {"name": `eufyCentralState${station.getSerial()}`, "info": this.translator.translateString("systemVariables:station.eufyCentralState", JSON.stringify({"stationSerial": station.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                            if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                isValueTypeCorrect = true;
                            }
                            json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyCentralState${station.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:station.eufyCentralState", JSON.stringify({"stationSerial": station.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyCentralState" + station.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":true});
                            if (availableSystemVariables.includes("eufyCentralState" + station.getSerial())) {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCentralState${station.getSerial()}`), 1);
                            }

                            isValueTypeCorrect = false;
                            tempSystemVariable = {"name": `eufyLastModeChangeTime${station.getSerial()}`, "info": this.translator.translateString("systemVariables:station.eufyLastModeChangeTime", JSON.stringify({"stationSerial": station.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                            if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                isValueTypeCorrect = true;
                            }
                            json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyLastModeChangeTime${station.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:station.eufyLastModeChangeTime", JSON.stringify({"stationSerial": station.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyLastModeChangeTime" + station.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":true});
                            if (availableSystemVariables.includes("eufyLastModeChangeTime" + station.getSerial())) {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyLastModeChangeTime${station.getSerial()}`), 1);
                            }

                            isValueTypeCorrect = false;
                            tempSystemVariable = {"name": `eufyCentralCurrentMode${station.getSerial()}`, "info": this.translator.translateString("systemVariables:station.eufyCentralCurrentMode", JSON.stringify({"stationSerial": station.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                            if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                isValueTypeCorrect = true;
                            }
                            json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyCentralCurrentMode${station.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:station.eufyCentralCurrentMode", JSON.stringify({"stationSerial": station.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyCentralCurrentMode" + station.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":true});
                            if (availableSystemVariables.includes("eufyCentralCurrentMode" + station.getSerial())) {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCentralCurrentMode${station.getSerial()}`), 1);
                            }

                            isValueTypeCorrect = false;
                            tempSystemVariable = {"name": `eufyCentralCurrentModeChangeTime${station.getSerial()}`, "info": this.translator.translateString("systemVariables:station.eufyCentralCurrentModeChangeTime", JSON.stringify({"stationSerial": station.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                            if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                isValueTypeCorrect = true;
                            }
                            json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyCentralCurrentModeChangeTime${station.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:station.eufyCentralCurrentModeChangeTime", JSON.stringify({"stationSerial": station.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyCentralCurrentModeChangeTime" + station.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":true});
                            if (availableSystemVariables.includes("eufyCentralCurrentModeChangeTime" + station.getSerial())) {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCentralCurrentModeChangeTime${station.getSerial()}`), 1);
                            }
                        }

                        for (const deviceSerial in devices) {
                            device = devices[deviceSerial];

                            if (availableSystemVariables.includes("eufyCameraImageURL" + device.getSerial())) {
                                isValueTypeCorrect = false;
                                tempSystemVariable = {"name": `eufyCameraImageURL${device.getSerial()}`, "info": this.translator.translateString("systemVariables:device.eufyCameraImageURL", JSON.stringify({"deviceSerial": device.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                                if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                    isValueTypeCorrect = true;
                                }
                                json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyCameraImageURL${device.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:device.eufyCameraImageURL", JSON.stringify({"deviceSerial": device.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyCameraImageURL" + device.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":false});
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCameraImageURL${device.getSerial()}`), 1);
                            }

                            isValueTypeCorrect = false;
                            tempSystemVariable = {"name": `eufyCameraVideoTime${device.getSerial()}`, "info": this.translator.translateString("systemVariables:device.eufyCameraVideoTime", JSON.stringify({"deviceSerial": device.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                            if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                isValueTypeCorrect = true;
                            }
                            json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyCameraVideoTime${device.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:device.eufyCameraVideoTime", JSON.stringify({"deviceSerial": device.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyCameraVideoTime" + device.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":true});
                            if (availableSystemVariables.includes("eufyCameraVideoTime" + device.getSerial())) {
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCameraVideoTime${device.getSerial()}`), 1);
                            }

                            if (availableSystemVariables.includes("eufyCameraVideoURL" + device.getSerial())) {
                                isValueTypeCorrect = false;
                                tempSystemVariable = {"name": `eufyCameraVideoURL${device.getSerial()}`, "info": this.translator.translateString("systemVariables:device.eufyCameraVideoURL", JSON.stringify({"deviceSerial": device.getSerial()})), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                                if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                    isValueTypeCorrect = true;
                                }
                                json.data.push({"sysVar":tempSystemVariable, "sysVarName":`eufyCameraVideoURL${device.getSerial()}`, "sysVarInfo":this.translator.translateString("systemVariables:device.eufyCameraVideoURL", JSON.stringify({"deviceSerial": device.getSerial()})), "sysVarAvailable":availableSystemVariables.includes("eufyCameraVideoURL" + device.getSerial()), "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":false});
                                availableSystemVariables.splice(availableSystemVariables.indexOf(`eufyCameraVideoURL${device.getSerial()}`), 1);
                            }
                        }

                        if (availableSystemVariables.length > 0) {
                            for (let i = 0; i < availableSystemVariables.length; i++) {
                                isValueTypeCorrect = false;
                                tempSystemVariable = {"name": `${availableSystemVariables[i]}`, "info": this.translator.translateString("systemVariables:unknown"), "valueType": "ivtString", "valueSubType": "istChar8859", "valueUnit": "", "state": ""} as OpenCcuSystemvariableString;
                                if (availableSystemVariables.includes(tempSystemVariable.name) === true && await this.openCcuApi.getSystemVariableValueType("localhost", false, tempSystemVariable.name) === tempSystemVariable.valueType) {
                                    isValueTypeCorrect = true;
                                }
                                json.data.push({"sysVar":tempSystemVariable, "sysVarName":`${availableSystemVariables[i]}`, "sysVarInfo":this.translator.translateString("systemVariables:unknown"), "sysVarAvailable":true, "sysVarValueTypeCorrect": isValueTypeCorrect, "sysVarCurrent":false});
                                availableSystemVariables.splice(availableSystemVariables.indexOf(availableSystemVariables[i]), 1);
                                i--;
                            }
                        }
                    } else {
                        json = {"success":false, "reason":"No connection to eufy."};
                    }
                } else {
                    json = {"success":false, "reason":"System variables in config disabled."};
                }
            } catch (e: any) {
                rootAddonLogger.error(`Error occured at checkSystemVariables. Error: ${e.message}.`, JSON.stringify(e));
                this.setLastConnectionInfo(false);
                json = {"success":false, "reason":e.message};
            }
        }

        return JSON.stringify(json);
    }

    /**
     * Create a system variable with the given name and the given info.
     * @param systemVariableGeneric The generic system variable to create.
     */
    public async createSystemVariable(systemVariableGeneric: OpenCcuSystemvariableGeneric): Promise<string> {
        let systemVariable: OpenCcuSystemvariableBinary | OpenCcuSystemvariableFloat | OpenCcuSystemvariableInteger | OpenCcuSystemvariableString | undefined;
        switch (systemVariableGeneric.valueType) {
            case "ivtBinary":
                try {
                    systemVariable = {"name": systemVariableGeneric.name, "info": systemVariableGeneric.info, "valueType": systemVariableGeneric.valueType, "valueSubType": systemVariableGeneric.valueSubType, "valueUnit": systemVariableGeneric.valueUnit, "state": systemVariableGeneric.state} as OpenCcuSystemvariableBinary;
                } catch (e: any) {
                    rootAddonLogger.error(`Error occured at createSystemVariable ('${systemVariableGeneric.valueType}'). Received data: ${JSON.stringify(systemVariableGeneric)}. Error: ${e.message}.`, JSON.stringify(e));
                    return `{"success":false,"reason":"Error while creating system variable. Received data formatted incorrectly ('${systemVariableGeneric.valueType}')."}`;
                }
                break;
            case "ivtFloat":
                try {
                    systemVariable = {"name": systemVariableGeneric.name, "info": systemVariableGeneric.info, "valueType": systemVariableGeneric.valueType, "valueSubType": systemVariableGeneric.valueSubType, "valueUnit": systemVariableGeneric.valueUnit, "state": systemVariableGeneric.state} as OpenCcuSystemvariableFloat;
                } catch (e: any) {
                    rootAddonLogger.error(`Error occured at createSystemVariable ('${systemVariableGeneric.valueType}'). Received data: ${JSON.stringify(systemVariableGeneric)}. Error: ${e.message}.`, JSON.stringify(e));
                    return `{"success":false,"reason":"Error while creating system variable. Received data formatted incorrectly ('${systemVariableGeneric.valueType}')."}`;
                }
                break;
            case "ivtInteger":
                try {
                    systemVariable = {"name": systemVariableGeneric.name, "info": systemVariableGeneric.info, "valueType": systemVariableGeneric.valueType, "valueSubType": systemVariableGeneric.valueSubType, "valueUnit": systemVariableGeneric.valueUnit, "valueList": systemVariableGeneric.valueList, "state": systemVariableGeneric.state} as OpenCcuSystemvariableInteger;
                } catch (e: any) {
                    rootAddonLogger.error(`Error occured at createSystemVariable ('${systemVariableGeneric.valueType}'). Received data: ${JSON.stringify(systemVariableGeneric)}. Error: ${e.message}.`, JSON.stringify(e));
                    return `{"success":false,"reason":"Error while creating system variable. Received data formatted incorrectly ('${systemVariableGeneric.valueType}')."}`;
                }
                break;
            case "ivtString":
                try {
                    systemVariable = {"name": systemVariableGeneric.name, "info": systemVariableGeneric.info, "valueType": systemVariableGeneric.valueType, "valueSubType": systemVariableGeneric.valueSubType, "valueUnit": systemVariableGeneric.valueUnit, "state": systemVariableGeneric.state} as OpenCcuSystemvariableString;
                } catch (e: any) {
                    rootAddonLogger.error(`Error occured at createSystemVariable ('${systemVariableGeneric.valueType}'). Received data: ${JSON.stringify(systemVariableGeneric)}. Error: ${e.message}.`, JSON.stringify(e));
                    return `{"success":false,"reason":"Error while creating system variable. Received data formatted incorrectly ('${systemVariableGeneric.valueType}')."}`;
                }
                break;
            default:
                rootAddonLogger.error(`Error occured at createSystemVariable. Unknown value type given. Received data: ${JSON.stringify(systemVariableGeneric)}`);
                return `{"success":false,"reason":"Error while creating system variable. Received data formatted incorrectly ('${systemVariableGeneric.valueType}')."}`;
        }
        if (systemVariable !== undefined) {
            const res = await this.openCcuApi.createSystemVariable("localhost", false, systemVariable);

            if (res !== undefined && res === systemVariable.name) {
                return `{"success":true,"message":"System variable created."}`;
            } else if (res === undefined) {
                return `{"success":false, "reason":"Error while creating system variable: faild to communicate with CCU."}`;
            } else {
                return `{"success":false,"reason":"Error while creating system variable."}`;
            }
        } else {
            return `{"success":false,"reason":"Error while creating system variable."}`;
        }
    }

    /**
     * Removes a system variable with the given name.
     * @param variableName The name of the system variable to create.
     */
    public async removeSystemVariable(variableName: string): Promise<string> {
        const res = await this.openCcuApi.removeSystemVariable("localhost", false, variableName);

        if (res !== undefined && res === "true") {
            return `{"success":true,"message":"System variable removed."}`;
        } else if (res === undefined) {
            return `{"success":false, "reason":"Error while removing system variable: faild to communicate with CCU."}`;
        } else {
            return `{"success":true,"message":"Error while removing system variable."}`;
        }
    }

    /**
     * Set the state of the last connection with eufy to CCU.
     * @param success The state of the last request with eufy.
     */
    private setLastConnectionInfo(success: boolean): void {
        const nowDateTime = new Date();

        if (success === true) {
            this.setSystemVariableString("eufyLastConnectionResult", this.translator.translateString("common:success"));
            this.setSystemVariableTime("eufyLastConnectionTime", nowDateTime);
        } else {
            this.setSystemVariableString("eufyLastConnectionResult", this.translator.translateString("common:incorrect"));
            this.setSystemVariableTime("eufyLastConnectionTime", nowDateTime);
        }
    }

    /**
     * Set a dateTime value to a system variable.
     * @param systemVariable Name of the system variable to set.
     * @param dateTime The dateTime value to set.
     */
    private setSystemVariableTime(systemVariable: string, dateTime: Date): void {
        this.setSystemVariableString(systemVariable, makeDateTimeString(dateTime.getTime()));
    }

    /**
     * Set a value value to a system variable.
     * @param systemVariable Name of the system variable to set.
     * @param newValue The value to set.
     */
    private setSystemVariableString(systemVariable: string, newValue: string): void {
        if (this.config.getSystemVariableActive() === true) {
            this.openCcuApi.setSystemVariable("localhost", false, systemVariable, newValue);
        }
    }

    /**
     * Send the interaction to the target.
     * @param hostName The hostname.
     * @param useHttps true if use https, otherwise false.
     * @param command The command to be executed.
     */
    public async sendInteractionCommand(hostName: string, useHttps: boolean, useLocalCertificate: boolean, rejectUnauthorized: boolean, user: string | undefined, password: string | undefined, command: string): Promise<number> {
        try {
            return await this.openCcuApi.sendInteractionCommand(hostName, useHttps, useLocalCertificate, rejectUnauthorized, user, password, command);
        } catch (e: any) {
            throw e;
        }
    }

    /**
     * Set the interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     * @param target the target.
     * @param useHttps true if use https, otherwise false.
     * @param command The command to be executed.
     */
    public setInteraction(serialNumber: string, eventInteractionType: EventInteractionType, target: string, useHttps: boolean, useLocalCertificate: boolean, rejectUnauthorized: boolean, command: string, user?: string, password?: string): string {
        let json = {};
        try {
            if (serialNumber !== "" && eventInteractionType >= 0 && eventInteractionType <= 12 && target !== "" && command !== "") {
                const res = this.devices.setDeviceInteraction(serialNumber, eventInteractionType, {target: target, useHttps: useHttps, useLocalCertificate, rejectUnauthorized, user, password, command: command});
                if (res === true) {
                    json = {"success":true, "data":`Interaction has been added successfully.`};
                } else {
                    json = {"success":false, "reason":"Interaction not been added."};
                }
            } else {
                json = {"success":false, "reason":"One or more arguments not given."};
            }
        } catch (e: any) {
            json = {"success":false, "reason":`${e.message}`};
        }

        return JSON.stringify(json);
    }

    /**
     * Test the unstored interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     * @param target the target.
     * @param useHttps true if use https, otherwise false.
     * @param command The command to be executed.
     */
    public async testUnstoredInteraction(serialNumber: string, eventInteractionType: EventInteractionType, target: string, useHttps: boolean, useLocalCertificate: boolean, rejectUnauthorized: boolean, command: string, user?: string, password?: string): Promise<string> {
        let json = {};
        try {
            if (serialNumber !== "" && eventInteractionType >= 0 && eventInteractionType <= 12 && target !== "" && command !== "") {
                const res = await this.sendInteractionCommand(target, useHttps, useLocalCertificate, rejectUnauthorized, user, password, command);
                if (res === 200) {
                    json = {"success":true, "data":`Successfully sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "status":res};
                } else {
                    json = {"success":false, "reason":`Failed sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "status":res};
                }
            } else {
                json = {"success":false, "reason":`No interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at testUnstoredInteraction for device ${serialNumber}. code: ${e.code} | message: ${e.message.trim()}`);
            rootAddonLogger.debug(`Error occured at testUnstoredInteraction for device ${serialNumber}.`, JSON.stringify(e));
            if (e.status) {
                json = {"success":false, "reason":`Failed sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "status":e.status};
            } else if (e.code) {
                json = {"success":false, "reason":`Failed sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "code":e.code};
            } else {
                json = {"success":false, "reason":`${e.message}`};
            }
        }

        return JSON.stringify(json);
    }

    /**
     * Test the stored interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public async testStoredInteraction(serialNumber: string, eventInteractionType: EventInteractionType): Promise<string> {
        let json = {};
        try {
            const deviceInteraction = this.devices.getDeviceInteraction(serialNumber, eventInteractionType);
            if (deviceInteraction !== null) {
                const res = await this.sendInteractionCommand(deviceInteraction.target, deviceInteraction.useHttps, deviceInteraction.useLocalCertificate, deviceInteraction.rejectUnauthorized, deviceInteraction.user, deviceInteraction.password, deviceInteraction.command);
                if (res === 200) {
                    json = {"success":true, "data":`Successfully sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "status":res};
                } else {
                    json = {"success":false, "reason":`Failed sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "status":res};
                }
            } else {
                json = {"success":false, "reason":`No interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at testStoredInteraction for device ${serialNumber}. code: ${e.code} | message: ${e.message.trim()}`);
            rootAddonLogger.debug(`Error occured at testStoredInteraction for device ${serialNumber}.`, JSON.stringify(e));
            if (e.status) {
                json = {"success":false, "reason":`Failed sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "status":e.status};
            } else if (e.code) {
                json = {"success":false, "reason":`Failed sent interaction command for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`, "code":e.code};
            } else {
                json = {"success":false, "reason":`${e.message}`};
            }
        }

        return JSON.stringify(json);
    }

    /**
     * Delete the interaction.
     * @param serialNumber The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public async deleteInteraction(serialNumber: string, eventInteractionType: EventInteractionType): Promise<string> {
        let json = {};
        try {
            const deviceInteraction = this.devices.getDeviceInteraction(serialNumber, eventInteractionType);
            if (deviceInteraction !== null) {
                this.devices.deleteDeviceInteraction(serialNumber, eventInteractionType);
                json = {"success":true, "data":`Delete interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
            } else {
                json = {"success":false, "data":`No interaction for eventInteractionType ${eventInteractionType} and device ${serialNumber}.`};
            }
        } catch (e: any) {
            json = {"success":false, "reason":`${e.message}`};
        }

        return JSON.stringify(json);
    }

    /**
     * Converts the guard mode to a string.
     * @param guardMode The guard mode.
     */
    private convertGuardModeToString(guardMode: GuardMode): string {
        let res = "";
        switch (guardMode) {
            case GuardMode.AWAY:
                res = this.translator.translateString("systemVariables:mode.away");
                break;
            case GuardMode.CUSTOM1:
                res = this.translator.translateString("systemVariables:mode.custom1");
                break;
            case GuardMode.CUSTOM2:
                res = this.translator.translateString("systemVariables:mode.custom2");
                break;
            case GuardMode.CUSTOM3:
                res = this.translator.translateString("systemVariables:mode.custom3");
                break;
            case GuardMode.DISARMED:
                res = this.translator.translateString("systemVariables:mode.disabled");
                break;
            case GuardMode.GEO:
                res = this.translator.translateString("systemVariables:mode.geofencing");
                break;
            case GuardMode.HOME:
                res = this.translator.translateString("systemVariables:mode.home");
                break;
            case GuardMode.OFF:
                res = this.translator.translateString("systemVariables:mode.off");
                break;
            case GuardMode.SCHEDULE:
                res = this.translator.translateString("systemVariables:mode.schedule");
                break;
            default:
                res = this.translator.translateString("systemVariables:mode.unknown");
        }
        return res;
    }

    /**
     * Get the event duration time in seconds.
     * @returns The event duration in seconds.
     */
    public getEventDurationSeconds(): number {
        return this.config.getEventDurationSeconds()
    }

    /**
     * Returns the P2P connection type determine how to connect to the station.
     * @returns The P2PConnection type.
     */
    public getP2PConnectionType(): P2PConnectionType {
        try {
            const res = this.config.getConnectionType();
            switch (res) {
                case 1:
                    return P2PConnectionType.ONLY_LOCAL;
                case 2:
                    return P2PConnectionType.QUICKEST;
                default:
                    return P2PConnectionType.QUICKEST;
            }
        } catch {
            return P2PConnectionType.QUICKEST;
        }
    }

    /**
     * Returns the current log level for addon.
     * @returns The current log level.
     */
    public getLogLevelAddon(): number {
        return this.config.getLogLevelAddon();
    }

    /**
     * Returns the current log level for main.
     * @returns The current log level.
     */
    public getLogLevelMain(): number {
        return this.config.getLogLevelMain();
    }

    /**
     * Returns the current log level for http.
     * @returns The current log level.
     */
    public getLogLevelHttp(): number {
        return this.config.getLogLevelHttp();
    }

    /**
     * Returns the current log level for P2p.
     * @returns The current log level.
     */
    public getLogLevelP2p(): number {
        return this.config.getLogLevelP2p();
    }

    /**
     * Returns the current log level for push.
     * @returns The current log level.
     */
    public getLogLevelPush(): number {
        return this.config.getLogLevelPush();
    }

    /**
     * Returns the current log level for mqtt.
     * @returns The current log level.
     */
    public getLogLevelMqtt(): number {
        return this.config.getLogLevelMqtt();
    }

    /**
     * Returns the current value for using push service.
     * @returns A boolean value if push service is enabled or not.
     */
    public getApiUsePushService(): boolean {
        return this.config.getPushServiceActive();
    }

    /**
     * Setup all scheduled task, when allowed by settings.
     */
    private setupScheduledTasks(): void {
        rootAddonLogger.info(`Setting up scheduled tasks...`);
        if (this.config.getStateUpdateIntervallActive()) {
            if (this.taskUpdateState) {
                rootAddonLogger.info(`  getState already scheduled, remove scheduling...`);
                clearInterval(this.taskUpdateState);
            }
            this.taskUpdateState = setInterval(async() => { await this.setScheduleState(); }, (this.config.getStateUpdateIntervallTimespan() * 60 * 1000));
            rootAddonLogger.info(`  getState scheduled (runs every ${this.config.getStateUpdateIntervallTimespan()} minutes).`);
        } else {
            clearInterval(this.taskUpdateState);
            rootAddonLogger.info(`  scheduling getState disabled in settings${this.config.getStateUpdateEventActive() === true ? " (state changes will be received by event)": ""}.`)
        }

        rootAddonLogger.info(`...done setting up scheduled tasks.`);
    }

    /**
     * Clear all scheduled tasks.
     */
    public clearScheduledTasks(): void {
        if (this.taskUpdateState) {
            rootAddonLogger.info(`Remove scheduling for getState.`);
            clearInterval(this.taskUpdateState);
        }
        this.config.close();
    }

    /**
     * Setup the given scheduled task.
     * @param task The object of the task.
     * @param name The name of the task.
     */
    private setupScheduledTask(task: NodeJS.Timeout, name: string): void {
        if (task) {
            rootAddonLogger.info(`Remove scheduling for ${name}.`);
            switch (name) {
                case "getState":
                    clearInterval(this.taskUpdateState);
                    break;
            }
        }
        switch (name) {
            case "getState":
                task = setInterval(async() => { await this.setScheduleState(); }, (this.config.getStateUpdateIntervallTimespan() * 60 * 1000));
                rootAddonLogger.info(`${name} scheduled (runs every ${this.config.getStateUpdateIntervallTimespan()} minutes).`);
                break;
        }
    }

    /**
     * Clear the given scheduled task.
     * @param task The object of the task.
     * @param name The name of the task.
     */
    private clearScheduledTask(task: NodeJS.Timeout, name: string): void {
        if (task) {
            rootAddonLogger.info(`Remove scheduling for ${name}.`);
            clearInterval(task);
        }
    }

    /**
     * The method called when scheduleing state is called.
     */
    private async setScheduleState(): Promise<void> {
        await this.getGuardMode();
    }

    /**
     * The method called when update device data is called.
     */
    public async updateDeviceData(): Promise<void> {
        await this.stations.updateDeviceData();
    }

    /**
     * Return the version of this API as Json string.
     */
    public getApiVersionAsJson(): string {
        return `{"success":true,"platform":"${process.platform}","nodeVersion":"${process.version}","nodeArch":"${process.arch}","apiVersion":"${this.getEufySecurityApiVersion()}","openCcuApiVersion":"${this.openCcuApi.getOpenCcuApiVersion()}","eufySecurityClientVersion":"${this.getEufySecurityClientVersion()}"}`;
    }

    /**
     * Retrieves the state of api objects as Json string.
     * @returns The state of different api elements as Json string.
     */
    public async getApiStateAsJson(): Promise<string> {
        let json: any = {};

        json = {"success":true, "data":{"serviceState":this.getServiceState(),"isConnectedToEufy":this.isConnected(),"stations":[]}};

        if (this.stations) {
            const stations = await this.stations.getStations();
            for (const stationSerial in stations) {
                const station = stations[stationSerial];
                json.data.stations.push({"stationSerial":station.getSerial(),"stationName":station.getName(),"isP2pConnected":station.isConnected(),"isEnergySavingDevice":station.isEnergySavingDevice()});
            }
        }

        return JSON.stringify(json);
    }

    /**
     * Process and accept invitations.
     */
    public async processInvitations(): Promise<void> {
        let refreshCloud = false;

        const invites = await this.httpService.getInvites().catch (err => {
            const error = ensureError(err);
            rootAddonLogger.error("Error getting invites from cloud", { error: getError(error) });
            return error;
        });
        if (Object.keys(invites).length > 0) {
            const confirmInvites: Array<ConfirmInvite> = [];
            for (const invite of Object.values(invites) as Invite[]) {
                const devices: Array<string> = [];
                invite.devices.forEach(device => {
                    devices.push(device.device_sn);
                });
                if (devices.length > 0) {
                    confirmInvites.push({
                        invite_id: invite.invite_id,
                        station_sn: invite.station_sn,
                        device_sns: devices
                    });
                }
            }
            if (confirmInvites.length > 0) {
                const result = await this.httpService.confirmInvites(confirmInvites).catch (err => {
                    const error = ensureError(err);
                    rootAddonLogger.error("Error in confirmation of invitations", { error: getError(error), confirmInvites: confirmInvites });
                    return error;
                });
                if (result) {
                    rootAddonLogger.info(`Accepted received invitations`, confirmInvites);
                    refreshCloud = true;
                }
            }
        }

        const houseInvites = await this.httpService.getHouseInviteList().catch (err => {
            const error = ensureError(err);
            rootAddonLogger.error("Error getting house invites from cloud", { error: getError(error) });
            return error;
        });
        if (Object.keys(houseInvites).length > 0) {
            for (const invite of Object.values(houseInvites) as HouseInviteListResponse[]) {
                const result = await this.httpService.confirmHouseInvite(invite.house_id, invite.id).catch (err => {
                    const error = ensureError(err);
                    rootAddonLogger.error("Error in confirmation of house invitations", { error: getError(error) });
                    return error;
                });
                if (result) {
                    rootAddonLogger.info(`Accepted received house invitation from ${invite.action_user_email}`, { invite: invite });
                    refreshCloud = true;
                }
            }
        }
        if (refreshCloud) {
            this.refreshCloudData();
        }
    }

    /**
     * Returns the version of this API.
     * @returns The version of this API.
     */
    public getEufySecurityApiVersion(): string {
        return "3.3.0";
    }

    /**
     * Return the version of the library used for communicating with eufy.
     * @returns The version of the used eufy-security-client.
     */
    public getEufySecurityClientVersion(): string {
        return "3.5.0";
    }
}