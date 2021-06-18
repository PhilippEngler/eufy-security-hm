import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, PropertyValue, FullDevices, Device, Camera, CommonDevice, IndoorCamera, FloodlightCamera, DoorbellCamera, SoloCamera } from './http';
import { EufySecurityEvents } from './interfaces';

/**
 * Represents all the Devices in the account.
 */
export class Devices extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private resDevices !: FullDevices;
    private devices : {[key:string] : any} = {};

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
            var key : string;
            var device : Device;
            
            if(this.resDevices != null)
            {
                for (key in this.resDevices)
                {
                    if(this.devices[key])
                    {
                        device = this.devices[key];
                        device.update(this.resDevices[key]);
                    }
                    else
                    {
                        device = new CommonDevice(this.httpService, this.resDevices[key]);
                        if(device.isCamera())
                        {
                            if(!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new Camera(this.httpService, this.resDevices[key]);
                            }
                            else if(device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new IndoorCamera(this.httpService, this.resDevices[key]);
                            }
                            else if(!device.isIndoorCamera() && device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new FloodlightCamera(this.httpService, this.resDevices[key]);
                            }
                            else if(!device.isIndoorCamera() && !device.isFloodLight() && device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new DoorbellCamera(this.httpService, this.resDevices[key]);
                            }
                            else if(!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && device.isSoloCameras())
                            {
                                device = new SoloCamera(this.httpService, this.resDevices[key]);
                            }

                            /*this.addEventListener(device, "PropertyChanged");
                            this.addEventListener(device, "RawPropertyChanged");
                            this.addEventListener(device, "MotionDetected");
                            this.addEventListener(device, "PersonDetected");*/

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
        catch (e)
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
        return;
    }

    /**
     * Returns all Devices.
     */
    public getDevices() : {[key: string]: any} 
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
                this.api.logDebug(`Listener 'MotionDetected' for device ${device.getSerial()} removed. Total ${device.listenerCount("motion detected")} Listener.`);
                break;
            case "PersonDetected":
                device.on("person detected", (device : Device, state : boolean, person : string) => this.onPersonDetected(device, state, person));
                this.api.logDebug(`Listener 'PersonDetected' for device ${device.getSerial()} removed. Total ${device.listenerCount("person detected")} Listener.`);
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
        //this.emit("station guard mode", station, guardMode, currentMode);
        this.api.logDebug("Device serial: " + device.getSerial() + " ::: Name: " + name + " ::: Value: " + value.value);
        /*if(name == "pictureUrl")
        {
            await this.api.getLibrary();
        }*/
        //await this.api.getGuardModeBase(station.getSerial());
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
        this.api.logInfo("Device serial: " + device.getSerial() + " ::: Type: " + type + " ::: Value: " + value + " ::: Modified: " + modified);
    }

    /**
     * The action to be one when event MotionDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     */
    private async onMotionDetected(device : Device, state : boolean): Promise<void>
    {
        this.api.logInfo("Device serial: " + device.getSerial() + " ::: State: " + state);
    }

    /**
     * The action to be one when event PersonDetected is fired.
     * @param device The device as Device object.
     * @param state The new state.
     * @param person The person detected.
     */
    private async onPersonDetected(device : Device, state : boolean, person : string): Promise<void>
    {
        //this.emit("station guard mode", station, guardMode, currentMode);
        this.api.logInfo("Device serial: " + device.getSerial() + " ::: State: " + state + " ::: Person: " + person);
        //await this.api.getGuardModeBase(station.getSerial());
    }
}