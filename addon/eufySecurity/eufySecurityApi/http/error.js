"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyNotSupportedError = exports.LivestreamNotRunningError = exports.LivestreamAlreadyRunningError = exports.InvalidPropertyError = void 0;
class InvalidPropertyError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidPropertyError.name;
    }
}
exports.InvalidPropertyError = InvalidPropertyError;
class LivestreamAlreadyRunningError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = LivestreamAlreadyRunningError.name;
    }
}
exports.LivestreamAlreadyRunningError = LivestreamAlreadyRunningError;
class LivestreamNotRunningError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = LivestreamNotRunningError.name;
    }
}
exports.LivestreamNotRunningError = LivestreamNotRunningError;
class PropertyNotSupportedError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = PropertyNotSupportedError.name;
    }
}
exports.PropertyNotSupportedError = PropertyNotSupportedError;
