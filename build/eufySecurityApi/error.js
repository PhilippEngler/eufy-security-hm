"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadOnlyPropertyError = exports.InvalidCommandValueError = exports.InvalidPropertyValueError = exports.RTSPPropertyNotEnabled = exports.WrongStationError = exports.NotSupportedError = exports.DuplicateDeviceError = exports.DeviceNotFoundError = exports.DuplicateStationError = exports.StationNotFoundError = exports.InvalidLanguageCodeError = exports.InvalidCountryCodeError = void 0;
class InvalidCountryCodeError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidCountryCodeError.name;
    }
}
exports.InvalidCountryCodeError = InvalidCountryCodeError;
class InvalidLanguageCodeError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidLanguageCodeError.name;
    }
}
exports.InvalidLanguageCodeError = InvalidLanguageCodeError;
class StationNotFoundError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = StationNotFoundError.name;
    }
}
exports.StationNotFoundError = StationNotFoundError;
class DuplicateStationError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DuplicateStationError.name;
    }
}
exports.DuplicateStationError = DuplicateStationError;
class DeviceNotFoundError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DeviceNotFoundError.name;
    }
}
exports.DeviceNotFoundError = DeviceNotFoundError;
class DuplicateDeviceError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DuplicateDeviceError.name;
    }
}
exports.DuplicateDeviceError = DuplicateDeviceError;
class NotSupportedError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = NotSupportedError.name;
    }
}
exports.NotSupportedError = NotSupportedError;
class WrongStationError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = WrongStationError.name;
    }
}
exports.WrongStationError = WrongStationError;
class RTSPPropertyNotEnabled extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = RTSPPropertyNotEnabled.name;
    }
}
exports.RTSPPropertyNotEnabled = RTSPPropertyNotEnabled;
class InvalidPropertyValueError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidPropertyValueError.name;
    }
}
exports.InvalidPropertyValueError = InvalidPropertyValueError;
class InvalidCommandValueError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidCommandValueError.name;
    }
}
exports.InvalidCommandValueError = InvalidCommandValueError;
class ReadOnlyPropertyError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = ReadOnlyPropertyError.name;
    }
}
exports.ReadOnlyPropertyError = ReadOnlyPropertyError;
