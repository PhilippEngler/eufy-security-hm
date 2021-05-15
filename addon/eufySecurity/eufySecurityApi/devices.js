"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Devices = void 0;
const http_1 = require("./http");
/**
 * Represents all the Devices in the account.
 */
class Devices {
    /**
     * Create the Devices objects holding all devices in the account.
     * @param httpService The httpService.
     */
    constructor(httpService) {
        this.devices = {};
        this.httpService = httpService;
    }
    /**
     * (Re)Loads all Devices and the settings of them.
     */
    loadDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.httpService.updateDeviceInfo();
                this.resDevices = this.httpService.getDevices();
                var key;
                var device;
                if (this.resDevices != null) {
                    for (key in this.resDevices) {
                        if (this.devices[key]) {
                            this.devices[key].update(this.resDevices[key], true);
                        }
                        else {
                            device = new http_1.CommonDevice(this.httpService, this.resDevices[key]);
                            if (device.isCamera()) {
                                if (!device.isIndoorCamera() && !device.isFloodLight() && !device.isDoorbell() && !device.isSoloCameras()) {
                                    device = new http_1.Camera(this.httpService, this.resDevices[key]);
                                    this.devices[device.getSerial()] = device;
                                }
                            }
                        }
                    }
                }
                else {
                    this.devices = {};
                }
            }
            catch (e) {
                this.devices = {};
                throw new Error(e);
            }
        });
    }
    /**
     * Close all P2P connection for all devices.
     */
    closeP2PConnections() {
        return;
    }
    /**
     * Returns all Devices.
     */
    getDevices() {
        return this.devices;
    }
}
exports.Devices = Devices;
