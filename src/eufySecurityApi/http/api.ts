import axios, { AxiosResponse, Method } from "axios";
import { TypedEmitter } from "tiny-typed-emitter";
import { isValid as isValidCountry } from "i18n-iso-countries";
import { isValid as isValidLanguage } from "@cospired/i18n-iso-languages";

import { ResultResponse, FullDeviceResponse, HubResponse, LoginResultResponse, TrustDevice, Cipher, Voice, EventRecordResponse } from "./models"
import { HTTPApiEvents, Ciphers, FullDevices, Hubs, Voices } from "./interfaces";
import { AuthResult, EventFilterType, ResponseErrorCode, StorageType, VerfyCodeTypes } from "./types";
import { ParameterHelper } from "./parameter";
import { getTimezoneGMTString } from "./utils";
import { Logger } from "../utils/logging";
import { EufySecurityApi } from "../eufySecurityApi";

export class HTTPApi extends TypedEmitter<HTTPApiEvents> {

    //private api_base = "https://mysecurity.eufylife.com/api/v1";
    private api_base = "https://security-app-eu.eufylife.com/v1";

    private api : EufySecurityApi;
    private username: string|null = null;
    private password: string|null = null;

    private token: string|null = null;
    private token_expiration: Date|null = null;
    private trusted_token_expiration = new Date(2100, 12, 31, 23, 59, 59, 0);

    private log: Logger;

    private devices: FullDevices = {};
    private hubs: Hubs = {};

    private headers = {
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

    constructor(api : EufySecurityApi, username: string, password: string, log: Logger) {
        super();

        this.api = api;
        this.username = username;
        this.password = password;
        this.log = log;

        this.headers.timezone = getTimezoneGMTString();
    }

    private invalidateToken(): void {
        this.token = null;
        this.token_expiration = null;
        axios.defaults.headers.common["X-Auth-Token"] = null;
    }

    public setPhoneModel(model: string): void {
        this.headers.phone_model = model.toUpperCase();
    }

    public getPhoneModel(): string {
        return this.headers.phone_model;
    }

    public setCountry(country: string): void {
        if (isValidCountry(country) && country.length === 2)
            this.headers.country = country;
        else
            throw new Error("Invalid ISO 3166-1 Alpha-2 country code");
    }

    public getCountry(): string {
        return this.headers.country;
    }

    public setLanguage(language: string): void {
        if (isValidLanguage(language) && language.length === 2)
            this.headers.language = language;
        else
            throw new Error("Invalid ISO 639 language code");
    }

    public getLanguage(): string {
        return this.headers.language;
    }

    public async authenticate(): Promise<AuthResult> {
        //Authenticate and get an access token
        this.log.debug(`${this.constructor.name}.authenticate(): token: ${this.token} token_expiration: ${this.token_expiration}`);
        if (!this.token || this.token_expiration && (new Date()).getTime() >= this.token_expiration.getTime()) {
            try {
                const response = await this.request("post", "passport/login", {
                    email: this.username,
                    password: this.password
                }, this.headers).catch(error => {
                    this.log.error(`${this.constructor.name}.authenticate(): error: ${JSON.stringify(error)}`);
                    return error;
                });
                this.log.debug(`${this.constructor.name}.authenticate(): Response:  ${JSON.stringify(response.data)}`);

                if (response.status == 200) {
                    const result: ResultResponse = response.data;
                    if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                        const dataresult: LoginResultResponse = result.data;

                        this.token = dataresult.auth_token
                        this.token_expiration = new Date(dataresult.token_expires_at * 1000);
                        axios.defaults.headers.common["X-Auth-Token"] = this.token;

                        if (dataresult.domain) {
                            if ("https://" + dataresult.domain + "/v1" != this.api_base) {
                                this.api_base = "https://" + dataresult.domain + "/v1";
                                axios.defaults.baseURL = this.api_base;
                                this.log.info(`Switching to another API_BASE (${this.api_base}) and get new token.`);
                                this.token = null;
                                this.token_expiration = null;
                                axios.defaults.headers.common["X-Auth-Token"] = null;
                                return AuthResult.RENEW;
                            }
                        }

                        this.log.debug(`${this.constructor.name}.authenticate(): token: ${this.token}`);
                        this.log.debug(`${this.constructor.name}.authenticate(): token_expiration: ${this.token_expiration}`);

                        this.api.setTokenData(this.token, this.token_expiration.getMilliseconds.toString());

                        this.emit("connect");
                        return AuthResult.OK;
                    } else if (result.code == ResponseErrorCode.CODE_NEED_VERIFY_CODE) {
                        this.log.debug(`${this.constructor.name}.authenticate(): Send verification code...`);
                        const dataresult: LoginResultResponse = result.data;

                        this.token = dataresult.auth_token
                        this.token_expiration = new Date(dataresult.token_expires_at * 1000);
                        axios.defaults.headers.common["X-Auth-Token"] = this.token;

                        this.log.debug(`${this.constructor.name}.authenticate(): token: ${this.token}`);
                        this.log.debug(`${this.constructor.name}.authenticate(): token_expiration: ${this.token_expiration}`);

                        this.api.setTokenData(this.token, this.token_expiration.getMilliseconds.toString());

                        await this.sendVerifyCode(VerfyCodeTypes.TYPE_EMAIL);

                        return AuthResult.SEND_VERIFY_CODE;
                    } else {
                        this.log.error(`${this.constructor.name}.authenticate(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                    }
                } else {
                    this.log.error(`${this.constructor.name}.authenticate(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
                }
            } catch (error) {
                this.log.error(`${this.constructor.name}.authenticate(): error: ${error}`);
            }
            return AuthResult.ERROR;
        }
        this.emit("connect");
        return AuthResult.OK;
    }

    public async sendVerifyCode(type?: VerfyCodeTypes): Promise<boolean> {
        try {
            if (!type)
                type = VerfyCodeTypes.TYPE_EMAIL;

            const response = await this.request("post", "sms/send/verify_code", {
                message_type: type
            }, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.sendVerifyCode(): error: ${JSON.stringify(error)}`);
                return error;
            });
            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                    this.log.info(`Requested verification code for 2FA`);
                    return true;
                } else {
                    this.log.error(`${this.constructor.name}.sendVerifyCode(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
            } else {
                this.log.error(`${this.constructor.name}.sendVerifyCode(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.sendVerifyCode(): error: ${error}`);
        }
        return false;
    }

    public async listTrustDevice(): Promise<Array<TrustDevice>> {
        try {
            const response = await this.request("get", "app/trust_device/list", undefined, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.listTrustDevice(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.listTrustDevice(): Response:  ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                    if (result.data && result.data.list) {
                        return result.data.list;
                    }
                } else {
                    this.log.error(`${this.constructor.name}.listTrustDevice(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
            } else {
                this.log.error(`${this.constructor.name}.listTrustDevice(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.listTrustDevice(): error: ${error}`);
        }
        return [];
    }

    public async addTrustDevice(verify_code: number): Promise<boolean> {
        try {
            const response = await this.request("post", "passport/login", {
                verify_code: `${verify_code}`,
                transaction: `${new Date().getTime()}`
            }, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.listTrustDevice(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.addTrustDevice(): Response:  ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                    const response2 = await this.request("post", "app/trust_device/add", {
                        verify_code: `${verify_code}`,
                        transaction: `${new Date().getTime()}`
                    }, this.headers);
                    this.log.debug(`${this.constructor.name}.addTrustDevice(): Response2:  ${JSON.stringify(response.data)}`);

                    if (response2.status == 200) {
                        const result: ResultResponse = response2.data;
                        if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                            this.log.info(`2FA authentication successfully done. Device trusted.`);
                            const trusted_devices = await this.listTrustDevice();
                            trusted_devices.forEach((trusted_device: TrustDevice) => {
                                if (trusted_device.is_current_device === 1) {
                                    this.token_expiration = this.trusted_token_expiration;
                                    this.log.debug(`${this.constructor.name}.addTrustDevice(): This device is trusted. Token expiration extended to: ${this.token_expiration})`);
                                }
                            });
                            return true;
                        } else {
                            this.log.error(`${this.constructor.name}.addTrustDevice(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                        }
                    } else if (response2.status == 401) {
                        this.invalidateToken();
                        this.log.error(`${this.constructor.name}.addTrustDevice(): Status return code 401, invalidate token (status: ${response.status} text: ${response.statusText}`);
                    } else {
                        this.log.error(`${this.constructor.name}.addTrustDevice(): Status return code not 200 (status: ${response2.status} text: ${response2.statusText}`);
                    }
                } else {
                    this.log.error(`${this.constructor.name}.addTrustDevice(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
            } else {
                this.log.error(`${this.constructor.name}.addTrustDevice(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.addTrustDevice(): error: ${error}`);
        }
        return false;
    }

    public async updateDeviceInfo(): Promise<void> {
        //Get the latest device info

        //Get Stations
        try {
            const response = await this.request("post", "app/get_hub_list").catch(error => {
                this.log.error(`${this.constructor.name}.updateDeviceInfo(): stations - error: ${JSON.stringify(error)}`);
                return error;
            });
            //this.log.debug(`${this.constructor.name}.updateDeviceInfo(): stations - Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult: Array<HubResponse> = result.data;
                    if (dataresult) {
                        dataresult.forEach(element => {
                            //this.log.debug(`${this.constructor.name}.updateDeviceInfo(): stations - element: ${JSON.stringify(element)}`);
                            //this.log.debug(`${this.constructor.name}.updateDeviceInfo(): stations - device_type: ${element.device_type}`);
                            this.hubs[element.station_sn] = element;
                        });
                    } else {
                        this.log.info("No stations found.");
                    }

                    if (Object.keys(this.hubs).length > 0)
                        this.emit("hubs", this.hubs);
                } else
                    this.log.error(`${this.constructor.name}.updateDeviceInfo(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`${this.constructor.name}.updateDeviceInfo(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.updateDeviceInfo(): error: ${error}`);
        }

        //Get Devices
        try {
            const response = await this.request("post", "app/get_devs_list").catch(error => {
                this.log.error(`${this.constructor.name}.updateDeviceInfo(): devices - error: ${JSON.stringify(error)}`);
                return error;
            });
            //this.log.debug(`${this.constructor.name}.updateDeviceInfo(): devices - Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult: Array<FullDeviceResponse> = result.data;
                    if (dataresult) {
                        dataresult.forEach(element => {
                            this.devices[element.device_sn] = element;
                        });
                    } else {
                        this.log.info("No devices found.");
                    }

                    if (Object.keys(this.devices).length > 0)
                        this.emit("devices", this.devices);
                } else
                    this.log.error(`${this.constructor.name}.updateDeviceInfo(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`${this.constructor.name}.updateDeviceInfo(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.updateDeviceInfo(): error: ${error}`);
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async request(method: Method, endpoint: string, data?: any, headers?: any): Promise<AxiosResponse<any>> {

        if (!this.token && endpoint != "passport/login") {
            //No token get one
            switch (await this.authenticate()) {
                case AuthResult.RENEW:
                    this.log.debug(`${this.constructor.name}.request(): renew token - method: ${method} endpoint: ${endpoint}`);
                    await this.authenticate();
                    break;
                case AuthResult.ERROR:
                    this.log.debug(`${this.constructor.name}.request(): token error - method: ${method} endpoint: ${endpoint}`);
                    break;
                default: break;
            }
        }
        if (this.token_expiration && (new Date()).getTime() >= this.token_expiration.getTime()) {
            this.log.info("Access token expired; fetching a new one")
            this.invalidateToken();
            if (endpoint != "passport/login")
                //get new token
                await this.authenticate()
        }

        this.log.debug(`${this.constructor.name}.request(): method: ${method} endpoint: ${endpoint} baseUrl: ${this.api_base} token: ${this.token} data: ${JSON.stringify(data)} headers: ${JSON.stringify(this.headers)}`);
        const response = await axios({
            method: method,
            url: endpoint,
            data: data,
            headers: headers,
            baseURL: this.api_base,
            validateStatus: function (status) {
                return status < 500; // Resolve only if the status code is less than 500
            }
        });

        if (response.status == 401) {
            this.invalidateToken();
            this.log.error(`${this.constructor.name}.request(): Status return code 401, invalidate token (status: ${response.status} text: ${response.statusText}`);
            this.emit("close");
        }

        return response;
    }

    public async checkPushToken(): Promise<boolean> {
        //Check push notification token
        try {
            const response = await this.request("post", "/app/review/app_push_check", {
                app_type: "eufySecurity",
                transaction: `${new Date().getTime()}`
            }, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.checkPushToken(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.checkPushToken(): Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    this.log.debug(`${this.constructor.name}.checkPushToken(): OK`);
                    return true;
                } else
                    this.log.error(`${this.constructor.name}.checkPushToken(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else if (response.status == 401) {
                this.invalidateToken();
                this.log.error(`${this.constructor.name}.checkPushToken(): Status return code 401, invalidate token (status: ${response.status} text: ${response.statusText}`);
            } else {
                this.log.error(`${this.constructor.name}.checkPushToken(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.checkPushToken(): error: ${error}`);
        }
        return false;
    }

    public async registerPushToken(token: string): Promise<boolean> {
        //Register push notification token
        try {
            const response = await this.request("post", "/apppush/register_push_token", {
                is_notification_enable: true,
                token: token,
                transaction: `${new Date().getTime().toString()}`
            }, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.registerPushToken(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.registerPushToken(): Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    this.log.debug(`${this.constructor.name}.registerPushToken(): OK`);
                    return true;
                } else
                    this.log.error(`${this.constructor.name}.registerPushToken(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else if (response.status == 401) {
                this.invalidateToken();
                this.log.error(`${this.constructor.name}.registerPushToken(): Status return code 401, invalidate token (status: ${response.status} text: ${response.statusText}`);
            } else {
                this.log.error(`${this.constructor.name}.registerPushToken(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.registerPushToken(): error: ${error}`);
        }
        return false;
    }

    public async setParameters(station_sn: string, device_sn: string, params: { param_type: number; param_value: any; }[]): Promise<boolean> {
        const tmp_params: any[] = []
        params.forEach(param => {
            tmp_params.push({ param_type: param.param_type, param_value: ParameterHelper.writeValue(param.param_type, param.param_value) });
        });

        try {
            const response = await this.request("post", "app/upload_devs_params", {
                device_sn: device_sn,
                station_sn: station_sn,
                params: tmp_params
            }).catch(error => {
                this.log.error(`${this.constructor.name}.setParameters(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.setParameters(): station_sn: ${station_sn} device_sn: ${device_sn} params: ${JSON.stringify(tmp_params)} Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult = result.data;
                    this.log.debug(`${this.constructor.name}.setParameters(): New Parameters set. response: ${JSON.stringify(dataresult)}`);
                    return true;
                } else
                    this.log.error(`${this.constructor.name}.setParameters(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`${this.constructor.name}.setParameters(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.setParameters(): error: ${error}`);
        }
        return false;
    }

    public async getCiphers(cipher_ids: Array<number>, user_id: string): Promise<Ciphers> {
        try {
            const response = await this.request("post", "app/cipher/get_ciphers", {
                cipher_ids: cipher_ids,
                user_id: user_id,
                transaction: `${new Date().getTime().toString()}`
            }, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.getCiphers(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.getCiphers(): Response:  ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                    if (result.data) {
                        const ciphers: Ciphers = {};
                        result.data.forEach((cipher: Cipher) => {
                            ciphers[cipher.cipher_id] = cipher;
                        });
                        return ciphers;
                    }
                } else {
                    this.log.error(`${this.constructor.name}.getCiphers(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
            } else {
                this.log.error(`${this.constructor.name}.getCiphers(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.getCiphers(): error: ${error}`);
        }
        return {};
    }

    public async getVoices(device_sn: string): Promise<Voices> {
        try {
            const response = await this.request("get", `voice/response/lists/${device_sn}`, null, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.getVoices(): error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.getVoices(): Response:  ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == ResponseErrorCode.CODE_WHATEVER_ERROR) {
                    if (result.data) {
                        const voices: Voices = {};
                        result.data.forEach((voice: Voice) => {
                            voices[voice.voice_id] = voice;
                        });
                        return voices;
                    }
                } else {
                    this.log.error(`${this.constructor.name}.getVoices(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
            } else {
                this.log.error(`${this.constructor.name}.getVoices(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.getVoices(): error: ${error}`);
        }
        return {};
    }

    public async getCipher(cipher_id: number, user_id: string): Promise<Cipher> {
        return (await this.getCiphers([cipher_id], user_id))[cipher_id];
    }

    public getLog(): Logger {
        return this.log;
    }

    public getDevices(): FullDevices {
        return this.devices;
    }

    public getHubs(): Hubs {
        return this.hubs;
    }

    public getToken(): string|null {
        return this.token;
    }

    public getTokenExpiration(): Date|null {
        return this.token_expiration;
    }

    public getTrustedTokenExpiration(): Date {
        return this.trusted_token_expiration;
    }

    public setToken(token: string): void {
        this.token = token;
        axios.defaults.headers.common["X-Auth-Token"] = token;
    }

    public setTokenExpiration(token_expiration: Date): void {
        this.token_expiration = token_expiration;
    }

    public getAPIBase(): string {
        return this.api_base;
    }

    public setAPIBase(api_base: string): void {
        this.api_base = api_base;
    }

    public setOpenUDID(openudid: string): void {
        this.headers.openudid = openudid;
    }

    public setSerialNumber(serialnumber: string): void {
        this.headers.sn = serialnumber;
    }

    private async _getEvents(functionName: string, endpoint: string, startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        const records: Array<EventRecordResponse> = [];
        try {
            if (filter === undefined)
                filter = { deviceSN: "", stationSN: "", storageType: StorageType.NONE };
            if (maxResults === undefined)
                maxResults = 1000;

            const response = await this.request("post", endpoint, {
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
                storage: filter.storageType !== undefined ? filter.storageType : StorageType.NONE,
                transaction: `${new Date().getTime().toString()}`
            }, this.headers).catch(error => {
                this.log.error(`${this.constructor.name}.${functionName}(): Error: ${JSON.stringify(error)}`);
                return error;
            });
            this.log.debug(`${this.constructor.name}.${functionName}(): Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult: Array<EventRecordResponse> = result.data;
                    if (dataresult) {
                        dataresult.forEach(record => {
                            this.log.debug(`${this.constructor.name}.${functionName}(): record: ${JSON.stringify(record)}`);
                            records.push(record);
                        });
                    }
                } else
                    this.log.error(`${this.constructor.name}.${functionName}(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`${this.constructor.name}.${functionName}(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`${this.constructor.name}.${functionName}(): error: ${error}`);
        }
        return records;
    }

    public async getVideoEvents(startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        return this._getEvents("getVideoEvents", "event/app/get_all_video_record", startTime, endTime, filter, maxResults);
    }

    public async getAlarmEvents(startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        return this._getEvents("getAlarmEvents", "event/app/get_all_alarm_record", startTime, endTime, filter, maxResults);
    }

    public async getHistoryEvents(startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        return this._getEvents("getHistoryEvents", "event/app/get_all_history_record", startTime, endTime, filter, maxResults);
    }

    public async getAllVideoEvents(filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        const fifthyYearsInMilliseconds = 15 * 365 * 24 * 60 * 60 * 1000;
        return this.getVideoEvents(new Date(new Date().getTime() - fifthyYearsInMilliseconds), new Date(), filter, maxResults);
    }

    public async getAllAlarmEvents(filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        const fifthyYearsInMilliseconds = 15 * 365 * 24 * 60 * 60 * 1000;
        return this.getAlarmEvents(new Date(new Date().getTime() - fifthyYearsInMilliseconds), new Date(), filter, maxResults);
    }

    public async getAllHistoryEvents(filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>> {
        const fifthyYearsInMilliseconds = 15 * 365 * 24 * 60 * 60 * 1000;
        return this.getHistoryEvents(new Date(new Date().getTime() - fifthyYearsInMilliseconds), new Date(), filter, maxResults);
    }

}