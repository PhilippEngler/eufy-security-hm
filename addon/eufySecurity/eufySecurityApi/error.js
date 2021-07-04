"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadOnlyPropertyError = exports.InvalidPropertyValueError = exports.NotConnectedError = exports.WrongStationError = exports.NotSupportedGuardModeError = exports.NotSupportedFeatureError = exports.DuplicateDeviceError = exports.DeviceNotFoundError = exports.DuplicateStationError = exports.StationNotFoundError = exports.InvalidLanguageCodeError = exports.InvalidCountryCodeError = void 0;
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
class NotSupportedFeatureError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = NotSupportedFeatureError.name;
    }
}
exports.NotSupportedFeatureError = NotSupportedFeatureError;
class NotSupportedGuardModeError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = NotSupportedGuardModeError.name;
    }
}
exports.NotSupportedGuardModeError = NotSupportedGuardModeError;
class WrongStationError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = WrongStationError.name;
    }
}
exports.WrongStationError = WrongStationError;
class NotConnectedError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = NotConnectedError.name;
    }
}
exports.NotConnectedError = NotConnectedError;
class InvalidPropertyValueError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidPropertyValueError.name;
    }
}
exports.InvalidPropertyValueError = InvalidPropertyValueError;
class ReadOnlyPropertyError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = ReadOnlyPropertyError.name;
    }
}
exports.ReadOnlyPropertyError = ReadOnlyPropertyError;
