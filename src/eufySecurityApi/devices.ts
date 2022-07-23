import { TypedEmitter } from "tiny-typed-emitter";
import { DeviceNotFoundError } from "./error";
import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, CommonDevice, IndoorCamera, FloodlightCamera, SoloCamera, PropertyName, RawValues, Keypad, EntrySensor, MotionSensor, Lock, UnknownDevice, BatteryDoorbellCamera, WiredDoorbellCamera, DeviceListResponse, DeviceType, EventFilterType, EventRecordResponse } from './http';
import { EufySecurityEvents } from './interfaces';
import { P2PConnectionType } from "./p2p";

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
    private async handleDevices(devices: FullDevices): Promise<void> {
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
                    this.lastVideoTimeForDevices[device.getSerial()] = undefined;
                    this.setLastVideoTime(device.getSerial(), await this.getLastVideoTimeFromCloud(device.getSerial()));
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

    private setLastVideoTime(deviceSerial : string, time : number | undefined) : void
    {
        if(time !== undefined)
        {
            this.lastVideoTimeForDevices[deviceSerial] = time;
        }
        else
        {
            this.lastVideoTimeForDevices[deviceSerial] = undefined;
        }
    }

    private setLastVideoTimeNow(deviceSerial : string) : void
    {
        this.lastVideoTimeForDevices[deviceSerial] = new Date().getTime();
    }

    public getLastVideoTime(deviceSerial : string) : number | undefined
    {
        return this.lastVideoTimeForDevices[deviceSerial];
    }
}
