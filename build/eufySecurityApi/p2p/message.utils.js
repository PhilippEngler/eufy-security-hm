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
exports.hasHeader = exports.sendMessage = exports.ResponseMessageType = exports.RequestMessageType = void 0;
class RequestMessageType {
}
exports.RequestMessageType = RequestMessageType;
RequestMessageType.LOOKUP_WITH_DSK = Buffer.from([0xf1, 0x26]);
RequestMessageType.LOCAL_LOOKUP = Buffer.from([0xf1, 0x30]);
RequestMessageType.CHECK_CAM = Buffer.from([0xf1, 0x41]);
RequestMessageType.PING = Buffer.from([0xf1, 0xe0]);
RequestMessageType.PONG = Buffer.from([0xf1, 0xe1]);
RequestMessageType.DATA = Buffer.from([0xf1, 0xd0]);
RequestMessageType.ACK = Buffer.from([0xf1, 0xd1]);
RequestMessageType.STUN = Buffer.from([0xF1, 0x00]);
RequestMessageType.LOOKUP = Buffer.from([0xF1, 0x20]);
RequestMessageType.END = Buffer.from([0xF1, 0xF0]);
class ResponseMessageType {
}
exports.ResponseMessageType = ResponseMessageType;
ResponseMessageType.STUN = Buffer.from([0xf1, 0x01]);
ResponseMessageType.LOOKUP_RESP = Buffer.from([0xf1, 0x21]);
ResponseMessageType.LOOKUP_ADDR = Buffer.from([0xf1, 0x40]);
ResponseMessageType.LOCAL_LOOKUP_RESP = Buffer.from([0xf1, 0x41]);
ResponseMessageType.END = Buffer.from([0xf1, 0xf0]);
ResponseMessageType.PONG = Buffer.from([0xf1, 0xe1]);
ResponseMessageType.PING = Buffer.from([0xf1, 0xe0]);
ResponseMessageType.CAM_ID = Buffer.from([0xf1, 0x42]);
ResponseMessageType.ACK = Buffer.from([0xf1, 0xd1]);
ResponseMessageType.DATA = Buffer.from([0xf1, 0xd0]);
const sendMessage = (socket, address, msgID, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload)
        payload = Buffer.from([]);
    const payloadLen = Buffer.from([Math.floor(payload.length / 256), payload.length % 256]);
    const message = Buffer.concat([msgID, payloadLen, payload], 4 + payload.length);
    return sendPackage(socket, address, message);
});
exports.sendMessage = sendMessage;
const sendPackage = (socket, address, pkg) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        socket.send(pkg, address.port, address.host, (err, bytes) => {
            return err ? reject(err) : resolve(bytes);
        });
    });
});
const hasHeader = (msg, searchedType) => {
    const header = Buffer.allocUnsafe(2);
    msg.copy(header, 0, 0, 2);
    return Buffer.compare(header, searchedType) === 0;
};
exports.hasHeader = hasHeader;
