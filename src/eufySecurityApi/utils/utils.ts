export const pathToNodeJs = "/usr/local/addons/eufySecurity/bin/nodejs";
export const pathToTemp = "/var/tmp/eufySecurity";

/**
 * Retrieve the model name of a given station or device.
 * @param modelNumber The model number of the station or device.
 * @returns A string with the model name of the station or device.
 */
export const getModelName = function(modelNumber : string) : string
{
    switch (modelNumber.substring(0,5))
    {
        //HomeBases
        case "T8001":
            return "HomeBase";
        case "T8002":
            return "HomeBase E";
        case "T8010":
            return "HomeBase 2";
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
        //WallLightCam
        case "T84A0":
            return "Solar WallLightCam S120";
        case "T84A1":
            return "WallLightCam S100";
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
            return "Video Smart Lock"
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
 * Converts the given timestamp to the german dd.mm.yyyy hh:mm string.
 * @param timestamp The timestamp as number.
 */
export const makeDateTimeString = function(timestamp : number) : string
{
    var dateTime = new Date(timestamp);
    return (`${dateTime.getDate().toString().padStart(2,'0')}.${(dateTime.getMonth()+1).toString().padStart(2,'0')}.${dateTime.getFullYear().toString()} ${dateTime.getHours().toString().padStart(2,'0')}:${dateTime.getMinutes().toString().padStart(2,'0')}`);
}

/**
 * Recalculate the timestamp to get a timestamp in milliseconds.
 * @param timeStamp The value as timestamp.
 * @param timeStampType The timestamp type.
 * @returns The timestamp in milliseconds.
 */
export const convertTimeStampToTimeStampMs = function(timeStamp : number, timeStampType : string) : number | undefined
{
    switch (timeStampType)
    {
        case "sec":
            return timeStamp * 1000;
        case "ms":
            return timeStamp;
        default:
            return undefined;
        }
}

/**
 * The interface for EufyCountry
 */
export interface EufyCountry
{
    countryName: string;
    countryPhoneCode: string;
    countryCode: string;
}

export interface CameraEvent
{
    path: string;
    start_time: Date;
}