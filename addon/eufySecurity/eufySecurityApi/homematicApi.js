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
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
/**
 * Working with the CCU.
 */
class HomematicApi {
    /**
     * Create the api object.
     */
    constructor(api) {
        this.api = api;
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
            var response = yield axios_1.default.get("http://localhost:8181/esapi.exe?result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').Value()");
            data = response.data;
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
            var response = yield axios_1.default.post("http://localhost:8181/esapi.exe", "dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').State('" + value + "')", { headers: { 'Content-Type': 'text/plain' } });
            data = response.data;
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
            var response = yield axios_1.default.post("http://localhost:8181/esapi.exe", "object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('" + variableName + "');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('" + variableInfo + "');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);", { headers: { 'Content-Type': 'text/plain' } });
            data = response.data;
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
                this.api.logError("File '/var/log/eufySecurity.log' not found.");
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
                this.api.logError("File '/var/log/eufySecurity.err' not found.");
                return "Datei '/var/log/eufySecurity.err' wurde nicht gefunden.";
            }
        });
    }
    /**
     * Returns the version info of the homematic api.
     */
    getHomematicApiVersion() {
        return "1.5.1";
    }
}
exports.HomematicApi = HomematicApi;
