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
exports.Station = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const types_1 = require("./types");
const parameter_1 = require("./parameter");
const utils_1 = require("./utils");
const session_1 = require("../p2p/session");
const types_2 = require("../p2p/types");
const device_1 = require("./device");
const utils_2 = require("../push/utils");
const utils_3 = require("../p2p/utils");
const error_1 = require("../error");
const types_3 = require("../push/types");
const error_2 = require("./error");
class Station extends tiny_typed_emitter_1.TypedEmitter {
    constructor(eufySecurityApi, api, station) {
        super();
        this.dskKey = "";
        this.dskExpiration = null;
        this.p2pSession = null;
        this.properties = {};
        this.rawProperties = {};
        this.ready = false;
        this.currentDelay = 0;
        this.p2pCurrentModeChanged = false;
        this.eufySecurityApi = eufySecurityApi;
        this.api = api;
        this.rawStation = station;
        this.log = api.getLog();
        this.update(this.rawStation);
        this.ready = true;
    }
    getStateID(state, level = 2) {
        switch (level) {
            case 0:
                return `${this.getSerial()}`;
            case 1:
                return `${this.getSerial()}.${this.getStateChannel()}`;
            default:
                if (state)
                    return `${this.getSerial()}.${this.getStateChannel()}.${state}`;
                throw new Error("No state value passed.");
        }
    }
    getStateChannel() {
        return "station";
    }
    getRawStation() {
        return this.rawStation;
    }
    update(station) {
        this.rawStation = station;
        const metadata = this.getPropertiesMetadata();
        for (const property of Object.values(metadata)) {
            if (this.rawStation[property.key] !== undefined && typeof property.key === "string") {
                let timestamp = 0;
                switch (property.key) {
                    case "main_sw_version":
                        if (this.rawStation.main_sw_time !== undefined) {
                            timestamp = utils_2.convertTimestampMs(this.rawStation.main_sw_time);
                            break;
                        }
                    case "sec_sw_version":
                        if (this.rawStation.sec_sw_time !== undefined) {
                            timestamp = utils_2.convertTimestampMs(this.rawStation.sec_sw_time);
                            break;
                        }
                    default:
                        if (this.rawStation.update_time !== undefined) {
                            timestamp = utils_2.convertTimestampMs(this.rawStation.update_time);
                        }
                        break;
                }
                this.updateProperty(property.name, { value: this.rawStation[property.key], timestamp: timestamp });
            }
        }
        this.rawStation.params.forEach(param => {
            this.updateRawProperty(param.param_type, { value: param.param_value, timestamp: utils_2.convertTimestampMs(param.update_time) });
        });
        this.log.debug("Normalized Properties", { stationSN: this.getSerial(), properties: this.properties });
    }
    updateProperty(name, value) {
        if ((this.properties[name] !== undefined
            && (this.properties[name].value !== value.value
                && this.properties[name].timestamp <= value.timestamp))
            || this.properties[name] === undefined) {
            this.properties[name] = value;
            if (this.ready)
                this.emit("property changed", this, name, value);
            return true;
        }
        return false;
    }
    updateRawProperties(values) {
        Object.keys(values).forEach(paramtype => {
            const param_type = Number.parseInt(paramtype);
            this.updateRawProperty(param_type, values[param_type]);
        });
    }
    updateRawProperty(type, value) {
        const parsedValue = parameter_1.ParameterHelper.readValue(type, value.value);
        if ((this.rawProperties[type] !== undefined
            && (this.rawProperties[type].value !== parsedValue
                && this.rawProperties[type].timestamp <= value.timestamp))
            || this.rawProperties[type] === undefined) {
            this.rawProperties[type] = {
                value: parsedValue,
                timestamp: value.timestamp
            };
            if (this.ready)
                this.emit("raw property changed", this, type, this.rawProperties[type].value, this.rawProperties[type].timestamp);
            const metadata = this.getPropertiesMetadata();
            for (const property of Object.values(metadata)) {
                if (property.key === type) {
                    this.properties[property.name] = this.convertRawPropertyValue(property, this.rawProperties[type]);
                    if (this.ready)
                        this.emit("property changed", this, property.name, this.properties[property.name]);
                    break;
                }
            }
            return true;
        }
        return false;
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_GET_HUB_LAN_IP:
                    return { value: value !== undefined ? (utils_3.isPrivateIp(value.value) ? value.value : "") : "", timestamp: value !== undefined ? value.timestamp : 0 };
                case types_2.CommandType.CMD_SET_ARMING:
                    return { value: Number.parseInt(value !== undefined ? value.value : "-1"), timestamp: value !== undefined ? value.timestamp : 0 };
                case types_2.CommandType.CMD_GET_ALARM_MODE:
                    {
                        const guard_mode = this.getGuardMode();
                        return { value: Number.parseInt(value !== undefined ? value.value : guard_mode !== undefined && guard_mode.value !== types_1.GuardMode.SCHEDULE && guard_mode.value !== types_1.GuardMode.GEO ? guard_mode.value : types_1.GuardMode.UNKNOWN.toString()), timestamp: value !== undefined ? value.timestamp : 0 };
                    }
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return value;
    }
    getPropertyMetadata(name) {
        const property = this.getPropertiesMetadata()[name];
        if (property !== undefined)
            return property;
        throw new error_2.InvalidPropertyError(`Property ${name} invalid`);
    }
    getPropertyValue(name) {
        if (name === types_1.PropertyName.StationCurrentMode) {
            const guard_mode = this.properties[types_1.PropertyName.StationGuardMode];
            return this.properties[types_1.PropertyName.StationCurrentMode] !== undefined ? this.properties[types_1.PropertyName.StationCurrentMode] : guard_mode !== undefined && guard_mode.value !== types_1.GuardMode.SCHEDULE && guard_mode.value !== types_1.GuardMode.GEO ? guard_mode : { value: types_1.GuardMode.UNKNOWN, timestamp: 0 };
        }
        return this.properties[name];
    }
    getRawProperty(type) {
        return this.rawProperties[type];
    }
    getRawProperties() {
        return this.rawProperties;
    }
    getProperties() {
        return this.properties;
    }
    getPropertiesMetadata() {
        const metadata = types_1.StationProperties[this.getDeviceType()];
        if (metadata === undefined)
            return types_1.StationProperties[types_1.DeviceType.STATION];
        return metadata;
    }
    hasProperty(name) {
        return this.getPropertiesMetadata()[name] !== undefined;
    }
    isStation() {
        return this.rawStation.device_type == types_1.DeviceType.STATION;
    }
    isDeviceStation() {
        return this.rawStation.device_type != types_1.DeviceType.STATION;
    }
    getDeviceType() {
        return this.rawStation.device_type;
    }
    getHardwareVersion() {
        return this.rawStation.main_hw_version;
    }
    getMACAddress() {
        return this.rawStation.wifi_mac;
    }
    getModel() {
        return this.rawStation.station_model;
    }
    getName() {
        return this.rawStation.station_name;
    }
    getSerial() {
        return this.rawStation.station_sn;
    }
    getId() {
        return this.rawStation.station_id;
    }
    getDeviceTypeString() {
        if (this.rawStation.device_type == types_1.DeviceType.STATION) {
            return "basestation";
        }
        else {
            return `unknown(${this.rawStation.device_type})`;
        }
    }
    getActorId() {
        return this.rawStation.member.action_user_id;
    }
    getSoftwareVersion() {
        return this.rawStation.main_sw_version;
    }
    getIPAddress() {
        return this.rawStation.ip_addr;
    }
    getLANIPAddress() {
        return this.getPropertyValue(types_1.PropertyName.StationLANIpAddress);
    }
    getGuardMode() {
        return this.getPropertyValue(types_1.PropertyName.StationGuardMode);
    }
    getCurrentMode() {
        const guard_mode = this.getGuardMode();
        return this.getPropertyValue(types_1.PropertyName.StationCurrentMode) !== undefined ? this.getPropertyValue(types_1.PropertyName.StationCurrentMode) : guard_mode !== undefined && guard_mode.value !== types_1.GuardMode.SCHEDULE && guard_mode.value !== types_1.GuardMode.GEO ? guard_mode : { value: types_1.GuardMode.UNKNOWN, timestamp: 0 };
    }
    processPushNotification(message) {
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === types_3.CusPushEvent.MODE_SWITCH && message.station_sn === this.getSerial()) {
                this.log.info("Received push notification for changing guard mode", { guard_mode: message.station_guard_mode, current_mode: message.station_current_mode, stationSN: message.station_sn });
                try {
                    let guardModeChanged = false;
                    let currentModeChanged = false;
                    if (message.station_guard_mode !== undefined)
                        guardModeChanged = this.updateRawProperty(types_1.ParamType.GUARD_MODE, { value: message.station_guard_mode.toString(), timestamp: utils_2.convertTimestampMs(message.event_time) });
                    if (message.station_current_mode !== undefined)
                        currentModeChanged = this.updateRawProperty(types_2.CommandType.CMD_GET_ALARM_MODE, { value: message.station_current_mode.toString(), timestamp: utils_2.convertTimestampMs(message.event_time) });
                    if (message.station_guard_mode !== undefined && message.station_current_mode !== undefined && (guardModeChanged || currentModeChanged)) {
                        this.emit("guard mode", this, message.station_guard_mode, message.station_current_mode);
                    }
                }
                catch (error) {
                    this.log.debug(`Station ${message.station_sn} MODE_SWITCH event (${message.event_type}) - Error:`, error);
                }
            }
        }
    }
    getP2pDid() {
        return this.rawStation.p2p_did;
    }
    getDSKKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.request("post", "app/equipment/get_dsk_keys", {
                    station_sns: [this.getSerial()]
                }).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug(`Station ${this.getSerial()} - Response:`, response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        dataresult.dsk_keys.forEach(key => {
                            if (key.station_sn == this.getSerial()) {
                                this.dskKey = key.dsk_key;
                                this.dskExpiration = new Date(key.expiration * 1000);
                                this.log.debug(`${this.constructor.name}.getDSKKeys(): dskKey: ${this.dskKey} dskExpiration: ${this.dskExpiration}`);
                            }
                        });
                    }
                    else {
                        this.log.error(`Station ${this.getSerial()} - Response code not ok`, { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error(`Station ${this.getSerial()} - Status return code not 200`, { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error(`Station ${this.getSerial()} - Generic Error:`, error);
            }
        });
    }
    getDSKKey() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getDSKKeys();
            return this.dskKey;
        });
    }
    getDSKKeyExpiration() {
        if (this.dskExpiration != null) {
            return this.dskExpiration.valueOf();
        }
        else {
            return 0;
        }
    }
    isConnected() {
        if (this.p2pSession)
            return this.p2pSession.isConnected();
        return false;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`Disconnect from station ${this.getSerial()}`);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = undefined;
            }
            if (this.p2pSession) {
                yield this.p2pSession.close();
                this.p2pSession = null;
            }
        });
    }
    connect(p2pConnectionType = types_2.P2PConnectionType.PREFER_LOCAL, quickStreamStart = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dskKey == "" || (this.dskExpiration && (new Date()).getTime() >= this.dskExpiration.getTime())) {
                this.log.debug(`Station ${this.getSerial()} DSK keys not present or expired, get/renew it`, { dskExpiration: this.dskExpiration });
                yield this.getDSKKeys();
            }
            this.log.debug(`Connecting to station ${this.getSerial()}...`, { p2p_did: this.rawStation.p2p_did, dskKey: this.dskKey });
            if (this.p2pSession) {
                this.p2pSession.removeAllListeners();
                this.p2pSession.close();
                this.p2pSession = null;
            }
            const deviceSNs = {};
            if (this.rawStation.devices)
                for (const device of this.rawStation.devices) {
                    deviceSNs[device.device_channel] = {
                        sn: device.device_sn,
                        admin_user_id: this.rawStation.member.admin_user_id
                    };
                }
            this.p2pSession = new session_1.P2PClientProtocol(this.getLANIPAddress().value, this.eufySecurityApi.getUDPLocalPortForBase(this.getSerial()), this.eufySecurityApi.getP2PConnectionType(), this.rawStation.p2p_did, this.dskKey, this.getSerial(), deviceSNs, this.log);
            this.p2pSession.setConnectionType(p2pConnectionType);
            this.p2pSession.setQuickStreamStart(quickStreamStart);
            this.p2pSession.on("connect", (address) => this.onConnect(address));
            this.p2pSession.on("close", () => this.onDisconnect());
            this.p2pSession.on("command", (result) => this.onCommandResponse(result));
            this.p2pSession.on("alarm mode", (mode) => this.onAlarmMode(mode));
            this.p2pSession.on("camera info", (cameraInfo) => this.onCameraInfo(cameraInfo));
            this.p2pSession.on("download started", (channel, metadata, videoStream, audioStream) => this.onStartDownload(channel, metadata, videoStream, audioStream));
            this.p2pSession.on("download finished", (channel) => this.onFinishDownload(channel));
            this.p2pSession.on("livestream started", (channel, metadata, videoStream, audioStream) => this.onStartLivestream(channel, metadata, videoStream, audioStream));
            this.p2pSession.on("livestream stopped", (channel) => this.onStopLivestream(channel));
            this.p2pSession.on("wifi rssi", (channel, rssi) => this.onWifiRssiChanged(channel, rssi));
            this.p2pSession.on("rtsp url", (channel, rtspUrl) => this.onRTSPUrl(channel, rtspUrl));
            this.p2pSession.on("esl parameter", (channel, param, value) => this.onESLParameter(channel, param, value));
            this.p2pSession.connect();
        });
    }
    onFinishDownload(channel) {
        this.emit("download finish", this, channel);
    }
    onStartDownload(channel, metadata, videoStream, audioStream) {
        this.emit("download start", this, channel, metadata, videoStream, audioStream);
    }
    onStopLivestream(channel) {
        this.emit("livestream stop", this, channel);
    }
    onStartLivestream(channel, metadata, videoStream, audioStream) {
        this.emit("livestream start", this, channel, metadata, videoStream, audioStream);
    }
    onWifiRssiChanged(channel, rssi) {
        this.emit("raw property changed", this, types_2.CommandType.CMD_WIFI_CONFIG, rssi.toString(), +new Date);
    }
    onRTSPUrl(channel, rtspUrl) {
        this.emit("rtsp url", this, channel, rtspUrl, +new Date);
    }
    onESLParameter(channel, param, value) {
        const params = {};
        params[param] = {
            value: parameter_1.ParameterHelper.readValue(param, value),
            timestamp: +new Date
        };
        this.emit("raw device property changed", this._getDeviceSerial(channel), params);
    }
    setGuardMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mode in types_1.GuardMode) {
                if (!this.p2pSession || !this.p2pSession.isConnected()) {
                    this.log.debug(`P2P connection to station ${this.getSerial()} not present, establish it`);
                    yield this.connect();
                }
                if (this.p2pSession) {
                    if (this.p2pSession.isConnected()) {
                        this.log.debug(`P2P connection to station ${this.getSerial()} present, send command mode: ${mode}`);
                        if ((utils_1.isGreaterMinVersion("2.0.7.9", this.getSoftwareVersion()) && !device_1.Device.isIntegratedDeviceBySn(this.getSerial())) || device_1.Device.isSoloCameraBySn(this.getSerial())) {
                            this.log.debug(`Using CMD_SET_PAYLOAD for station ${this.getSerial()}`, { main_sw_version: this.getSoftwareVersion() });
                            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                                "account_id": this.rawStation.member.admin_user_id,
                                "cmd": types_2.CommandType.CMD_SET_ARMING,
                                "mValue3": 0,
                                "payload": {
                                    "mode_type": mode,
                                    "user_name": this.rawStation.member.nick_name
                                }
                            }), Station.CHANNEL);
                        }
                        else {
                            this.log.debug(`Using CMD_SET_ARMING for station ${this.getSerial()}`);
                            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_SET_ARMING, mode, this.rawStation.member.admin_user_id, Station.CHANNEL);
                        }
                    }
                }
            }
            else {
                throw new error_1.NotSupportedGuardModeError(`Tried to set unsupported guard mode "${mode}" for station ${this.getSerial()}`);
            }
        });
    }
    getCameraInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                this.log.debug(`P2P connection to station ${this.getSerial()} not present, establish it`);
                yield this.connect();
            }
            if (this.p2pSession) {
                if (this.p2pSession.isConnected()) {
                    this.log.debug(`P2P connection to station ${this.getSerial()} present, get device infos`);
                    yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_CAMERA_INFO, 255, "", Station.CHANNEL);
                }
            }
        });
    }
    getStorageInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                this.log.debug(`P2P connection to station ${this.getSerial()} not present, establish it`);
                yield this.connect();
            }
            if (this.p2pSession) {
                if (this.p2pSession.isConnected()) {
                    this.log.debug(`P2P connection to station ${this.getSerial()} present, get storage info`);
                    //TODO: Verify channel! Should be 255...
                    yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SDINFO_EX, 0, 0, this.rawStation.member.admin_user_id);
                }
            }
        });
    }
    onAlarmMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`Alarm mode for station ${this.getSerial()} changed to: ${types_1.AlarmMode[mode]}`);
            const oldValue = this.getRawProperty(types_2.CommandType.CMD_GET_ALARM_MODE);
            this.updateRawProperty(types_2.CommandType.CMD_GET_ALARM_MODE, {
                value: mode.toString(),
                timestamp: +new Date
            });
            if (oldValue === undefined || (oldValue !== undefined && oldValue.value !== mode.toString()))
                this.p2pCurrentModeChanged = true;
            this.emit("raw property changed", this, types_2.CommandType.CMD_GET_ALARM_MODE, this.rawProperties[types_2.CommandType.CMD_GET_ALARM_MODE].value, this.rawProperties[types_2.CommandType.CMD_GET_ALARM_MODE].timestamp);
            // Trigger refresh Guard Mode
            yield this.getCameraInfo();
        });
    }
    _getDeviceSerial(channel) {
        if (this.rawStation.devices)
            for (const device of this.rawStation.devices) {
                if (device.device_channel === channel)
                    return device.device_sn;
            }
        return "";
    }
    onCameraInfo(cameraInfo) {
        this.log.debug("Got camera infos", { station: this.getSerial(), cameraInfo: cameraInfo });
        const devices = {};
        const timestamp = +new Date;
        let guardModeChanged = false;
        const rawCurrentMode = this.getRawProperty(types_2.CommandType.CMD_GET_ALARM_MODE);
        cameraInfo.params.forEach(param => {
            if (param.dev_type === Station.CHANNEL) {
                const updated = this.updateRawProperty(param.param_type, { value: param.param_value, timestamp: timestamp });
                if ((param.param_type === types_1.ParamType.GUARD_MODE || (param.param_type === types_2.CommandType.CMD_GET_ALARM_MODE && rawCurrentMode !== undefined)) && updated) {
                    guardModeChanged = true;
                }
            }
            else {
                const device_sn = this._getDeviceSerial(param.dev_type);
                if (device_sn !== "") {
                    if (!devices[device_sn]) {
                        devices[device_sn] = {};
                    }
                    devices[device_sn][param.param_type] = {
                        value: parameter_1.ParameterHelper.readValue(param.param_type, param.param_value),
                        timestamp: timestamp
                    };
                }
            }
        });
        if (guardModeChanged || this.p2pCurrentModeChanged) {
            this.p2pCurrentModeChanged = false;
            this.emit("guard mode", this, this.getGuardMode().value, this.getCurrentMode().value);
        }
        Object.keys(devices).forEach(device => {
            this.emit("raw device property changed", device, devices[device]);
        });
    }
    onCommandResponse(result) {
        this.log.debug("Got p2p command response", { station: this.getSerial(), commandType: result.command_type, channel: result.channel, returnCodeName: types_2.ErrorCode[result.return_code], returnCode: result.return_code });
        this.emit("command result", this, result);
    }
    onConnect(address) {
        this.resetCurrentDelay();
        this.log.info(`Connected to station ${this.getSerial()} on host ${address.host} and port ${address.port}`);
        this.emit("connect", this);
    }
    onDisconnect() {
        this.log.info(`Disconnected from station ${this.getSerial()}`);
        this.emit("close", this);
        if (this.p2pSession)
            this.scheduleReconnect();
    }
    getCurrentDelay() {
        const delay = this.currentDelay == 0 ? 5000 : this.currentDelay;
        if (this.currentDelay < 60000)
            this.currentDelay += 10000;
        if (this.currentDelay >= 60000 && this.currentDelay < 600000)
            this.currentDelay += 60000;
        return delay;
    }
    resetCurrentDelay() {
        this.currentDelay = 0;
    }
    scheduleReconnect() {
        const delay = this.getCurrentDelay();
        this.log.debug("Schedule reconnect...", { delay: delay });
        if (!this.reconnectTimeout)
            this.reconnectTimeout = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                this.reconnectTimeout = undefined;
                this.connect();
            }), delay);
    }
    getSupportedFeatures() {
        return types_1.SupportedFeatures[this.getDeviceType()];
    }
    isFeatureSupported(feature) {
        return types_1.SupportedFeatures[this.getDeviceType()].includes(feature);
    }
    rebootHUB() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isFeatureSupported(types_1.SupportedFeature.RebootHUB)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, reboot requested`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_HUB_REBOOT, 0, this.rawStation.member.admin_user_id, Station.CHANNEL);
        });
    }
    setStatusLed(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.StatusLED)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            if (device.isCamera2Product()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_DEV_LED_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_LIVEVIEW_LED_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isIndoorCamera() || device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_LED_SWITCH,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "mediaAccountInfo": {
                            "deviceChannel": device.getChannel(),
                            "device_sn": device.getSerial(),
                            "device_type": -1,
                            "mDeviceName": device.getName(),
                            "mDidStr": this.rawStation.p2p_did,
                            "mHubSn": this.getSerial(),
                            "mInitStr": this.rawStation.app_conn,
                            "mReceiveVersion": "",
                            "mTimeInfo": "",
                            "mVersionName": ""
                        },
                        "transaction": `${new Date().getTime()}`
                    }
                }), device.getChannel());
            }
            else if (device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_LED_SWITCH,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "url": "",
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "mediaAccountInfo": {
                            "deviceChannel": device.getChannel(),
                            "device_sn": device.getSerial(),
                            "device_type": -1,
                            "mDeviceName": device.getName(),
                            "mDidStr": this.rawStation.p2p_did,
                            "mHubSn": this.getSerial(),
                            "mInitStr": this.rawStation.app_conn,
                            "mReceiveVersion": "",
                            "mTimeInfo": "",
                            "mVersionName": ""
                        },
                        "transaction": `${new Date().getTime()}`
                    }
                }), device.getChannel());
            }
            else if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_BAT_DOORBELL_SET_LED_ENABLE,
                    "mValue3": 0,
                    "payload": {
                        "light_enable": value === true ? 1 : 0
                    }
                }), device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_LED_NIGHT_OPEN,
                    "data": {
                        "status": value === true ? 1 : 0
                    }
                }), device.getChannel());
            }
        });
    }
    setAutoNightVision(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.AutoNightVision)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`${this.constructor.name}.setAutoNightVision(): P2P connection to station ${this.getSerial()} present, set value: ${value}.`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_IRCUT_SWITCH, value === true ? 1 : 0, device.getChannel(), "", "", device.getChannel());
        });
    }
    setMotionDetection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.MotionDetection)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            if (device.isIndoorCamera() || device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": value === true ? 1 : 0,
                        "type": 0,
                        "value": 0,
                        "voiceID": 0,
                        "zonecount": 0
                    }
                }), device.getChannel());
            }
            else if (device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": value === true ? 1 : 0,
                        "type": 0,
                        "url": "",
                        "value": 0,
                        "voiceID": 0,
                        "zonecount": 0
                    }
                }), device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_MOTION_DETECTION_PACKAGE,
                    "data": {
                        "enable": value === true ? 1 : 0,
                    }
                }), device.getChannel());
            }
            else {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_PIR_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setSoundDetection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.SoundDetection)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_ENABLE,
                "data": {
                    "enable": 0,
                    "index": 0,
                    "status": value === true ? 1 : 0,
                    "type": 0,
                    "value": 0,
                    "voiceID": 0,
                    "zonecount": 0
                }
            }), device.getChannel());
        });
    }
    setPetDetection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.PetDetection)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_PET_ENABLE,
                "data": {
                    "enable": 0,
                    "index": 0,
                    "status": value === true ? 1 : 0,
                    "type": 0,
                    "value": 0,
                    "voiceID": 0,
                    "zonecount": 0
                }
            }), device.getChannel());
        });
    }
    setRTSPStream(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.RTSP)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_NAS_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setAntiTheftDetection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.AntiTheftDetection)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_EAS_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setWatermark(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.Watermarking)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            if (device.isCamera2Product()) {
                if (!Object.values(types_2.WatermarkSetting3).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values:`, types_2.WatermarkSetting3);
                    return;
                }
                this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${types_2.WatermarkSetting3[value]}.`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isIndoorCamera() || device.isFloodLight()) {
                if (!Object.values(types_2.WatermarkSetting4).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values:`, types_2.WatermarkSetting4);
                    return;
                }
                this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${types_2.WatermarkSetting4[value]}.`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isSoloCameras() || device.isWiredDoorbell()) {
                if (!Object.values(types_2.WatermarkSetting1).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values:`, types_2.WatermarkSetting1);
                    return;
                }
                this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${types_2.WatermarkSetting1[value]}.`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, 0, this.rawStation.member.admin_user_id, "", 0);
            }
            else if (device.isBatteryDoorbell() || device.isBatteryDoorbell2() || device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                if (!Object.values(types_2.WatermarkSetting2).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values: `, types_2.WatermarkSetting2);
                    return;
                }
                this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${types_2.WatermarkSetting2[value]}.`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else {
                this.log.warn("This functionality is not implemented or supported by this device");
            }
        });
    }
    enableDevice(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isCamera()) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            let param_value = value === true ? 0 : 1;
            if (device.isIndoorCamera() || device.isSoloCameras() || device.isWiredDoorbell())
                param_value = value === true ? 1 : 0;
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_DEVS_SWITCH, param_value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    startDownload(device, path, cipher_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            const cipher = yield this.api.getCipher(cipher_id, this.rawStation.member.admin_user_id);
            if (cipher) {
                this.log.debug(`P2P connection to station ${this.getSerial()} present, download video path: ${path}`);
                this.p2pSession.setDownloadRSAPrivateKeyPem(cipher.private_key);
                yield this.p2pSession.sendCommandWithString(types_2.CommandType.CMD_DOWNLOAD_VIDEO, path, this.rawStation.member.admin_user_id, device.getChannel());
            }
            else {
                this.log.warn(`Cancelled download of video "${path}" from Station ${this.getSerial()}, because RSA certificate couldn't be loaded`);
            }
        });
    }
    cancelDownload(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, cancel download for channel: ${device.getChannel()}.`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_DOWNLOAD_CANCEL, device.getChannel(), this.rawStation.member.admin_user_id, device.getChannel());
        });
    }
    startLivestream(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.Livestreaming)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, start livestream for channel: ${device.getChannel()}`);
            const rsa_key = this.p2pSession.getRSAPrivateKey();
            if (device.isWiredDoorbell() || device.isFloodLight() || device.isSoloCameras() || device.isIndoorCamera()) {
                this.log.debug(`Using CMD_DOORBELL_SET_PAYLOAD for station ${this.getSerial()} (main_sw_version: ${this.getSoftwareVersion()})`);
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": 1000,
                    "data": {
                        "account_id": this.rawStation.member.admin_user_id,
                        "encryptkey": rsa_key === null || rsa_key === void 0 ? void 0 : rsa_key.exportKey("components-public").n.slice(1).toString("hex"),
                        "streamtype": 0
                    }
                }), device.getChannel());
            }
            else {
                if ((device_1.Device.isIntegratedDeviceBySn(this.getSerial()) || !utils_1.isGreaterMinVersion("2.0.9.7", this.getSoftwareVersion())) && (!this.getSerial().startsWith("T8420") || !utils_1.isGreaterMinVersion("1.0.0.25", this.getSoftwareVersion()))) {
                    this.log.debug(`Using CMD_START_REALTIME_MEDIA for station ${this.getSerial()} (main_sw_version: ${this.getSoftwareVersion()})`);
                    yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_START_REALTIME_MEDIA, device.getChannel(), rsa_key === null || rsa_key === void 0 ? void 0 : rsa_key.exportKey("components-public").n.slice(1).toString("hex"), device.getChannel());
                }
                else {
                    this.log.debug(`Using CMD_SET_PAYLOAD for station ${this.getSerial()} (main_sw_version: ${this.getSoftwareVersion()})`);
                    yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                        "account_id": this.rawStation.member.admin_user_id,
                        "cmd": types_2.CommandType.CMD_START_REALTIME_MEDIA,
                        "mValue3": types_2.CommandType.CMD_START_REALTIME_MEDIA,
                        "payload": {
                            "ClientOS": "Android",
                            "key": rsa_key === null || rsa_key === void 0 ? void 0 : rsa_key.exportKey("components-public").n.slice(1).toString("hex"),
                            "streamtype": types_2.VideoCodec.H264
                        }
                    }), device.getChannel());
                }
            }
        });
    }
    stopLivestream(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.Livestreaming)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, start livestream for channel: ${device.getChannel()}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_STOP_REALTIME_MEDIA, device.getChannel(), undefined, device.getChannel());
        });
    }
    isLiveStreaming(device) {
        if (!this.p2pSession || !this.p2pSession.isConnected()) {
            return false;
        }
        if (device.getStationSerial() !== this.getSerial())
            return false;
        return this.p2pSession.isLiveStreaming(device.getChannel());
    }
    isDownloading(device) {
        if (!this.p2pSession || !this.p2pSession.isConnected()) {
            return false;
        }
        if (device.getStationSerial() !== this.getSerial())
            return false;
        return this.p2pSession.isDownloading(device.getChannel());
    }
    quickResponse(device, voice_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.QuickResponse)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set voice_id: ${voice_id}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                this.log.debug(`Using CMD_BAT_DOORBELL_QUICK_RESPONSE for station ${this.getSerial()}`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_QUICK_RESPONSE, voice_id, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                this.log.debug(`Using CMD_DOORBELL_SET_PAYLOAD for station ${this.getSerial()}`);
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": 1004,
                    "data": {
                        "voiceID": voice_id
                    }
                }), device.getChannel());
            }
        });
    }
    lockDevice(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.isFeatureSupported(types_1.SupportedFeature.Locking)) {
                throw new error_1.NotSupportedFeatureError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.p2pSession || !this.p2pSession.isConnected()) {
                throw new error_1.NotConnectedError(`No p2p connection to station ${this.getSerial()}`);
            }
            this.log.debug(`P2P connection to station ${this.getSerial()} present, set value: ${value}`);
            const key = utils_3.generateLockAESKey(this.rawStation.member.admin_user_id, this.getSerial());
            const iv = utils_3.getLockVectorBytes(this.getSerial());
            const lockCmd = device_1.Lock.encodeESLCmdOnOff(Number.parseInt(this.rawStation.member.short_user_id), this.rawStation.member.nick_name, value);
            const payload = {
                channel: device.getChannel(),
                lock_cmd: types_2.ESLInnerCommand.ON_OFF_LOCK,
                lock_payload: lockCmd.toString("base64"),
                seq_num: this.p2pSession.incLockSequenceNumber()
            };
            const encPayload = utils_3.encryptLockAESData(key, iv, utils_3.encodeLockPayload(JSON.stringify(payload)));
            this.log.debug("Locking/unlocking device...", { station: this.getSerial(), device: device.getSerial(), admin_user_id: this.rawStation.member.admin_user_id, payload: payload, encPayload: encPayload.toString("hex") });
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                "account_id": this.rawStation.member.admin_user_id,
                "cmd": types_2.CommandType.CMD_DOORLOCK_DATA_PASS_THROUGH,
                "mValue3": 0,
                "payload": {
                    "payload": encPayload.toString("base64")
                }
            }), device.getChannel());
        });
    }
}
exports.Station = Station;
Station.CHANNEL = 255;
