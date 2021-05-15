import { HTTPApi, FullDevices, Device, Camera, CommonDevice } from './http';

/**
 * Represents all the Devices in the account.
 */
export class Devices
{
    private httpService : HTTPApi;
    private resDevices !: FullDevices;
    private devices : {[key:string] : any} = {};

    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(httpService : HTTPApi)
    {
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
                        this.devices[key].update(this.resDevices[key], true);
                    }
                    else
                    {
                        device = new CommonDevice(this.httpService, this.resDevices[key]);
                        if(device.isCamera())
                        {
                            if(!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras())
                            {
                                device = new Camera(this.httpService, this.resDevices[key]);
                                this.devices[device.getSerial()] = device;
                            }
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
}