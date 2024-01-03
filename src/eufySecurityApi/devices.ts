import { TypedEmitter } from "tiny-typed-emitter";
import EventEmitter from "events";
import { DeviceNotFoundError, ReadOnlyPropertyError, ensureError } from "./error";
import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, IndoorCamera, FloodlightCamera, SoloCamera, PropertyName, RawValues, Keypad, EntrySensor, MotionSensor, Lock, UnknownDevice, BatteryDoorbellCamera, WiredDoorbellCamera, DeviceListResponse, NotificationType, SmartSafe, InvalidPropertyError, Station, HB3DetectionTypes, Picture, CommandName, WallLightCam, GarageCamera, Tracker, T8170DetectionTypes } from './http';
import { EufySecurityEvents } from './interfaces';
import { DatabaseQueryLocal, DynamicLighting, MotionZone, RGBColor, SmartSafeAlarm911Event, SmartSafeShakeAlarmEvent } from "./p2p";
import { getError, parseValue, waitForEvent } from "./utils";
import { CameraEvent } from "./utils/utils";
import { DeviceInteractions, EventInteraction } from "./utils/models";
import { EventInteractionType } from "./utils/types";
import { EventInteractions } from "./eventInteractions";

/**
 * Represents all the Devices in the account.
 */
export class Devices extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private eventInteractions: EventInteractions;
    private devices : { [deviceSerial : string] : any } = {};
    //private devicesHistory : { [deviceSerial : string] : DatabaseQueryLocal[] } = {};
    private devicesLastEvent : { [deviceSerial : string] : CameraEvent | null } = {};
    private loadingEmitter = new EventEmitter();
    private devicesLoaded?: Promise<void> = waitForEvent<void>(this.loadingEmitter, "devices loaded");
    private deviceSnoozeTimeout : { [dataType : string] : NodeJS.Timeout; } = {};
    private deviceImageLoadTimeout : { [deviceSerial : string] : NodeJS.Timeout | undefined } = {};

    /**
     * Create the Devices objects holding all devices in the account.
     * @param api  The api.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;
        this.eventInteractions = new EventInteractions(this.api);

        if(this.api.getApiUsePushService() == false)
        {
            this.api.logInfoBasic("Retrieving last video event times disabled in settings.");
        }

        this.httpService.on("devices", (devices: FullDevices) => this.handleDevices(devices));
    }

    /**
     * Handle the devices so that they can be used by the addon.
     * @param devices The devices object with all devices.
     */
    private async handleDevices(devices : FullDevices) : Promise<void>
    {
        this.api.logDebug("Got devices", { devices: devices });
        
        const resDevices = devices;

        const deviceSNs: string[] = Object.keys(this.devices);
        const newDeviceSNs = Object.keys(devices);
        const promises: Array<Promise<Device>> = [];
        
        var deviceSerial : string;
        
        if(resDevices != null)
        {
            for (deviceSerial in resDevices)
            {
                if(this.api.getHouseId() !== undefined && resDevices[deviceSerial].house_id !== undefined && this.api.getHouseId() !== "all" && resDevices[deviceSerial].house_id !== this.api.getHouseId())
                {
                    this.api.logDebug(`Device ${deviceSerial} does not match houseId (got ${resDevices[deviceSerial].house_id} want ${this.api.getHouseId()}).`);
                    continue;
                }
                if(this.devices[deviceSerial])
                {
                    this.updateDevice(resDevices[deviceSerial]);
                }
                else
                {
                    if (this.devicesLoaded === undefined)
                    {
                        this.devicesLoaded = waitForEvent<void>(this.loadingEmitter, "devices loaded");
                    }
                    let new_device : Promise<Device>;

                    if(Device.isIndoorCamera(resDevices[deviceSerial].device_type))
                    {
                        new_device = IndoorCamera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isSoloCameras(resDevices[deviceSerial].device_type))
                    {
                        new_device = SoloCamera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isBatteryDoorbell(resDevices[deviceSerial].device_type))
                    {
                        new_device = BatteryDoorbellCamera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isWiredDoorbell(resDevices[deviceSerial].device_type) || Device.isWiredDoorbellDual(resDevices[deviceSerial].device_type))
                    {
                        new_device = WiredDoorbellCamera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isFloodLight(resDevices[deviceSerial].device_type))
                    {
                        new_device = FloodlightCamera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (Device.isWallLightCam(resDevices[deviceSerial].device_type))
                    {
                        new_device = WallLightCam.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (Device.isGarageCamera(resDevices[deviceSerial].device_type))
                    {
                        new_device = GarageCamera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isCamera(resDevices[deviceSerial].device_type))
                    {
                        new_device = Camera.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isLock(resDevices[deviceSerial].device_type))
                    {
                        new_device = Lock.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isMotionSensor(resDevices[deviceSerial].device_type))
                    {
                        new_device = MotionSensor.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isEntrySensor(resDevices[deviceSerial].device_type))
                    {
                        new_device = EntrySensor.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isKeyPad(resDevices[deviceSerial].device_type))
                    {
                        new_device = Keypad.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (Device.isSmartSafe(resDevices[deviceSerial].device_type))
                    {
                        new_device = SmartSafe.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (Device.isSmartTrack(resDevices[deviceSerial].device_type))
                    {
                        new_device = Tracker.getInstance(this.httpService, resDevices[deviceSerial]);
                    }
                    else
                    {
                        new_device = UnknownDevice.getInstance(this.httpService, resDevices[deviceSerial]);
                    }                        

                    promises.push(new_device.then((device: Device) => {
                        try
                        {
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
                            device.initialize();
                        }
                        catch (err) {
                            const error = ensureError(err);
                            this.api.logError("HandleDevices Error", { error: getError(error), deviceSN: device.getSerial() });
                        }
                        return device;
                    }));
                }
            }

            Promise.all(promises).then((devices) => {
                devices.forEach((device) => {
                    this.api.getStation(device.getStationSerial()).then((station: Station) => {
                        if (!station.isConnected() && station.isP2PConnectableDevice())
                        {
                            station.setConnectionType(this.api.getP2PConnectionType());
                            station.connect();
                        }
                    }).catch((err) => {
                        const error = ensureError(err);
                        this.api.logError("Error trying to connect to station after device loaded", { error: getError(error), deviceSN: device.getSerial() });
                    });
                });
                this.loadingEmitter.emit("devices loaded");
                this.devicesLoaded = undefined;
            });

            if (promises.length === 0)
            {
                this.loadingEmitter.emit("devices loaded");
                this.devicesLoaded = undefined;
            }

            for (const deviceSN of deviceSNs)
            {
                if (!newDeviceSNs.includes(deviceSN))
                {
                    this.getDevice(deviceSN).then((device: Device) => {
                        this.removeDevice(device);
                    }).catch((err) => {
                        const error = ensureError(err);
                        this.api.logError("Error removing device", { error: getError(error), deviceSN: deviceSN });
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
    private addDevice(device : Device) : void
    {
        const serial = device.getSerial();
        if (serial && !Object.keys(this.devices).includes(serial))
        {
            this.devices[serial] = device;
            //this.devicesHistory[serial] = [];
            this.devicesLastEvent[serial] = null;
            this.deviceImageLoadTimeout[serial] = undefined;
            this.emit("device added", device);

            if (device.isLock())
            {
                this.api.getMqttService().subscribeLock(device.getSerial());
            }
        }
        else
        {
            this.api.logDebug(`Device with this serial ${device.getSerial()} exists already and couldn't be added again!`);
        }
    }

    /**
     * Remove the given device.
     * @param device The device object to remove.
     */
    private removeDevice(device : Device) : void
    {
        const serial = device.getSerial();
        if (serial && Object.keys(this.devices).includes(serial))
        {
            delete this.devices[serial];
            device.removeAllListeners();
            this.emit("device removed", device);
        }
        else
        {
            this.api.logDebug(`Device with this serial ${device.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }

    /**
     * Update the device information.
     * @param device The device object to update.
     */
    private async updateDevice(device : DeviceListResponse) : Promise<void>
    {
        if (this.devicesLoaded)
        {
            await this.devicesLoaded;
        }
        if (Object.keys(this.devices).includes(device.device_sn))
        {
            this.devices[device.device_sn].update(device)
        }
        else
        {
            throw new DeviceNotFoundError(`Device with this serial ${device.device_sn} doesn't exists and couldn't be updated!`);
        }
    }

    /**
     * (Re)Loads all Devices and the settings of them.
     */
    public async loadDevices() : Promise<void>
    {
        try
        {
            this.handleDevices(this.httpService.getDevices());
        }
        catch (e : any)
        {
            this.devices = {};
            throw new Error(e);
        }
    }

    /**
     * Close all connections for all devices.
     */
    public closeDevices() : void
    {
        if(this.devices != null)
        {
            for (var deviceSerial in this.devices)
            {
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

                (this.devices[deviceSerial] as Device).destroy();
            }
        }
    }

    /**
     * Close devices.
     */
    public close() : void
    {
        Object.keys(this.deviceSnoozeTimeout).forEach(device_sn => {
            clearTimeout(this.deviceSnoozeTimeout[device_sn]);
            delete this.deviceSnoozeTimeout[device_sn];
        });
    }

    /**
     * Returns all Devices.
     */
    public async getDevices() : Promise<{ [deviceSerial : string] : any }> 
    {
        if (this.devicesLoaded)
        {
            await this.devicesLoaded;
        }
        return this.devices;
    }

    /**
     * Get the device specified by serial number.
     * @param deviceSerial The serial of the device.
     * @returns The device as Device object.
     */
    public async getDevice(deviceSerial : string) : Promise<Device>
    {
        if (this.devicesLoaded)
        {
            await this.devicesLoaded;
        }
        if (Object.keys(this.devices).includes(deviceSerial))
        {
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
    public async getDeviceByStationAndChannel(baseSerial : string, channel : number) : Promise<Device>
    {
        if (this.devicesLoaded)
        {
            await this.devicesLoaded;
        }
        for (const device of Object.values(this.devices))
        {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial))
            {
                return device;
            }
        }
        throw new DeviceNotFoundError("No device with passed channel found on station", { context: { station: baseSerial, channel: channel } });
    }

    public async getDevicesFromStation(stationSerial: string): Promise<Array<Device>>
    {
        if (this.devicesLoaded)
        {
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
    public existDevice(deviceSerial : string) : boolean
    {
        var res = this.devices[deviceSerial];
        if(res)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Snoozes a given device for a given time.
     * @param device The device as object.
     * @param timeoutMS The snooze time in ms.
     */
    public setDeviceSnooze(device : Device, timeoutMS : number) : void
    {
        this.deviceSnoozeTimeout[device.getSerial()] = setTimeout(() => {
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
            delete this.deviceSnoozeTimeout[device.getSerial()];
        }, timeoutMS);
    }

    /**
     * Returns a string with the type of the device.
     * @param device The device.
     * @returns A string with the type of the device.
     */
    public getDeviceTypeAsString(device : Device) : string
    {
        if(device.isFirstCamera() || device.isCameraE() || device.isCamera2() || device.isCamera2C() || device.isCamera2Pro() || device.isCamera2CPro() || device.isCamera3() || device.isCamera3C())
        {
            return "camera";
        }
        else if(device.isDoorbell())
        {
            return "doorbell";
        }
        else if(device.isIndoorCamera())
        {
            return "indoorcamera";
        }
        else if(device.isSoloCameras())
        {
            return "solocamera";
        }
        else if(device.isFloodLight())
        {
            return "floodlight";
        }
        else if(device.isWallLightCam())
        {
            return "walllightcamera";
        }
        else if(device.isGarageCamera())
        {
            return "garagecamera";
        }
        else if(device.isStarlight4GLTE())
        {
            return "starlight4glte"
        }
        else if(device.isLock())
        {
            return "lock";
        }
        else if(device.isEntrySensor())
        {
            return "sensor";
        }
        else if(device.isKeyPad())
        {
            return "keypad";
        }
        else
        {
            return `unknown(${device.getRawDevice().device_type})`;
        }
    }

    /**
     * Add a given event listener for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    public addEventListener(device : Device, eventListenerName : string) : void
    {
        switch (eventListenerName)
        {
            case "PropertyChanged":
                device.on("property changed", (device : Device, name : string, value : PropertyValue, ready: boolean) => this.onPropertyChanged(device, name, value, ready));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.on("raw property changed", (device : Device, type : number, value : string) => this.onRawPropertyChanged(device, type, value));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "CryingDetected":
                device.on("crying detected", (device : Device, state : boolean) => this.onCryingDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("crying detected")} Listener.`);
                break;
            case "SoundDetected":
                device.on("sound detected", (device : Device, state : boolean) => this.onSoundDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("sound detected")} Listener.`);
                break;
            case "PetDetected":
                device.on("pet detected", (device : Device, state : boolean) => this.onPetDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("pet detected")} Listener.`);
                break;
            case "VehicleDetected":
                device.on("vehicle detected", (device : Device, state : boolean) => this.onVehicleDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("vehicle detected")} Listener.`);
                break;
            case "MotionDetected":
                device.on("motion detected", (device : Device, state : boolean) => this.onMotionDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device : Device, state : boolean, person : string) => this.onPersonDetected(device, state, person));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("person detected")} Listener.`);
                break;
            case "Rings":
                device.on("rings", (device : Device, state : boolean) => this.onRings(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("rings")} Listener.`);
                break;
            case "Locked":
                device.on("locked", (device : Device, state : boolean) => this.onLocked(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("locked")} Listener.`);
                break;
            case "Open":
                device.on("open", (device : Device, state : boolean) => this.onOpen(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("open")} Listener.`);
                break;
            case "Ready":
                device.on("ready", (device : Device) => this.onReady(device));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("ready")} Listener.`);
                break;
            case "PackageDelivered":
                device.on("package delivered", (device: Device, state: boolean) => this.onDevicePackageDelivered(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package delivered")} Listener.`);
                break;
            case "PackageStranded":
                device.on("package stranded", (device: Device, state: boolean) => this.onDevicePackageStranded(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package stranded")} Listener.`);
                break;
            case "PackageTaken":
                device.on("package taken", (device: Device, state: boolean) => this.onDevicePackageTaken(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("package taken")} Listener.`);
                break;
            case "SomeoneLoitering":
                device.on("someone loitering", (device: Device, state: boolean) => this.onDeviceSomeoneLoitering(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("someone loitering")} Listener.`);
                break;
            case "RadarMotionDetected":
                device.on("radar motion detected", (device: Device, state: boolean) => this.onDeviceRadarMotionDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("radar motion detected")} Listener.`);
                break;
            case "911Alarm":
                device.on("911 alarm", (device: Device, state: boolean, detail: SmartSafeAlarm911Event) => this.onDevice911Alarm(device, state, detail));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("911 alarm")} Listener.`);
                break;
            case "ShakeAlarm":
                device.on("shake alarm", (device: Device, state: boolean, detail: SmartSafeShakeAlarmEvent) => this.onDeviceShakeAlarm(device, state, detail));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("shake alarm")} Listener.`);
                break;
            case "WrongTryProtectAlarm":
                device.on("wrong try-protect alarm", (device: Device, state: boolean) => this.onDeviceWrongTryProtectAlarm(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("wrong try-protect alarm")} Listener.`);
                break;
            case "LongTimeNotClose":
                device.on("long time not close", (device: Device, state: boolean) => this.onDeviceLongTimeNotClose(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("long time not close")} Listener.`);
                break;
            case "LowBattery":
                device.on("low battery", (device: Device, state: boolean) => this.onDeviceLowBattery(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("low battery")} Listener.`);
                break;
            case "Jammed":
                device.on("jammed", (device: Device, state: boolean) => this.onDeviceJammed(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("jammed")} Listener.`);
                break;
            case "StrangerPersonDetected":
                device.on("stranger person detected", (device: Device, state: boolean) => this.onDeviceStrangerPersonDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("stranger person detected")} Listener.`);
                break;
            case "DogDetected":
                device.on("dog detected", (device: Device, state: boolean) => this.onDeviceDogDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog detected")} Listener.`);
                break;
            case "DogLickDetected":
                device.on("dog lick detected", (device: Device, state: boolean) => this.onDeviceDogLickDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog lick detected")} Listener.`);
                break;
            case "DogPoopDetected":
                device.on("dog poop detected", (device: Device, state: boolean) => this.onDeviceDogPoopDetected(device, state));
                this.api.logDebug(`Listener '${eventListenerName}' for device ${device.getSerial()} added. Total ${device.listenerCount("dog poop detected")} Listener.`);
                break;
        }
    }

    /**
     * Remove all event listeners for a given event type for a given device.
     * @param device The device as Device object.
     * @param eventListenerName The event listener name as string.
     */
    public removeEventListener(device : Device, eventListenerName : string) : void
    {
        switch (eventListenerName)
        {
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
    private async onPropertyChanged(device : Device, name : string, value : PropertyValue, ready: boolean) : Promise<void>
    {
        //this.emit("device property changed", device, name, value);
        this.api.logDebug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value}`);
        try
        {
            if (ready && !name.startsWith("hidden-"))
            {
                this.emit("device property changed", device, name, value);
            }
            if (name === PropertyName.DeviceRTSPStream && (value as boolean) === true && (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) === undefined || (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) !== undefined && (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) as string) === "")))
            {
                this.api.getStation(device.getStationSerial()).then((station: Station) => {
                    station.setRTSPStream(device, true);
                }).catch((err) => {
                    const error = ensureError(err);
                    this.api.logError(`Device property changed error - station enable rtsp`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
                });
            }
            else if (name === PropertyName.DeviceRTSPStream && (value as boolean) === false)
            {
                device.setCustomPropertyValue(PropertyName.DeviceRTSPStreamUrl, "");
            
            }
            else if (name === PropertyName.DevicePictureUrl && value !== "")
            {
                this.api.getStation(device.getStationSerial()).then((station: Station) => {
                    if (station.hasCommand(CommandName.StationDownloadImage))
                    {
                        station.downloadImage(value as string);
                    }
                }).catch((err) => {
                    const error = ensureError(err);
                    this.api.logError(`Device property changed error - station download image`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
                });
            }
        }
        catch (err)
        {
            const error = ensureError(err);
            this.api.logError(`Device property changed error`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial(), propertyName: name, propertyValue: value, ready: ready });
        }
    }
    
    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param device The device as Device object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    private async onRawPropertyChanged(device : Device, type : number, value : string) : Promise<void>
    {
        //this.emit("device raw property changed", device, type, value, modified);
        this.api.logDebug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value}`);
    }

    /**
     * The action to be one when event CryingDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onCryingDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "CryingDetected": device: ${device.getSerial()} | state: ${state}`);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.CRYING);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
        //this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event SoundDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onSoundDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "SoundDetected": device: ${device.getSerial()} | state: ${state}`);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.SOUND);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
        //this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event PetDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onPetDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "PetDetected": device: ${device.getSerial()} | state: ${state}`);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.PET);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
        //this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event VehicleDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private onVehicleDetected(device: Device, state: boolean): void
    {
        this.api.logDebug(`Event "VehicleDetected": device: ${device.getSerial()} | state: ${state}`);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.VEHICLE);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
        //this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onMotionDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.MOTION);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
        //this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    private async onPersonDetected(device : Device, state : boolean, person : string) : Promise<void>
    {
        this.api.logDebug(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.PERSON);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
        //this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event Rings is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onRings(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "Rings": device: ${device.getSerial()} | state: ${state}`);
        //this.setLastVideoTimeNow(device.getSerial());
        try
        {
            var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.RING);
            if(deviceEventInteraction !== null)
            {
                this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
            }
        }
        catch {}
    }

    /**
     * The action to be one when event Locked is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onLocked(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "Locked": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event Open is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onOpen(device : Device, state : boolean) : Promise<void>
    {
        this.api.logDebug(`Event "Open": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event Ready is fired.
     * @param device The device as Device object.
     */
    private async onReady(device : Device) : Promise<void>
    {
        this.api.logDebug(`Event "Ready": device: ${device.getSerial()}`);
        try
        {
            if (device.getPropertyValue(PropertyName.DeviceRTSPStream) !== undefined && (device.getPropertyValue(PropertyName.DeviceRTSPStream) as boolean) === true)
            {
                this.api.getStation(device.getStationSerial()).then((station: Station) => {
                    station.setRTSPStream(device, true);
                }).catch((err) => {
                    const error = ensureError(err);
                    this.api.logError(`Device ready error - station enable rtsp`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial() });
                });
            }
        }
        catch (err)
        {
            const error = ensureError(err);
            this.api.logError(`Device ready error`, { error: getError(error), deviceSN: device.getSerial(), stationSN: device.getStationSerial() });
        }
    }

    /**
     * The action to be one when event DevicePackageDelivered is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePackageDelivered(device : Device, state : boolean) : void
    {
        this.emit("device package delivered", device, state);
    }

    /**
     * The action to be one when event DevicePackageStranded is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePackageStranded(device : Device, state : boolean) : void
    {
        this.emit("device package stranded", device, state);
    }

    /**
     * The action to be one when event DevicePackageTaken is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDevicePackageTaken(device : Device, state : boolean) : void
    {
        this.emit("device package taken", device, state);
    }

    /**
     * The action to be one when event DeviceSomeoneLoitering is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceSomeoneLoitering(device : Device, state : boolean) : void
    {
        this.emit("device someone loitering", device, state);
    }

    /**
     * The action to be one when event DeviceRadarMotionDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceRadarMotionDetected(device : Device, state : boolean) : void
    {
        this.emit("device radar motion detected", device, state);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.RADAR_MOTION);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
    }

    /**
     * The action to be one when event Device911Alarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     * @param detail The detail.
     */
    private onDevice911Alarm(device : Device, state : boolean, detail : SmartSafeAlarm911Event) : void
    {
        this.emit("device 911 alarm", device, state, detail);
    }

    /**
     * The action to be one when event DeviceShakeAlarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     * @param detail The detail.
     */
    private onDeviceShakeAlarm(device : Device, state : boolean, detail : SmartSafeShakeAlarmEvent) : void
    {
        this.emit("device shake alarm", device, state, detail);
    }

    /**
     * The action to be one when event DeviceWrongTryProtectAlarm is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceWrongTryProtectAlarm(device : Device, state : boolean) : void
    {
        this.emit("device wrong try-protect alarm", device, state);
    }

    /**
     * The action to be one when event DeviceLongTimeNotClose is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceLongTimeNotClose(device : Device, state : boolean) : void
    {
        this.emit("device long time not close", device, state);
    }

    /**
     * The action to be one when event DeviceLowBattery is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceLowBattery(device : Device, state : boolean) : void
    {
        this.emit("device low battery", device, state);
    }

    /**
     * The action to be one when event DeviceJammed is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceJammed(device : Device, state : boolean) : void
    {
        this.emit("device jammed", device, state);
    }

    /**
     * The action to be one when event DeviceStrangerPersonDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceStrangerPersonDetected(device: Device, state: boolean): void {
        this.emit("device stranger person detected", device, state);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.STRANGER_PERSON);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
    }

    /**
     * The action to be one when event DeviceDogDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceDogDetected(device: Device, state: boolean): void {
        this.emit("device dog detected", device, state);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.DOG);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
    }

    /**
     * The action to be one when event DeviceDogLickDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceDogLickDetected(device: Device, state: boolean): void {
        this.emit("device dog lick detected", device, state);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.DOG_LICK);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
    }

    /**
     * The action to be one when event DeviceDogPoopDetected is fired.
     * @param device The device as Device object.
     * @param state The state.
     */
    private onDeviceDogPoopDetected(device: Device, state: boolean): void {
        this.emit("device dog poop detected", device, state);
        if(state === true)
        {
            try
            {
                var deviceEventInteraction = this.getDeviceInteraction(device.getSerial(), EventInteractionType.DOG_POOP);
                if(deviceEventInteraction !== null)
                {
                    this.api.sendInteractionCommand(deviceEventInteraction.target, deviceEventInteraction.useHttps, deviceEventInteraction.command);
                }
            }
            catch {}
        }
        if(state === false)
        {
            this.loadDeviceImage(device.getSerial());
        }
    }

    /**
     * Update the raw values for a given device.
     * @param deviceSerial The serial of the device.
     * @param values The raw values.
     */
    public async updateDeviceProperties(deviceSerial : string, values : RawValues) : Promise<void>
    {
        this.getDevice(deviceSerial).then((device: Device) => {
            device.updateRawProperties(values);
        }).catch((err) => {
            const error = ensureError(err);
            this.api.logError("Update device properties error", { error: getError(error), deviceSN: deviceSerial, values: values });
        });
    }

    /**
     * Add a given event result to the local store if the event is not already stored.
     * @param deviceSerial The serial of the device.
     * @param eventResult The event result data.
     */
    /*public addEventResultForDevice(deviceSerial : string, eventResult : DatabaseQueryLocal)
    {
        for (let event of this.devicesHistory[deviceSerial])
        {
            if(event.history && eventResult.history && event.history.start_time && eventResult.history.start_time && event.record_id === eventResult.record_id && event.history.storage_path === eventResult.history.storage_path && event.history.start_time === eventResult.history.start_time)
            {
                return;
            }
        }
        this.devicesHistory[deviceSerial].push(eventResult);
    }*/

    /**
     * Set given event data to the local store.
     * @param deviceSerial The serial of the device.
     * @param path The path to the image.
     * @param start_time The date as Date.
     */
    public addLastEventForDevice(deviceSerial : string, path : string, start_time : Date)
    {
        this.devicesLastEvent[deviceSerial] = { path, start_time };
    }

    /**
     * Returns the stored events for a given device.
     * @param deviceSerial The serial of the device.
     * @returns The stored events.
     */
    /*public getEventResultsForDevice1(deviceSerial : string) : DatabaseQueryLocal[]
    {
        return this.devicesHistory[deviceSerial];
    }*/

    /**
     * Returns the stored last event for a given device.
     * @param deviceSerial The serial of the device.
     * @returns The stored last event.
     */
    public getLastEventForDevice(deviceSerial : string) : CameraEvent | null
    {
        return this.devicesLastEvent[deviceSerial];
    }

    /**
     * Set the timeout of 75 seconds to download image of last event.
     * @param deviceSerial The serial of the device.
     */
    private loadDeviceImage(deviceSerial : string)
    {
        if (this.deviceImageLoadTimeout[deviceSerial] !== undefined)
        {
            clearTimeout(this.deviceImageLoadTimeout[deviceSerial]);
        }

        this.deviceImageLoadTimeout[deviceSerial] = setTimeout(() => { this.getDeviceImage(deviceSerial) }, 75 * 1000);
    }

    /**
     * Helper for removing timeout and initiate download of the image of the last event.
     * @param deviceSerial The serial of the device.
     */
    private getDeviceImage(deviceSerial : string)
    {
        if (this.deviceImageLoadTimeout[deviceSerial] !== undefined)
        {
            clearTimeout(this.deviceImageLoadTimeout[deviceSerial]);
        }
        
        //this.getDeviceEvents(deviceSerial);
        this.getDeviceLastEvent(deviceSerial);
    }

    /**
     * Retrieves the events of the given device.
     * @param deviceSerial The serial of the device.
     */
    /*public async getDeviceEvents(deviceSerial : string)
    {
        var device = await this.getDevice(deviceSerial);
        var station = await this.api.getStation(device.getStationSerial());
        var deviceSerials : string[] = [];
        var dateEnd = new Date(Date.now());
        dateEnd.setDate(dateEnd.getDate()+1);
        var dateStart = new Date(Date.now());
        dateStart.setFullYear(dateStart.getFullYear()-1);

        deviceSerials.push(device.getSerial());
        if(device)
        {
            station.databaseQueryLocal(deviceSerials, dateStart, dateEnd);
        }
    }*/

    /**
     * Retrieves the last event of the given device.
     * @param deviceSerial The serial of the device.
     */
    public async getDeviceLastEvent(deviceSerial : string)
    {
        try
        {
            var device = await this.getDevice(deviceSerial);
            var station = await this.api.getStation(device.getStationSerial());

            if(device)
            {
                station.databaseQueryLatestInfo();
            }
        }
        catch (error)
        {
            this.api.logError("Error at getDeviceLastEvent: ", error);
        }
    }

    /**
     * Retrieves the events of all devices.
     */
    /*public async getDevicesEvents()
    {
        var devices = await this.getDevices();
        var stations = await this.api.getStations();
        var dateEnd = new Date(Date.now());
        dateEnd.setDate(dateEnd.getDate()+1);
        var dateStart = new Date(Date.now());
        dateStart.setFullYear(dateStart.getFullYear()-1);

        for(let station in stations)
        {
            let deviceSerials : string[] = [];
            for(let device in devices)
            {
                if(devices[device].getStationSerial() === stations[station].getSerial())
                {
                    deviceSerials.push(devices[device].getSerial());
                }
            }

            stations[station].databaseQueryLocal(deviceSerials, dateStart, dateEnd);
        }
    }*/

    /**
     * Retrieves the last event of all devices.
     */
    public async getDevicesLastEvent()
    {
        var stations = await this.api.getStations();

        for(let station in stations)
        {
            stations[station].databaseQueryLatestInfo();
        }
    }

    /**
     * Downloads the image of the last event for the given device.
     * @param deviceSerial The serial of the device.
     */
    public async downloadLatestImageForDevice(deviceSerial : string)
    {
        try
        {
            var device = await this.getDevice(deviceSerial);
            var station = await this.api.getStation(device.getStationSerial());
            /*var results = this.getEventResultsForDevice(deviceSerial);
            if(results && results.length > 0)
            {
                for(var pos = results.length - 1; pos >= 0; pos--)
                {
                    if(results[pos].history && results[pos].history.thumb_path)
                    {
                        station.downloadImage(results[pos].history.thumb_path);
                        return;
                    }
                }
            }*/
            var result = this.getLastEventForDevice(deviceSerial);
            if(result !== null && result.path !== "")
            {
                station.downloadImage(result.path);
                return;
            }
        }
        catch (error)
        {
            this.api.logError("Error at downloadLatestImageForDevice: ", error);
        }
    }

    /**
     * Returns the timestamp of the last event for the given device.
     * @param deviceSerial The serial of the device.
     * @returns The timestamp or undefinied.
     */
    /*public getLastEventTimeForDevice(deviceSerial : string) : number | undefined
    {
        if(this.devicesHistory[deviceSerial] !== undefined && this.devicesHistory[deviceSerial].length > 0)
        {
            for(var pos = this.devicesHistory[deviceSerial].length - 1; pos >= 0; pos--)
            {
                if(this.devicesHistory[deviceSerial][pos].history && this.devicesHistory[deviceSerial][pos].history.start_time)
                {
                    return this.devicesHistory[deviceSerial][pos].history.start_time.valueOf();
                }
            }
        }
        return undefined;
    }*/

    /**
     * Returns the timestamp of the last event for the given device.
     * @param deviceSerial The serial of the device.
     * @returns The timestamp or undefinied.
     */
    public getLastEventTimeForDevice(deviceSerial : string) : number | undefined
    {
        var result = this.getLastEventForDevice(deviceSerial);
        if(result !== null && result.path !== "")
        {
            return result.start_time.valueOf();
        }
        return undefined;
    }

    /**
     * Retrieve the interactions for a given device.
     * @param deviceSerial The serial of the device.
     */
    public getDeviceInteractions(deviceSerial: string): DeviceInteractions | null
    {
        return this.eventInteractions.getDeviceInteractions(deviceSerial);
    }

    /**
     * Retrieve the interaction for a given eventInteractionType for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public getDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType): EventInteraction | null
    {
        return this.eventInteractions.getDeviceEventInteraction(deviceSerial, eventInteractionType);
    }

    /**
     * Updates a interaction for a given eventInteractionType for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     * @param deviceEventInteraction The eventIntegration data.
     */
    public setDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType, deviceEventInteraction: EventInteraction): boolean
    {
        return this.eventInteractions.setDeviceInteraction(deviceSerial, eventInteractionType, deviceEventInteraction);
    }

    /**
     * Delete a specified interaction for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The eventInteractionType.
     */
    public deleteDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType): boolean
    {
        return this.eventInteractions.deleteDeviceEventInteraction(deviceSerial, eventInteractionType);
    }

    /**
     * Remove all integrations.
     * @returns true, if all integrations deleted, otherwise false.
     */
    public removeInteractions(): any
    {
        return this.eventInteractions.removeIntegrations();
    }

    /**
     * Set the given property for the given device to the given value.
     * @param deviceSerial The serial of the device the property is to change.
     * @param name The name of the property.
     * @param value The value of the property.
     */
    public async setDeviceProperty(deviceSerial : string, name : string, value : unknown) : Promise<void>
    {
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
                station.setNotificationPerson(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationPet:
                station.setNotificationPet(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationAllOtherMotion:
                station.setNotificationAllOtherMotion(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationAllSound:
                station.setNotificationAllSound(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationCrying:
                station.setNotificationCrying(device, value as boolean);
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
                } else {
                    station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.HUMAN_DETECTION, value as boolean);
                }
                break;
            case PropertyName.DeviceMotionDetectionTypePet:
                station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.PET_DETECTION, value as boolean);
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
            default:
                if (!Object.values(PropertyName).includes(name as PropertyName))
                    throw new ReadOnlyPropertyError("Property is read only", { context: { device: deviceSerial, propertyName: name, propertyValue: value } });
                throw new InvalidPropertyError("Device has no writable property", { context: { device: deviceSerial, propertyName: name, propertyValue: value } });
        }
    }
}
