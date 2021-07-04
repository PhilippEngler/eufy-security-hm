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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPApi = void 0;
const axios_1 = __importDefault(require("axios"));
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const i18n_iso_countries_1 = require("i18n-iso-countries");
const i18n_iso_languages_1 = require("@cospired/i18n-iso-languages");
const types_1 = require("./types");
const parameter_1 = require("./parameter");
const utils_1 = require("./utils");
const error_1 = require("./../error");
class HTTPApi extends tiny_typed_emitter_1.TypedEmitter {
    constructor(api, username, password, log) {
        super();
        //private apiBase = "https://mysecurity.eufylife.com/api/v1";
        this.apiBase = "https://security-app-eu.eufylife.com/v1";
        this.username = null;
        this.password = null;
        this.token = null;
        this.tokenExpiration = null;
        this.trustedTokenExpiration = new Date(2100, 12, 31, 23, 59, 59, 0);
        this.connected = false;
        this.devices = {};
        this.hubs = {};
        this.headers = {
            app_version: "v2.8.0_887",
            os_type: "android",
            os_version: "30",
            phone_model: "ONEPLUS A3003",
            country: "DE",
            language: "en",
            openudid: "5e4621b0152c0d00",
            uid: "",
            net_type: "wifi",
            mnc: "02",
            mcc: "262",
            sn: "75814221ee75",
            Model_type: "PHONE",
            timezone: "GMT+01:00"
        };
        this.api = api;
        this.username = username;
        this.password = password;
        this.log = log;
        this.headers.timezone = utils_1.getTimezoneGMTString();
    }
    invalidateToken() {
        this.token = null;
        this.tokenExpiration = null;
        axios_1.default.defaults.headers.common["X-Auth-Token"] = null;
    }
    setPhoneModel(model) {
        this.headers.phone_model = model.toUpperCase();
    }
    getPhoneModel() {
        return this.headers.phone_model;
    }
    setCountry(country) {
        if (i18n_iso_countries_1.isValid(country) && country.length === 2)
            this.headers.country = country;
        else
            throw new error_1.InvalidCountryCodeError("Invalid ISO 3166-1 Alpha-2 country code");
    }
    getCountry() {
        return this.headers.country;
    }
    setLanguage(language) {
        if (i18n_iso_languages_1.isValid(language) && language.length === 2)
            this.headers.language = language;
        else
            throw new error_1.InvalidLanguageCodeError("Invalid ISO 639 language code");
    }
    getLanguage() {
        return this.headers.language;
    }
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            //Authenticate and get an access token
            this.log.debug("Authenticate and get an access token", { token: this.token, tokenExpiration: this.tokenExpiration });
            if (!this.token || this.tokenExpiration && (new Date()).getTime() >= this.tokenExpiration.getTime()) {
                try {
                    const response = yield this.request("post", "passport/login", {
                        email: this.username,
                        password: this.password
                    }, this.headers).catch(error => {
                        this.log.error("Error:", error);
                        return error;
                    });
                    this.log.debug("Response:", response.data);
                    if (response.status == 200) {
                        const result = response.data;
                        if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                            const dataresult = result.data;
                            this.token = dataresult.auth_token;
                            this.tokenExpiration = new Date(dataresult.token_expires_at * 1000);
                            axios_1.default.defaults.headers.common["X-Auth-Token"] = this.token;
                            if (dataresult.domain) {
                                if ("https://" + dataresult.domain + "/v1" != this.apiBase) {
                                    this.apiBase = "https://" + dataresult.domain + "/v1";
                                    axios_1.default.defaults.baseURL = this.apiBase;
                                    this.log.info(`Switching to another API_BASE (${this.apiBase}) and get new token.`);
                                    this.token = null;
                                    this.tokenExpiration = null;
                                    axios_1.default.defaults.headers.common["X-Auth-Token"] = null;
                                    return types_1.AuthResult.RENEW;
                                }
                            }
                            this.log.debug("Token data", { token: this.token, tokenExpiration: this.tokenExpiration });
                            this.api.setTokenData(this.token, this.tokenExpiration.getTime().toString());
                            this.emit("connect");
                            this.connected = true;
                            return types_1.AuthResult.OK;
                        }
                        else if (result.code == types_1.ResponseErrorCode.CODE_NEED_VERIFY_CODE) {
                            this.log.debug(`${this.constructor.name}.authenticate(): Send verification code...`);
                            const dataresult = result.data;
                            this.token = dataresult.auth_token;
                            this.tokenExpiration = new Date(dataresult.token_expires_at * 1000);
                            axios_1.default.defaults.headers.common["X-Auth-Token"] = this.token;
                            this.log.debug("Token data", { token: this.token, tokenExpiration: this.tokenExpiration });
                            this.api.setTokenData(this.token, this.tokenExpiration.getTime().toString());
                            yield this.sendVerifyCode(types_1.VerfyCodeTypes.TYPE_EMAIL);
                            return types_1.AuthResult.SEND_VERIFY_CODE;
                        }
                        else {
                            this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                        }
                    }
                    else {
                        this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                    }
                }
                catch (error) {
                    this.log.error("Generic Error:", error);
                }
                return types_1.AuthResult.ERROR;
            }
            this.emit("connect");
            this.connected = true;
            return types_1.AuthResult.OK;
        });
    }
    sendVerifyCode(type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!type)
                    type = types_1.VerfyCodeTypes.TYPE_EMAIL;
                const response = yield this.request("post", "sms/send/verify_code", {
                    message_type: type
                }, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                        this.log.info(`Requested verification code for 2FA`);
                        return true;
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return false;
        });
    }
    listTrustDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.request("get", "app/trust_device/list", undefined, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                        if (result.data && result.data.list) {
                            return result.data.list;
                        }
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return [];
        });
    }
    addTrustDevice(verifyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.request("post", "passport/login", {
                    verify_code: `${verifyCode}`,
                    transaction: `${new Date().getTime()}`
                }, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response login:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                        const response2 = yield this.request("post", "app/trust_device/add", {
                            verify_code: `${verifyCode}`,
                            transaction: `${new Date().getTime()}`
                        }, this.headers).catch(error => {
                            this.log.error("Error:", error);
                            return error;
                        });
                        this.log.debug("Response trust device:", response.data);
                        if (response2.status == 200) {
                            const result = response2.data;
                            if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                                this.log.info(`2FA authentication successfully done. Device trusted.`);
                                const trusted_devices = yield this.listTrustDevice();
                                trusted_devices.forEach((trusted_device) => {
                                    if (trusted_device.is_current_device === 1) {
                                        this.tokenExpiration = this.trustedTokenExpiration;
                                        this.log.debug("This device is trusted. Token expiration extended:", { tokenExpiration: this.tokenExpiration });
                                    }
                                });
                                this.emit("connect");
                                this.connected = true;
                                return true;
                            }
                            else {
                                this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                            }
                        }
                        else if (response2.status == 401) {
                            this.invalidateToken();
                            this.log.error("Status return code 401, invalidate token", { status: response.status, statusText: response.statusText });
                        }
                        else {
                            this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                        }
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return false;
        });
    }
    updateDeviceInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            //Get the latest device info
            //Get Stations
            try {
                const response = yield this.request("post", "app/get_hub_list").catch(error => {
                    this.log.error("Stations - Error:", error);
                    return error;
                });
                this.log.debug("Stations - Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        if (dataresult) {
                            dataresult.forEach(element => {
                                this.log.debug(`${this.constructor.name}.updateDeviceInfo(): stations - element: ${JSON.stringify(element)}`);
                                this.log.debug(`${this.constructor.name}.updateDeviceInfo(): stations - device_type: ${element.device_type}`);
                                this.hubs[element.station_sn] = element;
                            });
                        }
                        else {
                            this.log.info("No stations found.");
                        }
                        if (Object.keys(this.hubs).length > 0)
                            this.emit("hubs", this.hubs);
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Stations - Generic Error:", error);
            }
            //Get Devices
            try {
                const response = yield this.request("post", "app/get_devs_list").catch(error => {
                    this.log.error("Devices - Error:", error);
                    return error;
                });
                this.log.debug("Devices - Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        if (dataresult) {
                            dataresult.forEach(element => {
                                this.devices[element.device_sn] = element;
                            });
                        }
                        else {
                            this.log.info("No devices found.");
                        }
                        if (Object.keys(this.devices).length > 0)
                            this.emit("devices", this.devices);
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Devices - Generic Error:", error);
            }
        });
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    request(method, endpoint, data, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token && endpoint != "passport/login") {
                //No token get one
                switch (yield this.authenticate()) {
                    case types_1.AuthResult.RENEW:
                        this.log.debug("Renew token", { method: method, endpoint: endpoint });
                        yield this.authenticate();
                        break;
                    case types_1.AuthResult.ERROR:
                        this.log.error("Token error", { method: method, endpoint: endpoint });
                        break;
                    default: break;
                }
            }
            if (this.tokenExpiration && (new Date()).getTime() >= this.tokenExpiration.getTime()) {
                this.log.info("Access token expired; fetching a new one");
                this.invalidateToken();
                if (endpoint != "passport/login")
                    //get new token
                    yield this.authenticate();
            }
            this.log.debug("Request:", { method: method, endpoint: endpoint, baseUrl: this.apiBase, token: this.token, data: data, headers: this.headers });
            const response = yield axios_1.default({
                method: method,
                url: endpoint,
                data: data,
                headers: headers,
                baseURL: this.apiBase,
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500
                }
            });
            if (response.status == 401) {
                this.invalidateToken();
                this.log.error("Status return code 401, invalidate token", { status: response.status, statusText: response.statusText });
                this.emit("close");
                this.connected = false;
            }
            return response;
        });
    }
    checkPushToken() {
        return __awaiter(this, void 0, void 0, function* () {
            //Check push notification token
            try {
                const response = yield this.request("post", "/app/review/app_push_check", {
                    app_type: "eufySecurity",
                    transaction: `${new Date().getTime()}`
                }, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        this.log.debug(`Push token OK`);
                        return true;
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else if (response.status == 401) {
                    this.invalidateToken();
                    this.log.error("Status return code 401, invalidate token", { status: response.status, statusText: response.statusText });
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return false;
        });
    }
    registerPushToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            //Register push notification token
            try {
                const response = yield this.request("post", "/apppush/register_push_token", {
                    is_notification_enable: true,
                    token: token,
                    transaction: `${new Date().getTime().toString()}`
                }, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        this.log.debug(`Push token registered successfully`);
                        return true;
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else if (response.status == 401) {
                    this.invalidateToken();
                    this.log.error("Status return code 401, invalidate token", { status: response.status, statusText: response.statusText });
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return false;
        });
    }
    setParameters(stationSN, deviceSN, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const tmp_params = [];
            params.forEach(param => {
                tmp_params.push({ param_type: param.paramType, param_value: parameter_1.ParameterHelper.writeValue(param.paramType, param.paramValue) });
            });
            try {
                const response = yield this.request("post", "app/upload_devs_params", {
                    device_sn: deviceSN,
                    station_sn: stationSN,
                    params: tmp_params
                }).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", { stationSN: stationSN, deviceSN: deviceSN, params: tmp_params, response: response.data });
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        this.log.debug("New parameters set", { params: tmp_params, response: dataresult });
                        return true;
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return false;
        });
    }
    getCiphers(cipherIDs, userID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.request("post", "app/cipher/get_ciphers", {
                    cipher_ids: cipherIDs,
                    user_id: userID,
                    transaction: `${new Date().getTime().toString()}`
                }, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                        if (result.data) {
                            const ciphers = {};
                            result.data.forEach((cipher) => {
                                ciphers[cipher.cipher_id] = cipher;
                            });
                            return ciphers;
                        }
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return {};
        });
    }
    getVoices(deviceSN) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.request("get", `voice/response/lists/${deviceSN}`, null, this.headers).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == types_1.ResponseErrorCode.CODE_WHATEVER_ERROR) {
                        if (result.data) {
                            const voices = {};
                            result.data.forEach((voice) => {
                                voices[voice.voice_id] = voice;
                            });
                            return voices;
                        }
                    }
                    else {
                        this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error("Generic Error:", error);
            }
            return {};
        });
    }
    getCipher(cipherID, userID) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getCiphers([cipherID], userID))[cipherID];
        });
    }
    getLog() {
        return this.log;
    }
    getDevices() {
        return this.devices;
    }
    getHubs() {
        return this.hubs;
    }
    getToken() {
        return this.token;
    }
    getTokenExpiration() {
        return this.tokenExpiration;
    }
    getTrustedTokenExpiration() {
        return this.trustedTokenExpiration;
    }
    setToken(token) {
        this.token = token;
        axios_1.default.defaults.headers.common["X-Auth-Token"] = token;
    }
    setTokenExpiration(tokenExpiration) {
        this.tokenExpiration = tokenExpiration;
    }
    getAPIBase() {
        return this.apiBase;
    }
    setAPIBase(apiBase) {
        this.apiBase = apiBase;
    }
    setOpenUDID(openudid) {
        this.headers.openudid = openudid;
    }
    setSerialNumber(serialnumber) {
        this.headers.sn = serialnumber;
    }
    _getEvents(functionName, endpoint, startTime, endTime, filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = [];
            try {
                if (filter === undefined)
                    filter = { deviceSN: "", stationSN: "", storageType: types_1.StorageType.NONE };
                if (maxResults === undefined)
                    maxResults = 1000;
                const response = yield this.request("post", endpoint, {
                    device_sn: filter.deviceSN !== undefined ? filter.deviceSN : "",
                    end_time: Math.trunc(endTime.getTime() / 1000),
                    id: 0,
                    id_type: 1,
                    is_favorite: false,
                    num: maxResults,
                    pullup: true,
                    shared: true,
                    start_time: Math.trunc(startTime.getTime() / 1000),
                    station_sn: filter.stationSN !== undefined ? filter.stationSN : "",
                    storage: filter.storageType !== undefined ? filter.storageType : types_1.StorageType.NONE,
                    transaction: `${new Date().getTime().toString()}`
                }, this.headers).catch(error => {
                    this.log.error(`${functionName} - Error:`, error);
                    return error;
                });
                this.log.debug(`${functionName} - Response:`, response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        if (dataresult) {
                            dataresult.forEach(record => {
                                this.log.debug(`${functionName} - Record:`, record);
                                records.push(record);
                            });
                        }
                    }
                    else {
                        this.log.error(`${functionName} - Response code not ok`, { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error(`${functionName} - Status return code not 200`, { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error(`${functionName} - Generic Error:`, error);
            }
            return records;
        });
    }
    getVideoEvents(startTime, endTime, filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._getEvents("getVideoEvents", "event/app/get_all_video_record", startTime, endTime, filter, maxResults);
        });
    }
    getAlarmEvents(startTime, endTime, filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._getEvents("getAlarmEvents", "event/app/get_all_alarm_record", startTime, endTime, filter, maxResults);
        });
    }
    getHistoryEvents(startTime, endTime, filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._getEvents("getHistoryEvents", "event/app/get_all_history_record", startTime, endTime, filter, maxResults);
        });
    }
    getAllVideoEvents(filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const fifthyYearsInMilliseconds = 15 * 365 * 24 * 60 * 60 * 1000;
            return this.getVideoEvents(new Date(new Date().getTime() - fifthyYearsInMilliseconds), new Date(), filter, maxResults);
        });
    }
    getAllAlarmEvents(filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const fifthyYearsInMilliseconds = 15 * 365 * 24 * 60 * 60 * 1000;
            return this.getAlarmEvents(new Date(new Date().getTime() - fifthyYearsInMilliseconds), new Date(), filter, maxResults);
        });
    }
    getAllHistoryEvents(filter, maxResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const fifthyYearsInMilliseconds = 15 * 365 * 24 * 60 * 60 * 1000;
            return this.getHistoryEvents(new Date(new Date().getTime() - fifthyYearsInMilliseconds), new Date(), filter, maxResults);
        });
    }
    isConnected() {
        return this.connected;
    }
}
exports.HTTPApi = HTTPApi;
