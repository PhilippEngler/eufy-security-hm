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
exports.Base = exports.Bases = void 0;
const p2p_1 = require("./p2p");
const http_response_models_1 = require("./http/http-response.models");
const cloud_lookup_service_1 = require("./p2p/cloud-lookup.service");
/**
 * Represents all the Bases in the account.
 */
class Bases {
    /**
     * Create the Bases objects holding all bases in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        this.bases = {};
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];
    }
    /**
     * (Re)Loads all Bases and the settings of them.
     */
    loadBases() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resBases = yield this.httpService.listHubs();
            var resBase;
            var base;
            for (resBase of this.resBases) {
                base = new Base(this.api, this.httpService, resBase);
                this.bases[base.getSerialNumber()] = base;
                this.serialNumbers.push(base.getSerialNumber());
            }
            yield this.saveBasesSettings();
        });
    }
    /**
     * Save the relevant settings (mainly for P2P-Connection) to the config
     */
    saveBasesSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.saveBasesSettings(this.bases, this.serialNumbers);
        });
    }
    /**
     * Returns a JSON-Representation of all Bases including the guard mode.
     */
    getBases() {
        return this.bases;
    }
    /**
     * Get the guard mode for all bases.
     */
    getGuardMode() {
        return this.getBases();
    }
    /**
     * Set the guard mode of all bases to the given mode.
     * @param guardMode The target guard mode.
     */
    setGuardMode(guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            for (var key in this.bases) {
                var base = this.bases[key];
                yield base.setGuardMode(guardMode);
            }
        });
    }
    /**
     * Set the guard mode for the given base to the given mode.
     * @param baseSerial The serial of the base the mode to change.
     * @param guardMode The target guard mode.
     */
    setGuardModeBase(baseSerial, guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            var base = this.bases[baseSerial];
            yield base.setGuardMode(guardMode);
        });
    }
}
exports.Bases = Bases;
/**
 * Represents one Base object.
 */
class Base {
    /**
     * The constructor for the Base.
     * @param httpService The httpService.
     * @param device_info The device_info object with the data for the base.
     */
    constructor(api, httpService, device_info) {
        this.dskKeyExpire = 0;
        this.localIp = "";
        this.guardMode = "";
        this.api = api;
        this.httpService = httpService;
        this.device_info = device_info;
        this.localLookupService = new p2p_1.LocalLookupService();
        this.cloudLookupService = new cloud_lookup_service_1.CloudLookupService();
        this.pullValues();
    }
    /**
     * Collect needed values from the params-array so that we need only iterate once trough it...
     */
    pullValues() {
        for (var param of this.device_info.params) {
            switch (param.param_type) {
                case 1176:
                    this.localIp = param.param_value;
                    break;
                case 1224:
                    this.guardMode = param.param_value;
                    break;
            }
        }
    }
    /**
     * Get the id of the Base in the eufy system.
     */
    getId() {
        return this.device_info.station_id;
    }
    /**
     * Get the serial number of the base.
     */
    getSerialNumber() {
        return this.device_info.station_sn;
    }
    /**
     * Get the model name of the base.
     */
    getModel() {
        return this.device_info.station_model;
    }
    /**
     * Get the device type of the base.
     */
    getDeviceType() {
        return this.device_info.device_type;
    }
    /**
     * Get the device type as string for the base.
     */
    getDeviceTypeString() {
        if (this.device_info.device_type == http_response_models_1.DeviceType.STATION) {
            return "basestation";
        }
        else {
            return "unknown(" + this.device_info.device_type + ")";
        }
    }
    /**
     * Get the given name of the base.
     */
    getName() {
        return this.device_info.station_name;
    }
    /**
     * Get the hardware version of the base.
     */
    getHardwareVersion() {
        return this.device_info.main_hw_version;
    }
    /**
     * Get the software version of the base.
     */
    getSoftwareVersion() {
        return this.device_info.main_sw_version;
    }
    /**
     * Get the mac address of the base.
     */
    getMacAddress() {
        return this.device_info.wifi_mac;
    }
    /**
     * Get the external ip address of the base (i.e. your router got from your isp).
     */
    getExternalIpAddress() {
        return this.device_info.ip_addr;
    }
    /**
     * Get the internal ip adress of your base (in your local network).
     */
    getLocalIpAddress() {
        return this.localIp;
    }
    /**
     * Get the P2P_DID to connect via P2P to the base.
     */
    getP2pDid() {
        return this.device_info.p2p_did;
    }
    /**
     * Get the actor_id to connect via P2P to the base.
     */
    getActorId() {
        return this.device_info.member.action_user_id;
    }
    /**
     * Get the DSK_KEY to connect via P2P to the base.
     */
    getDskKey() {
        return __awaiter(this, void 0, void 0, function* () {
            var dskKey = yield this.httpService.stationDskKeys(this.device_info.station_sn);
            this.dskKeyExpire = yield dskKey.dsk_keys[0].expiration;
            return yield dskKey.dsk_keys[0].dsk_key;
        });
    }
    /**
     * Get the time the DSK_KEY expires.
     */
    getDskKeyExpiration() {
        return this.dskKeyExpire;
    }
    /**
     * Get the current guard mode of the base.
     */
    getGuardMode() {
        return this.guardMode;
    }
    /**
     * Set the guard mode of the base to the given mode.
     * @param guardMode The target guard mode.
     */
    setGuardMode(guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var address = yield this.localLookupService.lookup(this.getLocalIpAddress());
                this.api.addToLog("Base " + this.getSerialNumber() + " found on local side. address: " + address.host + ":" + address.port);
                var devClientService = new p2p_1.DeviceClientService(address, this.getP2pDid(), this.getActorId());
                yield devClientService.connect();
                devClientService.sendCommandWithInt(p2p_1.CommandType.CMD_SET_ARMING, guardMode);
                yield devClientService.close();
                /*console.log("Try Cloud...");
                var address;
                var addresses = await this.cloudLookupService.lookup(this.getP2pDid(), await this.getDskKey());
    
                for(address of addresses)
                {
                    console.log('Found address', address);
                    var devClientService = new DeviceClientService(address, this.getP2pDid(), this.getActorId());
    
                    await devClientService.connect();
    
                    await sleep(10000);
    
                    await devClientService.close();
                }*/
                return true;
            }
            catch (e) {
                this.api.addToErr("ERROR: setGuardMode: " + e);
                return false;
            }
        });
    }
}
exports.Base = Base;
