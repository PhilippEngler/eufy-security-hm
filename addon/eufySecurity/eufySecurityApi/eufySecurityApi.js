"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufySecurityApi = void 0;
const config_1 = require("./config");
const http_1 = require("./http");
const homematicApi_1 = require("./homematicApi");
const logging_1 = require("./utils/logging");
const devices_1 = require("./devices");
const bases_1 = require("./bases");
const p2p_1 = require("./p2p");
class EufySecurityApi {
    /**
     * Create the api object.
     */
    constructor() {
        this.logger = new logging_1.Logger(this);
        this.config = new config_1.Config(this.logger);
        this.httpApiAuth = http_1.AuthResult.ERROR;
        this.homematicApi = new homematicApi_1.HomematicApi(this);
        this.initialize();
    }
    /**
     * Initialize the api and make basic settings check.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.getEmailAddress() == "" || this.config.getPassword() == "") {
                this.logError("Please check your settings in the 'config.ini' file.\r\nIf there was no 'config.ini', it should now be there.\r\nYou need to set at least email and password to run this programm.");
            }
            else {
                this.httpService = new http_1.HTTPApi(this, this.config.getEmailAddress(), this.config.getPassword(), this.logger);
                this.httpService.setToken(this.getToken());
                this.httpService.setTokenExpiration(new Date(Number.parseInt(this.getTokenExpire()) * 1000));
                this.httpApiAuth = yield this.httpService.authenticate();
                if (this.httpApiAuth == http_1.AuthResult.OK) {
                    yield this.httpService.updateDeviceInfo();
                    this.bases = new bases_1.Bases(this, this.httpService);
                    this.devices = new devices_1.Devices(this.httpService);
                    yield this.loadData();
                    this.setupScheduledTasks();
                }
                else {
                    this.logError(`Login to eufy failed.`);
                }
            }
        });
    }
    /**
     * Close all P2P connections from all bases and all devices
     */
    closeP2PConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.bases != null) {
                yield this.bases.closeP2PConnections();
            }
            if (this.devices != null) {
                this.devices.closeP2PConnections();
            }
        });
    }
    /**
     * (Re)Loads all Bases and Devices and the settings of them.
     */
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.bases.loadBases();
            }
            catch (_a) {
                this.logError("Error occured at loadData() -> loadBases.");
                this.setLastConnectionInfo(false);
            }
            try {
                yield this.devices.loadDevices();
            }
            catch (_b) {
                this.logError("Error occured at loadData() -> loadDevices.");
                this.setLastConnectionInfo(false);
            }
        });
    }
    /**
     * Returns a JSON-Representation of all Devices.
     */
    getDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.devices) {
                    yield this.devices.loadDevices();
                    var devices = this.devices.getDevices();
                    var json = "";
                    if (devices) {
                        for (var key in devices) {
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            if (devices[key].isCamera() && !devices[key].isSoloCameras() && !devices[key].isIndoorCamera() && !devices[key].isDoorbell() && !devices[key].isWiredDoorbell() && !devices[key].isFloodLight()) {
                                var dev;
                                dev = devices[key];
                                json += `{"device_id":"${dev.getSerial()}",`;
                                json += `"eufy_device_id":"${dev.getId()}",`;
                                json += `"device_type":"${dev.getDeviceTypeString()}",`;
                                json += `"model":"${dev.getModel()}",`;
                                json += `"name":"${dev.getName()}",`;
                                json += `"hardware_Version":"${dev.getHardwareVersion()}",`;
                                json += `"software_version":"${dev.getSoftwareVersion()}",`;
                                json += `"base_serial":"${dev.getStationSerial()}",`;
                                json += `"battery_charge":"${dev.getBatteryValue().value}",`;
                                json += `"battery_temperature":"${dev.getBatteryTemperature().value}",`;
                                json += `"last_camera_image_time":"${dev.getLastCameraImageURL().timestamp / 1000}",`;
                                json += `"last_camera_image_url":"${dev.getLastCameraImageURL().value}"}`;
                            }
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
        });
    }
    /**
     * Create a JSON STring for a given base.
     * @param base The base the JSON string created for.
     */
    makeJSONforBase(base) {
        var json = `{"base_id":"${base.getSerial()}",`;
        json += `"eufy_device_id":"${base.getId()}",`;
        json += `"device_type":"${base.getDeviceTypeString()}",`;
        json += `"model":"${base.getModel()}",`;
        json += `"name":"${base.getName()}",`;
        json += `"hardware_Version":"${base.getHardwareVersion()}",`;
        json += `"software_version":"${base.getSoftwareVersion()}",`;
        json += `"mac_address":"${base.getMACAddress()}",`;
        json += `"external_ip_address":"${base.getIPAddress()}",`;
        json += `"local_ip_address":"${base.getLANIPAddress().value}",`;
        json += `"guard_mode":"${base.getGuardMode().value}",`;
        json += `"guard_mode_last_change_time":"${base.getGuardMode().timestamp / 1000}"}`;
        return json;
    }
    /**
     * Returns a JSON-Representation of all Bases including the guard mode.
     */
    getBases() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.bases) {
                    yield this.bases.loadBases();
                    var bases = this.bases.getBases();
                    var json = "";
                    var base;
                    if (bases) {
                        for (var key in bases) {
                            base = bases[key];
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            json += this.makeJSONforBase(base);
                        }
                        json = `{"success":true,"data":[${json}]}`;
                        this.setLastConnectionInfo(true);
                        this.handleLastModeChangeData(bases);
                    }
                    else {
                        json = `{"success":false,"reason":"No bases found."}`;
                        this.setLastConnectionInfo(false);
                    }
                }
                else {
                    json = `{"success":false,"reason":"No connection to eufy."}`;
                }
            }
            catch (e) {
                this.logError("Error occured at getBases()." + e.message);
                this.setLastConnectionInfo(false);
                json = `{"success":false,"reason":"${e.message}"}`;
            }
            return json;
        });
    }
    /**
     * Retrieves all config-relevat data for each Base and update the config.
     * @param bases All Bases in the account.
     * @param serialNumbers The serial numbers of all Bases in the account.
     */
    saveBasesSettings(bases, serialNumbers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.bases) {
                for (var key in bases) {
                    var base = bases[key];
                    var p2p_did = this.config.getP2PData_p2p_did(key);
                    var dsk_key = this.config.getP2PData_dsk_key(key);
                    var dsk_key_creation = this.config.getP2PData_dsk_key_creation(key);
                    var actor_id = this.config.getP2PData_actor_id(key);
                    var base_ip_address = this.config.getP2PData_base_ip_address(key);
                    var updateNeed = false;
                    if (p2p_did != base.getP2pDid() || dsk_key != (yield base.getDSKKey()) || actor_id != base.getActorId() || base_ip_address != base.getLANIPAddress().value) {
                        updateNeed = true;
                    }
                    /*if(dsk_key_creation != base.getDskKeyExpiration().toString())
                    {
                        updateNeed = true;
                    }*/
                    if (updateNeed == true) {
                        this.config.setP2PData(key, base.getP2pDid(), yield base.getDSKKey(), base.getDSKKeyExpiration().toString(), base.getActorId(), base.getLANIPAddress().value, "");
                    }
                }
            }
        });
    }
    /**
     * Returns the guard mode of all bases as json string.
     */
    getGuardMode() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.bases) {
                    yield this.bases.loadBases();
                    var mode = -1;
                    var bases = this.bases.getBases();
                    var json = "";
                    var base;
                    if (bases) {
                        for (var key in bases) {
                            base = bases[key];
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            json += this.makeJSONforBase(base);
                            if (mode == -1) {
                                mode = base.getGuardMode().value;
                            }
                            else if (mode != base.getGuardMode().value) {
                                mode = -2;
                            }
                            this.setSystemVariableString("eufyCentralState" + base.getSerial(), this.convertGuardModeToString(base.getGuardMode().value));
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
                        this.handleLastModeChangeData(bases);
                    }
                    else {
                        json = `{"success":false,"reason":"No Bases found."}`;
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
        });
    }
    /**
     * Returns the guard mode of all bases.
     */
    getGuardModeAsGuardMode() {
        return __awaiter(this, void 0, void 0, function* () {
            var mode = -1;
            try {
                if (this.bases) {
                    yield this.bases.loadBases();
                    var bases = this.bases.getBases();
                    var base;
                    if (bases) {
                        for (var key in bases) {
                            base = bases[key];
                            if (mode == -1) {
                                mode = base.getGuardMode().value;
                            }
                            else if (mode != base.getGuardMode().value) {
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
        });
    }
    /**
     * Returns the guard mode of one bases.
     */
    getGuardModeBase(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.bases) {
                    yield this.bases.loadBases();
                    var bases = this.bases.getBases();
                    var json = "";
                    var base;
                    base = bases[key];
                    if (base) {
                        json = `{"success":true,"data":["${this.makeJSONforBase(base)}"]}`;
                        this.setSystemVariableString("eufyCentralState" + base.getSerial(), this.convertGuardModeToString(base.getGuardMode().value));
                        this.setLastConnectionInfo(true);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                        this.setSystemVariableTime("eufyLastModeChangeTime" + base.getSerial(), new Date(base.getGuardMode().timestamp));
                    }
                    else {
                        json = `{"success":false,"reason":"No such base found."}`;
                        this.setLastConnectionInfo(false);
                    }
                }
                else {
                    json = `{"success":false,"reason":"No connection to eufy."}`;
                    this.setLastConnectionInfo(false);
                }
            }
            catch (e) {
                this.logError("Error occured at getGuardModeBase().");
                this.setLastConnectionInfo(false);
                json = `{"success":false,"reason":"${e.message}"}`;
            }
            return json;
        });
    }
    /**
     * Set the guard mode of all bases to the given mode.
     * @param guardMode The target guard mode.
     */
    setGuardMode(guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.bases) {
                    var err = 0;
                    var res = yield this.bases.setGuardMode(guardMode);
                    if (res == true) {
                        //await sleep(2500);
                        //await this.bases.loadBases();
                        var bases = this.bases.getBases();
                        var base;
                        var json = "";
                        for (var key in bases) {
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            base = bases[key];
                            if (guardMode == base.getGuardMode().value) {
                                json += `{"base_id":"${base.getSerial()}",`;
                                json += `"result":"success",`;
                                json += `"guard_mode":"${base.getGuardMode()}"}`;
                                this.setSystemVariableString("eufyCentralState" + base.getSerial(), this.convertGuardModeToString(base.getGuardMode().value));
                            }
                            else {
                                err = err + 1;
                                json += `{"base_id":"${base.getSerial()}",`;
                                json += `"result":"failure",`;
                                json += `"guard_mode":"${base.getGuardMode()}"}`;
                                this.setSystemVariableString("eufyCentralState" + base.getSerial(), this.convertGuardModeToString(base.getGuardMode().value));
                                this.logError(`Error occured at setGuardMode: Failed to switch mode for base ${base.getSerial()}.`);
                            }
                        }
                        if (err == 0) {
                            json = `{"success":true,"data":[${json}`;
                            this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(guardMode));
                            this.setLastConnectionInfo(true);
                            this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                            this.handleLastModeChangeData(bases);
                        }
                        else {
                            json = `{"success":false,"data":[${json}`;
                            this.setSystemVariableString("eufyCurrentState", "unbekannt");
                            this.setLastConnectionInfo(false);
                            this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                            this.logError("Error occured at setGuardMode: Failed to switch mode for bases.");
                        }
                        json += "]}";
                    }
                    else {
                        json = `{"success":false,"reason":"Failed to communicate with HomeBase."}`;
                        this.logError("Error occured at setGuardMode: Failed to communicate with HomeBase.");
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
        });
    }
    /**
     * Set the guard mode for the given base to the given mode.
     * @param baseSerial The serial of the base the mode to change.
     * @param guardMode The target guard mode.
     */
    setGuardModeBase(baseSerial, guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.bases) {
                    yield this.bases.setGuardModeBase(baseSerial, guardMode);
                    var bases = this.bases.getBases();
                    var base;
                    base = bases[baseSerial];
                    var json = "";
                    if (guardMode == base.getGuardMode().value) {
                        json = `{"success":true,"data":[`;
                        json += `{"base_id":"${base.getSerial()}",`;
                        json += `"result":"success",`;
                        json += `"guard_mode":"${base.getGuardMode().value}"}`;
                        this.setSystemVariableString("eufyCentralState" + base.getSerial(), this.convertGuardModeToString(base.getGuardMode().value));
                        this.setLastConnectionInfo(true);
                        this.setSystemVariableTime("eufyLastModeChangeTime" + base.getSerial(), new Date(base.getGuardMode().timestamp));
                    }
                    else {
                        json = `{"success":false,"data":[`;
                        json += `{"base_id":"${base.getSerial()}",`;
                        json += `"result":"failure",`;
                        json += `"guard_mode":"${base.getGuardMode().value}"}`;
                        this.setSystemVariableString("eufyCentralState" + base.getSerial(), this.convertGuardModeToString(base.getGuardMode().value));
                        this.setLastConnectionInfo(false);
                        this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                        this.logError(`Error occured at setGuardMode: Failed to switch mode for base ${base.getSerial()}.`);
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
        });
    }
    /**
     * Update the library (at this time only image and the corrospondending datetime) from the devices.
     */
    getLibrary() {
        return __awaiter(this, void 0, void 0, function* () {
            var json = "";
            try {
                if (this.devices) {
                    yield this.devices.loadDevices();
                    var devices = this.devices.getDevices();
                    var dev;
                    if (devices) {
                        for (var key in devices) {
                            dev = devices[key];
                            if (dev.getDeviceTypeString() == "camera") {
                                if (json.endsWith("}")) {
                                    json += ",";
                                }
                                json += `{"device_id":"${dev.getSerial()}",`;
                                if (dev.getLastCameraImageURL() == undefined) {
                                    json += `"last_camera_image_time":"",`;
                                }
                                else {
                                    json += `"last_camera_image_time":"${dev.getLastCameraImageURL().timestamp / 1000}",`;
                                }
                                if (dev.getLastCameraImageURL().value == undefined) {
                                    json += `"last_camera_image_url":"${this.config.getApiCameraDefaultImage()}",`;
                                }
                                else {
                                    json += `"last_camera_image_url":"${dev.getLastCameraImageURL().value}",`;
                                }
                                if (dev.getLastCameraVideoURL() == "") {
                                    json += `"last_camera_video_url":"${this.config.getApiCameraDefaultVideo()}"`;
                                }
                                else {
                                    json += `"last_camera_video_url":"${dev.getLastCameraVideoURL()}"`;
                                }
                                json += "}";
                                if (dev.getLastCameraImageURL().timestamp == undefined || dev.getLastCameraImageURL().timestamp == 0) {
                                    this.setSystemVariableString("eufyCameraVideoTime" + dev.getSerial(), "");
                                }
                                else {
                                    this.setSystemVariableString("eufyCameraVideoTime" + dev.getSerial(), this.makeDateTimeString(dev.getLastCameraImageURL().timestamp));
                                }
                                if (dev.getLastCameraImageURL() == undefined || dev.getLastCameraImageURL().timestamp == 0) {
                                    this.setSystemVariableString("eufyCameraImageURL" + dev.getSerial(), this.config.getApiCameraDefaultImage());
                                }
                                else {
                                    this.setSystemVariableString("eufyCameraImageURL" + dev.getSerial(), dev.getLastCameraImageURL().value);
                                }
                                if (dev.getLastCameraVideoURL() == "") {
                                    this.setSystemVariableString("eufyCameraVideoURL" + dev.getSerial(), this.config.getApiCameraDefaultVideo());
                                }
                                else {
                                    this.setSystemVariableString("eufyCameraVideoURL" + dev.getSerial(), dev.getLastCameraImageURL().value);
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
        });
    }
    /**
     * Set the systemvariables for last mode change time.
     * @param bases The array with all bases.
     */
    handleLastModeChangeData(bases) {
        var base;
        var tempModeChange;
        var lastModeChange = new Date(1970, 1, 1);
        for (var key in bases) {
            base = bases[key];
            tempModeChange = new Date(base.getGuardMode().timestamp);
            if (lastModeChange < tempModeChange) {
                lastModeChange = tempModeChange;
            }
            this.setSystemVariableTime("eufyLastModeChangeTime" + base.getSerial(), tempModeChange);
        }
        this.setSystemVariableTime("eufyLastModeChangeTime", lastModeChange);
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
     * Returns the ports should be used for communication with HomeBases.
     */
    getUDPLocalPorts() {
        var json = "";
        if (this.bases) {
            var bases = this.bases.getBases();
            if (bases) {
                for (var key in bases) {
                    var temp = this.config.getUdpLocalPortsPerBase(key);
                    json += `"api_udp_local_static_ports_${key}":"${temp}",`;
                }
            }
        }
        return json;
    }
    /**
     * Returns the specified UDP port for communication with the HomeBase.
     * @param baseSerial The serial for the HomeBase.
     * @returns The UDP port for the connection to the HomeBase.
     */
    getUDPLocalPortForBase(baseSerial) {
        if (this.config.getUseUdpLocalPorts() == true) {
            try {
                return Number.parseInt(this.config.getUdpLocalPortsPerBase(baseSerial));
            }
            catch (_a) {
                return 0;
            }
        }
        else {
            return 0;
        }
    }
    /**
     * Get all config data needed for the webui.
     */
    getConfig() {
        var json = `{"success":true,"data":[{`;
        json += `"username":"${this.config.getEmailAddress()}",`;
        json += `"password":"${this.config.getPassword()}",`;
        json += `"api_http_active":"${this.config.getApiUseHttp()}",`;
        json += `"api_http_port":"${this.config.getApiPortHttp()}",`;
        json += `"api_https_active":"${this.config.getApiUseHttps()}",`;
        json += `"api_https_port":"${this.config.getApiPortHttps()}",`;
        json += `"api_https_key_file":"${this.config.getApiKeyFileHttps()}",`;
        json += `"api_https_cert_file":"${this.config.getApiCertFileHttps()}",`;
        json += `"api_connection_type":"${this.config.getConnectionType()}",`;
        json += `"api_udp_local_static_ports_active":"${this.config.getUseUdpLocalPorts()}",`;
        //json += `"api_udp_local_static_ports":"${this.config.getUdpLocalPorts()}",`;
        json += this.getUDPLocalPorts();
        json += `"api_use_system_variables":"${this.config.getApiUseSystemVariables()}",`;
        json += `"api_camera_default_image":"${this.config.getApiCameraDefaultImage()}",`;
        json += `"api_camera_default_video":"${this.config.getApiCameraDefaultVideo()}",`;
        json += `"api_use_update_state":"${this.config.getApiUseUpdateState()}",`;
        json += `"api_update_state_timespan":"${this.config.getApiUpdateStateTimespan()}",`;
        json += `"api_use_update_links":"${this.config.getApiUseUpdateLinks()}",`;
        json += `"api_use_update_links_only_when_active":"${this.config.getApiUpdateLinksOnlyWhenActive()}",`;
        json += `"api_update_links_timespan":"${this.config.getApiUpdateLinksTimespan()}",`;
        json += `"api_log_level":"${this.config.getApiLogLevel()}"}]}`;
        return json;
    }
    /**
     * Save the config got from webui.
     * @param username The username for the eufy security account.
     * @param password The password for the eufy security account.
     * @param api_use_http Should the api use http.
     * @param api_port_http The http port for the api.
     * @param api_use_https Should the api use https.
     * @param api_port_https The https port for the api.
     * @param api_key_https The key for https.
     * @param api_cert_https The cert for https.
     * @param api_connection_type The connection type for connecting with HomeBases.
     * @param api_use_udp_local_static_ports Should the api use static ports to connect with HomeBase.
     * @param api_udp_local_static_ports The local ports for connection with HomeBase.
     * @param api_use_system_variables Should the api update related systemvariables.
     * @param api_camera_default_image The path to the default image.
     * @param api_camera_default_video The path to the default video.
     * @param api_use_update_state Should the api schedule a task for updateing the state.
     * @param api_update_state_timespan The time between two scheduled runs of update state.
     * @param api_use_update_links Should the api schedule a task for updateing the links.
     * @param api_use_update_links_only_when_active Should the api only refreah links when state is active
     * @param api_update_links_timespan The time between two scheduled runs of update links.
     * @param api_log_level The log level.
     * @returns
     */
    setConfig(username, password, api_use_http, api_port_http, api_use_https, api_port_https, api_key_https, api_cert_https, api_connection_type, api_use_udp_local_static_ports, api_udp_local_static_ports, api_use_system_variables, api_camera_default_image, api_camera_default_video, api_use_update_state, api_update_state_timespan, api_use_update_links, api_use_update_links_only_when_active, api_update_links_timespan, api_log_level) {
        var serviceRestart = false;
        var taskSetupStateNeeded = false;
        var taskSetupLinksNeeded = false;
        if (this.config.getEmailAddress() != username || this.config.getPassword() != password || this.config.getApiUseHttp() != api_use_http || this.config.getApiPortHttp() != api_port_http || this.config.getApiUseHttps() != api_use_https || this.config.getApiPortHttps() != api_port_https || this.config.getApiKeyFileHttps() != api_key_https || this.config.getApiCertFileHttps() != api_cert_https || this.config.getUseUdpLocalPorts() != api_use_udp_local_static_ports) {
            serviceRestart = true;
        }
        if (this.config.getEmailAddress() != username) {
            this.setTokenData("", "0");
        }
        this.config.setEmailAddress(username);
        this.config.setPassword(password);
        this.config.setApiUseHttp(api_use_http);
        this.config.setApiPortHttp(api_port_http);
        this.config.setApiUseHttps(api_use_https);
        this.config.setApiPortHttps(api_port_https);
        this.config.setApiKeyFileHttps(api_key_https);
        this.config.setApiCertFileHttps(api_cert_https);
        this.config.setConnectionType(api_connection_type);
        this.config.setUseUdpLocalPorts(api_use_udp_local_static_ports);
        if (api_udp_local_static_ports[0][0] == undefined) {
            if (this.bases) {
                var bases = this.bases.getBases();
                if (bases) {
                    for (var key in bases) {
                        if (this.config.setUdpLocalPortPerBase(key, "") == true) {
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
        if (this.config.getApiUseUpdateState() == true && api_use_update_state == false) {
            this.clearScheduledTask(this.taskUpdateState, "getState");
        }
        else if (this.config.getApiUseUpdateState() != api_use_update_state) {
            taskSetupStateNeeded = true;
        }
        this.config.setApiUseUpdateState(api_use_update_state);
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
    checkSystemVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.config.getApiUseSystemVariables() == true) {
                    if (this.bases && this.devices) {
                        yield this.loadData();
                        var base;
                        var device;
                        var bases = this.bases.getBases();
                        var devices = this.devices.getDevices();
                        var commonSystemVariablesName = ["eufyCurrentState", "eufyLastConnectionResult", "eufyLastConnectionTime", "eufyLastLinkUpdateTime", "eufyLastStatusUpdateTime", "eufyLastModeChangeTime"];
                        var commonSystemVariablesInfo = ["aktueller Modus des eufy Systems", "Ergebnis der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Aktualisierung der eufy Links", "Zeitpunkt der letzten Aktualisierung des eufy Systemstatus", "Zeitpunkt des letzten Moduswechsels"];
                        var json = "";
                        var i = 0;
                        for (var sv of commonSystemVariablesName) {
                            json += `{"sysVar_name":"${sv}",`;
                            json += `"sysVar_info":"${commonSystemVariablesInfo[i]}",`;
                            if ((yield this.homematicApi.isSystemVariableAvailable(sv)) == true) {
                                json += `"sysVar_available":true`;
                            }
                            else {
                                json += `"sysVar_available":false`;
                            }
                            json += "},";
                            i = i + 1;
                        }
                        for (var key in bases) {
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            base = bases[key];
                            json += `{"sysVar_name":"eufyCentralState${base.getSerial()}",`;
                            json += `"sysVar_info":"aktueller Status der Basis ${base.getSerial()}",`;
                            if ((yield this.homematicApi.isSystemVariableAvailable("eufyCentralState" + base.getSerial())) == true) {
                                json += `"sysVar_available":true`;
                            }
                            else {
                                json += `"sysVar_available":false`;
                            }
                            json += "}";
                            json += `,{"sysVar_name":"eufyLastModeChangeTime${base.getSerial()}",`;
                            json += `"sysVar_info":"Zeitpunkt des letzten Moduswechsels der Basis ${base.getSerial()}",`;
                            if ((yield this.homematicApi.isSystemVariableAvailable("eufyLastModeChangeTime" + base.getSerial())) == true) {
                                json += `"sysVar_available":true`;
                            }
                            else {
                                json += `"sysVar_available":false`;
                            }
                            json += "}";
                        }
                        for (var key in devices) {
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            device = devices[key];
                            json += `{"sysVar_name":"eufyCameraImageURL${device.getSerial()}",`;
                            json += `"sysVar_info":"Standbild der Kamera ${device.getSerial()}",`;
                            if ((yield this.homematicApi.isSystemVariableAvailable("eufyCameraImageURL" + device.getSerial())) == true) {
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
                            if ((yield this.homematicApi.isSystemVariableAvailable("eufyCameraVideoTime" + device.getSerial())) == true) {
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
                            if ((yield this.homematicApi.isSystemVariableAvailable("eufyCameraVideoURL" + device.getSerial())) == true) {
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
        });
    }
    /**
     * Create a system variable with the given name and the given info.
     * @param variableName The name of the system variable to create.
     * @param variableInfo The Info for the system variable to create.
     */
    createSystemVariable(variableName, variableInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var res = yield this.homematicApi.createSystemVariable(variableName, variableInfo);
            if (res == variableName) {
                return `{"success":true,"message":"System variable created."}`;
            }
            else {
                return `{"success":true,"message":"Error while creating system variable."}`;
            }
        });
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
    getLogFileContent() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.homematicApi.getLogFileContent();
        });
    }
    /**
     * Returns the content of the errorfile
     */
    getErrorFileContent() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.homematicApi.getErrorFileContent();
        });
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
     * Returns the P2P connection type determine how to connect to the HomeBases.
     * @returns The P2PConnection type.
     */
    getP2PConnectionType() {
        try {
            var res = Number.parseInt(this.config.getConnectionType());
            switch (res) {
                case 0:
                    return p2p_1.P2PConnectionType.PREFER_LOCAL;
                case 1:
                    return p2p_1.P2PConnectionType.ONLY_LOCAL;
                case 2:
                    return p2p_1.P2PConnectionType.QUICKEST;
                default:
                    return p2p_1.P2PConnectionType.PREFER_LOCAL;
            }
        }
        catch (_a) {
            return p2p_1.P2PConnectionType.PREFER_LOCAL;
        }
    }
    /**
     * Add a given message to the logfile.
     * @param message The message to add to the logfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logInfo(message, ...additionalMessages) {
        this.logger.logInfo(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /** Add a given message to the errorfile.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logError(message, ...additionalMessages) {
        this.logger.logError(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /**
     * Add a given message to the debug.
     * @param message The message to add to the errorfile.
     * @param additionalMessages Additional message(s) to be added.
     */
    logDebug(message, ...additionalMessages) {
        this.logger.logDebug(this.config.getApiLogLevel(), message, ...additionalMessages);
    }
    /**
     * Returns the current api log level.
     * @returns The current log level.
     */
    getApiLogLevel() {
        return this.config.getApiLogLevel();
    }
    /**
     * Setup all scheduled task, when allowed by settings.
     */
    setupScheduledTasks() {
        this.logger.logInfoBasic("Setting up scheduled tasks...");
        if (this.config.getApiUseUpdateState()) {
            if (this.taskUpdateState) {
                this.logger.logInfoBasic("  getState already scheduled, remove scheduling...");
                clearInterval(this.taskUpdateState);
            }
            this.taskUpdateState = setInterval(() => __awaiter(this, void 0, void 0, function* () { yield this.setScheduleState(); }), (Number.parseInt(this.config.getApiUpdateStateTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`  getState scheduled (runs every ${this.config.getApiUpdateStateTimespan()} minutes).`);
        }
        else {
            this.logger.logInfoBasic("  scheduling getState disabled in settings.");
        }
        if (this.config.getApiUseUpdateLinks()) {
            if (this.taskUpdateLinks) {
                this.logger.logInfoBasic("  getLibrary already scheduled, remove scheduling...");
                clearInterval(this.taskUpdateLinks);
            }
            this.taskUpdateLinks = setInterval(() => __awaiter(this, void 0, void 0, function* () { yield this.setScheuduleLibrary(); }), (Number.parseInt(this.config.getApiUpdateLinksTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`  getLibrary scheduled (runs every ${this.config.getApiUpdateLinksTimespan()} minutes).`);
        }
        else {
            this.logger.logInfoBasic("  scheduling getLinks disabled in settings.");
        }
        this.logger.logInfoBasic("...done setting up scheduled tasks.");
    }
    /**
     * Clear all scheduled tasks.
     */
    clearScheduledTasks() {
        if (this.taskUpdateState) {
            this.logger.logInfoBasic("Remove scheduling for getState.");
            clearInterval(this.taskUpdateState);
        }
        if (this.taskUpdateLinks) {
            this.logger.logInfoBasic("Remove scheduling for getLibrary.");
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
        if (name == "getState") {
            task = setInterval(() => __awaiter(this, void 0, void 0, function* () { yield this.setScheduleState(); }), (Number.parseInt(this.config.getApiUpdateStateTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getApiUpdateStateTimespan()} minutes).`);
        }
        else if (name == "getLibrary") {
            task = setInterval(() => __awaiter(this, void 0, void 0, function* () { yield this.setScheuduleLibrary(); }), (Number.parseInt(this.config.getApiUpdateLinksTimespan()) * 60 * 1000));
            this.logger.logInfoBasic(`${name} scheduled (runs every ${this.config.getApiUpdateLinksTimespan()} minutes).`);
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
    setScheduleState() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getGuardMode();
        });
    }
    /**
     * The method called when scheduleing library is called.
     */
    setScheuduleLibrary() {
        return __awaiter(this, void 0, void 0, function* () {
            var mode = yield this.getGuardModeAsGuardMode();
            if (this.config.getApiUpdateLinksOnlyWhenActive() == false || ((this.config.getApiUpdateLinksOnlyWhenActive() == true && mode != http_1.GuardMode.DISARMED) && (this.config.getApiUpdateLinksOnlyWhenActive() == true && mode != http_1.GuardMode.OFF))) {
                yield this.getLibrary();
            }
        });
    }
    /**
     * Return the version of this API.
     */
    getApiVersion() {
        return `{"success":true,"api_version":"${this.getEufySecurityApiVersion()}","homematic_api_version":"${this.homematicApi.getHomematicApiVersion()}","eufy_security_client_version":"${this.getEufySecurityClientVersion()}"}`;
    }
    /**
     * Returns the version of this API.
     * @returns The version of this API.
     */
    getEufySecurityApiVersion() {
        return "1.5.0";
    }
    /**
     * Return the version of the library used for communicating with eufy.
     * @returns The version of the used eufy-security-client.
     */
    getEufySecurityClientVersion() {
        return "0.7.2";
    }
}
exports.EufySecurityApi = EufySecurityApi;
