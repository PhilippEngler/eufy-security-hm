"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPropertyError = void 0;
class InvalidPropertyError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidPropertyError.name;
    }
}
exports.InvalidPropertyError = InvalidPropertyError;
