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
exports.P2PClientProtocol = void 0;
const dgram_1 = require("dgram");
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const stream_1 = require("stream");
const sweet_collections_1 = require("sweet-collections");
const utils_1 = require("./utils");
const types_1 = require("./types");
const types_2 = require("../http/types");
const device_1 = require("../http/device");
class P2PClientProtocol extends tiny_typed_emitter_1.TypedEmitter {
    constructor(localAddress, localPort, connectionType, rawStation, api) {
        super();
        this.MAX_RETRIES = 10;
        this.MAX_COMMAND_RESULT_WAIT = 30 * 1000;
        this.MAX_AKNOWLEDGE_TIMEOUT = 15 * 1000;
        this.MAX_LOOKUP_TIMEOUT = 15 * 1000;
        this.LOOKUP_RETRY_TIMEOUT = 150;
        this.MAX_EXPECTED_SEQNO_WAIT = 20 * 1000;
        this.HEARTBEAT_INTERVAL = 5 * 1000;
        this.MAX_COMMAND_CONNECT_TIMEOUT = 45 * 1000;
        this.AUDIO_CODEC_ANALYZE_TIMEOUT = 650;
        this.KEEPALIVE_INTERVAL = 1 * 1000;
        this.ESD_DISCONNECT_TIMEOUT = 15 * 1000;
        this.MAX_STREAM_DATA_WAIT = 5 * 1000;
        this.UDP_RECVBUFFERSIZE_BYTES = 1048576;
        this.MAX_PAYLOAD_BYTES = 1028;
        this.MAX_PACKET_BYTES = 1024;
        this.MAX_VIDEO_PACKET_BYTES = 655360;
        this.P2P_DATA_HEADER_BYTES = 16;
        this.binded = false;
        this.connected = false;
        this.connecting = false;
        this.terminating = false;
        this.seqNumber = 0;
        this.lockSeqNumber = -1;
        this.expectedSeqNo = {};
        this.currentMessageBuilder = {};
        this.currentMessageState = {};
        this.downloadTotalBytes = 0;
        this.downloadReceivedBytes = 0;
        this.cloudAddresses = [
            { host: "18.197.212.165", port: 32100 },
            { host: "34.235.4.153", port: 32100 },
            { host: "54.153.101.7", port: 32100 },
            { host: "18.223.127.200", port: 32100 },
            { host: "54.223.148.206", port: 32100 },
            { host: "13.251.222.7", port: 32100 }, // Singapore
        ];
        this.messageStates = new sweet_collections_1.SortedMap((a, b) => a - b);
        this.sendQueue = new Array();
        this.connectTime = null;
        this.lastPong = null;
        this.connectionType = types_1.P2PConnectionType.ONLY_LOCAL;
        this.fallbackAddresses = [];
        this.energySavingDevice = false;
        this.connectAddress = undefined;
        this.dskKey = "";
        this.dskExpiration = null;
        this.deviceSNs = {};
        this.localAddress = localAddress;
        this.localPort = localPort;
        this.connectionType = connectionType;
        this.api = api;
        this.log = api.getLog();
        this.updateRawStation(rawStation);
        this.socket = (0, dgram_1.createSocket)("udp4");
        this.socket.on("message", (msg, rinfo) => this.handleMsg(msg, rinfo));
        this.socket.on("error", (error) => this.onError(error));
        this.socket.on("close", () => this.onClose());
        this._initialize();
    }
    _initialize() {
        let rsaKey;
        this.connected = false;
        this.connecting = false;
        this.lastPong = null;
        this.connectTime = null;
        this.seqNumber = 0;
        this.lockSeqNumber = -1;
        this.connectAddress = undefined;
        this._clearMessageStateTimeouts();
        this.messageStates.clear();
        for (let datatype = 0; datatype < 4; datatype++) {
            this.expectedSeqNo[datatype] = 0;
            if (datatype === types_1.P2PDataType.VIDEO)
                rsaKey = (0, utils_1.getNewRSAPrivateKey)();
            else
                rsaKey = null;
            this.initializeMessageBuilder(datatype);
            this.initializeMessageState(datatype, rsaKey);
            this.initializeStream(datatype);
        }
    }
    initializeMessageBuilder(datatype) {
        this.currentMessageBuilder[datatype] = {
            header: {
                commandId: 0,
                bytesToRead: 0,
                channel: 0,
                signCode: 0,
                type: 0
            },
            bytesRead: 0,
            messages: {}
        };
    }
    initializeMessageState(datatype, rsaKey = null) {
        this.currentMessageState[datatype] = {
            leftoverData: Buffer.from([]),
            queuedData: new sweet_collections_1.SortedMap((a, b) => a - b),
            rsaKey: rsaKey,
            videoStream: null,
            audioStream: null,
            invalidStream: false,
            p2pStreaming: false,
            p2pStreamNotStarted: true,
            p2pStreamChannel: -1,
            p2pStreamFirstAudioDataReceived: false,
            p2pStreamFirstVideoDataReceived: false,
            p2pStreamMetadata: {
                videoCodec: types_1.VideoCodec.H264,
                videoFPS: 15,
                videoHeight: 1080,
                videoWidth: 1920,
                audioCodec: types_1.AudioCodec.NONE
            },
            rtspStream: {},
            rtspStreaming: {},
            receivedFirstIFrame: false,
            preFrameVideoData: Buffer.from([])
        };
    }
    _clearTimeout(timeout) {
        if (!!timeout) {
            clearTimeout(timeout);
        }
    }
    _clearMessageStateTimeouts() {
        for (const message of this.messageStates.values()) {
            this._clearTimeout(message.timeout);
        }
    }
    _clearHeartbeatTimeout() {
        this._clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = undefined;
    }
    _clearKeepaliveTimeout() {
        this._clearTimeout(this.keepaliveTimeout);
        this.keepaliveTimeout = undefined;
    }
    _clearConnectTimeout() {
        this._clearTimeout(this.connectTimeout);
        this.connectTimeout = undefined;
    }
    _clearLookupTimeout() {
        this._clearTimeout(this.lookupTimeout);
        this.lookupTimeout = undefined;
    }
    _clearLookupRetryTimeout() {
        this._clearTimeout(this.lookupRetryTimeout);
        this.lookupRetryTimeout = undefined;
    }
    _clearESDDisconnectTimeout() {
        this._clearTimeout(this.esdDisconnectTimeout);
        this.esdDisconnectTimeout = undefined;
    }
    _disconnected() {
        this._clearHeartbeatTimeout();
        this._clearKeepaliveTimeout();
        this._clearLookupRetryTimeout();
        this._clearLookupTimeout();
        this._clearConnectTimeout();
        this._clearESDDisconnectTimeout();
        if (this.currentMessageState[types_1.P2PDataType.VIDEO].p2pStreaming) {
            this.endStream(types_1.P2PDataType.VIDEO);
        }
        if (this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreaming) {
            this.endStream(types_1.P2PDataType.BINARY);
        }
        for (const channel in this.currentMessageState[types_1.P2PDataType.DATA].rtspStreaming) {
            this.endRTSPStream(Number.parseInt(channel));
        }
        if (this.connected) {
            this.emit("close");
        }
        else if (!this.terminating) {
            this.emit("timeout");
        }
        this._initialize();
    }
    closeEnergySavingDevice() {
        if (this.messageStates.size === 0 && this.sendQueue.length === 0 && this.energySavingDevice) {
            if (this.esdDisconnectTimeout) {
                this.esdDisconnectTimeout = setTimeout(() => {
                    this.esdDisconnectTimeout = undefined;
                    (0, utils_1.sendMessage)(this.socket, this.connectAddress, types_1.RequestMessageType.END).catch((error) => {
                        this.log.error(`Station ${this.rawStation.station_sn} - Error`, error);
                    });
                    this._disconnected();
                }, this.ESD_DISCONNECT_TIMEOUT);
            }
        }
    }
    renewDSKKey() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dskKey === "" || (this.dskExpiration && (new Date()).getTime() >= this.dskExpiration.getTime())) {
                this.log.debug(`Station ${this.rawStation.station_sn} DSK keys not present or expired, get/renew it`, { dskKey: this.dskKey, dskExpiration: this.dskExpiration });
                yield this.getDSKKeys();
            }
        });
    }
    lookup() {
        if (this.connectionType == types_1.P2PConnectionType.ONLY_LOCAL) {
            this.loockupByLocalAddress(this.localAddress);
        }
        else {
            this.fallbackAddresses = [];
            this.cloudAddresses.map((address) => this.lookupByAddress(address));
            this.cloudAddresses.map((address) => this.lookupByAddress2(address));
        }
        this._clearLookupTimeout();
        this._clearLookupRetryTimeout();
        this.lookupTimeout = setTimeout(() => {
            this.lookupTimeout = undefined;
            if (this.connectionType == types_1.P2PConnectionType.ONLY_LOCAL) {
                this.log.error(`${this.constructor.name}.lookup(): station: ${this.rawStation.station_sn} - Address lookup failed.`);
            }
            else {
                this.log.error(`${this.constructor.name}.lookup(): station: ${this.rawStation.station_sn} - All address lookup tentatives failed.`);
            }
            this._disconnected();
        }, this.MAX_LOOKUP_TIMEOUT);
    }
    lookup2(origAddress, data) {
        this.cloudAddresses.map((address) => this.lookupByAddress3(address, origAddress, data));
    }
    lookupByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            // Send lookup message
            const msgId = types_1.RequestMessageType.LOOKUP_WITH_KEY;
            const payload = (0, utils_1.buildLookupWithKeyPayload)(this.socket, this.rawStation.p2p_did, this.dskKey);
            (0, utils_1.sendMessage)(this.socket, address, msgId, payload).catch((error) => {
                this.log.error(`Lookup addresses for station ${this.rawStation.station_sn} - Error:`, error);
            });
        });
    }
    lookupByAddress2(address) {
        return __awaiter(this, void 0, void 0, function* () {
            // Send lookup message2
            const msgId = types_1.RequestMessageType.LOOKUP_WITH_KEY2;
            const payload = (0, utils_1.buildLookupWithKeyPayload2)(this.rawStation.p2p_did, this.dskKey);
            (0, utils_1.sendMessage)(this.socket, address, msgId, payload).catch((error) => {
                this.log.error(`Lookup addresses for station ${this.rawStation.station_sn} - Error:`, error);
            });
        });
    }
    lookupByAddress3(address, origAddress, data) {
        // Send lookup message3
        const msgId = types_1.RequestMessageType.LOOKUP_WITH_KEY3;
        const payload = (0, utils_1.buildLookupWithKeyPayload3)(this.rawStation.p2p_did, origAddress, data);
        (0, utils_1.sendMessage)(this.socket, address, msgId, payload).catch((error) => {
            this.log.error(`Lookup addresses for station ${this.rawStation.station_sn} - Error:`, error);
        });
    }
    loockupByLocalAddress(host) {
        var address = { host: host, port: 32108 };
        const msgId = types_1.RequestMessageType.LOCAL_LOOKUP;
        const payload = Buffer.from([0, 0]);
        (0, utils_1.sendMessage)(this.socket, address, msgId, payload).catch((error) => {
            this.log.error(`Lookup address local for station ${this.rawStation.station_sn} - Error: ${error}`);
        });
    }
    isConnected() {
        return this.connected;
    }
    _startConnectTimeout() {
        if (this.connectTimeout === undefined)
            this.connectTimeout = setTimeout(() => {
                if (this.connectionType === types_1.P2PConnectionType.PREFER_LOCAL) {
                    if (this.fallbackAddresses.length > 0) {
                        this.connectTimeout = undefined;
                        const tmp_addresses = this.fallbackAddresses;
                        this.fallbackAddresses = [];
                        for (const addr of tmp_addresses) {
                            this.log.debug(`Station ${this.rawStation.station_sn} - PREFER_LOCAL - Try to connect to remote address ${addr.host}:${addr.port}...`);
                            this._connect({ host: addr.host, port: addr.port });
                        }
                        return;
                    }
                }
                this.log.warn(`Station ${this.rawStation.station_sn} - Tried all hosts, no connection could be established`);
                this._disconnected();
            }, this.MAX_AKNOWLEDGE_TIMEOUT);
    }
    _connect(address) {
        this.log.debug(`Station ${this.rawStation.station_sn} - CHECK_CAM - Connecting to host ${address.host} on port ${address.port}...`);
        for (let i = 0; i < 4; i++)
            this.sendCamCheck(address);
        this._startConnectTimeout();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected && !this.connecting) {
                this.connecting = true;
                this.terminating = false;
                yield this.renewDSKKey();
                if (!this.binded)
                    this.socket.bind(this.localPort, () => {
                        this.binded = true;
                        try {
                            this.socket.setRecvBufferSize(this.UDP_RECVBUFFERSIZE_BYTES);
                        }
                        catch (error) {
                            this.log.error(`Station ${this.rawStation.station_sn} - Error:`, { error: error, currentRecBufferSize: this.socket.getRecvBufferSize(), recBufferRequestedSize: this.UDP_RECVBUFFERSIZE_BYTES });
                        }
                        this.lookup();
                    });
                else
                    this.lookup();
            }
        });
    }
    sendCamCheck(address) {
        const payload = (0, utils_1.buildCheckCamPayload)(this.rawStation.p2p_did);
        (0, utils_1.sendMessage)(this.socket, address, types_1.RequestMessageType.CHECK_CAM, payload).catch((error) => {
            this.log.error(`Send cam check to station ${this.rawStation.station_sn} - Error:`, error);
        });
    }
    sendCamCheck2(address, data) {
        const payload = (0, utils_1.buildCheckCamPayload2)(this.rawStation.p2p_did, data);
        (0, utils_1.sendMessage)(this.socket, address, types_1.RequestMessageType.CHECK_CAM2, payload).catch((error) => {
            this.log.error(`Send cam check to station ${this.rawStation.station_sn} - Error:`, error);
        });
    }
    sendPing(address) {
        if ((this.lastPong && ((new Date().getTime() - this.lastPong) / this.getHeartbeatInterval() >= this.MAX_RETRIES)) ||
            (this.connectTime && !this.lastPong && ((new Date().getTime() - this.connectTime) / this.getHeartbeatInterval() >= this.MAX_RETRIES))) {
            this.log.warn(`Station ${this.rawStation.station_sn} - Heartbeat check failed. Connection seems lost. Try to reconnect...`);
            this._disconnected();
        }
        (0, utils_1.sendMessage)(this.socket, address, types_1.RequestMessageType.PING).catch((error) => {
            this.log.error(`Station ${this.rawStation.station_sn} - Error:`, error);
        });
    }
    sendCommandWithIntString(commandType, value, valueSub = 0, strValue = "", strValueSub = "", channel = 0) {
        const payload = (0, utils_1.buildIntStringCommandPayload)(value, valueSub, strValue, strValueSub, channel);
        if (commandType === types_1.CommandType.CMD_NAS_TEST) {
            this.currentMessageState[types_1.P2PDataType.DATA].rtspStream[channel] = value === 1 ? true : false;
        }
        this.sendCommand(commandType, payload, channel);
    }
    sendCommandWithInt(commandType, value, strValue = "", channel = 255) {
        const payload = (0, utils_1.buildIntCommandPayload)(value, strValue, channel);
        this.sendCommand(commandType, payload, channel);
    }
    sendCommandWithStringPayload(commandType, value, channel = 0) {
        const payload = (0, utils_1.buildCommandWithStringTypePayload)(value, channel);
        let nested_commandType = undefined;
        if (commandType == types_1.CommandType.CMD_SET_PAYLOAD) {
            try {
                const json = JSON.parse(value);
                nested_commandType = json.cmd;
            }
            catch (error) {
                this.log.error(`CMD_SET_PAYLOAD - Station ${this.rawStation.station_sn} - Error:`, error);
            }
        }
        else if (commandType == types_1.CommandType.CMD_DOORBELL_SET_PAYLOAD) {
            try {
                const json = JSON.parse(value);
                nested_commandType = json.commandType;
            }
            catch (error) {
                this.log.error(`CMD_DOORBELL_SET_PAYLOAD - Station ${this.rawStation.station_sn} - Error:`, error);
            }
        }
        this.sendCommand(commandType, payload, channel, nested_commandType);
    }
    sendCommandWithString(commandType, strValue, strValueSub, channel = 255) {
        const payload = (0, utils_1.buildStringTypeCommandPayload)(strValue, strValueSub, channel);
        this.sendCommand(commandType, payload, channel, commandType);
    }
    sendCommandPing(channel = 255) {
        const payload = (0, utils_1.buildPingCommandPayload)(channel);
        this.sendCommand(types_1.CommandType.CMD_PING, payload, channel);
    }
    sendQueuedMessage() {
        if (this.sendQueue.length > 0 && this.connected) {
            if (this.messageStates.size === 0) {
                this._sendCommand(this.sendQueue.shift());
            }
            else if (this.messageStates.size > 0) {
                let queuedMessage;
                while ((queuedMessage = this.sendQueue.shift()) !== undefined) {
                    let exists = false;
                    this.messageStates.forEach(stateMessage => {
                        if (stateMessage.commandType === queuedMessage.commandType && stateMessage.nestedCommandType === queuedMessage.nestedCommandType) {
                            exists = true;
                        }
                    });
                    if (!exists) {
                        this._sendCommand(queuedMessage);
                    }
                    else {
                        this.sendQueue.unshift(queuedMessage);
                        break;
                    }
                }
            }
        }
        else if (!this.connected) {
            this.connect();
        }
    }
    sendCommand(commandType, payload, channel, nestedCommandType) {
        const message = {
            commandType: commandType,
            nestedCommandType: nestedCommandType,
            channel: channel,
            payload: payload,
            timestamp: +new Date,
        };
        this.sendQueue.push(message);
        this.sendQueuedMessage();
    }
    _sendCommand(message) {
        var _a;
        if ((0, utils_1.isP2PQueueMessage)(message)) {
            const ageing = +new Date - message.timestamp;
            if (ageing <= this.MAX_COMMAND_CONNECT_TIMEOUT) {
                const msgSeqNumber = this.seqNumber++;
                const commandHeader = (0, utils_1.buildCommandHeader)(msgSeqNumber, message.commandType);
                const data = Buffer.concat([commandHeader, message.payload]);
                const messageState = {
                    sequence: msgSeqNumber,
                    commandType: message.commandType,
                    nestedCommandType: message.nestedCommandType,
                    channel: message.channel,
                    data: data,
                    retries: 0,
                    acknowledged: false,
                    returnCode: types_1.ErrorCode.ERROR_COMMAND_TIMEOUT
                };
                message = messageState;
            }
            else {
                this.log.warn(`Station ${this.rawStation.station_sn} - Command aged out from queue`, { commandType: message.commandType, nestedCommandType: message.nestedCommandType, channel: message.channel, ageing: ageing, maxAgeing: this.MAX_COMMAND_CONNECT_TIMEOUT });
                this.emit("command", {
                    command_type: message.nestedCommandType !== undefined ? message.nestedCommandType : message.commandType,
                    channel: message.channel,
                    return_code: types_1.ErrorCode.ERROR_CONNECT_TIMEOUT,
                });
                return;
            }
        }
        else {
            if (message.retries < this.MAX_RETRIES && message.returnCode !== types_1.ErrorCode.ERROR_CONNECT_TIMEOUT) {
                if (message.returnCode === types_1.ErrorCode.ERROR_FAILED_TO_REQUEST) {
                    this.messageStates.delete(message.sequence);
                    message.sequence = this.seqNumber++;
                    message.data.writeUInt16BE(message.sequence, 2);
                    this.messageStates.set(message.sequence, message);
                }
                message.retries++;
            }
            else {
                this.log.error(`Station ${this.rawStation.station_sn} - Max retries ${(_a = this.messageStates.get(message.sequence)) === null || _a === void 0 ? void 0 : _a.retries} - stop with error ${types_1.ErrorCode[message.returnCode]}`, { sequence: message.sequence, commandType: message.commandType, channel: message.channel, retries: message.retries, returnCode: message.returnCode });
                this.emit("command", {
                    command_type: message.nestedCommandType !== undefined ? message.nestedCommandType : message.commandType,
                    channel: message.channel,
                    return_code: message.returnCode
                });
                this.messageStates.delete(message.sequence);
                this.sendQueuedMessage();
                return;
            }
        }
        message = message;
        message.returnCode = types_1.ErrorCode.ERROR_COMMAND_TIMEOUT;
        message.timeout = setTimeout(() => {
            this._sendCommand(message);
        }, this.MAX_AKNOWLEDGE_TIMEOUT);
        this.messageStates.set(message.sequence, message);
        this.log.debug("Sending p2p command...", { station: this.rawStation.station_sn, sequence: message.sequence, commandType: message.commandType, channel: message.channel, retries: message.retries, messageStatesSize: this.messageStates.size });
        (0, utils_1.sendMessage)(this.socket, this.connectAddress, types_1.RequestMessageType.DATA, message.data).catch((error) => {
            this.log.error(`Station ${this.rawStation.station_sn} - Error:`, error);
        });
        if (message.retries === 0) {
            if (message.commandType === types_1.CommandType.CMD_START_REALTIME_MEDIA ||
                (message.nestedCommandType !== undefined && message.nestedCommandType === types_1.CommandType.CMD_START_REALTIME_MEDIA && message.commandType === types_1.CommandType.CMD_SET_PAYLOAD) ||
                message.commandType === types_1.CommandType.CMD_RECORD_VIEW ||
                (message.nestedCommandType !== undefined && message.nestedCommandType === 1000 && message.commandType === types_1.CommandType.CMD_DOORBELL_SET_PAYLOAD)) {
                if (this.currentMessageState[types_1.P2PDataType.VIDEO].p2pStreaming && message.channel !== this.currentMessageState[types_1.P2PDataType.VIDEO].p2pStreamChannel) {
                    this.endStream(types_1.P2PDataType.VIDEO);
                }
                this.currentMessageState[types_1.P2PDataType.VIDEO].p2pStreaming = true;
                this.currentMessageState[types_1.P2PDataType.VIDEO].p2pStreamChannel = message.channel;
            }
            else if (message.commandType === types_1.CommandType.CMD_DOWNLOAD_VIDEO) {
                if (this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreaming && message.channel !== this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreamChannel) {
                    this.endStream(types_1.P2PDataType.BINARY);
                }
                this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreaming = true;
                this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreamChannel = message.channel;
            }
            else if (message.commandType === types_1.CommandType.CMD_STOP_REALTIME_MEDIA) { //TODO: CommandType.CMD_RECORD_PLAY_CTRL only if stop
                this.endStream(types_1.P2PDataType.VIDEO);
            }
            else if (message.commandType === types_1.CommandType.CMD_DOWNLOAD_CANCEL) {
                this.endStream(types_1.P2PDataType.BINARY);
            }
            else if (message.commandType === types_1.CommandType.CMD_NAS_TEST) {
                if (this.currentMessageState[types_1.P2PDataType.DATA].rtspStream[message.channel]) {
                    this.currentMessageState[types_1.P2PDataType.DATA].rtspStreaming[message.channel] = true;
                    this.emit("rtsp livestream started", message.channel);
                }
                else {
                    this.endRTSPStream(message.channel);
                }
            }
        }
    }
    handleMsg(msg, rinfo) {
        if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.LOOKUP_ADDR)) {
            const port = msg.slice(6, 8).readUInt16LE();
            const ip = `${msg[11]}.${msg[10]}.${msg[9]}.${msg[8]}`;
            this.log.debug(`Station ${this.rawStation.station_sn} - LOOKUP_ADDR - Got response`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { ip: ip, port: port } });
            if (ip === "0.0.0.0") {
                this.log.debug(`Station ${this.rawStation.station_sn} - LOOKUP_ADDR - Got invalid ip address 0.0.0.0, ignoring response...`);
                return;
            }
            if (!this.connected) {
                if (this.connectionType === types_1.P2PConnectionType.PREFER_LOCAL) {
                    this._clearLookupTimeout();
                    this._clearLookupRetryTimeout();
                    if ((0, utils_1.isPrivateIp)(ip)) {
                        this.log.debug(`Station ${this.rawStation.station_sn} - PREFER_LOCAL - Try to connect to ${ip}:${port}...`);
                        this._connect({ host: ip, port: port });
                    }
                    else {
                        this.log.debug(`Station ${this.rawStation.station_sn} - PREFER_LOCAL - Got public IP, remember ${ip}:${port}...`);
                        if (!this.fallbackAddresses.includes({ host: ip, port: port }))
                            this.fallbackAddresses.push({ host: ip, port: port });
                        this._startConnectTimeout();
                    }
                }
                else if (this.connectionType === types_1.P2PConnectionType.ONLY_LOCAL) {
                    if ((0, utils_1.isPrivateIp)(ip)) {
                        this._clearLookupTimeout();
                        this._clearLookupRetryTimeout();
                        this.log.debug(`Station ${this.rawStation.station_sn} - ONLY_LOCAL - Try to connect to ${ip}:${port}...`);
                        this._connect({ host: ip, port: port });
                    }
                }
                else if (this.connectionType === types_1.P2PConnectionType.QUICKEST) {
                    this._clearLookupTimeout();
                    this._clearLookupRetryTimeout();
                    this.log.debug(`Station ${this.rawStation.station_sn} - QUICKEST - Try to connect to ${ip}:${port}...`);
                    this._connect({ host: ip, port: port });
                }
            }
            else {
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.CAM_ID) || (0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.CAM_ID2)) {
            // Answer from the device to a CAM_CHECK message
            if (!this.connected) {
                this.log.debug(`Station ${this.rawStation.station_sn} - CAM_ID - Connected to station ${this.rawStation.station_sn} on host ${rinfo.address} port ${rinfo.port}`);
                this._clearLookupRetryTimeout();
                this._clearLookupTimeout();
                this._clearConnectTimeout();
                this.connected = true;
                this.connectTime = new Date().getTime();
                this.lastPong = null;
                this.connectAddress = { host: rinfo.address, port: rinfo.port };
                this.heartbeatTimeout = setTimeout(() => {
                    this.scheduleHeartbeat();
                }, this.getHeartbeatInterval());
                if (this.energySavingDevice) {
                    this.keepaliveTimeout = setTimeout(() => {
                        this.scheduleP2PKeepalive();
                    }, this.KEEPALIVE_INTERVAL);
                }
                this.emit("connect", this.connectAddress);
                this.sendQueuedMessage();
            }
            else {
                this.log.debug(`Station ${this.rawStation.station_sn} - CAM_ID - Already connected, ignoring...`);
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.PONG)) {
            // Response to a ping from our side
            this.lastPong = new Date().getTime();
            return;
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.PING)) {
            // Response with PONG to keep alive
            (0, utils_1.sendMessage)(this.socket, { host: rinfo.address, port: rinfo.port }, types_1.RequestMessageType.PONG).catch((error) => {
                this.log.error(`Station ${this.rawStation.station_sn} - Error:`, error);
            });
            return;
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.END)) {
            // Connection is closed by device
            this.log.debug(`Station ${this.rawStation.station_sn} - END - received from host ${rinfo.address}:${rinfo.port}`);
            //this._disconnected();
            this.onClose();
            return;
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.ACK)) {
            // Device ACK a message from our side
            // Number of Acks sended in the message
            const dataTypeBuffer = msg.slice(4, 6);
            const dataType = this.getDataType(dataTypeBuffer);
            const numAcksBuffer = msg.slice(6, 8);
            const numAcks = numAcksBuffer.readUIntBE(0, numAcksBuffer.length);
            for (let i = 1; i <= numAcks; i++) {
                const idx = 6 + i * 2;
                const seqBuffer = msg.slice(idx, idx + 2);
                const ackedSeqNo = seqBuffer.readUIntBE(0, seqBuffer.length);
                // -> Message with seqNo was received at the station
                this.log.debug(`Station ${this.rawStation.station_sn} - ACK ${types_1.P2PDataType[dataType]} - received from host ${rinfo.address}:${rinfo.port} for sequence ${ackedSeqNo}`);
                const msg_state = this.messageStates.get(ackedSeqNo);
                if (msg_state && !msg_state.acknowledged) {
                    this._clearTimeout(msg_state.timeout);
                    if (msg_state.commandType === types_1.CommandType.CMD_PING) {
                        this.messageStates.delete(ackedSeqNo);
                    }
                    else {
                        msg_state.acknowledged = true;
                        msg_state.timeout = setTimeout(() => {
                            this.log.warn(`Station ${this.rawStation.station_sn} - Result data for command not received`, { message: msg_state });
                            this.messageStates.delete(ackedSeqNo);
                            this.emit("command", {
                                command_type: msg_state.nestedCommandType !== undefined ? msg_state.nestedCommandType : msg_state.commandType,
                                channel: msg_state.channel,
                                return_code: types_1.ErrorCode.ERROR_COMMAND_TIMEOUT
                            });
                            this.sendQueuedMessage();
                            this.closeEnergySavingDevice();
                        }, this.MAX_COMMAND_RESULT_WAIT);
                        this.messageStates.set(ackedSeqNo, msg_state);
                    }
                }
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.DATA)) {
            const seqNo = msg.slice(6, 8).readUInt16BE();
            const dataTypeBuffer = msg.slice(4, 6);
            const dataType = this.getDataType(dataTypeBuffer);
            const message = {
                bytesToRead: msg.slice(2, 4).readUInt16BE(),
                type: dataType,
                seqNo: seqNo,
                data: msg.slice(8)
            };
            this.sendAck({ host: rinfo.address, port: rinfo.port }, dataTypeBuffer, seqNo);
            this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[message.type]} - received from host ${rinfo.address}:${rinfo.port} - Processing sequence ${message.seqNo}...`);
            if (message.seqNo === this.expectedSeqNo[dataType]) {
                const timeout = this.currentMessageState[dataType].waitForSeqNoTimeout;
                if (!!timeout) {
                    clearTimeout(timeout);
                    this.currentMessageState[dataType].waitForSeqNoTimeout = undefined;
                }
                // expected seq packet arrived
                this.expectedSeqNo[dataType]++;
                this.parseDataMessage(message);
                this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[message.type]} - Received expected sequence (seqNo: ${message.seqNo} queuedData.size: ${this.currentMessageState[dataType].queuedData.size})`);
                for (const element of this.currentMessageState[dataType].queuedData.values()) {
                    if (this.expectedSeqNo[dataType] === element.seqNo) {
                        this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[element.type]} - Work off queued data (seqNo: ${element.seqNo} queuedData.size: ${this.currentMessageState[dataType].queuedData.size})`);
                        this.expectedSeqNo[dataType]++;
                        this.parseDataMessage(element);
                        this.currentMessageState[dataType].queuedData.delete(element.seqNo);
                    }
                    else {
                        this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[element.type]} - Work off missing data interrupt queue dismantle (seqNo: ${element.seqNo} queuedData.size: ${this.currentMessageState[dataType].queuedData.size})`);
                        break;
                    }
                }
            }
            else if (this.expectedSeqNo[dataType] > message.seqNo) {
                // We have already seen this message, skip!
                // This can happen because the device is sending the message till it gets a ACK
                // which can take some time.
                this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[message.type]} - Received already processed sequence (seqNo: ${message.seqNo} queuedData.size: ${this.currentMessageState[dataType].queuedData.size})`);
                return;
            }
            else {
                if (!this.currentMessageState[dataType].waitForSeqNoTimeout)
                    this.currentMessageState[dataType].waitForSeqNoTimeout = setTimeout(() => {
                        //TODO: End stream doesn't stop device for sending video and audio data
                        this.endStream(dataType);
                        this.currentMessageState[dataType].waitForSeqNoTimeout = undefined;
                    }, this.MAX_EXPECTED_SEQNO_WAIT);
                if (!this.currentMessageState[dataType].queuedData.get(message.seqNo)) {
                    this.currentMessageState[dataType].queuedData.set(message.seqNo, message);
                    this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[message.type]} - Received not expected sequence, added to the queue for future processing (seqNo: ${message.seqNo} queuedData.size: ${this.currentMessageState[dataType].queuedData.size})`);
                }
                else {
                    this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[message.type]} - Received not expected sequence, discarded since already present in queue for future processing (seqNo: ${message.seqNo} queuedData.size: ${this.currentMessageState[dataType].queuedData.size})`);
                }
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.LOOKUP_ADDR2)) {
            if (!this.connected) {
                const port = msg.slice(6, 8).readUInt16LE();
                const ip = `${msg[11]}.${msg[10]}.${msg[9]}.${msg[8]}`;
                const data = msg.slice(20, 24);
                this._clearLookupTimeout();
                this._clearLookupRetryTimeout();
                this.log.debug(`Station ${this.rawStation.station_sn} - LOOKUP_ADDR2 - Got response`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { ip: ip, port: port, data: data.toString("hex") } });
                this.log.debug(`Station ${this.rawStation.station_sn} - CHECK_CAM2 - Connecting to host ${ip} on port ${port}...`);
                for (let i = 0; i < 4; i++)
                    this.sendCamCheck2({ host: ip, port: port }, data);
                this._startConnectTimeout();
                (0, utils_1.sendMessage)(this.socket, { host: ip, port: port }, types_1.RequestMessageType.UNKNOWN_70).catch((error) => {
                    this.log.error(`Station ${this.rawStation.station_sn} - UNKNOWN_70 - Error:`, error);
                });
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.LOCAL_LOOKUP_RESP)) {
            if (!this.connected) {
                this._clearLookupTimeout();
                const port = rinfo.port;
                const ip = rinfo.address;
                const data = msg.slice(20, 24);
                this.log.debug(`Station: ${this.rawStation.station_sn} - LOCAL_LOOKUP - Got response`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { ip: ip, port: port, data: data.toString("hex") } });
                for (let i = 0; i < 4; i++)
                    this.sendCamCheck({ host: ip, port: port });
                this._startConnectTimeout();
                (0, utils_1.sendMessage)(this.socket, { host: ip, port: port }, types_1.RequestMessageType.UNKNOWN_70).catch((error) => {
                    this.log.error(`Station ${this.rawStation.station_sn} - UNKNOWN_70 - Error:`, error);
                });
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.UNKNOWN_71)) {
            if (!this.connected) {
                this.log.debug(`Station ${this.rawStation.station_sn} - UNKNOWN_71 - Got response`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { message: msg.toString("hex"), length: msg.length } });
                (0, utils_1.sendMessage)(this.socket, { host: rinfo.address, port: rinfo.port }, types_1.RequestMessageType.UNKNOWN_71).catch((error) => {
                    this.log.error(`Station ${this.rawStation.station_sn} - UNKNOWN_71 - Error:`, error);
                });
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.UNKNOWN_73)) {
            if (!this.connected) {
                const port = msg.slice(8, 10).readUInt16BE();
                const data = msg.slice(4, 8);
                this.log.debug(`Station ${this.rawStation.station_sn} - UNKNOWN_73 - Got response`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { port: port, data: data.toString("hex") } });
                this.lookup2({ host: rinfo.address, port: port }, data);
            }
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.UNKNOWN_81) || (0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.UNKNOWN_83)) {
            // Do nothing / ignore
        }
        else if ((0, utils_1.hasHeader)(msg, types_1.ResponseMessageType.LOOKUP_RESP)) {
            if (!this.connected) {
                const responseCode = msg.slice(4, 6).readUInt16LE();
                this.log.debug(`Station ${this.rawStation.station_sn} - LOOKUP_RESP - Got response`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { responseCode: responseCode } });
                if (responseCode !== 0 && this.lookupTimeout !== undefined && this.lookupRetryTimeout === undefined) {
                    this.lookupRetryTimeout = setTimeout(() => {
                        this.lookupRetryTimeout = undefined;
                        this.cloudAddresses.map((address) => this.lookupByAddress(address));
                    }, this.LOOKUP_RETRY_TIMEOUT);
                }
            }
        }
        else {
            this.log.debug(`Station ${this.rawStation.station_sn} - received unknown message`, { remoteAddress: rinfo.address, remotePort: rinfo.port, response: { message: msg.toString("hex"), length: msg.length } });
        }
    }
    parseDataMessage(message) {
        if ((message.type === types_1.P2PDataType.BINARY || message.type === types_1.P2PDataType.VIDEO) && !this.currentMessageState[message.type].p2pStreaming) {
            this.log.debug(`Station ${this.rawStation.station_sn} - DATA ${types_1.P2PDataType[message.type]} - Stream not started ignore this data`, { seqNo: message.seqNo, header: this.currentMessageBuilder[message.type].header, bytesRead: this.currentMessageBuilder[message.type].bytesRead, bytesToRead: this.currentMessageBuilder[message.type].header.bytesToRead, messageSize: message.data.length });
        }
        else {
            if (this.currentMessageState[message.type].leftoverData.length > 0) {
                message.data = Buffer.concat([this.currentMessageState[message.type].leftoverData, message.data]);
                this.currentMessageState[message.type].leftoverData = Buffer.from([]);
            }
            let data = message.data;
            do {
                // is this the first message?
                const firstPartMessage = data.slice(0, 4).toString() === utils_1.MAGIC_WORD;
                if (firstPartMessage) {
                    const header = {
                        commandId: 0,
                        bytesToRead: 0,
                        channel: 0,
                        signCode: 0,
                        type: 0
                    };
                    header.commandId = data.slice(4, 6).readUIntLE(0, 2);
                    header.bytesToRead = data.slice(6, 10).readUIntLE(0, 4);
                    header.channel = data.slice(12, 13).readUInt8();
                    header.signCode = data.slice(13, 14).readInt8();
                    header.type = data.slice(14, 15).readUInt8();
                    this.currentMessageBuilder[message.type].header = header;
                    data = data.slice(this.P2P_DATA_HEADER_BYTES);
                    if (data.length >= header.bytesToRead) {
                        const payload = data.slice(0, header.bytesToRead);
                        this.currentMessageBuilder[message.type].messages[message.seqNo] = payload;
                        this.currentMessageBuilder[message.type].bytesRead = payload.byteLength;
                        data = data.slice(header.bytesToRead);
                        if (data.length <= this.P2P_DATA_HEADER_BYTES) {
                            this.currentMessageState[message.type].leftoverData = data;
                            data = Buffer.from([]);
                        }
                    }
                    else {
                        if (data.length <= this.P2P_DATA_HEADER_BYTES) {
                            this.currentMessageState[message.type].leftoverData = data;
                        }
                        else {
                            this.currentMessageBuilder[message.type].messages[message.seqNo] = data;
                            this.currentMessageBuilder[message.type].bytesRead = data.byteLength;
                        }
                        data = Buffer.from([]);
                    }
                }
                else {
                    // finish message and print
                    if (this.currentMessageBuilder[message.type].header.bytesToRead - this.currentMessageBuilder[message.type].bytesRead < data.length) {
                        const payload = data.slice(0, this.currentMessageBuilder[message.type].header.bytesToRead - this.currentMessageBuilder[message.type].bytesRead);
                        this.currentMessageBuilder[message.type].messages[message.seqNo] = payload;
                        this.currentMessageBuilder[message.type].bytesRead += payload.byteLength;
                        data = data.slice(payload.byteLength);
                        if (data.length <= this.P2P_DATA_HEADER_BYTES) {
                            this.currentMessageState[message.type].leftoverData = data;
                            data = Buffer.from([]);
                        }
                    }
                    else {
                        if (data.length <= this.P2P_DATA_HEADER_BYTES) {
                            this.currentMessageState[message.type].leftoverData = data;
                        }
                        else {
                            this.currentMessageBuilder[message.type].messages[message.seqNo] = data;
                            this.currentMessageBuilder[message.type].bytesRead += data.byteLength;
                        }
                        data = Buffer.from([]);
                    }
                }
                this.log.debug(`Station ${this.rawStation.station_sn} - Received data`, { seqNo: message.seqNo, header: this.currentMessageBuilder[message.type].header, bytesRead: this.currentMessageBuilder[message.type].bytesRead, bytesToRead: this.currentMessageBuilder[message.type].header.bytesToRead, firstPartMessage: firstPartMessage, messageSize: message.data.length });
                if (this.currentMessageBuilder[message.type].bytesRead === this.currentMessageBuilder[message.type].header.bytesToRead) {
                    const completeMessage = (0, utils_1.sortP2PMessageParts)(this.currentMessageBuilder[message.type].messages);
                    const data_message = Object.assign(Object.assign({}, this.currentMessageBuilder[message.type].header), { 
                        //TODO: Check if this is the correct approach
                        seqNo: message.seqNo, dataType: message.type, data: completeMessage });
                    this.handleData(data_message);
                    this.initializeMessageBuilder(message.type);
                }
            } while (data.length > 0);
        }
    }
    handleData(message) {
        if (message.dataType === types_1.P2PDataType.CONTROL) {
            this.handleDataControl(message);
        }
        else if (message.dataType === types_1.P2PDataType.DATA) {
            const commandStr = types_1.CommandType[message.commandId];
            const result_msg = message.type === 1 ? true : false;
            if (result_msg) {
                const return_code = message.data.slice(0, 4).readUInt32LE() | 0;
                const return_msg = message.data.slice(4, 4 + 128).toString();
                const error_codeStr = types_1.ErrorCode[return_code];
                this.log.debug(`Station ${this.rawStation.station_sn} - Received data`, { commandIdName: commandStr, commandId: message.commandId, resultCodeName: error_codeStr, resultCode: return_code, message: return_msg, data: message.data.toString("hex") });
                const msg_state = this.messageStates.get(message.seqNo);
                if (msg_state) {
                    if (msg_state.commandType === message.commandId) {
                        this._clearTimeout(msg_state.timeout);
                        const command_type = msg_state.nestedCommandType !== undefined ? msg_state.nestedCommandType : msg_state.commandType;
                        this.log.debug(`Station ${this.rawStation.station_sn} - Result data for command received`, { messageState: msg_state, resultCodeName: error_codeStr, resultCode: return_code });
                        if (return_code === types_1.ErrorCode.ERROR_FAILED_TO_REQUEST) {
                            msg_state.returnCode = return_code;
                            this._sendCommand(msg_state);
                        }
                        else {
                            this.emit("command", {
                                command_type: command_type,
                                channel: msg_state.channel,
                                return_code: return_code
                            });
                            this.messageStates.delete(message.seqNo);
                            this.sendQueuedMessage();
                            this.closeEnergySavingDevice();
                            if (msg_state.commandType === types_1.CommandType.CMD_START_REALTIME_MEDIA ||
                                (msg_state.nestedCommandType !== undefined && msg_state.nestedCommandType === types_1.CommandType.CMD_START_REALTIME_MEDIA && msg_state.commandType === types_1.CommandType.CMD_SET_PAYLOAD) ||
                                msg_state.commandType === types_1.CommandType.CMD_RECORD_VIEW ||
                                (msg_state.nestedCommandType !== undefined && msg_state.nestedCommandType === 1000 && msg_state.commandType === types_1.CommandType.CMD_DOORBELL_SET_PAYLOAD)) {
                                this.waitForStreamData(types_1.P2PDataType.VIDEO);
                            }
                            else if (msg_state.commandType === types_1.CommandType.CMD_DOWNLOAD_VIDEO) {
                                this.waitForStreamData(types_1.P2PDataType.BINARY);
                            }
                        }
                    }
                    else {
                        this.log.debug(`Station ${this.rawStation.station_sn} - dataType: ${types_1.P2PDataType[message.dataType]} commandtype and sequencenumber different!`);
                    }
                }
                else {
                    this.log.debug(`Station ${this.rawStation.station_sn} - dataType: ${types_1.P2PDataType[message.dataType]} sequence: ${message.seqNo} not present!`);
                }
            }
            else {
                this.log.debug(`Station ${this.rawStation.station_sn} - Unsupported response`, { dataType: types_1.P2PDataType[message.dataType], commandIdName: commandStr, commandId: message.commandId, message: message.data.toString("hex") });
            }
        }
        else if (message.dataType === types_1.P2PDataType.VIDEO || message.dataType === types_1.P2PDataType.BINARY) {
            this.handleDataBinaryAndVideo(message);
        }
        else {
            this.log.debug(`Station ${this.rawStation.station_sn} - Not implemented data type`, { seqNo: message.seqNo, dataType: message.dataType, commandId: message.commandId, message: message.data.toString("hex") });
        }
    }
    isIFrame(data, isKeyFrame) {
        if (this.rawStation.station_sn.startsWith("T8410") || this.rawStation.station_sn.startsWith("T8400") || this.rawStation.station_sn.startsWith("T8401") || this.rawStation.station_sn.startsWith("T8411") ||
            this.rawStation.station_sn.startsWith("T8202") || this.rawStation.station_sn.startsWith("T8422") || this.rawStation.station_sn.startsWith("T8424") || this.rawStation.station_sn.startsWith("T8423") ||
            this.rawStation.station_sn.startsWith("T8130") || this.rawStation.station_sn.startsWith("T8131") || this.rawStation.station_sn.startsWith("T8420") || this.rawStation.station_sn.startsWith("T8440") ||
            this.rawStation.station_sn.startsWith("T8441") || this.rawStation.station_sn.startsWith("T8442") || (0, utils_1.checkT8420)(this.rawStation.station_sn)) {
            //TODO: Need to add battery doorbells as seen in source => T8210,T8220,T8221,T8222
            return isKeyFrame;
        }
        const iframe = (0, utils_1.isIFrame)(data);
        if (iframe === false) {
            // Fallback
            return isKeyFrame;
        }
        return iframe;
    }
    waitForStreamData(dataType) {
        if (this.currentMessageState[dataType].p2pStreamingTimeout) {
            clearTimeout(this.currentMessageState[dataType].p2pStreamingTimeout);
        }
        this.currentMessageState[dataType].p2pStreamingTimeout = setTimeout(() => {
            var _a;
            this.log.info(`Stopping the station stream for the device ${(_a = this.deviceSNs[this.currentMessageState[dataType].p2pStreamChannel]) === null || _a === void 0 ? void 0 : _a.sn}, because we haven't received any data for ${this.MAX_STREAM_DATA_WAIT} seconds`);
            this.endStream(dataType);
        }, this.MAX_STREAM_DATA_WAIT);
    }
    handleDataBinaryAndVideo(message) {
        var _a, _b, _c;
        if (!this.currentMessageState[message.dataType].invalidStream) {
            switch (message.commandId) {
                case types_1.CommandType.CMD_VIDEO_FRAME:
                    this.waitForStreamData(message.dataType);
                    const videoMetaData = {
                        streamType: 0,
                        videoSeqNo: 0,
                        videoFPS: 15,
                        videoWidth: 1920,
                        videoHeight: 1080,
                        videoTimestamp: 0,
                        videoDataLength: 0,
                        aesKey: ""
                    };
                    const data_length = message.data.readUInt32LE();
                    const isKeyFrame = message.data.slice(4, 5).readUInt8() === 1 ? true : false;
                    videoMetaData.videoDataLength = message.data.slice(0, 4).readUInt32LE();
                    videoMetaData.streamType = message.data.slice(5, 6).readUInt8();
                    videoMetaData.videoSeqNo = message.data.slice(6, 8).readUInt16LE();
                    videoMetaData.videoFPS = message.data.slice(8, 10).readUInt16LE();
                    videoMetaData.videoWidth = message.data.slice(10, 12).readUInt16LE();
                    videoMetaData.videoHeight = message.data.slice(12, 14).readUInt16LE();
                    videoMetaData.videoTimestamp = message.data.slice(14, 20).readUIntLE(0, 6);
                    let payloadStart = 22;
                    if (message.signCode > 0 && data_length >= 128) {
                        const key = message.data.slice(22, 150);
                        const rsaKey = this.currentMessageState[message.dataType].rsaKey;
                        if (rsaKey) {
                            try {
                                videoMetaData.aesKey = rsaKey.decrypt(key).toString("hex");
                                this.log.debug(`Station ${this.rawStation.station_sn} - Decrypted AES key: ${videoMetaData.aesKey}`);
                            }
                            catch (error) {
                                this.log.warn(`Station ${this.rawStation.station_sn} - AES key could not be decrypted! The entire stream is discarded. - Error:`, error);
                                this.currentMessageState[message.dataType].invalidStream = true;
                                return;
                            }
                        }
                        else {
                            this.log.warn(`Station ${this.rawStation.station_sn} - Private RSA key is missing! Stream could not be decrypted. The entire stream is discarded.`);
                            this.currentMessageState[message.dataType].invalidStream = true;
                            return;
                        }
                        payloadStart = 151;
                    }
                    let video_data;
                    if (videoMetaData.aesKey !== "") {
                        const encrypted_data = message.data.slice(payloadStart, payloadStart + 128);
                        const unencrypted_data = message.data.slice(payloadStart + 128, payloadStart + videoMetaData.videoDataLength);
                        video_data = Buffer.concat([(0, utils_1.decryptAESData)(videoMetaData.aesKey, encrypted_data), unencrypted_data]);
                    }
                    else {
                        video_data = message.data.slice(payloadStart, payloadStart + videoMetaData.videoDataLength);
                    }
                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME`, { dataSize: message.data.length, metadata: videoMetaData, videoDataSize: video_data.length });
                    this.currentMessageState[message.dataType].p2pStreamMetadata.videoFPS = videoMetaData.videoFPS;
                    this.currentMessageState[message.dataType].p2pStreamMetadata.videoHeight = videoMetaData.videoHeight;
                    this.currentMessageState[message.dataType].p2pStreamMetadata.videoWidth = videoMetaData.videoWidth;
                    if (!this.currentMessageState[message.dataType].p2pStreamFirstVideoDataReceived) {
                        if (this.rawStation.station_sn.startsWith("T8410") || this.rawStation.station_sn.startsWith("T8400") || this.rawStation.station_sn.startsWith("T8401") || this.rawStation.station_sn.startsWith("T8411") ||
                            this.rawStation.station_sn.startsWith("T8202") || this.rawStation.station_sn.startsWith("T8422") || this.rawStation.station_sn.startsWith("T8424") || this.rawStation.station_sn.startsWith("T8423") ||
                            this.rawStation.station_sn.startsWith("T8130") || this.rawStation.station_sn.startsWith("T8131") || this.rawStation.station_sn.startsWith("T8420") || this.rawStation.station_sn.startsWith("T8440") ||
                            this.rawStation.station_sn.startsWith("T8441") || this.rawStation.station_sn.startsWith("T8442") || (0, utils_1.checkT8420)(this.rawStation.station_sn)) {
                            this.currentMessageState[message.dataType].p2pStreamMetadata.videoCodec = videoMetaData.streamType === 1 ? types_1.VideoCodec.H264 : videoMetaData.streamType === 2 ? types_1.VideoCodec.H265 : types_1.VideoCodec.UNKNOWN;
                            this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME - Video codec information received from packet`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, metadata: videoMetaData });
                        }
                        else if (this.isIFrame(video_data, isKeyFrame)) {
                            this.currentMessageState[message.dataType].p2pStreamMetadata.videoCodec = (0, utils_1.getVideoCodec)(video_data);
                            this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME - Video codec extracted from video data`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, metadata: videoMetaData });
                        }
                        else {
                            this.currentMessageState[message.dataType].p2pStreamMetadata.videoCodec = (0, utils_1.getVideoCodec)(video_data); //videoMetaData.streamType === 1 ? VideoCodec.H264 : videoMetaData.streamType === 2 ? VideoCodec.H265 : VideoCodec.UNKNOWN;
                            if (this.currentMessageState[message.dataType].p2pStreamMetadata.videoCodec === types_1.VideoCodec.UNKNOWN) {
                                this.currentMessageState[message.dataType].p2pStreamMetadata.videoCodec = videoMetaData.streamType === 1 ? types_1.VideoCodec.H264 : videoMetaData.streamType === 2 ? types_1.VideoCodec.H265 : types_1.VideoCodec.UNKNOWN;
                                if (this.currentMessageState[message.dataType].p2pStreamMetadata.videoCodec === types_1.VideoCodec.UNKNOWN) {
                                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME - Unknown video codec skip packet`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, metadata: videoMetaData });
                                    break;
                                }
                                else {
                                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME - Fallback, using video codec information received from packet`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, metadata: videoMetaData });
                                }
                            }
                            else {
                                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME - Fallback, video codec extracted from video data`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, metadata: videoMetaData });
                            }
                        }
                        this.currentMessageState[message.dataType].p2pStreamFirstVideoDataReceived = true;
                        this.currentMessageState[message.dataType].waitForAudioData = setTimeout(() => {
                            this.currentMessageState[message.dataType].waitForAudioData = undefined;
                            this.currentMessageState[message.dataType].p2pStreamMetadata.audioCodec = types_1.AudioCodec.NONE;
                            this.currentMessageState[message.dataType].p2pStreamFirstAudioDataReceived = true;
                            if (this.currentMessageState[message.dataType].p2pStreamFirstAudioDataReceived && this.currentMessageState[message.dataType].p2pStreamFirstVideoDataReceived) {
                                this.emitStreamStartEvent(message.dataType);
                            }
                        }, this.AUDIO_CODEC_ANALYZE_TIMEOUT);
                    }
                    if (this.currentMessageState[message.dataType].p2pStreamNotStarted) {
                        if (this.currentMessageState[message.dataType].p2pStreamFirstAudioDataReceived && this.currentMessageState[message.dataType].p2pStreamFirstVideoDataReceived) {
                            this.emitStreamStartEvent(message.dataType);
                        }
                    }
                    if (message.dataType === types_1.P2PDataType.VIDEO) {
                        if ((0, utils_1.findStartCode)(video_data)) {
                            this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME: startcode found`, { isKeyFrame: isKeyFrame, preFrameVideoDataLength: this.currentMessageState[message.dataType].preFrameVideoData.length });
                            if (!this.currentMessageState[message.dataType].receivedFirstIFrame)
                                this.currentMessageState[message.dataType].receivedFirstIFrame = this.isIFrame(video_data, isKeyFrame);
                            if (this.currentMessageState[message.dataType].receivedFirstIFrame) {
                                if (this.currentMessageState[message.dataType].preFrameVideoData.length > this.MAX_VIDEO_PACKET_BYTES)
                                    this.currentMessageState[message.dataType].preFrameVideoData = Buffer.from([]);
                                if (this.currentMessageState[message.dataType].preFrameVideoData.length > 0) {
                                    (_a = this.currentMessageState[message.dataType].videoStream) === null || _a === void 0 ? void 0 : _a.push(this.currentMessageState[message.dataType].preFrameVideoData);
                                }
                                this.currentMessageState[message.dataType].preFrameVideoData = Buffer.from(video_data);
                            }
                            else {
                                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME: Skipping because first frame is not an I frame.`);
                            }
                        }
                        else {
                            this.log.debug(`Station ${this.rawStation.station_sn} - CMD_VIDEO_FRAME: No startcode found`, { isKeyFrame: isKeyFrame, preFrameVideoDataLength: this.currentMessageState[message.dataType].preFrameVideoData.length });
                            if (this.currentMessageState[message.dataType].preFrameVideoData.length > 0) {
                                this.currentMessageState[message.dataType].preFrameVideoData = Buffer.concat([this.currentMessageState[message.dataType].preFrameVideoData, video_data]);
                            }
                        }
                    }
                    else if (message.dataType === types_1.P2PDataType.BINARY) {
                        (_b = this.currentMessageState[message.dataType].videoStream) === null || _b === void 0 ? void 0 : _b.push(video_data);
                    }
                    break;
                case types_1.CommandType.CMD_AUDIO_FRAME:
                    this.waitForStreamData(message.dataType);
                    const audioMetaData = {
                        audioType: types_1.AudioCodec.NONE,
                        audioSeqNo: 0,
                        audioTimestamp: 0,
                        audioDataLength: 0
                    };
                    audioMetaData.audioDataLength = message.data.slice(0, 4).readUInt32LE();
                    audioMetaData.audioType = message.data.slice(5, 6).readUInt8();
                    audioMetaData.audioSeqNo = message.data.slice(6, 8).readUInt16LE();
                    audioMetaData.audioTimestamp = message.data.slice(8, 14).readUIntLE(0, 6);
                    const audio_data = Buffer.from(message.data.slice(16));
                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_AUDIO_FRAME`, { dataSize: message.data.length, metadata: audioMetaData, audioDataSize: audio_data.length });
                    if (!this.currentMessageState[message.dataType].p2pStreamFirstAudioDataReceived) {
                        if (this.currentMessageState[message.dataType].waitForAudioData !== undefined) {
                            clearTimeout(this.currentMessageState[message.dataType].waitForAudioData);
                        }
                        this.currentMessageState[message.dataType].p2pStreamFirstAudioDataReceived = true;
                        this.currentMessageState[message.dataType].p2pStreamMetadata.audioCodec = audioMetaData.audioType === 0 ? types_1.AudioCodec.AAC : audioMetaData.audioType === 1 ? types_1.AudioCodec.AAC_LC : audioMetaData.audioType === 7 ? types_1.AudioCodec.AAC_ELD : types_1.AudioCodec.UNKNOWN;
                    }
                    if (this.currentMessageState[message.dataType].p2pStreamNotStarted) {
                        if (this.currentMessageState[message.dataType].p2pStreamFirstAudioDataReceived && this.currentMessageState[message.dataType].p2pStreamFirstVideoDataReceived) {
                            this.emitStreamStartEvent(message.dataType);
                        }
                    }
                    (_c = this.currentMessageState[message.dataType].audioStream) === null || _c === void 0 ? void 0 : _c.push(audio_data);
                    break;
                default:
                    this.log.debug(`Station ${this.rawStation.station_sn} - Not implemented message`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, data: message.data.toString("hex") });
                    break;
            }
        }
        else {
            this.log.debug(`Station ${this.rawStation.station_sn} - Invalid stream data, dropping complete stream`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, data: message.data.toString("hex") });
        }
    }
    handleDataControl(message) {
        switch (message.commandId) {
            case types_1.CommandType.CMD_GET_ALARM_MODE:
                this.log.debug(`Station ${this.rawStation.station_sn} - Alarm mode changed to: ${types_2.AlarmMode[message.data.readUIntBE(0, 1)]}`);
                this.emit("alarm mode", message.data.readUIntBE(0, 1));
                break;
            case types_1.CommandType.CMD_CAMERA_INFO:
                try {
                    this.log.debug(`Station ${this.rawStation.station_sn} - Camera info`, { cameraInfo: message.data.toString() });
                    this.emit("camera info", JSON.parse(message.data.toString()));
                }
                catch (error) {
                    this.log.error(`Station ${this.rawStation.station_sn} - Camera info - Error:`, error);
                }
                break;
            case types_1.CommandType.CMD_CONVERT_MP4_OK:
                const totalBytes = message.data.slice(1).readUInt32LE();
                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_CONVERT_MP4_OK`, { channel: message.channel, totalBytes: totalBytes });
                this.downloadTotalBytes = totalBytes;
                this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreaming = true;
                this.currentMessageState[types_1.P2PDataType.BINARY].p2pStreamChannel = message.channel;
                break;
            case types_1.CommandType.CMD_WIFI_CONFIG:
                const rssi = message.data.readInt32LE();
                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_WIFI_CONFIG`, { channel: message.channel, rssi: rssi });
                this.emit("wifi rssi", message.channel, rssi);
                break;
            case types_1.CommandType.CMD_DOWNLOAD_FINISH:
                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_DOWNLOAD_FINISH`, { channel: message.channel });
                this.endStream(types_1.P2PDataType.BINARY);
                break;
            case types_1.CommandType.CMD_DOORBELL_NOTIFY_PAYLOAD:
                try {
                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_DOORBELL_NOTIFY_PAYLOAD`, { payload: message.data.toString() });
                    //TODO: Finish implementation, emit an event...
                    //VDBStreamInfo (1005) and VoltageEvent (1015)
                    //this.emit("", JSON.parse(message.data.toString()) as xy);
                }
                catch (error) {
                    this.log.error(`Station ${this.rawStation.station_sn} - CMD_DOORBELL_NOTIFY_PAYLOAD - Error:`, error);
                }
                break;
            case types_1.CommandType.CMD_NAS_SWITCH:
                try {
                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_NAS_SWITCH`, { payload: message.data.toString() });
                    this.emit("rtsp url", message.channel, message.data.toString("utf8", 0, message.data.indexOf("\0", 0, "utf8")));
                }
                catch (error) {
                    this.log.error(`Station ${this.rawStation.station_sn} - CMD_NAS_SWITCH - Error:`, error);
                }
                break;
            case types_1.CommandType.SUB1G_REP_UNPLUG_POWER_LINE:
                try {
                    this.log.debug(`Station ${this.rawStation.station_sn} - SUB1G_REP_UNPLUG_POWER_LINE`, { payload: message.data.toString() });
                    const chargeType = message.data.slice(0, 4).readUInt32LE();
                    const batteryLevel = message.data.slice(4, 8).readUInt32LE();
                    this.emit("charging state", message.channel, chargeType, batteryLevel);
                }
                catch (error) {
                    this.log.error(`Station ${this.rawStation.station_sn} - SUB1G_REP_UNPLUG_POWER_LINE - Error:`, error);
                }
                break;
            case types_1.CommandType.SUB1G_REP_RUNTIME_STATE:
                try {
                    this.log.debug(`Station ${this.rawStation.station_sn} - SUB1G_REP_RUNTIME_STATE`, { payload: message.data.toString() });
                    const batteryLevel = message.data.slice(0, 4).readUInt32LE();
                    const temperature = message.data.slice(4, 8).readUInt32LE();
                    this.emit("runtime state", message.channel, batteryLevel, temperature);
                }
                catch (error) {
                    this.log.error(`Station ${this.rawStation.station_sn} - SUB1G_REP_RUNTIME_STATE - Error:`, error);
                }
                break;
            case types_1.CommandType.CMD_NOTIFY_PAYLOAD:
                try {
                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_NOTIFY_PAYLOAD`, { payload: message.data.toString() });
                    const json = JSON.parse(message.data.toString());
                    if (json.cmd === types_1.CommandType.CMD_DOORLOCK_P2P_SEQ) {
                        switch (json.payload.lock_cmd) {
                            case 0:
                                if (json.payload.seq_num !== undefined) {
                                    this.lockSeqNumber = json.payload.seq_num;
                                    this.log.debug(`Station ${this.rawStation.station_sn} - CMD_NOTIFY_PAYLOAD - Lock sequence number`, { lockSeqNumber: this.lockSeqNumber });
                                }
                                break;
                            default:
                                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_NOTIFY_PAYLOAD - Not implemented`, { message: message.data.toString() });
                                break;
                        }
                    }
                    else if (json.cmd === types_1.CommandType.CMD_DOORLOCK_DATA_PASS_THROUGH) {
                        if (this.deviceSNs[message.channel] !== undefined) {
                            if (json.payload.lock_payload !== undefined) {
                                const decoded = (0, utils_1.decodeBase64)((0, utils_1.decodeLockPayload)(Buffer.from(json.payload.lock_payload)));
                                const key = (0, utils_1.generateLockAESKey)(this.deviceSNs[message.channel].adminUserId, this.rawStation.station_sn);
                                const iv = (0, utils_1.getLockVectorBytes)(this.rawStation.station_sn);
                                this.log.debug(`Station ${this.rawStation.station_sn} - CMD_DOORLOCK_DATA_PASS_THROUGH`, { commandIdName: types_1.CommandType[json.cmd], commandId: json.cmd, key: key, iv: iv, decoded: decoded.toString("hex") });
                                json.payload.lock_payload = (0, utils_1.decryptLockAESData)(key, iv, decoded).toString("hex");
                                switch (json.payload.lock_cmd) {
                                    case types_1.ESLInnerCommand.NOTIFY:
                                        const notifyBuffer = Buffer.from(json.payload.lock_payload, "hex");
                                        this.emit("esl parameter", message.channel, types_1.CommandType.CMD_GET_BATTERY, notifyBuffer.slice(3, 4).readInt8().toString());
                                        this.emit("esl parameter", message.channel, types_1.CommandType.CMD_DOORLOCK_GET_STATE, notifyBuffer.slice(6, 7).readInt8().toString());
                                        break;
                                    default:
                                        this.log.debug(`Station ${this.rawStation.station_sn} - CMD_DOORLOCK_DATA_PASS_THROUGH - Not implemented`, { message: message.data.toString() });
                                        break;
                                }
                            }
                        }
                    }
                    else {
                        this.log.debug(`Station ${this.rawStation.station_sn} - CMD_NOTIFY_PAYLOAD - Not implemented`, { commandIdName: types_1.CommandType[json.cmd], commandId: json.cmd, message: message.data.toString() });
                    }
                }
                catch (error) {
                    this.log.error(`Station ${this.rawStation.station_sn} - CMD_NOTIFY_PAYLOAD Error:`, { erorr: error, payload: message.data.toString() });
                }
                break;
            default:
                this.log.debug(`Station ${this.rawStation.station_sn} - Not implemented - CONTROL message`, { commandIdName: types_1.CommandType[message.commandId], commandId: message.commandId, channel: message.channel, data: message.data.toString("hex") });
                break;
        }
    }
    sendAck(address, dataType, seqNo) {
        const num_pending_acks = 1; // Max possible: 17 in one ack packet
        const pendingAcksBuffer = Buffer.allocUnsafe(2);
        pendingAcksBuffer.writeUInt16BE(num_pending_acks, 0);
        const seqBuffer = Buffer.allocUnsafe(2);
        seqBuffer.writeUInt16BE(seqNo, 0);
        const payload = Buffer.concat([dataType, pendingAcksBuffer, seqBuffer]);
        (0, utils_1.sendMessage)(this.socket, address, types_1.RequestMessageType.ACK, payload).catch((error) => {
            this.log.error(`Station ${this.rawStation.station_sn} - Error:`, error);
        });
    }
    getDataType(input) {
        if (input.compare(types_1.P2PDataTypeHeader.DATA) === 0) {
            return types_1.P2PDataType.DATA;
        }
        else if (input.compare(types_1.P2PDataTypeHeader.VIDEO) === 0) {
            return types_1.P2PDataType.VIDEO;
        }
        else if (input.compare(types_1.P2PDataTypeHeader.CONTROL) === 0) {
            return types_1.P2PDataType.CONTROL;
        }
        else if (input.compare(types_1.P2PDataTypeHeader.BINARY) === 0) {
            return types_1.P2PDataType.BINARY;
        }
        return types_1.P2PDataType.UNKNOWN;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.terminating = true;
            this._clearLookupTimeout();
            this._clearLookupRetryTimeout();
            this._clearConnectTimeout();
            this._clearHeartbeatTimeout();
            this._clearMessageStateTimeouts();
            this.sendQueue = [];
            if (this.socket) {
                if (this.connected) {
                    yield (0, utils_1.sendMessage)(this.socket, this.connectAddress, types_1.RequestMessageType.END).catch((error) => {
                        this.log.error(`Station ${this.rawStation.station_sn} - Error`, error);
                    });
                    this._disconnected();
                }
                else {
                    this._initialize();
                }
            }
        });
    }
    getHeartbeatInterval() {
        return this.HEARTBEAT_INTERVAL;
    }
    onClose() {
        this.socket.removeAllListeners();
        this.socket = (0, dgram_1.createSocket)("udp4");
        this.socket.on("message", (msg, rinfo) => this.handleMsg(msg, rinfo));
        this.socket.on("error", (error) => this.onError(error));
        this.socket.on("close", () => this.onClose());
        this.binded = false;
        this._disconnected();
    }
    onError(error) {
        this.log.debug(`Station ${this.rawStation.station_sn} - Error:`, error);
    }
    scheduleHeartbeat() {
        if (this.isConnected()) {
            this.sendPing(this.connectAddress);
            this.heartbeatTimeout = setTimeout(() => {
                this.scheduleHeartbeat();
            }, this.getHeartbeatInterval());
        }
        else {
            this.log.debug(`Station ${this.rawStation.station_sn} - Heartbeat disabled!`);
        }
    }
    scheduleP2PKeepalive() {
        if (this.isConnected()) {
            if (this.messageStates.size > 0) {
                this.sendCommandPing();
                this.keepaliveTimeout = setTimeout(() => {
                    this.scheduleP2PKeepalive();
                }, this.KEEPALIVE_INTERVAL);
            }
            else {
                this.log.debug(`Station ${this.rawStation.station_sn} - No more p2p commands to execute p2p keepalive disabled`);
                this.closeEnergySavingDevice();
            }
        }
        else {
            this.log.debug(`Station ${this.rawStation.station_sn} - p2p keepalive disabled!`);
        }
    }
    setDownloadRSAPrivateKeyPem(pem) {
        this.currentMessageState[types_1.P2PDataType.BINARY].rsaKey = (0, utils_1.getRSAPrivateKey)(pem);
    }
    getRSAPrivateKey() {
        return this.currentMessageState[types_1.P2PDataType.VIDEO].rsaKey;
    }
    initializeStream(datatype) {
        var _a, _b;
        (_a = this.currentMessageState[datatype].videoStream) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.currentMessageState[datatype].audioStream) === null || _b === void 0 ? void 0 : _b.destroy();
        this.currentMessageState[datatype].videoStream = null;
        this.currentMessageState[datatype].audioStream = null;
        this.currentMessageState[datatype].videoStream = new stream_1.Readable({ autoDestroy: true,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            read() { } /*,

            destroy(this, error, _callback) {
                if (error) {
                    this.emit("error", error);
                }
                this.emit("end");
                this.emit("close");
            }*/
        });
        this.currentMessageState[datatype].audioStream = new stream_1.Readable({ autoDestroy: true,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            read() { } /*,

            destroy(this, error, _callback) {
                if (error) {
                    this.emit("error", error);
                }
                this.emit("end");
                this.emit("close");
            }*/
        });
        this.currentMessageState[datatype].p2pStreaming = false;
        if (this.currentMessageState[datatype].waitForSeqNoTimeout !== undefined) {
            clearTimeout(this.currentMessageState[datatype].waitForSeqNoTimeout);
            this.currentMessageState[datatype].waitForSeqNoTimeout = undefined;
        }
        if (this.currentMessageState[datatype].waitForAudioData !== undefined) {
            clearTimeout(this.currentMessageState[datatype].waitForAudioData);
            this.currentMessageState[datatype].waitForAudioData = undefined;
        }
    }
    endStream(datatype) {
        var _a, _b;
        if (this.currentMessageState[datatype].p2pStreaming) {
            this.currentMessageState[datatype].p2pStreaming = false;
            (_a = this.currentMessageState[datatype].videoStream) === null || _a === void 0 ? void 0 : _a.push(null);
            (_b = this.currentMessageState[datatype].audioStream) === null || _b === void 0 ? void 0 : _b.push(null);
            if (this.currentMessageState[datatype].p2pStreamingTimeout) {
                clearTimeout(this.currentMessageState[datatype].p2pStreamingTimeout);
                this.currentMessageState[datatype].p2pStreamingTimeout = undefined;
            }
            if (!this.currentMessageState[datatype].invalidStream && !this.currentMessageState[datatype].p2pStreamNotStarted)
                this.emitStreamStopEvent(datatype);
            this.initializeMessageBuilder(datatype);
            this.initializeMessageState(datatype, this.currentMessageState[datatype].rsaKey);
            this.initializeStream(datatype);
        }
    }
    endRTSPStream(channel) {
        if (this.currentMessageState[types_1.P2PDataType.DATA].rtspStreaming[channel]) {
            this.currentMessageState[types_1.P2PDataType.DATA].rtspStream[channel] = false;
            this.currentMessageState[types_1.P2PDataType.DATA].rtspStreaming[channel] = false;
            this.emit("rtsp livestream stopped", channel);
        }
    }
    emitStreamStartEvent(datatype) {
        this.currentMessageState[datatype].p2pStreamNotStarted = false;
        if (datatype === types_1.P2PDataType.VIDEO) {
            this.emit("livestream started", this.currentMessageState[datatype].p2pStreamChannel, this.currentMessageState[datatype].p2pStreamMetadata, this.currentMessageState[datatype].videoStream, this.currentMessageState[datatype].audioStream);
        }
        else if (datatype === types_1.P2PDataType.BINARY) {
            this.emit("download started", this.currentMessageState[datatype].p2pStreamChannel, this.currentMessageState[datatype].p2pStreamMetadata, this.currentMessageState[datatype].videoStream, this.currentMessageState[datatype].audioStream);
        }
    }
    emitStreamStopEvent(datatype) {
        if (datatype === types_1.P2PDataType.VIDEO) {
            this.emit("livestream stopped", this.currentMessageState[datatype].p2pStreamChannel);
        }
        else if (datatype === types_1.P2PDataType.BINARY) {
            this.emit("download finished", this.currentMessageState[datatype].p2pStreamChannel);
        }
    }
    isStreaming(channel, datatype) {
        if (this.currentMessageState[datatype].p2pStreamChannel === channel)
            return this.currentMessageState[datatype].p2pStreaming;
        return false;
    }
    isLiveStreaming(channel) {
        return this.isStreaming(channel, types_1.P2PDataType.VIDEO);
    }
    isRTSPLiveStreaming(channel) {
        return this.currentMessageState[types_1.P2PDataType.DATA].rtspStreaming[channel] ? this.currentMessageState[types_1.P2PDataType.DATA].rtspStreaming[channel] : false;
    }
    isDownloading(channel) {
        return this.isStreaming(channel, types_1.P2PDataType.BINARY);
    }
    getLockSequenceNumber() {
        if (this.lockSeqNumber === -1)
            this.lockSeqNumber = (0, utils_1.generateLockSequence)();
        return this.lockSeqNumber;
    }
    incLockSequenceNumber() {
        if (this.lockSeqNumber === -1)
            this.lockSeqNumber = (0, utils_1.generateLockSequence)();
        else
            this.lockSeqNumber++;
        return this.lockSeqNumber;
    }
    setConnectionType(type) {
        this.connectionType = type;
    }
    getConnectionType() {
        return this.connectionType;
    }
    isEnergySavingDevice() {
        return this.energySavingDevice;
    }
    getDSKKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = {
                    invalid_dsks: {},
                    station_sns: [this.rawStation.station_sn],
                    transaction: `${new Date().getTime()}`
                };
                data.invalid_dsks[this.rawStation.station_sn] = "";
                const response = yield this.api.request("post", "v1/app/equipment/get_dsk_keys", data).catch(error => {
                    this.log.error("Error:", error);
                    return error;
                });
                this.log.debug(`Station ${this.rawStation.station_sn} - Response:`, response.data);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        dataresult.dsk_keys.forEach(key => {
                            if (key.station_sn == this.rawStation.station_sn) {
                                this.dskKey = key.dsk_key;
                                this.dskExpiration = new Date(key.expiration * 1000);
                                this.log.debug(`${this.constructor.name}.getDSKKeys(): dskKey: ${this.dskKey} dskExpiration: ${this.dskExpiration}`);
                            }
                        });
                    }
                    else {
                        this.log.error(`Station ${this.rawStation.station_sn} - Response code not ok`, { code: result.code, msg: result.msg });
                    }
                }
                else {
                    this.log.error(`Station ${this.rawStation.station_sn} - Status return code not 200`, { status: response.status, statusText: response.statusText });
                }
            }
            catch (error) {
                this.log.error(`Station ${this.rawStation.station_sn} - Generic Error:`, error);
            }
        });
    }
    updateRawStation(value) {
        var _a;
        this.rawStation = value;
        if (((_a = this.rawStation.devices) === null || _a === void 0 ? void 0 : _a.length) === 1) {
            if (!this.energySavingDevice) {
                this.energySavingDevice = this.rawStation.station_sn === this.rawStation.devices[0].device_sn && device_1.Device.hasBattery(this.rawStation.devices[0].device_type);
                if (this.energySavingDevice)
                    this.log.debug(`Identified standalone battery device ${this.rawStation.station_sn} => activate p2p keepalive command`);
            }
        }
        else {
            this.energySavingDevice = false;
        }
        if (this.rawStation.devices)
            for (const device of this.rawStation.devices) {
                this.deviceSNs[device.device_channel] = {
                    sn: device.device_sn,
                    adminUserId: this.rawStation.member.admin_user_id
                };
            }
    }
}
exports.P2PClientProtocol = P2PClientProtocol;
