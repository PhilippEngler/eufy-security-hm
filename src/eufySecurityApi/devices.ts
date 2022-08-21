import { TypedEmitter } from "tiny-typed-emitter";
import { DeviceNotFoundError } from "./error";
import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, CommonDevice, IndoorCamera, FloodlightCamera, SoloCamera, PropertyName, RawValues, Keypad, EntrySensor, MotionSensor, Lock, UnknownDevice, BatteryDoorbellCamera, WiredDoorbellCamera, DeviceListResponse, DeviceType, NotificationType, SmartSafe } from './http';
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
    private resDevices !: FullDevices;
    private devices : {[deviceSerial:string] : any} = {};
    private lastVideoTimeForDevices : {[deviceSerial:string] : any} = {};
    private loadingDevices?: Promise<unknown>;

    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;

        this.httpService.on("devices", (devices: FullDevices) => this.handleDevices(devices));
    }

    /**
     * Handle the devices so that they can be used by the addon.
     * @param devices The devices object with all devices.
     */
    private async handleDevices(devices: FullDevices): Promise<void>
    {
        this.resDevices = devices;
        
        var deviceSerial : string;
        var device : Device;
        
        if(this.resDevices != null)
        {
            for (deviceSerial in this.resDevices)
            {
                if(this.devices[deviceSerial])
                {
                    device = this.devices[deviceSerial];
                    this.updateDevice(this.resDevices[deviceSerial]);
                }
                else
                {
                    device = await CommonDevice.initialize(this.httpService, this.resDevices[deviceSerial]);
                    if(device.isCamera())
                    {
                        if(device.isFirstCamera() || device.isCameraE() || device.isCamera2() || device.isCamera2C() || device.isCamera2Pro() || device.isCamera2CPro())
                        {
                            device = await Camera.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isIndoorCamera())
                        {
                            device = await IndoorCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isFloodLight())
                        {
                            device = await FloodlightCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isBatteryDoorbell())
                        {
                            device = await BatteryDoorbellCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isWiredDoorbell())
                        {
                            device = await WiredDoorbellCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isSoloCameras())
                        {
                            device = await SoloCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                    }
                    else if(device.isKeyPad())
                    {
                        device = await Keypad.initialize(this.httpService, this.resDevices[deviceSerial]);
                    }
                    else if(device.isEntrySensor())
                    {
                        device = await EntrySensor.initialize(this.httpService, this.resDevices[deviceSerial]);
                    }
                    else if(device.isMotionSensor())
                    {
                        device = await MotionSensor.initialize(this.httpService, this.resDevices[deviceSerial]);
                    }
                    else if(device.isLock())
                    {
                        device = await Lock.initialize(this.httpService, this.resDevices[deviceSerial]);
                        //this.mqttService.subscribeLock(device.getSerial());
                    }
                    else if (device.isSmartSafe())
                    {
                        device = await SmartSafe.initialize(this.httpService, this.resDevices[deviceSerial]);
                    }
                    else
                    {
                        device = await UnknownDevice.initialize(this.httpService, this.resDevices[deviceSerial]);
                    }                        

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

                    this.devices[device.getSerial()] = device;
                    this.lastVideoTimeForDevices[device.getSerial()] = undefined;
                    if(this.api.getApiUsePushService() == true)
                    {
                        this.setLastVideoTimeFromCloud(device.getSerial());
                    }
                }
            }
        }
    }

    /**
     * Update the device information.
     * @param device The device object to update.
     */
    private async updateDevice(device: DeviceListResponse): Promise<void>
    {
        var bases = this.api.getBases().getBases();
        for (var baseSerial in bases)
        {
            if (!bases[baseSerial].isConnected())
            {
                if(bases[baseSerial].getDeviceType() == DeviceType.STATION)
                {
                    bases[baseSerial].setConnectionType(this.api.getP2PConnectionType());
                }
                else
                {
                    bases[baseSerial].setConnectionType(P2PConnectionType.QUICKEST);
                }
                bases[baseSerial].connect();
            }
        }

        if (Object.keys(this.devices).includes(device.device_sn))
        {
            this.devices[device.device_sn].update(device, bases[device.station_sn] !== undefined && !bases[device.station_sn].isIntegratedDevice() && bases[device.station_sn].isConnected())
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
            this.resDevices = this.httpService.getDevices();
            /*var deviceSerial : string;
            var device : Device;
            
            if(this.resDevices != null)
            {
                for (deviceSerial in this.resDevices)
                {
                    if(this.devices[deviceSerial])
                    {
                        device = this.devices[deviceSerial];
                        device.update(this.resDevices[deviceSerial]);
                    }
                    else
                    {
                        device = await CommonDevice.initialize(this.httpService, this.resDevices[deviceSerial]);
                        if(device.isCamera())
                        {
                            if(device.isFirstCamera() || device.isCameraE() || device.isCamera2() || device.isCamera2C() || device.isCamera2Pro() || device.isCamera2CPro())
                            {
                                device = await Camera.initialize(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(device.isIndoorCamera())
                            {
                                device = await IndoorCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(device.isFloodLight())
                            {
                                device = await FloodlightCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(device.isDoorbell())
                            {
                                device = await DoorbellCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(device.isSoloCameras())
                            {
                                device = await SoloCamera.initialize(this.httpService, this.resDevices[deviceSerial]);
                            }
                        }
                        else if(device.isKeyPad())
                        {
                            device = await Keypad.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isEntrySensor())
                        {
                            device = await EntrySensor.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isMotionSensor())
                        {
                            device = await MotionSensor.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else if(device.isLock())
                        {
                            device = await Lock.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }
                        else
                        {
                            device = await UnknownDevice.initialize(this.httpService, this.resDevices[deviceSerial]);
                        }                        

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

                        this.devices[device.getSerial()] = device;
                    }
                }
            }
            else
            {
                this.devices = {};
            }*/
        }
        catch (e : any)
        {
            this.devices = {};
            throw new Error(e);
        }
    }

    /**
     * Close all P2P connection for all devices.
     */
    public closeP2PConnections() : void
    {
        if(this.resDevices != null)
        {
            for (var deviceSerial in this.resDevices)
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
            }
        }
    }

    /**
     * Returns all Devices.
     */
    public getDevices() : {[deviceSerial: string]: any} 
    {
        return this.devices;
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
    private async onPropertyChanged(device : Device, name : string, value : PropertyValue): Promise<void>
    {
        //this.emit("device property changed", device, name, value);
        this.api.logDebug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value}`);
    }
    
    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param device The device as Device object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    private async onRawPropertyChanged(device : Device, type : number, value : string): Promise<void>
    {
        //this.emit("device raw property changed", device, type, value, modified);
        this.api.logDebug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value}`);
    }

    /**
     * The action to be one when event CryingDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onCryingDetected(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo(`Event "CryingDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event SoundDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onSoundDetected(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo(`Event "SoundDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event PetDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onPetDetected(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo(`Event "PetDetected": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onMotionDetected(device : Device, state : boolean): Promise<void>
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
    private async onPersonDetected(device : Device, state : boolean, person : string): Promise<void>
    {
        this.api.logInfo(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event Rings is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onRings(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo(`Event "Rings": device: ${device.getSerial()} | state: ${state}`);
        this.setLastVideoTimeNow(device.getSerial());
    }

    /**
     * The action to be one when event Locked is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onLocked(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo(`Event "Locked": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event Open is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onOpen(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo(`Event "Open": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event Ready is fired.
     * @param device The device as Device object.
     */
    private async onReady(device : Device): Promise<void>
    {
        this.api.logInfo(`Event "Ready": device: ${device.getSerial()}`);
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
     * Returns a device specified by station and channel.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @returns The device specified by base and channel.
     */
    public getDeviceByStationAndChannel(baseSerial : string, channel : number) : Device
    {
        for (const device of Object.values(this.devices))
        {
            if ((device.getStationSerial() === baseSerial && device.getChannel() === channel) || (device.getStationSerial() === baseSerial && device.getSerial() === baseSerial))
            {
                return device;
            }
        }
        this.api.logError(`No device with channel ${channel} found on station with serial number: ${baseSerial}.`);
        throw new Error("Error");
    }

    /**
     * Update the battery and temperature information for a given device.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @param batteryLevel The battery level value.
     * @param temperature The temperature value.
     */
    public updateBatteryValues(baseSerial: string, channel: number, batteryLevel: number, temperature: number) : void
    {
        try
        {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataBattery = device.getPropertyMetadata(PropertyName.DeviceBattery);
            if (metadataBattery !== undefined)
            {
                device.updateRawProperty(metadataBattery.key as number, batteryLevel.toString());
            }
            const metadataBatteryTemperature = device.getPropertyMetadata(PropertyName.DeviceBatteryTemp);
            if (metadataBatteryTemperature !== undefined)
            {
                device.updateRawProperty(metadataBatteryTemperature.key as number, temperature.toString());
            }
        }
        catch (error)
        {
            this.api.logError(`Station runtime state error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }

    /**
     * Update the charge state and battery value information for a given device.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @param chargeType The charge state.
     * @param batteryLevel The battery level value.
     */
    public updateChargingState(baseSerial: string, channel: number, chargeType: number, batteryLevel: number) : void
    {
        try
        {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataBattery = device.getPropertyMetadata(PropertyName.DeviceBattery);
            if (metadataBattery !== undefined)
            {
                device.updateRawProperty(metadataBattery.key as number, batteryLevel.toString());
            }
            const metadataChargingStatus = device.getPropertyMetadata(PropertyName.DeviceChargingStatus);
            if (metadataChargingStatus !== undefined)
            {
                device.updateRawProperty(metadataChargingStatus.key as number, chargeType.toString());
            }
        }
        catch (error)
        {
            this.api.logError(`Station charging state error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }

    /**
     * Update the wifi rssi value information for a given device.
     * @param baseSerial The serial of the base.
     * @param channel The channel to specify the device.
     * @param rssi The rssi value.
     */
    public updateWifiRssi(baseSerial : string, channel: number, rssi: number) : void
    {
        try
        {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataWifiRssi = device.getPropertyMetadata(PropertyName.DeviceWifiRSSI);
            if (metadataWifiRssi !== undefined)
            {
                device.updateRawProperty(metadataWifiRssi.key as number, rssi.toString());
            }
        }
        catch (error)
        {
            this.api.logError(`Station wifi rssi error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }

    /**
     * Update the raw values for a given device.
     * @param deviceSerial The serial of the device.
     * @param values The raw values.
     */
    public updateDeviceProperties(deviceSerial: string, values: RawValues): void
    {
        this.devices[deviceSerial].updateRawProperties(values);
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
        const station = this.api.getBases().getBases()[device.getStationSerial()];
        const metadata = device.getPropertyMetadata(name);

        value = parseValue(metadata, value);

        switch (name)
        {
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
            case PropertyName.DeviceLockSettingsAutoLock:
            case PropertyName.DeviceLockSettingsAutoLockSchedule:
            case PropertyName.DeviceLockSettingsAutoLockScheduleStartTime:
            case PropertyName.DeviceLockSettingsAutoLockScheduleEndTime:
            case PropertyName.DeviceLockSettingsAutoLockTimer:
            case PropertyName.DeviceLockSettingsOneTouchLocking:
            case PropertyName.DeviceLockSettingsSound:
                await station.setAdvancedLockParams(device, name, value as PropertyValue);
                break;
            case PropertyName.DeviceLockSettingsNotification:
                await station.setAdvancedLockParams(device, PropertyName.DeviceLockSettingsNotification, value as PropertyValue);
                break;
            case PropertyName.DeviceLockSettingsNotificationLocked:
                await station.setAdvancedLockParams(device, PropertyName.DeviceLockSettingsNotificationLocked, value as PropertyValue);
                break;
            case PropertyName.DeviceLockSettingsNotificationUnlocked:
                await station.setAdvancedLockParams(device, PropertyName.DeviceLockSettingsNotificationUnlocked, value as PropertyValue);
                break;
            case PropertyName.DeviceLockSettingsScramblePasscode:
                await station.setScramblePasscode(device,value as boolean);
                break;
            case PropertyName.DeviceLockSettingsWrongTryProtection:
                await station.setWrongTryProtection(device, value as boolean);
                break;
            case PropertyName.DeviceLockSettingsWrongTryAttempts:
                await station.setWrongTryAttempts(device, value as number);
                break;
            case PropertyName.DeviceLockSettingsWrongTryLockdownTime:
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
            default:
                if (!Object.values(PropertyName).includes(name as PropertyName))
                {
                    return;
                    //throw new ReadOnlyPropertyError(`Property ${name} is read only`);
                }
                return;
                //throw new InvalidPropertyError(`Device ${deviceSN} has no writable property named ${name}`);
        }
    }
}
