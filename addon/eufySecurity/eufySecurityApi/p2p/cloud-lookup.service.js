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
exports.CloudLookupService = void 0;
const dgram_1 = require("dgram");
const message_utils_1 = require("./message.utils");
const payload_utils_1 = require("./payload.utils");
const http_utils_1 = require("../http/http.utils");
class CloudLookupService {
    constructor() {
        this.addressTimeoutInMs = 3 * 1000;
        this.addresses = [
            { host: '54.223.148.206', port: 32100 },
            { host: '18.197.212.165', port: 32100 },
            { host: '13.251.222.7', port: 32100 },
        ];
    }
    bind(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                socket.bind(0, () => resolve());
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
    lookup(p2pDid, dskKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return http_utils_1.promiseAny(this.addresses.map((address) => this.lookupByAddress(address, p2pDid, dskKey)));
        });
    }
    lookupByAddress(address, p2pDid, dskKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let timer = null;
                const socket = dgram_1.createSocket('udp4');
                socket.on('error', (error) => reject(error));
                yield this.bind(socket); // Bind to a random port
                // Register listener
                const addresses = [];
                socket.on('message', (msg, rInfo) => {
                    if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.LOOKUP_ADDR)) {
                        const port = msg[7] * 256 + msg[6];
                        const ip = `${msg[11]}.${msg[10]}.${msg[9]}.${msg[8]}`;
                        addresses.push({ host: ip, port: port });
                        if (addresses.length === 2) {
                            if (!!timer) {
                                clearTimeout(timer);
                            }
                            this.close(socket);
                            resolve(addresses);
                        }
                    }
                });
                // Send lookup message
                const msgId = message_utils_1.RequestMessageType.LOOKUP_WITH_DSK;
                const payload = payload_utils_1.buildLookupWithKeyPayload(socket, p2pDid, dskKey);
                yield message_utils_1.sendMessage(socket, address, msgId, payload);
                timer = setTimeout(() => {
                    this.close(socket);
                    reject(`Timeout on external address: ${address.host}:${address.port}`);
                }, this.addressTimeoutInMs);
            }));
        });
    }
}
exports.CloudLookupService = CloudLookupService;
