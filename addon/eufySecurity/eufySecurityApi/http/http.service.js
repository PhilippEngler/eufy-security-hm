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
exports.HttpService = void 0;
const http_utils_1 = require("./http.utils");
class HttpService {
    constructor(username, password, api) {
        this.username = username;
        this.password = password;
        this.api = api;
        //private baseUrl = 'https://mysecurity.eufylife.com/api/v1';
        this.baseUrl = 'https://security-app-eu.eufylife.com/v1';
        this.currentLoginResult = null;
        this.headers = {
            app_version: 'v2.0.1_676',
            os_type: 'android',
            os_version: '25',
            phone_model: 'SM-G930L',
            country: 'DE',
            language: 'de',
            openudid: '',
            uid: '',
            net_type: 'wifi',
            mnc: '01',
            mcc: '001',
            sn: '',
            model_type: 'PHONE',
            'user-agent': 'okhttp/3.12.1',
        };
    }
    listHubs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.requestWithToken(`/app/get_hub_list`);
        });
    }
    listDevices(deviceRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = Object.assign({ device_sn: '', num: 100, orderby: '', page: 0, station_sn: '' }, deviceRequest);
            return yield this.requestWithToken(`/app/get_devs_list`, reqBody);
        });
    }
    stationDskKeys(station_sns) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = { station_sns: [station_sns] };
            return yield this.requestWithToken(`/app/equipment/get_dsk_keys`, reqBody);
        });
    }
    allHistoryRecord(historyRecord) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = Object.assign({ device_sn: '', end_time: 0, id: 0, num: 100, offset: -14400, pullup: true, shared: true, start_time: 0, storage: 0 }, historyRecord);
            return yield this.requestWithToken(`/event/app/get_all_history_record`, reqBody);
        });
    }
    startStream(startStreamRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = Object.assign({ proto: 2 }, startStreamRequest);
            return yield this.requestWithToken(`/web/equipment/start_stream`, reqBody);
        });
    }
    stopStream(stopStreamRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = Object.assign({ proto: 2 }, stopStreamRequest);
            return yield this.requestWithToken(`/web/equipment/stop_stream`, reqBody);
        });
    }
    pushTokenCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = {
                app_type: 'eufySecurity',
                transaction: '',
            };
            return yield this.requestWithToken(`/app/review/app_push_check`, reqBody, this.headers);
        });
    }
    registerPushToken(pushToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = {
                is_notification_enable: true,
                token: pushToken,
                transaction: '',
            };
            return yield this.requestWithToken(`/apppush/register_push_token`, reqBody, this.headers);
        });
    }
    requestWithToken(path, body, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken();
            return yield http_utils_1.postRequest(`${this.baseUrl}${path}`, body, token, headers);
        });
    }
    getToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.api.getToken() || this.isTokenOutdated()) {
                this.api.addToLog("TOKEN INVALID");
                this.currentLoginResult = yield this.login(this.username, this.password);
                //this.api.addToLog("writeNewTokenToConfig " + this.currentLoginResult.auth_token);
                this.api.setTokenData(this.currentLoginResult.auth_token, this.currentLoginResult.token_expires_at.toString());
                this.api.writeConfig();
            }
            //return this.currentLoginResult.auth_token;
            return this.api.getToken();
        });
    }
    isTokenOutdated() {
        // Removed because we save the token, so we need only a new login if the token expired.
        /*if (!this.currentLoginResult) {
          return true;
        }*/
        const now = Math.floor(+new Date() / 1000);
        return parseInt(this.api.getTokenExpire()) <= now;
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield http_utils_1.postRequest(`${this.baseUrl}/passport/login`, { email, password });
            if (!!result.domain) {
                const baseUrlFromResult = `https://${result.domain}/v1`;
                if (baseUrlFromResult !== this.baseUrl) {
                    // Only recall login if we're not already on the returned domain
                    this.baseUrl = baseUrlFromResult;
                    return this.login(email, password);
                }
            }
            return result;
        });
    }
}
exports.HttpService = HttpService;
