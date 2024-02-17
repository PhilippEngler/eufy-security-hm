import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EufySecurityApi } from './eufySecurityApi';
import { rootAddonLogger } from "./logging";

/**
 * Interacting with the CCU.
 */
export class HomematicApi
{
    private api: EufySecurityApi;
    
    /**
     * Create the api object.
     */
    constructor(api: EufySecurityApi)
    {
        this.api = api;
    }

    /**
     * Performs a request to the given url with given data and config.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param data The data for the request.
     * @param requestConfig The config.
     */
    private async request(hostName: string, useHttps: boolean, data: string, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse>
    {
        return await axios.post(this.getUrl(hostName, useHttps), data, requestConfig)
    }

    /**
     * Generate the url to connect to the ccu.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     */
    private getUrl(hostName: string, useHttps: boolean): string
    {
        return `http${useHttps === true ? "s" : ""}://${hostName}:8181/esapi.exe`;
    }

    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    public async getSystemVariable(hostName: string, useHttps: boolean, variableName: string): Promise<string | undefined>
    {
        var requestData = `string result='null';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject=dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName=='${variableName}'){result=svObject.Value();break;}}svName='null';svObject=null;`;
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        var data = "";
        this.getSystemVariables(hostName, useHttps);

        try{
            var response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));

            return data;
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on getSystemVariable(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on getSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }

    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    public async getSystemVariable1(hostName: string, useHttps: boolean, variableName: string): Promise<string | undefined>
    {
        var requestData = `result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').Value()`;
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        var data = "";

        try
        {
            var response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));

            return data;
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on getSystemVariable1(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on getSystemVariable1():`, JSON.stringify(error));
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
    public async setSystemVariable(hostName: string, useHttps: boolean, variableName: string, value: string): Promise<void>
    {
        var requestData = `dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').State('${value}')`;
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        var data = "";

        try
        {
            var response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            
            //return data;
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on setSystemVariable(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on setSystemVariable():`, JSON.stringify(error));
        }
    }

    /**
     * Get all system variables available as array.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variablePrefix The string the variables to be retrieved should start with.
     * @returns An array containg all system variables.
     */
    public async getSystemVariables(hostName: string, useHttps: boolean, variablePrefix?: string): Promise<string[] | undefined>
    {
        var requestData = "string result=dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames();";
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        var data = "";
        var res : string[] | undefined;

        try
        {
            var response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));

            res = data.split("\t");

            if(variablePrefix === undefined)
            {
                return res;
            }
            else
            {
                for (var i = 0; i < res.length; i++)
                {
                    if(!(res[i].startsWith(variablePrefix)))
                    {
                        res.splice(i, 1);
                        i--;
                    }
                }
                return res;
            }
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on getSystemVariables(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on getSystemVariables():`, JSON.stringify(error));
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
    public async createSystemVariable(hostName: string, useHttps: boolean, variableName: string, variableInfo: string): Promise<string | undefined>
    {
        var requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('${variableName}');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('${variableInfo}');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);`;
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        var data = "";

        try
        {
            var response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<svObj>"));
            data = data.substring(7, data.indexOf("</svObj>"));

            return data;
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on createSystemVariable(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on createSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }

    /**
     * Remove a system variable from the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to remove.
     */
    public async removeSystemVariable(hostName: string, useHttps: boolean, variableName: string): Promise<string | undefined>
    {
        var requestData = `string result='false';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject = dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName == '${variableName}'){dom.DeleteObject(svObject);result='true';break;}}`;
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        var data = "";

        try
        {
            var response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));

            return data;
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on removeSystemVariable(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on removeSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }

    /**
     * Send a command to the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param command The command to be executed.
     */
    public async sendInteractionCommand(hostName: string, useHttps: boolean, command: string): Promise<void>
    {
        var requestData = command;
        var requestConfig = { headers : {'Content-Type': 'text/plain' } };

        try
        {
            await this.request(hostName, useHttps, requestData, requestConfig);
        }
        catch(error : any)
        {
            rootAddonLogger.error(`CCU request error on sendInteractionCommand(): code: ${error.code}; message: ${error.message}`);
            rootAddonLogger.debug(`CCU request error on sendInteractionCommand():`, JSON.stringify(error));
        }
    }

    /**
     * Returns the version info of the homematic api.
     */
    public getHomematicApiVersion(): string
    {
        return "3.0.0";
    }
}