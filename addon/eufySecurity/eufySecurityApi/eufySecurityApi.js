"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufySecurityApi = void 0;
const config_1 = require("./config");
const http_1 = require("./http");
const homematicApi_1 = require("./homematicApi");
const logging_1 = require("./utils/logging");
const pushService_1 = require("./pushService");
const mqttService_1 = require("./mqttService");
const utils_1 = require("./utils");
const devices_1 = require("./devices");
const stations_1 = require("./stations");
const p2p_1 = require("./p2p");
const utils_2 = require("./push/utils");
const houses_1 = require("./houses");
const error_1 = require("./error");
class EufySecurityApi {
    /**
     * Create the api object.
     */
    constructor() {
        this.connected = false;
        this.retries = 0;
        this.serviceState = "init";
        this.logger = new logging_1.Logger(this);
        this.config = new config_1.Config(this.logger);
        this.homematicApi = new homematicApi_1.HomematicApi(this);
        this.initialize();
    }
    /**
     * Initialize the api and make basic settings check.
     */
    async initialize() {
        if (this.config.getEmailAddress() == "" || this.config.getPassword() == "") {
            this.logError("Please check your settings in the 'config.ini' file.\r\nIf there was no 'config.ini', it should now be there.\r\nYou need to set at least email and password to run this addon.");
            this.serviceState = "ok";
        }
        else {
            this.httpService = await http_1.HTTPApi.initialize(this, this.config.getCountry(), this.config.getEmailAddress(), this.config.getPassword(), this.logger);
            this.httpService.setLanguage(this.config.getLanguage());
            this.httpService.setPhoneModel(this.config.getTrustedDeviceName());
            this.httpService.on("close", () => this.onAPIClose());
            this.httpService.on("connect", () => this.onAPIConnect());
            this.httpService.setToken(this.getToken());
            this.httpService.setTokenExpiration(new Date(Number.parseInt(this.getTokenExpire()) * 1000));
            if (this.config.getOpenudid() == "") {
                this.config.setOpenudid((0, utils_1.generateUDID)());
                this.logger.debug("Generated new openudid:", this.config.getOpenudid());
            }
            this.httpService.setOpenUDID(this.config.getOpenudid());
            if (this.config.getSerialNumber() == "") {
                this.config.setSerialNumber((0, utils_1.generateSerialnumber)(12));
                this.logger.debug("Generated new serial_number:", this.config.getSerialNumber());
            }
            this.httpService.setSerialNumber(this.config.getSerialNumber());
            if (this.config.getApiUsePushService() == true) {
                this.logger.logInfoBasic("Started initializing push notification connection.");
                try {
                    this.pushService = new pushService_1.PushService(this, this.httpService, this.config, this.logger);
                }
                catch (e) {
                    this.logger.logInfoBasic("No country and/or language given. Skipping creating push service.");
                }
            }
            this.mqttService = new mqttService_1.MqttService(this, this.config, this.logger);
            await this.connect();
        }
    }
    /**
     * Returns the state of the service.
     * @returns The state of the service.
     */
    getServiceState() {
        return this.serviceState;
    }
    /**
     * Set the state of the service to the given value.
     * @returns The state of the service.
     */
    setServiceState(state) {
        if (state == "init" || state == "ok" || state == "shutdown") {
            this.serviceState = state;
        }
    }
    async getAccountInfo() {
        var res = "";
        res = JSON.stringify(await this.httpService.getPassportProfile());
        return res;
    }
    /**
     * Close the EufySecurityApi.
     */
    async close() {
        /*for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.stopStationLivestream(device_sn);
        }
        for (const device_sn of this.cameraCloudLivestreamTimeout.keys()) {
            this.stopCloudLivestream(device_sn);
        }*/
        if (this.refreshEufySecurityCloudTimeout !== undefined)
            clearTimeout(this.refreshEufySecurityCloudTimeout);
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
    closePushService() {
        this.logInfoBasic("Stopping PushService...");
        if (this.pushService) {
            this.pushService.close();
        }
    }
    /**
     * Close the MqttService
     */
    closeMqttService() {
        this.logInfoBasic("Stopping MqttService...");
        if (this.mqttService) {
            this.mqttService.close();
        }
    }
    /**
     * Close all P2P connections from all stations.
     */
    async closeStation() {
        this.logInfoBasic("Closing connections to all stations...");
        if (this.devices != null || this.devices != undefined) {
            this.devices.close();
        }
        if (this.stations != null || this.devices != undefined) {
            await this.stations.closeP2PConnections();
        }
    }
    /**
     * Close all devices.
     */
    async closeDevice() {
        this.logInfoBasic("Closing connections to all devices...");
        if (this.devices != null || this.devices != undefined) {
            this.devices.closeDevices();
        }
    }
    /**
     * Login with the in the api provoded login information.
     * @param options Options for login.
     */
    async connect(options) {
        await this.httpService.login(options)
            .then(async () => {
            if (options === null || options === void 0 ? void 0 : options.verifyCode) {
                let trusted = false;
                const trusted_devices = await this.httpService.listTrustDevice();
                trusted_devices.forEach(trusted_device => {
                    if (trusted_device.is_current_device === 1) {
                        trusted = true;
                    }
                });
                if (!trusted)
                    return await this.httpService.addTrustDevice(options === null || options === void 0 ? void 0 : options.verifyCode);
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
    isConnected() {
        return this.connected;
    }
    /**
     * Returns the connection state of the mqtt service.
     * @returns Connection state of the MqttService as boolean value.
     */
    isMqttServiceConnected() {
        return this.mqttService.isConnected();
    }
    /**
     * Returns the MqttService object.
     * @returns The MqttSerivce object.
     */
    getMqttService() {
        return this.mqttService;
    }
    /**
     * Eventhandler for the API Close event.
     */
    async onAPIClose() {
        if (this.refreshEufySecurityCloudTimeout !== undefined) {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }
        this.connected = false;
        //this.emit("close");
        if (this.retries < 1) {
            this.retries++;
            await this.connect();
        }
        else {
            this.logger.error(`Tried to re-authenticate to Eufy cloud, but failed in the process. Manual intervention is required!`);
        }
    }
    /**
     * Eventhandler for the API Connect event.
     */
    async onAPIConnect() {
        this.connected = true;
        this.retries = 0;
        //this.emit("connect");
        this.saveCloudToken();
        //await this.refreshCloudData();
        if (this.pushService) {
            this.pushService.connect();
        }
        const loginData = this.httpService.getPersistentData();
        if (loginData) {
            this.mqttService.connect(loginData.user_id, this.config.getOpenudid(), this.httpService.getAPIBase(), loginData.email);
        }
        else {
            this.logger.warn("No mqtt login data received. Skipping creating mqtt service.");
        }
        this.houses = new houses_1.EufyHouses(this, this.httpService);
        this.stations = new stations_1.Stations(this, this.httpService);
        this.devices = new devices_1.Devices(this, this.httpService);
        await (0, utils_2.sleep)(10);
        await this.refreshCloudData();
        //await this.loadData();
        this.setupScheduledTasks();
        this.serviceState = "ok";
    }
    /**
     * Returns the all stations as array.
     * @returns The array with all stations.
     */
    getStations() {
        return this.stations.getStations();
    }
    /**
     * Returns the station object specified by the station serial.
     * @param stationSerial The serial of the station to retrive.
     * @returns The station as object.
     */
    getStation(stationSerial) {
        return this.stations.getStation(stationSerial);
    }
    /**
     * Return the Devices object.
     * @returns The Devices object.
     */
    getDevices() {
        return this.devices.getDevices();
    }
    /**
     * Returns a device specified by a given serial.
     * @param deviceSerial The serial of the device.
     * @returns The device as object.
     */
    async getDevice(deviceSerial) {
        return await this.devices.getDevice(deviceSerial);
    }
    /**
     * Returns a device specified by station serial and channel.
     * @param stationSerial The serial of the station.
     * @param channel The channel of the device.
     * @returns The device as object.
     */
    async getDeviceByStationAndChannel(stationSerial, channel) {
        return this.devices.getDeviceByStationAndChannel(stationSerial, channel);
    }
    /**
     * Returns all houses of the account.
     * @returns The houses object.
     */
    getHouses() {
        return this.houses.getHouses();
    }
    /**
     * Returns a house specified by houseId.
     * @param houseId The houseId of the house.
     * @returns The house as object.
     */
    getHouse(houseId) {
        return this.houses.getHouse(houseId);
    }
    /**
     * Save the login tokens.
     */
    saveCloudToken() {
        const token = this.httpService.getToken();
        const token_expiration = this.httpService.getTokenExpiration();
        if (!!token && !!token_expiration) {
            this.logger.debug("Save cloud token and token expiration", { token: token, tokenExpiration: token_expiration });
            this.config.setToken(token);
            this.config.setTokenExpire((token_expiration.getTime() / 1000).toString());
        }
    }
    /**
     * Refreshing cloud data.
     */
    async refreshCloudData() {
        /*if (this.config.acceptInvitations)
        {
            await this.processInvitations().catch(error => {
                this.log.error("Error in processing invitations", error);
            });
        }*/
        await this.httpService.refreshAllData().catch(error => {
            this.logger.error("Error during API data refreshing", error);
        });
        if (this.refreshEufySecurityCloudTimeout !== undefined) {
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        }
        //this.refreshEufySecurityCloudTimeout = setTimeout(() => { this.refreshCloudData() }, this.config.GetPollingIntervalMinutes() * 60 * 1000);
        this.refreshEufySecurityCloudTimeout = setTimeout(() => { this.refreshCloudData(); }, 10 * 60 * 1000);
    }
    /**
     * (Re)Loads all Stations and Devices and the settings of them.
     */
    async loadData() {
        await this.httpService.refreshHouseData();
        await this.httpService.refreshStationData();
        await this.httpService.refreshDeviceData();
    }
    /**
     * Create a JSON string for a given house.
     * @param house The house the JSON string created for.
     */
    makeJsonForHouse(house) {
        var json = `{"houseId":"${house.house_id}"`;
        json += `,"houseName":"${house.house_name}"`;
        json += `,"isDefault":"${house.is_default}"`;
        json += `,"geofenceId":"${house.geofence_id}"`;
        json += `,"address":"${house.address}"`;
        json += `,"latitude":"${house.latitude}"`;
        json += `,"longitude":"${house.longitude}"`;
        json += `,"radiusRange":"${house.radius_range}"`;
        json += `,"locationMsg":"${house.location_msg}"`;
        json += `,"createTime":"${house.create_time}"`;
        json += `,"awayMode":"${house.away_mode}"`;
        json += `,"homeMode":"${house.home_mode}"`;
        json += `}`;
        return json;
    }
    /**
     * Returns a JSON-Representation of all houses.
     */
    async getHousesAsJSON() {
        await this.httpService.refreshHouseData();
        try {
            if (this.houses) {
                var houses = this.getHouses();
                var json = "";
                if (houses) {
                    for (var house_id in houses) {
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += this.makeJsonForHouse(this.getHouse(house_id));
                    }
                    json = `{"success":true,"data":[${json}]}`;
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = `{"success":false,"reason":"No houses found."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
            }
        }
        catch (e) {
            this.logError("Error occured at getHouses().");
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Returns a JSON-Representation of a given house.
     */
    async getHouseAsJSON(houseId) {
        await this.httpService.refreshHouseData();
        //await this.httpService.refreshStationData();
        //await this.httpService.refreshDeviceData();
        var house = this.getHouse(houseId);
        var json = "";
        try {
            json = `{"success":true,"data":[${this.makeJsonForHouse(house)}]}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"The house with id ${houseId} does not exists."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Create a JSON string for a given device.
     * @param device The device the JSON string created for.
     */
    makeJsonForDevice(device) {
        var properties = device.getProperties();
        var json = `{"eufyDeviceId":"${device.getId()}"`;
        json += `,"deviceType":"${this.devices.getDeviceTypeAsString(device)}"`;
        json += `,"model":"${device.getModel()}"`;
        json += `,"modelName":"${this.devices.getDeviceModelName(device)}"`;
        json += `,"name":"${device.getName()}"`;
        json += `,"hardwareVersion":"${device.getHardwareVersion()}"`;
        json += `,"softwareVersion":"${device.getSoftwareVersion()}"`;
        json += `,"stationSerialNumber":"${device.getStationSerial()}"`;
        for (var property in properties) {
            switch (property) {
                case http_1.PropertyName.Model:
                case http_1.PropertyName.Name:
                case http_1.PropertyName.HardwareVersion:
                case http_1.PropertyName.SoftwareVersion:
                case http_1.PropertyName.DeviceStationSN:
                    break;
                case http_1.PropertyName.DevicePictureUrl:
                    json += `,"${property}":"${properties[property] == undefined ? "n/a" : properties[property]}"`;
                    json += `,"pictureTime":"${this.getApiUsePushService() == false ? "n/d" : (this.devices.getLastVideoTime(device.getSerial()) == undefined ? "n/a" : this.devices.getLastVideoTime(device.getSerial()))}"`;
                    break;
                default:
                    json += `,"${property}":"${properties[property] == undefined ? "n/a" : properties[property]}"`;
            }
        }
        json += `}`;
        return json;
    }
    /**
     * Returns a JSON-Representation of all devices.
     */
    async getDevicesAsJSON() {
        try {
            if (this.devices) {
                await this.httpService.refreshStationData();
                await this.httpService.refreshDeviceData();
                await this.updateDeviceData();
                await this.devices.loadDevices();
                var devices = this.getDevices();
                var json = "";
                if (devices) {
                    for (var deviceSerial in devices) {
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += this.makeJsonForDevice(devices[deviceSerial]);
                    }
                    json = `{"success":true,"data":[${json}]}`;
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = `{"success":false,"reason":"No devices found."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
            }
        }
        catch (e) {
            this.logError("Error occured at getDevices().");
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Returns all devices as Devices-object
     * @returns All devices as object
     */
    async getRawDevices() {
        //await this.httpService.refreshStationData();
        //await this.httpService.refreshDeviceData();
        await this.updateDeviceData();
        await this.devices.loadDevices();
        return this.devices;
    }
    /**
     * Returns a JSON-Representation of a given devices.
     */
    async getDeviceAsJSON(deviceSerial) {
        //await this.httpService.refreshStationData();
        //await this.httpService.refreshDeviceData();
        await this.updateDeviceData();
        await this.devices.loadDevices();
        var devices = this.getDevices();
        var json = "";
        try {
            json = `{"success":true,"data":${this.makeJsonForDevice(devices[deviceSerial])}}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"The device with serial ${deviceSerial} does not exists."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Returns a JSON string with the device properties metadata.
     * @param deviceSerial The device serial for the device.
     * @returns JSON string with all properties metadata.
     */
    async getDevicePropertiesMetadataAsJSON(deviceSerial) {
        var devices = this.getDevices();
        var json = "";
        try {
            json = `{"success":true,"type":"${devices[deviceSerial].getModel()}","data":${JSON.stringify(devices[deviceSerial].getPropertiesMetadata())}}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"The device with serial ${deviceSerial} does not exists."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Returns a JSON string with the device properties.
     * @param deviceSerial The device serial for the device.
     * @returns JSON string with all properties.
     */
    async getDevicePropertiesAsJSON(deviceSerial) {
        var devices = this.getDevices();
        var json = "";
        try {
            json = `{"success":true,"type":"${devices[deviceSerial].getModel()}","data":${JSON.stringify(devices[deviceSerial].getProperties())}}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"The device with serial ${deviceSerial} does not exists."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Set a given value to a given property for a given device.
     * @param deviceSerial The serial of the device.
     * @param propertyName The name of the property.
     * @param propertyValue The value of the property.
     * @returns A JSON-String.
     */
    async setDeviceProperty(deviceSerial, propertyName, propertyValue) {
        if (!this.devices.existDevice(deviceSerial)) {
            return `{"success":false,"reason":"The device with serial ${deviceSerial} does not exists."}`;
        }
        try {
            await this.devices.setDeviceProperty(deviceSerial, propertyName, propertyValue);
            return `{"success":true,"reason":"The property ${propertyName} for device ${deviceSerial} has been processed."}`;
        }
        catch (e) {
            if (e instanceof http_1.InvalidPropertyError) {
                return `{"success":false,"reason":"The device ${deviceSerial} does not support the property ${propertyName}."}`;
            }
            else if (e instanceof error_1.ReadOnlyPropertyError) {
                return `{"success":false,"reason":"The property ${propertyName} is read only."}`;
            }
            else {
                return `{"success":false,"reason":"Other error occured."}`;
            }
        }
    }
    /**
     * Create a JSON string for a given station.
     * @param station The station the JSON string created for.
     */
    makeJsonForStation(station) {
        var properties = station.getProperties();
        var json = `{"eufyDeviceId":"${station.getId()}"`;
        json += `,"deviceType":"${station.getDeviceTypeString()}"`;
        json += `,"wanIpAddress":"${station.getIPAddress()}"`;
        json += `,"isP2PConnected":"${station.isConnected()}"`;
        for (var property in properties) {
            switch (property) {
                case http_1.PropertyName.Model:
                    json += `,"${property}":"${properties[property]}"`;
                    json += `,"modelName":"${this.stations.getStationModelName(station)}"`;
                    break;
                case http_1.PropertyName.StationGuardMode:
                    json += `,"${property}":"${properties[property] == undefined ? "n/a" : properties[property]}"`;
                    json += `,"guardModeTime":"${this.getApiUseUpdateStateEvent() == false ? "n/d" : (this.stations.getLastGuardModeChangeTime(station.getSerial()) == undefined ? "n/a" : this.stations.getLastGuardModeChangeTime(station.getSerial()))}"`;
                    break;
                case http_1.PropertyName.StationHomeSecuritySettings:
                case http_1.PropertyName.StationAwaySecuritySettings:
                    json += `,"${property}":[`;
                    json += `${JSON.stringify(properties[property])}]`;
                    break;
                default:
                    json += `,"${property}":"${properties[property] == undefined ? "n/a" : properties[property]}"`;
            }
        }
        json += `}`;
        return json;
    }
    /**
     * Returns a JSON-Representation of all stations including the guard mode.
     */
    async getStationsAsJSON() {
        try {
            if (this.stations) {
                await this.stations.loadStations();
                var stations = this.getStations();
                var json = "";
                var station;
                if (stations) {
                    for (var stationSerial in stations) {
                        station = stations[stationSerial];
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += this.makeJsonForStation(station);
                    }
                    json = `{"success":true,"data":[${json}]}`;
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = `{"success":false,"reason":"No stations found."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
            }
        }
        catch (e) {
            this.logError("Error occured at getStations()." + e.message);
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Get all stations as Stations-object.
     * @returns All stations as object.
     */
    async getRawStations() {
        //await this.httpService.refreshStationData();
        //await this.httpService.refreshDeviceData();
        await this.updateDeviceData();
        await this.stations.loadStations();
        return this.stations;
    }
    /**
     * Returns a JSON string with the station properties metadata.
     * @param stationSerial The station serial for the station.
     * @returns JSON string with all properties metadata.
     */
    async getStationPropertiesMetadataAsJSON(stationSerial) {
        var stations = this.getStations();
        var json = "";
        try {
            json = `{"success":true,"type":"${stations[stationSerial].getModel()}","data":${JSON.stringify(stations[stationSerial].getPropertiesMetadata())}}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"The station with serial ${stationSerial} does not exists."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Returns a JSON string with the station properties metadata.
     * @param stationSerial The device serial for the station.
     * @returns JSON string with all properties metadata.
     */
    async getStationPropertiesAsJSON(stationSerial) {
        var stations = this.getStations();
        var json = "";
        try {
            json = `{"success":true,"type":"${stations[stationSerial].getModel()}","data":${JSON.stringify(stations[stationSerial].getProperties())}}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"The station with serial ${stationSerial} does not exists."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Set a given value to a given property for a given station.
     * @param stationSerial The serial of the station.
     * @param propertyName The name of the property.
     * @param propertyValue The value of the property.
     * @returns A JSON-String.
     */
    async setStationProperty(stationSerial, propertyName, propertyValue) {
        if (!this.stations.existStation(stationSerial)) {
            return `{"success":false,"reason":"The station with serial ${stationSerial} does not exists."}`;
        }
        try {
            await this.stations.setStationProperty(stationSerial, propertyName, propertyValue);
            return `{"success":true,"reason":"The property ${propertyName} for station ${stationSerial} has been processed."}`;
        }
        catch (e) {
            if (e instanceof http_1.InvalidPropertyError) {
                return `{"success":false,"reason":"The station ${stationSerial} does not support the property ${propertyName}."}`;
            }
            else if (e instanceof error_1.ReadOnlyPropertyError) {
                return `{"success":false,"reason":"The property ${propertyName} is read only."}`;
            }
            else {
                return `{"success":false,"reason":"Other error occured."}`;
            }
        }
    }
    /**
     * Returns a JSON-Representation of a given station.
     */
    async getStationAsJSON(stationSerial) {
        await this.httpService.refreshStationData();
        await this.httpService.refreshDeviceData();
        await this.updateDeviceData();
        //await this.devices.loadDevices();
        var station = this.getStations();
        var json = "";
        try {
            json = `{"success":true,"data":${this.makeJsonForStation(station[stationSerial])}}`;
            this.setLastConnectionInfo(true);
        }
        catch {
            json = `{"success":false,"reason":"No station with serial ${stationSerial} found."}`;
            this.setLastConnectionInfo(false);
        }
        return json;
    }
    /**
     * Snoozes a given device for a given time.
     * @param device The device as object.
     * @param timeoutMS The snooze time in ms.
     */
    setDeviceSnooze(device, timeoutMS) {
        this.devices.setDeviceSnooze(device, timeoutMS);
    }
    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    updateDeviceProperties(deviceSerial, values) {
        this.devices.updateDeviceProperties(deviceSerial, values);
    }
    /**
     * Retrieves all config-relevat data for each station and update the config.
     * @param stations All stations in the account.
     * @param serialNumbers The serial numbers of all stations in the account.
     */
    async saveStationsSettings(stations, stationSerials) {
        if (this.stations) {
            for (var stationSerial in stations) {
                var station = stations[stationSerial];
                var p2p_did = this.config.getP2PData_p2p_did(stationSerial);
                var dsk_key = this.config.getP2PData_dsk_key(stationSerial);
                var dsk_key_creation = this.config.getP2PData_dsk_key_creation(stationSerial);
                var actor_id = this.config.getP2PData_actor_id(stationSerial);
                var station_ip_address = this.config.getP2PData_station_ip_address(stationSerial);
                var updateNeed = false;
                //if(p2p_did != station.getP2pDid() || dsk_key != await station.getDSKKey() || actor_id != station.getActorId() || station_ip_address != station.getLANIPAddress().value)
                if (p2p_did != station.getP2pDid() || actor_id != station.getActorId() || station_ip_address != station.getLANIPAddress()) {
                    updateNeed = true;
                }
                /*if(dsk_key_creation != station.getDskKeyExpiration().toString())
                {
                    updateNeed = true;
                }*/
                if (updateNeed == true) {
                    //this.config.setP2PData(stationSerial, station.getP2pDid(), await station.getDSKKey(), station.getDSKKeyExpiration().toString(), station.getActorId(), String(station.getLANIPAddress().value), "");
                    this.config.setP2PData(stationSerial, station.getP2pDid(), "", "", station.getActorId(), String(station.getLANIPAddress()), "");
                }
            }
        }
    }
    /**
     * Returns the guard mode of all stations as json string.
     */
    async getGuardMode() {
        try {
            if (this.stations) {
                await this.stations.loadStations();
                var mode = -1;
                var stations = this.getStations();
                var json = "";
                var station;
                if (stations) {
                    for (var stationSerial in stations) {
                        station = stations[stationSerial];
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += this.makeJsonForStation(station);
                        if (mode == -1) {
                            mode = station.getGuardMode();
                        }
                        else if (mode != station.getGuardMode()) {
                            mode = -2;
                        }
                        this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    }
                    json = `{"success":true,"data":[${json}]}`;
                    if (mode > -1) {
                        this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(mode));
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }
                    else {
                        this.setSystemVariableString("eufyCurrentState", "unbenkannt");
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = `{"success":false,"reason":"No stations found."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
            }
        }
        catch (e) {
            this.logError("Error occured at getGuardMode().");
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Returns the guard mode of all stations.
     */
    async getGuardModeAsGuardMode() {
        var mode = -1;
        try {
            if (this.stations) {
                await this.stations.loadStations();
                var stations = this.getStations();
                var station;
                if (stations) {
                    for (var stationSerial in stations) {
                        station = stations[stationSerial];
                        if (mode == -1) {
                            mode = station.getGuardMode();
                        }
                        else if (mode != station.getGuardMode()) {
                            mode = -2;
                        }
                    }
                }
            }
        }
        catch (e) {
            mode = -1;
        }
        if (mode < -1) {
            mode = -1;
        }
        return mode;
    }
    /**
     * Returns the guard mode of one stations.
     */
    async getGuardModeStation(stationSerial) {
        var _a;
        try {
            if (this.stations) {
                await this.stations.loadStations();
                var stations = this.getStations();
                var json = "";
                var station;
                station = stations[stationSerial];
                if (station) {
                    json = `{"success":true,"data":["${this.makeJsonForStation(station)}"]}`;
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(true);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    if (this.stations.getLastGuardModeChangeTime(station.getSerial()) == undefined) {
                        this.setSystemVariableString("eufyLastModeChangeTime" + station.getSerial(), "n/a");
                    }
                    else {
                        this.setSystemVariableTime("eufyLastModeChangeTime" + station.getSerial(), new Date((_a = this.stations.getLastGuardModeChangeTime(station.getSerial())) !== null && _a !== void 0 ? _a : 0));
                    }
                }
                else {
                    json = `{"success":false,"reason":"The station with serial ${stationSerial} does not exists."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
                this.setLastConnectionInfo(false);
            }
        }
        catch (e) {
            this.logError("Error occured at getGuardModeStation().");
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Update the guard mode for a given station.
     * @param stationSerial The serialnumber of the station.
     */
    async updateGuardModeStation(stationSerial) {
        await this.getGuardModeStation(stationSerial);
        if (this.waitUpdateState) {
            clearTimeout(this.waitUpdateState);
        }
        this.waitUpdateState = setTimeout(async () => { await this.updateGuardModeStations(); }, 10000);
    }
    /**
     * Update guard mode when changed by event.
     */
    async updateGuardModeStations() {
        if (this.waitUpdateState) {
            clearTimeout(this.waitUpdateState);
        }
        await this.getGuardMode();
    }
    /**
     * Set the guard mode of all stations to the given mode.
     * @param guardMode The target guard mode.
     */
    async setGuardMode(guardMode) {
        try {
            if (this.stations) {
                var err = 0;
                var res = await this.stations.setGuardMode(guardMode);
                if (res == true) {
                    var stations = this.getStations();
                    var station;
                    var json = "";
                    for (var stationSerial in stations) {
                        station = stations[stationSerial];
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        if (guardMode == station.getGuardMode()) {
                            json += `{"station_id":"${station.getSerial()}",`;
                            json += `"result":"success",`;
                            json += `"guard_mode":"${station.getGuardMode()}"}`;
                            this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                        }
                        else {
                            err = err + 1;
                            json += `{"station_id":"${station.getSerial()}",`;
                            json += `"result":"failure",`;
                            json += `"guard_mode":"${station.getGuardMode()}"}`;
                            this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                            this.logError(`Error occured at setGuardMode: Failed to switch mode for station ${station.getSerial()}.`);
                        }
                    }
                    if (err == 0) {
                        json = `{"success":true,"data":[${json}`;
                        this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(guardMode));
                        this.setLastConnectionInfo(true);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    }
                    else {
                        json = `{"success":false,"data":[${json}`;
                        this.setSystemVariableString("eufyCurrentState", "unbekannt");
                        this.setLastConnectionInfo(false);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                        this.logError("Error occured at setGuardMode: Failed to switch mode for station.");
                    }
                    json += "]}";
                }
                else {
                    json = `{"success":false,"reason":"Failed to communicate with station."}`;
                    this.logError("Error occured at setGuardMode: Failed to communicate with station.");
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
                this.setLastConnectionInfo(false);
                this.logError("Error occured at setGuardMode: No connection to eufy.");
            }
        }
        catch (e) {
            this.logError(`Error occured at setGuardMode: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Set the guard mode for the given station to the given mode.
     * @param stationSerial The serial of the station the mode to change.
     * @param guardMode The target guard mode.
     */
    async setGuardModeStation(stationSerial, guardMode) {
        var _a;
        try {
            if (this.stations) {
                if (this.devices.existDevice(stationSerial) == true) {
                    const device = await this.getDevices()[stationSerial];
                    if (device.isEnabled() == false) {
                        await this.setPrivacyMode(stationSerial, true);
                    }
                }
                var res = await this.stations.setGuardModeStation(stationSerial, guardMode);
                var stations = this.getStations();
                var station;
                station = stations[stationSerial];
                var json = "";
                if (res) {
                    json = `{"success":true,"data":[`;
                    json += `{"station_id":"${station.getSerial()}",`;
                    json += `"result":"success",`;
                    json += `"guard_mode":"${station.getGuardMode()}"}`;
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(true);
                    if (this.stations.getLastGuardModeChangeTime(station.getSerial()) == undefined) {
                        this.setSystemVariableString("eufyLastModeChangeTime" + station.getSerial(), "n/a");
                    }
                    else {
                        this.setSystemVariableTime("eufyLastModeChangeTime" + station.getSerial(), new Date((_a = this.stations.getLastGuardModeChangeTime(station.getSerial())) !== null && _a !== void 0 ? _a : 0));
                    }
                }
                else {
                    json = `{"success":false,"data":[`;
                    json += `{"station_id":"${station.getSerial()}",`;
                    json += `"result":"failure",`;
                    json += `"guard_mode":"${station.getGuardMode()}"}`;
                    this.updateStationGuardModeSystemVariable(station.getSerial(), station.getGuardMode());
                    this.setLastConnectionInfo(false);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                    this.logError(`Error occured at setGuardMode: Failed to switch mode for station ${station.getSerial()}.`);
                }
                json += "]}";
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
                this.setLastConnectionInfo(false);
                this.logError("Error occured at setGuardMode: No connection eo eufy.");
            }
        }
        catch (e) {
            this.logError(`Error occured at setGuardMode: ${e.message}.`);
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Set the systemvariable for a given station.
     * @param stationSerial The serial of the station.
     * @param guardMode The guard mode to set.
     */
    updateStationGuardModeSystemVariable(stationSerial, guardMode) {
        this.setSystemVariableString("eufyCentralState" + stationSerial, this.convertGuardModeToString(guardMode));
    }
    /**
     * Enable or disable the privacy mode of the device.
     * @param deviceSerial The serial of the device.
     * @param value The value to set.
     * @returns A JSON string with the result.
     */
    async setPrivacyMode(deviceSerial, value) {
        if (this.devices.existDevice(deviceSerial) == true) {
            const device = await this.getDevices()[deviceSerial];
            if (device.isIndoorCamera()) {
                if (device.isEnabled() == value) {
                    return `{"success":true,"info":"The value for privacy mode on device ${deviceSerial} already set."}`;
                }
                else {
                    await this.devices.setDeviceProperty(deviceSerial, http_1.PropertyName.DeviceEnabled, value);
                    await (0, utils_2.sleep)(2500);
                    await this.updateDeviceData();
                    await this.httpService.refreshStationData();
                    await this.httpService.refreshDeviceData();
                    await this.devices.loadDevices();
                    if (await this.getDevices()[deviceSerial].isEnabled() == value) {
                        return `{"success":true,"enabled":${value}}`;
                    }
                    else {
                        return `{"success":false,"enabled":${!value}}`;
                    }
                }
            }
            else {
                return `{"success":false,"reason":"Device ${deviceSerial} does not support privacy mode."}`;
            }
        }
        else {
            return `{"success":false,"reason":"Device ${deviceSerial} does not exists."}`;
        }
    }
    /**
     * Update the library (at this time only image and the corrospondending datetime) from the devices.
     */
    async getLibrary() {
        await this.httpService.refreshStationData();
        await this.httpService.refreshDeviceData();
        var json = "";
        try {
            if (this.devices) {
                await this.updateDeviceData();
                await this.devices.loadDevices();
                var devices = this.getDevices();
                var device;
                if (devices) {
                    for (var deviceSerial in devices) {
                        device = devices[deviceSerial];
                        if (this.devices.getDeviceTypeAsString(device) == "camera") {
                            device = devices[deviceSerial];
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            json += `{"device_id":"${deviceSerial}",`;
                            json += `"pictureUrl":"${(device.getLastCameraImageURL() != undefined) ? device.getLastCameraImageURL() : ""}",`;
                            json += `"pictureTime":"${this.devices.getLastVideoTime(deviceSerial) == undefined ? "n/a" : this.devices.getLastVideoTime(deviceSerial)}",`;
                            if (device.getLastCameraVideoURL() == "") {
                                json += `"videoUrl":"${this.config.getApiCameraDefaultVideo()}"`;
                            }
                            else {
                                json += `"videoUrl":"${device.getLastCameraVideoURL()}"`;
                            }
                            json += "}";
                            if (device.getLastCameraImageURL() == undefined) {
                                this.setSystemVariableString("eufyCameraImageURL" + deviceSerial, this.config.getApiCameraDefaultImage());
                            }
                            else {
                                this.setSystemVariableString("eufyCameraImageURL" + deviceSerial, device.getLastCameraImageURL());
                            }
                            if (device.getLastCameraVideoURL() == "") {
                                this.setSystemVariableString("eufyCameraVideoURL" + deviceSerial, this.config.getApiCameraDefaultVideo());
                            }
                            else {
                                this.setSystemVariableString("eufyCameraVideoURL" + deviceSerial, device.getLastCameraVideoURL());
                            }
                        }
                    }
                    json = `{"success":true,"data":[${json}]}`;
                    this.setSystemVariableTime("eufyLastLinkUpdateTime", new Date());
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = `{"success":false,"reason":"No devices found."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = `{"success":false,"reason":"No connection to eufy."}`;
            }
        }
        catch (e) {
            this.logError("Error occured at getLibrary().");
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Updates the last guard mode change time systemvariable for a given station.
     * @param stationSerial The serial of the station.
     * @param timestamp The timestamp to set.
     */
    updateStationGuardModeChangeTimeSystemVariable(stationSerial, timestamp) {
        if (this.getApiUseUpdateStateEvent() == true && timestamp != undefined) {
            this.setSystemVariableTime("eufyLastModeChangeTime" + stationSerial, new Date(timestamp));
        }
        else {
            this.setSystemVariableString("eufyLastModeChangeTime" + stationSerial, "n/a");
        }
        this.updateGlobalStationGuardModeChangeTimeSystemVariable();
    }
    /**
     * Update the global station guard mode change time systemvariable.
     */
    updateGlobalStationGuardModeChangeTimeSystemVariable() {
        var _a;
        var stations = this.getStations();
        var station;
        var tempModeChange;
        var lastModeChange = new Date(1970, 1, 1);
        for (var stationSerial in stations) {
            station = stations[stationSerial];
            tempModeChange = new Date((_a = this.stations.getLastGuardModeChangeTime(station.getSerial())) !== null && _a !== void 0 ? _a : 0);
            if (lastModeChange < tempModeChange) {
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
    updateCameraEventTimeSystemVariable(deviceSerial, timestamp) {
        if (this.getApiUsePushService() == true && timestamp != undefined) {
            this.setSystemVariableTime("eufyCameraVideoTime" + deviceSerial, new Date(timestamp));
        }
        else {
            this.setSystemVariableString("eufyCameraVideoTime" + deviceSerial, "n/a");
        }
    }
    /**
     * Get the Token from config.
     */
    getToken() {
        return this.config.getToken();
    }
    /**
     * Get the time of expire for the token from the config.
     */
    getTokenExpire() {
        return this.config.getTokenExpire();
    }
    /**
     * Save the new token and token expire to the config.
     * @param token The token.
     * @param tokenExpire The time the token exprire.
     */
    setTokenData(token, tokenExpire) {
        var res;
        var json = "";
        this.config.setToken(token);
        this.config.setTokenExpire(tokenExpire);
        res = this.config.writeConfig();
        if (res == "saved" || res == "ok") {
            json = `{"success":true,"dataRemoved":true}`;
        }
        else {
            json = `{"success":false,"dataRemoved":false}`;
        }
        return json;
    }
    /**
     * Returns if the api use HTTP
     */
    getApiUseHttp() {
        return this.config.getApiUseHttp();
    }
    /**
     * Get the port (HTTP) used for the api.
     */
    getApiServerPortHttp() {
        return Number.parseInt(this.config.getApiPortHttp());
    }
    /**
     * Return if the api use HTTPS
     */
    getApiUseHttps() {
        return this.config.getApiUseHttps();
    }
    /**
     * Get the port (HTTPS) used for the api.
     */
    getApiServerPortHttps() {
        return Number.parseInt(this.config.getApiPortHttps());
    }
    /**
     * Returns the key for the HTTPS connection.
     */
    getApiServerKeyHttps() {
        return this.config.getApiKeyFileHttps();
    }
    /**
     * Returns the cert file for https connection.
     */
    getApiServerCertHttps() {
        return this.config.getApiCertFileHttps();
    }
    /**
     * Returns true if static udp ports should be used otherwise false.
     */
    getUseUdpLocalPorts() {
        return this.config.getUseUdpLocalPorts();
    }
    /**
     * Returns the ports should be used for communication with stations.
     */
    getUDPLocalPorts() {
        var json = "";
        if (this.stations) {
            var stations = this.getStations();
            if (stations) {
                for (var stationSerial in stations) {
                    var temp = this.config.getUdpLocalPortsPerStation(stationSerial);
                    json += `"api_udp_local_static_ports_${stationSerial}":"${temp}",`;
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
    getUDPLocalPortForStation(stationSerial) {
        if (this.getUseUdpLocalPorts() == true) {
            try {
                return Number.parseInt(this.config.getUdpLocalPortsPerStation(stationSerial));
            }
            catch {
                return 0;
            }
        }
        else {
            return 0;
        }
    }
    /**
     * Returns the internal ip address for the given the station.
     * @param stationSerial The serial for the station.
     * @returns The internal ip address.
     */
    getLocalIpAddressForStation(stationSerial) {
        try {
            return this.config.getP2PData_station_ip_address(stationSerial);
        }
        catch {
            return "";
        }
    }
    /**
     * Determines if the updated state runs by event.
     */
    getApiUseUpdateStateEvent() {
        return this.config.getApiUseUpdateStateEvent();
    }
    getConfig() {
        return this.config;
    }
    /**
     * Get all config data needed for the webui.
     */
    getAPIConfig() {
        var json = `{"success":true,"data":[{`;
        json += `"configfile_version":"${this.config.getConfigFileVersion()}",`;
        json += `"username":"${this.config.getEmailAddress()}",`;
        json += `"password":"${this.config.getPassword()}",`;
        json += `"country":"${this.config.getCountry()}",`;
        json += `"language":"${this.config.getLanguage()}",`;
        json += `"api_http_active":"${this.config.getApiUseHttp()}",`;
        json += `"api_http_port":"${this.config.getApiPortHttp()}",`;
        json += `"api_https_active":"${this.config.getApiUseHttps()}",`;
        json += `"api_https_port":"${this.config.getApiPortHttps()}",`;
        json += `"api_https_key_file":"${this.config.getApiKeyFileHttps()}",`;
        json += `"api_https_cert_file":"${this.config.getApiCertFileHttps()}",`;
        json += `"api_connection_type":"${this.config.getConnectionType()}",`;
        json += `"api_udp_local_static_ports_active":"${this.config.getUseUdpLocalPorts()}",`;
        json += this.getUDPLocalPorts();
        json += `"api_use_system_variables":"${this.config.getApiUseSystemVariables()}",`;
        json += `"api_camera_default_image":"${this.config.getApiCameraDefaultImage()}",`;
        json += `"api_camera_default_video":"${this.config.getApiCameraDefaultVideo()}",`;
        json += `"api_use_update_state_event":"${this.config.getApiUseUpdateStateEvent()}",`;
        json += `"api_use_update_state_intervall":"${this.config.getApiUseUpdateStateIntervall()}",`;
        json += `"api_update_state_timespan":"${this.config.getApiUpdateStateTimespan()}",`;
        json += `"api_use_update_links":"${this.config.getApiUseUpdateLinks()}",`;
        json += `"api_use_update_links_only_when_active":"${this.config.getApiUpdateLinksOnlyWhenActive()}",`;
        json += `"api_update_links_timespan":"${this.config.getApiUpdateLinksTimespan()}",`;
        json += `"api_use_pushservice":"${this.config.getApiUsePushService()}",`;
        json += `"api_log_level":"${this.config.getApiLogLevel()}"}]}`;
        return json;
    }
    /**
     * Save the config got from webui.
     * @param username The username for the eufy security account.
     * @param password The password for the eufy security account.
     * @param country The country the eufy account is created for.
     * @param language The language the eufy account is using.
     * @param api_use_http Should the api use http.
     * @param api_port_http The http port for the api.
     * @param api_use_https Should the api use https.
     * @param api_port_https The https port for the api.
     * @param api_key_https The key for https.
     * @param api_cert_https The cert for https.
     * @param api_connection_type The connection type for connecting with station.
     * @param api_use_udp_local_static_ports Should the api use static ports to connect with station.
     * @param api_udp_local_static_ports The local ports for connection with station.
     * @param api_use_system_variables Should the api update related systemvariables.
     * @param api_camera_default_image The path to the default image.
     * @param api_camera_default_video The path to the default video.
     * @param api_use_update_state_event Should the api use station events for updateing the state.
     * @param api_use_update_state_intervall Should the api schedule a task for updateing the state.
     * @param api_update_state_timespan The time between two scheduled runs of update state.
     * @param api_use_update_links Should the api schedule a task for updateing the links.
     * @param api_use_update_links_only_when_active Should the api only refreah links when state is active
     * @param api_update_links_timespan The time between two scheduled runs of update links.
     * @param api_log_level The log level.
     * @returns
     */
    setConfig(username, password, country, language, api_use_http, api_port_http, api_use_https, api_port_https, api_key_https, api_cert_https, api_connection_type, api_use_udp_local_static_ports, api_udp_local_static_ports, api_use_system_variables, api_camera_default_image, api_camera_default_video, api_use_update_state_event, api_use_update_state_intervall, api_update_state_timespan, api_use_update_links, api_use_update_links_only_when_active, api_update_links_timespan, api_use_pushservice, api_log_level) {
        var serviceRestart = false;
        var taskSetupStateNeeded = false;
        var taskSetupLinksNeeded = false;
        if (this.config.getEmailAddress() != username || this.config.getPassword() != password || this.config.getApiUseHttp() != api_use_http || this.config.getApiPortHttp() != api_port_http || this.config.getApiUseHttps() != api_use_https || this.config.getApiPortHttps() != api_port_https || this.config.getApiKeyFileHttps() != api_key_https || this.config.getApiCertFileHttps() != api_cert_https || this.config.getConnectionType() != api_connection_type || this.config.getUseUdpLocalPorts() != api_use_udp_local_static_ports || this.config.getApiUseUpdateStateEvent() != api_use_update_state_event) {
            serviceRestart = true;
        }
        if (this.config.getEmailAddress() != username) {
            this.setTokenData("", "0");
        }
        this.config.setEmailAddress(username);
        this.config.setPassword(password);
        this.config.setCountry(country);
        this.config.setLanguage(language);
        this.config.setApiUseHttp(api_use_http);
        this.config.setApiPortHttp(api_port_http);
        this.config.setApiUseHttps(api_use_https);
        this.config.setApiPortHttps(api_port_https);
        this.config.setApiKeyFileHttps(api_key_https);
        this.config.setApiCertFileHttps(api_cert_https);
        this.config.setConnectionType(api_connection_type);
        this.config.setUseUdpLocalPorts(api_use_udp_local_static_ports);
        if (api_udp_local_static_ports[0][0] == undefined) {
            if (this.stations) {
                var stations = this.getStations();
                if (stations) {
                    for (var stationSerial in stations) {
                        if (this.config.setUdpLocalPortPerStation(stationSerial, "") == true) {
                            serviceRestart = true;
                        }
                    }
                }
            }
        }
        else {
            if (this.config.setUdpLocalPorts(api_udp_local_static_ports) == true) {
                serviceRestart = true;
            }
        }
        this.config.setApiUseSystemVariables(api_use_system_variables);
        this.config.setApiCameraDefaultImage(api_camera_default_image);
        this.config.setApiCameraDefaultVideo(api_camera_default_video);
        this.config.setApiUseUpdateStateEvent(api_use_update_state_event);
        if (this.config.getApiUseUpdateStateIntervall() == true && api_use_update_state_intervall == false) {
            this.clearScheduledTask(this.taskUpdateState, "getState");
        }
        else if (this.config.getApiUseUpdateStateIntervall() != api_use_update_state_intervall) {
            taskSetupStateNeeded = true;
        }
        this.config.setApiUseUpdateStateIntervall(api_use_update_state_intervall);
        if (this.config.getApiUpdateStateTimespan() != api_update_state_timespan) {
            taskSetupStateNeeded = true;
        }
        this.config.setApiUpdateStateTimespan(api_update_state_timespan);
        if (this.config.getApiUseUpdateLinks() == true && api_use_update_links == false) {
            this.clearScheduledTask(this.taskUpdateLinks, "getLibrary");
        }
        else if (this.config.getApiUseUpdateLinks() != api_use_update_links) {
            taskSetupLinksNeeded = true;
        }
        this.config.setApiUseUpdateLinks(api_use_update_links);
        this.config.setApiUpdateLinksOnlyWhenActive(api_use_update_links_only_when_active);
        if (this.config.getApiUpdateLinksTimespan() != api_update_links_timespan) {
            taskSetupLinksNeeded = true;
        }
        this.config.setApiUpdateLinksTimespan(api_update_links_timespan);
        if (taskSetupStateNeeded == true) {
            this.setupScheduledTask(this.taskUpdateState, "getState");
        }
        if (taskSetupLinksNeeded == true) {
            this.setupScheduledTask(this.taskUpdateLinks, "getLibrary");
        }
        this.config.setApiUsePushService(api_use_pushservice);
        this.config.setApiLogLevel(api_log_level);
        var res = this.config.writeConfig();
        if (res == "saved") {
            return `{"success":true,"serviceRestart":${serviceRestart},"message":"Config saved."}`;
        }
        else if (res == "ok") {
            return `{"success":true,"serviceRestart":${serviceRestart},"message":"No change in config. Write config not neccesary."}`;
        }
        else {
            return `{"success":false,"serviceRestart":false,"message":"Error during writing config."}`;
        }
    }
    /**
     * Write config to file.
     */
    writeConfig() {
        var res = this.config.writeConfig();
        if (res == "saved") {
            return `{"success":true,"message":"Config saved."}`;
        }
        else if (res == "ok") {
            return `{"success":true,"message":"No new values in config. Write config not neccesary."}`;
        }
        else {
            return `{"success":false,"serviceRestart":false,"message":"Error during writing config."}`;
        }
    }
    /**
     * Check if all system variables are created on the CCU
     */
    async checkSystemVariables() {
        try {
            if (this.config.getApiUseSystemVariables() == true) {
                if (this.stations && this.devices) {
                    await this.loadData();
                    var station;
                    var device;
                    var stations = this.getStations();
                    var devices = this.getDevices();
                    var commonSystemVariablesName = ["eufyCurrentState", "eufyLastConnectionResult", "eufyLastConnectionTime", "eufyLastLinkUpdateTime", "eufyLastStatusUpdateTime", "eufyLastModeChangeTime"];
                    var commonSystemVariablesInfo = ["aktueller Modus des eufy Systems", "Ergebnis der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Aktualisierung der eufy Links", "Zeitpunkt der letzten Aktualisierung des eufy Systemstatus", "Zeitpunkt des letzten Moduswechsels"];
                    var json = "";
                    var i = 0;
                    for (var sv of commonSystemVariablesName) {
                        json += `{"sysVar_name":"${sv}",`;
                        json += `"sysVar_info":"${commonSystemVariablesInfo[i]}",`;
                        if (await this.homematicApi.isSystemVariableAvailable(sv) == true) {
                            json += `"sysVar_available":true`;
                        }
                        else {
                            json += `"sysVar_available":false`;
                        }
                        json += "},";
                        i = i + 1;
                    }
                    for (var stationSerial in stations) {
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        station = stations[stationSerial];
                        json += `{"sysVar_name":"eufyCentralState${station.getSerial()}",`;
                        json += `"sysVar_info":"aktueller Status der Basis ${station.getSerial()}",`;
                        if (await this.homematicApi.isSystemVariableAvailable("eufyCentralState" + station.getSerial()) == true) {
                            json += `"sysVar_available":true`;
                        }
                        else {
                            json += `"sysVar_available":false`;
                        }
                        json += "}";
                        json += `,{"sysVar_name":"eufyLastModeChangeTime${station.getSerial()}",`;
                        json += `"sysVar_info":"Zeitpunkt des letzten Moduswechsels der Basis ${station.getSerial()}",`;
                        if (await this.homematicApi.isSystemVariableAvailable("eufyLastModeChangeTime" + station.getSerial()) == true) {
                            json += `"sysVar_available":true`;
                        }
                        else {
                            json += `"sysVar_available":false`;
                        }
                        json += "}";
                    }
                    for (var deviceSerial in devices) {
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        device = devices[deviceSerial];
                        json += `{"sysVar_name":"eufyCameraImageURL${device.getSerial()}",`;
                        json += `"sysVar_info":"Standbild der Kamera ${device.getSerial()}",`;
                        if (await this.homematicApi.isSystemVariableAvailable("eufyCameraImageURL" + device.getSerial()) == true) {
                            json += `"sysVar_available":true`;
                        }
                        else {
                            json += `"sysVar_available":false`;
                        }
                        json += "}";
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += `{"sysVar_name":"eufyCameraVideoTime${device.getSerial()}",`;
                        json += `"sysVar_info":"Zeitpunkt des letzten Videos der Kamera ${device.getSerial()}",`;
                        if (await this.homematicApi.isSystemVariableAvailable("eufyCameraVideoTime" + device.getSerial()) == true) {
                            json += `"sysVar_available":true`;
                        }
                        else {
                            json += `"sysVar_available":false`;
                        }
                        json += "}";
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += `{"sysVar_name":"eufyCameraVideoURL${device.getSerial()}",`;
                        json += `"sysVar_info":"letztes Video der Kamera ${device.getSerial()}",`;
                        if (await this.homematicApi.isSystemVariableAvailable("eufyCameraVideoURL" + device.getSerial()) == true) {
                            json += `"sysVar_available":true`;
                        }
                        else {
                            json += `"sysVar_available":false`;
                        }
                        json += "}";
                    }
                    json = `{"success":true,"data":[${json}]}`;
                }
                else {
                    json = `{"success":false,"reason":"No connection to eufy."}`;
                }
            }
            else {
                json = `{"success":false,"reason":"System variables in config disabled."}`;
            }
        }
        catch (e) {
            this.logError("Error occured at checkSystemVariables().");
            this.setLastConnectionInfo(false);
            json = `{"success":false,"reason":"${e.message}"}`;
        }
        return json;
    }
    /**
     * Create a system variable with the given name and the given info.
     * @param variableName The name of the system variable to create.
     * @param variableInfo The Info for the system variable to create.
     */
    async createSystemVariable(variableName, variableInfo) {
        var res = await this.homematicApi.createSystemVariable(variableName, variableInfo);
        if (res == variableName) {
            return `{"success":true,"message":"System variable created."}`;
        }
        else {
            return `{"success":true,"message":"Error while creating system variable."}`;
        }
    }
    /**
     * Set the state of the last connection with eufy to CCU.
     * @param success The state of the last request with eufy.
     */
    setLastConnectionInfo(success) {
        var nowDateTime = new Date();
        if (success == true) {
            this.setSystemVariableString("eufyLastConnectionResult", "erfolgreich");
            this.setSystemVariableTime("eufyLastConnectionTime", nowDateTime);
        }
        else {
            this.setSystemVariableString("eufyLastConnectionResult", "fehlerhaft");
            this.setSystemVariableTime("eufyLastConnectionTime", nowDateTime);
        }
    }
    /**
     * Set a dateTime value to a system variable.
     * @param systemVariable Name of the system variable to set.
     * @param dateTime The dateTime value to set.
     */
    setSystemVariableTime(systemVariable, dateTime) {
        this.setSystemVariableString(systemVariable, this.makeDateTimeString(dateTime.getTime()));
    }
    /**
     * Set a value value to a system variable.
     * @param systemVariable Name of the system variable to set.
     * @param newValue The value to set.
     */
    setSystemVariableString(systemVariable, newValue) {
        if (this.config.getApiUseSystemVariables() == true) {
            this.homematicApi.setSystemVariable(systemVariable, newValue);
        }
    }
    /**
     * Converts the given timestamp to the german dd.mm.yyyy hh:mm string.
     * @param timestamp The timestamp as number.
     */
    makeDateTimeString(timestamp) {
        var dateTime = new Date(timestamp);
        return (`${dateTime.getDate().toString().padStart(2, '0')}.${(dateTime.getMonth() + 1).toString().padStart(2, '0')}.${dateTime.getFullYear().toString()} ${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`);
    }
    /**
     * returns the content of the logfile.
     */
    async getLogFileContent() {
        return await this.homematicApi.getLogFileContent();
    }
    /**
     * Returns the content of the errorfile
     */
    async getErrorFileContent() {
        return await this.homematicApi.getErrorFileContent();
    }
    /**
     * Converts the guard mode to a string.
     * @param guardMode The guard mode.
     */
    convertGuardModeToString(guardMode) {
        var res = "";
        switch (guardMode) {
            case http_1.GuardMode.AWAY:
                res = "aktiviert";
                break;
            case http_1.GuardMode.CUSTOM1 || http_1.GuardMode.CUSTOM2 || http_1.GuardMode.CUSTOM3:
                res = "personalisiert";
                break;
            case http_1.GuardMode.DISARMED:
                res = "deaktiviert";
                break;
            case http_1.GuardMode.GEO:
                res = "geofencing";
                break;
            case http_1.GuardMode.HOME:
                res = "zu Hause";
                break;
            case http_1.GuardMode.OFF:
                res = "ausgeschaltet";
                break;
            case http_1.GuardMode.SCHEDULE:
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
    getP2PConnectionType() {
        try {
            var res = Number.parseInt(this.config.getConnectionType());
            switch (res) {
                case 1:
                    return p2p_1.P2PConnectionType.ONLY_LOCAL;
                case 2:
                    return p2p_1.P2PConnectionType.QUICKEST;
                default:
                    return p2p_1.P2PConnectionType.QUICKEST;
            }
        }
        catch {
            return p2p_1.P2PConnectionType.QUICKEST;
        }
    }
    /**
     * Add a given message to the logfile.
     * @param message The message to add to the logfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logInfoBasic(message, ...additionalMessages) {
        this.logger.logInfoBasic(message, ...additionalMessages);
    }
    /**
     * Add a given message to the logfile if the loglevel is set to info.
     * @param message The message to add to the logfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logInfo(message, ...additionalMessages) {
        this.logger.logInfo(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /** Add a given message to the errorfile and to the logfile if loglevel is set to error.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logError(message, ...additionalMessages) {
        this.logger.logError(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /**
     * Add a given message to the logfile if loglevel is set to debug.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logDebug(message, ...additionalMessages) {
        this.logger.logDebug(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /**
     * Add a given message to the logfile if loglevel is set to warn.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logWarn(message, ...additionalMessages) {
        this.logger.logWarn(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /**
     * Returns the current api log level.
     * @returns The current log level.
     */
    getApiLogLevel() {
        return this.config.getApiLogLevel();
    }
    /**
     * Returns the current value for using push service.
     * @returns A boolean value if push service is enabled or not.
     */
    getApiUsePushService() {
        return this.config.getApiUsePushService();
    }
    /**
     * Setup all scheduled task, when allowed by settings.
     */
    setupScheduledTasks() {
        this.logger.logInfoBasic(`Setting up scheduled tasks...`);
        if (this.taskUpdateDeviceInfo) {
            this.logger.logInfoBasic(`  updateDeviceData already scheduled, remove scheduling...`);
            clearInterval(this.taskUpdateDeviceInfo);
        }
        this.taskUpdateDeviceInfo = setInterval(async () => { await this.updateDeviceData(); }, (5 * 60 * 1000));
        this.logger.logInfoBasic(`  updateDeviceData scheduled (runs every 5 minutes).`);
        if (this.config.getApiUseUpdateStateIntervall()) {
            if (this.taskUpdateState) {
                this.logger.logInfoBasic(`  getState already scheduled, remove scheduling...`);
                clearInterval(this.taskUpdateState);
            }
            this.taskUpdateState = setInterval(async () => { await this.setScheduleState(); }, (Number.parseInt(this.config.getApiUpdateStateTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`  getState scheduled (runs every ${this.config.getApiUpdateStateTimespan()} minutes).`);
        }
        else {
            this.logger.logInfoBasic(`  scheduling getState disabled in settings${this.config.getApiUseUpdateStateEvent() == true ? " (state changes will be received by event)" : ""}.`);
        }
        if (this.config.getApiUseUpdateLinks()) {
            if (this.taskUpdateLinks) {
                this.logger.logInfoBasic(`  getLibrary already scheduled, remove scheduling...`);
                clearInterval(this.taskUpdateLinks);
            }
            this.taskUpdateLinks = setInterval(async () => { await this.setScheuduleLibrary(); }, (Number.parseInt(this.config.getApiUpdateLinksTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`  getLibrary scheduled (runs every ${this.config.getApiUpdateLinksTimespan()} minutes${this.config.getApiUpdateLinksOnlyWhenActive() == true ? " when system is active" : ""}).`);
        }
        else {
            this.logger.logInfoBasic(`  scheduling getLinks disabled in settings.`);
        }
        this.logger.logInfoBasic(`...done setting up scheduled tasks.`);
    }
    /**
     * Clear all scheduled tasks.
     */
    clearScheduledTasks() {
        if (this.taskUpdateDeviceInfo) {
            this.logger.logInfoBasic(`Remove scheduling for updateDeviceDataData.`);
            clearInterval(this.taskUpdateDeviceInfo);
        }
        if (this.taskUpdateState) {
            this.logger.logInfoBasic(`Remove scheduling for getState.`);
            clearInterval(this.taskUpdateState);
        }
        if (this.taskUpdateLinks) {
            this.logger.logInfoBasic(`Remove scheduling for getLibrary.`);
            clearInterval(this.taskUpdateLinks);
        }
    }
    /**
     * Setup the given scheduled task.
     * @param task The object of the task.
     * @param name The name of the task.
     */
    setupScheduledTask(task, name) {
        if (task) {
            this.logger.logInfoBasic(`Remove scheduling for ${name}.`);
            clearInterval(this.taskUpdateLinks);
        }
        if (name == "updateDeviceData") {
            task = setInterval(async () => { await this.updateDeviceData(); }, (5 * 60 * 1000));
            //task = setInterval(async() => { await this.httpService.refreshStationData(); await this.httpService.refreshDeviceData(); }, (5 * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getApiUpdateStateTimespan()} minutes).`);
        }
        else if (name == "getState") {
            task = setInterval(async () => { await this.setScheduleState(); }, (Number.parseInt(this.config.getApiUpdateStateTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getApiUpdateStateTimespan()} minutes).`);
        }
        else if (name == "getLibrary") {
            task = setInterval(async () => { await this.setScheuduleLibrary(); }, (Number.parseInt(this.config.getApiUpdateLinksTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getApiUpdateLinksTimespan()} minutes${this.config.getApiUpdateLinksOnlyWhenActive() == true ? " when system is active" : ""}).`);
        }
    }
    /**
     * Clear the given scheduled task.
     * @param task The object of the task.
     * @param name The name of the task.
     */
    clearScheduledTask(task, name) {
        if (task) {
            this.logger.logInfoBasic(`Remove scheduling for ${name}.`);
            clearInterval(task);
        }
    }
    /**
     * The method called when scheduleing state is called.
     */
    async setScheduleState() {
        await this.getGuardMode();
    }
    /**
     * The method called when scheduleing library is called.
     */
    async setScheuduleLibrary() {
        var mode = await this.getGuardModeAsGuardMode();
        if (this.config.getApiUpdateLinksOnlyWhenActive() == false || ((this.config.getApiUpdateLinksOnlyWhenActive() == true && mode != http_1.GuardMode.DISARMED) && (this.config.getApiUpdateLinksOnlyWhenActive() == true && mode != http_1.GuardMode.OFF))) {
            await this.getLibrary();
        }
    }
    /**
     * The method called when update device data is called.
     */
    async updateDeviceData() {
        await this.stations.updateDeviceData();
    }
    /**
     * Return the version of this API.
     */
    getApiVersion() {
        return `{"success":true,"platform":"${process.platform}","node_version":"${process.version}","node_arch":"${process.arch}","api_version":"${this.getEufySecurityApiVersion()}","homematic_api_version":"${this.homematicApi.getHomematicApiVersion()}","eufy_security_client_version":"${this.getEufySecurityClientVersion()}"}`;
    }
    /**
     * Returns the version of this API.
     * @returns The version of this API.
     */
    getEufySecurityApiVersion() {
        return "1.6.1";
    }
    /**
     * Return the version of the library used for communicating with eufy.
     * @returns The version of the used eufy-security-client.
     */
    getEufySecurityClientVersion() {
        return "2.2.0-rc2";
    }
}
exports.EufySecurityApi = EufySecurityApi;
