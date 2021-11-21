"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPassword = exports.calculateWifiSignalLevel = exports.switchNotificationMode = exports.isNotificationSwitchMode = exports.getAbsoluteFilePath = exports.getTimezoneGMTString = exports.pad = exports.isGreaterEqualMinVersion = void 0;
const crypto_1 = require("crypto");
const types_1 = require("./types");
const isGreaterEqualMinVersion = function (minimal_version, current_version) {
    if (minimal_version === undefined)
        minimal_version = "";
    if (current_version === undefined)
        current_version = "";
    minimal_version = minimal_version.replace(/\D+/g, "");
    current_version = current_version.replace(/\D+/g, "");
    if (minimal_version === "")
        return false;
    if (current_version === "")
        return false;
    let min_version = 0;
    let curr_version = 0;
    try {
        min_version = Number.parseInt(minimal_version);
    }
    catch (error) {
    }
    try {
        curr_version = Number.parseInt(current_version);
    }
    catch (error) {
    }
    if (curr_version === 0 || min_version === 0 || curr_version < min_version) {
        return false;
    }
    return true;
};
exports.isGreaterEqualMinVersion = isGreaterEqualMinVersion;
const pad = function (num) {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? "0" : "") + norm;
};
exports.pad = pad;
const getTimezoneGMTString = function () {
    const tzo = -new Date().getTimezoneOffset();
    const dif = tzo >= 0 ? "+" : "-";
    return `GMT${dif}${(0, exports.pad)(tzo / 60)}:${(0, exports.pad)(tzo % 60)}`;
};
exports.getTimezoneGMTString = getTimezoneGMTString;
const getAbsoluteFilePath = function (device_type, channel, filename) {
    if (device_type === types_1.DeviceType.FLOODLIGHT) {
        return `/mnt/data/Camera${String(channel).padStart(2, "0")}/${filename}.dat`;
    }
    return `/media/mmcblk0p1/Camera${String(channel).padStart(2, "0")}/${filename}.dat`;
};
exports.getAbsoluteFilePath = getAbsoluteFilePath;
const isNotificationSwitchMode = function (value, mode) {
    if (value === 1)
        value = 240;
    return (value & mode) !== 0;
};
exports.isNotificationSwitchMode = isNotificationSwitchMode;
const switchNotificationMode = function (currentValue, mode, enable) {
    let result = 0;
    if (!enable && currentValue === 1 /* ALL */) {
        currentValue = 240;
    }
    if (enable) {
        result = mode | currentValue;
    }
    else {
        result = ~mode & currentValue;
    }
    if ((0, exports.isNotificationSwitchMode)(result, types_1.NotificationSwitchMode.SCHEDULE) && (0, exports.isNotificationSwitchMode)(result, types_1.NotificationSwitchMode.APP) && (0, exports.isNotificationSwitchMode)(result, types_1.NotificationSwitchMode.GEOFENCE) && (0, exports.isNotificationSwitchMode)(result, types_1.NotificationSwitchMode.KEYPAD)) {
        result = 1; /* ALL */
    }
    return result;
};
exports.switchNotificationMode = switchNotificationMode;
const calculateWifiSignalLevel = function (device, rssi) {
    if (device.isWiredDoorbell()) {
        if (rssi >= -65) {
            return types_1.WifiSignalLevel.FULL;
        }
        if (rssi >= -75) {
            return types_1.WifiSignalLevel.STRONG;
        }
        return rssi >= -80 ? types_1.WifiSignalLevel.NORMAL : types_1.WifiSignalLevel.WEAK;
    }
    else if (device.isCamera2Product()) {
        if (rssi >= 0) {
            return types_1.WifiSignalLevel.NO_SIGNAL;
        }
        if (rssi >= -65) {
            return types_1.WifiSignalLevel.FULL;
        }
        if (rssi >= -75) {
            return types_1.WifiSignalLevel.STRONG;
        }
        return rssi >= -85 ? types_1.WifiSignalLevel.NORMAL : types_1.WifiSignalLevel.WEAK;
    }
    else if (device.isFloodLight()) {
        if (rssi >= 0) {
            return types_1.WifiSignalLevel.NO_SIGNAL;
        }
        if (rssi >= -60) {
            return types_1.WifiSignalLevel.FULL;
        }
        if (rssi >= -70) {
            return types_1.WifiSignalLevel.STRONG;
        }
        return rssi >= -80 ? types_1.WifiSignalLevel.NORMAL : types_1.WifiSignalLevel.WEAK;
    }
    else if (device.isBatteryDoorbell() || device.isBatteryDoorbell2()) {
        if (rssi >= -65) {
            return types_1.WifiSignalLevel.FULL;
        }
        if (rssi >= -75) {
            return types_1.WifiSignalLevel.STRONG;
        }
        return rssi >= -85 ? types_1.WifiSignalLevel.NORMAL : types_1.WifiSignalLevel.WEAK;
    }
    else {
        if (rssi >= 0) {
            return types_1.WifiSignalLevel.NO_SIGNAL;
        }
        if (rssi >= -65) {
            return types_1.WifiSignalLevel.FULL;
        }
        if (rssi >= -75) {
            return types_1.WifiSignalLevel.STRONG;
        }
        return rssi >= -85 ? types_1.WifiSignalLevel.NORMAL : types_1.WifiSignalLevel.WEAK;
    }
};
exports.calculateWifiSignalLevel = calculateWifiSignalLevel;
const encryptPassword = (password, key) => {
    const cipher = (0, crypto_1.createCipheriv)("aes-256-cbc", key, key.slice(0, 16));
    return (cipher.update(password, "utf8", "base64") +
        cipher.final("base64"));
};
exports.encryptPassword = encryptPassword;
