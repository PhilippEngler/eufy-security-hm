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
exports.Devices = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const http_1 = require("./http");
/**
 * Represents all the Devices in the account.
 */
class Devices extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        super();
        this.devices = {};
        this.api = api;
        this.httpService = httpService;
    }
    /**
     * (Re)Loads all Devices and the settings of them.
     */
    loadDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.resDevices = this.httpService.getDevices();
                var deviceSerial;
                var device;
                if (this.resDevices != null) {
                    for (deviceSerial in this.resDevices) {
                        if (this.devices[deviceSerial]) {
                            device = this.devices[deviceSerial];
                            device.update(this.resDevices[deviceSerial]);
                        }
                        else {
                            device = new http_1.CommonDevice(this.httpService, this.resDevices[deviceSerial]);
                            if (device.isCamera()) {
                                if (!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras()) {
                                    device = new http_1.Camera(this.httpService, this.resDevices[deviceSerial]);
                                }
                                else if (device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras()) {
                                    device = new http_1.IndoorCamera(this.httpService, this.resDevices[deviceSerial]);
                                }
                                else if (!device.isIndoorCamera() && device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras()) {
                                    device = new http_1.FloodlightCamera(this.httpService, this.resDevices[deviceSerial]);
                                }
                                else if (!device.isIndoorCamera() && !device.isFloodLight() && device.isDoorbell() && !device.isSoloCameras()) {
                                    device = new http_1.DoorbellCamera(this.httpService, this.resDevices[deviceSerial]);
                                }
                                else if (!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && device.isSoloCameras()) {
                                    device = new http_1.SoloCamera(this.httpService, this.resDevices[deviceSerial]);
                                }
                                this.addEventListener(device, "PropertyChanged");
                                this.addEventListener(device, "RawPropertyChanged");
                                this.addEventListener(device, "MotionDetected");
                                this.addEventListener(device, "PersonDetected");
                                this.devices[device.getSerial()] = device;
                            }
                        }
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
     * Close all P2P connection for all devices.
     */
    closeP2PConnections() {
        if (this.resDevices != null) {
            for (var deviceSerial in this.resDevices) {
                this.addEventListener(this.devices[deviceSerial], "PropertyChanged");
                this.addEventListener(this.devices[deviceSerial], "RawPropertyChanged");
                this.addEventListener(this.devices[deviceSerial], "MotionDetected");
                this.addEventListener(this.devices[deviceSerial], "PersonDetected");
            }
        }
    }
    /**
     * Returns all Devices.
     */
    getDevices() {
        return this.devices;
    }
    /**
     * Add a given event listener for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    addEventListener(device, eventListenerName) {
        switch (eventListenerName) {
            case "PropertyChanged":
                device.on("property changed", (device, name, value) => this.onPropertyChanged(device, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for device ${device.getSerial()} added. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.on("raw property changed", (device, type, value, modified) => this.onRawPropertyChanged(device, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for device ${device.getSerial()} added. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "MotionDetected":
                device.on("motion detected", (device, state) => this.onMotionDetected(device, state));
                this.api.logDebug(`Listener 'MotionDetected' for device ${device.getSerial()} added. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device, state, person) => this.onPersonDetected(device, state, person));
                this.api.logDebug(`Listener 'PersonDetected' for device ${device.getSerial()} added. Total ${device.listenerCount("person detected")} Listener.`);
                break;
        }
    }
    /**
     * Remove all event listeners for a given event type for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    removeEventListener(device, eventListenerName) {
        switch (eventListenerName) {
            case "PropertyChanged":
                device.removeAllListeners("property changed");
                this.api.logDebug(`Listener 'PropertyChanged' for device ${device.getSerial()} removed. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener 'RawPropertyChanged' for device ${device.getSerial()} removed. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "MotionDetected":
                device.removeAllListeners("motion detected");
                this.api.logDebug(`Listener 'MotionDetected' for device ${device.getSerial()} removed. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.removeAllListeners("person detected");
                this.api.logDebug(`Listener 'PersonDetected' for device ${device.getSerial()} removed. Total ${device.listenerCount("person detected")} Listener.`);
                break;
        }
    }
    /**
     * The action to be one when event PropertyChanged is fired.
     * @param device The device as Device object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    onPropertyChanged(device, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.emit("device property changed", device, name, value);
            this.api.logDebug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value.value}`);
        });
    }
    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param device The device as Device object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     * @param modified The timestamp of the last change.
     */
    onRawPropertyChanged(device, type, value, modified) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.emit("device raw property changed", device, type, value, modified);
            this.api.logDebug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value} | modified: ${modified}`);
        });
    }
    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    onMotionDetected(device, state) {
        return __awaiter(this, void 0, void 0, function* () {
            this.api.logDebug(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
        });
    }
    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    onPersonDetected(device, state, person) {
        return __awaiter(this, void 0, void 0, function* () {
            this.api.logDebug(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        });
    }
    getDeviceByStationAndChannel(baseSerial, channel) {
        for (const device of Object.values(this.devices)) {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial)) {
                return device;
            }
        }
        this.api.logError(`No device with channel ${channel} found on station with serial number: ${baseSerial}.`);
        throw new Error("Error");
    }
    updateBatteryValues(baseSerial, channel, batteryLevel, temperature, modified) {
        try {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataBattery = device.getPropertyMetadata(http_1.PropertyName.DeviceBattery);
            if (metadataBattery !== undefined) {
                device.updateRawProperty(metadataBattery.key, { value: batteryLevel.toString(), timestamp: modified });
            }
            const metadataBatteryTemperature = device.getPropertyMetadata(http_1.PropertyName.DeviceBatteryTemp);
            if (metadataBatteryTemperature !== undefined) {
                device.updateRawProperty(metadataBatteryTemperature.key, { value: temperature.toString(), timestamp: modified });
            }
        }
        catch (error) {
            this.api.logError(`Station runtime state error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }
    updateChargingState(baseSerial, channel, chargeType, batteryLevel, modified) {
        try {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataBattery = device.getPropertyMetadata(http_1.PropertyName.DeviceBattery);
            if (metadataBattery !== undefined) {
                device.updateRawProperty(metadataBattery.key, { value: batteryLevel.toString(), timestamp: modified });
            }
            const metadataChargingStatus = device.getPropertyMetadata(http_1.PropertyName.DeviceChargingStatus);
            if (metadataChargingStatus !== undefined) {
                device.updateRawProperty(metadataChargingStatus.key, { value: chargeType.toString(), timestamp: modified });
            }
        }
        catch (error) {
            this.api.logError(`Station charging state error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }
    updateWifiRssi(baseSerial, channel, rssi, modified) {
        try {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataWifiRssi = device.getPropertyMetadata(http_1.PropertyName.DeviceWifiRSSI);
            if (metadataWifiRssi !== undefined) {
                device.updateRawProperty(metadataWifiRssi.key, { value: rssi.toString(), timestamp: modified });
            }
        }
        catch (error) {
            this.api.logError(`Station wifi rssi error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }
    updateDeviceProperties(deviceSerial, values) {
        this.devices[deviceSerial].updateRawProperties(values);
    }
}
exports.Devices = Devices;
