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
exports.Device = exports.Devices = void 0;
const http_response_models_1 = require("./http/http-response.models");
const p2p_1 = require("./p2p");
/**
 * Represents all the Devices in the account.
 */
class Devices {
    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(httpService) {
        this.devices = {};
        this.httpService = httpService;
    }
    /**
     * (Re)Loads all Devices and the settings of them.
     */
    loadDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.resDevices = yield this.httpService.listDevices();
                var device;
                if (this.resDevices != null && this.resDevices.length > 0) {
                    for (var dev of this.resDevices) {
                        device = new Device(dev);
                        this.devices[device.getSerialNumber()] = device;
                    }
                }
                else {
                    this.devices = {};
                }
            }
            catch (e) {
                this.devices = {};
                throw new Error(e);
            }
        });
    }
    /**
     * Returns all Devices.
     */
    getDevices() {
        return this.devices;
    }
}
exports.Devices = Devices;
/**
 * Represents one Device object.
 */
class Device {
    /**
     * The constructor for the device.
     * @param device_info The device_info object with the data for the base.
     */
    constructor(device_info) {
        this.batteryCharge = "";
        this.batteryTemperature = "";
        this.device_info = device_info;
        this.pullValues();
    }
    /**
     * Collect needed values from the params-array so that we need only iterate once trough it...
     */
    pullValues() {
        for (var param of this.device_info.params) {
            switch (param.param_type) {
                case p2p_1.CommandType.CMD_GET_BATTERY:
                    this.batteryCharge = param.param_value;
                    break;
                case p2p_1.CommandType.CMD_GET_BATTERY_TEMP:
                    this.batteryTemperature = param.param_value;
                    break;
            }
        }
    }
    /**
     * Determines if the Device is a Camera.
     */
    isCamera() {
        var type = this.device_info.device_type;
        if (type == http_response_models_1.DeviceType.CAMERA ||
            type == http_response_models_1.DeviceType.CAMERA2 ||
            type == http_response_models_1.DeviceType.CAMERA_E ||
            type == http_response_models_1.DeviceType.CAMERA2C ||
            type == http_response_models_1.DeviceType.CAMERA2C_PRO ||
            type == http_response_models_1.DeviceType.CAMERA2_PRO ||
            type == http_response_models_1.DeviceType.SOLO_CAMERA ||
            type == http_response_models_1.DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }
    /**
     * Determines if the Device has a battery.
     */
    hasBattery() {
        var type = this.device_info.device_type;
        if (type == http_response_models_1.DeviceType.CAMERA ||
            type == http_response_models_1.DeviceType.CAMERA2 ||
            type == http_response_models_1.DeviceType.CAMERA_E ||
            type == http_response_models_1.DeviceType.CAMERA2C ||
            type == http_response_models_1.DeviceType.BATTERY_DOORBELL ||
            type == http_response_models_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == http_response_models_1.DeviceType.CAMERA2C_PRO ||
            type == http_response_models_1.DeviceType.CAMERA2_PRO ||
            type == http_response_models_1.DeviceType.SOLO_CAMERA ||
            type == http_response_models_1.DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }
    /**
     * Determines if the Device is a Sensor.
     */
    isSensor() {
        var type = this.device_info.device_type;
        if (type == http_response_models_1.DeviceType.SENSOR ||
            type == http_response_models_1.DeviceType.MOTION_SENSOR)
            return true;
        return false;
    }
    /**
     * Determines if the Device is a Keypad.
     */
    isKeyPad() {
        return http_response_models_1.DeviceType.KEYPAD == this.device_info.device_type;
    }
    /**
     * Determines if the Device is a Doorbell.
     */
    isDoorbell() {
        var type = this.device_info.device_type;
        if (type == http_response_models_1.DeviceType.DOORBELL ||
            type == http_response_models_1.DeviceType.BATTERY_DOORBELL ||
            type == http_response_models_1.DeviceType.BATTERY_DOORBELL_2)
            return true;
        return false;
    }
    /**
     * Determines if the Device is a Indoor Cam.
     */
    isIndoorCamera() {
        var type = this.device_info.device_type;
        if (type == http_response_models_1.DeviceType.INDOOR_CAMERA ||
            type == http_response_models_1.DeviceType.INDOOR_CAMERA_1080 ||
            type == http_response_models_1.DeviceType.INDOOR_PT_CAMERA ||
            type == http_response_models_1.DeviceType.INDOOR_PT_CAMERA_1080)
            return true;
        return false;
    }
    /**
     * Determines if the Device is a Floodlight.
     */
    isFloodLight() {
        return http_response_models_1.DeviceType.FLOODLIGHT == this.device_info.device_type;
    }
    /**
     * Determines if the Device is a Lock.
     */
    isLock() {
        var type = this.device_info.device_type;
        return http_response_models_1.DeviceType.LOCK_BASIC == type || http_response_models_1.DeviceType.LOCK_ADVANCED == type || http_response_models_1.DeviceType.LOCK_BASIC_NO_FINGER == type || http_response_models_1.DeviceType.LOCK_ADVANCED_NO_FINGER == type;
    }
    /**
     * Get the id of the Device in the eufy system.
     */
    getId() {
        return this.device_info.device_id;
    }
    /**
     * Get the serial number of the Device.
     */
    getSerialNumber() {
        return this.device_info.device_sn;
    }
    /**
     * Get the model name of the Device.
     */
    getModel() {
        return this.device_info.device_model;
    }
    /**
     * Get the device type of the Device.
     */
    getDeviceType() {
        return this.device_info.device_type;
    }
    /**
     * Get the device type as string for the Device.
     */
    getDeviceTypeString() {
        if (this.isCamera()) {
            return "camera";
        }
        else if (this.isSensor()) {
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
            return `unknown(${this.device_info.device_type})`;
        }
    }
    /**
     * Get the given name of the Device.
     */
    getName() {
        return this.device_info.device_name;
    }
    /**
     * Get the hardware version of the Device.
     */
    getHardwareVersion() {
        return this.device_info.main_hw_version;
    }
    /**
     * Get the software version of the Device.
     */
    getSoftwareVersion() {
        return this.device_info.main_sw_version;
    }
    /**
     * Get the mac address of the Device.
     */
    getMacAddress() {
        return this.device_info.wifi_mac;
    }
    /**
     * Get the serial number of the Base the Device is connected.
     */
    getBaseSerialConnected() {
        return this.device_info.station_sn;
    }
    /**
     * Get the url to the last image (only for cameras).
     */
    getLastImageUrl() {
        if (this.isCamera()) {
            return this.device_info.cover_path;
        }
        else {
            return "n/a";
        }
    }
    /**
     * Get the time of the last image (only for cameras).
     */
    getLastImageTime() {
        if (this.isCamera()) {
            return this.device_info.cover_time;
        }
        else {
            return -1;
        }
    }
    /**
     * Get the url of the last video (only for cameras).
     */
    getLastVideoUrl() {
        if (this.isCamera()) {
            return "";
        }
        else {
            return "";
        }
    }
    /**
     * Get the battery charge in percent (only for battery eqipped devices).
     */
    getBatteryCharge() {
        if (this.hasBattery()) {
            return this.batteryCharge;
        }
        else {
            return "n/a";
        }
    }
    /**
     * Get the temperature of the battery (only for battery equipped devices).
     */
    getBatteryTemperature() {
        if (this.hasBattery()) {
            return this.batteryTemperature;
        }
        else {
            return "n/a";
        }
    }
}
exports.Device = Device;
