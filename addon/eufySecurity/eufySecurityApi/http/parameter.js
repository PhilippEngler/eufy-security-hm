"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterHelper = void 0;
const p2p_1 = require("../p2p");
const types_1 = require("./types");
class ParameterHelper {
    static readValue(type, value) {
        if (value) {
            if (type === types_1.ParamType.SNOOZE_MODE || type === types_1.ParamType.CAMERA_MOTION_ZONES || type === p2p_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY || type === p2p_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN) {
                try {
                    return JSON.parse(Buffer.from(value).toString("ascii"));
                }
                catch (error) {
                }
                return "";
            }
            else if (type === p2p_1.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE) {
                try {
                    return JSON.parse(value);
                }
                catch (error) {
                }
                return "";
            }
        }
        return value;
    }
    static writeValue(type, value) {
        if (value) {
            const result = JSON.stringify(value);
            if (type === types_1.ParamType.SNOOZE_MODE || type === types_1.ParamType.CAMERA_MOTION_ZONES || type === p2p_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY || type === p2p_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN) {
                return Buffer.from(result).toString("base64");
            }
            return result;
        }
        return "";
    }
}
exports.ParameterHelper = ParameterHelper;
