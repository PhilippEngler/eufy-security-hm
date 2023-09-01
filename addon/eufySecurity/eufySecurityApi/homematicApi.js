"use strict";
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
    api;
    /**
     * Create the api object.
     */
    constructor(api) {
        this.api = api;
    }
    /**
     * Performs a request to the given url with given data and config.
     * @param url The url to get information from.
     * @param data The data for the request.
     * @param requestConfig The config.
     */
    async request(url, data, requestConfig) {
        return await axios_1.default.post(url, data, requestConfig);
    }
    /**
     * Get the vaulue of a given system variable.
     * @param variableName The name of the system variable to get.
     */
    async getSystemVariable(variableName) {
        var url = "http://localhost:8181/esapi.exe";
        var requestData = "string result='null';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject=dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName=='" + variableName + "'){result=svObject.Value();break;}}svName='null';svObject=null;";
        var requestConfig = { headers: { 'Content-Type': 'text/plain' } };
        var data = "";
        this.getSystemVariables();
        try {
            var response = await this.request(url, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        }
        catch (error) {
            this.api.logError(`CCU request error on getSystemVariable(): code: ${error.code}; message: ${error.message}`);
            this.api.logDebug(`CCU request error on getSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Get the vaulue of a given system variable.
     * @param variableName The name of the system variable to get.
     */
    async getSystemVariable1(variableName) {
        var url = "http://localhost:8181/esapi.exe";
        var requestData = "result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').Value()";
        var requestConfig = { headers: { 'Content-Type': 'text/plain' } };
        var data = "";
        try {
            var response = await this.request(url, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        }
        catch (error) {
            this.api.logError(`CCU request error on getSystemVariable1(): code: ${error.code}; message: ${error.message}`);
            this.api.logDebug(`CCU request error on getSystemVariable1():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Set the given variable to the given value.
     * @param variableName The name of the system variable to set.
     * @param value The value to set.
     */
    async setSystemVariable(variableName, value) {
        var url = "http://localhost:8181/esapi.exe";
        var requestData = "dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').State('" + value + "')";
        var requestConfig = { headers: { 'Content-Type': 'text/plain' } };
        var data = "";
        try {
            var response = await this.request(url, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            //return data;
        }
        catch (error) {
            this.api.logError(`CCU request error on setSystemVariable(): code: ${error.code}; message: ${error.message}`);
            this.api.logDebug(`CCU request error on setSystemVariable():`, JSON.stringify(error));
            //return undefined;
        }
    }
    /**
     * Get all system variables available as array.
     * @returns An array containg all system variables.
     */
    async getSystemVariables(variableStartstring) {
        var url = "http://localhost:8181/esapi.exe";
        var requestData = "string result=dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames();";
        var requestConfig = { headers: { 'Content-Type': 'text/plain' } };
        var data = "";
        var res;
        try {
            var response = await this.request(url, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            res = data.split("\t");
            if (variableStartstring === undefined) {
                return res;
            }
            else {
                for (var i = 0; i < res.length; i++) {
                    if (!(res[i].startsWith(variableStartstring))) {
                        res.splice(i, 1);
                        i--;
                    }
                }
                return res;
            }
        }
        catch (error) {
            this.api.logError(`CCU request error on getSystemVariables(): code: ${error.code}; message: ${error.message}`);
            this.api.logDebug(`CCU request error on getSystemVariables():`, JSON.stringify(error));
            res = undefined;
        }
    }
    /**
     * Create a system variable in the CCU.
     * @param variableName The name of the system variable to create.
     * @param variableInfo The info of the system variable to create.
     */
    async createSystemVariable(variableName, variableInfo) {
        var url = "http://localhost:8181/esapi.exe";
        var requestData = "object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('" + variableName + "');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('" + variableInfo + "');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);";
        var requestConfig = { headers: { 'Content-Type': 'text/plain' } };
        var data = "";
        try {
            var response = await this.request(url, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<svObj>"));
            data = data.substring(7, data.indexOf("</svObj>"));
            return data;
        }
        catch (error) {
            this.api.logError(`CCU request error on createSystemVariable(): code: ${error.code}; message: ${error.message}`);
            this.api.logDebug(`CCU request error on createSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Remove a system variable from the CCU.
     * @param variableName The name of the system variable to remove.
     * @param variableInfo The info of the system variable to remove.
     */
    async removeSystemVariable(variableName) {
        var url = "http://localhost:8181/esapi.exe";
        var requestData = "string result='false';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject = dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName == '" + variableName + "'){dom.DeleteObject(svObject);result='true';break;}}";
        var requestConfig = { headers: { 'Content-Type': 'text/plain' } };
        var data = "";
        try {
            var response = await this.request(url, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        }
        catch (error) {
            this.api.logError(`CCU request error on removeSystemVariable(): code: ${error.code}; message: ${error.message}`);
            this.api.logDebug(`CCU request error on removeSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Returns the content of the logile.
     */
    async getLogFileContent() {
        if ((0, fs_1.existsSync)('/var/log/eufySecurity.log') == true) {
            var fileContent = (0, fs_1.readFileSync)('/var/log/eufySecurity.log', 'utf-8');
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
    }
    /**
     * Returns the content of the errorfile.
     */
    async getErrorFileContent() {
        if ((0, fs_1.existsSync)('/var/log/eufySecurity.err') == true) {
            var fileContent = (0, fs_1.readFileSync)('/var/log/eufySecurity.err', 'utf-8');
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
    }
    /**
     * Returns the version info of the homematic api.
     */
    getHomematicApiVersion() {
        return "2.3.0";
    }
}
exports.HomematicApi = HomematicApi;
