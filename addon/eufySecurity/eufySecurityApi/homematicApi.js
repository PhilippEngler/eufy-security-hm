"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomematicApi = void 0;
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https"));
const fs_1 = require("fs");
const logging_1 = require("./logging");
const util_1 = require("util");
const child_process_1 = require("child_process");
const utils_1 = require("./utils/utils");
/**
 * Interacting with the CCU.
 */
class HomematicApi {
    api;
    portHttp = 8181;
    portHttps = 48181;
    /**
     * Create the api object.
     */
    constructor(api) {
        this.api = api;
    }
    /**
     * Performs a request to the given url with given data and config.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param data The data for the request.
     * @param requestConfig The config.
     */
    async request(hostName, useHttps, data, requestConfig) {
        return await axios_1.default.post(this.getUrl(hostName, useHttps), data, requestConfig);
    }
    /**
     * Generate the url to connect to the ccu.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     */
    getUrl(hostName, useHttps) {
        const url = `http${useHttps === true ? "s" : ""}://${hostName}:${useHttps === false ? this.portHttp : this.portHttps}/esapi.exe`;
        logging_1.rootAddonLogger.debug(`Url used for CCU interactions: ${url}`);
        return url;
    }
    /**
     * Create the requestConfig object for the connection.
     * @param contentyType The type of content, e.g. "text/plain".
     * @param user The user name for authentication.
     * @param password The password for authentication.
     * @param useHttps Specify if https is used or not.
     * @returns The requestConfig object.
     */
    getRequestConfig(contentyType, user, password, useHttps, useLocalCertificate, rejectUnauthorized) {
        let requestConfig = {};
        let headers;
        headers = {
            "Content-Type": contentyType
        };
        if (user !== undefined && password !== undefined) {
            headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
        }
        requestConfig.headers = headers;
        if (useHttps === true) {
            let httpsAgent = new https.Agent({
                ca: useLocalCertificate === true && (0, fs_1.existsSync)(this.api.getConfig().getHttpsCertFile()) === true ? (0, fs_1.readFileSync)(this.api.getConfig().getHttpsCertFile()) : undefined,
                cert: useLocalCertificate === true && (0, fs_1.existsSync)(this.api.getConfig().getHttpsCertFile()) === true ? (0, fs_1.readFileSync)(this.api.getConfig().getHttpsCertFile()) : undefined,
                key: useLocalCertificate === true && (0, fs_1.existsSync)(this.api.getConfig().getHttpsPKeyFile()) === true ? (0, fs_1.readFileSync)(this.api.getConfig().getHttpsPKeyFile()) : undefined,
                rejectUnauthorized: rejectUnauthorized
            });
            requestConfig.httpsAgent = httpsAgent;
        }
        logging_1.rootAddonLogger.debug(`RequestConfig: ${JSON.stringify(requestConfig)}`);
        return requestConfig;
    }
    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    async getSystemVariable(hostName, useHttps, variableName) {
        const requestData = `string result='null';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject=dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName=='${variableName}'){result=svObject.Value();break;}}svName='null';svObject=null;`;
        const requestConfig = this.getRequestConfig("text/plain", undefined, undefined, useHttps, true, hostName === "localhost" ? false : true);
        let data = "";
        this.getSystemVariables(hostName, useHttps);
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            logging_1.rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            logging_1.rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            data = (0, utils_1.extractEnclosedString)(response.data, "<result>", "</result>", logging_1.rootAddonLogger);
            logging_1.rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);
            return data;
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on getSystemVariable: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on getSystemVariable:`, JSON.stringify(e));
            return undefined;
        }
    }
    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    async getSystemVariable1(hostName, useHttps, variableName) {
        const requestData = `result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').Value()`;
        const requestConfig = this.getRequestConfig("text/plain", undefined, undefined, useHttps, true, hostName === "localhost" ? false : true);
        let data = "";
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            logging_1.rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            logging_1.rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            data = (0, utils_1.extractEnclosedString)(response.data, "<result>", "</result>", logging_1.rootAddonLogger);
            logging_1.rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);
            return data;
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on getSystemVariable1: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on getSystemVariable1:`, JSON.stringify(e));
            return undefined;
        }
    }
    /**
     * Set the given variable to the given value.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to set.
     * @param value The value to set.
     */
    async setSystemVariable(hostName, useHttps, variableName, value) {
        const requestData = `dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').State('${value}')`;
        const requestConfig = this.getRequestConfig("text/plain", undefined, undefined, useHttps, true, hostName === "localhost" ? false : true);
        //let data = "";
        try {
            await this.request(hostName, useHttps, requestData, requestConfig);
            /*const response = await this.request(hostName, useHttps, requestData, requestConfig);
            rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            data = extractEnclosedString(response.data, "<result>", "</result>", rootAddonLogger);
            rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            return data;*/
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on setSystemVariable: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on setSystemVariable:`, JSON.stringify(e));
        }
    }
    /**
     * Get all system variables available as array.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variablePrefix The string the variables to be retrieved should start with.
     * @returns An array containg all system variables.
     */
    async getSystemVariables(hostName, useHttps, variablePrefix) {
        const requestData = "string result=dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames();";
        const requestConfig = this.getRequestConfig("text/plain", undefined, undefined, useHttps, true, hostName === "localhost" ? false : true);
        let data = "";
        let res;
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            logging_1.rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            logging_1.rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            data = (0, utils_1.extractEnclosedString)(response.data, "<result>", "</result>", logging_1.rootAddonLogger);
            logging_1.rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);
            res = data.split("\t");
            if (variablePrefix === undefined) {
                return res;
            }
            else {
                for (let i = 0; i < res.length; i++) {
                    if (!(res[i].startsWith(variablePrefix))) {
                        res.splice(i, 1);
                        i--;
                    }
                }
                return res;
            }
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on getSystemVariables: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on getSystemVariables:`, JSON.stringify(e));
            res = undefined;
        }
    }
    /**
     * Create a system variable in the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to create.
     * @param variableInfo The info of the system variable to create.
     */
    async createSystemVariable(hostName, useHttps, variableName, variableInfo) {
        const requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('${variableName}');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('${variableInfo}');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);`;
        /*
        public async createSystemVariable(hostName: string, useHttps: boolean, variableData: HomeMaticSystemvariableString | HomeMaticSystemvariableFloat | HomeMaticSystemvariableBinary | HomeMaticSystemvariableInteger): Promise<string | undefined> {
        let requestData = "";
        switch (variableData.valueType) {
            case "ivtString":
                variableData = variableData as HomeMaticSystemvariableString;
                requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);
                                object svObj=dom.CreateObject(OT_VARDP);
                                svObj.Name('${variableData.name}');
                                sv.Add(svObj.ID());
                                svObj.ValueType(${variableData.valueType});
                                svObj.ValueSubType(${variableData.valueSubType});
                                svObj.DPInfo('${variableData.info}');
                                svObj.ValueUnit('${variableData.valueUnit}');
                                svObj.DPArchive(false);
                                svObj.State('${variableData.state}');
                                svObj.Internal(false);
                                svObj.Visible(true);
                                dom.RTUpdate(false);`;
                break;
            case "ivtFloat":
                variableData = variableData as HomeMaticSystemvariableFloat;
                requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);
                                object svObj=dom.CreateObject(OT_VARDP);
                                svObj.Name('${variableData.name}');
                                sv.Add(svObj.ID());
                                svObj.ValueType(${variableData.valueType});
                                svObj.ValueSubType(${variableData.valueSubType});
                                svObj.DPInfo('${variableData.info}');
                                svObj.ValueUnit('${variableData.valueUnit}');
                                svObj.ValueMin(${variableData.valueMin});
                                svObj.ValueMax(${variableData.valueMax});
                                svObj.State(${variableData.state});
                                svObj.Internal(false);
                                svObj.Visible(true);
                                dom.RTUpdate(false);`;
                break;
            case "ivtBinary":
                variableData = variableData as HomeMaticSystemvariableBinary;
                requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);
                                object svObj=dom.CreateObject(OT_VARDP);
                                svObj.Name('${variableData.name}');
                                sv.Add(svObj.ID());
                                svObj.ValueType(${variableData.valueType});
                                svObj.ValueSubType(${variableData.valueSubType});
                                svObj.DPInfo('${variableData.info}');
                                svObj.ValueUnit('${variableData.valueUnit}');
                                svObj.ValueName0('${variableData.valueName0}');
                                svObj.ValueName1('${variableData.valueName1}');
                                svObj.State(${variableData.state});
                                dom.RTUpdate(false);`;
                break;
            case "ivtInteger":
                variableData = variableData as HomeMaticSystemvariableInteger;
                requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);
                                object svObj=dom.CreateObject(OT_VARDP);
                                svObj.Name('${variableData.name}');
                                sv.Add(svObj.ID());
                                svObj.ValueType(${variableData.valueType});
                                svObj.ValueSubType(${variableData.valueSubType});
                                svObj.DPInfo('${variableData.info}');
                                svObj.ValueList('${variableData.valueList}');
                                svObj.State(${variableData.state});
                                dom.RTUpdate(false);`;
                break;
        }
        */
        const requestConfig = this.getRequestConfig("text/plain", undefined, undefined, useHttps, true, hostName === "localhost" ? false : true);
        let data = "";
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            logging_1.rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            logging_1.rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            data = (0, utils_1.extractEnclosedString)(response.data, "<svObj>", "</svObj>", logging_1.rootAddonLogger);
            logging_1.rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);
            return data;
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on createSystemVariable: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on createSystemVariable:`, JSON.stringify(e));
            return undefined;
        }
    }
    /**
     * Remove a system variable from the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to remove.
     */
    async removeSystemVariable(hostName, useHttps, variableName) {
        const requestData = `string result='false';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject = dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName == '${variableName}'){dom.DeleteObject(svObject);result='true';break;}}`;
        const requestConfig = this.getRequestConfig("text/plain", undefined, undefined, useHttps, true, hostName === "localhost" ? false : true);
        let data = "";
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            logging_1.rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            logging_1.rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            data = (0, utils_1.extractEnclosedString)(response.data, "<result>", "</result>", logging_1.rootAddonLogger);
            logging_1.rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);
            return data;
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on removeSystemVariable: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on removeSystemVariable:`, JSON.stringify(e));
            return undefined;
        }
    }
    /**
     * Send a command to the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param command The command to be executed.
     */
    async sendInteractionCommand(hostName, useHttps, useLocalCertificate, rejectUnauthorized, user, password, command) {
        const requestData = command;
        const requestConfig = this.getRequestConfig("text/plain", hostName !== "localhost" ? user : undefined, hostName !== "localhost" ? password : undefined, useHttps, useLocalCertificate, rejectUnauthorized);
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            logging_1.rootAddonLogger.debug(`Response content: request.data: ${JSON.stringify(response.data)}`);
            logging_1.rootAddonLogger.debug(`Response content: request.status: ${response.status} | request.statusText: ${response.statusText}`);
            return response.status;
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`CCU request error on sendInteractionCommand: code: ${e.code}; message: ${e.message.trim()}`);
            logging_1.rootAddonLogger.debug(`CCU request error on sendInteractionCommand:`, JSON.stringify(e));
            throw e;
        }
    }
    /**
     * Checks if a given sid represents a currently authenticated session.
     * @param sid The sid to check.
     * @returns true, if the sid is correct, otherwise false.
     */
    async checkSid(sid) {
        try {
            const promisifyExec = (0, util_1.promisify)(child_process_1.exec);
            const result = await promisifyExec(`tclsh /usr/local/addons/eufySecurity/www/sessionCheck.cgi ${sid}`);
            if (result.stdout.trim() === "1") {
                return true;
            }
            else {
                return false;
            }
        }
        catch (e) {
            logging_1.rootAddonLogger.error(`Error occured while checking sid.`, { error: e });
            return false;
        }
    }
    /**
     * Returns the version info of the homematic api.
     */
    getHomematicApiVersion() {
        return "3.2.0";
    }
}
exports.HomematicApi = HomematicApi;
