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
const utils_4 = require("../utils");
class Station extends tiny_typed_emitter_1.TypedEmitter {
    constructor(eufySecurityApi, api, station) {
        super();
        this.properties = {};
        this.rawProperties = {};
        this.ready = false;
        this.currentDelay = 0;
        this.terminating = false;
        this.p2pConnectionType = types_2.P2PConnectionType.ONLY_LOCAL;
        this.eufySecurityApi = eufySecurityApi;
        this.api = api;
        this.rawStation = station;
        this.log = api.getLog();
        this.update(this.rawStation);
        this.connectToP2P();
    }
    connectToP2P() {
        this.p2pSession = new session_1.P2PClientProtocol(this.getLANIPAddress().value, this.eufySecurityApi.getUDPLocalPortForBase(this.rawStation.station_sn), this.eufySecurityApi.getP2PConnectionType(), this.rawStation, this.api);
        this.p2pSession.on("connect", (address) => this.onConnect(address));
        this.p2pSession.on("close", () => this.onDisconnect());
        this.p2pSession.on("timeout", () => this.onTimeout());
        this.p2pSession.on("command", (result) => this.onCommandResponse(result));
        this.p2pSession.on("alarm mode", (mode) => this.onAlarmMode(mode));
        this.p2pSession.on("camera info", (cameraInfo) => this.onCameraInfo(cameraInfo));
        this.p2pSession.on("download started", (channel, metadata, videoStream, audioStream) => this.onStartDownload(channel, metadata, videoStream, audioStream));
        this.p2pSession.on("download finished", (channel) => this.onFinishDownload(channel));
        this.p2pSession.on("livestream started", (channel, metadata, videoStream, audioStream) => this.onStartLivestream(channel, metadata, videoStream, audioStream));
        this.p2pSession.on("livestream stopped", (channel) => this.onStopLivestream(channel));
        this.p2pSession.on("wifi rssi", (channel, rssi) => this.onWifiRssiChanged(channel, rssi));
        this.p2pSession.on("rtsp livestream started", (channel) => this.onStartRTSPLivestream(channel));
        this.p2pSession.on("rtsp livestream stopped", (channel) => this.onStopRTSPLivestream(channel));
        this.p2pSession.on("rtsp url", (channel, rtspUrl) => this.onRTSPUrl(channel, rtspUrl));
        this.p2pSession.on("esl parameter", (channel, param, value) => this.onESLParameter(channel, param, value));
        this.p2pSession.on("runtime state", (channel, batteryLevel, temperature) => this.onRuntimeState(channel, batteryLevel, temperature));
        this.p2pSession.on("charging state", (channel, chargeType, batteryLevel) => this.onChargingState(channel, chargeType, batteryLevel));
        this.update(this.rawStation);
        this.ready = true;
        this.p2pConnectionType = this.eufySecurityApi.getP2PConnectionType();
        setImmediate(() => {
            this.emit("ready", this);
        });
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
        if (this.p2pSession != null) {
            this.p2pSession.updateRawStation(station);
        }
        const metadata = this.getPropertiesMetadata();
        for (const property of Object.values(metadata)) {
            if (this.rawStation[property.key] !== undefined && typeof property.key === "string") {
                let timestamp = 0;
                switch (property.key) {
                    case "main_sw_version":
                        if (this.rawStation.main_sw_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawStation.main_sw_time);
                            break;
                        }
                    case "sec_sw_version":
                        if (this.rawStation.sec_sw_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawStation.sec_sw_time);
                            break;
                        }
                    default:
                        if (this.rawStation.update_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawStation.update_time);
                        }
                        break;
                }
                this.updateProperty(property.name, { value: this.rawStation[property.key], timestamp: timestamp });
            }
            else if (this.properties[property.name] === undefined && property.default !== undefined && !this.ready) {
                this.updateProperty(property.name, { value: property.default, timestamp: new Date().getTime() });
            }
        }
        this.rawStation.params.forEach(param => {
            this.updateRawProperty(param.param_type, { value: param.param_value, timestamp: (0, utils_2.convertTimestampMs)(param.update_time) });
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
            if (this.ready) {
                this.emit("raw property changed", this, type, this.rawProperties[type].value, this.rawProperties[type].timestamp);
                try {
                    if (type === types_1.ParamType.GUARD_MODE) {
                        this.emit("guard mode", this, Number.parseInt(parsedValue));
                    }
                    else if (type === types_2.CommandType.CMD_GET_ALARM_MODE) {
                        this.emit("current mode", this, Number.parseInt(parsedValue));
                    }
                }
                catch (error) {
                    this.log.error("Number conversion error", error);
                }
            }
            const metadata = this.getPropertiesMetadata();
            for (const property of Object.values(metadata)) {
                if (property.key === type) {
                    try {
                        this.updateProperty(property.name, this.convertRawPropertyValue(property, this.rawProperties[type]));
                    }
                    catch (error) {
                        if (error instanceof error_2.PropertyNotSupportedError) {
                            this.log.debug("Property not supported error", error);
                        }
                        else {
                            this.log.error("Property error", error);
                        }
                    }
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
                    return { value: value !== undefined ? ((0, utils_3.isPrivateIp)(value.value) ? value.value : "") : "", timestamp: value !== undefined ? value.timestamp : 0 };
                case types_2.CommandType.CMD_SET_ARMING:
                    return { value: Number.parseInt(value !== undefined ? value.value : "-1"), timestamp: value !== undefined ? value.timestamp : 0 };
                case types_2.CommandType.CMD_GET_ALARM_MODE:
                    {
                        const guard_mode = this.getGuardMode();
                        return { value: Number.parseInt(value !== undefined ? value.value : guard_mode !== undefined && guard_mode.value !== types_1.GuardMode.SCHEDULE && guard_mode.value !== types_1.GuardMode.GEO ? guard_mode.value : types_1.GuardMode.UNKNOWN.toString()), timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                case types_2.CommandType.CMD_HUB_NOTIFY_MODE:
                    {
                        switch (property.name) {
                            case types_1.PropertyName.StationNotificationSwitchModeSchedule:
                                if (!(0, utils_1.isGreaterEqualMinVersion)("2.1.1.6", this.getSoftwareVersion())) {
                                    return { value: value !== undefined ? (value.value === "1" ? true : false) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                                }
                                return { value: value !== undefined ? (0, utils_1.isNotificationSwitchMode)(Number.parseInt(value.value), types_1.NotificationSwitchMode.SCHEDULE) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                            case types_1.PropertyName.StationNotificationSwitchModeGeofence:
                                if (!(0, utils_1.isGreaterEqualMinVersion)("2.1.1.6", this.getSoftwareVersion())) {
                                    throw new error_2.PropertyNotSupportedError(`Property ${property.name} not supported for station ${this.getSerial()} with software version ${this.getSoftwareVersion()}`);
                                }
                                return { value: value !== undefined ? (0, utils_1.isNotificationSwitchMode)(Number.parseInt(value.value), types_1.NotificationSwitchMode.GEOFENCE) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                            case types_1.PropertyName.StationNotificationSwitchModeApp:
                                if (!(0, utils_1.isGreaterEqualMinVersion)("2.1.1.6", this.getSoftwareVersion())) {
                                    throw new error_2.PropertyNotSupportedError(`Property ${property.name} not supported for station ${this.getSerial()} with software version ${this.getSoftwareVersion()}`);
                                }
                                return { value: value !== undefined ? (0, utils_1.isNotificationSwitchMode)(Number.parseInt(value.value), types_1.NotificationSwitchMode.APP) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                            case types_1.PropertyName.StationNotificationSwitchModeKeypad:
                                if (!(0, utils_1.isGreaterEqualMinVersion)("2.1.1.6", this.getSoftwareVersion())) {
                                    throw new error_2.PropertyNotSupportedError(`Property ${property.name} not supported for station ${this.getSerial()} with software version ${this.getSoftwareVersion()}`);
                                }
                                return { value: value !== undefined ? (0, utils_1.isNotificationSwitchMode)(Number.parseInt(value.value), types_1.NotificationSwitchMode.KEYPAD) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                        }
                    }
                case types_2.CommandType.CMD_HUB_NOTIFY_ALARM:
                    return { value: value !== undefined ? (value.value === "1" ? true : false) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                case types_2.CommandType.CMD_HUB_ALARM_TONE:
                    try {
                        return { value: value !== undefined ? Number.parseInt(value.value) : 1, timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                    catch (error) {
                        this.log.error("Convert CMD_HUB_ALARM_TONE Error:", { property: property, value: value, error: error });
                        return { value: 1, timestamp: 0 };
                    }
                case types_2.CommandType.CMD_SET_HUB_SPK_VOLUME:
                    try {
                        return { value: value !== undefined ? Number.parseInt(value.value) : 26, timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                    catch (error) {
                        this.log.error("Convert CMD_SET_HUB_SPK_VOLUME Error:", { property: property, value: value, error: error });
                        return { value: 26, timestamp: 0 };
                    }
                case types_2.CommandType.CMD_SET_PROMPT_VOLUME:
                    try {
                        return { value: value !== undefined ? Number.parseInt(value.value) : 26, timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                    catch (error) {
                        this.log.error("Convert CMD_SET_PROMPT_VOLUME Error:", { property: property, value: value, error: error });
                        return { value: 26, timestamp: 0 };
                    }
                case types_2.CommandType.CMD_SET_HUB_OSD:
                    try {
                        return { value: value !== undefined ? Number.parseInt(value.value) : 0, timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                    catch (error) {
                        this.log.error("Convert CMD_SET_HUB_OSD Error:", { property: property, value: value, error: error });
                        return { value: 0, timestamp: 0 };
                    }
                case types_2.CommandType.CMD_SET_HUB_ALARM_AUTO_END:
                    return { value: value !== undefined ? value.value !== "0" ? false : true : false, timestamp: value !== undefined ? value.timestamp : 0 };
                case types_2.CommandType.CMD_SET_HUB_ALARM_CLOSE:
                    return { value: value !== undefined ? value.value === "1" ? false : true : false, timestamp: value !== undefined ? value.timestamp : 0 };
            }
            if (property.type === "number") {
                const numericProperty = property;
                try {
                    return { value: value !== undefined ? Number.parseInt(value.value) : (property.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0)), timestamp: value ? value.timestamp : 0 };
                }
                catch (error) {
                    this.log.warn("PropertyMetadataNumeric Convert Error:", { property: property, value: value, error: error });
                    return { value: property.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0), timestamp: value ? value.timestamp : 0 };
                }
            }
            else if (property.type === "boolean") {
                const booleanProperty = property;
                try {
                    return { value: value !== undefined ? (value.value === "1" || value.value.toLowerCase() === "true" ? true : false) : (property.default !== undefined ? booleanProperty.default : false), timestamp: value ? value.timestamp : 0 };
                }
                catch (error) {
                    this.log.warn("PropertyMetadataBoolean Convert Error:", { property: property, value: value, error: error });
                    return { value: property.default !== undefined ? booleanProperty.default : false, timestamp: value ? value.timestamp : 0 };
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
        let metadata = types_1.StationProperties[this.getDeviceType()];
        if (metadata === undefined) {
            metadata = types_1.StationProperties[types_1.DeviceType.STATION];
        }
        if (this.hasDeviceWithType(types_1.DeviceType.KEYPAD)) {
            metadata[types_1.PropertyName.StationGuardMode] = types_1.StationGuardModeKeyPadProperty;
            metadata[types_1.PropertyName.StationCurrentMode] = types_1.StationCurrentModeKeyPadProperty;
            metadata[types_1.PropertyName.StationSwitchModeWithAccessCode] = types_1.StationSwitchModeWithAccessCodeProperty;
            metadata[types_1.PropertyName.StationAutoEndAlarm] = types_1.StationAutoEndAlarmProperty;
            metadata[types_1.PropertyName.StationTurnOffAlarmWithButton] = types_1.StationTurnOffAlarmWithButtonProperty;
        }
        return metadata;
    }
    hasProperty(name) {
        return this.getPropertiesMetadata()[name] !== undefined;
    }
    getCommands() {
        const commands = types_1.StationCommands[this.getDeviceType()];
        if (commands === undefined)
            return [];
        return commands;
    }
    hasCommand(name) {
        return this.getCommands().includes(name);
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
                    if (message.station_guard_mode !== undefined)
                        this.updateRawProperty(types_1.ParamType.GUARD_MODE, { value: message.station_guard_mode.toString(), timestamp: (0, utils_2.convertTimestampMs)(message.event_time) });
                    if (message.station_current_mode !== undefined)
                        this.updateRawProperty(types_2.CommandType.CMD_GET_ALARM_MODE, { value: message.station_current_mode.toString(), timestamp: (0, utils_2.convertTimestampMs)(message.event_time) });
                }
                catch (error) {
                    this.log.debug(`Station ${message.station_sn} MODE_SWITCH event (${message.event_type}) - Error:`, error);
                }
            }
            else if (message.event_type === types_3.CusPushEvent.ALARM && message.station_sn === this.getSerial()) {
                this.log.info("Received push notification for alarm event", { stationSN: message.station_sn, alarmType: message.alarm_type });
                if (message.alarm_type !== undefined)
                    this.emit("alarm event", this, message.alarm_type);
            }
        }
    }
    getP2pDid() {
        return this.rawStation.p2p_did;
    }
    isConnected() {
        return this.p2pSession.isConnected();
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.terminating = true;
            this.log.info(`Disconnect from station ${this.getSerial()}`);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = undefined;
            }
            if (this.p2pSession.isConnected()) {
                yield this.p2pSession.close();
            }
        });
    }
    isEnergySavingDevice() {
        return this.p2pSession.isEnergySavingDevice();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Connecting to station ${this.getSerial()}...`, { p2pConnectionType: types_2.P2PConnectionType[this.p2pConnectionType] });
            this.p2pSession.setConnectionType(this.p2pConnectionType);
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
    onStopRTSPLivestream(channel) {
        this.emit("rtsp livestream stop", this, channel);
    }
    onStartRTSPLivestream(channel) {
        this.emit("rtsp livestream start", this, channel);
    }
    onWifiRssiChanged(channel, rssi) {
        this.emit("wifi rssi", this, channel, rssi, +new Date);
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
            if (!this.hasProperty(types_1.PropertyName.StationGuardMode)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            const property = this.getPropertyMetadata(types_1.PropertyName.StationGuardMode);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, mode);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending guard mode command to station ${this.getSerial()} with value: ${types_1.GuardMode[mode]}`);
            if (((0, utils_1.isGreaterEqualMinVersion)("2.0.7.9", this.getSoftwareVersion()) && !device_1.Device.isIntegratedDeviceBySn(this.getSerial())) || device_1.Device.isSoloCameraBySn(this.getSerial())) {
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
        });
    }
    getCameraInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Sending get camera infos command to station ${this.getSerial()}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_CAMERA_INFO, 255, "", Station.CHANNEL);
        });
    }
    getStorageInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Sending get storage info command to station ${this.getSerial()}`);
            //TODO: Verify channel! Should be 255...
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SDINFO_EX, 0, 0, this.rawStation.member.admin_user_id);
        });
    }
    onAlarmMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`Alarm mode for station ${this.getSerial()} changed to: ${types_1.AlarmMode[mode]}`);
            this.updateRawProperty(types_2.CommandType.CMD_GET_ALARM_MODE, {
                value: mode.toString(),
                timestamp: +new Date
            });
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
        cameraInfo.params.forEach(param => {
            if (param.dev_type === Station.CHANNEL || param.dev_type === Station.CHANNEL_INDOOR) {
                if (this.updateRawProperty(param.param_type, { value: param.param_value, timestamp: timestamp })) {
                    if (param.param_type === types_2.CommandType.CMD_GET_ALARM_MODE) {
                        if (this.getDeviceType() !== types_1.DeviceType.STATION)
                            // Trigger refresh Guard Mode
                            this.api.updateDeviceInfo();
                    }
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
        Object.keys(devices).forEach(device => {
            this.emit("raw device property changed", device, devices[device]);
        });
    }
    onCommandResponse(result) {
        this.log.debug("Got p2p command response", { station: this.getSerial(), commandType: result.command_type, channel: result.channel, returnCodeName: types_2.ErrorCode[result.return_code], returnCode: result.return_code });
        this.emit("command result", this, result);
    }
    onConnect(address) {
        this.terminating = false;
        this.resetCurrentDelay();
        this.log.info(`Connected to station ${this.getSerial()} on host ${address.host} and port ${address.port}`);
        this.emit("connect", this);
    }
    onDisconnect() {
        this.log.info(`Disconnected from station ${this.getSerial()}`);
        this.emit("close", this);
        if (!this.isEnergySavingDevice() && !this.terminating)
            this.scheduleReconnect();
    }
    onTimeout() {
        this.log.info(`Timeout connecting to station ${this.getSerial()}`);
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
        if (!this.reconnectTimeout) {
            const delay = this.getCurrentDelay();
            this.log.debug(`Schedule reconnect to station ${this.getSerial()}...`, { delay: delay });
            this.reconnectTimeout = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                this.reconnectTimeout = undefined;
                this.connect();
            }), delay);
        }
    }
    rebootHUB() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasCommand(types_1.CommandName.StationReboot)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending reboot command to station ${this.getSerial()}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_HUB_REBOOT, 0, this.rawStation.member.admin_user_id, Station.CHANNEL);
        });
    }
    setStatusLed(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceStatusLed)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending status led command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isCamera2Product() || device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E) {
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
                        "transaction": `${new Date().getTime()}`,
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
            if (!device.hasProperty(types_1.PropertyName.DeviceAutoNightvision)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending autonightvision command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_IRCUT_SWITCH, value === true ? 1 : 0, device.getChannel(), "", "", device.getChannel());
        });
    }
    setNightVision(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNightvision)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending nightvision command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                "account_id": this.rawStation.member.admin_user_id,
                "cmd": types_2.CommandType.CMD_SET_NIGHT_VISION_TYPE,
                "mValue3": 0,
                "payload": {
                    "channel": device.getChannel(),
                    "night_sion": value,
                }
            }), device.getChannel());
        });
    }
    setMotionDetection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceMotionDetection)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending motion detection command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
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
            if (!device.hasProperty(types_1.PropertyName.DeviceSoundDetection)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending sound detection command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
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
    setSoundDetectionType(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceSoundDetectionType)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceSoundDetectionType);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending sound detection type command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_TYPE,
                "data": {
                    "enable": 0,
                    "index": 0,
                    "status": 0,
                    "type": value,
                    "value": 0,
                    "voiceID": 0,
                    "zonecount": 0
                }
            }), device.getChannel());
        });
    }
    setSoundDetectionSensitivity(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceSoundDetectionSensitivity)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceSoundDetectionSensitivity);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending sound detection sensitivity command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_SOUND_SENSITIVITY_IDX,
                "data": {
                    "enable": 0,
                    "index": value,
                    "status": 0,
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
            if (!device.hasProperty(types_1.PropertyName.DevicePetDetection)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending pet detection command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
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
    panAndTilt(device, direction, command = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: A Floodlight model seems to support this feature
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasCommand(types_1.CommandName.DevicePanAndTilt)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!(direction in types_2.PanTiltDirection)) {
                throw new error_1.InvalidCommandValueError(`Value "${direction}" isn't a valid value for command "panAndTilt"`);
            }
            this.log.debug(`Sending pan and tilt command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${types_2.PanTiltDirection[direction]}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_ROTATE,
                "data": {
                    "cmd_type": command,
                    "rotate_type": direction,
                }
            }), device.getChannel());
        });
    }
    switchLight(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLight)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending switch light command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight() || device.isSoloCameraSpotlight1080() || device.isSoloCameraSpotlight2k() ||
                device.isSoloCameraSpotlightSolar() || device.isCamera2C() || device.isCamera2CPro() ||
                device.isIndoorOutdoorCamera1080p() || device.isIndoorOutdoorCamera2k()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_FLOODLIGHT_MANUAL_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setMotionDetectionSensitivity(device, sensitivity) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceMotionDetectionSensitivity);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, sensitivity);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending motion detection sensitivity command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${sensitivity}`);
            if (device.isFloodLight() || device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_SENSITIVITY_IDX,
                    "data": {
                        "enable": 0,
                        "index": sensitivity,
                        "status": 0,
                        "type": 0,
                        "value": 0,
                        "voiceID": 0,
                        "zonecount": 0
                    }
                }), device.getChannel());
            }
            else if (device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_SET_PIR_SENSITIVITY,
                    "data": {
                        "value": sensitivity,
                    }
                }), device.getChannel());
            }
            else if (device.isBatteryDoorbell2() || device.isBatteryDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_MOTION_SENSITIVITY,
                    "payload": {
                        "channel": device.getChannel(),
                        "sensitivity": sensitivity,
                    }
                }), device.getChannel());
            }
            else if (device.isCamera2Product()) {
                let convertedValue;
                switch (sensitivity) {
                    case 1:
                        convertedValue = 192;
                        break;
                    case 2:
                        convertedValue = 118;
                        break;
                    case 3:
                        convertedValue = 72;
                        break;
                    case 4:
                        convertedValue = 46;
                        break;
                    case 5:
                        convertedValue = 30;
                        break;
                    case 6:
                        convertedValue = 20;
                        break;
                    case 7:
                        convertedValue = 14;
                        break;
                    default:
                        convertedValue = 46;
                        break;
                }
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_PIRSENSITIVITY, convertedValue, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                const convertedValue = 200 - ((sensitivity - 1) * 2);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_PIRSENSITIVITY, convertedValue, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                let intMode;
                let intSensitivity;
                switch (sensitivity) {
                    case 1:
                        intMode = 3;
                        intSensitivity = 2;
                        break;
                    case 2:
                        intMode = 1;
                        intSensitivity = 1;
                        break;
                    case 3:
                        intMode = 1;
                        intSensitivity = 2;
                        break;
                    case 4:
                        intMode = 1;
                        intSensitivity = 3;
                        break;
                    case 5:
                        intMode = 2;
                        intSensitivity = 1;
                        break;
                    default:
                        intMode = 1;
                        intSensitivity = 3;
                        break;
                }
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_MOTION_DETECTION_PACKAGE,
                    "data": {
                        "mode": intMode,
                        "sensitivity": intSensitivity,
                    }
                }), device.getChannel());
            }
        });
    }
    setMotionDetectionType(device, type) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceMotionDetectionType)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceMotionDetectionType);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, type);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending motion detection type command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${type}`);
            if (device.isFloodLight() || device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_TYPE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": type,
                        "value": 0,
                        "voiceID": 0,
                        "zonecount": 0
                    }
                }), device.getChannel());
            }
            else if (device.isCamera2Product() || device.isBatteryDoorbell() || device.isBatteryDoorbell2() || device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E || device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_DEV_PUSHMSG_MODE, type, this.rawStation.member.admin_user_id, device.getChannel());
            }
        });
    }
    setMotionTracking(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceMotionTracking)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending motion tracking command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_PAN_MOTION_TRACK,
                "data": {
                    "enable": 0,
                    "index": 0,
                    "status": 0,
                    "type": 0,
                    "value": value === true ? 1 : 0,
                    "voiceID": 0,
                    "zonecount": 0,
                    "transaction": `${new Date().getTime()}`,
                }
            }), device.getChannel());
        });
    }
    setPanAndTiltRotationSpeed(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRotationSpeed)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceMotionDetectionType);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending pan and tilt rotation speed command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                "commandType": types_2.CommandType.CMD_INDOOR_PAN_SPEED,
                "data": {
                    "enable": 0,
                    "index": 0,
                    "status": 0,
                    "type": 0,
                    "value": value,
                    "voiceID": 0,
                    "zonecount": 0,
                    "transaction": `${new Date().getTime()}`,
                }
            }), device.getChannel());
        });
    }
    setMicMute(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceMicrophone)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending mic mute command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEV_MIC_MUTE, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setAudioRecording(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceAudioRecording)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending audio recording command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight() || device.isIndoorCamera() || device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_SET_RECORD_AUDIO_ENABLE,
                    "data": {
                        "enable": value === true ? 1 : 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
            else if (device.isCamera2Product() || device.isBatteryDoorbell() || device.isBatteryDoorbell2() || device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_AUDIO_MUTE_RECORD,
                    "mValue3": 0,
                    "payload": {
                        "channel": device.getChannel(),
                        "record_mute": value === true ? 0 : 1,
                    }
                }), device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_AUDIO_RECORDING,
                    "data": {
                        "status": value === true ? 1 : 0,
                    }
                }), device.getChannel());
            }
        });
    }
    enableSpeaker(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceSpeaker)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending enable speaker command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEV_SPEAKER_MUTE, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setSpeakerVolume(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceSpeakerVolume)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceSpeakerVolume);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending speaker volume command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEV_SPEAKER_VOLUME, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setRingtoneVolume(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRingtoneVolume)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceRingtoneVolume);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending ringtone volume command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_SET_RINGTONE_VOLUME, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_RINGTONE_VOLUME,
                    "data": {
                        "volume": value,
                    }
                }), device.getChannel());
            }
        });
    }
    enableIndoorChime(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceChimeIndoor)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending enable indoor chime command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_MECHANICAL_CHIME_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_INDOOR_CHIME,
                    "data": {
                        "status": value === true ? 1 : 0,
                    }
                }), device.getChannel());
            }
        });
    }
    enableHomebaseChime(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceChimeHomebase)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending enable homebase chime command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_CHIME_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setHomebaseChimeRingtoneVolume(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceChimeHomebaseRingtoneVolume)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceChimeHomebaseRingtoneVolume);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending homebase chime ringtone volume command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_BAT_DOORBELL_DINGDONG_V,
                    "mValue3": 0,
                    "payload": {
                        "dingdong_volume": value,
                    }
                }), device.getChannel());
            }
        });
    }
    setHomebaseChimeRingtoneType(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceChimeHomebaseRingtoneType)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceChimeHomebaseRingtoneType);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending homebase chime ringtone type command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_BAT_DOORBELL_DINGDONG_R,
                    "mValue3": 0,
                    "payload": {
                        "dingdong_ringtone": value,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationType(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationType)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceNotificationType);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification type command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight() || device.isIndoorCamera() || device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_PUSH_NOTIFY_TYPE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
            else if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
                    "mValue3": 0,
                    "payload": {
                        "notification_motion_onoff": device.getPropertyValue(types_1.PropertyName.DeviceNotificationMotion).value,
                        "notification_ring_onoff": device.getPropertyValue(types_1.PropertyName.DeviceNotificationRing).value,
                        "notification_style": value,
                    }
                }), device.getChannel());
            }
            else if (device.isCamera2Product() || device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_PUSH_EFFECT,
                    "mValue3": 0,
                    "payload": {
                        "notification_style": value,
                    }
                }), device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_NOTIFICATION_TYPE,
                    "data": {
                        "style": value,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationPerson(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationPerson)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification person command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_AI_PERSON_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationPet(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationPet)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification pet command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_AI_PET_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationAllOtherMotion(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationAllOtherMotion)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification all other motion command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_AI_MOTION_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationAllSound(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationAllSound)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification all sound command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_AI_SOUND_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationCrying(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationCrying)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification crying command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_2.CommandType.CMD_INDOOR_AI_CRYING_ENABLE,
                    "data": {
                        "enable": 0,
                        "index": 0,
                        "status": 0,
                        "type": 0,
                        "value": value === true ? 1 : 0,
                        "voiceID": 0,
                        "zonecount": 0,
                        "transaction": `${new Date().getTime()}`,
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationRing(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationRing)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification ring command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
                    "mValue3": 0,
                    "payload": {
                        "notification_ring_onoff": value === true ? 1 : 0,
                        "notification_motion_onoff": device.getPropertyValue(types_1.PropertyName.DeviceNotificationMotion).value,
                        "notification_style": device.getPropertyValue(types_1.PropertyName.DeviceNotificationType).value,
                    }
                }), device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_NOTIFICATION_RING,
                    "data": {
                        "type": value === true ? (device.getPropertyValue(types_1.PropertyName.DeviceNotificationMotion).value === true ? 3 : 1) : (device.getPropertyValue(types_1.PropertyName.DeviceNotificationMotion).value === true ? 2 : 0),
                    }
                }), device.getChannel());
            }
        });
    }
    setNotificationMotion(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceNotificationMotion)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending notification motion command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
                    "mValue3": 0,
                    "payload": {
                        "notification_motion_onoff": value === true ? 1 : 0,
                        "notification_ring_onoff": device.getPropertyValue(types_1.PropertyName.DeviceNotificationRing).value,
                        "notification_style": device.getPropertyValue(types_1.PropertyName.DeviceNotificationType).value,
                    }
                }), device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_NOTIFICATION_RING,
                    "data": {
                        "type": value === true ? (device.getPropertyValue(types_1.PropertyName.DeviceNotificationRing).value === true ? 3 : 2) : (device.getPropertyValue(types_1.PropertyName.DeviceNotificationRing).value === true ? 1 : 0),
                    }
                }), device.getChannel());
            }
        });
    }
    setPowerSource(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DevicePowerSource)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DevicePowerSource);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending power source command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                "account_id": this.rawStation.member.admin_user_id,
                "cmd": types_2.CommandType.CMD_SET_POWER_CHARGE,
                "mValue3": 0,
                "payload": {
                    "charge_mode": value,
                }
            }), device.getChannel());
        });
    }
    setPowerWorkingMode(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DevicePowerWorkingMode)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DevicePowerWorkingMode);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending power working mode command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_PIR_POWERMODE, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setRecordingClipLength(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRecordingClipLength)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceRecordingClipLength);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending recording clip length command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_DEV_RECORD_TIMEOUT, value, this.rawStation.member.admin_user_id, device.getChannel());
        });
    }
    setRecordingRetriggerInterval(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRecordingRetriggerInterval)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceRecordingRetriggerInterval);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending recording retrigger interval command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_DEV_RECORD_INTERVAL, value, this.rawStation.member.admin_user_id, device.getChannel());
        });
    }
    setRecordingEndClipMotionStops(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRecordingEndClipMotionStops)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending recording end clip motion stops command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_DEV_RECORD_AUTOSTOP, value === true ? 0 : 1, this.rawStation.member.admin_user_id, device.getChannel());
        });
    }
    setVideoStreamingQuality(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceVideoStreamingQuality)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceVideoStreamingQuality);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending video streaming quality command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera() || device.isSoloCameras() || device.isFloodLight() || device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_VIDEO_QUALITY,
                    "data": {
                        "quality": value,
                    }
                }), device.getChannel());
            }
            else if (device.isBatteryDoorbell() || device.isBatteryDoorbell2() || device.isCamera2CPro()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_VIDEO_QUALITY, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setVideoRecordingQuality(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Check if other devices support this functionality
            //TODO: Add support for other 2k devices
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceVideoRecordingQuality)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceVideoRecordingQuality);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending video recording quality command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isIndoorCamera() || device.isWiredDoorbell() || device.isFloodLight() || device.isSoloCameras()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_VIDEO_RECORDING_QUALITY,
                    "data": {
                        "quality": value,
                    }
                }), device.getChannel());
            }
            else if (device.isCamera2CPro()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_RECORD_QUALITY,
                    "mValue3": 0,
                    "payload": {
                        "record_quality": value,
                    }
                }), device.getChannel());
            }
        });
    }
    setWDR(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceVideoWDR)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending wdr command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_WDR_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setFloodlightLightSettingsEnable(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsEnable)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending floodlight light settings enable command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_FLOODLIGHT_TOTAL_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setFloodlightLightSettingsBrightnessManual(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsBrightnessManual)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceLightSettingsBrightnessManual);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending floodlight light settings brightness manual command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight() || device.isSoloCameraSpotlight1080() || device.isSoloCameraSpotlight2k() ||
                device.isSoloCameraSpotlightSolar() || device.isCamera2C() || device.isCamera2CPro() ||
                device.isIndoorOutdoorCamera1080p() || device.isIndoorOutdoorCamera2k()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_FLOODLIGHT_BRIGHT_VALUE, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setFloodlightLightSettingsBrightnessMotion(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsBrightnessMotion)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceLightSettingsBrightnessMotion);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending floodlight light settings brightness motion command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_PIR, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setFloodlightLightSettingsBrightnessSchedule(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsBrightnessSchedule)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceLightSettingsBrightnessSchedule);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending floodlight light settings brightness schedule command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_SCH, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setFloodlightLightSettingsMotionTriggered(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsMotionTriggered)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending floodlight light settings motion triggered command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_LIGHT_CTRL_PIR_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setFloodlightLightSettingsMotionTriggeredDistance(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsMotionTriggeredDistance)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceLightSettingsMotionTriggeredDistance);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!Object.values(types_1.FloodlightMotionTriggeredDistance).includes(value)) {
                throw new error_1.InvalidPropertyValueError(`Value "${value}" isn't a valid value`);
            }
            this.log.debug(`Sending floodlight light settings motion triggered distance command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_PIRSENSITIVITY, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setFloodlightLightSettingsMotionTriggeredTimer(device, seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceLightSettingsMotionTriggeredTimer)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceLightSettingsMotionTriggeredTimer);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, seconds);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending floodlight light settings motion triggered timer command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${seconds}`);
            if (device.isFloodLight()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_LIGHT_CTRL_PIR_TIME, seconds, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    triggerStationAlarmSound(seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasCommand(types_1.CommandName.StationTriggerAlarmSound)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending trigger station alarm sound command to station ${this.getSerial()} with value: ${seconds}`);
            if (!(0, utils_1.isGreaterEqualMinVersion)("2.0.7.9", this.getSoftwareVersion()) || device_1.Device.isIntegratedDeviceBySn(this.getSerial())) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_TONE_FILE, 2, seconds, this.rawStation.member.admin_user_id, "", Station.CHANNEL);
            }
            else {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_TONE_FILE,
                    "mValue3": 0,
                    "payload": {
                        "time_out": seconds,
                        "user_name": this.rawStation.member.nick_name,
                    }
                }), Station.CHANNEL);
            }
        });
    }
    resetStationAlarmSound() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.triggerStationAlarmSound(0);
        });
    }
    triggerDeviceAlarmSound(device, seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasCommand(types_1.CommandName.DeviceTriggerAlarmSound)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending trigger device alarm sound command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${seconds}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_TONE_FILE, seconds, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    resetDeviceAlarmSound(device) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.triggerDeviceAlarmSound(device, 0);
        });
    }
    setStationAlarmRingtoneVolume(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationAlarmVolume)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            const property = this.getPropertyMetadata(types_1.PropertyName.StationAlarmVolume);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station alarm ringtone volume command to station ${this.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_SET_HUB_SPK_VOLUME, value, this.rawStation.member.admin_user_id, Station.CHANNEL);
        });
    }
    setStationAlarmTone(tone) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationAlarmTone)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            const property = this.getPropertyMetadata(types_1.PropertyName.StationAlarmTone);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, tone);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station alarm tone command to station ${this.getSerial()} with value: ${types_1.AlarmTone[tone]}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                "account_id": this.rawStation.member.admin_user_id,
                "cmd": types_2.CommandType.CMD_HUB_ALARM_TONE,
                "mValue3": 0,
                "payload": {
                    "type": tone,
                }
            }), Station.CHANNEL);
        });
    }
    setStationPromptVolume(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationPromptVolume)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            const property = this.getPropertyMetadata(types_1.PropertyName.StationPromptVolume);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station prompt volume command to station ${this.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                "account_id": this.rawStation.member.admin_user_id,
                "cmd": types_2.CommandType.CMD_SET_PROMPT_VOLUME,
                "mValue3": 0,
                "payload": {
                    "value": value,
                }
            }), Station.CHANNEL);
        });
    }
    setStationNotificationSwitchMode(mode, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((!this.hasProperty(types_1.PropertyName.StationNotificationSwitchModeApp) && mode === types_1.NotificationSwitchMode.APP) ||
                (!this.hasProperty(types_1.PropertyName.StationNotificationSwitchModeGeofence) && mode === types_1.NotificationSwitchMode.GEOFENCE) ||
                (!this.hasProperty(types_1.PropertyName.StationNotificationSwitchModeKeypad) && mode === types_1.NotificationSwitchMode.KEYPAD) ||
                (!this.hasProperty(types_1.PropertyName.StationNotificationSwitchModeSchedule) && mode === types_1.NotificationSwitchMode.SCHEDULE)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station notification switch mode command to station ${this.getSerial()} with value: ${value}`);
            if ((0, utils_1.isGreaterEqualMinVersion)("2.1.1.6", this.getSoftwareVersion())) {
                let oldvalue = 0;
                const rawproperty = this.getRawProperty(types_2.CommandType.CMD_HUB_NOTIFY_MODE);
                if (rawproperty !== undefined) {
                    try {
                        oldvalue = Number.parseInt(rawproperty.value);
                    }
                    catch (error) {
                    }
                }
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_HUB_NOTIFY_MODE,
                    "mValue3": 0,
                    "payload": {
                        "arm_push_mode": (0, utils_1.switchNotificationMode)(oldvalue, mode, value),
                        "notify_alarm_delay": this.getPropertyValue(types_1.PropertyName.StationNotificationStartAlarmDelay) !== undefined ? (this.getPropertyValue(types_1.PropertyName.StationNotificationStartAlarmDelay).value === true ? 1 : 0) : 0,
                        "notify_mode": 0,
                    }
                }), Station.CHANNEL);
            }
            else {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_HUB_NOTIFY_MODE,
                    "mValue3": 0,
                    "payload": {
                        //"arm_push_mode": 0,
                        "notify_alarm_delay": this.getPropertyValue(types_1.PropertyName.StationNotificationStartAlarmDelay) !== undefined ? (this.getPropertyValue(types_1.PropertyName.StationNotificationStartAlarmDelay).value === true ? 1 : 0) : 0,
                        "notify_mode": value === true ? 1 : 0, // 0 or 1
                    }
                }), Station.CHANNEL);
            }
        });
    }
    setStationNotificationStartAlarmDelay(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationNotificationStartAlarmDelay)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            let pushmode = 0;
            const rawproperty = this.getRawProperty(types_2.CommandType.CMD_HUB_NOTIFY_MODE);
            if (rawproperty !== undefined) {
                try {
                    pushmode = Number.parseInt(rawproperty.value);
                }
                catch (error) {
                }
            }
            this.log.debug(`Sending station notification start alarm delay command to station ${this.getSerial()} with value: ${value}`);
            if ((0, utils_1.isGreaterEqualMinVersion)("2.1.1.6", this.getSoftwareVersion())) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_HUB_NOTIFY_ALARM,
                    "mValue3": 0,
                    "payload": {
                        "arm_push_mode": pushmode,
                        "notify_alarm_delay": value === true ? 1 : 0,
                        "notify_mode": 0,
                    }
                }), Station.CHANNEL);
            }
            else {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_HUB_NOTIFY_MODE,
                    "mValue3": 0,
                    "payload": {
                        //"arm_push_mode": 0,
                        "notify_alarm_delay": value === true ? 1 : 0,
                        "notify_mode": pushmode, // 0 or 1
                    }
                }), Station.CHANNEL);
            }
        });
    }
    setStationTimeFormat(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationTimeFormat)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            const property = this.getPropertyMetadata(types_1.PropertyName.StationTimeFormat);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station time format command to station ${this.getSerial()} with value: ${types_1.TimeFormat[value]}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_SET_HUB_OSD, value, this.rawStation.member.admin_user_id, Station.CHANNEL);
        });
    }
    setRTSPStream(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRTSPStream)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending rtsp stream command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_NAS_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setAntiTheftDetection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceAntitheftDetection)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending antitheft detection command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_EAS_SWITCH, value === true ? 1 : 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    setWatermark(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceWatermark)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceWatermark);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (device.isCamera2Product()) {
                if (!Object.values(types_2.WatermarkSetting3).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values:`, types_2.WatermarkSetting3);
                    return;
                }
                this.log.debug(`Sending watermark command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${types_2.WatermarkSetting3[value]}`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isIndoorCamera() || device.isFloodLight()) {
                if (!Object.values(types_2.WatermarkSetting4).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values:`, types_2.WatermarkSetting4);
                    return;
                }
                this.log.debug(`Sending watermark command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${types_2.WatermarkSetting4[value]}`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isSoloCameras() || device.isWiredDoorbell()) {
                if (!Object.values(types_2.WatermarkSetting1).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values:`, types_2.WatermarkSetting1);
                    return;
                }
                this.log.debug(`Sending watermark command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${types_2.WatermarkSetting1[value]}`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, 0, this.rawStation.member.admin_user_id, "", 0);
            }
            else if (device.isBatteryDoorbell() || device.isBatteryDoorbell2() || device.getDeviceType() === types_1.DeviceType.CAMERA || device.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                if (!Object.values(types_2.WatermarkSetting2).includes(value)) {
                    this.log.error(`The device ${device.getSerial()} accepts only this type of values: `, types_2.WatermarkSetting2);
                    return;
                }
                this.log.debug(`Sending matermark command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${types_2.WatermarkSetting2[value]}`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SET_DEVS_OSD, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    enableDevice(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceEnabled)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            let param_value = value === true ? 0 : 1;
            if (device.isIndoorCamera() || device.isWiredDoorbell() || device.isFloodLight())
                param_value = value === true ? 1 : 0;
            this.log.debug(`Sending enable device command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_DEVS_SWITCH, param_value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    startDownload(device, path, cipher_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasCommand(types_1.CommandName.DeviceStartDownload)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const cipher = yield this.api.getCipher(cipher_id, this.rawStation.member.admin_user_id);
            if (Object.keys(cipher).length > 0) {
                this.log.debug(`Sending start download command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${path}`);
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
            if (!device.hasCommand(types_1.CommandName.DeviceCancelDownload)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending cancel download command to station ${this.getSerial()} for device ${device.getSerial()}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_DOWNLOAD_CANCEL, device.getChannel(), this.rawStation.member.admin_user_id, device.getChannel());
        });
    }
    startLivestream(device, videoCodec = types_2.VideoCodec.H264) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasCommand(types_1.CommandName.DeviceStartLivestream)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (this.isLiveStreaming(device)) {
                throw new error_2.LivestreamAlreadyRunningError(`Livestream for device ${device.getSerial()} is already running`);
            }
            this.log.debug(`Sending start livestream command to station ${this.getSerial()} for device ${device.getSerial()}`);
            const rsa_key = this.p2pSession.getRSAPrivateKey();
            if (device.isWiredDoorbell() || device.isFloodLight() || device.isIndoorCamera()) {
                this.log.debug(`Using CMD_DOORBELL_SET_PAYLOAD for station ${this.getSerial()} (main_sw_version: ${this.getSoftwareVersion()})`);
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_START_LIVESTREAM,
                    "data": {
                        "account_id": this.rawStation.member.admin_user_id,
                        "encryptkey": rsa_key === null || rsa_key === void 0 ? void 0 : rsa_key.exportKey("components-public").n.slice(1).toString("hex"),
                        "streamtype": videoCodec
                    }
                }), device.getChannel());
            }
            else if (device.isSoloCameras()) {
                this.log.debug(`Using CMD_DOORBELL_SET_PAYLOAD (solo cams) for station ${this.getSerial()} (main_sw_version: ${this.getSoftwareVersion()})`);
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_START_LIVESTREAM,
                    "data": {
                        "accountId": this.rawStation.member.admin_user_id,
                        "encryptkey": rsa_key === null || rsa_key === void 0 ? void 0 : rsa_key.exportKey("components-public").n.slice(1).toString("hex"),
                        "streamtype": videoCodec
                    }
                }), device.getChannel());
            }
            else {
                if ((device_1.Device.isIntegratedDeviceBySn(this.getSerial()) || !(0, utils_1.isGreaterEqualMinVersion)("2.0.9.7", this.getSoftwareVersion())) && (!this.getSerial().startsWith("T8420") || !(0, utils_1.isGreaterEqualMinVersion)("1.0.0.25", this.getSoftwareVersion()))) {
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
                            "streamtype": videoCodec === types_2.VideoCodec.H264 ? 1 : 2,
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
            if (!device.hasCommand(types_1.CommandName.DeviceStopLivestream)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            if (!this.isLiveStreaming(device)) {
                throw new error_2.LivestreamNotRunningError(`Livestream for device ${device.getSerial()} is not running`);
            }
            this.log.debug(`Sending stop livestream command to station ${this.getSerial()} for device ${device.getSerial()}`);
            yield this.p2pSession.sendCommandWithInt(types_2.CommandType.CMD_STOP_REALTIME_MEDIA, device.getChannel(), undefined, device.getChannel());
        });
    }
    isLiveStreaming(device) {
        /*if (!this.p2pSession.isConnected()) {
            return false
        }
        if (device.getStationSerial() !== this.getSerial())
            return false;*/
        return this.p2pSession.isLiveStreaming(device.getChannel());
    }
    isDownloading(device) {
        /*if (!this.p2pSession.isConnected()) {
            return false
        }
        if (device.getStationSerial() !== this.getSerial())
            return false;*/
        return this.p2pSession.isDownloading(device.getChannel());
    }
    quickResponse(device, voice_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasCommand(types_1.CommandName.DeviceQuickResponse)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending quick response command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${voice_id}`);
            if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
                this.log.debug(`Using CMD_BAT_DOORBELL_QUICK_RESPONSE for station ${this.getSerial()}`);
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_BAT_DOORBELL_QUICK_RESPONSE, voice_id, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
            else if (device.isWiredDoorbell()) {
                this.log.debug(`Using CMD_DOORBELL_SET_PAYLOAD for station ${this.getSerial()}`);
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_QUICK_RESPONSE,
                    "data": {
                        "voiceID": voice_id
                    }
                }), device.getChannel());
            }
        });
    }
    setChirpVolume(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceChirpVolume)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceChirpVolume);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending chirp volume command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isEntrySensor()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SENSOR_SET_CHIRP_VOLUME,
                    "mValue3": 0,
                    "payload": {
                        "channel": device.getChannel(),
                        "volume": value,
                    }
                }), device.getChannel());
            }
        });
    }
    setChirpTone(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceChirpTone)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceChirpTone);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending chirp tone command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isEntrySensor()) {
                yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_SENSOR_SET_CHIRP_TONE, value, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
            }
        });
    }
    setHDR(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceVideoHDR)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending hdr command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_HDR,
                    "data": {
                        "status": value === true ? 1 : 0,
                    }
                }), device.getChannel());
            }
        });
    }
    setDistortionCorrection(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceVideoDistortionCorrection)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending distortion correction command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_DISTORTION_CORRECTION,
                    "data": {
                        "status": value === true ? 1 : 0,
                    }
                }), device.getChannel());
            }
        });
    }
    setRingRecord(device, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceVideoRingRecord)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const property = device.getPropertyMetadata(types_1.PropertyName.DeviceVideoRingRecord);
            if (property !== undefined) {
                (0, utils_4.validValue)(property, value);
            }
            else {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending ring record command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isWiredDoorbell()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_DOORBELL_SET_PAYLOAD, JSON.stringify({
                    "commandType": types_1.ParamType.COMMAND_VIDEO_RING_RECORD,
                    "data": {
                        "status": value
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
            if (!device.hasProperty(types_1.PropertyName.DeviceLocked)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            this.log.debug(`Sending lock device command to station ${this.getSerial()} for device ${device.getSerial()} with value: ${value}`);
            if (device.isLockBasicNoFinger() || device.isLockBasic()) {
                const key = (0, utils_3.generateLockAESKey)(this.rawStation.member.admin_user_id, this.getSerial());
                const iv = (0, utils_3.getLockVectorBytes)(this.getSerial());
                const lockCmd = device_1.Lock.encodeESLCmdOnOff(Number.parseInt(this.rawStation.member.short_user_id), this.rawStation.member.nick_name, value);
                const payload = {
                    channel: device.getChannel(),
                    lock_cmd: types_2.ESLInnerCommand.ON_OFF_LOCK,
                    lock_payload: lockCmd.toString("base64"),
                    seq_num: this.p2pSession.incLockSequenceNumber()
                };
                const encPayload = (0, utils_3.encryptLockAESData)(key, iv, (0, utils_3.encodeLockPayload)(JSON.stringify(payload)));
                this.log.debug("Locking/unlocking device...", { station: this.getSerial(), device: device.getSerial(), admin_user_id: this.rawStation.member.admin_user_id, payload: payload, encPayload: encPayload.toString("hex") });
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_DOORLOCK_DATA_PASS_THROUGH,
                    "mValue3": 0,
                    "payload": {
                        "payload": encPayload.toString("base64")
                    }
                }), device.getChannel());
            } /*else if (device.isLockAdvanced()) {
                const publicKey = await this.api.getPublicKey(device.getSerial(), PublicKeyType.LOCK);
                const encPublicKey = encryptLockBasicPublicKey(generateLockBasicPublicKeyAESKey(this.rawStation.member.admin_user_id), Buffer.from(publicKey, "hex"));
    
                //TODO: Generate key from encPublicKey using ECC - ECIES (aes-cbc 128, HMAC_SHA_256_256) - KDF!
                // KDF: HKDF SHA256 - RFC 5869
    
                const key = generateLockBasicAESKey();
                const iv = getLockVectorBytes(this.getSerial());
                const payload: LockBasicOnOffRequestPayload = {
                    shortUserId: this.rawStation.member.short_user_id,
                    slOperation: value === true ? 1 : 0,
                    userId: this.rawStation.member.admin_user_id,
                    userName: this.rawStation.member.nick_name,
                };
    
                const encPayload = encryptLockAESData(key, iv, encodeLockPayload(JSON.stringify(payload)));
    
                await this.p2pSession.sendCommandWithStringPayload(CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "key": "",  //TODO: Missing key generation!
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": CommandType.P2P_ON_OFF_LOCK,
                    "mValue3": 0,
                    "payload": {
                        "payload": encPayload.toString("base64")
                    }
                }), device.getChannel());
            }*/
        });
    }
    setStationSwitchModeWithAccessCode(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationNotificationSwitchModeGeofence)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station switch mode with access code command to station ${this.getSerial()} with value: ${value}`);
            if (this.isStation()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_KEYPAD_PSW_OPEN,
                    "mValue3": 0,
                    "payload": {
                        "psw_required": value === true ? 1 : 0,
                    }
                }), Station.CHANNEL);
            }
        });
    }
    setStationAutoEndAlarm(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationAutoEndAlarm)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station auto end alarm command to station ${this.getSerial()} with value: ${value}`);
            if (this.isStation()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_HUB_ALARM_AUTO_END,
                    "mValue3": 0,
                    "payload": {
                        "value": value === true ? 0 : 2147483647,
                    }
                }), Station.CHANNEL);
            }
        });
    }
    setStationTurnOffAlarmWithButton(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasProperty(types_1.PropertyName.StationTurnOffAlarmWithButton)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${this.getSerial()}`);
            }
            this.log.debug(`Sending station turn off alarm with button command to station ${this.getSerial()} with value: ${value}`);
            if (this.isStation()) {
                yield this.p2pSession.sendCommandWithStringPayload(types_2.CommandType.CMD_SET_PAYLOAD, JSON.stringify({
                    "account_id": this.rawStation.member.admin_user_id,
                    "cmd": types_2.CommandType.CMD_SET_HUB_ALARM_CLOSE,
                    "mValue3": 0,
                    "payload": {
                        "value": value === true ? 0 : 1,
                    }
                }), Station.CHANNEL);
            }
        });
    }
    startRTSPStream(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRTSPStream)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const rtspStreamProperty = device.getPropertyValue(types_1.PropertyName.DeviceRTSPStream);
            if (rtspStreamProperty !== undefined && rtspStreamProperty.value !== true) {
                throw new error_1.RTSPPropertyNotEnabled(`RTSP setting for device ${device.getSerial()} must be enabled first, to enable this functionality!`);
            }
            this.log.debug(`Start RTSP stream command to station ${this.getSerial()} for device ${device.getSerial()}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_NAS_TEST, 1, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    stopRTSPStream(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.getStationSerial() !== this.getSerial()) {
                throw new error_1.WrongStationError(`Device ${device.getSerial()} is not managed by this station ${this.getSerial()}`);
            }
            if (!device.hasProperty(types_1.PropertyName.DeviceRTSPStream)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const rtspStreamProperty = device.getPropertyValue(types_1.PropertyName.DeviceRTSPStream);
            if (rtspStreamProperty !== undefined && rtspStreamProperty.value !== true) {
                throw new error_1.RTSPPropertyNotEnabled(`RTSP setting for device ${device.getSerial()} must be enabled first, to enable this functionality!`);
            }
            this.log.debug(`Stop RTSP stream command to station ${this.getSerial()} for device ${device.getSerial()}`);
            yield this.p2pSession.sendCommandWithIntString(types_2.CommandType.CMD_NAS_TEST, 0, device.getChannel(), this.rawStation.member.admin_user_id, "", device.getChannel());
        });
    }
    isRTSPLiveStreaming(device) {
        return this.p2pSession.isRTSPLiveStreaming(device.getChannel());
    }
    setConnectionType(type) {
        this.p2pConnectionType = type;
    }
    getConnectionType() {
        return this.p2pConnectionType;
    }
    onRuntimeState(channel, batteryLevel, temperature) {
        this.emit("runtime state", this, channel, batteryLevel, temperature, +new Date);
    }
    onChargingState(channel, chargeType, batteryLevel) {
        this.emit("charging state", this, channel, chargeType, batteryLevel, +new Date);
    }
    hasDevice(deviceSN) {
        if (this.rawStation.devices)
            for (const device of this.rawStation.devices) {
                if (device.device_sn === deviceSN)
                    return true;
            }
        return false;
    }
    hasDeviceWithType(deviceType) {
        if (this.rawStation.devices)
            for (const device of this.rawStation.devices) {
                if (device.device_type === deviceType)
                    return true;
            }
        return false;
    }
}
exports.Station = Station;
Station.CHANNEL = 255;
Station.CHANNEL_INDOOR = 1000;
