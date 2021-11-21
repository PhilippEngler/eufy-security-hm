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
exports.UnknownDevice = exports.Keypad = exports.Lock = exports.MotionSensor = exports.EntrySensor = exports.Sensor = exports.FloodlightCamera = exports.BatteryDoorbellCamera = exports.WiredDoorbellCamera = exports.DoorbellCamera = exports.IndoorCamera = exports.SoloCamera = exports.Camera = exports.CommonDevice = exports.Device = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const types_1 = require("./types");
const parameter_1 = require("./parameter");
const types_2 = require("../p2p/types");
const utils_1 = require("./utils");
const utils_2 = require("../push/utils");
const utils_3 = require("../p2p/utils");
const push_1 = require("../push");
const utils_4 = require("../utils");
const error_1 = require("./error");
class Device extends tiny_typed_emitter_1.TypedEmitter {
    constructor(api, device) {
        super();
        this.eventTimeouts = new Map();
        this.properties = {};
        this.rawProperties = {};
        this.ready = false;
        this.api = api;
        this.rawDevice = device;
        this.log = api.getLog();
        this.update(this.rawDevice);
        this.ready = true;
        setImmediate(() => {
            this.emit("ready", this);
        });
    }
    getRawDevice() {
        return this.rawDevice;
    }
    update(device) {
        this.rawDevice = device;
        const metadata = this.getPropertiesMetadata();
        for (const property of Object.values(metadata)) {
            if (this.rawDevice[property.key] !== undefined && typeof property.key === "string") {
                let timestamp = 0;
                switch (property.key) {
                    case "cover_path":
                        if (this.rawDevice.cover_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawDevice.cover_time);
                            break;
                        }
                    case "main_sw_version":
                        if (this.rawDevice.main_sw_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawDevice.main_sw_time);
                            break;
                        }
                    case "sec_sw_version":
                        if (this.rawDevice.sec_sw_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawDevice.sec_sw_time);
                            break;
                        }
                    default:
                        if (this.rawDevice.update_time !== undefined) {
                            timestamp = (0, utils_2.convertTimestampMs)(this.rawDevice.update_time);
                        }
                        break;
                }
                this.updateProperty(property.name, { value: this.rawDevice[property.key], timestamp: timestamp });
            }
            else if (this.properties[property.name] === undefined && property.default !== undefined && !this.ready) {
                this.updateProperty(property.name, { value: property.default, timestamp: new Date().getTime() });
            }
        }
        this.rawDevice.params.forEach(param => {
            this.updateRawProperty(param.param_type, { value: param.param_value, timestamp: (0, utils_2.convertTimestampMs)(param.update_time) });
        });
        this.log.debug("Normalized Properties", { deviceSN: this.getSerial(), properties: this.properties });
    }
    updateProperty(name, value) {
        if ((this.properties[name] !== undefined
            && (this.properties[name].value !== value.value
                && this.properties[name].timestamp <= value.timestamp))
            || this.properties[name] === undefined) {
            this.properties[name] = value;
            if (!name.startsWith("hidden-")) {
                if (this.ready)
                    this.emit("property changed", this, name, value);
            }
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    processCustomParameterChanged(metadata, oldValue, newValue) {
        if ((metadata.key === types_1.ParamType.DETECT_MOTION_SENSITIVE || metadata.key === types_1.ParamType.DETECT_MODE) && this.isWiredDoorbell()) {
            //TODO: Not perfectly solved, can in certain cases briefly trigger a double event where the last event is the correct one
            const rawSensitivity = this.getRawProperty(types_1.ParamType.DETECT_MOTION_SENSITIVE);
            const rawMode = this.getRawProperty(types_1.ParamType.DETECT_MODE);
            if (rawSensitivity !== undefined && rawMode !== undefined) {
                const sensitivity = Number.parseInt(rawSensitivity.value);
                const mode = Number.parseInt(rawMode.value);
                if (mode === 3 && sensitivity === 2) {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, { value: 1, timestamp: newValue ? newValue.timestamp : 0 });
                }
                else if (mode === 1 && sensitivity === 1) {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, { value: 2, timestamp: newValue ? newValue.timestamp : 0 });
                }
                else if (mode === 1 && sensitivity === 2) {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, { value: 3, timestamp: newValue ? newValue.timestamp : 0 });
                }
                else if (mode === 1 && sensitivity === 3) {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, { value: 4, timestamp: newValue ? newValue.timestamp : 0 });
                }
                else if (mode === 2 && sensitivity === 1) {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, { value: 5, timestamp: newValue ? newValue.timestamp : 0 });
                }
            }
        }
        else if (metadata.name === types_1.PropertyName.DeviceWifiRSSI) {
            this.updateProperty(types_1.PropertyName.DeviceWifiSignalLevel, { value: (0, utils_1.calculateWifiSignalLevel)(this, newValue.value), timestamp: newValue ? newValue.timestamp : 0 });
        }
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
                    try {
                        const oldValue = this.properties[property.name];
                        if (this.updateProperty(property.name, this.convertRawPropertyValue(property, this.rawProperties[type]))) {
                            this.processCustomParameterChanged(property, oldValue, this.properties[property.name]);
                        }
                    }
                    catch (error) {
                        if (error instanceof error_1.PropertyNotSupportedError) {
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
            if (property.key === types_1.ParamType.PRIVATE_MODE || property.key === types_1.ParamType.OPEN_DEVICE || property.key === types_2.CommandType.CMD_DEVS_SWITCH) {
                if (this.isIndoorCamera() || this.isWiredDoorbell() || this.isFloodLight()) {
                    return { value: value !== undefined ? (value.value === "true" ? true : false) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                }
                return { value: value !== undefined ? (value.value === "0" ? true : false) : false, timestamp: value !== undefined ? value.timestamp : 0 };
            }
            else if (property.key === types_2.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE) {
                try {
                    switch (property.name) {
                        case types_1.PropertyName.DeviceNotificationRing:
                            return { value: value !== undefined ? (Number.parseInt(value.value.notification_ring_onoff)) : 0, timestamp: value !== undefined ? value.timestamp : 0 };
                        case types_1.PropertyName.DeviceNotificationMotion:
                            return { value: value !== undefined ? (Number.parseInt(value.value.notification_motion_onoff)) : 0, timestamp: value !== undefined ? value.timestamp : 0 };
                        case types_1.PropertyName.DeviceNotificationType:
                            return { value: value !== undefined ? (Number.parseInt(value.value.notification_style)) : 1, timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                }
                catch (error) {
                    this.log.error("Convert CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE Error:", { property: property, value: value, error: error });
                    return { value: 1, timestamp: 0 };
                }
            }
            else if (property.key === types_1.ParamType.DOORBELL_NOTIFICATION_OPEN) {
                try {
                    switch (property.name) {
                        case types_1.PropertyName.DeviceNotificationRing:
                            return { value: value !== undefined ? (Number.parseInt(value.value) === 3 || Number.parseInt(value.value) === 1 ? true : false) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                        case types_1.PropertyName.DeviceNotificationMotion:
                            return { value: value !== undefined ? (Number.parseInt(value.value) === 3 || Number.parseInt(value.value) === 2 ? true : false) : false, timestamp: value !== undefined ? value.timestamp : 0 };
                    }
                }
                catch (error) {
                    this.log.error("Convert DOORBELL_NOTIFICATION_OPEN Error:", { property: property, value: value, error: error });
                    return { value: false, timestamp: 0 };
                }
            }
            else if (property.key === types_2.CommandType.CMD_SET_PIRSENSITIVITY) {
                try {
                    if (this.getDeviceType() === types_1.DeviceType.CAMERA || this.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                        const convertedValue = ((200 - Number.parseInt(value.value)) / 2) + 1;
                        return { value: convertedValue, timestamp: value.timestamp };
                    }
                    else if (this.isCamera2Product()) {
                        let convertedValue;
                        switch (Number.parseInt(value.value)) {
                            case 192:
                                convertedValue = 1;
                                break;
                            case 118:
                                convertedValue = 2;
                                break;
                            case 72:
                                convertedValue = 3;
                                break;
                            case 46:
                                convertedValue = 4;
                                break;
                            case 30:
                                convertedValue = 5;
                                break;
                            case 20:
                                convertedValue = 6;
                                break;
                            case 14:
                                convertedValue = 7;
                                break;
                            default:
                                convertedValue = 4;
                                break;
                        }
                        return { value: convertedValue, timestamp: value.timestamp };
                    }
                }
                catch (error) {
                    this.log.error("Convert CMD_SET_PIRSENSITIVITY Error:", { property: property, value: value, error: error });
                    return value;
                }
            }
            else if (property.type === "number") {
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
        throw new error_1.InvalidPropertyError(`Property ${name} invalid`);
    }
    getPropertyValue(name) {
        return this.properties[name];
    }
    getRawProperty(type) {
        return this.rawProperties[type];
    }
    getRawProperties() {
        return this.rawProperties;
    }
    getProperties() {
        const result = {};
        for (const property of Object.keys(this.properties)) {
            if (!property.startsWith("hidden-"))
                result[property] = this.properties[property];
        }
        return result;
    }
    getPropertiesMetadata() {
        const metadata = types_1.DeviceProperties[this.getDeviceType()];
        if (metadata === undefined)
            return types_1.GenericDeviceProperties;
        return metadata;
    }
    hasProperty(name) {
        return this.getPropertiesMetadata()[name] !== undefined;
    }
    getCommands() {
        const commands = types_1.DeviceCommands[this.getDeviceType()];
        if (commands === undefined)
            return [];
        return commands;
    }
    hasCommand(name) {
        return this.getCommands().includes(name);
    }
    processPushNotification(_message, _eventDurationSeconds) {
        // Nothing to do
    }
    setCustomPropertyValue(name, value) {
        const metadata = this.getPropertyMetadata(name);
        if (typeof metadata.key === "string" && metadata.key.startsWith("custom_")) {
            this.updateProperty(name, value);
        }
    }
    destroy() {
        this.eventTimeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.eventTimeouts.clear();
    }
    clearEventTimeout(eventType) {
        const timeout = this.eventTimeouts.get(eventType);
        if (timeout !== undefined) {
            clearTimeout(timeout);
            this.eventTimeouts.delete(eventType);
        }
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
            type == types_1.DeviceType.SOLO_CAMERA_PRO ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_1080 ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_2K ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_2K ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8422 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8423 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8424)
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
            type == types_1.DeviceType.SOLO_CAMERA_PRO ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_1080 ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_2K ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR)
            //TODO: Add other battery devices
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
            type == types_1.DeviceType.INDOOR_PT_CAMERA_1080 ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_2K)
            return true;
        return false;
    }
    static isFloodLight(type) {
        if (type == types_1.DeviceType.FLOODLIGHT ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8422 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8423 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8424)
            return true;
        return false;
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
    static isSoloCameraSpotlight1080(type) {
        return types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_1080 == type;
    }
    static isSoloCameraSpotlight2k(type) {
        return types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_2K == type;
    }
    static isSoloCameraSpotlightSolar(type) {
        return types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR == type;
    }
    static isSoloCameras(type) {
        return Device.isSoloCamera(type) ||
            Device.isSoloCameraPro(type) ||
            Device.isSoloCameraSpotlight1080(type) ||
            Device.isSoloCameraSpotlight2k(type) ||
            Device.isSoloCameraSpotlightSolar(type);
    }
    static isIndoorOutdoorCamera1080p(type) {
        return types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P == type;
    }
    static isIndoorOutdoorCamera1080pNoLight(type) {
        return types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT == type;
    }
    static isIndoorOutdoorCamera2k(type) {
        return types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_2K == type;
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
        return sn.startsWith("T8420") ||
            sn.startsWith("T820") ||
            sn.startsWith("T8410") ||
            sn.startsWith("T8400") ||
            sn.startsWith("T8401") ||
            sn.startsWith("T8411") ||
            sn.startsWith("T8130") ||
            sn.startsWith("T8131") ||
            sn.startsWith("T8422") ||
            sn.startsWith("T8423") ||
            sn.startsWith("T8424") ||
            sn.startsWith("T8440") ||
            sn.startsWith("T8441") ||
            sn.startsWith("T8442");
    }
    static isSoloCameraBySn(sn) {
        return sn.startsWith("T8130") ||
            sn.startsWith("T8131") ||
            sn.startsWith("T8122") ||
            sn.startsWith("T8123") ||
            sn.startsWith("T8124");
    }
    isCamera() {
        return Device.isCamera(this.rawDevice.device_type);
    }
    isFloodLight() {
        return Device.isFloodLight(this.rawDevice.device_type);
    }
    isDoorbell() {
        return Device.isDoorbell(this.rawDevice.device_type);
    }
    isWiredDoorbell() {
        return Device.isWiredDoorbell(this.rawDevice.device_type);
    }
    isLock() {
        return Device.isLock(this.rawDevice.device_type);
    }
    isLockBasic() {
        return Device.isLockBasic(this.rawDevice.device_type);
    }
    isLockBasicNoFinger() {
        return Device.isLockBasicNoFinger(this.rawDevice.device_type);
    }
    isLockAdvanced() {
        return Device.isLockAdvanced(this.rawDevice.device_type);
    }
    isLockAdvancedNoFinger() {
        return Device.isLockAdvancedNoFinger(this.rawDevice.device_type);
    }
    isBatteryDoorbell() {
        return Device.isBatteryDoorbell(this.rawDevice.device_type);
    }
    isBatteryDoorbell2() {
        return Device.isBatteryDoorbell2(this.rawDevice.device_type);
    }
    isSoloCamera() {
        return Device.isSoloCamera(this.rawDevice.device_type);
    }
    isSoloCameraPro() {
        return Device.isSoloCameraPro(this.rawDevice.device_type);
    }
    isSoloCameraSpotlight1080() {
        return Device.isSoloCameraSpotlight1080(this.rawDevice.device_type);
    }
    isSoloCameraSpotlight2k() {
        return Device.isSoloCameraSpotlight2k(this.rawDevice.device_type);
    }
    isSoloCameraSpotlightSolar() {
        return Device.isSoloCameraSpotlightSolar(this.rawDevice.device_type);
    }
    isIndoorOutdoorCamera1080p() {
        return Device.isIndoorOutdoorCamera1080p(this.rawDevice.device_type);
    }
    isIndoorOutdoorCamera1080pNoLight() {
        return Device.isIndoorOutdoorCamera1080pNoLight(this.rawDevice.device_type);
    }
    isIndoorOutdoorCamera2k() {
        return Device.isIndoorOutdoorCamera2k(this.rawDevice.device_type);
    }
    isSoloCameras() {
        return Device.isSoloCameras(this.rawDevice.device_type);
    }
    isCamera2() {
        return Device.isCamera2(this.rawDevice.device_type);
    }
    isCamera2C() {
        return Device.isCamera2C(this.rawDevice.device_type);
    }
    isCamera2Pro() {
        return Device.isCamera2Pro(this.rawDevice.device_type);
    }
    isCamera2CPro() {
        return Device.isCamera2CPro(this.rawDevice.device_type);
    }
    isCamera2Product() {
        return Device.isCamera2Product(this.rawDevice.device_type);
    }
    isEntrySensor() {
        return Device.isEntrySensor(this.rawDevice.device_type);
    }
    isKeyPad() {
        return Device.isKeyPad(this.rawDevice.device_type);
    }
    isMotionSensor() {
        return Device.isMotionSensor(this.rawDevice.device_type);
    }
    isIndoorCamera() {
        return Device.isIndoorCamera(this.rawDevice.device_type);
    }
    hasBattery() {
        return Device.hasBattery(this.rawDevice.device_type);
    }
    getDeviceKey() {
        return this.rawDevice.station_sn + this.rawDevice.device_channel;
    }
    getDeviceType() {
        return this.rawDevice.device_type;
    }
    getHardwareVersion() {
        return this.rawDevice.main_hw_version;
    }
    getSoftwareVersion() {
        return this.rawDevice.main_sw_version;
    }
    getModel() {
        return this.rawDevice.device_model;
    }
    getName() {
        return this.rawDevice.device_name;
    }
    getSerial() {
        return this.rawDevice.device_sn;
    }
    getId() {
        return this.rawDevice.device_id;
    }
    getStationSerial() {
        return this.rawDevice.station_sn;
    }
    setParameters(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.setParameters(this.rawDevice.station_sn, this.rawDevice.device_sn, params);
        });
    }
    getChannel() {
        return this.rawDevice.device_channel;
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
        return this.getPropertyValue(types_1.PropertyName.DeviceWifiRSSI);
    }
    getWifiRssiSignalLevel() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWifiSignalLevel);
    }
    getStoragePath(filename) {
        return (0, utils_1.getAbsoluteFilePath)(this.rawDevice.device_type, this.rawDevice.device_channel, filename);
    }
    isEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceEnabled);
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
            return `unknown(${this.rawDevice.device_type})`;
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
    constructor(api, device) {
        super(api, device);
        this._isStreaming = false;
        this.properties[types_1.PropertyName.DeviceMotionDetected] = { value: false, timestamp: 0 };
        this.properties[types_1.PropertyName.DevicePersonDetected] = { value: false, timestamp: 0 };
        this.properties[types_1.PropertyName.DevicePersonName] = { value: "", timestamp: 0 };
    }
    getStateChannel() {
        return "cameras";
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_SET_AUDIO_MUTE_RECORD:
                    return { value: value !== undefined ? (value.value === "0" ? true : false) : false, timestamp: value ? value.timestamp : 0 };
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    getLastCameraImageURL() {
        return this.getPropertyValue(types_1.PropertyName.DevicePictureUrl);
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
        return this.rawDevice.wifi_mac;
    }
    startDetection() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start camera detection.
            yield this.setParameters([{ paramType: types_1.ParamType.DETECT_SWITCH, paramValue: 1 }]).catch(error => {
                this.log.error("Error:", error);
            });
        });
    }
    startStream() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start the camera stream and return the RTSP URL.
            try {
                const response = yield this.api.request("post", "v1/web/equipment/start_stream", {
                    device_sn: this.rawDevice.device_sn,
                    station_sn: this.rawDevice.station_sn,
                    proto: 2
                }).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        this._isStreaming = true;
                        this.log.info(`Livestream of camera ${this.rawDevice.device_sn} started`);
                        return dataresult.url;
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
            return "";
        });
    }
    stopDetection() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop camera detection.
            yield this.setParameters([{ paramType: types_1.ParamType.DETECT_SWITCH, paramValue: 0 }]);
        });
    }
    stopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop the camera stream.
            try {
                const response = yield this.api.request("post", "v1/web/equipment/stop_stream", {
                    device_sn: this.rawDevice.device_sn,
                    station_sn: this.rawDevice.station_sn,
                    proto: 2
                }).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug("Response:", response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        this._isStreaming = false;
                        this.log.info(`Livestream of camera ${this.rawDevice.device_sn} stopped`);
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
        });
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    isStreaming() {
        return this._isStreaming;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Stop other things if implemented such as detection feature
            if (this._isStreaming)
                yield this.stopStream().catch();
        });
    }
    getLastChargingDays() {
        return this.rawDevice.charging_days;
    }
    getLastChargingFalseEvents() {
        return this.rawDevice.charging_missing;
    }
    getLastChargingRecordedEvents() {
        return this.rawDevice.charging_reserve;
    }
    getLastChargingTotalEvents() {
        return this.rawDevice.charing_total;
    }
    getBatteryValue() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBattery);
    }
    getBatteryTemperature() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryTemp);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isAutoNightVisionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceAutoNightvision);
    }
    isRTSPStreamEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceRTSPStream);
    }
    isAntiTheftDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceAntitheftDetection);
    }
    getWatermark() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWatermark);
    }
    isMotionDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value;
    }
    isPersonDetected() {
        return this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value;
    }
    getDetectedPerson() {
        return this.getPropertyValue(types_1.PropertyName.DevicePersonName).value;
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === push_1.CusPushEvent.SECURITY && message.device_sn === this.getSerial()) {
                try {
                    if (message.fetch_id !== undefined) {
                        // Person or someone identified
                        this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: true, timestamp: message.event_time });
                        this.updateProperty(types_1.PropertyName.DevicePersonName, { value: !(0, utils_4.isEmpty)(message.person_name) ? message.person_name : "Unknown", timestamp: message.event_time });
                        if (!(0, utils_4.isEmpty)(message.pic_url))
                            this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                        if (message.push_count === 1 || message.push_count === undefined)
                            this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                        this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                        this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            const timestamp = new Date().getTime();
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: false, timestamp: timestamp });
                            this.updateProperty(types_1.PropertyName.DevicePersonName, { value: "", timestamp: timestamp });
                            this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                            this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                        }), eventDurationSeconds * 1000));
                    }
                    else {
                        // Motion detected
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: true, timestamp: message.event_time });
                        if (!(0, utils_4.isEmpty)(message.pic_url))
                            this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                        if (message.push_count === 1 || message.push_count === undefined)
                            this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                        this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                        this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: false, timestamp: new Date().getTime() });
                            this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                            this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                        }), eventDurationSeconds * 1000));
                    }
                }
                catch (error) {
                    this.log.debug(`CusPushEvent.SECURITY - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.Camera = Camera;
class SoloCamera extends Camera {
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.device_sn === this.getSerial()) {
                try {
                    switch (message.event_type) {
                        case push_1.IndoorPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: true, timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: false, timestamp: new Date().getTime() });
                                this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.IndoorPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: true, timestamp: message.event_time });
                            this.updateProperty(types_1.PropertyName.DevicePersonName, { value: !(0, utils_4.isEmpty)(message.person_name) ? message.person_name : "Unknown", timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                const timestamp = new Date().getTime();
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: false, timestamp: timestamp });
                                this.updateProperty(types_1.PropertyName.DevicePersonName, { value: "", timestamp: timestamp });
                                this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled solo camera push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`SoloPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.SoloCamera = SoloCamera;
class IndoorCamera extends Camera {
    constructor(api, device) {
        super(api, device);
        this.properties[types_1.PropertyName.DevicePetDetected] = { value: false, timestamp: 0 };
        this.properties[types_1.PropertyName.DeviceSoundDetected] = { value: false, timestamp: 0 };
        this.properties[types_1.PropertyName.DeviceCryingDetected] = { value: false, timestamp: 0 };
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    isPetDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DevicePetDetection);
    }
    isSoundDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSoundDetection);
    }
    isPetDetected() {
        return this.getPropertyValue(types_1.PropertyName.DevicePetDetected).value;
    }
    isSoundDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSoundDetected).value;
    }
    isCryingDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceCryingDetected).value;
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.device_sn === this.getSerial()) {
                try {
                    switch (message.event_type) {
                        case push_1.IndoorPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: true, timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: false, timestamp: new Date().getTime() });
                                this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.IndoorPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: true, timestamp: message.event_time });
                            this.updateProperty(types_1.PropertyName.DevicePersonName, { value: !(0, utils_4.isEmpty)(message.person_name) ? message.person_name : "Unknown", timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                const timestamp = new Date().getTime();
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: false, timestamp: timestamp });
                                this.updateProperty(types_1.PropertyName.DevicePersonName, { value: "", timestamp: timestamp });
                                this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.IndoorPushEvent.CRYING_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceCryingDetected, { value: true, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("crying detected", this, this.getPropertyValue(types_1.PropertyName.DeviceCryingDetected).value);
                            this.clearEventTimeout(types_1.DeviceEvent.CryingDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.CryingDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DeviceCryingDetected, { value: false, timestamp: new Date().getTime() });
                                this.emit("crying detected", this, this.getPropertyValue(types_1.PropertyName.DeviceCryingDetected).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.CryingDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.IndoorPushEvent.SOUND_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceSoundDetected, { value: true, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("sound detected", this, this.getPropertyValue(types_1.PropertyName.DeviceSoundDetected).value);
                            this.clearEventTimeout(types_1.DeviceEvent.SoundDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.SoundDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DeviceSoundDetected, { value: false, timestamp: new Date().getTime() });
                                this.emit("sound detected", this, this.getPropertyValue(types_1.PropertyName.DeviceSoundDetected).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.SoundDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.IndoorPushEvent.PET_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePetDetected, { value: true, timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("pet detected", this, this.getPropertyValue(types_1.PropertyName.DevicePetDetected).value);
                            this.clearEventTimeout(types_1.DeviceEvent.PetDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PetDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DevicePetDetected, { value: false, timestamp: new Date().getTime() });
                                this.emit("pet detected", this, this.getPropertyValue(types_1.PropertyName.DevicePetDetected).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PetDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled indoor camera push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`IndoorPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
    destroy() {
        super.destroy();
    }
}
exports.IndoorCamera = IndoorCamera;
class DoorbellCamera extends Camera {
    constructor(api, device) {
        super(api, device);
        this.properties[types_1.PropertyName.DeviceRinging] = { value: false, timestamp: 0 };
    }
    isRinging() {
        return this.getPropertyValue(types_1.PropertyName.DeviceRinging).value;
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.device_sn === this.getSerial()) {
                try {
                    switch (message.event_type) {
                        case push_1.DoorbellPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: true, timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: false, timestamp: new Date().getTime() });
                                this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.DoorbellPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: true, timestamp: message.event_time });
                            this.updateProperty(types_1.PropertyName.DevicePersonName, { value: !(0, utils_4.isEmpty)(message.person_name) ? message.person_name : "Unknown", timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("person detected", this, this.getPropertyValue(types_1.PropertyName.DevicePersonDetected).value, this.getPropertyValue(types_1.PropertyName.DevicePersonName).value);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                const timestamp = new Date().getTime();
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, { value: false, timestamp: timestamp });
                                this.updateProperty(types_1.PropertyName.DevicePersonName, { value: "", timestamp: timestamp });
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }), eventDurationSeconds * 1000));
                            break;
                        case push_1.DoorbellPushEvent.PRESS_DOORBELL:
                            this.updateProperty(types_1.PropertyName.DeviceRinging, { value: true, timestamp: message.event_time });
                            if (!(0, utils_4.isEmpty)(message.pic_url))
                                this.updateProperty(types_1.PropertyName.DevicePictureUrl, { value: message.pic_url, timestamp: message.event_time });
                            if (message.push_count === 1 || message.push_count === undefined)
                                this.emit("rings", this, this.getPropertyValue(types_1.PropertyName.DeviceRinging).value);
                            this.clearEventTimeout(types_1.DeviceEvent.Ringing);
                            this.eventTimeouts.set(types_1.DeviceEvent.Ringing, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                this.updateProperty(types_1.PropertyName.DeviceRinging, { value: false, timestamp: new Date().getTime() });
                                this.emit("rings", this, this.getPropertyValue(types_1.PropertyName.DeviceRinging).value);
                                this.eventTimeouts.delete(types_1.DeviceEvent.Ringing);
                            }), eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled doorbell push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`DoorbellPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.DoorbellCamera = DoorbellCamera;
class WiredDoorbellCamera extends DoorbellCamera {
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isAutoNightVisionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceAutoNightvision);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
}
exports.WiredDoorbellCamera = WiredDoorbellCamera;
class BatteryDoorbellCamera extends DoorbellCamera {
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
}
exports.BatteryDoorbellCamera = BatteryDoorbellCamera;
class FloodlightCamera extends Camera {
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
}
exports.FloodlightCamera = FloodlightCamera;
class Sensor extends Device {
    getStateChannel() {
        return "sensors";
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
}
exports.Sensor = Sensor;
class EntrySensor extends Sensor {
    isSensorOpen() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSensorOpen);
    }
    getSensorChangeTime() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSensorChangeTime);
    }
    isBatteryLow() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryLow);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === push_1.CusPushEvent.DOOR_SENSOR && message.device_sn === this.getSerial()) {
                try {
                    if (message.sensor_open !== undefined) {
                        this.updateRawProperty(types_2.CommandType.CMD_ENTRY_SENSOR_STATUS, { value: message.sensor_open ? "1" : "0", timestamp: (0, utils_2.convertTimestampMs)(message.event_time) });
                        this.emit("open", this, message.sensor_open);
                    }
                }
                catch (error) {
                    this.log.debug(`CusPushEvent.DOOR_SENSOR - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
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
    /*public static isMotionDetected(millis: number): { motion: boolean, cooldown_ms: number} {
        const delta = new Date().getUTCMilliseconds() - millis;
        if (delta < this.MOTION_COOLDOWN_MS) {
            return { motion: true, cooldown_ms: this.MOTION_COOLDOWN_MS - delta};
        }
        return { motion: false, cooldown_ms: 0};
    }

    public isMotionDetected(): { motion: boolean, cooldown_ms: number} {
        return MotionSensor.isMotionDetected(this.getMotionSensorPIREvent().value);
    }*/
    constructor(api, device) {
        super(api, device);
        this.properties[types_1.PropertyName.DeviceMotionDetected] = { value: false, timestamp: 0 };
    }
    isMotionDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value;
    }
    getMotionSensorPIREvent() {
        //TODO: Implement P2P Control Event over active station connection
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionSensorPIREvent);
    }
    isBatteryLow() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryLow);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === push_1.CusPushEvent.MOTION_SENSOR_PIR && message.device_sn === this.getSerial()) {
                try {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: true, timestamp: message.event_time });
                    this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                    this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                    this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetected, { value: false, timestamp: new Date().getTime() });
                        this.emit("motion detected", this, this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected).value);
                        this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                    }), eventDurationSeconds * 1000));
                }
                catch (error) {
                    this.log.debug(`CusPushEvent.MOTION_SENSOR_PIR - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.MotionSensor = MotionSensor;
MotionSensor.MOTION_COOLDOWN_MS = 120000;
class Lock extends Device {
    getStateChannel() {
        return "locks";
    }
    processCustomParameterChanged(metadata, oldValue, newValue) {
        super.processCustomParameterChanged(metadata, oldValue, newValue);
        if (metadata.key === types_2.CommandType.CMD_DOORLOCK_GET_STATE && oldValue !== undefined && ((oldValue.value === 4 && newValue.value !== 4) || (oldValue.value !== 4 && newValue.value === 4))) {
            if (this.updateProperty(types_1.PropertyName.DeviceLocked, { value: newValue.value === 4 ? true : false, timestamp: newValue.timestamp }))
                this.emit("locked", this, newValue.value === 4 ? true : false);
        }
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    getBatteryValue() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBattery);
    }
    getWifiRssi() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWifiRSSI);
    }
    isLocked() {
        const param = this.getLockStatus();
        return { value: param ? (param.value === 4 ? true : false) : false, timestamp: param ? param.timestamp : 0 };
    }
    getLockStatus() {
        return this.getPropertyValue(types_1.PropertyName.DeviceLockStatus);
    }
    // public isBatteryLow(): PropertyValue {
    //     return this.getPropertyValue(PropertyName.DeviceBatteryLow);
    // }
    static encodeESLCmdOnOff(short_user_id, nickname, lock) {
        const buf1 = Buffer.from([types_2.ESLAnkerBleConstant.a, 2]);
        const buf2 = Buffer.allocUnsafe(2);
        buf2.writeUInt16BE(short_user_id);
        const buf3 = Buffer.from([types_2.ESLAnkerBleConstant.b, 1, lock === true ? 1 : 0, types_2.ESLAnkerBleConstant.c, 4]);
        const buf4 = Buffer.from((0, utils_3.eslTimestamp)());
        const buf5 = Buffer.from([types_2.ESLAnkerBleConstant.d, nickname.length]);
        const buf6 = Buffer.from(nickname);
        return Buffer.concat([buf1, buf2, buf3, buf4, buf5, buf6]);
    }
    static encodeESLCmdQueryStatus(admin_user_id) {
        const buf1 = Buffer.from([types_2.ESLAnkerBleConstant.a, admin_user_id.length]);
        const buf2 = Buffer.from(admin_user_id);
        const buf3 = Buffer.from([types_2.ESLAnkerBleConstant.b, 4]);
        const buf4 = Buffer.from((0, utils_3.eslTimestamp)());
        return Buffer.concat([buf1, buf2, buf3, buf4]);
    }
    convertRawPropertyValue(property, value) {
        try {
            if (property.key === types_2.CommandType.CMD_DOORLOCK_GET_STATE) {
                switch (value.value) {
                    case "3":
                        return { value: false, timestamp: value.timestamp };
                    case "4":
                        return { value: true, timestamp: value.timestamp };
                }
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.device_sn === this.getSerial()) {
                try {
                    switch (message.event_type) {
                        case push_1.LockPushEvent.APP_LOCK:
                        case push_1.LockPushEvent.AUTO_LOCK:
                        case push_1.LockPushEvent.FINGER_LOCK:
                        case push_1.LockPushEvent.KEYPAD_LOCK:
                        case push_1.LockPushEvent.MANUAL_LOCK:
                        case push_1.LockPushEvent.PW_LOCK:
                            this.updateRawProperty(types_2.CommandType.CMD_DOORLOCK_GET_STATE, { value: "4", timestamp: (0, utils_2.convertTimestampMs)(message.event_time) });
                            this.emit("locked", this, this.getPropertyValue(types_1.PropertyName.DeviceLocked).value);
                            break;
                        case push_1.LockPushEvent.APP_UNLOCK:
                        case push_1.LockPushEvent.AUTO_UNLOCK:
                        case push_1.LockPushEvent.FINGER_UNLOCK:
                        case push_1.LockPushEvent.MANUAL_UNLOCK:
                        case push_1.LockPushEvent.PW_UNLOCK:
                            this.updateRawProperty(types_2.CommandType.CMD_DOORLOCK_GET_STATE, { value: "3", timestamp: (0, utils_2.convertTimestampMs)(message.event_time) });
                            this.emit("locked", this, this.getPropertyValue(types_1.PropertyName.DeviceLocked).value);
                            break;
                        case push_1.LockPushEvent.LOCK_MECHANICAL_ANOMALY:
                        case push_1.LockPushEvent.MECHANICAL_ANOMALY:
                        case push_1.LockPushEvent.VIOLENT_DESTRUCTION:
                        case push_1.LockPushEvent.MULTIPLE_ERRORS:
                            this.updateRawProperty(types_2.CommandType.CMD_DOORLOCK_GET_STATE, { value: "5", timestamp: (0, utils_2.convertTimestampMs)(message.event_time) });
                            break;
                        // case LockPushEvent.LOW_POWE:
                        //     this.updateRawProperty(CommandType.CMD_SMARTLOCK_QUERY_BATTERY_LEVEL, { value: "10", timestamp: convertTimestampMs(message.event_time) });
                        //     break;
                        // case LockPushEvent.VERY_LOW_POWE:
                        //     this.updateRawProperty(CommandType.CMD_SMARTLOCK_QUERY_BATTERY_LEVEL, { value: "5", timestamp: convertTimestampMs(message.event_time) });
                        //     break;
                        default:
                            this.log.debug("Unhandled lock push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`LockPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.Lock = Lock;
class Keypad extends Device {
    //TODO: CMD_KEYPAD_BATTERY_CHARGER_STATE = 1655
    //TODO: CMD_KEYPAD_BATTERY_TEMP_STATE = 1654
    //TODO: CMD_KEYPAD_GET_PASSWORD = 1657
    //TODO: CMD_KEYPAD_GET_PASSWORD_LIST = 1662
    //TODO: CMD_KEYPAD_IS_PSW_SET = 1670
    //TODO: CMD_KEYPAD_SET_CUSTOM_MAP = 1660
    //TODO: CMD_KEYPAD_SET_PASSWORD = 1650
    getStateChannel() {
        return "keypads";
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    isBatteryLow() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryLow);
    }
    isBatteryCharging() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryIsCharging);
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_KEYPAD_BATTERY_CHARGER_STATE:
                    return { value: value !== undefined ? (value.value === "0" || value.value === "2" ? false : true) : false, timestamp: value ? value.timestamp : 0 };
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
}
exports.Keypad = Keypad;
class UnknownDevice extends Device {
    getStateChannel() {
        return "unknown";
    }
}
exports.UnknownDevice = UnknownDevice;
