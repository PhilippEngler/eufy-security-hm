"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterHelper = void 0;
const types_1 = require("../p2p/types");
const utils_1 = require("../p2p/utils");
const utils_2 = require("../utils");
const types_2 = require("./types");
const utils_3 = require("./utils");
const error_1 = require("../error");
class ParameterHelper {
    static JSON_PARSE_BASE64_PARAMS = new Set([
        types_2.ParamType.SNOOZE_MODE,
        types_2.ParamType.CAMERA_MOTION_ZONES,
        types_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY,
        types_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN,
        types_1.CommandType.ARM_DELAY_HOME,
        types_1.CommandType.ARM_DELAY_AWAY,
        types_1.CommandType.ARM_DELAY_CUS1,
        types_1.CommandType.ARM_DELAY_CUS2,
        types_1.CommandType.ARM_DELAY_CUS3,
        types_1.CommandType.ARM_DELAY_OFF,
        types_1.CommandType.CELLULAR_INFO,
        types_1.CommandType.CMD_WALL_LIGHT_SETTINGS_MANUAL_COLORED_LIGHTING,
        types_1.CommandType.CMD_WALL_LIGHT_SETTINGS_SCHEDULE_COLORED_LIGHTING,
        types_1.CommandType.CMD_WALL_LIGHT_SETTINGS_COLORED_LIGHTING_COLORS,
        types_1.CommandType.CMD_WALL_LIGHT_SETTINGS_DYNAMIC_LIGHTING_THEMES,
        types_1.CommandType.CMD_INDOOR_DET_SET_ACTIVE_ZONE,
        types_1.CommandType.CMD_SET_PRIVACYPARAM,
        types_1.CommandType.CMD_BAT_DOORBELL_VIDEO_QUALITY2,
        types_1.CommandType.CMD_BAT_DOORBELL_RECORD_QUALITY2,
        types_1.CommandType.CMD_SET_CROSS_TRACKING_CAMERA_LIST,
        types_1.CommandType.CMD_SET_CROSS_TRACKING_GROUP_LIST,
        types_1.CommandType.CMD_FLOODLIGHT_SET_DETECTION_RANGE_T8425,
        types_1.CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_PIR_T8425,
        types_1.CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_SCH_T8425
    ]);
    static JSON_PARSE_PLAIN_PARAMS = new Set([
        types_1.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
        types_1.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_DETECTION_SENSITIVITY,
        types_1.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE,
        types_1.CommandType.CMD_DOORBELL_DUAL_PACKAGE_STRAND_TIME,
        types_1.CommandType.CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE,
        types_1.CommandType.CMD_DOORBELL_DUAL_PACKAGE_GUARD_TIME,
        types_1.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_DISTANCE,
        types_1.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_TIME,
        types_1.CommandType.CMD_DOORBELL_DUAL_DELIVERY_GUARD_SWITCH,
        types_1.CommandType.CMD_DOORBELL_DUAL_PACKAGE_GUARD_VOICE,
        types_1.CommandType.CMD_CAMERA_GARAGE_DOOR_SENSORS,
        types_1.CommandType.CMD_MOTION_SET_LEAVING_REACTIONS
    ]);
    static readValue(serialNumber, type, value, log) {
        if (value) {
            if (ParameterHelper.JSON_PARSE_BASE64_PARAMS.has(type)) {
                if (typeof value === "string") {
                    const parsedValue = (0, utils_2.parseJSON)((0, utils_1.getNullTerminatedString)((0, utils_1.decodeBase64)(value), "utf-8"), log);
                    if (parsedValue === undefined) {
                        log.debug("Non-parsable parameter value received from eufy cloud. Will be ignored.", { serialNumber: serialNumber, type: type, value: value });
                    }
                    return parsedValue;
                }
                else {
                    return value; //return object
                }
            }
            else if (ParameterHelper.JSON_PARSE_PLAIN_PARAMS.has(type)) {
                if (typeof value === "string") {
                    const parsedValue = (0, utils_2.parseJSON)(value, log);
                    if (parsedValue === undefined) {
                        log.debug("Non-parsable parameter value received from eufy cloud. Will be ignored.", { serialNumber: serialNumber, type: type, value: value });
                    }
                    return parsedValue;
                }
                else {
                    return value; //return object
                }
            }
            else if (type === types_1.TrackerCommandType.COMMAND_NEW_LOCATION ||
                type === types_1.TrackerCommandType.LOCATION_NEW_ADDRESS) {
                try {
                    const decrypted = (0, utils_3.decryptTrackerData)(Buffer.from(value, "hex"), Buffer.from(serialNumber));
                    if (decrypted !== undefined) {
                        return decrypted.toString("utf8").trim();
                    }
                }
                catch (err) {
                    const error = (0, error_1.ensureError)(err);
                    log.debug("Non-parsable parameter value received from eufy cloud. Will be ignored.", { serialNumber: serialNumber, type: type, value: value, error: (0, utils_2.getError)(error) });
                }
                return "";
            }
        }
        return value;
    }
    static writeValue(type, value) {
        if (value) {
            if (type === types_2.ParamType.SNOOZE_MODE ||
                type === types_2.ParamType.CAMERA_MOTION_ZONES ||
                type === types_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY ||
                type === types_1.CommandType.CMD_SET_DOORSENSOR_ALWAYS_OPEN) {
                return Buffer.from(JSON.stringify(value)).toString("base64");
            }
            return value;
        }
        return "";
    }
}
exports.ParameterHelper = ParameterHelper;
