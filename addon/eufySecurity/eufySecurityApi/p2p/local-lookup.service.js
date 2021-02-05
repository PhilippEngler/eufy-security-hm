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
exports.LocalLookupService = void 0;
const dgram_1 = require("dgram");
const message_utils_1 = require("./message.utils");
class LocalLookupService {
    constructor() {
        this.LOCAL_PORT = 32108;
        this.addressTimeoutInMs = 3 * 1000;
    }
    bind(socket, portNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                socket.bind(portNumber.valueOf(), () => resolve());
            });
        });
    }
    close(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                socket.close(() => resolve());
            });
        });
    }
    lookup(host, portNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let timer = null;
                const socket = dgram_1.createSocket('udp4');
                socket.on('error', (error) => reject(error));
                this.bind(socket, portNumber);
                socket.on('message', (msg, rinfo) => {
                    if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.LOCAL_LOOKUP_RESP)) {
                        if (!!timer) {
                            clearTimeout(timer);
                        }
                        this.close(socket);
                        resolve({ host: rinfo.address, port: rinfo.port });
                    }
                });
                const payload = Buffer.from([0, 0]);
                yield message_utils_1.sendMessage(socket, { host: host, port: this.LOCAL_PORT }, message_utils_1.RequestMessageType.LOCAL_LOOKUP, payload);
                timer = setTimeout(() => {
                    this.close(socket);
                    reject(`Timeout on local address: ${host}:${this.LOCAL_PORT}`);
                }, this.addressTimeoutInMs);
            }));
        });
    }
}
exports.LocalLookupService = LocalLookupService;
