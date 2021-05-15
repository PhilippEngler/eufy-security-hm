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
exports.Bases = void 0;
const http_1 = require("./http");
const p2p_1 = require("./p2p");
const utils_1 = require("./push/utils");
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
            try {
                yield this.httpService.updateDeviceInfo();
                this.resBases = this.httpService.getHubs();
                var key;
                var base;
                if (this.resBases != null) {
                    for (key in this.resBases) {
                        if (this.bases[key]) {
                            this.bases[key].update(this.resBases[key], true);
                        }
                        else {
                            base = new http_1.Station(this.api, this.httpService, this.resBases[key]);
                            this.bases[base.getSerial()] = base;
                            this.serialNumbers.push(base.getSerial());
                            yield this.bases[key].connect(p2p_1.P2PConnectionType.ONLY_LOCAL);
                        }
                    }
                    yield this.saveBasesSettings();
                }
                else {
                    this.bases = {};
                }
            }
            catch (e) {
                this.bases = {};
                throw new Error(e);
            }
        });
    }
    /**
     * Close all P2P connection for all bases.
     */
    closeP2PConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.resBases != null) {
                for (var key in this.resBases) {
                    if (this.bases[key]) {
                        yield this.bases[key].close();
                    }
                }
            }
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
            var cnt = 0;
            for (var key in this.bases) {
                var base = this.bases[key];
                yield base.setGuardMode(guardMode);
                yield utils_1.sleep(1500);
                yield this.loadBases();
                if (base.getGuardMode().value != guardMode) {
                    cnt = cnt + 1;
                }
            }
            if (cnt == 0) {
                return true;
            }
            else {
                return false;
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
            yield this.bases[baseSerial].setGuardMode(guardMode);
            yield utils_1.sleep(1500);
            yield this.loadBases();
            if (this.bases[baseSerial].getGuardMode().value == guardMode) {
                return true;
            }
            else {
                return false;
            }
        });
    }
}
exports.Bases = Bases;
