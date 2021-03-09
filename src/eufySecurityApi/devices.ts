import { HttpService } from './http';
import { FullDevice, DeviceType } from './http/http-response.models';
import { CommandType } from './p2p';

/**
 * Represents all the Devices in the account.
 */
export class Devices
{
    private httpService : HttpService;
    private resDevices !: FullDevice[];
    private devices : {[key:string]:Device} = {};

    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(httpService : HttpService)
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
            this.resDevices = await this.httpService.listDevices();
            var device : Device;

            if(this.resDevices != null && this.resDevices.length > 0)
            {
                for (var dev of this.resDevices)
                {
                    device = new Device(dev);
                    this.devices[device.getSerialNumber()] = device;
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
     * Returns all Devices.
     */
    public getDevices() : {[key: string]: Device} 
    {
        return this.devices;
    }
}

/**
 * Represents one Device object.
 */
export class Device
{
    private device_info : FullDevice;
    private batteryCharge = "";
    private batteryTemperature ="";

    /**
     * The constructor for the device.
     * @param device_info The device_info object with the data for the base.
     */
    constructor(device_info : FullDevice)
    {
        this.device_info = device_info;
        this.pullValues();
    }

    /**
     * Collect needed values from the params-array so that we need only iterate once trough it...
     */
    private pullValues() : void
    {
        for (var param of this.device_info.params)
        {
            switch (param.param_type)
            {
                case CommandType.CMD_GET_BATTERY:
                    this.batteryCharge = param.param_value;
                    break;
                case CommandType.CMD_GET_BATTERY_TEMP:
                    this.batteryTemperature = param.param_value;
                    break;
            }
        }
    }

    /**
     * Determines if the Device is a Camera.
     */
    public isCamera() : boolean
    {
        var type = this.device_info.device_type;
        if (type == DeviceType.CAMERA ||
            type == DeviceType.CAMERA2 ||
            type == DeviceType.CAMERA_E ||
            type == DeviceType.CAMERA2C ||
            type == DeviceType.CAMERA2C_PRO ||
            type == DeviceType.CAMERA2_PRO ||
            type == DeviceType.SOLO_CAMERA ||
            type == DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }

    /**
     * Determines if the Device has a battery.
     */
    public hasBattery() : boolean
    {
        var type = this.device_info.device_type;
        if (type == DeviceType.CAMERA ||
            type == DeviceType.CAMERA2 ||
            type == DeviceType.CAMERA_E ||
            type == DeviceType.CAMERA2C ||
            type == DeviceType.BATTERY_DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL_2 ||
            type == DeviceType.CAMERA2C_PRO ||
            type == DeviceType.CAMERA2_PRO ||
            type == DeviceType.SOLO_CAMERA ||
            type == DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }

    /**
     * Determines if the Device is a Sensor.
     */
    public isSensor(): boolean
    {
        var type = this.device_info.device_type;
        if (type == DeviceType.SENSOR ||
            type == DeviceType.MOTION_SENSOR)
            return true;
        return false;
    }

    /**
     * Determines if the Device is a Keypad.
     */
    public isKeyPad(): boolean
    {
        return DeviceType.KEYPAD == this.device_info.device_type;
    }

    /**
     * Determines if the Device is a Doorbell.
     */
    public isDoorbell(): boolean
    {
        var type = this.device_info.device_type;
        if (type == DeviceType.DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL_2)
            return true;
        return false;
    }

    /**
     * Determines if the Device is a Indoor Cam.
     */
    public isIndoorCamera(): boolean
    {
        var type = this.device_info.device_type;
        if (type == DeviceType.INDOOR_CAMERA ||
            type == DeviceType.INDOOR_CAMERA_1080 ||
            type == DeviceType.INDOOR_PT_CAMERA ||
            type == DeviceType.INDOOR_PT_CAMERA_1080)
            return true;
        return false;
    }

    /**
     * Determines if the Device is a Floodlight.
     */
    public isFloodLight(): boolean
    {
        return DeviceType.FLOODLIGHT == this.device_info.device_type;
    }

    /**
     * Determines if the Device is a Lock.
     */
    public isLock(): boolean
    {
        var type = this.device_info.device_type;
        return DeviceType.LOCK_BASIC == type || DeviceType.LOCK_ADVANCED == type || DeviceType.LOCK_BASIC_NO_FINGER == type || DeviceType.LOCK_ADVANCED_NO_FINGER == type;
    }

    /**
     * Get the id of the Device in the eufy system.
     */
    public getId() : number
    {
        return this.device_info.device_id;
    }

    /**
     * Get the serial number of the Device.
     */
    public getSerialNumber() : string
    {
        return this.device_info.device_sn;
    }

    /**
     * Get the model name of the Device.
     */
    public getModel() : string
    {
        return this.device_info.device_model;
    }

    /**
     * Get the device type of the Device.
     */
    public getDeviceType() : number
    {
        return this.device_info.device_type;
    }

    /**
     * Get the device type as string for the Device.
     */
    public getDeviceTypeString() : string
    {
        if(this.isCamera())
        {
            return "camera";
        }
        else if(this.isSensor())
        {
            return "sensor";
        }
        else if(this.isKeyPad())
        {
            return "keypad";
        }
        else if(this.isDoorbell())
        {
            return "doorbell";
        }
        else if(this.isIndoorCamera())
        {
            return "indoorcamera";
        }
        else if(this.isFloodLight())
        {
            return "floodlight";
        }
        else if (this.isLock())
        {
            return "lock";
        }
        else
        {
            return `unknown(${this.device_info.device_type})`;
        }
    }

    /**
     * Get the given name of the Device.
     */
    public getName() : string
    {
        return this.device_info.device_name;
    }

    /**
     * Get the hardware version of the Device.
     */
    public getHardwareVersion() : string
    {
        return this.device_info.main_hw_version;
    }

    /**
     * Get the software version of the Device.
     */
    public getSoftwareVersion() : string
    {
        return this.device_info.main_sw_version;
    }

    /**
     * Get the mac address of the Device.
     */
    public getMacAddress() : string
    {
        return this.device_info.wifi_mac;
    }

    /**
     * Get the serial number of the Base the Device is connected.
     */
    public getBaseSerialConnected() : string
    {
        return this.device_info.station_sn;
    }

    /**
     * Get the url to the last image (only for cameras).
     */
    public getLastImageUrl() : string
    {
        if(this.isCamera())
        {
            return this.device_info.cover_path;
        }
        else
        {
            return "n/a";
        }
    }

    /**
     * Get the time of the last image (only for cameras).
     */
    public getLastImageTime() : number
    {
        if(this.isCamera())
        {
            return this.device_info.cover_time;
        }
        else
        {
            return -1;
        }
    }

    /**
     * Get the url of the last video (only for cameras).
     */
    public getLastVideoUrl() : string
    {
        if(this.isCamera())
        {
            return "";
        }
        else
        {
            return "";
        }
    }

    /**
     * Get the battery charge in percent (only for battery eqipped devices).
     */
    public getBatteryCharge() : string
    {
        if(this.hasBattery())
        {
            return this.batteryCharge;
        }
        else
        {
            return "n/a";
        }
    }

    /**
     * Get the temperature of the battery (only for battery equipped devices).
     */
    public getBatteryTemperature() : string
    {
        if(this.hasBattery())
        {
            return this.batteryTemperature;
        }
        else
        {
            return "n/a";
        }
    }
}