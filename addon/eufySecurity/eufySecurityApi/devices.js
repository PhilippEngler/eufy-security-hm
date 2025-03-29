"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Devices = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const events_1 = __importDefault(require("events"));
const error_1 = require("./error");
const http_1 = require("./http");
const p2p_1 = require("./p2p");
const utils_1 = require("./utils");
const types_1 = require("./utils/types");
const eventInteractions_1 = require("./eventInteractions");
const logging_1 = require("./logging");
const fs_1 = require("fs");
/**
 * Represents all the Devices in the account.
 */
class Devices extends tiny_typed_emitter_1.TypedEmitter {
    api;
    httpService;
    eventInteractions;
    devices = {};
    loadingEmitter = new events_1.default();
    devicesLoaded = (0, utils_1.waitForEvent)(this.loadingEmitter, "devices loaded");
    deviceSnoozeTimeout = new Map();
    errorImage = undefined;
    defaultImage = undefined;
    /**
     * Create the Devices objects holding all devices in the account.
     * @param api  The api.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        super();
        this.api = api;
        this.httpService = httpService;
        this.eventInteractions = new eventInteractions_1.EventInteractions(this.api);
        if (this.api.getApiUsePushService() === false) {
            logging_1.rootAddonLogger.info("Retrieving last video event times disabled in settings.");
        }
        const filePath = "www/assets/images";
        const errorFile = "errorImage";
        const defaultImage = "defaultImage";
        const language = this.api.getLanguage();
        try {
            const errorImageType = { ext: "jpg", mime: "image/jpeg" };
            if ((0, fs_1.existsSync)(`${filePath}/${errorFile}_${language}.${errorImageType.ext}`)) {
                this.errorImage = { data: (0, fs_1.readFileSync)(`${filePath}/${errorFile}_${language}.${errorImageType.ext}`), type: errorImageType };
            }
            else if ((0, fs_1.existsSync)(`${filePath}/${errorFile}_en.${errorImageType.ext}`)) {
                this.errorImage = { data: (0, fs_1.readFileSync)(`${filePath}/${errorFile}_en.${errorImageType.ext}`), type: errorImageType };
            }
            else {
                logging_1.rootAddonLogger.error(`The file for the error image ('${filePath}/${errorFile}_${language}.${errorImageType.ext}' or '${filePath}/${errorFile}_en.${errorImageType.ext}') could not be found.`);
                this.errorImage = undefined;
            }
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`Error occured at loading error image. Error: ${e.message}.`, JSON.stringify(e));
        }
        try {
            const defaultImageType = { ext: "jpg", mime: "image/jpeg" };
            if ((0, fs_1.existsSync)(`${filePath}/${defaultImage}_${language}.${defaultImageType.ext}`)) {
                this.defaultImage = { data: (0, fs_1.readFileSync)(`${filePath}/${defaultImage}_${language}.${defaultImageType.ext}`), type: defaultImageType };
            }
            else if ((0, fs_1.existsSync)(`${filePath}/${defaultImage}_en.${defaultImageType.ext}`)) {
                this.defaultImage = { data: (0, fs_1.readFileSync)(`${filePath}/${defaultImage}_en.${defaultImageType.ext}`), type: defaultImageType };
            }
            else {
                logging_1.rootAddonLogger.error(`The file for the default image ('${filePath}/${defaultImage}_${language}.${defaultImageType.ext}' or '${filePath}/${defaultImage}_en.${defaultImageType.ext}') could not be found.`);
                this.defaultImage = undefined;
            }
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`Error occured at loading default image. Error: ${e.message}.`, JSON.stringify(e));
        }
        this.httpService.on("devices", (devices) => this.handleDevices(devices));
    }
    /**
     * Handle the devices so that they can be used by the addon.
     * @param devices The devices object with all devices.
     */
    async handleDevices(devices) {
        logging_1.rootAddonLogger.debug("Got devices", { devices: devices });
        const resDevices = devices;
        const deviceSNs = Object.keys(this.devices);
        const newDeviceSNs = Object.keys(devices);
        const promises = [];
        const deviceConfig = this.api.getDeviceConfig();
        let deviceSerial;
        if (resDevices !== null) {
            for (deviceSerial in resDevices) {
                if (this.api.getHouseId() !== undefined && resDevices[deviceSerial].house_id !== undefined && this.api.getHouseId() !== "all" && resDevices[deviceSerial].house_id !== this.api.getHouseId()) {
                    logging_1.rootAddonLogger.debug(`Device ${deviceSerial} does not match houseId (got ${resDevices[deviceSerial].house_id} want ${this.api.getHouseId()}).`);
                    continue;
                }
                if (this.devices[deviceSerial]) {
                    this.updateDevice(resDevices[deviceSerial]);
                }
                else {
                    if (this.devicesLoaded === undefined) {
                        this.devicesLoaded = (0, utils_1.waitForEvent)(this.loadingEmitter, "devices loaded");
                    }
                    let new_device;
                    if (http_1.Device.isIndoorCamera(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.IndoorCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isSoloCameras(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.SoloCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isLockWifiVideo(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.DoorbellLock.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isBatteryDoorbell(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.BatteryDoorbellCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isWiredDoorbell(resDevices[deviceSerial].device_type) || http_1.Device.isWiredDoorbellDual(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.WiredDoorbellCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isFloodLight(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.FloodlightCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isWallLightCam(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.WallLightCam.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isGarageCamera(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.GarageCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isSmartDrop(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.SmartDrop.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isCamera(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Camera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isLock(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Lock.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isMotionSensor(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.MotionSensor.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isEntrySensor(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.EntrySensor.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isKeyPad(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Keypad.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isSmartSafe(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.SmartSafe.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isSmartTrack(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Tracker.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else if (http_1.Device.isLockKeypad(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.LockKeypad.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    else {
                        new_device = http_1.UnknownDevice.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }
                    promises.push(new_device.then((device) => {
                        try {
                            this.addEventListener(device, "PropertyChanged");
                            this.addEventListener(device, "RawPropertyChanged");
                            this.addEventListener(device, "CryingDetected");
                            this.addEventListener(device, "SoundDetected");
                            this.addEventListener(device, "PetDetected");
                            this.addEventListener(device, "VehicleDetected");
                            this.addEventListener(device, "MotionDetected");
                            this.addEventListener(device, "PersonDetected");
                            this.addEventListener(device, "Rings");
                            this.addEventListener(device, "Locked");
                            this.addEventListener(device, "Open");
                            this.addEventListener(device, "Ready");
                            this.addEventListener(device, "PackageDelivered");
                            this.addEventListener(device, "PackageStranded");
                            this.addEventListener(device, "PackageTaken");
                            this.addEventListener(device, "SomeoneLoitering");
                            this.addEventListener(device, "RadarMotionDetected");
                            this.addEventListener(device, "911Alarm");
                            this.addEventListener(device, "ShakeAlarm");
                            this.addEventListener(device, "WrongTryProtectAlarm");
                            this.addEventListener(device, "LongTimeNotClose");
                            this.addEventListener(device, "LowBattery");
                            this.addEventListener(device, "Jammed");
                            this.addEventListener(device, "StrangerPersonDetected");
                            this.addEventListener(device, "DogDetected");
                            this.addEventListener(device, "DogLickDetected");
                            this.addEventListener(device, "DogPoopDetected");
                            this.addEventListener(device, "Tampering");
                            this.addEventListener(device, "LowTemperature");
                            this.addEventListener(device, "HighTemperature");
                            this.addEventListener(device, "PinIncorrect");
                            this.addEventListener(device, "LidStuck");
                            this.addEventListener(device, "BatteryFullyCharged");
                            this.addDevice(device);
                            device.initialize();
                        }
                        catch (err) {
                            const error = (0, error_1.ensureError)(err);
                            logging_1.rootAddonLogger.error("HandleDevices Error", { error: (0, utils_1.getError)(error), deviceSN: device.getSerial() });
                        }
                        return device;
                    }));
                }
            }
            Promise.all(promises).then((devices) => {
                devices.forEach((device) => {
                    this.api.getStation(device.getStationSerial()).then((station) => {
                        if (!station.isConnected() && station.isP2PConnectableDevice()) {
                            if (device.isSoloCameras() && station.getConnectionType() !== p2p_1.P2PConnectionType.QUICKEST) {
                                station.setConnectionType(p2p_1.P2PConnectionType.QUICKEST);
                                logging_1.rootAddonLogger.debug(`Detected solo device '${station.getSerial()}': connect with connection type ${p2p_1.P2PConnectionType[station.getConnectionType()]}.`);
                            }
                            else if (!device.isSoloCameras() && station.getConnectionType() !== this.api.getP2PConnectionType()) {
                                station.setConnectionType(this.api.getP2PConnectionType());
                                logging_1.rootAddonLogger.debug(`Set p2p connection type for device ${station.getSerial()} to value from settings (${p2p_1.P2PConnectionType[station.getConnectionType()]}).`);
                            }
                            logging_1.rootAddonLogger.debug(`Initiate first station connection to get data over p2p`, { stationSN: station.getSerial() });
                            station.connect();
                        }
                    }).catch((err) => {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootAddonLogger.error("Error trying to connect to station after device loaded", { error: (0, utils_1.getError)(error), deviceSN: device.getSerial() });
                    });
                });
                this.loadingEmitter.emit("devices loaded");
                this.devicesLoaded = undefined;
            });
            if (promises.length === 0) {
                this.loadingEmitter.emit("devices loaded");
                this.devicesLoaded = undefined;
            }
            for (const deviceSN of deviceSNs) {
                if (!newDeviceSNs.includes(deviceSN)) {
                    this.getDevice(deviceSN).then((device) => {
                        this.removeDevice(device);
                    }).catch((err) => {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootAddonLogger.error("Error removing device", { error: (0, utils_1.getError)(error), deviceSN: deviceSN });
                    });
                }
            }
            this.emit("devices loaded");
        }
    }
    /**
     * Add the given device for using.
     * @param device The device object to add.
     */
    addDevice(device) {
        const serial = device.getSerial();
        if (serial && !Object.keys(this.devices).includes(serial)) {
            this.devices[serial] = device;
            this.emit("device added", device);
            if (device.isLock()) {
                this.api.getMqttService().subscribeLock(device.getSerial());
            }
            if (device.hasProperty(http_1.PropertyName.DevicePicture)) {
                if (this.defaultImage !== undefined) {
                    device.updateProperty(http_1.PropertyName.DevicePicture, this.defaultImage);
                }
            }
        }
        else {
            logging_1.rootAddonLogger.debug(`Device with this serial ${device.getSerial()} exists already and couldn't be added again!`);
        }
    }
    /**
     * Remove the given device.
     * @param device The device object to remove.
     */
    removeDevice(device) {
        const serial = device.getSerial();
        if (serial && Object.keys(this.devices).includes(serial)) {
            delete this.devices[serial];
            device.removeAllListeners();
            this.emit("device removed", device);
        }
        else {
            logging_1.rootAddonLogger.debug(`Device with this serial ${device.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }
    /**
     * Update the device information.
     * @param device The device object to update.
     */
    async updateDevice(device) {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        if (Object.keys(this.devices).includes(device.device_sn)) {
            this.devices[device.device_sn].update(device);
        }
        else {
            throw new error_1.DeviceNotFoundError(`Device with this serial ${device.device_sn} doesn't exists and couldn't be updated!`);
        }
    }
    /**
     * (Re)Loads all Devices and the settings of them.
     */
    async loadDevices() {
        try {
            this.handleDevices(this.httpService.getDevices());
        }
        catch (e) {
            this.devices = {};
            throw new Error(e);
        }
    }
    /**
     * Close all connections for all devices.
     */
    closeDevices() {
        if (this.devices !== null) {
            for (const deviceSerial in this.devices) {
                this.removeEventListener(this.devices[deviceSerial], "PropertyChanged");
                this.removeEventListener(this.devices[deviceSerial], "RawPropertyChanged");
                this.removeEventListener(this.devices[deviceSerial], "CryingDetected");
                this.removeEventListener(this.devices[deviceSerial], "SoundDetected");
                this.removeEventListener(this.devices[deviceSerial], "PetDetected");
                this.removeEventListener(this.devices[deviceSerial], "VehicleDetected");
                this.removeEventListener(this.devices[deviceSerial], "MotionDetected");
                this.removeEventListener(this.devices[deviceSerial], "PersonDetected");
                this.removeEventListener(this.devices[deviceSerial], "Rings");
                this.removeEventListener(this.devices[deviceSerial], "Locked");
                this.removeEventListener(this.devices[deviceSerial], "Open");
                this.removeEventListener(this.devices[deviceSerial], "Ready");
                this.removeEventListener(this.devices[deviceSerial], "PackageDelivered");
                this.removeEventListener(this.devices[deviceSerial], "PackageStranded");
                this.removeEventListener(this.devices[deviceSerial], "PackageTaken");
                this.removeEventListener(this.devices[deviceSerial], "SomeoneLoitering");
                this.removeEventListener(this.devices[deviceSerial], "RadarMotionDetected");
                this.removeEventListener(this.devices[deviceSerial], "911Alarm");
                this.removeEventListener(this.devices[deviceSerial], "ShakeAlarm");
                this.removeEventListener(this.devices[deviceSerial], "WrongTryProtectAlarm");
                this.removeEventListener(this.devices[deviceSerial], "LongTimeNotClose");
                this.removeEventListener(this.devices[deviceSerial], "LowBattery");
                this.removeEventListener(this.devices[deviceSerial], "Jammed");
                this.removeEventListener(this.devices[deviceSerial], "StrangerPersonDetected");
                this.removeEventListener(this.devices[deviceSerial], "DogDetected");
                this.removeEventListener(this.devices[deviceSerial], "DogLickDetected");
                this.removeEventListener(this.devices[deviceSerial], "DogPoopDetected");
                this.removeEventListener(this.devices[deviceSerial], "Tampering");
                this.removeEventListener(this.devices[deviceSerial], "LowTemperature");
                this.removeEventListener(this.devices[deviceSerial], "HighTemperature");
                this.removeEventListener(this.devices[deviceSerial], "PinIncorrect");
                this.removeEventListener(this.devices[deviceSerial], "LidStuck");
                this.removeEventListener(this.devices[deviceSerial], "BatteryFullyCharged");
                this.devices[deviceSerial].destroy();
            }
        }
    }
    /**
     * Close devices.
     */
    close() {
        Object.keys(this.deviceSnoozeTimeout).forEach(device_sn => {
            clearTimeout(this.deviceSnoozeTimeout.get(device_sn));
            this.deviceSnoozeTimeout.delete(device_sn);
        });
    }
    /**
     * Returns all Devices.
     */
    async getDevices() {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        return this.devices;
    }
    /**
     * Get the device specified by serial number.
     * @param deviceSerial The serial of the device.
     * @returns The device as Device object.
     */
    async getDevice(deviceSerial) {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        if (Object.keys(this.devices).includes(deviceSerial)) {
            return this.devices[deviceSerial];
        }
        throw new error_1.DeviceNotFoundError("Device doesn't exists", { context: { device: deviceSerial } });
    }
    /**
     * Returns a device specified by station and channel.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @returns The device specified by base and channel.
     */
    async getDeviceByStationAndChannel(baseSerial, channel) {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        for (const device of Object.values(this.devices)) {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial)) {
                return device;
            }
        }
        throw new error_1.DeviceNotFoundError("No device with passed channel found on station", { context: { station: baseSerial, channel: channel } });
    }
    async getDevicesFromStation(stationSerial) {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        const arr = [];
        Object.keys(this.devices).forEach((serialNumber) => {
            if (this.devices[serialNumber].getStationSerial() === stationSerial)
                arr.push(this.devices[serialNumber]);
        });
        return arr;
    }
    /**
     * Checks if a device with the given serial exists.
     * @param deviceSerial The deviceSerial of the device to check.
     * @returns True if device exists, otherwise false.
     */
    existDevice(deviceSerial) {
        const res = this.devices[deviceSerial];
        if (res) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Checks if the device a battery powered device.
     * @param deviceSerial The deviceSerial of the device.
     * @returns True if device is a battery powered device, otherwise false.
     */
    async hasDeviceBattery(deviceSerial) {
        let res = this.existDevice(deviceSerial);
        if (res) {
            res = (await (this.getDevice(deviceSerial))).hasBattery();
        }
        return res;
    }
    /**
     * Checks if the device a solo device.
     * @param deviceSerial The deviceSerial of the device.
     * @returns True if device is a solo device, otherwise false.
     */
    async isSoloDevice(deviceSerial) {
        let res = this.existDevice(deviceSerial);
        if (res) {
            res = (await (this.getDevice(deviceSerial))).isSoloCameras();
        }
        return res;
    }
    /**
     * Snoozes a given device for a given time.
     * @param device The device as object.
     * @param timeoutMS The snooze time in ms.
     */
    setDeviceSnooze(device, timeoutMS) {
        this.deviceSnoozeTimeout.set(device.getSerial(), setTimeout(() => {
            device.updateProperty(http_1.PropertyName.DeviceSnooze, false);
            device.updateProperty(http_1.PropertyName.DeviceSnoozeTime, 0);
            device.updateProperty(http_1.PropertyName.DeviceSnoozeStartTime, 0);
            if (device.hasProperty(http_1.PropertyName.DeviceSnoozeHomebase)) {
                device.updateProperty(http_1.PropertyName.DeviceSnoozeHomebase, false);
            }
            if (device.hasProperty(http_1.PropertyName.DeviceSnoozeMotion)) {
                device.updateProperty(http_1.PropertyName.DeviceSnoozeMotion, false);
            }
            if (device.hasProperty(http_1.PropertyName.DeviceSnoozeChime)) {
                device.updateProperty(http_1.PropertyName.DeviceSnoozeChime, false);
            }
            this.deviceSnoozeTimeout.delete(device.getSerial());
        }, timeoutMS));
    }
    /**
     * Add a given event listener for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    addEventListener(device, eventListenerName) {
        switch (eventListenerName) {
            case "PropertyChanged":
                device.on("property changed", (device, name, value, ready) => this.onDevicePropertyChanged(device, name, value, ready));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.on("raw property changed", (device, type, value) => this.onRawPropertyChanged(device, type, value));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.on("crying detected", (device, state) => this.onCryingDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.on("sound detected", (device, state) => this.onSoundDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.on("pet detected", (device, state) => this.onPetDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.on("vehicle detected", (device, state) => this.onVehicleDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.on("motion detected", (device, state) => this.onMotionDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device, state, person) => this.onPersonDetected(device, state, person));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.on("rings", (device, state) => this.onRings(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.on("locked", (device, state) => this.onLocked(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.on("open", (device, state) => this.onOpen(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.on("ready", (device) => this.onReady(device));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.on("package delivered", (device, state) => this.onDevicePackageDelivered(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.on("package stranded", (device, state) => this.onDevicePackageStranded(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.on("package taken", (device, state) => this.onDevicePackageTaken(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.on("someone loitering", (device, state) => this.onDeviceSomeoneLoitering(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.on("radar motion detected", (device, state) => this.onDeviceRadarMotionDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.on("911 alarm", (device, state, detail) => this.onDevice911Alarm(device, state, detail));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.on("shake alarm", (device, state, detail) => this.onDeviceShakeAlarm(device, state, detail));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.on("wrong try-protect alarm", (device, state) => this.onDeviceWrongTryProtectAlarm(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.on("long time not close", (device, state) => this.onDeviceLongTimeNotClose(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.on("low battery", (device, state) => this.onDeviceLowBattery(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.on("jammed", (device, state) => this.onDeviceJammed(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.on("stranger person detected", (device, state) => this.onDeviceStrangerPersonDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.on("dog detected", (device, state) => this.onDeviceDogDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.on("dog lick detected", (device, state) => this.onDeviceDogLickDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.on("dog poop detected", (device, state) => this.onDeviceDogPoopDetected(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog poop detected")} Listener.`);
                break;
            case "Tampering":
                device.on("tampering", (device, state) => this.onDeviceTampering(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("tampering")} Listener.`);
                break;
            case "LowTemperature":
                device.on("low temperature", (device, state) => this.onDeviceLowTemperature(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("low temperature")} Listener.`);
                break;
            case "HighTemperature":
                device.on("high temperature", (device, state) => this.onDeviceHighTemperature(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("high temperature")} Listener.`);
                break;
            case "PinIncorrect":
                device.on("pin incorrect", (device, state) => this.onDevicePinIncorrect(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("pin incorrect")} Listener.`);
                break;
            case "LidStuck":
                device.on("lid stuck", (device, state) => this.onDeviceLidStuck(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("lid stuck")} Listener.`);
                break;
            case "BatteryFullyCharged":
                device.on("battery fully charged", (device, state) => this.onDeviceBatteryFullyCharged(device, state));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("battery fully charged")} Listener.`);
                break;
            default:
                logging_1.rootAddonLogger.error(`Error adding event listener: Unknown event listener name '${eventListenerName}'.`);
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
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.removeAllListeners("raw property changed");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.removeAllListeners("crying detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.removeAllListeners("sound detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.removeAllListeners("pet detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.removeAllListeners("vehicle detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.removeAllListeners("motion detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.removeAllListeners("person detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.removeAllListeners("rings");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.removeAllListeners("locked");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.removeAllListeners("open");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.removeAllListeners("ready");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.removeAllListeners("package delivered");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.removeAllListeners("package stranded");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.removeAllListeners("package taken");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.removeAllListeners("someone loitering");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.removeAllListeners("radar motion detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.removeAllListeners("911 alarm");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.removeAllListeners("shake alarm");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.removeAllListeners("wrong try-protect alarm");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.removeAllListeners("long time not close");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.removeAllListeners("low battery");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.removeAllListeners("jammed");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.removeAllListeners("stranger person detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.removeAllListeners("dog detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.removeAllListeners("dog lick detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.removeAllListeners("dog poop detected");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog poop detected")} Listener.`);
                break;
            case "Tampering":
                device.removeAllListeners("tampering");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("tampering")} Listener.`);
                break;
            case "LowTemperature":
                device.removeAllListeners("low temperature");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("low temperature")} Listener.`);
                break;
            case "HighTemperature":
                device.removeAllListeners("high temperature");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("high temperature")} Listener.`);
                break;
            case "PinIncorrect":
                device.removeAllListeners("pin incorrect");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("pin incorrect")} Listener.`);
                break;
            case "LidStuck":
                device.removeAllListeners("lid stuck");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("lid stuck")} Listener.`);
                break;
            case "BatteryFullyCharged":
                device.removeAllListeners("battery fully charged");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("battery fully charged")} Listener.`);
                break;
            default:
                logging_1.rootAddonLogger.error(`Error removing event listener: Unknown event listener name '${eventListenerName}'.`);
        }
    }
    /**
     * The action to be one when event PropertyChanged is fired.
     * @param device The device as Device object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    async onDevicePropertyChanged(device, name, value, ready) {
        //this.emit("device property changed", device, name, value);
        logging_1.rootAddonLogger.debug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value}`);
        try {
            if (ready && !name.startsWith("hidden-")) {
                this.emit("device property changed", device, name, value);
            }
            if (name === http_1.PropertyName.DeviceRTSPStream && value === true && (device.getPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl) === undefined || (device.getPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl) !== undefined && device.getPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl) === ""))) {
                this.api.getStation(device.getStationSerial()).then((station) => {
                    station.setRTSPStream(device, true);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    logging_1.rootAddonLogger.error(`Device property changed error - station enable rtsp`, { error: (0, utils_1.getError)(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
                });
            }
            else if (name === http_1.PropertyName.DeviceRTSPStream && value === false) {
                device.setCustomPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl, "");
            }
            else if (name === http_1.PropertyName.DevicePictureUrl && value !== "") {
                if (!(0, utils_1.isValidUrl)(value)) {
                    this.api.getStation(device.getStationSerial()).then((station) => {
                        if (station.hasCommand(http_1.CommandName.StationDownloadImage)) {
                            station.downloadImage(value);
                        }
                    }).catch((err) => {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootAddonLogger.error(`Device property changed error - station download image`, { error: (0, utils_1.getError)(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
                    });
                }
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Device property changed error`, { error: (0, utils_1.getError)(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
        }
    }
    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param device The device as Device object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    async onRawPropertyChanged(device, type, value) {
        //this.emit("device raw property changed", device, type, value, modified);
        logging_1.rootAddonLogger.debug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value}`);
    }
    /**
     * The action to be one when event CryingDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onCryingDetected(device, state) {
        logging_1.rootAddonLogger.debug(`Event "CryingDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.CRYING);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onCryingDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onCryingDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event SoundDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onSoundDetected(device, state) {
        logging_1.rootAddonLogger.debug(`Event "SoundDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.SOUND);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onSoundDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onSoundDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event PetDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onPetDetected(device, state) {
        logging_1.rootAddonLogger.debug(`Event "PetDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.PET);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onPetDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onPetDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event VehicleDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    onVehicleDetected(device, state) {
        logging_1.rootAddonLogger.debug(`Event "VehicleDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.VEHICLE);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onVehicleDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onVehicleDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onMotionDetected(device, state) {
        logging_1.rootAddonLogger.debug(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.MOTION);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onMotionDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onMotionDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    async onPersonDetected(device, state, person) {
        logging_1.rootAddonLogger.debug(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.PERSON);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onPersonDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onPersonDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event Rings is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onRings(device, state) {
        logging_1.rootAddonLogger.debug(`Event "Rings": device: ${device.getSerial()} | state: ${state}`);
        try {
            const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.RING);
            if (deviceEventInteraction !== null) {
                this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
            }
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`Event "onRings": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
            logging_1.rootAddonLogger.debug(`Event "onRings": device ${device.getSerial()}`, JSON.stringify(e));
        }
    }
    /**
     * The action to be one when event Locked is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onLocked(device, state) {
        logging_1.rootAddonLogger.debug(`Event "Locked": device: ${device.getSerial()} | state: ${state}`);
    }
    /**
     * The action to be one when event Open is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onOpen(device, state) {
        logging_1.rootAddonLogger.debug(`Event "Open": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.OPEN);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onOpen": device ${device.getSerial()} | state: ${state} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onOpen": device ${device.getSerial()} | state: ${state}`, JSON.stringify(e));
            }
        }
        if (state === false) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.CLOSE);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onOpen": device ${device.getSerial()} | state: ${state} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onOpen": device ${device.getSerial()} | state: ${state}`, JSON.stringify(e));
            }
        }
    }
    /**
     * The action to be one when event Ready is fired.
     * @param device The device as Device object.
     */
    async onReady(device) {
        logging_1.rootAddonLogger.debug(`Event "Ready": device: ${device.getSerial()}`);
        try {
            if (device.getPropertyValue(http_1.PropertyName.DeviceRTSPStream) !== undefined && device.getPropertyValue(http_1.PropertyName.DeviceRTSPStream) === true) {
                this.api.getStation(device.getStationSerial()).then((station) => {
                    station.setRTSPStream(device, true);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    logging_1.rootAddonLogger.error(`Device ready error - station enable rtsp`, { error: (0, utils_1.getError)(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial() });
                });
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Device ready error`, { error: (0, utils_1.getError)(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial() });
        }
    }
    /**
     * The action to be one when event DevicePackageDelivered is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDevicePackageDelivered(device, state) {
        this.emit("device package delivered", device, state);
    }
    /**
     * The action to be one when event DevicePackageStranded is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDevicePackageStranded(device, state) {
        this.emit("device package stranded", device, state);
    }
    /**
     * The action to be one when event DevicePackageTaken is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDevicePackageTaken(device, state) {
        this.emit("device package taken", device, state);
    }
    /**
     * The action to be one when event DeviceSomeoneLoitering is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceSomeoneLoitering(device, state) {
        this.emit("device someone loitering", device, state);
    }
    /**
     * The action to be one when event DeviceRadarMotionDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceRadarMotionDetected(device, state) {
        this.emit("device radar motion detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.RADAR_MOTION);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onDeviceRadarMotionDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onDeviceRadarMotionDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event Device911Alarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     * @param detail The detail.
     */
    onDevice911Alarm(device, state, detail) {
        this.emit("device 911 alarm", device, state, detail);
    }
    /**
     * The action to be one when event DeviceShakeAlarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     * @param detail The detail.
     */
    onDeviceShakeAlarm(device, state, detail) {
        this.emit("device shake alarm", device, state, detail);
    }
    /**
     * The action to be one when event DeviceWrongTryProtectAlarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceWrongTryProtectAlarm(device, state) {
        this.emit("device wrong try-protect alarm", device, state);
    }
    /**
     * The action to be one when event DeviceLongTimeNotClose is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceLongTimeNotClose(device, state) {
        this.emit("device long time not close", device, state);
    }
    /**
     * The action to be one when event DeviceLowBattery is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceLowBattery(device, state) {
        this.emit("device low battery", device, state);
    }
    /**
     * The action to be one when event DeviceJammed is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceJammed(device, state) {
        this.emit("device jammed", device, state);
    }
    /**
     * The action to be one when event DeviceStrangerPersonDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceStrangerPersonDetected(device, state) {
        this.emit("device stranger person detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.STRANGER_PERSON);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onDeviceStrangerPersonDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onDeviceStrangerPersonDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event DeviceDogDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceDogDetected(device, state) {
        this.emit("device dog detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.DOG);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onDeviceDogDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onDeviceDogDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event DeviceDogLickDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceDogLickDetected(device, state) {
        this.emit("device dog lick detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.DOG_LICK);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onDeviceDogLickDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onDeviceDogLickDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event DeviceDogPoopDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceDogPoopDetected(device, state) {
        this.emit("device dog poop detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), types_1.EventInteractionType.DOG_POOP);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            }
            catch (e) {
                logging_1.rootAddonLogger.error(`Event "onDeviceDogPoopDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                logging_1.rootAddonLogger.debug(`Event "onDeviceDogPoopDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) { }
    }
    /**
     * The action to be one when event DeviceTampering is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceTampering(device, state) {
        this.emit("device tampering", device, state);
    }
    /**
     * The action to be one when event DeviceLowTemperature is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceLowTemperature(device, state) {
        this.emit("device low temperature", device, state);
    }
    /**
     * The action to be one when event DeviceHighTemperature is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceHighTemperature(device, state) {
        this.emit("device high temperature", device, state);
    }
    /**
     * The action to be one when event DevicePinIncorrect is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDevicePinIncorrect(device, state) {
        this.emit("device pin incorrect", device, state);
    }
    /**
     * The action to be one when event DeviceLidStuck is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceLidStuck(device, state) {
        this.emit("device lid stuck", device, state);
    }
    /**
     * The action to be one when event DeviceBatteryFullyCharged is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceBatteryFullyCharged(device, state) {
        this.emit("device battery fully charged", device, state);
    }
    /**
     * Update the raw values for a given device.
     * @param deviceSerial The serial of the device.
     * @param values The raw values.
     */
    async updateDeviceProperties(deviceSerial, values) {
        this.getDevice(deviceSerial).then((device) => {
            device.updateRawProperties(values);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error("Update device properties error", { error: (0, utils_1.getError)(error), deviceSN: deviceSerial, values: values });
        });
    }
    /**
     * Retrieves the last event of the given device.
     * @param deviceSerial The serial of the device.
     */
    async getDeviceLastEvent(deviceSerial) {
        this.getDevice(deviceSerial).then((device) => {
            this.api.getStation(device.getStationSerial()).then((station) => {
                station.databaseQueryLatestInfo();
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                logging_1.rootAddonLogger.error(`Get Device Last Event - Station Error`, { error: (0, utils_1.getError)(error), deviceSN: deviceSerial });
            });
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Get Device Last Event - Device Error`, { error: (0, utils_1.getError)(error), deviceSN: deviceSerial });
        });
    }
    /**
     * Retrieves the last event of all devices.
     */
    async getDevicesLastEvent() {
        this.api.getStations().then((stations) => {
            for (const station in stations) {
                stations[station].databaseQueryLatestInfo();
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Get Devices Last Event - Station Error`, { error: (0, utils_1.getError)(error) });
        });
    }
    /**
     * Retrieve the interactions for a given device.
     * @param deviceSerial The serial of the device.
     */
    getDeviceInteractions(deviceSerial) {
        return this.eventInteractions.getDeviceInteractions(deviceSerial);
    }
    /**
     * Retrieve the interaction for a given eventInteractionType for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    getDeviceInteraction(deviceSerial, eventInteractionType) {
        return this.eventInteractions.getDeviceEventInteraction(deviceSerial, eventInteractionType);
    }
    /**
     * Updates a interaction for a given eventInteractionType for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     * @param deviceEventInteraction The eventIntegration data.
     */
    setDeviceInteraction(deviceSerial, eventInteractionType, deviceEventInteraction) {
        return this.eventInteractions.setDeviceInteraction(deviceSerial, eventInteractionType, deviceEventInteraction);
    }
    /**
     * Delete a specified interaction for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    deleteDeviceInteraction(deviceSerial, eventInteractionType) {
        return this.eventInteractions.deleteDeviceEventInteraction(deviceSerial, eventInteractionType);
    }
    /**
     * Remove all integrations.
     * @returns true, if all integrations deleted, otherwise false.
     */
    removeInteractions() {
        return this.eventInteractions.removeIntegrations();
    }
    /**
     * Set the given property for the given device to the given value.
     * @param deviceSerial The serial of the device the property is to change.
     * @param name The name of the property.
     * @param value The value of the property.
     */
    async setDeviceProperty(deviceSerial, name, value) {
        const device = await this.devices[deviceSerial];
        const station = await this.api.getStation(device.getStationSerial());
        const metadata = device.getPropertyMetadata(name);
        value = (0, utils_1.parseValue)(metadata, value);
        switch (name) {
            case http_1.PropertyName.DeviceEnabled:
                station.enableDevice(device, value);
                break;
            case http_1.PropertyName.DeviceStatusLed:
                station.setStatusLed(device, value);
                break;
            case http_1.PropertyName.DeviceAutoNightvision:
                station.setAutoNightVision(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetection:
                station.setMotionDetection(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetection:
                station.setSoundDetection(device, value);
                break;
            case http_1.PropertyName.DevicePetDetection:
                station.setPetDetection(device, value);
                break;
            case http_1.PropertyName.DeviceRTSPStream:
                station.setRTSPStream(device, value);
                break;
            case http_1.PropertyName.DeviceAntitheftDetection:
                station.setAntiTheftDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLocked:
                station.lockDevice(device, value);
                break;
            case http_1.PropertyName.DeviceWatermark:
                station.setWatermark(device, value);
                break;
            case http_1.PropertyName.DeviceLight:
                station.switchLight(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsEnable:
                station.setFloodlightLightSettingsEnable(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsBrightnessManual:
                station.setFloodlightLightSettingsBrightnessManual(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsBrightnessMotion:
                station.setFloodlightLightSettingsBrightnessMotion(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsBrightnessSchedule:
                station.setFloodlightLightSettingsBrightnessSchedule(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionTriggered:
                station.setFloodlightLightSettingsMotionTriggered(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionTriggeredDistance:
                station.setFloodlightLightSettingsMotionTriggeredDistance(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionTriggeredTimer:
                station.setFloodlightLightSettingsMotionTriggeredTimer(device, value);
                break;
            case http_1.PropertyName.DeviceMicrophone:
                station.setMicMute(device, value);
                break;
            case http_1.PropertyName.DeviceSpeaker:
                station.enableSpeaker(device, value);
                break;
            case http_1.PropertyName.DeviceSpeakerVolume:
                station.setSpeakerVolume(device, value);
                break;
            case http_1.PropertyName.DeviceAudioRecording:
                station.setAudioRecording(device, value);
                break;
            case http_1.PropertyName.DevicePowerSource:
                station.setPowerSource(device, value);
                break;
            case http_1.PropertyName.DevicePowerWorkingMode:
                station.setPowerWorkingMode(device, value);
                break;
            case http_1.PropertyName.DeviceRecordingEndClipMotionStops:
                station.setRecordingEndClipMotionStops(device, value);
                break;
            case http_1.PropertyName.DeviceRecordingClipLength:
                station.setRecordingClipLength(device, value);
                break;
            case http_1.PropertyName.DeviceRecordingRetriggerInterval:
                station.setRecordingRetriggerInterval(device, value);
                break;
            case http_1.PropertyName.DeviceVideoStreamingQuality:
                station.setVideoStreamingQuality(device, value);
                break;
            case http_1.PropertyName.DeviceVideoRecordingQuality:
                station.setVideoRecordingQuality(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivity:
                station.setMotionDetectionSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionTracking:
                station.setMotionTracking(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionType:
                station.setMotionDetectionType(device, value);
                break;
            case http_1.PropertyName.DeviceMotionZone:
                station.setMotionZone(device, value);
                break;
            case http_1.PropertyName.DeviceVideoWDR:
                station.setWDR(device, value);
                break;
            case http_1.PropertyName.DeviceRingtoneVolume:
                station.setRingtoneVolume(device, value);
                break;
            case http_1.PropertyName.DeviceChimeIndoor:
                station.enableIndoorChime(device, value);
                break;
            case http_1.PropertyName.DeviceChimeHomebase:
                station.enableHomebaseChime(device, value);
                break;
            case http_1.PropertyName.DeviceChimeHomebaseRingtoneVolume:
                station.setHomebaseChimeRingtoneVolume(device, value);
                break;
            case http_1.PropertyName.DeviceChimeHomebaseRingtoneType:
                station.setHomebaseChimeRingtoneType(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationType:
                station.setNotificationType(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationPerson:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, http_1.IndoorS350NotificationTypes.HUMAN, value);
                }
                else if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, http_1.FloodlightT8425NotificationTypes.HUMAN, value);
                }
                else {
                    station.setNotificationPerson(device, value);
                }
                break;
            case http_1.PropertyName.DeviceNotificationPet:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, http_1.IndoorS350NotificationTypes.PET, value);
                }
                else if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, http_1.FloodlightT8425NotificationTypes.PET, value);
                }
                else {
                    station.setNotificationPet(device, value);
                }
                break;
            case http_1.PropertyName.DeviceNotificationAllOtherMotion:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, http_1.IndoorS350NotificationTypes.ALL_OTHER_MOTION, value);
                }
                else if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, http_1.FloodlightT8425NotificationTypes.ALL_OTHER_MOTION, value);
                }
                else {
                    station.setNotificationAllOtherMotion(device, value);
                }
                break;
            case http_1.PropertyName.DeviceNotificationAllSound:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, http_1.IndoorS350NotificationTypes.ALL_SOUND, value);
                }
                else {
                    station.setNotificationAllSound(device, value);
                }
                break;
            case http_1.PropertyName.DeviceNotificationCrying:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, http_1.IndoorS350NotificationTypes.CRYING, value);
                }
                else {
                    station.setNotificationCrying(device, value);
                }
            case http_1.PropertyName.DeviceNotificationVehicle:
                if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, http_1.FloodlightT8425NotificationTypes.VEHICLE, value);
                }
                else {
                    throw new http_1.InvalidPropertyError("Station has no writable property", { context: { station: station.getSerial(), propertyName: name, propertyValue: value } });
                }
                break;
            case http_1.PropertyName.DeviceNotificationMotion:
                station.setNotificationMotion(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationRing:
                station.setNotificationRing(device, value);
                break;
            case http_1.PropertyName.DeviceChirpVolume:
                station.setChirpVolume(device, value);
                break;
            case http_1.PropertyName.DeviceChirpTone:
                station.setChirpTone(device, value);
                break;
            case http_1.PropertyName.DeviceVideoHDR:
                station.setHDR(device, value);
                break;
            case http_1.PropertyName.DeviceVideoDistortionCorrection:
                station.setDistortionCorrection(device, value);
                break;
            case http_1.PropertyName.DeviceVideoRingRecord:
                station.setRingRecord(device, value);
                break;
            case http_1.PropertyName.DeviceRotationSpeed:
                station.setPanAndTiltRotationSpeed(device, value);
                break;
            case http_1.PropertyName.DeviceNightvision:
                station.setNightVision(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRange:
                station.setMotionDetectionRange(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeStandardSensitivity:
                station.setMotionDetectionRangeStandardSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeAdvancedLeftSensitivity:
                station.setMotionDetectionRangeAdvancedLeftSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeAdvancedMiddleSensitivity:
                station.setMotionDetectionRangeAdvancedMiddleSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeAdvancedRightSensitivity:
                station.setMotionDetectionRangeAdvancedRightSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTestMode:
                station.setMotionDetectionTestMode(device, value);
                break;
            case http_1.PropertyName.DeviceMotionTrackingSensitivity:
                station.setMotionTrackingSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionAutoCruise:
                station.setMotionAutoCruise(device, value);
                break;
            case http_1.PropertyName.DeviceMotionOutOfViewDetection:
                station.setMotionOutOfViewDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColorTemperatureManual:
                station.setLightSettingsColorTemperatureManual(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColorTemperatureMotion:
                station.setLightSettingsColorTemperatureMotion(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColorTemperatureSchedule:
                station.setLightSettingsColorTemperatureSchedule(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionActivationMode:
                station.setLightSettingsMotionActivationMode(device, value);
                break;
            case http_1.PropertyName.DeviceVideoNightvisionImageAdjustment:
                station.setVideoNightvisionImageAdjustment(device, value);
                break;
            case http_1.PropertyName.DeviceVideoColorNightvision:
                station.setVideoColorNightvision(device, value);
                break;
            case http_1.PropertyName.DeviceAutoCalibration:
                station.setAutoCalibration(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLock:
                station.setAutoLock(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockSchedule:
                station.setAutoLockSchedule(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockScheduleStartTime:
                station.setAutoLockScheduleStartTime(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockScheduleEndTime:
                station.setAutoLockScheduleEndTime(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockTimer:
                station.setAutoLockTimer(device, value);
                break;
            case http_1.PropertyName.DeviceOneTouchLocking:
                station.setOneTouchLocking(device, value);
                break;
            case http_1.PropertyName.DeviceSound:
                station.setSound(device, value);
                break;
            case http_1.PropertyName.DeviceNotification:
                station.setNotification(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationLocked:
                station.setNotificationLocked(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationUnlocked:
                station.setNotificationUnlocked(device, value);
                break;
            case http_1.PropertyName.DeviceScramblePasscode:
                station.setScramblePasscode(device, value);
                break;
            case http_1.PropertyName.DeviceWrongTryProtection:
                station.setWrongTryProtection(device, value);
                break;
            case http_1.PropertyName.DeviceWrongTryAttempts:
                station.setWrongTryAttempts(device, value);
                break;
            case http_1.PropertyName.DeviceWrongTryLockdownTime:
                station.setWrongTryLockdownTime(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringDetection:
                station.setLoiteringDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringDetectionRange:
                station.setLoiteringDetectionRange(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringDetectionLength:
                station.setLoiteringDetectionLength(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponse:
                station.setLoiteringCustomResponseAutoVoiceResponse(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseHomeBaseNotification:
                station.setLoiteringCustomResponseHomeBaseNotification(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponsePhoneNotification:
                station.setLoiteringCustomResponsePhoneNotification(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice:
                station.setLoiteringCustomResponseAutoVoiceResponseVoice(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseTimeFrom:
                station.setLoiteringCustomResponseTimeFrom(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseTimeTo:
                station.setLoiteringCustomResponseTimeTo(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityMode:
                station.setMotionDetectionSensitivityMode(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityStandard:
                station.setMotionDetectionSensitivityStandard(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedA:
                station.setMotionDetectionSensitivityAdvancedA(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedB:
                station.setMotionDetectionSensitivityAdvancedB(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedC:
                station.setMotionDetectionSensitivityAdvancedC(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedD:
                station.setMotionDetectionSensitivityAdvancedD(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedE:
                station.setMotionDetectionSensitivityAdvancedE(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedF:
                station.setMotionDetectionSensitivityAdvancedF(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedG:
                station.setMotionDetectionSensitivityAdvancedG(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedH:
                station.setMotionDetectionSensitivityAdvancedH(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuard:
                station.setDeliveryGuard(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuarding:
                station.setDeliveryGuardPackageGuarding(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuardingVoiceResponseVoice:
                station.setDeliveryGuardPackageGuardingVoiceResponseVoice(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeFrom:
                station.setDeliveryGuardPackageGuardingActivatedTimeFrom(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeTo:
                station.setDeliveryGuardPackageGuardingActivatedTimeTo(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardUncollectedPackageAlert:
                station.setDeliveryGuardUncollectedPackageAlert(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageLiveCheckAssistance:
                station.setDeliveryGuardPackageLiveCheckAssistance(device, value);
                break;
            case http_1.PropertyName.DeviceDualCamWatchViewMode:
                station.setDualCamWatchViewMode(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponse:
                station.setRingAutoResponse(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseVoiceResponse:
                station.setRingAutoResponseVoiceResponse(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseVoiceResponseVoice:
                station.setRingAutoResponseVoiceResponseVoice(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseTimeFrom:
                station.setRingAutoResponseTimeFrom(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseTimeTo:
                station.setRingAutoResponseTimeTo(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationRadarDetector:
                station.setNotificationRadarDetector(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetectionSensitivity:
                station.setSoundDetectionSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceContinuousRecording:
                station.setContinuousRecording(device, value);
                break;
            case http_1.PropertyName.DeviceContinuousRecordingType:
                station.setContinuousRecordingType(device, value);
                break;
            case http_1.PropertyName.DeviceDefaultAngle:
                station.enableDefaultAngle(device, value);
                break;
            case http_1.PropertyName.DeviceDefaultAngleIdleTime:
                station.setDefaultAngleIdleTime(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationIntervalTime:
                station.setNotificationIntervalTime(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetectionRoundLook:
                station.setSoundDetectionRoundLook(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardUncollectedPackageAlertTimeToCheck:
                station.setDeliveryGuardUncollectedPackageAlertTimeToCheck(device, value);
                break;
            case http_1.PropertyName.DeviceLeftOpenAlarm:
            case http_1.PropertyName.DeviceLeftOpenAlarmDuration:
            case http_1.PropertyName.DeviceDualUnlock:
            case http_1.PropertyName.DevicePowerSave:
            case http_1.PropertyName.DeviceInteriorBrightness:
            case http_1.PropertyName.DeviceInteriorBrightnessDuration:
            case http_1.PropertyName.DeviceTamperAlarm:
            case http_1.PropertyName.DeviceRemoteUnlock:
            case http_1.PropertyName.DeviceRemoteUnlockMasterPIN:
            case http_1.PropertyName.DeviceAlarmVolume:
            case http_1.PropertyName.DevicePromptVolume:
            case http_1.PropertyName.DeviceNotificationUnlockByKey:
            case http_1.PropertyName.DeviceNotificationUnlockByPIN:
            case http_1.PropertyName.DeviceNotificationUnlockByFingerprint:
            case http_1.PropertyName.DeviceNotificationUnlockByApp:
            case http_1.PropertyName.DeviceNotificationDualUnlock:
            case http_1.PropertyName.DeviceNotificationDualLock:
            case http_1.PropertyName.DeviceNotificationWrongTryProtect:
            case http_1.PropertyName.DeviceNotificationJammed:
                station.setSmartSafeParams(device, name, value);
                break;
            case http_1.PropertyName.DeviceVideoTypeStoreToNAS:
                station.setVideoTypeStoreToNAS(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeHumanRecognition:
                station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.HUMAN_RECOGNITION, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeHuman:
                if (device.isWallLightCam()) {
                    station.setMotionDetectionTypeHuman(device, value);
                }
                else if (device.isOutdoorPanAndTiltCamera()) {
                    station.setMotionDetectionTypeHB3(device, http_1.T8170DetectionTypes.HUMAN_DETECTION, value);
                }
                else if (device.isSoloCameras()) {
                    station.setMotionDetectionTypeHB3(device, http_1.SoloCameraDetectionTypes.HUMAN_DETECTION, value);
                }
                else if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setMotionDetectionTypeHB3(device, http_1.IndoorS350DetectionTypes.HUMAN_DETECTION, value);
                }
                else {
                    station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.HUMAN_DETECTION, value);
                }
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypePet:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setMotionDetectionTypeHB3(device, http_1.IndoorS350DetectionTypes.PET_DETECTION, value);
                }
                else {
                    station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.PET_DETECTION, value);
                }
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeVehicle:
                if (device.isOutdoorPanAndTiltCamera()) {
                    station.setMotionDetectionTypeHB3(device, http_1.T8170DetectionTypes.VEHICLE_DETECTION, value);
                }
                else {
                    station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.VEHICLE_DETECTION, value);
                }
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeAllOtherMotions:
                if (device.isWallLightCam()) {
                    station.setMotionDetectionTypeAllOtherMotions(device, value);
                }
                else if (device.isOutdoorPanAndTiltCamera()) {
                    station.setMotionDetectionTypeHB3(device, http_1.T8170DetectionTypes.ALL_OTHER_MOTION, value);
                }
                else if (device.isSoloCameras()) {
                    station.setMotionDetectionTypeHB3(device, http_1.SoloCameraDetectionTypes.ALL_OTHER_MOTION, value);
                }
                else if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setMotionDetectionTypeHB3(device, http_1.IndoorS350DetectionTypes.ALL_OTHER_MOTION, value);
                }
                else {
                    station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.ALL_OTHER_MOTION, value);
                }
                break;
            case http_1.PropertyName.DeviceLightSettingsManualLightingActiveMode:
                station.setLightSettingsManualLightingActiveMode(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsManualDailyLighting:
                station.setLightSettingsManualDailyLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsManualColoredLighting:
                station.setLightSettingsManualColoredLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsManualDynamicLighting:
                station.setLightSettingsManualDynamicLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionLightingActiveMode:
                station.setLightSettingsMotionLightingActiveMode(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionDailyLighting:
                station.setLightSettingsMotionDailyLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionColoredLighting:
                station.setLightSettingsMotionColoredLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionDynamicLighting:
                station.setLightSettingsMotionDynamicLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsScheduleLightingActiveMode:
                station.setLightSettingsScheduleLightingActiveMode(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsScheduleDailyLighting:
                station.setLightSettingsScheduleDailyLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsScheduleColoredLighting:
                station.setLightSettingsScheduleColoredLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsScheduleDynamicLighting:
                station.setLightSettingsScheduleDynamicLighting(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColoredLightingColors:
                station.setLightSettingsColoredLightingColors(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsDynamicLightingThemes:
                station.setLightSettingsDynamicLightingThemes(device, value);
                break;
            case http_1.PropertyName.DeviceDoorControlWarning:
                station.setDoorControlWarning(device, value);
                break;
            case http_1.PropertyName.DeviceDoor1Open:
                station.openDoor(device, value, 1);
                break;
            case http_1.PropertyName.DeviceDoor2Open:
                station.openDoor(device, value, 2);
                break;
            case http_1.PropertyName.DeviceLeftBehindAlarm: {
                const tracker = device;
                const result = await tracker.setLeftBehindAlarm(value);
                if (result) {
                    device.updateProperty(name, value);
                }
                break;
            }
            case http_1.PropertyName.DeviceFindPhone: {
                const tracker = device;
                const result = await tracker.setFindPhone(value);
                if (result) {
                    device.updateProperty(name, value);
                }
                break;
            }
            case http_1.PropertyName.DeviceTrackerType: {
                const tracker = device;
                const result = await tracker.setTrackerType(value);
                if (result) {
                    device.updateProperty(name, value);
                }
                break;
            }
            case http_1.PropertyName.DeviceImageMirrored:
                station.setMirrorMode(device, value);
                break;
            case http_1.PropertyName.DeviceFlickerAdjustment:
                station.setFlickerAdjustment(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetectionType:
                station.setSoundDetectionType(device, value);
                break;
            case http_1.PropertyName.DeviceLeavingDetection:
                station.setLeavingDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLeavingReactionNotification:
                station.setLeavingReactionNotification(device, value);
                break;
            case http_1.PropertyName.DeviceLeavingReactionStartTime:
                station.setLeavingReactionStartTime(device, value);
                break;
            case http_1.PropertyName.DeviceLeavingReactionEndTime:
                station.setLeavingReactionEndTime(device, value);
                break;
            case http_1.PropertyName.DeviceBeepVolume:
                station.setBeepVolume(device, value);
                break;
            case http_1.PropertyName.DeviceNightvisionOptimization:
                station.setNightvisionOptimization(device, value);
                break;
            case http_1.PropertyName.DeviceNightvisionOptimizationSide:
                station.setNightvisionOptimizationSide(device, value);
                break;
            case http_1.PropertyName.DeviceOpenMethod:
                station.setOpenMethod(device, value);
                break;
            case http_1.PropertyName.DeviceMotionActivatedPrompt:
                station.setMotionActivatedPrompt(device, value);
                break;
            default:
                if (!Object.values(http_1.PropertyName).includes(name))
                    throw new error_1.ReadOnlyPropertyError("Property is read only", { context: { device: deviceSerial, propertyName: name, propertyValue: value } });
                throw new http_1.InvalidPropertyError("Device has no writable property", { context: { device: deviceSerial, propertyName: name, propertyValue: value } });
        }
    }
}
exports.Devices = Devices;
