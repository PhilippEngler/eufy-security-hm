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
exports.DeviceClientService = void 0;
const dgram_1 = require("dgram");
const fs_1 = require("fs");
const message_utils_1 = require("./message.utils");
const payload_utils_1 = require("./payload.utils");
const command_model_1 = require("./command.model");
const logging_1 = require("../utils/logging");
class DeviceClientService {
    constructor(address, p2pDid, actor) {
        this.address = address;
        this.p2pDid = p2pDid;
        this.actor = actor;
        this.addressTimeoutInMs = 3 * 1000;
        this.connected = false;
        this.seqNumber = 0;
        this.seenSeqNo = {};
        this.currentControlMessageBuilder = {
            bytesToRead: 0,
            bytesRead: 0,
            commandId: 0,
            messages: {},
        };
        this.videoBuffer = Buffer.from([]);
        //this.socket = createSocket('udp4');
        //this.socket.bind(0);
        this.initialize();
    }
    initialize() {
        this.currentControlMessageBuilder = {
            bytesToRead: 0,
            bytesRead: 0,
            commandId: 0,
            messages: {},
        };
        this.connected = false;
        this.seqNumber = 0;
        this.seenSeqNo = {};
        //this.message_states.clear();
        //this.connectTime = null;
        //this.lastPong = null;
        /*if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = undefined;
        }*/
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.close();
        }
        this.socket = dgram_1.createSocket("udp4");
        this.socket.bind(0);
    }
    isConnected() {
        return this.connected;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let timer = null;
                this.socket.once('message', (msg) => {
                    if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.CAM_ID)) {
                        logging_1.LOG('connected!');
                        if (!!timer) {
                            clearTimeout(timer);
                        }
                        this.socket.on('message', (msg) => this.handleMsg(msg));
                        //
                        this.socket.on('error', (error) => this.onError(error));
                        this.socket.on("close", () => this.onClose());
                        //
                        this.connected = true;
                        resolve(true);
                    }
                });
                this.sendCamCheck();
                timer = setTimeout(() => {
                    reject(`Timeout on connect to ${JSON.stringify(this.address)}`);
                }, this.addressTimeoutInMs);
            });
        });
    }
    sendCamCheck() {
        const payload = payload_utils_1.buildCheckCamPayload(this.p2pDid);
        message_utils_1.sendMessage(this.socket, this.address, message_utils_1.RequestMessageType.CHECK_CAM, payload);
    }
    sendPing() {
        message_utils_1.sendMessage(this.socket, this.address, message_utils_1.RequestMessageType.PING);
    }
    sendCommandWithIntString(commandType, value, channel = 0) {
        // SET_COMMAND_WITH_INT_STRING_TYPE = msgTypeID == 10
        const payload = payload_utils_1.buildIntStringCommandPayload(value, this.actor, channel);
        this.sendCommand(commandType, payload);
    }
    sendCommandWithInt(commandType, value) {
        // SET_COMMAND_WITH_INT_TYPE = msgTypeID == 4
        const payload = payload_utils_1.buildIntCommandPayload(value, this.actor);
        this.sendCommand(commandType, payload);
    }
    sendCommandWithString(commandType, value) {
        // SET_COMMAND_WITH_STRING_TYPE = msgTypeID == 6
        const payload = payload_utils_1.buildStringTypeCommandPayload(value, this.actor);
        this.sendCommand(commandType, payload);
    }
    sendCommand(commandType, payload) {
        // Command header
        const msgSeqNumber = this.seqNumber++;
        const commandHeader = payload_utils_1.buildCommandHeader(msgSeqNumber, commandType);
        const data = Buffer.concat([commandHeader, payload]);
        logging_1.LOG(`Sending commandType: ${command_model_1.CommandType[commandType]} (${commandType}) with seqNum: ${msgSeqNumber}...`);
        message_utils_1.sendMessage(this.socket, this.address, message_utils_1.RequestMessageType.DATA, data);
        // -> NOTE:
        // -> We could wait for an ACK and then continue (sync)
        // -> Python impl creating an array an putting an "event" behind a seqNumber
        // -> ACK-Listener triggers the seq-number and therefore showing that the message
        // -> is done, until then the promise is waiting (await)
    }
    handleMsg(msg) {
        if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.PONG)) {
            // Response to a ping from our side
            logging_1.LOG('GOT PONG');
            return;
        }
        else if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.PING)) {
            // Response with PONG to keep alive
            message_utils_1.sendMessage(this.socket, this.address, message_utils_1.RequestMessageType.PONG);
            return;
        }
        else if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.END)) {
            // Connection is closed by device
            logging_1.LOG('GOT END');
            this.connected = false;
            this.socket.close();
            return;
        }
        else if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.CAM_ID)) {
            // Answer from the device to a CAM_CHECK message
            return;
        }
        else if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.ACK)) {
            // Device ACK a message from our side
            // Number of Acks sended in the message
            const numAcksBuffer = msg.slice(6, 8);
            const numAcks = numAcksBuffer.readUIntBE(0, numAcksBuffer.length);
            for (let i = 1; i <= numAcks; i++) {
                const idx = 6 + i * 2;
                const seqBuffer = msg.slice(idx, idx + 2);
                const ackedSeqNo = seqBuffer.readUIntBE(0, seqBuffer.length);
                // -> Message with seqNo was received at the station
                logging_1.LOG(`ACK for seqNo: ${ackedSeqNo}`);
            }
        }
        else if (message_utils_1.hasHeader(msg, message_utils_1.ResponseMessageType.DATA)) {
            const seqNo = msg[6] * 256 + msg[7];
            const dataTypeBuffer = msg.slice(4, 6);
            const dataType = this.toDataTypeName(dataTypeBuffer);
            if (this.seenSeqNo[dataType] !== undefined && this.seenSeqNo[dataType] >= seqNo) {
                // We have already seen this message, skip!
                // This can happen because the device is sending the message till it gets a ACK
                // which can take some time.
                return;
            }
            this.seenSeqNo[dataType] = seqNo;
            this.sendAck(dataTypeBuffer, seqNo);
            this.handleData(seqNo, dataType, msg);
        }
        else {
            logging_1.LOG('GOT unknown msg', msg.length, msg);
        }
    }
    handleData(seqNo, dataType, msg) {
        if (dataType === 'CONTROL') {
            this.parseDataControlMessage(seqNo, msg);
        }
        else if (dataType === 'DATA') {
            const commandId = msg.slice(12, 14).readUIntLE(0, 2); // could also be the parameter type on DATA events (1224 = GUARD)
            const data = msg.slice(24, 26).readUIntLE(0, 2); // 0 = Away, 1 = Home, 63 = Deactivated
            // Note: data === 65420 when e.g. data mode is already set (guardMode=0, setting guardMode=0 => 65420)
            // Note: data ==== 65430 when there is an error (sending data to a channel which do not exist)
            const commandStr = command_model_1.CommandType[commandId];
            logging_1.LOG(`DATA package with commandId: ${commandStr} (${commandId}) - data: ${data}`);
        }
        else if (dataType === 'BINARY') {
            this.parseBinaryMessage(seqNo, msg);
        }
        else {
            logging_1.LOG(`Data to handle: seqNo: ${seqNo} - dataType: ${dataType} - msg: ${msg.toString('hex')}`);
        }
    }
    parseBinaryMessage(seqNo, msg) {
        // TODO not working yet
        const firstPartMessage = msg.slice(8, 12).toString() === payload_utils_1.MAGIC_WORD;
        if (firstPartMessage) {
            const payload = msg.slice(24);
            fs_1.appendFileSync('test.mp4', payload);
        }
    }
    parseDataControlMessage(seqNo, msg) {
        // is this the first message?
        const firstPartMessage = msg.slice(8, 12).toString() === payload_utils_1.MAGIC_WORD;
        if (firstPartMessage) {
            const commandId = msg.slice(12, 14).readUIntLE(0, 2);
            this.currentControlMessageBuilder.commandId = commandId;
            const bytesToRead = msg.slice(14, 16).readUIntLE(0, 2);
            this.currentControlMessageBuilder.bytesToRead = bytesToRead;
            const payload = msg.slice(24);
            this.currentControlMessageBuilder.messages[seqNo] = payload;
            this.currentControlMessageBuilder.bytesRead += payload.byteLength;
        }
        else {
            // finish message and print
            const payload = msg.slice(8);
            this.currentControlMessageBuilder.messages[seqNo] = payload;
            this.currentControlMessageBuilder.bytesRead += payload.byteLength;
        }
        if (this.currentControlMessageBuilder.bytesRead >= this.currentControlMessageBuilder.bytesToRead) {
            const commandId = this.currentControlMessageBuilder.commandId;
            const messages = this.currentControlMessageBuilder.messages;
            // sort by keys
            let completeMessage = Buffer.from([]);
            Object.keys(messages)
                .map(Number)
                .sort((a, b) => a - b) // assure the seqNumbers are in correct order
                .forEach((key) => {
                completeMessage = Buffer.concat([completeMessage, messages[key]]);
            });
            this.currentControlMessageBuilder = { bytesRead: 0, bytesToRead: 0, commandId: 0, messages: {} };
            this.handleDataControl(commandId, completeMessage.toString());
        }
    }
    handleDataControl(commandId, message) {
        logging_1.LOG(`DATA - CONTROL message with commandId: ${command_model_1.CommandType[commandId]} (${commandId})`, message);
    }
    sendAck(dataType, seqNo) {
        const numPendingAcks = 1;
        const pendingAcksBuffer = Buffer.from([Math.floor(numPendingAcks / 256), numPendingAcks % 256]);
        const seqBuffer = Buffer.from([Math.floor(seqNo / 256), seqNo % 256]);
        const payload = Buffer.concat([dataType, pendingAcksBuffer, seqBuffer]);
        message_utils_1.sendMessage(this.socket, this.address, message_utils_1.RequestMessageType.ACK, payload);
    }
    toDataTypeName(input) {
        const DATA = Buffer.from([0xd1, 0x00]);
        const VIDEO = Buffer.from([0xd1, 0x01]);
        const CONTROL = Buffer.from([0xd1, 0x02]);
        const BINARY = Buffer.from([0xd1, 0x03]);
        if (input.compare(DATA) === 0) {
            return 'DATA';
        }
        else if (input.compare(VIDEO) === 0) {
            return 'VIDEO';
        }
        else if (input.compare(CONTROL) === 0) {
            return 'CONTROL';
        }
        else if (input.compare(BINARY) === 0) {
            return 'BINARY';
        }
        return 'unknown';
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.socket && this.connected) {
                yield message_utils_1.sendMessage(this.socket, this.address, message_utils_1.RequestMessageType.END);
            }
            else {
                this.initialize();
            }
        });
    }
    onClose() {
        /*if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = undefined;
        }*/
        logging_1.LOG("EufyP2PClientProtocol.onClose(): ");
    }
    onError(error) {
        logging_1.LOG(`EufyP2PClientProtocol.onError(): Error: ${error}`);
    }
}
exports.DeviceClientService = DeviceClientService;
