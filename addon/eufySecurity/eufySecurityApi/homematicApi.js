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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomematicApi = void 0;
const got_hm_1 = __importDefault(require("got-hm"));
const fs_1 = require("fs");
/**
 * Working with the CCU.
 */
class HomematicApi {
    /**
     * Create the api object.
     */
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Checks weather the system variable is available on the CCU.
     * @param variableName The name of the system variable to check.
     */
    isSystemVariableAvailable(variableName) {
        return __awaiter(this, void 0, void 0, function* () {
            var res = yield this.getSystemVariable(variableName);
            if (res == "null") {
                return false;
            }
            else {
                return true;
            }
        });
    }
    /**
     * Get the vaulue of a given system variable.
     * @param variableName The name of the system variable to get.
     */
    getSystemVariable(variableName) {
        return __awaiter(this, void 0, void 0, function* () {
            var data = "";
            var response = yield got_hm_1.default("http://localhost:8181/esapi.exe?result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').Value()");
            data = response.body;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        });
    }
    /**
     * Set the given variable to the given value.
     * @param variableName The name of the system variable to set.
     * @param value The value to set.
     */
    setSystemVariable(variableName, value) {
        return __awaiter(this, void 0, void 0, function* () {
            var data = "";
            var response = yield got_hm_1.default.post("http://localhost:8181/esapi.exe", { headers: { 'Content-Type': 'text/plain' }, body: "dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').State('" + value + "')" });
            data = response.body;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            //return data;
        });
    }
    /**
     * Create a system variable in the CCU.
     * @param variableName The name of the system variable to create.
     * @param variableInfo The info of the system variable to create.
     */
    createSystemVariable(variableName, variableInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var data = "";
            var response = yield got_hm_1.default.post("http://localhost:8181/esapi.exe", { headers: { 'Content-Type': 'text/plain' }, body: "object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('" + variableName + "');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('" + variableInfo + "');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);" });
            data = response.body;
            data = data.substring(data.indexOf("<svObj>"));
            data = data.substring(7, data.indexOf("</svObj>"));
            return data;
        });
    }
    /**
     * Returns the content of the logile.
     */
    getLogFileContent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs_1.existsSync('/var/log/eufySecurity.log') == true) {
                var fileContent = fs_1.readFileSync('/var/log/eufySecurity.log', 'utf-8');
                if (fileContent == "") {
                    return "Die Datei '/var/log/eufySecurity.log' ist leer.";
                }
                else {
                    return fileContent;
                }
            }
            else {
                this.logger.err("File '/var/log/eufySecurity.log' not found.");
                return "Datei '/var/log/eufySecurity.log' wurde nicht gefunden.";
            }
        });
    }
    /**
     * Returns the content of the errorfile.
     */
    getErrorFileContent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs_1.existsSync('/var/log/eufySecurity.err') == true) {
                var fileContent = fs_1.readFileSync('/var/log/eufySecurity.err', 'utf-8');
                if (fileContent == "") {
                    return "Die Datei '/var/log/eufySecurity.err' ist leer.";
                }
                else {
                    return fileContent;
                }
            }
            else {
                this.logger.err("File '/var/log/eufySecurity.err' not found.");
                return "Datei '/var/log/eufySecurity.err' wurde nicht gefunden.";
            }
        });
    }
    /**
     * Returns the version info of the homematic api.
     */
    getHomematicApiInfo() {
        return "0.9.3";
    }
}
exports.HomematicApi = HomematicApi;
