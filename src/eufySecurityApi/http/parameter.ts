import { Logger } from "ts-log";

import { CommandType } from "../p2p/types";
import { ParamType } from "./types";

export class ParameterHelper {

    public static readValue(type: number, value: string, log: Logger): string {
        if (value) {
            if (type === ParamType.SNOOZE_MODE || type === ParamType.CAMERA_MOTION_ZONES || type === CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY || type === CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN) {
                try {
                    return JSON.parse(Buffer.from(value).toString("ascii"));
                } catch(error) {
                }
                return "";
            } else if (type === CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE ||
                type === CommandType.CMD_DOORBELL_DUAL_RADAR_WD_DETECTION_SENSITIVITY ||
                type === CommandType.CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE ||
                type === CommandType.CMD_DOORBELL_DUAL_PACKAGE_STRAND_TIME ||
                type === CommandType.CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE ||
                type === CommandType.CMD_DOORBELL_DUAL_PACKAGE_GUARD_TIME ||
                type === CommandType.CMD_DOORBELL_DUAL_RADAR_WD_DISTANCE ||
                type === CommandType.CMD_DOORBELL_DUAL_RADAR_WD_TIME ||
                type === CommandType.CMD_DOORBELL_DUAL_DELIVERY_GUARD_SWITCH ||
                type === CommandType.CMD_DOORBELL_DUAL_PACKAGE_GUARD_VOICE) {
                if (typeof value === "string") {
                    try {
                        return JSON.parse(value); //return object
                    } catch(error) {
                        log.error(`Error readValue param ${type} `, error, type, value);
                    }
                    return "";
                } else {
                    return value; //return object
                }
            }
        }
        return value;
    }

    public static writeValue(type: number, value: string): string {
        if (value) {
            const result = JSON.stringify(value);
            if (type === ParamType.SNOOZE_MODE || type === ParamType.CAMERA_MOTION_ZONES || type === CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY || type === CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN) {
                return Buffer.from(result).toString("base64");
            }
            return result;
        }
        return "";
    }

}