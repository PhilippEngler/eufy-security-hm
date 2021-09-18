import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, CommonDevice, IndoorCamera, FloodlightCamera, DoorbellCamera, SoloCamera, PropertyName, RawValues } from './http';
import { EufySecurityEvents } from './interfaces';

/**
 * Represents all the Devices in the account.
 */
export class Devices extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private resDevices !: FullDevices;
    private devices : {[deviceSerial:string] : any} = {};

    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;
    }

    /**
     * (Re)Loads all Devices and the settings of them.
     */
    public async loadDevices() : Promise<void>
    {
        try
        {
            await this.httpService.updateDeviceInfo();
            this.resDevices = this.httpService.getDevices();
            var deviceSerial : string;
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
                        device = new CommonDevice(this.httpService, this.resDevices[deviceSerial]);
                        if(device.isCamera())
                        {
                            if(!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new Camera(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new IndoorCamera(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(!device.isIndoorCamera() && device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new FloodlightCamera(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(!device.isIndoorCamera() && !device.isFloodLight() && device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new DoorbellCamera(this.httpService, this.resDevices[deviceSerial]);
                            }
                            else if(!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && device.isSoloCameras())
                            {
                                device = new SoloCamera(this.httpService, this.resDevices[deviceSerial]);
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
            else
            {
                this.devices = {};
            }
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
                this.api.logDebug(`Listener 'PropertyChanged' for device ${device.getSerial()} added. Total ${device.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                device.on("raw property changed", (device : Device, type : number, value : string, modified : number) => this.onRawPropertyChanged(device, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for device ${device.getSerial()} added. Total ${device.listenerCount("raw property changed")} Listener.`);
                break;
            case "MotionDetected":
                device.on("motion detected", (device : Device, state : boolean) => this.onMotionDetected(device, state));
                this.api.logDebug(`Listener 'MotionDetected' for device ${device.getSerial()} added. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device : Device, state : boolean, person : string) => this.onPersonDetected(device, state, person));
                this.api.logDebug(`Listener 'PersonDetected' for device ${device.getSerial()} added. Total ${device.listenerCount("person detected")} Listener.`);
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
    private async onPropertyChanged(device : Device, name : string, value : PropertyValue): Promise<void>
    {
        //this.emit("device property changed", device, name, value);
        this.api.logDebug(`Event "PropertyChanged": device: ${device.getSerial()} | name: ${name} | value: ${value.value}`);
    }

    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param device The device as Device object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     * @param modified The timestamp of the last change.
     */
    private async onRawPropertyChanged(device : Device, type : number, value : string, modified : number): Promise<void>
    {
        //this.emit("device raw property changed", device, type, value, modified);
        this.api.logDebug(`Event "RawPropertyChanged": device: ${device.getSerial()} | type: ${type} | value: ${value} | modified: ${modified}`);
    }

    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onMotionDetected(device : Device, state : boolean): Promise<void>
    {
        this.api.logDebug(`Event "MotionDetected": device: ${device.getSerial()} | state: ${state}`);
    }

    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    private async onPersonDetected(device : Device, state : boolean, person : string): Promise<void>
    {
        this.api.logDebug(`Event "PersonDetected": device: ${device.getSerial()} | state: ${state} | person: ${person}`);
    }

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

    public updateBatteryValues(baseSerial: string, channel: number, batteryLevel: number, temperature: number, modified: number) : void
    {
        try
        {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataBattery = device.getPropertyMetadata(PropertyName.DeviceBattery);
            if (metadataBattery !== undefined)
            {
                device.updateRawProperty(metadataBattery.key as number, { value: batteryLevel.toString(), timestamp: modified});
            }
            const metadataBatteryTemperature = device.getPropertyMetadata(PropertyName.DeviceBatteryTemp);
            if (metadataBatteryTemperature !== undefined)
            {
                device.updateRawProperty(metadataBatteryTemperature.key as number, { value: temperature.toString(), timestamp: modified});
            }
        }
        catch (error)
        {
            this.api.logError(`Station runtime state error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }

    public updateChargingState(baseSerial: string, channel: number, chargeType: number, batteryLevel: number, modified: number) : void
    {
        try
        {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataBattery = device.getPropertyMetadata(PropertyName.DeviceBattery);
            if (metadataBattery !== undefined)
            {
                device.updateRawProperty(metadataBattery.key as number, { value: batteryLevel.toString(), timestamp: modified});
            }
            const metadataChargingStatus = device.getPropertyMetadata(PropertyName.DeviceChargingStatus);
            if (metadataChargingStatus !== undefined)
            {
                device.updateRawProperty(metadataChargingStatus.key as number, { value: chargeType.toString(), timestamp: modified});
            }
        }
        catch (error)
        {
            this.api.logError(`Station charging state error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }

    public updateWifiRssi(baseSerial : string, channel: number, rssi: number, modified: number) : void
    {
        try
        {
            const device = this.getDeviceByStationAndChannel(baseSerial, channel);
            const metadataWifiRssi = device.getPropertyMetadata(PropertyName.DeviceWifiRSSI);
            if (metadataWifiRssi !== undefined)
            {
                device.updateRawProperty(metadataWifiRssi.key as number, { value: rssi.toString(), timestamp: modified});
            }
        }
        catch (error)
        {
            this.api.logError(`Station wifi rssi error (station: ${baseSerial} channel: ${channel})`, error);
        }
    }

    public updateDeviceProperties(deviceSerial: string, values: RawValues): void
    {
        this.devices[deviceSerial].updateRawProperties(values);
    }
}