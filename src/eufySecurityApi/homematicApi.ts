import axios from "axios";
import { existsSync, readFileSync } from 'fs';
import { EufySecurityApi } from './eufySecurityApi';

/**
 * Working with the CCU.
 */
export class HomematicApi
{
    private api : EufySecurityApi;
    
    /**
     * Create the api object.
     */
    constructor(api : EufySecurityApi)
    {
        this.api = api;
    }

    /**
     * Checks weather the system variable is available on the CCU.
     * @param variableName The name of the system variable to check.
     */
    public async isSystemVariableAvailable(variableName : string) : Promise<boolean>
    {
        var res = await this.getSystemVariable(variableName);
        if(res == "null")
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    /**
     * Get the vaulue of a given system variable.
     * @param variableName The name of the system variable to get.
     */
    public async getSystemVariable(variableName : string) : Promise<string>
    {
        var data = "";
        
        var response = await axios.get("http://localhost:8181/esapi.exe?result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').Value()");

        data = response.data;
        data = data.substring(data.indexOf("<result>"));
        data = data.substring(8, data.indexOf("</result>"));

        return data;
    }

    /**
     * Set the given variable to the given value.
     * @param variableName The name of the system variable to set.
     * @param value The value to set.
     */
    public async setSystemVariable(variableName : string, value : string) : Promise<void>
    {
        var data = "";
        
        var response = await axios.post("http://localhost:8181/esapi.exe", "dom.GetObject(ID_SYSTEM_VARIABLES).Get('" + variableName + "').State('" + value + "')", { headers : {'Content-Type': 'text/plain' } });
        
        data = response.data;
        data = data.substring(data.indexOf("<result>"));
        data = data.substring(8, data.indexOf("</result>"));

        //return data;
    }

    /**
     * Create a system variable in the CCU.
     * @param variableName The name of the system variable to create.
     * @param variableInfo The info of the system variable to create.
     */
    public async createSystemVariable(variableName : string, variableInfo : string) : Promise<string>
    {
        var data = "";
        
        var response = await axios.post("http://localhost:8181/esapi.exe", "object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('" + variableName + "');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('" + variableInfo + "');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);", { headers : {'Content-Type': 'text/plain' } });

        data = response.data;
        data = data.substring(data.indexOf("<svObj>"));
        data = data.substring(7, data.indexOf("</svObj>"));

        return data;
    }

    /**
     * Returns the content of the logile.
     */
    public async getLogFileContent() : Promise<string>
    {
        if(existsSync('/var/log/eufySecurity.log') == true)
        {
            var fileContent = readFileSync('/var/log/eufySecurity.log', 'utf-8');
            if(fileContent == "")
            {
                return "Die Datei '/var/log/eufySecurity.log' ist leer.";
            }
            else
            {
                return fileContent;
            }
        }
        else
        {
            this.api.logError("File '/var/log/eufySecurity.log' not found.");
            return "Datei '/var/log/eufySecurity.log' wurde nicht gefunden.";
        }
    }

    /**
     * Returns the content of the errorfile.
     */
    public async getErrorFileContent() : Promise<string>
    {
        if(existsSync('/var/log/eufySecurity.err') == true)
        {
            var fileContent = readFileSync('/var/log/eufySecurity.err', 'utf-8');
            if(fileContent == "")
            {
                return "Die Datei '/var/log/eufySecurity.err' ist leer.";
            }
            else
            {
                return fileContent;
            }
        }
        else
        {
            this.api.logError("File '/var/log/eufySecurity.err' not found.");
            return "Datei '/var/log/eufySecurity.err' wurde nicht gefunden.";
        }
    }

    /**
     * Returns the version info of the homematic api.
     */
    public getHomematicApiVersion() : string
    {
        return "1.5.1";
    }
}