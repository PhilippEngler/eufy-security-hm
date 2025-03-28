import { TypedEmitter } from "tiny-typed-emitter";
import EventEmitter from "events";
import { DeviceNotFoundError, ReadOnlyPropertyError, ensureError } from "./error";
import { EufySecurityApi } from "./eufySecurityApi";
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, IndoorCamera, FloodlightCamera, SoloCamera, PropertyName, RawValues, Keypad, EntrySensor, MotionSensor, Lock, UnknownDevice, BatteryDoorbellCamera, WiredDoorbellCamera, DeviceListResponse, NotificationType, SmartSafe, InvalidPropertyError, Station, HB3DetectionTypes, CommandName, WallLightCam, GarageCamera, Tracker, T8170DetectionTypes, IndoorS350NotificationTypes, SoloCameraDetectionTypes, FloodlightT8425NotificationTypes, DoorbellLock, LockKeypad, SmartDrop, Picture, ImageType, DeviceType, IndoorS350DetectionTypes } from "./http";
import { EufySecurityEvents } from "./interfaces";
import { DynamicLighting, MotionZone, P2PConnectionType, RGBColor, SmartSafeAlarm911Event, SmartSafeShakeAlarmEvent } from "./p2p";
import { getError, isValidUrl, parseValue, waitForEvent } from "./utils";
import { DeviceInteractions, EventInteraction } from "./utils/models";
import { EventInteractionType } from "./utils/types";
import { EventInteractions } from "./eventInteractions";
import { rootAddonLogger } from "./logging";
import { existsSync, readFileSync } from "fs";

/**
 * Represents all the Devices in the account.
 */
export class Devices extends TypedEmitter<EufySecurityEvents> {
    private api: EufySecurityApi;
    private httpService: HTTPApi;
    private eventInteractions: EventInteractions;
    private devices: { [deviceSerial: string]: any } = {};
    private loadingEmitter = new EventEmitter();
    private devicesLoaded?: Promise<void> = waitForEvent<void>(this.loadingEmitter, "devices loaded");
    private deviceSnoozeTimeout = new Map<string, NodeJS.Timeout>();

    private errorImage: Picture | undefined = undefined;
    private defaultImage: Picture | undefined = undefined;

    /**
     * Create the Devices objects holding all devices in the account.
     * @param api  The api.
     * @param httpService The httpService.
     */
    constructor(api: EufySecurityApi, httpService: HTTPApi) {
        super();
        this.api = api;
        this.httpService = httpService;
        this.eventInteractions = new EventInteractions(this.api);

        if (this.api.getApiUsePushService() === false) {
            rootAddonLogger.info("Retrieving last video event times disabled in settings.");
        }

        const filePath = "www/assets/images";
        const errorFile = "errorImage";
        const defaultImage = "defaultImage";
        const language = this.api.getLanguage();

        try {
            const errorImageType: ImageType = { ext: "jpg", mime: "image/jpeg" };
            if (existsSync(`${filePath}/${errorFile}_${language}.${errorImageType.ext}`)) {
                this.errorImage = { data: readFileSync(`${filePath}/${errorFile}_${language}.${errorImageType.ext}`), type: errorImageType };
            } else if (existsSync(`${filePath}/${errorFile}_en.${errorImageType.ext}`)) {
                this.errorImage = { data: readFileSync(`${filePath}/${errorFile}_en.${errorImageType.ext}`), type: errorImageType };
            } else {
                rootAddonLogger.error(`The file for the error image ('${filePath}/${errorFile}_${language}.${errorImageType.ext}' or '${filePath}/${errorFile}_en.${errorImageType.ext}') could not be found.`);
                this.errorImage = undefined;
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at loading error image. Error: ${e.message}.`, JSON.stringify(e));
        }

        try {
            const defaultImageType: ImageType = { ext: "jpg", mime: "image/jpeg" };
            if (existsSync(`${filePath}/${defaultImage}_${language}.${defaultImageType.ext}`)) {
                this.defaultImage = { data: readFileSync(`${filePath}/${defaultImage}_${language}.${defaultImageType.ext}`), type: defaultImageType };
            } else if (existsSync(`${filePath}/${defaultImage}_en.${defaultImageType.ext}`)) {
                this.defaultImage = { data: readFileSync(`${filePath}/${defaultImage}_en.${defaultImageType.ext}`), type: defaultImageType };
            } else {
                rootAddonLogger.error(`The file for the default image ('${filePath}/${defaultImage}_${language}.${defaultImageType.ext}' or '${filePath}/${defaultImage}_en.${defaultImageType.ext}') could not be found.`);
                this.defaultImage = undefined;
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured at loading default image. Error: ${e.message}.`, JSON.stringify(e));
        }

        this.httpService.on("devices", (devices: FullDevices) => this.handleDevices(devices));
    }

    /**
     * Handle the devices so that they can be used by the addon.
     * @param devices The devices object with all devices.
     */
    private async handleDevices(devices: FullDevices): Promise<void> {
        rootAddonLogger.debug("Got devices", { devices: devices });

        const resDevices = devices;

        const deviceSNs: string[] = Object.keys(this.devices);
        const newDeviceSNs = Object.keys(devices);
        const promises: Array<Promise<Device>> = [];
        const deviceConfig = this.api.getDeviceConfig();

        let deviceSerial: string;

        if (resDevices !== null) {
            for (deviceSerial in resDevices) {
                if (this.api.getHouseId() !== undefined && resDevices[deviceSerial].house_id !== undefined && this.api.getHouseId() !== "all" && resDevices[deviceSerial].house_id !== this.api.getHouseId()) {
                    rootAddonLogger.debug(`Device ${deviceSerial} does not match houseId (got ${resDevices[deviceSerial].house_id} want ${this.api.getHouseId()}).`);
                    continue;
                }
                if (this.devices[deviceSerial]) {
                    this.updateDevice(resDevices[deviceSerial]);
                } else {
                    if (this.devicesLoaded === undefined) {
                        this.devicesLoaded = waitForEvent<void>(this.loadingEmitter, "devices loaded");
                    }
                    let new_device: Promise<Device>;

                    if (Device.isIndoorCamera(resDevices[deviceSerial].device_type)) {
                        new_device = IndoorCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isSoloCameras(resDevices[deviceSerial].device_type)) {
                        new_device = SoloCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isLockWifiVideo(resDevices[deviceSerial].device_type)) {
                        new_device = DoorbellLock.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isBatteryDoorbell(resDevices[deviceSerial].device_type)) {
                        new_device = BatteryDoorbellCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isWiredDoorbell(resDevices[deviceSerial].device_type) || Device.isWiredDoorbellDual(resDevices[deviceSerial].device_type)) {
                        new_device = WiredDoorbellCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isFloodLight(resDevices[deviceSerial].device_type)) {
                        new_device = FloodlightCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isWallLightCam(resDevices[deviceSerial].device_type)) {
                        new_device = WallLightCam.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isGarageCamera(resDevices[deviceSerial].device_type)) {
                        new_device = GarageCamera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isSmartDrop(resDevices[deviceSerial].device_type)) {
                        new_device = SmartDrop.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isCamera(resDevices[deviceSerial].device_type)) {
                        new_device = Camera.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isLock(resDevices[deviceSerial].device_type)) {
                        new_device = Lock.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isMotionSensor(resDevices[deviceSerial].device_type)) {
                        new_device = MotionSensor.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isEntrySensor(resDevices[deviceSerial].device_type)) {
                        new_device = EntrySensor.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isKeyPad(resDevices[deviceSerial].device_type)) {
                        new_device = Keypad.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isSmartSafe(resDevices[deviceSerial].device_type)) {
                        new_device = SmartSafe.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isSmartTrack(resDevices[deviceSerial].device_type)) {
                        new_device = Tracker.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else if (Device.isLockKeypad(resDevices[deviceSerial].device_type)) {
                        new_device = LockKeypad.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    } else {
                        new_device = UnknownDevice.getInstance(this.httpService, resDevices[deviceSerial], deviceConfig);
                    }

                    promises.push(new_device.then((device: Device) => {
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
                        } catch (err) {
                            const error = ensureError(err);
                            rootAddonLogger.error("HandleDevices Error", { error: getError(error), deviceSN: device.getSerial() });
                        }
                        return device;
                    }));
                }
            }

            Promise.all(promises).then((devices) => {
                devices.forEach((device) => {
                    this.api.getStation(device.getStationSerial()).then((station: Station) => {
                        if (!station.isConnected() && station.isP2PConnectableDevice()) {
                            if (device.isSoloCameras() && station.getConnectionType() !== P2PConnectionType.QUICKEST) {
                                station.setConnectionType(P2PConnectionType.QUICKEST);
                                rootAddonLogger.debug(`Detected solo device '${station.getSerial()}': connect with connection type ${P2PConnectionType[station.getConnectionType()]}.`);
                            } else if (!device.isSoloCameras() && station.getConnectionType() !== this.api.getP2PConnectionType()) {
                                station.setConnectionType(this.api.getP2PConnectionType());
                                rootAddonLogger.debug(`Set p2p connection type for device ${station.getSerial()} to value from settings (${P2PConnectionType[station.getConnectionType()]}).`);
                            }
                            rootAddonLogger.debug(`Initiate first station connection to get data over p2p`, { stationSN: station.getSerial() });
                            station.connect();
                        }
                    }).catch ((err) => {
                        const error = ensureError(err);
                        rootAddonLogger.error("Error trying to connect to station after device loaded", { error: getError(error), deviceSN: device.getSerial() });
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
                    this.getDevice(deviceSN).then((device: Device) => {
                        this.removeDevice(device);
                    }).catch ((err) => {
                        const error = ensureError(err);
                        rootAddonLogger.error("Error removing device", { error: getError(error), deviceSN: deviceSN });
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
    private addDevice(device: Device): void {
        const serial = device.getSerial();
        if (serial && !Object.keys(this.devices).includes(serial)) {
            this.devices[serial] = device;
            this.emit("device added", device);

            if (device.isLock()) {
                this.api.getMqttService().subscribeLock(device.getSerial());
            }
            if (device.hasProperty(PropertyName.DevicePicture)) {
                if (this.defaultImage !== undefined) {
                    device.updateProperty(PropertyName.DevicePicture, this.defaultImage);
                }
            }
        } else {
            rootAddonLogger.debug(`Device with this serial ${device.getSerial()} exists already and couldn't be added again!`);
        }
    }

    /**
     * Remove the given device.
     * @param device The device object to remove.
     */
    private removeDevice(device: Device): void {
        const serial = device.getSerial();
        if (serial && Object.keys(this.devices).includes(serial)) {
            delete this.devices[serial];
            device.removeAllListeners();
            this.emit("device removed", device);
        } else {
            rootAddonLogger.debug(`Device with this serial ${device.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }

    /**
     * Update the device information.
     * @param device The device object to update.
     */
    private async updateDevice(device: DeviceListResponse): Promise<void> {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        if (Object.keys(this.devices).includes(device.device_sn)) {
            this.devices[device.device_sn].update(device)
        } else {
            throw new DeviceNotFoundError(`Device with this serial ${device.device_sn} doesn't exists and couldn't be updated!`);
        }
    }

    /**
     * (Re)Loads all Devices and the settings of them.
     */
    public async loadDevices(): Promise<void> {
        try {
            this.handleDevices(this.httpService.getDevices());
        } catch (e: any) {
            this.devices = {};
            throw new Error(e);
        }
    }

    /**
     * Close all connections for all devices.
     */
    public closeDevices(): void {
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

                (this.devices[deviceSerial] as Device).destroy();
            }
        }
    }

    /**
     * Close devices.
     */
    public close(): void {
        Object.keys(this.deviceSnoozeTimeout).forEach(device_sn => {
            clearTimeout(this.deviceSnoozeTimeout.get(device_sn));
            this.deviceSnoozeTimeout.delete(device_sn);
        });
    }

    /**
     * Returns all Devices.
     */
    public async getDevices(): Promise<{ [deviceSerial: string]: any }> {
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
    public async getDevice(deviceSerial: string): Promise<Device> {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        if (Object.keys(this.devices).includes(deviceSerial)) {
            return this.devices[deviceSerial];
        }
        throw new DeviceNotFoundError("Device doesn't exists", { context: { device: deviceSerial } });
    }

    /**
     * Returns a device specified by station and channel.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @returns The device specified by base and channel.
     */
    public async getDeviceByStationAndChannel(baseSerial: string, channel: number): Promise<Device> {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        for (const device of Object.values(this.devices)) {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial)) {
                return device;
            }
        }
        throw new DeviceNotFoundError("No device with passed channel found on station", { context: { station: baseSerial, channel: channel } });
    }

    public async getDevicesFromStation(stationSerial: string): Promise<Array<Device>> {
        if (this.devicesLoaded) {
            await this.devicesLoaded;
        }
        const arr: Array<Device> = [];
        Object.keys(this.devices).forEach((serialNumber: string) => {
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
    public existDevice(deviceSerial: string): boolean {
        const res = this.devices[deviceSerial];
        if (res) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Checks if the device a battery powered device. 
     * @param deviceSerial The deviceSerial of the device.
     * @returns True if device is a battery powered device, otherwise false.
     */
    public async hasDeviceBattery(deviceSerial: string): Promise<boolean> {
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
    public async isSoloDevice(deviceSerial: string): Promise<boolean> {
        let res =  this.existDevice(deviceSerial);
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
    public setDeviceSnooze(device: Device, timeoutMS: number): void {
        this.deviceSnoozeTimeout.set(device.getSerial(), setTimeout(() => {
            device.updateProperty(PropertyName.DeviceSnooze, false);
            device.updateProperty(PropertyName.DeviceSnoozeTime, 0);
            device.updateProperty(PropertyName.DeviceSnoozeStartTime, 0);
            if (device.hasProperty(PropertyName.DeviceSnoozeHomebase)) {
                device.updateProperty(PropertyName.DeviceSnoozeHomebase, false);
            }
            if (device.hasProperty(PropertyName.DeviceSnoozeMotion)) {
                device.updateProperty(PropertyName.DeviceSnoozeMotion, false);
            }
            if (device.hasProperty(PropertyName.DeviceSnoozeChime)) {
                device.updateProperty(PropertyName.DeviceSnoozeChime, false);
            }
            this.deviceSnoozeTimeout.delete(device.getSerial());
        }, timeoutMS));
    }

    /**
     * Add a given event listener for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    public addEventListener(device: Device, eventListenerName: string): void {
        switch (eventListenerName) {
            case "PropertyChanged":
                device.on("property changed", (device: Device, name: string, value: PropertyValue, ready: boolean) => this.onDevicePropertyChanged(device, name, value, ready));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.on("raw property changed", (device: Device, type: number, value: string) => this.onRawPropertyChanged(device, type, value));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.on("crying detected", (device: Device, state: boolean) => this.onCryingDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.on("sound detected", (device: Device, state: boolean) => this.onSoundDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.on("pet detected", (device: Device, state: boolean) => this.onPetDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.on("vehicle detected", (device: Device, state: boolean) => this.onVehicleDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.on("motion detected", (device: Device, state: boolean) => this.onMotionDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device: Device, state: boolean, person: string) => this.onPersonDetected(device, state, person));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.on("rings", (device: Device, state: boolean) => this.onRings(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.on("locked", (device: Device, state: boolean) => this.onLocked(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.on("open", (device: Device, state: boolean) => this.onOpen(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.on("ready", (device: Device) => this.onReady(device));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.on("package delivered", (device: Device, state: boolean) => this.onDevicePackageDelivered(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.on("package stranded", (device: Device, state: boolean) => this.onDevicePackageStranded(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.on("package taken", (device: Device, state: boolean) => this.onDevicePackageTaken(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.on("someone loitering", (device: Device, state: boolean) => this.onDeviceSomeoneLoitering(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.on("radar motion detected", (device: Device, state: boolean) => this.onDeviceRadarMotionDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.on("911 alarm", (device: Device, state: boolean, detail: SmartSafeAlarm911Event) => this.onDevice911Alarm(device, state, detail));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.on("shake alarm", (device: Device, state: boolean, detail: SmartSafeShakeAlarmEvent) => this.onDeviceShakeAlarm(device, state, detail));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.on("wrong try-protect alarm", (device: Device, state: boolean) => this.onDeviceWrongTryProtectAlarm(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.on("long time not close", (device: Device, state: boolean) => this.onDeviceLongTimeNotClose(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.on("low battery", (device: Device, state: boolean) => this.onDeviceLowBattery(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.on("jammed", (device: Device, state: boolean) => this.onDeviceJammed(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.on("stranger person detected", (device: Device, state: boolean) => this.onDeviceStrangerPersonDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.on("dog detected", (device: Device, state: boolean) => this.onDeviceDogDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.on("dog lick detected", (device: Device, state: boolean) => this.onDeviceDogLickDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.on("dog poop detected", (device: Device, state: boolean) => this.onDeviceDogPoopDetected(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog poop detected")} Listener.`);
                break;
            case "Tampering":
                device.on("tampering", (device: Device, state: boolean) => this.onDeviceTampering(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("tampering")} Listener.`);
                break;
            case "LowTemperature":
                device.on("low temperature", (device: Device, state: boolean) => this.onDeviceLowTemperature(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("low temperature")} Listener.`);
                break;
            case "HighTemperature":
                device.on("high temperature", (device: Device, state: boolean) => this.onDeviceHighTemperature(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("high temperature")} Listener.`);
                break;
            case "PinIncorrect":
                device.on("pin incorrect", (device: Device, state: boolean) => this.onDevicePinIncorrect(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("pin incorrect")} Listener.`);
                break;
            case "LidStuck":
                device.on("lid stuck", (device: Device, state: boolean) => this.onDeviceLidStuck(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("lid stuck")} Listener.`);
                break;
            case "BatteryFullyCharged":
                device.on("battery fully charged", (device: Device, state: boolean) => this.onDeviceBatteryFullyCharged(device, state));
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("battery fully charged")} Listener.`);
                break;
            default:
                rootAddonLogger.error(`Error adding event listener: Unknown event listener name '${eventListenerName}'.`);
        }
    }

    /**
     * Remove all event listeners for a given event type for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    public removeEventListener(device: Device, eventListenerName: string): void {
        switch (eventListenerName) {
            case "PropertyChanged":
                device.removeAllListeners("property changed");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.removeAllListeners("raw property changed");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.removeAllListeners("crying detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.removeAllListeners("sound detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.removeAllListeners("pet detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.removeAllListeners("vehicle detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.removeAllListeners("motion detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.removeAllListeners("person detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.removeAllListeners("rings");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.removeAllListeners("locked");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.removeAllListeners("open");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.removeAllListeners("ready");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.removeAllListeners("package delivered");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.removeAllListeners("package stranded");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.removeAllListeners("package taken");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.removeAllListeners("someone loitering");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.removeAllListeners("radar motion detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.removeAllListeners("911 alarm");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.removeAllListeners("shake alarm");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.removeAllListeners("wrong try-protect alarm");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.removeAllListeners("long time not close");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.removeAllListeners("low battery");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.removeAllListeners("jammed");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.removeAllListeners("stranger person detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.removeAllListeners("dog detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.removeAllListeners("dog lick detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.removeAllListeners("dog poop detected");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("dog poop detected")} Listener.`);
                break;
            case "Tampering":
                device.removeAllListeners("tampering");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("tampering")} Listener.`);
                break;
            case "LowTemperature":
                device.removeAllListeners("low temperature");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("low temperature")} Listener.`);
                break;
            case "HighTemperature":
                device.removeAllListeners("high temperature");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("high temperature")} Listener.`);
                break;
            case "PinIncorrect":
                device.removeAllListeners("pin incorrect");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("pin incorrect")} Listener.`);
                break;
            case "LidStuck":
                device.removeAllListeners("lid stuck");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("lid stuck")} Listener.`);
                break;
            case "BatteryFullyCharged":
                device.removeAllListeners("battery fully charged");
                rootAddonLogger.debug(`Listener '${eventListenerName}' for device ${device.getSerial()} removed. Total ${device.listenerCount("battery fully charged")} Listener.`);
                break;
            default:
                rootAddonLogger.error(`Error removing event listener: Unknown event listener name '${eventListenerName}'.`);
        }
    }

    /**
     * The action to be one when event PropertyChanged is fired.
     * @param device The device as Device object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    private async onDevicePropertyChanged(device: Device, name: string, value: PropertyValue, ready: boolean): Promise<void> {
        //this.emit("device property changed", device, name, value);
        rootAddonLogger.debug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value}`);
        try {
            if (ready && !name.startsWith("hidden-")) {
                this.emit("device property changed", device, name, value);
            }
            if (name === PropertyName.DeviceRTSPStream && (value as boolean) === true && (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) === undefined || (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) !== undefined && (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) as string) === ""))) {
                this.api.getStation(device.getStationSerial()).then((station: Station) => {
                    station.setRTSPStream(device, true);
                }).catch ((err) => {
                    const error = ensureError(err);
                    rootAddonLogger.error(`Device property changed error - station enable rtsp`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
                });
            } else if (name === PropertyName.DeviceRTSPStream && (value as boolean) === false) {
                device.setCustomPropertyValue(PropertyName.DeviceRTSPStreamUrl, "");
            } else if (name === PropertyName.DevicePictureUrl && value !== "") {
                if (!isValidUrl(value as string)) {
                    this.api.getStation(device.getStationSerial()).then((station: Station) => {
                        if (station.hasCommand(CommandName.StationDownloadImage)) {
                            station.downloadImage(value as string);
                        }
                    }).catch ((err) => {
                        const error = ensureError(err);
                        rootAddonLogger.error(`Device property changed error - station download image`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
                    });
                }
            }
        } catch (err) {
            const error = ensureError(err);
            rootAddonLogger.error(`Device property changed error`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
        }
    }

    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param device The device as Device object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    private async onRawPropertyChanged(device: Device, type: number, value: string): Promise<void> {
        //this.emit("device raw property changed", device, type, value, modified);
        rootAddonLogger.debug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value}`);
    }

    /**
     * The action to be one when event CryingDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onCryingDetected(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "CryingDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.CRYING);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onCryingDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onCryingDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event SoundDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onSoundDetected(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "SoundDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.SOUND);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onSoundDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onSoundDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event PetDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onPetDetected(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "PetDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.PET);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onPetDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onPetDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event VehicleDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private onVehicleDetected(device: Device, state: boolean): void
    {
        rootAddonLogger.debug(`Event "VehicleDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.VEHICLE);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onVehicleDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onVehicleDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onMotionDetected(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.MOTION);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onMotionDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onMotionDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    private async onPersonDetected(device: Device, state: boolean, person: string): Promise<void> {
        rootAddonLogger.debug(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.PERSON);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onPersonDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onPersonDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event Rings is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onRings(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "Rings": device: ${device.getSerial()} | state: ${state}`);
        try {
            const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.RING);
            if (deviceEventInteraction !== null) {
                this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
            }
        } catch (e: any) {
            rootAddonLogger.error(`Event "onRings": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
            rootAddonLogger.debug(`Event "onRings": device ${device.getSerial()}`, JSON.stringify(e));
        }
    }

    /**
     * The action to be one when event Locked is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onLocked(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "Locked": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event Open is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onOpen(device: Device, state: boolean): Promise<void> {
        rootAddonLogger.debug(`Event "Open": device: ${device.getSerial()} | state: ${state}`);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.OPEN);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onOpen": device ${device.getSerial()} | state: ${state} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onOpen": device ${device.getSerial()} | state: ${state}`, JSON.stringify(e));
            }
        }
        if (state === false) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.CLOSE);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onOpen": device ${device.getSerial()} | state: ${state} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onOpen": device ${device.getSerial()} | state: ${state}`, JSON.stringify(e));
            }
        }
    }

    /**
     * The action to be one when event Ready is fired.
     * @param device The device as Device object.
     */
    private async onReady(device: Device): Promise<void> {
        rootAddonLogger.debug(`Event "Ready": device: ${device.getSerial()}`);
        try {
            if (device.getPropertyValue(PropertyName.DeviceRTSPStream) !== undefined && (device.getPropertyValue(PropertyName.DeviceRTSPStream) as boolean) === true) {
                this.api.getStation(device.getStationSerial()).then((station: Station) => {
                    station.setRTSPStream(device, true);
                }).catch ((err) => {
                    const error = ensureError(err);
                    rootAddonLogger.error(`Device ready error - station enable rtsp`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial() });
                });
            }
        } catch (err) {
            const error = ensureError(err);
            rootAddonLogger.error(`Device ready error`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial() });
        }
    }

    /**
     * The action to be one when event DevicePackageDelivered is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePackageDelivered(device: Device, state: boolean): void {
        this.emit("device package delivered", device, state);
    }

    /**
     * The action to be one when event DevicePackageStranded is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePackageStranded(device: Device, state: boolean): void {
        this.emit("device package stranded", device, state);
    }

    /**
     * The action to be one when event DevicePackageTaken is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePackageTaken(device: Device, state: boolean): void {
        this.emit("device package taken", device, state);
    }

    /**
     * The action to be one when event DeviceSomeoneLoitering is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceSomeoneLoitering(device: Device, state: boolean): void {
        this.emit("device someone loitering", device, state);
    }

    /**
     * The action to be one when event DeviceRadarMotionDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceRadarMotionDetected(device: Device, state: boolean): void {
        this.emit("device radar motion detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.RADAR_MOTION);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onDeviceRadarMotionDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onDeviceRadarMotionDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event Device911Alarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     * @param detail The detail.
     */
    private onDevice911Alarm(device: Device, state: boolean, detail: SmartSafeAlarm911Event): void {
        this.emit("device 911 alarm", device, state, detail);
    }

    /**
     * The action to be one when event DeviceShakeAlarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     * @param detail The detail.
     */
    private onDeviceShakeAlarm(device: Device, state: boolean, detail: SmartSafeShakeAlarmEvent): void {
        this.emit("device shake alarm", device, state, detail);
    }

    /**
     * The action to be one when event DeviceWrongTryProtectAlarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceWrongTryProtectAlarm(device: Device, state: boolean): void {
        this.emit("device wrong try-protect alarm", device, state);
    }

    /**
     * The action to be one when event DeviceLongTimeNotClose is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceLongTimeNotClose(device: Device, state: boolean): void {
        this.emit("device long time not close", device, state);
    }

    /**
     * The action to be one when event DeviceLowBattery is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceLowBattery(device: Device, state: boolean): void {
        this.emit("device low battery", device, state);
    }

    /**
     * The action to be one when event DeviceJammed is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceJammed(device: Device, state: boolean): void {
        this.emit("device jammed", device, state);
    }

    /**
     * The action to be one when event DeviceStrangerPersonDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceStrangerPersonDetected(device: Device, state: boolean): void {
        this.emit("device stranger person detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.STRANGER_PERSON);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onDeviceStrangerPersonDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onDeviceStrangerPersonDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event DeviceDogDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceDogDetected(device: Device, state: boolean): void {
        this.emit("device dog detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.DOG);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onDeviceDogDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onDeviceDogDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event DeviceDogLickDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceDogLickDetected(device: Device, state: boolean): void {
        this.emit("device dog lick detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.DOG_LICK);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onDeviceDogLickDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onDeviceDogLickDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event DeviceDogPoopDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceDogPoopDetected(device: Device, state: boolean): void {
        this.emit("device dog poop detected", device, state);
        if (state === true) {
            try {
                const deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.DOG_POOP);
                if (deviceEventInteraction !== null) {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.useLocalCertificate, deviceEventInteraction.rejectUnauthorized, deviceEventInteraction.user, deviceEventInteraction.password, deviceEventInteraction.command);
                }
            } catch (e: any) {
                rootAddonLogger.error(`Event "onDeviceDogPoopDetected": device ${device.getSerial()} | code: ${e.code} | message: ${e.message}`);
                rootAddonLogger.debug(`Event "onDeviceDogPoopDetected": device ${device.getSerial()}`, JSON.stringify(e));
            }
        }
        if (state === false) {}
    }

    /**
     * The action to be one when event DeviceTampering is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceTampering(device: Device, state: boolean): void {
        this.emit("device tampering", device, state);
    }

    /**
     * The action to be one when event DeviceLowTemperature is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceLowTemperature(device: Device, state: boolean): void {
        this.emit("device low temperature", device, state);
    }

    /**
     * The action to be one when event DeviceHighTemperature is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceHighTemperature(device: Device, state: boolean): void {
        this.emit("device high temperature", device, state);
    }

    /**
     * The action to be one when event DevicePinIncorrect is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePinIncorrect(device: Device, state: boolean): void {
        this.emit("device pin incorrect", device, state);
    }

    /**
     * The action to be one when event DeviceLidStuck is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceLidStuck(device: Device, state: boolean): void {
        this.emit("device lid stuck", device, state);
    }

    /**
     * The action to be one when event DeviceBatteryFullyCharged is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceBatteryFullyCharged(device: Device, state: boolean): void {
        this.emit("device battery fully charged", device, state);
    }

    /**
     * Update the raw values for a given device.
     * @param deviceSerial The serial of the device.
     * @param values The raw values.
     */
    public async updateDeviceProperties(deviceSerial: string, values: RawValues): Promise<void> {
        this.getDevice(deviceSerial).then((device: Device) => {
            device.updateRawProperties(values);
        }).catch ((err) => {
            const error = ensureError(err);
            rootAddonLogger.error("Update device properties error", { error: getError(error), deviceSN: deviceSerial, values: values });
        });
    }

    /**
     * Retrieves the last event of the given device.
     * @param deviceSerial The serial of the device.
     */
    public async getDeviceLastEvent(deviceSerial: string): Promise<void> {
        this.getDevice(deviceSerial).then((device) => {
            this.api.getStation(device.getStationSerial()).then((station) => {
                station.databaseQueryLatestInfo();
            }).catch ((err) => {
                const error = ensureError(err);
                rootAddonLogger.error(`Get Device Last Event - Station Error`, { error: getError(error), deviceSN: deviceSerial });
            });
        }).catch ((err) => {
            const error = ensureError(err);
            rootAddonLogger.error(`Get Device Last Event - Device Error`, { error: getError(error), deviceSN: deviceSerial });
        });
    }

    /**
     * Retrieves the last event of all devices.
     */
    public async getDevicesLastEvent(): Promise<void> {
        this.api.getStations().then((stations) => {
            for (const station in stations)
            {
                stations[station].databaseQueryLatestInfo();
            }
        }).catch ((err) => {
            const error = ensureError(err);
            rootAddonLogger.error(`Get Devices Last Event - Station Error`, { error: getError(error) });
        });
    }


    /**
     * Retrieve the interactions for a given device.
     * @param deviceSerial The serial of the device.
     */
    public getDeviceInteractions(deviceSerial: string): DeviceInteractions | null {
        return this.eventInteractions.getDeviceInteractions(deviceSerial);
    }

    /**
     * Retrieve the interaction for a given eventInteractionType for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public getDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType): EventInteraction | null {
        return this.eventInteractions.getDeviceEventInteraction(deviceSerial, eventInteractionType);
    }

    /**
     * Updates a interaction for a given eventInteractionType for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     * @param deviceEventInteraction The eventIntegration data.
     */
    public setDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType, deviceEventInteraction: EventInteraction): boolean {
        return this.eventInteractions.setDeviceInteraction(deviceSerial, eventInteractionType, deviceEventInteraction);
    }

    /**
     * Delete a specified interaction for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public deleteDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType): boolean {
        return this.eventInteractions.deleteDeviceEventInteraction(deviceSerial, eventInteractionType);
    }

    /**
     * Remove all integrations.
     * @returns true, if all integrations deleted, otherwise false.
     */
    public removeInteractions(): any {
        return this.eventInteractions.removeIntegrations();
    }

    /**
     * Set the given property for the given device to the given value.
     * @param deviceSerial The serial of the device the property is to change.
     * @param name The name of the property.
     * @param value The value of the property.
     */
    public async setDeviceProperty(deviceSerial: string, name: string, value: unknown): Promise<void> {
        const device = await this.devices[deviceSerial];
        const station = await this.api.getStation(device.getStationSerial());
        const metadata = device.getPropertyMetadata(name);

        value = parseValue(metadata, value);

        switch (name) {
            case PropertyName.DeviceEnabled:
                station.enableDevice(device, value as boolean);
                break;
            case PropertyName.DeviceStatusLed:
                station.setStatusLed(device, value as boolean);
                break;
            case PropertyName.DeviceAutoNightvision:
                station.setAutoNightVision(device, value as boolean);
                break;
            case PropertyName.DeviceMotionDetection:
                station.setMotionDetection(device, value as boolean);
                break;
            case PropertyName.DeviceSoundDetection:
                station.setSoundDetection(device, value as boolean);
                break;
            case PropertyName.DevicePetDetection:
                station.setPetDetection(device, value as boolean);
                break;
            case PropertyName.DeviceRTSPStream:
                station.setRTSPStream(device, value as boolean);
                break;
            case PropertyName.DeviceAntitheftDetection:
                station.setAntiTheftDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLocked:
                station.lockDevice(device, value as boolean);
                break;
            case PropertyName.DeviceWatermark:
                station.setWatermark(device, value as number);
                break;
            case PropertyName.DeviceLight:
                station.switchLight(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsEnable:
                station.setFloodlightLightSettingsEnable(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsBrightnessManual:
                station.setFloodlightLightSettingsBrightnessManual(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsBrightnessMotion:
                station.setFloodlightLightSettingsBrightnessMotion(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsBrightnessSchedule:
                station.setFloodlightLightSettingsBrightnessSchedule(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionTriggered:
                station.setFloodlightLightSettingsMotionTriggered(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsMotionTriggeredDistance:
                station.setFloodlightLightSettingsMotionTriggeredDistance(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionTriggeredTimer:
                station.setFloodlightLightSettingsMotionTriggeredTimer(device, value as number);
                break;
            case PropertyName.DeviceMicrophone:
                station.setMicMute(device, value as boolean);
                break;
            case PropertyName.DeviceSpeaker:
                station.enableSpeaker(device, value as boolean);
                break;
            case PropertyName.DeviceSpeakerVolume:
                station.setSpeakerVolume(device, value as number);
                break;
            case PropertyName.DeviceAudioRecording:
                station.setAudioRecording(device, value as boolean);
                break;
            case PropertyName.DevicePowerSource:
                station.setPowerSource(device, value as number);
                break;
            case PropertyName.DevicePowerWorkingMode:
                station.setPowerWorkingMode(device, value as number);
                break;
            case PropertyName.DeviceRecordingEndClipMotionStops:
                station.setRecordingEndClipMotionStops(device, value as boolean);
                break;
            case PropertyName.DeviceRecordingClipLength:
                station.setRecordingClipLength(device, value as number);
                break;
            case PropertyName.DeviceRecordingRetriggerInterval:
                station.setRecordingRetriggerInterval(device, value as number);
                break;
            case PropertyName.DeviceVideoStreamingQuality:
                station.setVideoStreamingQuality(device, value as number);
                break;
            case PropertyName.DeviceVideoRecordingQuality:
                station.setVideoRecordingQuality(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivity:
                station.setMotionDetectionSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionTracking:
                station.setMotionTracking(device, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionType:
                station.setMotionDetectionType(device, value as number);
                break;
            case PropertyName.DeviceMotionZone:
                station.setMotionZone(device, value as MotionZone);
                break;
            case PropertyName.DeviceVideoWDR:
                station.setWDR(device, value as boolean);
                break;
            case PropertyName.DeviceRingtoneVolume:
                station.setRingtoneVolume(device, value as number);
                break;
            case PropertyName.DeviceChimeIndoor:
                station.enableIndoorChime(device, value as boolean);
                break;
            case PropertyName.DeviceChimeHomebase:
                station.enableHomebaseChime(device, value as boolean);
                break;
            case PropertyName.DeviceChimeHomebaseRingtoneVolume:
                station.setHomebaseChimeRingtoneVolume(device, value as number);
                break;
            case PropertyName.DeviceChimeHomebaseRingtoneType:
                station.setHomebaseChimeRingtoneType(device, value as number);
                break;
            case PropertyName.DeviceNotificationType:
                station.setNotificationType(device, value as NotificationType);
                break;
            case PropertyName.DeviceNotificationPerson:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, IndoorS350NotificationTypes.HUMAN, value as boolean);
                } else if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, FloodlightT8425NotificationTypes.HUMAN, value as boolean);
                } else {
                    station.setNotificationPerson(device, value as boolean);
                }
                break;
            case PropertyName.DeviceNotificationPet:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, IndoorS350NotificationTypes.PET, value as boolean);
                } else if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, FloodlightT8425NotificationTypes.PET, value as boolean);
                } else {
                    station.setNotificationPet(device, value as boolean);
                }
                break;
            case PropertyName.DeviceNotificationAllOtherMotion:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, IndoorS350NotificationTypes.ALL_OTHER_MOTION, value as boolean);
                } else if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, FloodlightT8425NotificationTypes.ALL_OTHER_MOTION, value as boolean);
                } else {
                    station.setNotificationAllOtherMotion(device, value as boolean);
                }
                break;
            case PropertyName.DeviceNotificationAllSound:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, IndoorS350NotificationTypes.ALL_SOUND, value as boolean);
                } else {
                    station.setNotificationAllSound(device, value as boolean);
                }
                break;
            case PropertyName.DeviceNotificationCrying:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setNotificationIndoor(device, IndoorS350NotificationTypes.CRYING, value as boolean);
                } else {
                    station.setNotificationCrying(device, value as boolean);
                }
            case PropertyName.DeviceNotificationVehicle:
                if (device.isFloodLightT8425()) {
                    station.setNotificationFloodlightT8425(device, FloodlightT8425NotificationTypes.VEHICLE, value as boolean);
                } else {
                    throw new InvalidPropertyError("Station has no writable property", { context: { station: station.getSerial(), propertyName: name, propertyValue: value } });
                }
                break;
            case PropertyName.DeviceNotificationMotion:
                station.setNotificationMotion(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationRing:
                station.setNotificationRing(device, value as boolean);
                break;
            case PropertyName.DeviceChirpVolume:
                station.setChirpVolume(device, value as number);
                break;
            case PropertyName.DeviceChirpTone:
                station.setChirpTone(device, value as number);
                break;
            case PropertyName.DeviceVideoHDR:
                station.setHDR(device, value as boolean);
                break;
            case PropertyName.DeviceVideoDistortionCorrection:
                station.setDistortionCorrection(device, value as boolean);
                break;
            case PropertyName.DeviceVideoRingRecord:
                station.setRingRecord(device, value as number);
                break;
            case PropertyName.DeviceRotationSpeed:
                station.setPanAndTiltRotationSpeed(device, value as number);
                break;
            case PropertyName.DeviceNightvision:
                station.setNightVision(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRange:
                station.setMotionDetectionRange(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeStandardSensitivity:
                station.setMotionDetectionRangeStandardSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeAdvancedLeftSensitivity:
                station.setMotionDetectionRangeAdvancedLeftSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeAdvancedMiddleSensitivity:
                station.setMotionDetectionRangeAdvancedMiddleSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeAdvancedRightSensitivity:
                station.setMotionDetectionRangeAdvancedRightSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionTestMode:
                station.setMotionDetectionTestMode(device, value as boolean);
                break;
            case PropertyName.DeviceMotionTrackingSensitivity:
                station.setMotionTrackingSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionAutoCruise:
                station.setMotionAutoCruise(device, value as boolean);
                break;
            case PropertyName.DeviceMotionOutOfViewDetection:
                station.setMotionOutOfViewDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsColorTemperatureManual:
                station.setLightSettingsColorTemperatureManual(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsColorTemperatureMotion:
                station.setLightSettingsColorTemperatureMotion(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsColorTemperatureSchedule:
                station.setLightSettingsColorTemperatureSchedule(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionActivationMode:
                station.setLightSettingsMotionActivationMode(device, value as number);
                break;
            case PropertyName.DeviceVideoNightvisionImageAdjustment:
                station.setVideoNightvisionImageAdjustment(device, value as boolean);
                break;
            case PropertyName.DeviceVideoColorNightvision:
                station.setVideoColorNightvision(device, value as boolean);
                break;
            case PropertyName.DeviceAutoCalibration:
                station.setAutoCalibration(device, value as boolean);
                break;
            case PropertyName.DeviceAutoLock:
                station.setAutoLock(device, value as boolean);
                break
            case PropertyName.DeviceAutoLockSchedule:
                station.setAutoLockSchedule(device, value as boolean);
                break
            case PropertyName.DeviceAutoLockScheduleStartTime:
                station.setAutoLockScheduleStartTime(device, value as string);
                break
            case PropertyName.DeviceAutoLockScheduleEndTime:
                station.setAutoLockScheduleEndTime(device, value as string);
                break
            case PropertyName.DeviceAutoLockTimer:
                station.setAutoLockTimer(device, value as number);
                break
            case PropertyName.DeviceOneTouchLocking:
                station.setOneTouchLocking(device, value as boolean);
                break
            case PropertyName.DeviceSound:
                station.setSound(device, value as number);
                break;
            case PropertyName.DeviceNotification:
                station.setNotification(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationLocked:
                station.setNotificationLocked(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationUnlocked:
                station.setNotificationUnlocked(device, value as boolean);
                break;
            case PropertyName.DeviceScramblePasscode:
                station.setScramblePasscode(device,value as boolean);
                break;
            case PropertyName.DeviceWrongTryProtection:
                station.setWrongTryProtection(device, value as boolean);
                break;
            case PropertyName.DeviceWrongTryAttempts:
                station.setWrongTryAttempts(device, value as number);
                break;
            case PropertyName.DeviceWrongTryLockdownTime:
                station.setWrongTryLockdownTime(device, value as number);
                break;
            case PropertyName.DeviceLoiteringDetection:
                station.setLoiteringDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringDetectionRange:
                station.setLoiteringDetectionRange(device, value as number);
                break;
            case PropertyName.DeviceLoiteringDetectionLength:
                station.setLoiteringDetectionLength(device, value as number);
                break;
            case PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponse:
                station.setLoiteringCustomResponseAutoVoiceResponse(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringCustomResponseHomeBaseNotification:
                station.setLoiteringCustomResponseHomeBaseNotification(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringCustomResponsePhoneNotification:
                station.setLoiteringCustomResponsePhoneNotification(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice:
                station.setLoiteringCustomResponseAutoVoiceResponseVoice(device, value as number);
                break;
            case PropertyName.DeviceLoiteringCustomResponseTimeFrom:
                station.setLoiteringCustomResponseTimeFrom(device, value as string);
                break;
            case PropertyName.DeviceLoiteringCustomResponseTimeTo:
                station.setLoiteringCustomResponseTimeTo(device, value as string);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityMode:
                station.setMotionDetectionSensitivityMode(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityStandard:
                station.setMotionDetectionSensitivityStandard(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedA:
                station.setMotionDetectionSensitivityAdvancedA(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedB:
                station.setMotionDetectionSensitivityAdvancedB(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedC:
                station.setMotionDetectionSensitivityAdvancedC(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedD:
                station.setMotionDetectionSensitivityAdvancedD(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedE:
                station.setMotionDetectionSensitivityAdvancedE(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedF:
                station.setMotionDetectionSensitivityAdvancedF(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedG:
                station.setMotionDetectionSensitivityAdvancedG(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedH:
                station.setMotionDetectionSensitivityAdvancedH(device, value as number);
                break;
            case PropertyName.DeviceDeliveryGuard:
                station.setDeliveryGuard(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuarding:
                station.setDeliveryGuardPackageGuarding(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuardingVoiceResponseVoice:
                station.setDeliveryGuardPackageGuardingVoiceResponseVoice(device, value as number);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeFrom:
                station.setDeliveryGuardPackageGuardingActivatedTimeFrom(device, value as string);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeTo:
                station.setDeliveryGuardPackageGuardingActivatedTimeTo(device, value as string);
                break;
            case PropertyName.DeviceDeliveryGuardUncollectedPackageAlert:
                station.setDeliveryGuardUncollectedPackageAlert(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardPackageLiveCheckAssistance:
                station.setDeliveryGuardPackageLiveCheckAssistance(device, value as boolean);
                break;
            case PropertyName.DeviceDualCamWatchViewMode:
                station.setDualCamWatchViewMode(device, value as number);
                break;
            case PropertyName.DeviceRingAutoResponse:
                station.setRingAutoResponse(device, value as boolean);
                break;
            case PropertyName.DeviceRingAutoResponseVoiceResponse:
                station.setRingAutoResponseVoiceResponse(device, value as boolean);
                break;
            case PropertyName.DeviceRingAutoResponseVoiceResponseVoice:
                station.setRingAutoResponseVoiceResponseVoice(device, value as number);
                break;
            case PropertyName.DeviceRingAutoResponseTimeFrom:
                station.setRingAutoResponseTimeFrom(device, value as string);
                break;
            case PropertyName.DeviceRingAutoResponseTimeTo:
                station.setRingAutoResponseTimeTo(device, value as string);
                break;
            case PropertyName.DeviceNotificationRadarDetector:
                station.setNotificationRadarDetector(device, value as boolean);
                break;
            case PropertyName.DeviceSoundDetectionSensitivity:
                station.setSoundDetectionSensitivity(device, value as number);
                break;
            case PropertyName.DeviceContinuousRecording:
                station.setContinuousRecording(device, value as boolean);
                break;
            case PropertyName.DeviceContinuousRecordingType:
                station.setContinuousRecordingType(device, value as number);
                break;
            case PropertyName.DeviceDefaultAngle:
                station.enableDefaultAngle(device, value as boolean);
                break;
            case PropertyName.DeviceDefaultAngleIdleTime:
                station.setDefaultAngleIdleTime(device, value as number);
                break;
            case PropertyName.DeviceNotificationIntervalTime:
                station.setNotificationIntervalTime(device, value as number);
                break;
            case PropertyName.DeviceSoundDetectionRoundLook:
                station.setSoundDetectionRoundLook(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardUncollectedPackageAlertTimeToCheck:
                station.setDeliveryGuardUncollectedPackageAlertTimeToCheck(device, value as string);
                break;
            case PropertyName.DeviceLeftOpenAlarm:
            case PropertyName.DeviceLeftOpenAlarmDuration:
            case PropertyName.DeviceDualUnlock:
            case PropertyName.DevicePowerSave:
            case PropertyName.DeviceInteriorBrightness:
            case PropertyName.DeviceInteriorBrightnessDuration:
            case PropertyName.DeviceTamperAlarm:
            case PropertyName.DeviceRemoteUnlock:
            case PropertyName.DeviceRemoteUnlockMasterPIN:
            case PropertyName.DeviceAlarmVolume:
            case PropertyName.DevicePromptVolume:
            case PropertyName.DeviceNotificationUnlockByKey:
            case PropertyName.DeviceNotificationUnlockByPIN:
            case PropertyName.DeviceNotificationUnlockByFingerprint:
            case PropertyName.DeviceNotificationUnlockByApp:
            case PropertyName.DeviceNotificationDualUnlock:
            case PropertyName.DeviceNotificationDualLock:
            case PropertyName.DeviceNotificationWrongTryProtect:
            case PropertyName.DeviceNotificationJammed:
                station.setSmartSafeParams(device, name, value as PropertyValue);
                break;
            case PropertyName.DeviceVideoTypeStoreToNAS:
                station.setVideoTypeStoreToNAS(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionTypeHumanRecognition:
                station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.HUMAN_RECOGNITION, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionTypeHuman:
                if (device.isWallLightCam()) {
                    station.setMotionDetectionTypeHuman(device, value as boolean);
                } else if (device.isOutdoorPanAndTiltCamera()) {
                    station.setMotionDetectionTypeHB3(device, T8170DetectionTypes.HUMAN_DETECTION, value as boolean);
                } else if (device.isSoloCameras()) {
                    station.setMotionDetectionTypeHB3(device, SoloCameraDetectionTypes.HUMAN_DETECTION, value as boolean);
                } else if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setMotionDetectionTypeHB3(device, IndoorS350DetectionTypes.HUMAN_DETECTION, value as boolean);
                } else {
                    station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.HUMAN_DETECTION, value as boolean);
                }
                break;
            case PropertyName.DeviceMotionDetectionTypePet:
                if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setMotionDetectionTypeHB3(device, IndoorS350DetectionTypes.PET_DETECTION, value as boolean);
                } else {
                    station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.PET_DETECTION, value as boolean);
                }
                break;
            case PropertyName.DeviceMotionDetectionTypeVehicle:
                if (device.isOutdoorPanAndTiltCamera()) {
                    station.setMotionDetectionTypeHB3(device, T8170DetectionTypes.VEHICLE_DETECTION, value as boolean);
                } else {
                    station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.VEHICLE_DETECTION, value as boolean);
                }
                break;
            case PropertyName.DeviceMotionDetectionTypeAllOtherMotions:
                if (device.isWallLightCam()) {
                    station.setMotionDetectionTypeAllOtherMotions(device, value as boolean);
                } else if (device.isOutdoorPanAndTiltCamera()) {
                    station.setMotionDetectionTypeHB3(device, T8170DetectionTypes.ALL_OTHER_MOTION, value as boolean);
                } else if (device.isSoloCameras()) {
                    station.setMotionDetectionTypeHB3(device, SoloCameraDetectionTypes.ALL_OTHER_MOTION, value as boolean);
                } else if (device.isIndoorPanAndTiltCameraS350()) {
                    station.setMotionDetectionTypeHB3(device, IndoorS350DetectionTypes.ALL_OTHER_MOTION, value as boolean);
                } else {
                    station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.ALL_OTHER_MOTION, value as boolean);
                }
                break;
            case PropertyName.DeviceLightSettingsManualLightingActiveMode:
                station.setLightSettingsManualLightingActiveMode(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsManualDailyLighting:
                station.setLightSettingsManualDailyLighting(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsManualColoredLighting:
                station.setLightSettingsManualColoredLighting(device, value as RGBColor);
                break;
            case PropertyName.DeviceLightSettingsManualDynamicLighting:
                station.setLightSettingsManualDynamicLighting(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionLightingActiveMode:
                station.setLightSettingsMotionLightingActiveMode(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionDailyLighting:
                station.setLightSettingsMotionDailyLighting(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionColoredLighting:
                station.setLightSettingsMotionColoredLighting(device, value as RGBColor);
                break;
            case PropertyName.DeviceLightSettingsMotionDynamicLighting:
                station.setLightSettingsMotionDynamicLighting(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsScheduleLightingActiveMode:
                station.setLightSettingsScheduleLightingActiveMode(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsScheduleDailyLighting:
                station.setLightSettingsScheduleDailyLighting(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsScheduleColoredLighting:
                station.setLightSettingsScheduleColoredLighting(device, value as RGBColor);
                break;
            case PropertyName.DeviceLightSettingsScheduleDynamicLighting:
                station.setLightSettingsScheduleDynamicLighting(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsColoredLightingColors:
                station.setLightSettingsColoredLightingColors(device, value as RGBColor[]);
                break;
            case PropertyName.DeviceLightSettingsDynamicLightingThemes:
                station.setLightSettingsDynamicLightingThemes(device, value as DynamicLighting[]);
                break;
            case PropertyName.DeviceDoorControlWarning:
                station.setDoorControlWarning(device, value as boolean);
                break;
            case PropertyName.DeviceDoor1Open:
                station.openDoor(device, value as boolean, 1);
                break;
            case PropertyName.DeviceDoor2Open:
                station.openDoor(device, value as boolean, 2);
                break;
            case PropertyName.DeviceLeftBehindAlarm: {
                const tracker = device as Tracker;
                const result = await tracker.setLeftBehindAlarm(value as boolean);
                if (result) {
                    device.updateProperty(name, value as boolean)
                }
                break;
            }
            case PropertyName.DeviceFindPhone: {
                const tracker = device as Tracker;
                const result = await tracker.setFindPhone(value as boolean);
                if (result) {
                    device.updateProperty(name, value as boolean)
                }
                break;
            }
            case PropertyName.DeviceTrackerType: {
                const tracker = device as Tracker;
                const result = await tracker.setTrackerType(value as number);
                if (result) {
                    device.updateProperty(name, value as number)
                }
                break;
            }
            case PropertyName.DeviceImageMirrored:
                station.setMirrorMode(device, value as boolean);
                break;
            case PropertyName.DeviceFlickerAdjustment:
                station.setFlickerAdjustment(device, value as number);
                break;
            case PropertyName.DeviceSoundDetectionType:
                station.setSoundDetectionType(device, value as number);
                break;
            case PropertyName.DeviceLeavingDetection:
                station.setLeavingDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLeavingReactionNotification:
                station.setLeavingReactionNotification(device, value as boolean);
                break;
            case PropertyName.DeviceLeavingReactionStartTime:
                station.setLeavingReactionStartTime(device, value as string);
                break;
            case PropertyName.DeviceLeavingReactionEndTime:
                station.setLeavingReactionEndTime(device, value as string);
                break;
            case PropertyName.DeviceBeepVolume:
                station.setBeepVolume(device, value as number);
                break;
            case PropertyName.DeviceNightvisionOptimization:
                station.setNightvisionOptimization(device, value as boolean);
                break;
            case PropertyName.DeviceNightvisionOptimizationSide:
                station.setNightvisionOptimizationSide(device, value as number);
                break;
            case PropertyName.DeviceOpenMethod:
                station.setOpenMethod(device, value as number);
                break;
            case PropertyName.DeviceMotionActivatedPrompt:
                station.setMotionActivatedPrompt(device, value as boolean);
                break;
            default:
                if (!Object.values(PropertyName).includes(name as PropertyName))
                    throw new ReadOnlyPropertyError("Property is read only", { context: { device: deviceSerial, propertyName: name, propertyValue: value } });
                throw new InvalidPropertyError("Device has no writable property", { context: { device: deviceSerial, propertyName: name, propertyValue: value } });
        }
    }
}
