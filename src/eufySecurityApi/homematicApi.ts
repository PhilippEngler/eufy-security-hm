import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EufySecurityApi } from "./eufySecurityApi";
import { rootAddonLogger } from "./logging";
import { promisify } from "util";
import { exec } from "child_process";
import { extractEnclosedString } from "./utils/utils";

/**
 * Interacting with the CCU.
 */
export class HomematicApi {
    private api: EufySecurityApi;
    private portHttp: number = 8181;
    private portHttps: number = 8181;

    /**
     * Create the api object.
     */
    constructor(api: EufySecurityApi) {
        this.api = api;
    }

    /**
     * Performs a request to the given url with given data and config.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param data The data for the request.
     * @param requestConfig The config.
     */
    private async request(hostName: string, useHttps: boolean, data: string, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse> {
        return await axios.post(this.getUrl(hostName, useHttps), data, requestConfig)
    }

    /**
     * Generate the url to connect to the ccu.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     */
    private getUrl(hostName: string, useHttps: boolean): string {
        return `http${useHttps === true ? "s" : ""}://${hostName}:${useHttps === true ? this.portHttp : this.portHttps}/esapi.exe`;
    }

    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    public async getSystemVariable(hostName: string, useHttps: boolean, variableName: string): Promise<string | undefined> {
        const requestData = `string result='null';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject=dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName=='${variableName}'){result=svObject.Value();break;}}svName='null';svObject=null;`;
        const requestConfig = { headers: {"Content-Type": "text/plain" } };

        let data = "";
        this.getSystemVariables(hostName, useHttps);

        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = extractEnclosedString(response.data, "<result>", "</result>", rootAddonLogger);
            rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            return data;
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on getSystemVariable(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on getSystemVariable():`, JSON.stringify(e));
            return undefined;
        }
    }

    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    public async getSystemVariable1(hostName: string, useHttps: boolean, variableName: string): Promise<string | undefined> {
        const requestData = `result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').Value()`;
        const requestConfig = { headers: {"Content-Type": "text/plain" } };

        let data = "";

        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = extractEnclosedString(response.data, "<result>", "</result>", rootAddonLogger);
            rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            return data;
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on getSystemVariable1(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on getSystemVariable1():`, JSON.stringify(e));
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
    public async setSystemVariable(hostName: string, useHttps: boolean, variableName: string, value: string): Promise<void> {
        const requestData = `dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').State('${value}')`;
        const requestConfig = { headers: {"Content-Type": "text/plain" } };

        //let data = "";

        try {
            await this.request(hostName, useHttps, requestData, requestConfig);
            //const response = await this.request(hostName, useHttps, requestData, requestConfig);
            //data = extractEnclosedString(response.data, "<result>", "</result>", rootAddonLogger);
            //rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            //return data;
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on setSystemVariable(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on setSystemVariable():`, JSON.stringify(e));
        }
    }

    /**
     * Get all system variables available as array.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variablePrefix The string the variables to be retrieved should start with.
     * @returns An array containg all system variables.
     */
    public async getSystemVariables(hostName: string, useHttps: boolean, variablePrefix?: string): Promise<string[] | undefined> {
        const requestData = "string result=dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames();";
        const requestConfig = { headers: {"Content-Type": "text/plain" } };

        let data = "";
        let res: string[] | undefined;

        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = extractEnclosedString(response.data, "<result>", "</result>", rootAddonLogger);
            rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            res = data.split("\t");

            if(variablePrefix === undefined) {
                return res;
            } else {
                for (let i = 0; i < res.length; i++) {
                    if(!(res[i].startsWith(variablePrefix))) {
                        res.splice(i, 1);
                        i--;
                    }
                }
                return res;
            }
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on getSystemVariables(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on getSystemVariables():`, JSON.stringify(e));
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
    public async createSystemVariable(hostName: string, useHttps: boolean, variableName: string, variableInfo: string): Promise<string | undefined> {
        const requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('${variableName}');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('${variableInfo}');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);`;
        const requestConfig = { headers: {"Content-Type": "text/plain" } };

        let data = "";

        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = extractEnclosedString(response.data, "<svObj>", "</svObj>", rootAddonLogger);
            rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            return data;
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on createSystemVariable(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on createSystemVariable():`, JSON.stringify(e));
            return undefined;
        }
    }

    /**
     * Remove a system variable from the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to remove.
     */
    public async removeSystemVariable(hostName: string, useHttps: boolean, variableName: string): Promise<string | undefined> {
        const requestData = `string result='false';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject = dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName == '${variableName}'){dom.DeleteObject(svObject);result='true';break;}}`;
        const requestConfig = { headers: {"Content-Type": "text/plain" } };

        let data = "";

        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = extractEnclosedString(response.data, "<result>", "</result>", rootAddonLogger);
            rootAddonLogger.debug(`Result of extractEnclosedString: ${data}`);

            return data;
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on removeSystemVariable(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on removeSystemVariable():`, JSON.stringify(e));
            return undefined;
        }
    }

    /**
     * Send a command to the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param command The command to be executed.
     */
    public async sendInteractionCommand(hostName: string, useHttps: boolean, user: string | undefined, password: string | undefined, command: string): Promise<number> {
        const requestData = command;
        let headers: any = {"Content-Type": "text/plain"};
        if (hostName !== "localhost" && user && password) {
            headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
        }
        const requestConfig = { "headers": headers };

        try {
            const res = await this.request(hostName, useHttps, requestData, requestConfig);
            return res.status;
        } catch (e: any) {
            rootAddonLogger.error(`CCU request error on sendInteractionCommand(): code: ${e.code}; message: ${e.message}`);
            rootAddonLogger.debug(`CCU request error on sendInteractionCommand():`, JSON.stringify(e));
            throw e;
        }
    }

    /**
     * Checks if a given sid represents a currently authenticated session.
     * @param sid The sid to check.
     * @returns true, if the sid is correct, otherwise false.
     */
    public async checkSid(sid: string): Promise<boolean> {
        try {
            const promisifyExec = promisify(exec);
            const result = await promisifyExec(`tclsh /usr/local/addons/eufySecurity/www/sessionCheck.cgi ${sid}`);
            if(result.stdout.trim() === "1") {
                return true;
            } else {
                return false;
            }
        } catch (e: any) {
            rootAddonLogger.error(`Error occured while checking sid.`, { error: e });
            return false;
        }
    }

    /**
     * Returns the version info of the homematic api.
     */
    public getHomematicApiVersion(): string {
        return "3.1.0";
    }
}