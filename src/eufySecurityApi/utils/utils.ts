import { Devices } from "../devices";
import { Device, DeviceEvents, DeviceType, GuardMode, HTTPApi, HTTPApiEvents, Station, StationEvents } from "../http";
import { Logger } from "../logging";
import { Stations } from "../stations";

export const pathToNodeJs = "/usr/local/addons/eufySecurity/bin/nodejs/bin";
export const pathToTemp = "/var/tmp/eufySecurity";
export const pathToLogFiles = "/var/log/";

/**
 * Retrieve the model name of a given station or device.
 * @param modelNumber The model number of the station or device.
 * @returns A string with the model name of the station or device.
 */
export const getModelName = function(modelNumber: string): string {
    switch (modelNumber.substring(0,5)) {
        //HomeBases
        case "T8001":
            return "HomeBase";
        case "T8002":
            return "HomeBase E";
        case "T8010":
            return "HomeBase 2";
        case "T8023":
            return "MiniBase Chime";
        case "T8030":
            return "HomeBase 3";
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
        case "T8600":
            return "eufyCam E330 (Professional)";
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
        case "T8416":
            return "IndoorCam S350";
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
        case "T8134":
            return "SoloCam S220";
        case "T8170":
            return "SoloCam S340";
        case "T8B00":
            return "SoloCam C210";
        //StarlightCams
        case "T8150":
        case "T8151":
        case "T8152":
        case "T8153":
            return "4G Starlight Camera";
        case "T86P2":
            return "4G LTE Camera (4K)";
        //OutdoorCams
        case "T8441":
            return "OutdoorCam Pro";
        case "T8442":
            return "OutdoorCam";
        //Wired Doorbells
        case "T8200":
            return "Video Doorbell 2K";
        case "T8201":
            return "Video Doorbell 1080p";
        case "T8202":
            return "Video Doorbell 2K Pro";
        case "T8203":
            return "Video Doorbell Dual 2K";
        //Battery Doorbells
        case "T8210":
            return "Video Doorbell 2K";
        case "T8212":
            return "Video Doorbell 2C";
        case "T8213":
            return "Video Doorbell Dual 2K";
        case "T8214":
            return "Video Doorbell Dual E340";
        case "T8220":
            return "Video Doorbell 1080p Slim";
        case "T8221":
            return "Video Doorbell 2E";
        case "T8222":
            return "Video Doorbell 1080p";
        //Floodlight
        case "T8420":
            return "FloodlightCam 1080p";
        case "T8422":
            return "FloodlightCam E 2k";
        case "T8423":
            return "FloodlightCam 2 Pro";
        case "T8424":
            return "FloodlightCam 2k";
        case "T8425":
            return "Floodlight Cam E340";
        //WallLightCam
        case "T84A0":
            return "Solar WallLightCam S120";
        case "T84A1":
            return "WallLightCam S100";
        //GarageCams
        case "T8452":
            return "Garage-Control Cam";
        case "T8453":
            return "Garage-Control Cam Plus";
        //Lock
        case "T8500":
            return "Smart Lock Front Door";
        case "T8501":
            return "Solo Smart Lock D20";
        case "T8503":
            return "Smart Lock R10";
        case "T8592":
            return "Smart Lock R20";
        case "T8519":
            return "Smart Lock Touch";
        case "T8520":
            return "Smart Lock Touch und Wi-Fi";
        case "T8530":
            return "Video Smart Lock S330";
        case "T8531":
            return "Video Smart Lock E330";
        //Bridges
        case "T8021":
            return "Wi-Fi Bridge und Doorbell Chime";
        //Keypad
        case "T8960":
            return "Keypad";
        //Sensor
        case "T8900":
            return "Entry Sensor";
        case "T8910":
            return "Motion Sensor";
        default:
            return "unknown";
    }
}

/**
 * Returns a string with the type of the device.
 * @param device The device.
 * @returns A string with the type of the device.
 */
export const getDeviceTypeAsString = function(device: Device): string {
    if(device.isCamera1Product() || device.isCamera2Product() || device.isCamera3Product()) {
        return "camera";
    } else if(device.isDoorbell()) {
        return "doorbell";
    } else if(device.isIndoorCamera()) {
        return "indoorcamera";
    } else if(device.isSoloCameras()) {
        return "solocamera";
    } else if(device.isFloodLight()) {
        return "floodlight";
    } else if(device.isWallLightCam()) {
        return "walllightcamera";
    } else if(device.isGarageCamera()) {
        return "garagecamera";
    } else if(device.isStarlight4GLTE()) {
        return "starlight4glte"
    } else if(device.isLock()) {
        return "lock";
    } else if(device.isEntrySensor() || device.isMotionSensor()) {
        return "sensor";
    } else if(device.isKeyPad()) {
        return "keypad";
    } else {
        return `unknown(${device.getRawDevice().device_type})`;
    }
}

/**
 * Returns a string with the type of the station.
 * @param station The station.
 * @returns A string with the type of the station.
 */
export const getStationTypeString = function(station: Station): string {
    switch (station.getDeviceType()) {
        case DeviceType.STATION:
        case DeviceType.HB3:
        case DeviceType.MINIBASE_CHIME:
            return `station`;
        case DeviceType.DOORBELL:
        case DeviceType.DOORBELL_SOLO:
        case DeviceType.BATTERY_DOORBELL:
        case DeviceType.BATTERY_DOORBELL_2:
        case DeviceType.BATTERY_DOORBELL_PLUS:
        case DeviceType.BATTERY_DOORBELL_PLUS_E340:
            return `doorbell`;
        case DeviceType.INDOOR_CAMERA:
        case DeviceType.INDOOR_CAMERA_1080:
        case DeviceType.INDOOR_COST_DOWN_CAMERA:
        case DeviceType.INDOOR_OUTDOOR_CAMERA_1080P:
        case DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT:
        case DeviceType.INDOOR_OUTDOOR_CAMERA_2K:
        case DeviceType.INDOOR_PT_CAMERA:
        case DeviceType.INDOOR_PT_CAMERA_1080:
        case DeviceType.INDOOR_PT_CAMERA_S350:
            return `indoorcamera`;
        case DeviceType.SOLO_CAMERA:
        case DeviceType.SOLO_CAMERA_PRO:
        case DeviceType.SOLO_CAMERA_SPOTLIGHT_1080:
        case DeviceType.SOLO_CAMERA_SPOTLIGHT_2K:
        case DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR:
        case DeviceType.SOLO_CAMERA_SOLAR:
        case DeviceType.SOLO_CAMERA_C210:
        case DeviceType.OUTDOOR_PT_CAMERA:
            return `solocamera`;
        case DeviceType.FLOODLIGHT:
        case DeviceType.FLOODLIGHT_CAMERA_8422:
        case DeviceType.FLOODLIGHT_CAMERA_8423:
        case DeviceType.FLOODLIGHT_CAMERA_8424:
        case DeviceType.FLOODLIGHT_CAMERA_8425:
            return `floodlight`;
        case DeviceType.WALL_LIGHT_CAM:
        case DeviceType.WALL_LIGHT_CAM_81A0:
            return "walllightcam";
        case DeviceType.CAMERA_GARAGE_T8452:
        case DeviceType.CAMERA_GARAGE_T8453:
        case DeviceType.CAMERA_GARAGE_T8453_COMMON:
            return "garagecamera";
        case DeviceType.CAMERA_FG:
            return "starlight4glte";
        case DeviceType.LOCK_8503:
        case DeviceType.LOCK_8504:
        case DeviceType.LOCK_8530:
        case DeviceType.LOCK_8592:
        case DeviceType.LOCK_85A3:
        case DeviceType.LOCK_BLE:
        case DeviceType.LOCK_BLE_NO_FINGER:
        case DeviceType.LOCK_WIFI:
        case DeviceType.LOCK_WIFI_NO_FINGER:
        case DeviceType.LOCK_8502:
        case DeviceType.LOCK_8506:
            return `lock`;
        default:
            return `unknown(${station.getDeviceType()})`;
    }
}

/**
 * Converts the given timestamp to the german dd.mm.yyyy hh:mm string.
 * @param timestamp The timestamp as number.
 */
export const makeDateTimeString = function(timestamp: number): string {
    const dateTime = new Date(timestamp);
    return (`${dateTime.getDate().toString().padStart(2,"0")}.${(dateTime.getMonth()+1).toString().padStart(2,"0")}.${dateTime.getFullYear().toString()} ${dateTime.getHours().toString().padStart(2,"0")}:${dateTime.getMinutes().toString().padStart(2,"0")}`);
}

/**
 * Recalculate the timestamp to get a timestamp in milliseconds.
 * @param timeStamp The value as timestamp.
 * @param timeStampType The timestamp type.
 * @returns The timestamp in milliseconds.
 */
export const convertTimeStampToTimeStampMs = function(timeStamp: number, timeStampType: string): number | undefined {
    switch (timeStampType) {
        case "sec":
            return timeStamp * 1000;
        case "ms":
            return timeStamp;
        default:
            return undefined;
    }
}

/**
 * Extracts the string enclosed between the given startString and the given endString.
 * @param data The string where the string should be extracted.
 * @param startString The string after that the result is expected.
 * @param endString The string before the result is expected.
 * @returns The string.
 */
export const extractEnclosedString = function(data: string, startString: string, endString: string, logger?: Logger): string {
    if(logger !== undefined) {
        logger.debug(JSON.stringify({"data": data, "start": startString, "end": endString}));
    }
    return data.substring(data.indexOf(startString) + startString.length, data.indexOf(endString));
}

/**
 * Wait for a given station event.
 * @param station The station.
 * @param eventName The event name.
 * @param timeout The timeout in ms.
 * @param guardMode The guardmode.
 * @returns true if event occurs, otherwise false.
 */
export function waitForStationEvent(station: Station, eventName: keyof StationEvents, timeout: number, guardMode?: GuardMode, stations?: Stations, propertyName?: string, propertyValue?: unknown): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let timer: NodeJS.Timeout;
        const funcListener = (): void => listener();

        function listener(): void {
            station.removeListener(eventName, funcListener);
            clearTimeout(timer);
            resolve(true);
        }

        station.addListener(eventName, funcListener);
        timer = setTimeout(() => {
            station.removeListener(eventName, funcListener);
            reject(false);
        }, timeout);
        try {
            switch (eventName) {
                case "connect":
                    await station.connect();
                    break;
                case "close":
                    station.close();
                    break;
                case "guard mode":
                    if (guardMode !== undefined) {
                        station.setGuardMode(guardMode);
                    }
                    break;
                case "property changed":
                    if (stations !== undefined && propertyName !== undefined && propertyValue !== undefined) {
                        await stations.setStationProperty(station.getSerial(), propertyName, propertyValue);
                    } else {
                        throw new Error(`Failed to set property for station ${station.getSerial()}. ${JSON.stringify({"stations": stations !== undefined ? true : false, "propertyName": propertyName, "propertyValue": propertyValue})}`);
                    }
                    break;
            }
        } catch (e: any) {
            station.removeListener(eventName, funcListener);
            reject(e);
        }
    });
}

/**
 * Wait for a given device event.
 * @param devices The devices object.
 * @param device The device.
 * @param eventName The event name.
 * @param timeout The timeout in ms.
 * @param propertyName The name of the property to set.
 * @param propertyValue The value of the property to set.
 * @returns true if event occurs, otherwise false.
 */
export function waitForDeviceEvent(device: Device, eventName: keyof DeviceEvents, timeout: number, devices?: Devices, propertyName?: string, propertyValue?: unknown): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let timer: NodeJS.Timeout;
        const funcListener = (): void => listener();

        function listener(): void {
            device.removeListener(eventName, funcListener);
            clearTimeout(timer);
            resolve(true);
        }

        device.addListener(eventName, funcListener);
        timer = setTimeout(() => {
            device.removeListener(eventName, funcListener);
            reject(false);
        }, timeout);
        try {
            switch (eventName) {
                case "property changed":
                    if (devices !== undefined && propertyName !== undefined && propertyValue !== undefined) {
                        await devices.setDeviceProperty(device.getSerial(), propertyName, propertyValue);
                    } else {
                        throw new Error(`Failed to set property for device ${device.getSerial()}. ${JSON.stringify({"devices": devices !== undefined ? true : false, "propertyName": propertyName, "propertyValue": propertyValue})}`);
                    }
                    break;
            }
        } catch (e: any) {
            device.removeListener(eventName, funcListener);
            reject(e);
        }
    });
}

/**
 * Wait for a given http api event.
 * @param httpApi The httpApi object.
 * @param eventName The event name.
 * @param timeout The timeout in ms.
 * @returns true if event occurs, otherwise false.
 */
export function waitForHttpApiEvent(httpApi: HTTPApi, eventName: keyof HTTPApiEvents, timeout: number): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let timer: NodeJS.Timeout;
        const funcListener = (): void => listener();

        function listener(): void {
            httpApi.removeListener(eventName, funcListener);
            clearTimeout(timer);
            resolve(true);
        }

        httpApi.addListener(eventName, funcListener);
        timer = setTimeout(() => {
            httpApi.removeListener(eventName, funcListener);
            reject(false);
        }, timeout);
        try {
            switch (eventName) {
                case "devices":
                    await httpApi.refreshDeviceData();
                    break;
                case "houses":
                    await httpApi.refreshHouseData();
                    break;
                case "hubs":
                    await httpApi.refreshStationData();
                    break;
                default:
                    throw new Error(`Not implemented event '${eventName}' during waitForHttpApiEvent.`);
            }
        } catch (e: any) {
            httpApi.removeListener(eventName, funcListener);
            reject(e);
        }
    });
}

/**
 * Converts a given map to an array.
 * @param map The map.
 * @returns The array with the key-values pairs of the map.
 */
export function convertMapToObject(map: Map<any, any>): {[key: string | number]: any}  {
    const object: {[key: number | string]: string } = {};
    map.forEach((value, key) => {
        object[key] = value;
    });
    return object;
}