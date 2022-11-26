"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Devices = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const error_1 = require("./error");
const http_1 = require("./http");
const p2p_1 = require("./p2p");
const utils_1 = require("./utils");
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
        this.lastVideoTimeForDevices = {};
        this.deviceSnoozeTimeout = {};
        this.api = api;
        this.httpService = httpService;
        if (this.api.getApiUsePushService() == false) {
            this.api.logInfoBasic("Retrieving last video event times disabled in settings.");
        }
        this.httpService.on("devices", (devices) => this.handleDevices(devices));
    }
    /**
     * Handle the devices so that they can be used by the addon.
     * @param devices The devices object with all devices.
     */
    async handleDevices(devices) {
        const resDevices = devices;
        const deviceSNs = Object.keys(this.devices);
        const newDeviceSNs = Object.keys(devices);
        const promises = [];
        var deviceSerial;
        var device;
        if (resDevices != null) {
            for (deviceSerial in resDevices) {
                if (this.devices[deviceSerial]) {
                    device = this.devices[deviceSerial];
                    this.updateDevice(resDevices[deviceSerial]);
                }
                else {
                    let new_device;
                    if (http_1.Device.isIndoorCamera(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.IndoorCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isSoloCameras(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.SoloCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isBatteryDoorbell(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.BatteryDoorbellCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isWiredDoorbell(resDevices[deviceSerial].device_type) || http_1.Device.isWiredDoorbellDual(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.WiredDoorbellCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isFloodLight(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.FloodlightCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isCamera(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Camera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isLock(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Lock.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isMotionSensor(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.MotionSensor.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isEntrySensor(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.EntrySensor.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isKeyPad(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.Keypad.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (http_1.Device.isSmartSafe(resDevices[deviceSerial].device_type)) {
                        new_device = http_1.SmartSafe.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else {
                        new_device = http_1.UnknownDevice.initialize(this.httpService, resDevices[deviceSerial]);
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
                            this.addDevice(device);
                        }
                        catch (error) {
                            this.api.logError("Error", error);
                        }
                        return device;
                    }));
                }
            }
            this.loadingDevices = Promise.all(promises).then((devices) => {
                devices.forEach((device) => {
                    this.api.getStation(device.getStationSerial()).then((station) => {
                        if (!station.isConnected()) {
                            station.setConnectionType(this.api.getConfig().getConnectionType());
                            station.connect();
                        }
                    }).catch((error) => {
                        this.api.logError("Error trying to connect to station afte device loaded", error);
                    });
                });
                this.loadingDevices = undefined;
            });
            for (const deviceSN of deviceSNs) {
                if (!newDeviceSNs.includes(deviceSN)) {
                    this.getDevice(deviceSN).then((device) => {
                        this.removeDevice(device);
                    }).catch((error) => {
                        this.api.logError("Error removing device", error);
                    });
                }
            }
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
            this.lastVideoTimeForDevices[serial] = undefined;
            if (this.api.getApiUsePushService()) {
                this.setLastVideoTimeFromCloud(serial);
            }
            this.emit("device added", device);
            if (device.isLock()) {
                this.api.getMqttService().subscribeLock(device.getSerial());
            }
        }
        else {
            this.api.logDebug(`Device with this serial ${device.getSerial()} exists already and couldn't be added again!`);
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
            this.api.logDebug(`Device with this serial ${device.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }
    /**
     * Update the device information.
     * @param device The device object to update.
     */
    async updateDevice(device) {
        var stations = await this.api.getStations();
        for (var stationSerial in stations) {
            if (!stations[stationSerial].isConnected()) {
                if (stations[stationSerial].getDeviceType() == http_1.DeviceType.STATION) {
                    stations[stationSerial].setConnectionType(this.api.getP2PConnectionType());
                }
                else {
                    stations[stationSerial].setConnectionType(p2p_1.P2PConnectionType.QUICKEST);
                }
                stations[stationSerial].connect();
            }
        }
        if (this.loadingDevices !== undefined) {
            await this.loadingDevices;
        }
        if (Object.keys(this.devices).includes(device.device_sn)) {
            this.devices[device.device_sn].update(device, stations[device.station_sn] !== undefined && !stations[device.station_sn].isIntegratedDevice() && stations[device.station_sn].isConnected());
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
        if (this.devices != null) {
            for (var deviceSerial in this.devices) {
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
                this.devices[deviceSerial].destroy();
            }
        }
    }
    /**
     * Close devices.
     */
    close() {
        Object.keys(this.deviceSnoozeTimeout).forEach(device_sn => {
            clearTimeout(this.deviceSnoozeTimeout[device_sn]);
            delete this.deviceSnoozeTimeout[device_sn];
        });
    }
    /**
     * Returns all Devices.
     */
    getDevices() {
        return this.devices;
    }
    /**
     * Get the device specified by serial number.
     * @param deviceSerial The serial of the device.
     * @returns The device as Device object.
     */
    async getDevice(deviceSerial) {
        if (this.loadingDevices !== undefined) {
            await this.loadingDevices;
        }
        if (Object.keys(this.devices).includes(deviceSerial)) {
            return this.devices[deviceSerial];
        }
        throw new error_1.DeviceNotFoundError(`Device with this serial ${deviceSerial} doesn't exists!`);
    }
    /**
     * Returns a device specified by station and channel.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @returns The device specified by base and channel.
     */
    async getDeviceByStationAndChannel(baseSerial, channel) {
        if (this.loadingDevices !== undefined) {
            await this.loadingDevices;
        }
        for (const device of Object.values(this.devices)) {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial)) {
                return device;
            }
        }
        throw new error_1.DeviceNotFoundError(`No device with channel ${channel} found on station with serial number: ${baseSerial}!`);
    }
    /**
     * Checks if a device with the given serial exists.
     * @param deviceSerial The deviceSerial of the device to check.
     * @returns True if device exists, otherwise false.
     */
    existDevice(deviceSerial) {
        var res = this.devices[deviceSerial];
        if (res) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Snoozes a given device for a given time.
     * @param device The device as object.
     * @param timeoutMS The snooze time in ms.
     */
    setDeviceSnooze(device, timeoutMS) {
        this.deviceSnoozeTimeout[device.getSerial()] = setTimeout(() => {
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
            delete this.deviceSnoozeTimeout[device.getSerial()];
        }, timeoutMS);
    }
    /**
     * Returns a string with the type of the device.
     * @param device The device.
     * @returns A string with the type of the device.
     */
    getDeviceTypeAsString(device) {
        if (device.isFirstCamera() || device.isCameraE() || device.isCamera2() || device.isCamera2C() || device.isCamera2Pro() || device.isCamera2CPro() || device.isCamera3() || device.isCamera3C()) {
            return "camera";
        }
        else if (device.isEntrySensor()) {
            return "sensor";
        }
        else if (device.isKeyPad()) {
            return "keypad";
        }
        else if (device.isDoorbell()) {
            return "doorbell";
        }
        else if (device.isIndoorCamera()) {
            return "indoorcamera";
        }
        else if (device.isSoloCameras()) {
            return "solocamera";
        }
        else if (device.isFloodLight()) {
            return "floodlight";
        }
        else if (device.isLock()) {
            return "lock";
        }
        else {
            return `unknown(${device.getRawDevice().device_type})`;
        }
    }
    /**
     * Retrieve the model name of a given device.
     * @param device The device object.
     * @returns A string with the model name of the device.
     */
    getDeviceModelName(device) {
        switch (device.getModel().substring(0, 5)) {
            //eufyCams
            case "T8111":
                return "eufyCam";
            case "T8112":
                return "eufyCam E";
            case "T8113":
                return "eufyCam 2C";
            case "T8114":
                return "eufyCam 2";
            case "T8140":
                return "eufyCam 2 Pro";
            case "T8142":
                return "eufyCam 2C Pro";
            case "T8160":
                return "eufyCam 3";
            case "T8161":
                return "eufyCam 3C";
            //IndoorCams
            case "T8400":
                return "IndoorCam C24";
            case "T8401":
                return "IndoorCam C22";
            case "T8410":
                return "IndoorCam P24";
            case "T8411":
                return "IndoorCam P22";
            case "T8414":
                return "IndoorCam Mini 2k";
            //SoloCams
            case "T8122":
                return "SoloCam L20";
            case "T8123":
                return "SoloCam L40";
            case "T8424":
                return "SoloCam S40";
            case "T8130":
                return "SoloCam E20";
            case "T8131":
                return "SoloCam E40";
            case "T8150":
                return "4G Starlight Camera";
            //OutdoorCams
            case "T8441":
                return "OutdoorCam Pro";
            case "T8442":
                return "OutdoorCam";
            //Wired Doorbells
            case "T8200":
                return "Video Doorbell 2K (wired)";
            case "T8201":
                return "Video Doorbell 1080p (wired)";
            case "T8202":
                return "Video Doorbell 2K Pro (wired)";
            case "T8203":
                return "Video Doorbell Dual 2K (wired)";
            //Battery Doorbells
            case "T8210":
                return "Video Doorbell 2K (battery)";
            case "T8212":
                return "Video Doorbell 2C (battery)";
            case "T8213":
                return "Video Doorbell Dual 2K (battery)";
            case "T8220":
                return "Video Doorbell 1080p Slim (battery)";
            case "T8221":
                return "Video Doorbell 2E (battery)";
            case "T8222":
                return "Video Doorbell 1080p (battery)";
            //Floodlight
            case "T8420":
                return "FloodlightCam 1080p";
            case "T8422":
                return "FloodlightCam E 2k";
            case "T8423":
                return "FloodlightCam 2 Pro";
            case "T8424":
                return "FloodlightCam 2k";
            //Lock
            case "T8500":
                return "Smart Lock Front Door";
            case "T8501":
                return "Solo Smart Lock D20";
            case "T8503":
                return "Smart Lock R10";
            case "T8503":
                return "Smart Lock R20";
            case "T8519":
                return "Smart Lock Touch";
            case "T8520":
                return "Smart Lock Touch und Wi-Fi";
            case "T8530":
                return "Video Smart Lock";
            //Bridges
            case "T8021":
                return "Wi-Fi Bridge und Doorbell Chime";
            case "T8592":
                return "Keypad";
            //Keypad
            case "T8960":
                return "Keypad";
            //Sensor
            case "T8900":
                return "Entry Sensor";
            case "T8910":
                return "Motion Sensor";
            default:
                return "unbekanntes Gerät";
        }
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
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.on("raw property changed", (device, type, value) => this.onRawPropertyChanged(device, type, value));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.on("crying detected", (device, state) => this.onCryingDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.on("sound detected", (device, state) => this.onSoundDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.on("pet detected", (device, state) => this.onPetDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.on("vehicle detected", (device, state) => this.onVehicleDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.on("motion detected", (device, state) => this.onMotionDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device, state, person) => this.onPersonDetected(device, state, person));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.on("rings", (device, state) => this.onRings(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.on("locked", (device, state) => this.onLocked(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.on("open", (device, state) => this.onOpen(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.on("ready", (device) => this.onReady(device));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.on("package delivered", (device, state) => this.onDevicePackageDelivered(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.on("package stranded", (device, state) => this.onDevicePackageStranded(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.on("package taken", (device, state) => this.onDevicePackageTaken(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.on("someone loitering", (device, state) => this.onDeviceSomeoneLoitering(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.on("radar motion detected", (device, state) => this.onDeviceRadarMotionDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.on("911 alarm", (device, state, detail) => this.onDevice911Alarm(device, state, detail));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.on("shake alarm", (device, state, detail) => this.onDeviceShakeAlarm(device, state, detail));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.on("wrong try-protect alarm", (device, state) => this.onDeviceWrongTryProtectAlarm(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.on("long time not close", (device, state) => this.onDeviceLongTimeNotClose(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.on("low battery", (device, state) => this.onDeviceLowBattery(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.on("jammed", (device, state) => this.onDeviceJammed(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.on("stranger person detected", (device, state) => this.onDeviceStrangerPersonDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.on("dog detected", (device, state) => this.onDeviceDogDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.on("dog lick detected", (device, state) => this.onDeviceDogLickDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.on("dog poop detected", (device, state) => this.onDeviceDogPoopDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog poop detected")} Listener.`);
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
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.removeAllListeners("crying detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.removeAllListeners("sound detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.removeAllListeners("pet detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.removeAllListeners("vehicle detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.removeAllListeners("motion detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.removeAllListeners("person detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.removeAllListeners("rings");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.removeAllListeners("locked");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.removeAllListeners("open");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.removeAllListeners("ready");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.removeAllListeners("package delivered");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.removeAllListeners("package stranded");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.removeAllListeners("package taken");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.removeAllListeners("someone loitering");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.removeAllListeners("radar motion detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.removeAllListeners("911 alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.removeAllListeners("shake alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.removeAllListeners("wrong try-protect alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.removeAllListeners("long time not close");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.removeAllListeners("low battery");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.removeAllListeners("jammed");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.removeAllListeners("stranger person detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.removeAllListeners("dog detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.removeAllListeners("dog lick detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.removeAllListeners("dog poop detected");
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog poop detected")} Listener.`);
                break;
        }
    }
    /**
     * The action to be one when event PropertyChanged is fired.
     * @param device The device as Device object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    async onPropertyChanged(device, name, value) {
        //this.emit("device property changed", device, name, value);
        this.api.logDebug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value}`);
        try {
            this.emit("device property changed", device, name, value);
            if (name === http_1.PropertyName.DeviceRTSPStream && value === true && (device.getPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl) === undefined || (device.getPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl) !== undefined && device.getPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl) === ""))) {
                this.api.getStation(device.getStationSerial()).then((station) => {
                    station.setRTSPStream(device, true);
                }).catch((error) => {
                    this.api.logError(`Device property changed error (device: ${device.getSerial()} name: ${name}) - station enable rtsp (station: ${device.getStationSerial()})`, error);
                });
            }
            else if (name === http_1.PropertyName.DeviceRTSPStream && value === false) {
                device.setCustomPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl, "");
            }
        }
        catch (error) {
            this.api.logError(`Device property changed error (device: ${device.getSerial()} name: ${name})`, error);
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
        this.api.logDebug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value}`);
    }
    /**
     * The action to be one when event CryingDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onCryingDetected(device, state) {
        this.api.logInfo(`Event "CryingDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event SoundDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onSoundDetected(device, state) {
        this.api.logInfo(`Event "SoundDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event PetDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onPetDetected(device, state) {
        this.api.logInfo(`Event "PetDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event VehicleDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    onVehicleDetected(device, state) {
        this.api.logInfo(`Event "VehicleDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onMotionDetected(device, state) {
        this.api.logInfo(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    async onPersonDetected(device, state, person) {
        this.api.logInfo(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event Rings is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onRings(device, state) {
        this.api.logInfo(`Event "Rings": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }
    /**
     * The action to be one when event Locked is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onLocked(device, state) {
        this.api.logInfo(`Event "Locked": device: ${device.getSerial()} | state: ${state}`);
    }
    /**
     * The action to be one when event Open is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    async onOpen(device, state) {
        this.api.logInfo(`Event "Open": device: ${device.getSerial()} | state: ${state}`);
    }
    /**
     * The action to be one when event Ready is fired.
     * @param device The device as Device object.
     */
    async onReady(device) {
        this.api.logDebug(`Event "Ready": device: ${device.getSerial()}`);
        try {
            if (device.getPropertyValue(http_1.PropertyName.DeviceRTSPStream) !== undefined && device.getPropertyValue(http_1.PropertyName.DeviceRTSPStream) === true) {
                this.api.getStation(device.getStationSerial()).then((station) => {
                    station.setRTSPStream(device, true);
                }).catch((error) => {
                    this.api.logError(`Device ready error (device: ${device.getSerial()}) - station enable rtsp (station: ${device.getStationSerial()})`, error);
                });
            }
        }
        catch (error) {
            this.api.logError(`Device ready error (device: ${device.getSerial()})`, error);
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
    }
    /**
     * The action to be one when event DeviceDogDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceDogDetected(device, state) {
        this.emit("device dog detected", device, state);
    }
    /**
     * The action to be one when event DeviceDogLickDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceDogLickDetected(device, state) {
        this.emit("device dog lick detected", device, state);
    }
    /**
     * The action to be one when event DeviceDogPoopDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    onDeviceDogPoopDetected(device, state) {
        this.emit("device dog poop detected", device, state);
    }
    /**
     * Update the raw values for a given device.
     * @param deviceSerial The serial of the device.
     * @param values The raw values.
     */
    updateDeviceProperties(deviceSerial, values) {
        if (this.devices[deviceSerial] != undefined) {
            this.devices[deviceSerial].updateRawProperties(values);
        }
        else {
            this.api.logError(`Error on update device properties. Device ${deviceSerial} does not exists.`);
        }
    }
    /**
     * Retrieves the last video event for the given device.
     * @param deviceSerial The serial of the device.
     * @returns The time as timestamp or undefined.
     */
    async getLastVideoTimeFromCloud(deviceSerial) {
        var lastVideoTime = await this.httpService.getAllVideoEvents({ deviceSN: deviceSerial }, 1);
        if (lastVideoTime !== undefined && lastVideoTime.length >= 1) {
            return lastVideoTime[0].create_time;
        }
        else {
            return undefined;
        }
    }
    /**
     * Set the last video time to the array.
     * @param deviceSerial The serial of the device.
     * @param time The time as timestamp or undefined.
     */
    setLastVideoTime(deviceSerial, time, timestampType) {
        if (time !== undefined) {
            switch (timestampType) {
                case "sec":
                    this.lastVideoTimeForDevices[deviceSerial] = time * 1000;
                    break;
                case "ms":
                    this.lastVideoTimeForDevices[deviceSerial] = time;
                    break;
                default:
                    this.lastVideoTimeForDevices[deviceSerial] = undefined;
            }
        }
        else {
            this.lastVideoTimeForDevices[deviceSerial] = undefined;
        }
        this.api.updateCameraEventTimeSystemVariable(deviceSerial, this.lastVideoTimeForDevices[deviceSerial]);
    }
    /**
     * Helper function to retrieve the last event time from cloud and set the value to the array.
     * @param deviceSerial The serial of the device.
     */
    async setLastVideoTimeFromCloud(deviceSerial) {
        this.setLastVideoTime(deviceSerial, await this.getLastVideoTimeFromCloud(deviceSerial), "sec");
    }
    /**
     * Set the time for the last video to the current time.
     * @param deviceSerial The serial of the device.
     */
    setLastVideoTimeNow(deviceSerial) {
        this.setLastVideoTime(deviceSerial, new Date().getTime(), "ms");
    }
    /**
     * Retrieve the last video time from the array.
     * @param deviceSerial The serial of the device.
     * @returns The timestamp as number or undefined.
     */
    getLastVideoTime(deviceSerial) {
        return this.lastVideoTimeForDevices[deviceSerial];
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
                await station.enableDevice(device, value);
                break;
            case http_1.PropertyName.DeviceStatusLed:
                await station.setStatusLed(device, value);
                break;
            case http_1.PropertyName.DeviceAutoNightvision:
                await station.setAutoNightVision(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetection:
                await station.setMotionDetection(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetection:
                await station.setSoundDetection(device, value);
                break;
            case http_1.PropertyName.DevicePetDetection:
                await station.setPetDetection(device, value);
                break;
            case http_1.PropertyName.DeviceRTSPStream:
                await station.setRTSPStream(device, value);
                break;
            case http_1.PropertyName.DeviceAntitheftDetection:
                await station.setAntiTheftDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLocked:
                await station.lockDevice(device, value);
                break;
            case http_1.PropertyName.DeviceWatermark:
                await station.setWatermark(device, value);
                break;
            case http_1.PropertyName.DeviceLight:
                await station.switchLight(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsEnable:
                await station.setFloodlightLightSettingsEnable(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsBrightnessManual:
                await station.setFloodlightLightSettingsBrightnessManual(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsBrightnessMotion:
                await station.setFloodlightLightSettingsBrightnessMotion(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsBrightnessSchedule:
                await station.setFloodlightLightSettingsBrightnessSchedule(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionTriggered:
                await station.setFloodlightLightSettingsMotionTriggered(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionTriggeredDistance:
                await station.setFloodlightLightSettingsMotionTriggeredDistance(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionTriggeredTimer:
                await station.setFloodlightLightSettingsMotionTriggeredTimer(device, value);
                break;
            case http_1.PropertyName.DeviceMicrophone:
                await station.setMicMute(device, value);
                break;
            case http_1.PropertyName.DeviceSpeaker:
                await station.enableSpeaker(device, value);
                break;
            case http_1.PropertyName.DeviceSpeakerVolume:
                await station.setSpeakerVolume(device, value);
                break;
            case http_1.PropertyName.DeviceAudioRecording:
                await station.setAudioRecording(device, value);
                break;
            case http_1.PropertyName.DevicePowerSource:
                await station.setPowerSource(device, value);
                break;
            case http_1.PropertyName.DevicePowerWorkingMode:
                await station.setPowerWorkingMode(device, value);
                break;
            case http_1.PropertyName.DeviceRecordingEndClipMotionStops:
                await station.setRecordingEndClipMotionStops(device, value);
                break;
            case http_1.PropertyName.DeviceRecordingClipLength:
                await station.setRecordingClipLength(device, value);
                break;
            case http_1.PropertyName.DeviceRecordingRetriggerInterval:
                await station.setRecordingRetriggerInterval(device, value);
                break;
            case http_1.PropertyName.DeviceVideoStreamingQuality:
                await station.setVideoStreamingQuality(device, value);
                break;
            case http_1.PropertyName.DeviceVideoRecordingQuality:
                await station.setVideoRecordingQuality(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivity:
                await station.setMotionDetectionSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionTracking:
                await station.setMotionTracking(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionType:
                await station.setMotionDetectionType(device, value);
                break;
            case http_1.PropertyName.DeviceMotionZone:
                await station.setMotionZone(device, value);
                break;
            case http_1.PropertyName.DeviceVideoWDR:
                await station.setWDR(device, value);
                break;
            case http_1.PropertyName.DeviceRingtoneVolume:
                await station.setRingtoneVolume(device, value);
                break;
            case http_1.PropertyName.DeviceChimeIndoor:
                await station.enableIndoorChime(device, value);
                break;
            case http_1.PropertyName.DeviceChimeHomebase:
                await station.enableHomebaseChime(device, value);
                break;
            case http_1.PropertyName.DeviceChimeHomebaseRingtoneVolume:
                await station.setHomebaseChimeRingtoneVolume(device, value);
                break;
            case http_1.PropertyName.DeviceChimeHomebaseRingtoneType:
                await station.setHomebaseChimeRingtoneType(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationType:
                await station.setNotificationType(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationPerson:
                await station.setNotificationPerson(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationPet:
                await station.setNotificationPet(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationAllOtherMotion:
                await station.setNotificationAllOtherMotion(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationAllSound:
                await station.setNotificationAllSound(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationCrying:
                await station.setNotificationCrying(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationMotion:
                await station.setNotificationMotion(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationRing:
                await station.setNotificationRing(device, value);
                break;
            case http_1.PropertyName.DeviceChirpVolume:
                await station.setChirpVolume(device, value);
                break;
            case http_1.PropertyName.DeviceChirpTone:
                await station.setChirpTone(device, value);
                break;
            case http_1.PropertyName.DeviceVideoHDR:
                await station.setHDR(device, value);
                break;
            case http_1.PropertyName.DeviceVideoDistortionCorrection:
                await station.setDistortionCorrection(device, value);
                break;
            case http_1.PropertyName.DeviceVideoRingRecord:
                await station.setRingRecord(device, value);
                break;
            case http_1.PropertyName.DeviceRotationSpeed:
                await station.setPanAndTiltRotationSpeed(device, value);
                break;
            case http_1.PropertyName.DeviceNightvision:
                await station.setNightVision(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRange:
                await station.setMotionDetectionRange(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeStandardSensitivity:
                await station.setMotionDetectionRangeStandardSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeAdvancedLeftSensitivity:
                await station.setMotionDetectionRangeAdvancedLeftSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeAdvancedMiddleSensitivity:
                await station.setMotionDetectionRangeAdvancedMiddleSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionRangeAdvancedRightSensitivity:
                await station.setMotionDetectionRangeAdvancedRightSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTestMode:
                await station.setMotionDetectionTestMode(device, value);
                break;
            case http_1.PropertyName.DeviceMotionTrackingSensitivity:
                await station.setMotionTrackingSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceMotionAutoCruise:
                await station.setMotionAutoCruise(device, value);
                break;
            case http_1.PropertyName.DeviceMotionOutOfViewDetection:
                await station.setMotionOutOfViewDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColorTemperatureManual:
                await station.setLightSettingsColorTemperatureManual(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColorTemperatureMotion:
                await station.setLightSettingsColorTemperatureMotion(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsColorTemperatureSchedule:
                await station.setLightSettingsColorTemperatureSchedule(device, value);
                break;
            case http_1.PropertyName.DeviceLightSettingsMotionActivationMode:
                await station.setLightSettingsMotionActivationMode(device, value);
                break;
            case http_1.PropertyName.DeviceVideoNightvisionImageAdjustment:
                await station.setVideoNightvisionImageAdjustment(device, value);
                break;
            case http_1.PropertyName.DeviceVideoColorNightvision:
                await station.setVideoColorNightvision(device, value);
                break;
            case http_1.PropertyName.DeviceAutoCalibration:
                await station.setAutoCalibration(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLock:
                await station.setAutoLock(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockSchedule:
                await station.setAutoLockSchedule(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockScheduleStartTime:
                await station.setAutoLockScheduleStartTime(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockScheduleEndTime:
                await station.setAutoLockScheduleEndTime(device, value);
                break;
            case http_1.PropertyName.DeviceAutoLockTimer:
                await station.setAutoLockTimer(device, value);
                break;
            case http_1.PropertyName.DeviceOneTouchLocking:
                await station.setOneTouchLocking(device, value);
                break;
            case http_1.PropertyName.DeviceSound:
                await station.setSound(device, value);
                break;
            case http_1.PropertyName.DeviceNotification:
                await station.setNotification(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationLocked:
                await station.setNotificationLocked(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationUnlocked:
                await station.setNotificationUnlocked(device, value);
                break;
            case http_1.PropertyName.DeviceScramblePasscode:
                await station.setScramblePasscode(device, value);
                break;
            case http_1.PropertyName.DeviceWrongTryProtection:
                await station.setWrongTryProtection(device, value);
                break;
            case http_1.PropertyName.DeviceWrongTryAttempts:
                await station.setWrongTryAttempts(device, value);
                break;
            case http_1.PropertyName.DeviceWrongTryLockdownTime:
                await station.setWrongTryLockdownTime(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringDetection:
                await station.setLoiteringDetection(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringDetectionRange:
                await station.setLoiteringDetectionRange(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringDetectionLength:
                await station.setLoiteringDetectionLength(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponse:
                await station.setLoiteringCustomResponseAutoVoiceResponse(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseHomeBaseNotification:
                await station.setLoiteringCustomResponseHomeBaseNotification(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponsePhoneNotification:
                await station.setLoiteringCustomResponsePhoneNotification(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice:
                await station.setLoiteringCustomResponseAutoVoiceResponseVoice(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseTimeFrom:
                await station.setLoiteringCustomResponseTimeFrom(device, value);
                break;
            case http_1.PropertyName.DeviceLoiteringCustomResponseTimeTo:
                await station.setLoiteringCustomResponseTimeTo(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityMode:
                await station.setMotionDetectionSensitivityMode(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityStandard:
                await station.setMotionDetectionSensitivityStandard(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedA:
                await station.setMotionDetectionSensitivityAdvancedA(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedB:
                await station.setMotionDetectionSensitivityAdvancedB(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedC:
                await station.setMotionDetectionSensitivityAdvancedC(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedD:
                await station.setMotionDetectionSensitivityAdvancedD(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedE:
                await station.setMotionDetectionSensitivityAdvancedE(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedF:
                await station.setMotionDetectionSensitivityAdvancedF(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedG:
                await station.setMotionDetectionSensitivityAdvancedG(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedH:
                await station.setMotionDetectionSensitivityAdvancedH(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuard:
                await station.setDeliveryGuard(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuarding:
                await station.setDeliveryGuardPackageGuarding(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuardingVoiceResponseVoice:
                await station.setDeliveryGuardPackageGuardingVoiceResponseVoice(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeFrom:
                await station.setDeliveryGuardPackageGuardingActivatedTimeFrom(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeTo:
                await station.setDeliveryGuardPackageGuardingActivatedTimeTo(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardUncollectedPackageAlert:
                await station.setDeliveryGuardUncollectedPackageAlert(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardPackageLiveCheckAssistance:
                await station.setDeliveryGuardPackageLiveCheckAssistance(device, value);
                break;
            case http_1.PropertyName.DeviceDualCamWatchViewMode:
                await station.setDualCamWatchViewMode(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponse:
                await station.setRingAutoResponse(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseVoiceResponse:
                await station.setRingAutoResponseVoiceResponse(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseVoiceResponseVoice:
                await station.setRingAutoResponseVoiceResponseVoice(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseTimeFrom:
                await station.setRingAutoResponseTimeFrom(device, value);
                break;
            case http_1.PropertyName.DeviceRingAutoResponseTimeTo:
                await station.setRingAutoResponseTimeTo(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationRadarDetector:
                await station.setNotificationRadarDetector(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetectionSensitivity:
                await station.setSoundDetectionSensitivity(device, value);
                break;
            case http_1.PropertyName.DeviceContinuousRecording:
                await station.setContinuousRecording(device, value);
                break;
            case http_1.PropertyName.DeviceContinuousRecordingType:
                await station.setContinuousRecordingType(device, value);
                break;
            case http_1.PropertyName.DeviceDefaultAngle:
                await station.enableDefaultAngle(device, value);
                break;
            case http_1.PropertyName.DeviceDefaultAngleIdleTime:
                await station.setDefaultAngleIdleTime(device, value);
                break;
            case http_1.PropertyName.DeviceNotificationIntervalTime:
                await station.setNotificationIntervalTime(device, value);
                break;
            case http_1.PropertyName.DeviceSoundDetectionRoundLook:
                await station.setSoundDetectionRoundLook(device, value);
                break;
            case http_1.PropertyName.DeviceDeliveryGuardUncollectedPackageAlertTimeToCheck:
                await station.setDeliveryGuardUncollectedPackageAlertTimeToCheck(device, value);
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
                await station.setSmartSafeParams(device, name, value);
                break;
            case http_1.PropertyName.DeviceVideoTypeStoreToNAS:
                await station.setVideoTypeStoreToNAS(device, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeHumanRecognition:
                await station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.HUMAN_RECOGNITION, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeHuman:
                await station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.HUMAN_DETECTION, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypePet:
                await station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.PET_DETECTION, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeVehicle:
                await station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.VEHICLE_DETECTION, value);
                break;
            case http_1.PropertyName.DeviceMotionDetectionTypeAllOtherMotions:
                await station.setMotionDetectionTypeHB3(device, http_1.HB3DetectionTypes.ALL_OTHER_MOTION, value);
                break;
            default:
                if (!Object.values(http_1.PropertyName).includes(name)) {
                    throw new error_1.ReadOnlyPropertyError(`Property ${name} is read only`);
                }
                throw new http_1.InvalidPropertyError(`Device ${deviceSerial} has no writable property named ${name}`);
        }
    }
}
exports.Devices = Devices;
