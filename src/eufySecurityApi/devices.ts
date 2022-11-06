import { TypedEmitter } from "tiny-typed-emitter";
import { DeviceNotFoundError, ReadOnlyPropertyError } from "./error";
import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, IndoorCamera, FloodlightCamera, SoloCamera, PropertyName, RawValues, Keypad, EntrySensor, MotionSensor, Lock, UnknownDevice, BatteryDoorbellCamera, WiredDoorbellCamera, DeviceListResponse, DeviceType, NotificationType, SmartSafe, InvalidPropertyError, Station, HB3DetectionTypes } from './http';
import { EufySecurityEvents } from './interfaces';
import { P2PConnectionType, SmartSafeAlarm911Event, SmartSafeShakeAlarmEvent } from "./p2p";
import { parseValue } from "./utils";

/**
 * Represents all the Devices in the account.
 */
export class Devices extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private devices : { [deviceSerial : string] : any } = {};
    private lastVideoTimeForDevices : { [deviceSerial : string] : any } = {};
    private loadingDevices? : Promise<unknown>;
    private deviceSnoozeTimeout : {
        [dataType : string] : NodeJS.Timeout;
    } = {};

    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;

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
        const resDevices = devices;

        const deviceSNs: string[] = Object.keys(this.devices);
        const newDeviceSNs = Object.keys(devices);
        const promises: Array<Promise<Device>> = [];
        
        var deviceSerial : string;
        var device : Device;
        
        if(resDevices != null)
        {
            for (deviceSerial in resDevices)
            {
                if(this.devices[deviceSerial])
                {
                    device = this.devices[deviceSerial];
                    this.updateDevice(resDevices[deviceSerial]);
                }
                else
                {
                    let new_device : Promise<Device>;

                    if(Device.isIndoorCamera(resDevices[deviceSerial].device_type))
                    {
                        new_device = IndoorCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isSoloCameras(resDevices[deviceSerial].device_type))
                    {
                        new_device = SoloCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isBatteryDoorbell(resDevices[deviceSerial].device_type))
                    {
                        new_device = BatteryDoorbellCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isWiredDoorbell(resDevices[deviceSerial].device_type) || Device.isWiredDoorbellDual(resDevices[deviceSerial].device_type))
                    {
                        new_device = WiredDoorbellCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    } 
                    else if(Device.isFloodLight(resDevices[deviceSerial].device_type))
                    {
                        new_device = FloodlightCamera.initialize(this.httpService, resDevices[deviceSerial]);
                    }                        
                    else if(Device.isCamera(resDevices[deviceSerial].device_type))
                    {
                        new_device = Camera.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isLock(resDevices[deviceSerial].device_type))
                    {
                        new_device = Lock.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isMotionSensor(resDevices[deviceSerial].device_type))
                    {
                        new_device = MotionSensor.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isEntrySensor(resDevices[deviceSerial].device_type))
                    {
                        new_device = EntrySensor.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if(Device.isKeyPad(resDevices[deviceSerial].device_type))
                    {
                        new_device = Keypad.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else if (Device.isSmartSafe(resDevices[deviceSerial].device_type))
                    {
                        new_device = SmartSafe.initialize(this.httpService, resDevices[deviceSerial]);
                    }
                    else
                    {
                        new_device = UnknownDevice.initialize(this.httpService, resDevices[deviceSerial]);
                    }                        

                    promises.push(new_device.then((device: Device) => {
                        try
                        {
                            this.addEventListener(device, "PropertyChanged");
                            this.addEventListener(device, "RawPropertyChanged");
                            this.addEventListener(device, "CryingDetected");
                            this.addEventListener(device, "SoundDetected");
                            this.addEventListener(device, "PetDetected");
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

                            this.addDevice(device);
                        }
                        catch (error)
                        {
                            this.api.logError("Error", error);
                        }
                        return device;
                    }));
                }
            }

            this.loadingDevices = Promise.all(promises).then((devices) => {
                devices.forEach((device) => {
                    this.api.getStation(device.getStationSerial()).then((station: Station) => {
                        if (!station.isConnected())
                        {
                            station.setConnectionType(this.api.getConfig().getConnectionType());
                            station.connect();
                        }
                    }).catch((error) => {
                        this.api.logError("Error trying to connect to station afte device loaded", error);
                    });
                });
                this.loadingDevices = undefined;
            });

            for (const deviceSN of deviceSNs)
            {
                if (!newDeviceSNs.includes(deviceSN))
                {
                    this.getDevice(deviceSN).then((device: Device) => {
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
    private addDevice(device : Device) : void
    {
        const serial = device.getSerial()
        if (serial && !Object.keys(this.devices).includes(serial))
        {
            this.devices[serial] = device;
            this.lastVideoTimeForDevices[serial] = undefined;
            if(this.api.getApiUsePushService())
            {
                this.setLastVideoTimeFromCloud(serial);
            }
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
        const serial = device.getSerial()
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
        var stations = await this.api.getStations();
        for (var stationSerial in stations)
        {
            if (!stations[stationSerial].isConnected())
            {
                if(stations[stationSerial].getDeviceType() == DeviceType.STATION)
                {
                    stations[stationSerial].setConnectionType(this.api.getP2PConnectionType());
                }
                else
                {
                    stations[stationSerial].setConnectionType(P2PConnectionType.QUICKEST);
                }
                stations[stationSerial].connect();
            }
        }

        if (this.loadingDevices !== undefined)
        {
            await this.loadingDevices;
        }
        if (Object.keys(this.devices).includes(device.device_sn))
        {
            this.devices[device.device_sn].update(device, stations[device.station_sn] !== undefined && !stations[device.station_sn].isIntegratedDevice() && stations[device.station_sn].isConnected())
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
    public getDevices() : { [deviceSerial : string] : any } 
    {
        return this.devices;
    }

    /**
     * Get the device specified by serial number.
     * @param deviceSerial The serial of the device.
     * @returns The device as Device object.
     */
    public async getDevice(deviceSerial : string) : Promise<Device>
    {
        if (this.loadingDevices !== undefined)
        {
            await this.loadingDevices;
        }
        if (Object.keys(this.devices).includes(deviceSerial))
        {
            return this.devices[deviceSerial];
        }
        throw new DeviceNotFoundError(`Device with this serial ${deviceSerial} doesn't exists!`);
    }

    /**
     * Returns a device specified by station and channel.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @returns The device specified by base and channel.
     */
    public async getDeviceByStationAndChannel(baseSerial : string, channel : number) : Promise<Device>
    {
        if (this.loadingDevices !== undefined)
        {
            await this.loadingDevices;
        }
        for (const device of Object.values(this.devices))
        {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial))
            {
                return device;
            }
        }
        throw new DeviceNotFoundError(`No device with channel ${channel} found on station with serial number: ${baseSerial}!`);
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
        else if(device.isEntrySensor())
        {
            return "sensor";
        }
        else if(device.isKeyPad())
        {
            return "keypad";
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
        else if (device.isLock())
        {
            return "lock";
        }
        else
        {
            return `unknown(${device.getRawDevice().device_type})`;
        }
    }

    /**
     * Retrieve the model name of a given device.
     * @param device The device object.
     * @returns A string with the model name of the device.
     */
    public getDeviceModelName(device : Device) : string
    {
        switch (device.getModel().substring(0,5))
        {
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
                return "Video Smart Lock"
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
    public addEventListener(device : Device, eventListenerName : string) : void
    {
        switch (eventListenerName)
        {
            case "PropertyChanged":
                device.on("property changed", (device : Device, name : string, value : PropertyValue) => this.onPropertyChanged(device, name, value));
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
        }
    }

    /**
     * The action to be one when event PropertyChanged is fired.
     * @param device The device as Device object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    private async onPropertyChanged(device : Device, name : string, value : PropertyValue) : Promise<void>
    {
        //this.emit("device property changed", device, name, value);
        this.api.logDebug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value}`);
        try
        {
            this.emit("device property changed", device, name, value);
            if (name === PropertyName.DeviceRTSPStream && (value as boolean) === true && (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) === undefined || (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) !== undefined && (device.getPropertyValue(PropertyName.DeviceRTSPStreamUrl) as string) === "")))
            {
                this.api.getStation(device.getStationSerial()).then((station: Station) => {
                    station.setRTSPStream(device, true);
                }).catch((error) => {
                    this.api.logError(`Device property changed error (device: ${device.getSerial()} name: ${name}) - station enable rtsp (station: ${device.getStationSerial()})`, error);
                });
            }
            else if (name === PropertyName.DeviceRTSPStream && (value as boolean) === false)
            {
                device.setCustomPropertyValue(PropertyName.DeviceRTSPStreamUrl, "");
            }
        }
        catch (error)
        {
            this.api.logError(`Device property changed error (device: ${device.getSerial()} name: ${name})`, error);
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
        this.api.logInfo(`Event "CryingDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event SoundDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onSoundDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logInfo(`Event "SoundDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event PetDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onPetDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logInfo(`Event "PetDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onMotionDetected(device : Device, state : boolean) : Promise<void>
    {
        this.api.logInfo(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    private async onPersonDetected(device : Device, state : boolean, person : string) : Promise<void>
    {
        this.api.logInfo(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event Rings is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onRings(device : Device, state : boolean) : Promise<void>
    {
        this.api.logInfo(`Event "Rings": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event Locked is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onLocked(device : Device, state : boolean) : Promise<void>
    {
        this.api.logInfo(`Event "Locked": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event Open is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onOpen(device : Device, state : boolean) : Promise<void>
    {
        this.api.logInfo(`Event "Open": device: ${device.getSerial()} | state: ${state}`);
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
                }).catch((error) => {
                    this.api.logError(`Device ready error (device: ${device.getSerial()}) - station enable rtsp (station: ${device.getStationSerial()})`, error);
                });
            }
        }
        catch (error)
        {
            this.api.logError(`Device ready error (device: ${device.getSerial()})`, error);
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
     * Update the raw values for a given device.
     * @param deviceSerial The serial of the device.
     * @param values The raw values.
     */
    public updateDeviceProperties(deviceSerial : string, values : RawValues) : void
    {
        if(this.devices[deviceSerial] != undefined)
        {
            this.devices[deviceSerial].updateRawProperties(values);
        }
        else
        {
            this.api.logError(`Error on update device properties. Device ${deviceSerial} does not exists.`);
        }
    }

    /**
     * Retrieves the last video event for the given device.
     * @param deviceSerial The serial of the device.
     * @returns The time as timestamp or undefined.
     */
    private async getLastVideoTimeFromCloud(deviceSerial : string) : Promise <number | undefined>
    {
        var lastVideoTime = await this.httpService.getAllVideoEvents({deviceSN : deviceSerial}, 1);
        if(lastVideoTime !== undefined && lastVideoTime.length >= 1)
        {
            return lastVideoTime[0].create_time;
        }
        else
        {
            return undefined;
        }
    }

    /**
     * Set the last video time to the array.
     * @param deviceSerial The serial of the device.
     * @param time The time as timestamp or undefined.
     */
    private setLastVideoTime(deviceSerial : string, time : number | undefined, timestampType : string) : void
    {
        if(time !== undefined)
        {
            switch (timestampType)
            {
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
        else
        {
            this.lastVideoTimeForDevices[deviceSerial] = undefined;
        }

        this.api.updateCameraEventTimeSystemVariable(deviceSerial, this.lastVideoTimeForDevices[deviceSerial]);
    }

    /**
     * Helper function to retrieve the last event time from cloud and set the value to the array.
     * @param deviceSerial The serial of the device.
     */
    private async setLastVideoTimeFromCloud(deviceSerial : string) : Promise<void>
    {
        this.setLastVideoTime(deviceSerial, await this.getLastVideoTimeFromCloud(deviceSerial), "sec");
    }

    /**
     * Set the time for the last video to the current time.
     * @param deviceSerial The serial of the device.
     */
    private setLastVideoTimeNow(deviceSerial : string) : void
    {
        this.setLastVideoTime(deviceSerial, new Date().getTime(), "ms");
    }

    /**
     * Retrieve the last video time from the array.
     * @param deviceSerial The serial of the device.
     * @returns The timestamp as number or undefined.
     */
    public getLastVideoTime(deviceSerial : string) : number | undefined
    {
        return this.lastVideoTimeForDevices[deviceSerial];
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
                await station.enableDevice(device, value as boolean);
                break;
            case PropertyName.DeviceStatusLed:
                await station.setStatusLed(device, value as boolean);
                break;
            case PropertyName.DeviceAutoNightvision:
                await station.setAutoNightVision(device, value as boolean);
                break;
            case PropertyName.DeviceMotionDetection:
                await station.setMotionDetection(device, value as boolean);
                break;
            case PropertyName.DeviceSoundDetection:
                await station.setSoundDetection(device, value as boolean);
                break;
            case PropertyName.DevicePetDetection:
                await station.setPetDetection(device, value as boolean);
                break;
            case PropertyName.DeviceRTSPStream:
                await station.setRTSPStream(device, value as boolean);
                break;
            case PropertyName.DeviceAntitheftDetection:
                await station.setAntiTheftDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLocked:
                await station.lockDevice(device, value as boolean);
                break;
            case PropertyName.DeviceWatermark:
                await station.setWatermark(device, value as number);
                break;
            case PropertyName.DeviceLight:
                await station.switchLight(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsEnable:
                await station.setFloodlightLightSettingsEnable(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsBrightnessManual:
                await station.setFloodlightLightSettingsBrightnessManual(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsBrightnessMotion:
                await station.setFloodlightLightSettingsBrightnessMotion(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsBrightnessSchedule:
                await station.setFloodlightLightSettingsBrightnessSchedule(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionTriggered:
                await station.setFloodlightLightSettingsMotionTriggered(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsMotionTriggeredDistance:
                await station.setFloodlightLightSettingsMotionTriggeredDistance(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionTriggeredTimer:
                await station.setFloodlightLightSettingsMotionTriggeredTimer(device, value as number);
                break;
            case PropertyName.DeviceMicrophone:
                await station.setMicMute(device, value as boolean);
                break;
            case PropertyName.DeviceSpeaker:
                await station.enableSpeaker(device, value as boolean);
                break;
            case PropertyName.DeviceSpeakerVolume:
                await station.setSpeakerVolume(device, value as number);
                break;
            case PropertyName.DeviceAudioRecording:
                await station.setAudioRecording(device, value as boolean);
                break;
            case PropertyName.DevicePowerSource:
                await station.setPowerSource(device, value as number);
                break;
            case PropertyName.DevicePowerWorkingMode:
                await station.setPowerWorkingMode(device, value as number);
                break;
            case PropertyName.DeviceRecordingEndClipMotionStops:
                await station.setRecordingEndClipMotionStops(device, value as boolean);
                break;
            case PropertyName.DeviceRecordingClipLength:
                await station.setRecordingClipLength(device, value as number);
                break;
            case PropertyName.DeviceRecordingRetriggerInterval:
                await station.setRecordingRetriggerInterval(device, value as number);
                break;
            case PropertyName.DeviceVideoStreamingQuality:
                await station.setVideoStreamingQuality(device, value as number);
                break;
            case PropertyName.DeviceVideoRecordingQuality:
                await station.setVideoRecordingQuality(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivity:
                await station.setMotionDetectionSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionTracking:
                await station.setMotionTracking(device, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionType:
                await station.setMotionDetectionType(device, value as number);
                break;
            case PropertyName.DeviceMotionZone:
                await station.setMotionZone(device, value as string);
                break;
            case PropertyName.DeviceVideoWDR:
                await station.setWDR(device, value as boolean);
                break;
            case PropertyName.DeviceRingtoneVolume:
                await station.setRingtoneVolume(device, value as number);
                break;
            case PropertyName.DeviceChimeIndoor:
                await station.enableIndoorChime(device, value as boolean);
                break;
            case PropertyName.DeviceChimeHomebase:
                await station.enableHomebaseChime(device, value as boolean);
                break;
            case PropertyName.DeviceChimeHomebaseRingtoneVolume:
                await station.setHomebaseChimeRingtoneVolume(device, value as number);
                break;
            case PropertyName.DeviceChimeHomebaseRingtoneType:
                await station.setHomebaseChimeRingtoneType(device, value as number);
                break;
            case PropertyName.DeviceNotificationType:
                await station.setNotificationType(device, value as NotificationType);
                break;
            case PropertyName.DeviceNotificationPerson:
                await station.setNotificationPerson(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationPet:
                await station.setNotificationPet(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationAllOtherMotion:
                await station.setNotificationAllOtherMotion(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationAllSound:
                await station.setNotificationAllSound(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationCrying:
                await station.setNotificationCrying(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationMotion:
                await station.setNotificationMotion(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationRing:
                await station.setNotificationRing(device, value as boolean);
                break;
            case PropertyName.DeviceChirpVolume:
                await station.setChirpVolume(device, value as number);
                break;
            case PropertyName.DeviceChirpTone:
                await station.setChirpTone(device, value as number);
                break;
            case PropertyName.DeviceVideoHDR:
                await station.setHDR(device, value as boolean);
                break;
            case PropertyName.DeviceVideoDistortionCorrection:
                await station.setDistortionCorrection(device, value as boolean);
                break;
            case PropertyName.DeviceVideoRingRecord:
                await station.setRingRecord(device, value as number);
                break;
            case PropertyName.DeviceRotationSpeed:
                await station.setPanAndTiltRotationSpeed(device, value as number);
                break;
            case PropertyName.DeviceNightvision:
                await station.setNightVision(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRange:
                await station.setMotionDetectionRange(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeStandardSensitivity:
                await station.setMotionDetectionRangeStandardSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeAdvancedLeftSensitivity:
                await station.setMotionDetectionRangeAdvancedLeftSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeAdvancedMiddleSensitivity:
                await station.setMotionDetectionRangeAdvancedMiddleSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionRangeAdvancedRightSensitivity:
                await station.setMotionDetectionRangeAdvancedRightSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionTestMode:
                await station.setMotionDetectionTestMode(device, value as boolean);
                break;
            case PropertyName.DeviceMotionTrackingSensitivity:
                await station.setMotionTrackingSensitivity(device, value as number);
                break;
            case PropertyName.DeviceMotionAutoCruise:
                await station.setMotionAutoCruise(device, value as boolean);
                break;
            case PropertyName.DeviceMotionOutOfViewDetection:
                await station.setMotionOutOfViewDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLightSettingsColorTemperatureManual:
                await station.setLightSettingsColorTemperatureManual(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsColorTemperatureMotion:
                await station.setLightSettingsColorTemperatureMotion(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsColorTemperatureSchedule:
                await station.setLightSettingsColorTemperatureSchedule(device, value as number);
                break;
            case PropertyName.DeviceLightSettingsMotionActivationMode:
                await station.setLightSettingsMotionActivationMode(device, value as number);
                break;
            case PropertyName.DeviceVideoNightvisionImageAdjustment:
                await station.setVideoNightvisionImageAdjustment(device, value as boolean);
                break;
            case PropertyName.DeviceVideoColorNightvision:
                await station.setVideoColorNightvision(device, value as boolean);
                break;
            case PropertyName.DeviceAutoCalibration:
                await station.setAutoCalibration(device, value as boolean);
                break;
            case PropertyName.DeviceAutoLock:
                await station.setAutoLock(device, value as boolean);
                break
            case PropertyName.DeviceAutoLockSchedule:
                await station.setAutoLockSchedule(device, value as boolean);
                break
            case PropertyName.DeviceAutoLockScheduleStartTime:
                await station.setAutoLockScheduleStartTime(device, value as string);
                break
            case PropertyName.DeviceAutoLockScheduleEndTime:
                await station.setAutoLockScheduleEndTime(device, value as string);
                break
            case PropertyName.DeviceAutoLockTimer:
                await station.setAutoLockTimer(device, value as number);
                break
            case PropertyName.DeviceOneTouchLocking:
                await station.setOneTouchLocking(device, value as boolean);
                break
            case PropertyName.DeviceSound:
                await station.setSound(device, value as number);
                break;
            case PropertyName.DeviceNotification:
                await station.setNotification(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationLocked:
                await station.setNotificationLocked(device, value as boolean);
                break;
            case PropertyName.DeviceNotificationUnlocked:
                await station.setNotificationUnlocked(device, value as boolean);
                break;
            case PropertyName.DeviceScramblePasscode:
                await station.setScramblePasscode(device,value as boolean);
                break;
            case PropertyName.DeviceWrongTryProtection:
                await station.setWrongTryProtection(device, value as boolean);
                break;
            case PropertyName.DeviceWrongTryAttempts:
                await station.setWrongTryAttempts(device, value as number);
                break;
            case PropertyName.DeviceWrongTryLockdownTime:
                await station.setWrongTryLockdownTime(device, value as number);
                break;
            case PropertyName.DeviceLoiteringDetection:
                await station.setLoiteringDetection(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringDetectionRange:
                await station.setLoiteringDetectionRange(device, value as number);
                break;
            case PropertyName.DeviceLoiteringDetectionLength:
                await station.setLoiteringDetectionLength(device, value as number);
                break;
            case PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponse:
                await station.setLoiteringCustomResponseAutoVoiceResponse(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringCustomResponseHomeBaseNotification:
                await station.setLoiteringCustomResponseHomeBaseNotification(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringCustomResponsePhoneNotification:
                await station.setLoiteringCustomResponsePhoneNotification(device, value as boolean);
                break;
            case PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice:
                await station.setLoiteringCustomResponseAutoVoiceResponseVoice(device, value as number);
                break;
            case PropertyName.DeviceLoiteringCustomResponseTimeFrom:
                await station.setLoiteringCustomResponseTimeFrom(device, value as string);
                break;
            case PropertyName.DeviceLoiteringCustomResponseTimeTo:
                await station.setLoiteringCustomResponseTimeTo(device, value as string);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityMode:
                await station.setMotionDetectionSensitivityMode(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityStandard:
                await station.setMotionDetectionSensitivityStandard(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedA:
                await station.setMotionDetectionSensitivityAdvancedA(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedB:
                await station.setMotionDetectionSensitivityAdvancedB(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedC:
                await station.setMotionDetectionSensitivityAdvancedC(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedD:
                await station.setMotionDetectionSensitivityAdvancedD(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedE:
                await station.setMotionDetectionSensitivityAdvancedE(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedF:
                await station.setMotionDetectionSensitivityAdvancedF(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedG:
                await station.setMotionDetectionSensitivityAdvancedG(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionSensitivityAdvancedH:
                await station.setMotionDetectionSensitivityAdvancedH(device, value as number);
                break;
            case PropertyName.DeviceDeliveryGuard:
                await station.setDeliveryGuard(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuarding:
                await station.setDeliveryGuardPackageGuarding(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuardingVoiceResponseVoice:
                await station.setDeliveryGuardPackageGuardingVoiceResponseVoice(device, value as number);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeFrom:
                await station.setDeliveryGuardPackageGuardingActivatedTimeFrom(device, value as string);
                break;
            case PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeTo:
                await station.setDeliveryGuardPackageGuardingActivatedTimeTo(device, value as string);
                break;
            case PropertyName.DeviceDeliveryGuardUncollectedPackageAlert:
                await station.setDeliveryGuardUncollectedPackageAlert(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardPackageLiveCheckAssistance:
                await station.setDeliveryGuardPackageLiveCheckAssistance(device, value as boolean);
                break;
            case PropertyName.DeviceDualCamWatchViewMode:
                await station.setDualCamWatchViewMode(device, value as number);
                break;
            case PropertyName.DeviceRingAutoResponse:
                await station.setRingAutoResponse(device, value as boolean);
                break;
            case PropertyName.DeviceRingAutoResponseVoiceResponse:
                await station.setRingAutoResponseVoiceResponse(device, value as boolean);
                break;
            case PropertyName.DeviceRingAutoResponseVoiceResponseVoice:
                await station.setRingAutoResponseVoiceResponseVoice(device, value as number);
                break;
            case PropertyName.DeviceRingAutoResponseTimeFrom:
                await station.setRingAutoResponseTimeFrom(device, value as string);
                break;
            case PropertyName.DeviceRingAutoResponseTimeTo:
                await station.setRingAutoResponseTimeTo(device, value as string);
                break;
            case PropertyName.DeviceNotificationRadarDetector:
                await station.setNotificationRadarDetector(device, value as boolean);
                break;
            case PropertyName.DeviceSoundDetectionSensitivity:
                await station.setSoundDetectionSensitivity(device, value as number);
                break;
            case PropertyName.DeviceContinuousRecording:
                await station.setContinuousRecording(device, value as boolean);
                break;
            case PropertyName.DeviceContinuousRecordingType:
                await station.setContinuousRecordingType(device, value as number);
                break;
            case PropertyName.DeviceDefaultAngle:
                await station.enableDefaultAngle(device, value as boolean);
                break;
            case PropertyName.DeviceDefaultAngleIdleTime:
                await station.setDefaultAngleIdleTime(device, value as number);
                break;
            case PropertyName.DeviceNotificationIntervalTime:
                await station.setNotificationIntervalTime(device, value as number);
                break;
            case PropertyName.DeviceSoundDetectionRoundLook:
                await station.setSoundDetectionRoundLook(device, value as boolean);
                break;
            case PropertyName.DeviceDeliveryGuardUncollectedPackageAlertTimeToCheck:
                await station.setDeliveryGuardUncollectedPackageAlertTimeToCheck(device, value as string);
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
                await station.setSmartSafeParams(device, name, value as PropertyValue);
                break;
            case PropertyName.DeviceVideoTypeStoreToNAS:
                await station.setVideoTypeStoreToNAS(device, value as number);
                break;
            case PropertyName.DeviceMotionDetectionTypeHumanRecognition:
                await station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.HUMAN_RECOGNITION, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionTypeHuman:
                await station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.HUMAN_DETECTION, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionTypePet:
                await station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.PET_DETECTION, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionTypeVehicle:
                await station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.VEHICLE_DETECTION, value as boolean);
                break;
            case PropertyName.DeviceMotionDetectionTypeAllOtherMotions:
                await station.setMotionDetectionTypeHB3(device, HB3DetectionTypes.ALL_OTHER_MOTION, value as boolean);
                break;
            default:
                if (!Object.values(PropertyName).includes(name as PropertyName))
                {
                    throw new ReadOnlyPropertyError(`Property ${name} is read only`);
                }
                throw new InvalidPropertyError(`Device ${deviceSerial} has no writable property named ${name}`);
        }
    }
}
