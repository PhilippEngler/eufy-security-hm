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
exports.UnknownDevice = exports.Keypad = exports.Lock = exports.MotionSensor = exports.EntrySensor = exports.Sensor = exports.FloodlightCamera = exports.BatteryDoorbellCamera = exports.DoorbellCamera = exports.IndoorCamera = exports.SoloCamera = exports.Camera = exports.CommonDevice = exports.Device = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const types_1 = require("./types");
const parameter_1 = require("./parameter");
const types_2 = require("../p2p/types");
const utils_1 = require("./utils");
const utils_2 = require("../push/utils");
const utils_3 = require("../p2p/utils");
class Device extends tiny_typed_emitter_1.TypedEmitter {
    constructor(api, device) {
        super();
        this.parameters = {};
        this.api = api;
        this.device = device;
        this.log = api.getLog();
        this.update(this.device);
    }
    getParameter(param_type) {
        return this.parameters[param_type];
    }
    getParameters() {
        return this.parameters;
    }
    _updateParameter(param_type, param_value) {
        const tmp_param_value = parameter_1.ParameterHelper.readValue(param_type, param_value.value);
        if ((this.parameters[param_type] !== undefined && (this.parameters[param_type].value != tmp_param_value || this.parameters[param_type].timestamp < param_value.timestamp)) || this.parameters[param_type] === undefined) {
            this.parameters[param_type] = {
                value: tmp_param_value,
                timestamp: param_value.timestamp
            };
            this.emit("parameter", this, param_type, this.parameters[param_type].value, this.parameters[param_type].timestamp);
        }
    }
    updateParameters(params) {
        Object.keys(params).forEach(paramtype => {
            const param_type = Number.parseInt(paramtype);
            this._updateParameter(param_type, params[param_type]);
        });
    }
    update(device, force = false) {
        this.device = device;
        if (force)
            this.parameters = {};
        this.device.params.forEach(param => {
            this._updateParameter(param.param_type, { value: param.param_value, timestamp: utils_2.convertTimestampMs(param.update_time) });
        });
    }
    static isCamera(type) {
        if (type == types_1.DeviceType.CAMERA ||
            type == types_1.DeviceType.CAMERA2 ||
            type == types_1.DeviceType.CAMERA_E ||
            type == types_1.DeviceType.CAMERA2C ||
            type == types_1.DeviceType.INDOOR_CAMERA ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA ||
            type == types_1.DeviceType.FLOODLIGHT ||
            type == types_1.DeviceType.DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == types_1.DeviceType.CAMERA2C_PRO ||
            type == types_1.DeviceType.CAMERA2_PRO ||
            type == types_1.DeviceType.INDOOR_CAMERA_1080 ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA_1080 ||
            type == types_1.DeviceType.SOLO_CAMERA ||
            type == types_1.DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }
    static hasBattery(type) {
        if (type == types_1.DeviceType.CAMERA ||
            type == types_1.DeviceType.CAMERA2 ||
            type == types_1.DeviceType.CAMERA_E ||
            type == types_1.DeviceType.CAMERA2C ||
            type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == types_1.DeviceType.CAMERA2C_PRO ||
            type == types_1.DeviceType.CAMERA2_PRO ||
            type == types_1.DeviceType.SOLO_CAMERA ||
            type == types_1.DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }
    static isStation(type) {
        if (type == types_1.DeviceType.STATION)
            return true;
        return false;
    }
    static isSensor(type) {
        if (type == types_1.DeviceType.SENSOR ||
            type == types_1.DeviceType.MOTION_SENSOR)
            return true;
        return false;
    }
    static isKeyPad(type) {
        return types_1.DeviceType.KEYPAD == type;
    }
    static isDoorbell(type) {
        if (type == types_1.DeviceType.DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2)
            return true;
        return false;
    }
    static isWiredDoorbell(type) {
        if (type == types_1.DeviceType.DOORBELL)
            return true;
        return false;
    }
    static isIndoorCamera(type) {
        if (type == types_1.DeviceType.INDOOR_CAMERA ||
            type == types_1.DeviceType.INDOOR_CAMERA_1080 ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA_1080)
            return true;
        return false;
    }
    static isFloodLight(type) {
        return types_1.DeviceType.FLOODLIGHT == type;
    }
    static isLock(type) {
        return Device.isLockBasic(type) || Device.isLockAdvanced(type) || Device.isLockBasicNoFinger(type) || Device.isLockAdvancedNoFinger(type);
    }
    static isLockBasic(type) {
        return types_1.DeviceType.LOCK_BASIC == type;
    }
    static isLockBasicNoFinger(type) {
        return types_1.DeviceType.LOCK_BASIC_NO_FINGER == type;
    }
    static isLockAdvanced(type) {
        return types_1.DeviceType.LOCK_ADVANCED == type;
    }
    static isLockAdvancedNoFinger(type) {
        return types_1.DeviceType.LOCK_ADVANCED_NO_FINGER == type;
    }
    static isBatteryDoorbell(type) {
        return types_1.DeviceType.BATTERY_DOORBELL == type;
    }
    static isBatteryDoorbell2(type) {
        return types_1.DeviceType.BATTERY_DOORBELL_2 == type;
    }
    static isSoloCamera(type) {
        return types_1.DeviceType.SOLO_CAMERA == type;
    }
    static isSoloCameraPro(type) {
        return types_1.DeviceType.SOLO_CAMERA_PRO == type;
    }
    static isSoloCameras(type) {
        return Device.isSoloCamera(type) || Device.isSoloCameraPro(type);
    }
    static isCamera2(type) {
        //T8114
        return types_1.DeviceType.CAMERA2 == type;
    }
    static isCamera2C(type) {
        //T8113
        return types_1.DeviceType.CAMERA2C == type;
    }
    static isCamera2Pro(type) {
        //T8140
        return types_1.DeviceType.CAMERA2_PRO == type;
    }
    static isCamera2CPro(type) {
        //T8142
        return types_1.DeviceType.CAMERA2C_PRO == type;
    }
    static isCamera2Product(type) {
        return Device.isCamera2(type) || Device.isCamera2C(type) || Device.isCamera2Pro(type) || Device.isCamera2CPro(type);
    }
    static isEntrySensor(type) {
        //T8900
        return types_1.DeviceType.SENSOR == type;
    }
    static isMotionSensor(type) {
        return types_1.DeviceType.MOTION_SENSOR == type;
    }
    static isIntegratedDeviceBySn(sn) {
        return sn.startsWith("T8420") || sn.startsWith("T820") || sn.startsWith("T8410") || sn.startsWith("T8400") || sn.startsWith("T8401") || sn.startsWith("T8411") || sn.startsWith("T8130") || sn.startsWith("T8131");
    }
    static isSoloCameraBySn(sn) {
        return sn.startsWith("T8130") || sn.startsWith("T8131");
    }
    isCamera() {
        return Device.isCamera(this.device.device_type);
    }
    isFloodLight() {
        return types_1.DeviceType.FLOODLIGHT == this.device.device_type;
    }
    isDoorbell() {
        return Device.isDoorbell(this.device.device_type);
    }
    isWiredDoorbell() {
        return Device.isWiredDoorbell(this.device.device_type);
    }
    isLock() {
        return Device.isLock(this.device.device_type);
    }
    isLockBasic() {
        return Device.isLockBasic(this.device.device_type);
    }
    isLockBasicNoFinger() {
        return Device.isLockBasicNoFinger(this.device.device_type);
    }
    isLockAdvanced() {
        return Device.isLockAdvanced(this.device.device_type);
    }
    isLockAdvancedNoFinger() {
        return Device.isLockAdvancedNoFinger(this.device.device_type);
    }
    isBatteryDoorbell() {
        return Device.isBatteryDoorbell(this.device.device_type);
    }
    isBatteryDoorbell2() {
        return Device.isBatteryDoorbell2(this.device.device_type);
    }
    isSoloCamera() {
        return Device.isSoloCamera(this.device.device_type);
    }
    isSoloCameraPro() {
        return Device.isSoloCameraPro(this.device.device_type);
    }
    isSoloCameras() {
        return Device.isSoloCameras(this.device.device_type);
    }
    isCamera2() {
        return Device.isCamera2(this.device.device_type);
    }
    isCamera2C() {
        return Device.isCamera2C(this.device.device_type);
    }
    isCamera2Pro() {
        return Device.isCamera2Pro(this.device.device_type);
    }
    isCamera2CPro() {
        return Device.isCamera2CPro(this.device.device_type);
    }
    isCamera2Product() {
        return Device.isCamera2Product(this.device.device_type);
    }
    isEntrySensor() {
        return Device.isEntrySensor(this.device.device_type);
    }
    isKeyPad() {
        return Device.isKeyPad(this.device.device_type);
    }
    isMotionSensor() {
        return Device.isMotionSensor(this.device.device_type);
    }
    isIndoorCamera() {
        return Device.isIndoorCamera(this.device.device_type);
    }
    hasBattery() {
        return Device.hasBattery(this.device.device_type);
    }
    getDeviceKey() {
        return this.device.station_sn + this.device.device_channel;
    }
    getDeviceType() {
        return this.device.device_type;
    }
    getHardwareVersion() {
        return this.device.main_hw_version;
    }
    getSoftwareVersion() {
        return this.device.main_sw_version;
    }
    getModel() {
        return this.device.device_model;
    }
    getName() {
        return this.device.device_name;
    }
    getSerial() {
        return this.device.device_sn;
    }
    getId() {
        return this.device.device_id;
    }
    getStationSerial() {
        return this.device.station_sn;
    }
    setParameters(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.setParameters(this.device.station_sn, this.device.device_sn, params);
        });
    }
    getChannel() {
        return this.device.device_channel;
    }
    getStateID(state, level = 2) {
        switch (level) {
            case 0:
                return `${this.getStationSerial()}.${this.getStateChannel()}`;
            case 1:
                return `${this.getStationSerial()}.${this.getStateChannel()}.${this.getSerial()}`;
            default:
                if (state)
                    return `${this.getStationSerial()}.${this.getStateChannel()}.${this.getSerial()}.${state}`;
                throw new Error("No state value passed.");
        }
    }
    getWifiRssi() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_WIFI_RSSI);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    getStoragePath(filename) {
        return utils_1.getAbsoluteFilePath(this.device.device_type, this.device.device_channel, filename);
    }
    isEnabled() {
        let param = this.getParameter(99904);
        if (this.isIndoorCamera() || this.isSoloCameras() || this.isWiredDoorbell() || this.isFloodLight()) {
            param = this.getParameter(types_1.ParamType.OPEN_DEVICE);
            return { value: param !== undefined ? (param.value === "true" ? true : false) : false, timestamp: param !== undefined ? param.timestamp : 0 };
        }
        return { value: param !== undefined ? (param.value === "0" ? true : false) : false, timestamp: param !== undefined ? param.timestamp : 0 };
    }
    getDeviceTypeString() {
        if (this.isCamera()) {
            return "camera";
        }
        else if (this.isEntrySensor()) {
            return "sensor";
        }
        else if (this.isKeyPad()) {
            return "keypad";
        }
        else if (this.isDoorbell()) {
            return "doorbell";
        }
        else if (this.isIndoorCamera()) {
            return "indoorcamera";
        }
        else if (this.isFloodLight()) {
            return "floodlight";
        }
        else if (this.isLock()) {
            return "lock";
        }
        else {
            return `unknown(${this.device.device_type})`;
        }
    }
}
exports.Device = Device;
class CommonDevice extends Device {
    getStateChannel() {
        return "common";
    }
}
exports.CommonDevice = CommonDevice;
class Camera extends Device {
    constructor() {
        super(...arguments);
        this.is_streaming = false;
    }
    getStateChannel() {
        return "cameras";
    }
    getLastCameraImageURL() {
        return { value: this.device.cover_path, timestamp: this.device.cover_time ? utils_2.convertTimestampMs(this.device.cover_time) : 0 };
    }
    getLastCameraVideoURL() {
        if (this.isCamera()) {
            return "";
        }
        else {
            return "";
        }
    }
    getMACAddress() {
        return this.device.wifi_mac;
    }
    startDetection() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start camera detection.
            yield this.setParameters([{ param_type: types_1.ParamType.DETECT_SWITCH, param_value: 1 }]).catch(error => {
                this.log.error(`${this.constructor.name}.startDetection(): error: ${JSON.stringify(error)}`);
            });
        });
    }
    startStream() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start the camera stream and return the RTSP URL.
            try {
                const response = yield this.api.request("post", "web/equipment/start_stream", {
                    device_sn: this.device.device_sn,
                    station_sn: this.device.station_sn,
                    proto: 2
                }).catch(error => {
                    this.log.error(`${this.constructor.name}.startStream(): error: ${JSON.stringify(error)}`);
                    return error;
                });
                this.log.debug(`${this.constructor.name}.startStream(): Response: ${JSON.stringify(response.data)}`);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        this.is_streaming = true;
                        this.log.info(`Livestream of camera ${this.device.device_sn} started.`);
                        return dataresult.url;
                    }
                    else
                        this.log.error(`${this.constructor.name}.startStream(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
                else {
                    this.log.error(`${this.constructor.name}.startStream(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log.error(`${this.constructor.name}.startStream(): error: ${error}`);
            }
            return "";
        });
    }
    stopDetection() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop camera detection.
            yield this.setParameters([{ param_type: types_1.ParamType.DETECT_SWITCH, param_value: 0 }]);
        });
    }
    stopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop the camera stream.
            try {
                const response = yield this.api.request("post", "web/equipment/stop_stream", {
                    device_sn: this.device.device_sn,
                    station_sn: this.device.station_sn,
                    proto: 2
                }).catch(error => {
                    this.log.error(`${this.constructor.name}.stopStream(): error: ${JSON.stringify(error)}`);
                    return error;
                });
                this.log.debug(`${this.constructor.name}.stopStream(): Response: ${JSON.stringify(response.data)}`);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        this.is_streaming = false;
                        this.log.info(`Livestream of camera ${this.device.device_sn} stopped.`);
                    }
                    else {
                        this.log.error(`${this.constructor.name}.stopStream(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                    }
                }
                else {
                    this.log.error(`${this.constructor.name}.stopStream(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log.error(`${this.constructor.name}.stopStream(): error: ${error}`);
            }
        });
    }
    getState() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_DEV_STATUS);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    isStreaming() {
        return this.is_streaming;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Stop other things if implemented such as detection feature
            if (this.is_streaming)
                yield this.stopStream().catch();
        });
    }
    getLastChargingDays() {
        return this.device.charging_days;
    }
    getLastChargingFalseEvents() {
        return this.device.charging_missing;
    }
    getLastChargingRecordedEvents() {
        return this.device.charging_reserve;
    }
    getLastChargingTotalEvents() {
        return this.device.charing_total;
    }
    getBatteryValue() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_BATTERY);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    getBatteryTemperature() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_BATTERY_TEMP);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    isMotionDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_PIR_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isLedEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_DEV_LED_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isAutoNightVisionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_IRCUT_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isRTSPStreamEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_NAS_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isAntiTheftDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_EAS_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    getWatermark() {
        const param = this.getParameter(types_2.CommandType.CMD_SET_DEVS_OSD);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
}
exports.Camera = Camera;
class SoloCamera extends Camera {
    isLedEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_LED_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isMotionDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.SoloCamera = SoloCamera;
class IndoorCamera extends Camera {
    isLedEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_LED_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isMotionDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isPetDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_DET_SET_PET_ENABLE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isSoundDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_ENABLE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.IndoorCamera = IndoorCamera;
class DoorbellCamera extends Camera {
    isLedEnabled() {
        const param = this.getParameter(types_1.ParamType.DOORBELL_LED_NIGHT_MODE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isAutoNightVisionEnabled() {
        const param = this.getParameter(types_1.ParamType.NIGHT_VISUAL);
        return { value: param ? (param.value === "true" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isMotionDetectionEnabled() {
        const param = this.getParameter(types_1.ParamType.DETECT_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.DoorbellCamera = DoorbellCamera;
class BatteryDoorbellCamera extends Camera {
    isLedEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_BAT_DOORBELL_SET_LED_ENABLE);
        return { value: param ? (param.value === "0" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.BatteryDoorbellCamera = BatteryDoorbellCamera;
class FloodlightCamera extends Camera {
    isLedEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_LED_SWITCH);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    isMotionDetectionEnabled() {
        const param = this.getParameter(types_2.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.FloodlightCamera = FloodlightCamera;
class Sensor extends Device {
    getStateChannel() {
        return "sensors";
    }
    getState() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_DEV_STATUS);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
}
exports.Sensor = Sensor;
class EntrySensor extends Sensor {
    isSensorOpen() {
        const param = this.getParameter(types_2.CommandType.CMD_ENTRY_SENSOR_STATUS);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    getSensorChangeTime() {
        const param = this.getParameter(types_2.CommandType.CMD_ENTRY_SENSOR_CHANGE_TIME);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    isBatteryLow() {
        const param = this.getParameter(types_2.CommandType.CMD_ENTRY_SENSOR_BAT_STATE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.EntrySensor = EntrySensor;
class MotionSensor extends Sensor {
    //TODO: CMD_MOTION_SENSOR_ENABLE_LED = 1607
    //TODO: CMD_MOTION_SENSOR_ENTER_USER_TEST_MODE = 1613
    //TODO: CMD_MOTION_SENSOR_EXIT_USER_TEST_MODE = 1610
    //TODO: CMD_MOTION_SENSOR_SET_CHIRP_TONE = 1611
    //TODO: CMD_MOTION_SENSOR_SET_PIR_SENSITIVITY = 1609
    //TODO: CMD_MOTION_SENSOR_WORK_MODE = 1612
    static isMotionDetected(millis) {
        const delta = new Date().getUTCMilliseconds() - millis;
        if (delta < this.MOTION_COOLDOWN_MS) {
            return { motion: true, cooldown_ms: this.MOTION_COOLDOWN_MS - delta };
        }
        return { motion: false, cooldown_ms: 0 };
    }
    isMotionDetected() {
        return MotionSensor.isMotionDetected(this.getMotionSensorPIREvent().value);
    }
    getMotionSensorPIREvent() {
        //TODO: Implement P2P Control Event over active station connection
        const param = this.getParameter(types_2.CommandType.CMD_MOTION_SENSOR_PIR_EVT);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    isBatteryLow() {
        const param = this.getParameter(types_2.CommandType.CMD_MOTION_SENSOR_BAT_STATE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.MotionSensor = MotionSensor;
MotionSensor.MOTION_COOLDOWN_MS = 120000;
class Lock extends Device {
    getStateChannel() {
        return "locks";
    }
    getState() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_DEV_STATUS);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    getBatteryValue() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_BATTERY);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    getWifiRssi() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_SUB1G_RSSI);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    isLocked() {
        const param = this.getLockStatus();
        return { value: param ? (param.value === 4 ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    getLockStatus() {
        const param = this.getParameter(types_2.CommandType.CMD_DOORLOCK_GET_STATE);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    static encodeESLCmdOnOff(short_user_id, nickname, lock) {
        const buf1 = Buffer.from([types_2.ESLAnkerBleConstant.a, 2]);
        const buf2 = Buffer.allocUnsafe(2);
        buf2.writeUInt16BE(short_user_id);
        const buf3 = Buffer.from([types_2.ESLAnkerBleConstant.b, 1, lock === true ? 1 : 0, types_2.ESLAnkerBleConstant.c, 4]);
        const buf4 = Buffer.from(utils_3.eslTimestamp());
        const buf5 = Buffer.from([types_2.ESLAnkerBleConstant.d, nickname.length]);
        const buf6 = Buffer.from(nickname);
        return Buffer.concat([buf1, buf2, buf3, buf4, buf5, buf6]);
    }
    static encodeESLCmdQueryStatus(admin_user_id) {
        const buf1 = Buffer.from([types_2.ESLAnkerBleConstant.a, admin_user_id.length]);
        const buf2 = Buffer.from(admin_user_id);
        const buf3 = Buffer.from([types_2.ESLAnkerBleConstant.b, 4]);
        const buf4 = Buffer.from(utils_3.eslTimestamp());
        return Buffer.concat([buf1, buf2, buf3, buf4]);
    }
}
exports.Lock = Lock;
class Keypad extends Device {
    //TODO: CMD_KEYPAD_BATTERY_CHARGER_STATE = 1655
    //TODO: CMD_KEYPAD_BATTERY_TEMP_STATE = 1654
    //TODO: CMD_KEYPAD_GET_PASSWORD = 1657
    //TODO: CMD_KEYPAD_GET_PASSWORD_LIST = 1662
    //TODO: CMD_KEYPAD_IS_PSW_SET = 1670
    //TODO: CMD_KEYPAD_PSW_OPEN = 1664
    //TODO: CMD_KEYPAD_SET_CUSTOM_MAP = 1660
    //TODO: CMD_KEYPAD_SET_PASSWORD = 1650
    getStateChannel() {
        return "keypads";
    }
    getState() {
        const param = this.getParameter(types_2.CommandType.CMD_GET_DEV_STATUS);
        return { value: Number.parseInt(param ? param.value : "0"), timestamp: param ? param.timestamp : 0 };
    }
    isBatteryLow() {
        const param = this.getParameter(types_2.CommandType.CMD_KEYPAD_BATTERY_CAP_STATE);
        return { value: param ? (param.value === "1" ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
}
exports.Keypad = Keypad;
class UnknownDevice extends Device {
    getStateChannel() {
        return "unknown";
    }
}
exports.UnknownDevice = UnknownDevice;
