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
const http_response_models_1 = require("./http/http-response.models");
const devices_1 = require("./devices");
const bases_1 = require("./bases");
const push_1 = require("./push");
class EufySecurityApi {
    /**
     * Create the api object.
     */
    constructor() {
        this.config = new config_1.Config();
        this.logger = new logging_1.Logger();
        this.homematicApi = new homematicApi_1.HomematicApi(this.logger);
        this.initialize();
    }
    /**
     * Initialize the api and make basic settings check.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.getEmailAddress() == "" || this.config.getPassword() == "") {
                this.logger.err("Please check your settings in the 'config.ini' file.\r\nIf there was no 'config.ini', it should now be there.\r\nYou need to set email and password at least to run this programm.");
            }
            else {
                this.httpService = new http_1.HttpService(this.config.getEmailAddress(), this.config.getPassword(), this);
                this.devices = new devices_1.Devices(this.httpService);
                this.bases = new bases_1.Bases(this, this.httpService);
                yield this.loadData();
            }
        });
    }
    /**
     * (Re)Loads all Bases and Devices and the settings of them.
     */
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.devices.loadDevices();
            yield this.bases.loadBases();
        });
    }
    /**
     * Returns a JSON-Representation of all Devices.
     */
    getDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.devices) {
                yield this.devices.loadDevices();
                var devices = this.devices.getDevices();
                var dev;
                var json = "";
                if (devices) {
                    for (var key in devices) {
                        dev = devices[key];
                        if (json.endsWith("}")) {
                            json += ",";
                        }
                        json += "{";
                        json += "\"device_id\":\"" + dev.getSerialNumber() + "\",";
                        json += "\"eufy_device_id\":\"" + dev.getId() + "\",";
                        json += "\"device_type\":\"" + dev.getDeviceTypeString() + "\",";
                        json += "\"model\":\"" + dev.getModel() + "\",";
                        json += "\"name\":\"" + dev.getName() + "\",";
                        json += "\"hardware_Version\":\"" + dev.getHardwareVersion() + "\",";
                        json += "\"software_version\":\"" + dev.getSoftwareVersion() + "\",";
                        json += "\"base_serial\":\"" + dev.getBaseSerialConnected() + "\",";
                        json += "\"battery_charge\":\"" + dev.getBatteryCharge() + "\",";
                        json += "\"battery_temperature\":\"" + dev.getBatteryTemperature() + "\",";
                        json += "\"last_camera_image_time\":\"" + dev.getLastImageTime() + "\",";
                        json += "\"last_camera_image_url\":\"" + dev.getLastImageUrl() + "\"";
                        json += "}";
                    }
                    json = "{\"success\":true,\"data\":[" + json + "]}";
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = "{\"success\":false,\"reason\":\"No devices found.\"}";
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
            }
            return json;
        });
    }
    makeJSONforBase(base) {
        var json = "{";
        json += "\"base_id\":\"" + base.getSerialNumber() + "\",";
        json += "\"eufy_device_id\":\"" + base.getId() + "\",";
        json += "\"device_type\":\"" + base.getDeviceTypeString() + "\",";
        json += "\"model\":\"" + base.getModel() + "\",";
        json += "\"name\":\"" + base.getName() + "\",";
        json += "\"hardware_Version\":\"" + base.getHardwareVersion() + "\",";
        json += "\"software_version\":\"" + base.getSoftwareVersion() + "\",";
        json += "\"mac_address\":\"" + base.getMacAddress() + "\",";
        json += "\"external_ip_address\":\"" + base.getExternalIpAddress() + "\",";
        json += "\"local_ip_address\":\"" + base.getLocalIpAddress() + "\",";
        json += "\"guard_mode\":\"" + base.getGuardMode() + "\"";
        json += "}";
        return json;
    }
    /**
     * Returns a JSON-Representation of all Bases including the guard mode.
     */
    getBases() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    json = "{\"success\":true,\"data\":[" + json + "]}";
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = "{\"success\":false,\"reason\":\"No bases found.\"}";
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
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
            for (var key in bases) {
                var base = bases[key];
                var p2p_did = this.config.getP2PData_p2p_did(key);
                var dsk_key = this.config.getP2PData_dsk_key(key);
                var dsk_key_creation = this.config.getP2PData_dsk_key_creation(key);
                var actor_id = this.config.getP2PData_actor_id(key);
                var base_ip_address = this.config.getP2PData_base_ip_address(key);
                var updateNeed = false;
                if (p2p_did != base.getP2pDid() || dsk_key != (yield base.getDskKey()) || actor_id != base.getActorId() || base_ip_address != base.getLocalIpAddress()) {
                    updateNeed = true;
                }
                /*if(dsk_key_creation != base.getDskKeyExpiration().toString())
                {
                    updateNeed = true;
                }*/
                if (updateNeed == true) {
                    this.config.setP2PData(key, base.getP2pDid(), yield base.getDskKey(), base.getDskKeyExpiration().toString(), base.getActorId(), base.getLocalIpAddress(), "");
                }
            }
        });
    }
    /**
     * Returns the guard mode of all bases.
     */
    getGuardMode() {
        return __awaiter(this, void 0, void 0, function* () {
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
                            mode = Number.parseInt(base.getGuardMode());
                        }
                        else if (mode != Number.parseInt(base.getGuardMode())) {
                            mode = -2;
                        }
                        this.setSystemVariableString("eufyCentralState" + base.getSerialNumber(), this.convertGuardModeToString(Number.parseInt(base.getGuardMode())));
                    }
                    json = "{\"success\":true,\"data\":[" + json + "]}";
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
                    json = "{\"success\":false,\"reason\":\"No Bases found.\"";
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
            }
            return json;
        });
    }
    /**
     * Returns the guard mode of one bases.
     */
    getGuardModeBase(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.bases) {
                yield this.bases.loadBases();
                var bases = this.bases.getBases();
                var json = "";
                var base;
                base = bases[key];
                if (base) {
                    json += this.makeJSONforBase(base);
                    json += "]}";
                    json = "{\"success\":true,\"data\":[" + json;
                    this.setSystemVariableString("eufyCentralState" + base.getSerialNumber(), this.convertGuardModeToString(Number.parseInt(base.getGuardMode())));
                    this.setLastConnectionInfo(true);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                }
                else {
                    json = "{\"success\":false,\"reason\":\"No such base found.\"}";
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
                this.setLastConnectionInfo(false);
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
            if (this.bases) {
                var err = 0;
                yield this.bases.setGuardMode(guardMode);
                yield push_1.sleep(2500);
                yield this.bases.loadBases();
                var bases = this.bases.getBases();
                var base;
                var json = "";
                for (var key in bases) {
                    if (json.endsWith("}")) {
                        json += ",";
                    }
                    base = bases[key];
                    if (guardMode.toString() == base.getGuardMode()) {
                        json += "{";
                        json += "\"base_id\":\"" + base.getSerialNumber() + "\",";
                        json += "\"result\":\"success\",";
                        json += "\"guard_mode\":\"" + base.getGuardMode() + "\"";
                        json += "}";
                        this.setSystemVariableString("eufyCentralState" + base.getSerialNumber(), this.convertGuardModeToString(Number.parseInt(base.getGuardMode())));
                    }
                    else {
                        err = err + 1;
                        json += "{";
                        json += "\"base_id\":\"" + base.getSerialNumber() + "\",";
                        json += "\"result\":\"failure\",";
                        json += "\"guard_mode\":\"" + base.getGuardMode() + "\"";
                        json += "}";
                        this.setSystemVariableString("eufyCentralState" + base.getSerialNumber(), this.convertGuardModeToString(Number.parseInt(base.getGuardMode())));
                    }
                }
                if (err == 0) {
                    json = "{\"success\":true,\"data\":[" + json;
                    this.setSystemVariableString("eufyCurrentState", this.convertGuardModeToString(guardMode));
                    this.setLastConnectionInfo(true);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                }
                else {
                    json = "{\"success\":false,\"data\":[" + json;
                    this.setSystemVariableString("eufyCurrentState", "unbekannt");
                    this.setLastConnectionInfo(false);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                }
                json += "]}";
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
                this.setLastConnectionInfo(false);
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
            if (this.bases) {
                yield this.bases.setGuardModeBase(baseSerial, guardMode);
                yield push_1.sleep(2500);
                yield this.bases.loadBases();
                var bases = this.bases.getBases();
                var base;
                base = bases[baseSerial];
                var json = "";
                if (guardMode.toString() == base.getGuardMode()) {
                    json = "{\"success\":true,\"data\":[";
                    json += "{";
                    json += "\"base_id\":\"" + base.getSerialNumber() + "\",";
                    json += "\"result\":\"success\",";
                    json += "\"guard_mode\":\"" + base.getGuardMode() + "\"";
                    json += "}";
                    this.setSystemVariableString("eufyCentralState" + base.getSerialNumber(), this.convertGuardModeToString(Number.parseInt(base.getGuardMode())));
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = "{\"success\":false,\"data\":[";
                    json += "{";
                    json += "\"base_id\":\"" + base.getSerialNumber() + "\",";
                    json += "\"result\":\"failure\",";
                    json += "\"guard_mode\":\"" + base.getGuardMode() + "\"";
                    json += "}";
                    this.setSystemVariableString("eufyCentralState" + base.getSerialNumber(), this.convertGuardModeToString(Number.parseInt(base.getGuardMode())));
                    this.setLastConnectionInfo(false);
                    this.setSystemVariableTime("eufyLastStatusUpdateTime", new Date());
                }
                json += "]}";
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
            }
            return json;
        });
    }
    /**
     * Update the library (at this time only image and the corrospondending datetime) from the devices.
     */
    getLibrary() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.devices) {
                yield this.devices.loadDevices();
                var devices = this.devices.getDevices();
                var dev;
                var json = "";
                if (devices) {
                    for (var key in devices) {
                        dev = devices[key];
                        if (dev.getDeviceTypeString() == "camera") {
                            if (json.endsWith("}")) {
                                json += ",";
                            }
                            json += "{";
                            json += "\"device_id\":\"" + dev.getSerialNumber() + "\",";
                            json += "\"last_camera_image_time\":\"" + dev.getLastImageTime() + "\",";
                            json += "\"last_camera_image_url\":\"" + dev.getLastImageUrl() + "\"";
                            json += "}";
                            if (dev.getLastImageTime() == undefined) {
                                this.setSystemVariableString("eufyCameraVideoTime" + dev.getSerialNumber(), "");
                            }
                            else {
                                this.setSystemVariableString("eufyCameraVideoTime" + dev.getSerialNumber(), this.makeDateTimeString(dev.getLastImageTime() * 1000));
                            }
                            this.setSystemVariableString("eufyCameraImageURL" + dev.getSerialNumber(), dev.getLastImageUrl());
                        }
                    }
                    json = "{\"success\":true,\"data\":[" + json + "]}";
                    this.setSystemVariableTime("eufyLastLinkUpdateTime", new Date());
                    this.setLastConnectionInfo(true);
                }
                else {
                    json = "{\"success\":false,\"reason\":\"No devices found.\"}";
                    this.setLastConnectionInfo(false);
                }
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
            }
            return json;
        });
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
        this.config.setToken(token);
        this.config.setTokenExpire(tokenExpire);
        this.config.writeConfig();
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
     * Get all config data needed for the webui.
     */
    getConfig() {
        var json = "{\"success\":true,\"data\":[";
        json += "{";
        json += "\"username\":\"" + this.config.getEmailAddress() + "\",";
        json += "\"password\":\"" + this.config.getPassword() + "\",";
        json += "\"api_http_active\":\"" + this.config.getApiUseHttp() + "\",";
        json += "\"api_http_port\":\"" + this.config.getApiPortHttp() + "\",";
        json += "\"api_https_active\":\"" + this.config.getApiUseHttps() + "\",";
        json += "\"api_https_port\":\"" + this.config.getApiPortHttps() + "\",";
        json += "\"api_https_key_file\":\"" + this.config.getApiKeyFileHttps() + "\",";
        json += "\"api_https_cert_file\":\"" + this.config.getApiCertFileHttps() + "\"";
        json += "}";
        json += "]}";
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
     */
    setConfig(username, password, api_use_http, api_port_http, api_use_https, api_port_https, api_key_https, api_cert_https) {
        this.config.setEmailAddress(username);
        this.config.setPassword(password);
        this.config.setApiUseHttp(api_use_http);
        this.config.setApiPortHttp(api_port_http);
        this.config.setApiUseHttps(api_use_https);
        this.config.setApiPortHttps(api_port_https);
        this.config.setApiKeyFileHttps(api_key_https);
        this.config.setApiCertFileHttps(api_cert_https);
        var res = this.config.writeConfig();
        if (res == true) {
            return "{\"success\":true,\"message\":\"Config saved.\"}";
        }
        else {
            return "{\"success\":true,\"message\":\"No change in config. Write config not neccesary.\"}";
        }
    }
    /**
     * Write config to file.
     */
    writeConfig() {
        var res = this.config.writeConfig();
        if (res == true) {
            return "{\"success\":true,\"message\":\"Config saved.\"}";
        }
        else {
            return "{\"success\":true,\"message\":\"No new values in config. Write config not neccesary.\"}";
        }
    }
    /**
     * Check if all system variables are created on the CCU
     */
    checkSystemVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.bases && this.devices) {
                yield this.loadData();
                var base;
                var device;
                var bases = this.bases.getBases();
                var devices = this.devices.getDevices();
                var commonSystemVariablesName = ["eufyCurrentState", "eufyLastConnectionResult", "eufyLastConnectionTime", "eufyLastLinkUpdateTime", "eufyLastStatusUpdateTime"];
                var commonSystemVariablesInfo = ["aktueller Modus des eufy Systems", "Ergebnis der letzten Kommunikation mit eufy", "Zeitpunkt der letzten Kommunikation mit eufy", "letzte Aktualisierung der eufy Links", "letzte Aktualisierung des eufy Systemstatus"];
                var json = "";
                var i = 0;
                for (var sv of commonSystemVariablesName) {
                    json += "{";
                    json += "\"sysVar_name\":\"" + sv + "\",";
                    json += "\"sysVar_info\":\"" + commonSystemVariablesInfo[i] + "\",";
                    if ((yield this.homematicApi.isSystemVariableAvailable(sv)) == true) {
                        json += "\"sysVar_available\":true";
                    }
                    else {
                        json += "\"sysVar_available\":false";
                    }
                    json += "},";
                    i = i + 1;
                }
                for (var key in bases) {
                    if (json.endsWith("}")) {
                        json += ",";
                    }
                    base = bases[key];
                    json += "{";
                    json += "\"sysVar_name\":\"eufyCentralState" + base.getSerialNumber() + "\",";
                    json += "\"sysVar_info\":\"aktueller Status der Basis " + base.getSerialNumber() + "\",";
                    if ((yield this.homematicApi.isSystemVariableAvailable("eufyCentralState" + base.getSerialNumber())) == true) {
                        json += "\"sysVar_available\":true";
                    }
                    else {
                        json += "\"sysVar_available\":false";
                    }
                    json += "}";
                }
                for (var key in devices) {
                    if (json.endsWith("}")) {
                        json += ",";
                    }
                    device = devices[key];
                    json += "{";
                    json += "\"sysVar_name\":\"eufyCameraImageURL" + device.getSerialNumber() + "\",";
                    json += "\"sysVar_info\":\"Standbild der Kamera " + device.getSerialNumber() + "\",";
                    if ((yield this.homematicApi.isSystemVariableAvailable("eufyCameraImageURL" + device.getSerialNumber())) == true) {
                        json += "\"sysVar_available\":true";
                    }
                    else {
                        json += "\"sysVar_available\":false";
                    }
                    json += "}";
                    if (json.endsWith("}")) {
                        json += ",";
                    }
                    device = devices[key];
                    json += "{";
                    json += "\"sysVar_name\":\"eufyCameraVideoTime" + device.getSerialNumber() + "\",";
                    json += "\"sysVar_info\":\"Zeitpunkt des letzten Videos der Kamera " + device.getSerialNumber() + "\",";
                    if ((yield this.homematicApi.isSystemVariableAvailable("eufyCameraVideoTime" + device.getSerialNumber())) == true) {
                        json += "\"sysVar_available\":true";
                    }
                    else {
                        json += "\"sysVar_available\":false";
                    }
                    json += "}";
                }
                json = "{\"success\":true,\"data\":[" + json + "]}";
            }
            else {
                json = "{\"success\":false,\"reason\":\"No connection to eufy.\"}";
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
                return "{\"success\":true,\"message\":\"System variable created.\"}";
            }
            else {
                return "{\"success\":true,\"message\":\"Error while creating system variable.\"}";
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
        this.homematicApi.setSystemVariable(systemVariable, newValue);
    }
    /**
     * Converts the given timestamp to the german dd.mm.yyyy hh:mm string.
     * @param timestamp The timestamp as number.
     */
    makeDateTimeString(timestamp) {
        var dateTime = new Date(timestamp);
        return (dateTime.getDate().toString().padStart(2, '0') + "." + (dateTime.getMonth() + 1).toString().padStart(2, '0') + "." + dateTime.getFullYear().toString() + " " + dateTime.getHours().toString().padStart(2, '0') + ":" + dateTime.getMinutes().toString().padStart(2, '0'));
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
            case http_response_models_1.GuardMode.AWAY:
                res = "aktiviert";
                break;
            case http_response_models_1.GuardMode.CUSTOM1 || http_response_models_1.GuardMode.CUSTOM2 || http_response_models_1.GuardMode.CUSTOM3:
                res = "personalisiert";
                break;
            case http_response_models_1.GuardMode.DISARMED:
                res = "deaktiviert";
                break;
            case http_response_models_1.GuardMode.GEO:
                res = "geofencing";
                break;
            case http_response_models_1.GuardMode.HOME:
                res = "zu Hause";
                break;
            case http_response_models_1.GuardMode.OFF:
                res = "ausgeschaltet";
                break;
            case http_response_models_1.GuardMode.SCHEDULE:
                res = "Zeitplan";
                break;
            default:
                res = "unbekannt";
        }
        return res;
    }
    /**
     * Add a given message to the logfile.
     * @param message The message to add to the logfile.
     */
    addToLog(message) {
        this.logger.log(message);
    }
    /**
     * Add a given message to the errorfile.
     * @param message The message to add to the errorfile.
     */
    addToErr(message) {
        this.logger.err(message);
    }
    /**
     * Return the version of this API.
     */
    getApiVersion() {
        return "{\"success\":true,\"api_version\":\"0.9.1\",\"homematic_api_version\":\"" + this.homematicApi.getHomematicApiInfo() + "\"}";
    }
}
exports.EufySecurityApi = EufySecurityApi;
