"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LOG = void 0;
const DEBUG = false;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const LOG = (...msg) => {
    if (!!DEBUG) {
        console.log(...msg);
    }
};
exports.LOG = LOG;
class Logger {
    log(message) {
        console.log(this.makeNowDateTimeString() + " - " + message);
    }
    err(message) {
        console.error(this.makeNowDateTimeString() + " - " + message);
    }
    makeNowDateTimeString() {
        var dateTime = new Date();
        return (dateTime.getFullYear().toString() + "-" + (dateTime.getMonth() + 1).toString().padStart(2, '0') + "-" + dateTime.getDate().toString().padStart(2, '0') + " " + dateTime.getHours().toString().padStart(2, '0') + ":" + dateTime.getMinutes().toString().padStart(2, '0') + ":" + dateTime.getSeconds().toString().padStart(2, '0'));
    }
}
exports.Logger = Logger;
