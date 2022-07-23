import { createServer as createServerHttp, IncomingMessage, ServerResponse } from 'http';
import { createServer as createServerHttps } from 'https';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';
import { EufySecurityApi } from './eufySecurityApi/eufySecurityApi';
import { GuardMode, PropertyName } from './eufySecurityApi/http';
import { Logger } from './eufySecurityApi/utils/logging';
import { exec } from 'child_process';
import { log } from 'console';

process.chdir(__dirname);
var apiServer !: ApiServer;
var serverHttp = createServerHttp();
var serverHttps = createServerHttps();
var api = new EufySecurityApi();
var logger = new Logger(api);

class ApiServer
{
    /**
     * Create the ApiServer-Object.
     */
    constructor()
    {
        apiPortFile(api.getApiServerPortHttp(), api.getApiServerPortHttps());
        this.startServer(api.getApiUseHttp(), api.getApiServerPortHttp(), api.getApiUseHttps(), api.getApiServerPortHttps(), api.getApiServerKeyHttps(), api.getApiServerCertHttps(), logger);
    }

    /**
     * Start the apiServer.
     * @param httpActive The http should be used.
     * @param portHttp The HTTP port the server will serve.
     * @param httpsActive The https server should be used.
     * @param portHttps The HTTPS port the server will serve.
     * @param keyHttps The key for https.
     * @param certHttps The cert for https.
     * @param logger The logger component.
     */
    public async startServer(httpActive : boolean, portHttp : number, httpsActive : boolean, portHttps : number, keyHttps : string, certHttps : string, logger : Logger)
    {
        logger.logInfoBasic(`eufy_security_hm version ${api.getEufySecurityApiVersion()} (${api.getEufySecurityClientVersion()})`);
        logger.logInfoBasic(`  Platform: ${process.platform}_${process.arch}`);
        logger.logInfoBasic(`  Node: ${process.version}`);
        if(httpActive == true)
        {
            logger.logInfoBasic("Starting http server...");
            serverHttp.on("error", this.errorListener)
            serverHttp.on("request", this.requestListener);
            serverHttp.listen(portHttp);
            logger.logInfoBasic(`...started. http listening on port '${portHttp}'`);
        }

        if(httpsActive == true)
        {
            logger.logInfoBasic("Starting https server...");
            if(existsSync(keyHttps) && existsSync(certHttps))
            {
                const options = {
                    key: readFileSync(keyHttps),
                    cert: readFileSync(certHttps)
                };
                serverHttps.setSecureContext(options);
                serverHttps.on("error", this.errorListener)
                serverHttps.on("request", this.requestListener);
                serverHttps.listen(portHttps);
                logger.logInfoBasic(`...started. https listening on port '${portHttps}'`);
            }
            else
            {
                logger.logErrorBasis("FAILED TO START SERVER (HTTPS): key or cert file not found.");
            }
        }
    }

    /**
     * The error listener for the api.
     * @param error The error object.
     */
    private async errorListener (error : any) : Promise<void>
    {
        if(error.code == "EADDRINUSE")
        {
            logger.logErrorBasis(`Errorcode: ${error.code}: port '${error.port}' already in use.`);
        }
        else
        {
            logger.logErrorBasis(`Errorcode: ${error.code}: ${error.message}`);
        }
    }
    
    /**
     * The request listener for the api.
     * @param request The request object.
     * @param response The response object.
     */
    private async requestListener (request : IncomingMessage, response : ServerResponse) : Promise<void>
    {
        var responseString = "";
        var contentType = "application/json";
        var fileName = "";

        var url = request.url?.split("/");

        if(url == undefined)
        {
            url = [];
        }

        // We use 'GET' for nearly all function of the api, exept updateing the config
        if(request.method == "GET")
        {
            if(url.length > 1)
            {
                switch (url[1])
                {
                    case "getServiceState":
                        responseString = `{"success":true,"message":"${api.getServiceState()}"}`;
                        break;
                    case "getDevices":
                        responseString = await api.getDevicesAsJSON();
                        break;
                    case "getDevice":
                        if(url.length == 3)
                        {
                            responseString = await api.getDeviceAsJSON(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getBases":
                        responseString = await api.getBasesAsJSON();
                        break;
                    case "getBase":
                        if(url.length == 3)
                        {
                            responseString = await api.getBaseAsJSON(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getHouses":
                        responseString = await api.getHousesAsJSON();
                        break;
                    case "getHouse":
                        if(url.length == 3)
                        {
                            responseString = await api.getHouseAsJSON(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getMode":
                        if(url.length == 2)
                        {
                            responseString = await api.getGuardMode();
                        }
                        else if(url.length == 3)
                        {
                            responseString = await api.getGuardModeBase(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getConfig":
                        responseString = api.getConfig();
                        break;
                    case "getApiInfo":
                        responseString = api.getApiVersion();
                        break;
                    case "setMode":
                        if(url.length == 3)
                        {
                            switch (url[2])
                            {
                                case "away":
                                    responseString = await api.setGuardMode(GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseString = await api.setGuardMode(GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseString = await api.setGuardMode(GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseString = await api.setGuardMode(GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseString = await api.setGuardMode(GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseString = await api.setGuardMode(GuardMode.GEO);
                                    break;
                                case "home":
                                    responseString = await api.setGuardMode(GuardMode.HOME);
                                    break;
                                case "off":
                                    responseString = await api.setGuardMode(GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseString = await api.setGuardMode(GuardMode.SCHEDULE);
                                    break;
                                case "privacyOn":
                                    responseString = `{"success":false,"message":"This mode cannot be set for all bases"}`;
                                    break;
                                case "privacyOff":
                                    responseString = `{"success":false,"message":"This mode cannot be set for all bases"}`;
                                    break;
                                default:
                                    responseString = `{"success":false,"message":"Unknown mode to set."}`;
                            }
                        }
                        else if(url.length == 4)
                        {
                            switch (url[3])
                            {
                                case "away":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.GEO);
                                    break;
                                case "home":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.HOME);
                                    break;
                                case "off":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.SCHEDULE);
                                    break;
                                case "privacyOn":
                                    responseString = await api.setPrivacyMode(url[2], PropertyName.DeviceEnabled, false);
                                    break;
                                case "privacyOff":
                                    responseString = await api.setPrivacyMode(url[2], PropertyName.DeviceEnabled, true);
                                    break;
                                default:
                                    responseString = `{"success":false,"message":"Unknown mode to set."}`;
                            }
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "checkSystemVariables":
                        responseString = await api.checkSystemVariables();
                        break;
                    case "createSystemVariable":
                        if(url.length == 3)
                        {
                            responseString = await api.createSystemVariable(url[2], "");
                        }
                        else if(url.length == 4)
                        {
                            responseString = await api.createSystemVariable(url[2], decodeURIComponent(url[3]));
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getLibrary":
                        if(url.length == 2)
                        {
                            responseString = await api.getLibrary();
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getLogFileContent":
                        responseString = await api.getLogFileContent();
                        break;
                    case "getErrorFileContent":
                        responseString = await api.getErrorFileContent();
                        break;
                    case "removeTokenData":
                        responseString = api.setTokenData("", "0");
                        break;
                    case "clearLogFile":
                        emptyLogFile();
                        responseString = `{"success":true}`;
                        break;
                    case "clearErrFile":
                        emptyErrFile();
                        responseString = `{"success":true}`;
                        break;
                    case "restartService":
                        restartServer();
                        responseString = `{"success":true}`;
                        break;
                    case "downloadConfig":
                        api.writeConfig();
                        responseString = readFileSync('config.ini', 'utf-8');
                        contentType = "text/plain";
                        var dateTime = new Date();
                        fileName = "config_" + dateTime.getFullYear().toString() + (dateTime.getMonth()+1).toString ().padStart(2, '0') + dateTime.getDate().toString ().padStart(2, '0') + "-" + dateTime.getHours().toString ().padStart(2, '0') + dateTime.getMinutes().toString ().padStart(2, '0') + dateTime.getSeconds().toString ().padStart(2, '0') + ".ini";
                        break;
                    case "downloadLogFile":
                        responseString = readFileSync('/var/log/eufySecurity.log', 'utf-8');
                        contentType = "text/plain";
                        fileName = "eufySecurity.log";
                        break;
                    case "downloadErrFile":
                        responseString = readFileSync('/var/log/eufySecurity.err', 'utf-8');
                        contentType = "text/plain";
                        fileName = "eufySecurity.err";
                        break;
                    default:
                        responseString = `{"success":false,"message":"Unknown command."}`;
                }
                
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', contentType + '; charset=UTF-8');

                if(contentType == "application/json")
                {
                    response.writeHead(200);
                    response.end(responseString);
                }
                else
                {
                    response.setHeader("Content-Disposition", "attachment;filename=" + fileName);
                    response.end(responseString);
                }
            }
            else
            {
                responseString = `{"success":false,"message":"Unknown command."}`;
                
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', '; charset=UTF-8');

                response.writeHead(200);
                response.end(responseString);
            }
        }
        // We must handele the change config throught POST based on the form data we receive...
        else if(request.method == "POST")
        {
            if(url.length > 1)
            {
                if (url[1] == "setConfig")
                {
                    var postData = "";
                    var isDataOK = true;
                    request.on("data", function (chunk) {
                        postData += chunk.toString();
                    });

                    request.on("end", function(){
                        var username = "";
                        if(postData.indexOf("username") >= 0)
                        {
                            username = getDataFromPOSTData(postData, "username", "string");
                        }
                        
                        var password = "";
                        if(postData.indexOf("password") >= 0)
                        {
                            password = getDataFromPOSTData(postData, "password", "string");
                        }

                        var country = "";
                        if(postData.indexOf("country") >= 0)
                        {
                            country = getDataFromPOSTData(postData, "country", "string");
                        }

                        var language = "";
                        if(postData.indexOf("language") >= 0)
                        {
                            language = getDataFromPOSTData(postData, "language", "string");
                        }

                        var useHttp = false;
                        if(postData.indexOf("useHttp") >= 0)
                        {
                            useHttp = getDataFromPOSTData(postData, "useHttp", "boolean");
                        }
                        
                        var apiporthttp = "52789";
                        if(postData.indexOf("httpPort") >= 0)
                        {
                            apiporthttp = getDataFromPOSTData(postData, "httpPort", "string");
                        }
                        
                        var useHttps = false;
                        if(postData.indexOf("useHttps") >= 0)
                        {
                            useHttps = getDataFromPOSTData(postData, "useHttps", "boolean");
                        }
                        if(useHttp == false && useHttps == false)
                        {
                            isDataOK = false;
                        }

                        var apiporthttps = "52790";
                        if(postData.indexOf("httpsPort") >= 0)
                        {
                            apiporthttps = getDataFromPOSTData(postData, "httpsPort", "string");
                        }

                        var apikeyfile = "/usr/local/etc/config/server.pem";
                        if(postData.indexOf("httpsKeyFile") >= 0)
                        {
                            apikeyfile = getDataFromPOSTData(postData, "httpsKeyFile", "string");
                        }

                        var apicertfile = "/usr/local/etc/config/server.pem";
                        if(postData.indexOf("httpsCertFile") >= 0)
                        {
                            apicertfile = getDataFromPOSTData(postData, "httpsCertFile", "string");
                        }

                        var apiconnectiontype = "1";
                        if(postData.indexOf("connectionType") >= 0)
                        {
                            apiconnectiontype = getDataFromPOSTData(postData, "connectionType", "string");
                        }

                        var apiuseudpstaticports = false;
                        if(postData.indexOf("useUdpStaticPorts") >= 0)
                        {
                            apiuseudpstaticports = getDataFromPOSTData(postData, "useUdpStaticPorts", "boolean");
                        }

                        var apiudpports : string[][] = [[],[]];
                        if(postData.indexOf("udpPortsBase") >= 0)
                        {
                            apiudpports = getAllUdpPortsForBases(postData);
                        }

                        var useSystemVariables = false;
                        if(postData.indexOf("useSystemVariables") >= 0)
                        {
                            useSystemVariables = getDataFromPOSTData(postData, "useSystemVariables", "boolean");
                        }

                        var apicameradefaultimage = "";
                        if(postData.indexOf("defaultImagePath") >= 0)
                        {
                            apicameradefaultimage = getDataFromPOSTData(postData, "defaultImagePath", "string");
                        }

                        var apicameradefaultvideo = "";
                        if(postData.indexOf("defaultVideoPath") >= 0)
                        {
                            apicameradefaultvideo = getDataFromPOSTData(postData, "defaultVideoPath", "string");
                        }

                        var useupdatestateevent = false;
                        if(postData.indexOf("useUpdateStateEvent") >= 0)
                        {
                            useupdatestateevent = getDataFromPOSTData(postData, "useUpdateStateEvent", "boolean");
                        }

                        var useupdatestateintervall = false;
                        if(postData.indexOf("useUpdateStateIntervall") >= 0)
                        {
                            useupdatestateintervall = getDataFromPOSTData(postData, "useUpdateStateIntervall", "boolean");
                        }

                        var updatestatetimespan ="15";
                        if(postData.indexOf("updateStateIntervallTimespan") >= 0)
                        {
                            updatestatetimespan = getDataFromPOSTData(postData, "updateStateIntervallTimespan", "string");
                        }

                        var useupdatelinks = false;
                        if(postData.indexOf("useUpdateLinksIntervall") >= 0)
                        {
                            useupdatelinks = getDataFromPOSTData(postData, "useUpdateLinksIntervall", "boolean");
                        }

                        var useupdatelinksonlywhenactive = false;
                        if(postData.indexOf("useUpdateLinksOnlyWhenActive") >= 0)
                        {
                            useupdatelinksonlywhenactive = getDataFromPOSTData(postData, "useUpdateLinksOnlyWhenActive", "boolean");
                        }

                        var updatelinkstimespan ="15";
                        if(postData.indexOf("updateLinksIntervallTimespan") >= 0)
                        {
                            updatelinkstimespan = getDataFromPOSTData(postData, "updateLinksIntervallTimespan", "string");
                        }

                        var usepushservice = false;
                        if(postData.indexOf("usePushService") >= 0)
                        {
                            usepushservice = getDataFromPOSTData(postData, "usePushService", "boolean");
                            logger.logInfoBasic(`set pushservice: ${usepushservice}`);
                        }

                        var apiloglevel = "0";
                        if(postData.indexOf("logLevel") >= 0)
                        {
                            apiloglevel = getDataFromPOSTData(postData, "logLevel", "string");
                        }

                        if(checkNumberValue(apiporthttp, 1, 53535) == false)
                        {
                            isDataOK = false;
                        }
                        if(checkNumberValue(apiporthttps, 1, 53535) == false)
                        {
                            isDataOK = false;
                        }
                        if(apiuseudpstaticports == true)
                        {
                            /*if(checkNumbersValue(apiudpports, 0, 53535) == false)
                            {
                                isDataOK = false;
                            }*/
                        }
                        if(useHttps == true && (apiporthttps == "" || apikeyfile == "" || apicertfile == ""))
                        {
                            isDataOK = false;
                        }
                        if(checkNumberValue(apiloglevel, 0, 3) == false)
                        {
                            isDataOK = false;
                        }
                        if(checkNumberValue(updatestatetimespan, 15, 240) == false)
                        {
                            isDataOK = false;
                        }
                        if(checkNumberValue(updatelinkstimespan, 15, 240) == false)
                        {
                            isDataOK = false;
                        }
                        
                        if(isDataOK == true)
                        {
                            apiPortFile(Number(apiporthttp), Number(apiporthttps));

                            responseString = api.setConfig(username, password, country, language, useHttp, apiporthttp, useHttps, apiporthttps, apikeyfile, apicertfile, apiconnectiontype, apiuseudpstaticports, apiudpports, useSystemVariables, apicameradefaultimage, apicameradefaultvideo, useupdatestateevent, useupdatestateintervall, updatestatetimespan, useupdatelinks, useupdatelinksonlywhenactive, updatelinkstimespan, usepushservice, apiloglevel);
                        }
                        else
                        {
                            responseString = `{"success":false,"serviceRestart":false,"message":"Got invalid settings data. Please check values."}`;
                        }

                        var resJSON = JSON.parse(responseString);
                                                
                        response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                        
                        response.writeHead(200);
                        response.end(responseString);

                        if(resJSON.serviceRestart == true)
                        {
                            logger.logInfoBasic("Settings saved. Restarting apiServer.");
                            restartServer();
                        }
                        else
                        {
                            logger.logInfoBasic("Settings saved.");
                        }
                    });
                }
                else
                {
                    responseString = `{"success":false,"message":"Unknown command."}`;
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                    response.writeHead(200);
                    response.end(responseString);
                }
            }
            else
            {
                responseString = `{"success":false,"message":"Unknown command."}`;
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                response.writeHead(200);
                response.end(responseString);
            }
        }
        // Be polite and give a answer even we know that there is noting to answer...
        else
        {
            responseString = `{"success":false,"message":"Unknown command."}`;
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Content-Type', 'application/json; charset=UTF-8');

            response.writeHead(200);
            response.end(responseString);
        }
    }
}

/**
 * The main function will start the ApiServer
 */
function main()
{
    apiServer = new ApiServer();
}

/**
 * Create the apiPorts.txt file needed for using the api on the website if file does not exist or update it when the ports have changed. 
 * @param httpPort The new http port.
 * @param httpsPort The new https port.
 */
function apiPortFile(httpPort : number, httpsPort : number)
{
    try
    {
        if(existsSync("www/apiPorts.txt"))
        {
            if(api.getApiServerPortHttp() != httpPort || api.getApiServerPortHttps() != httpsPort)
            {
                writeFileSync('www/apiPorts.txt', httpPort + "," + httpsPort);
            }
        }
        else
        {
            writeFileSync('www/apiPorts.txt', httpPort + "," + httpsPort);
        }
    }
    catch (ENOENT)
    {
        
    }
}

/**
 * Checks if a given string is a number between two values.
 * @param value The value as string to check.
 * @param lowestValue The lowest value allowd.
 * @param highestValue The highest value allowed.
 */
function checkNumberValue(value : string, lowestValue : number, highestValue : number) : boolean
{
    try
    {
        var val = Number.parseInt(value);
        if(val >= lowestValue && val <= highestValue)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    catch
    {
        return false;
    }
}

/**
 * Checks if a given string contains an array of number and each number is between two values.
 * @param values The value as string to check.
 * @param lowestValue The lowest value allowd.
 * @param highestValue The highest value allowed.
 */
function checkNumbersValue(values : string, lowestValue : number, highestValue : number) : boolean
{
    if(values == "")
    {
        return false;
    }

    var vals = (values.split(",")).map((i) => Number(i));
    if(vals.length > 0)
    {
        for (var val of vals)
        {
            if(checkNumberValue(val.toString(), lowestValue, highestValue) == false)
            {
                return false;
            }
        }
        return true;
    }
    return false;
}

/**
 * Extracting the given value from the POST data result.
 * @param postData The POST data from the settings website.
 * @param target The setting to be seached for.
 * @param dataType The type of the return data (at the moment string and boolean).
 */
function getDataFromPOSTData(postData : string, target : string, dataType : string) : any
{
    if(dataType == "string")
    {
        var temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.replace("\r\n","");
        temp = temp.substr(2, temp.indexOf("----") - 4);
        return temp;
    }
    else if(dataType == "boolean")
    {
        var temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.substr(2, temp.indexOf("----") - 4);
        if(temp.trim() == "on")
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    return null;
}

/**
 * Helperfunction for extracting the UDP ports for each base from the post event.
 * @param postData The data from the post event.
 * @returns The array with the baseserials and the port number.
 */
function getAllUdpPortsForBases(postData : string) : string[][]
{
    var pos = postData.indexOf("udpPortsBase");
    var res : string[][] = [[],[]];
    var i = 0;
    while (pos > 0)
    {
        var temp = postData.substring(pos + 29);
        var basesn = postData.substring(pos + 12, pos + 28);
        temp = temp.replace("\r\n","");
        temp = temp.substring(2, temp.indexOf("----") - 2);
        res[i][0] = basesn;
        res[i][1] = temp;

        pos = postData.indexOf("udpPortsBase", pos + 16);
        i++;
    }
    return res;
}

/**
 * Will write config, stop the server and exit.
 */
async function stopServer()
{
    logger.logInfoBasic("Set service state to shutdown...");
    api.setServiceState("shutdown");
    logger.logInfoBasic("Stopping Push Service...");
    api.closePushService();
    logger.logInfoBasic("Stopping P2P-Connections...");
    await api.closeP2PConnections();
    logger.logInfoBasic("Stopping scheduled tasks...");
    api.clearScheduledTasks();
    logger.logInfoBasic("Write config...");
    api.writeConfig();
    logger.logInfoBasic("Stopping...");
    serverHttp.close();
    logger.logInfoBasic("Stopped...");
}

/**
 * Will write config and restart the server.
 */
async function restartServer()
{
    logger.logInfoBasic("Going to restart with apiServerRestarter...");
    exec("/usr/local/addons/eufySecurity/bin/node /usr/local/addons/eufySecurity/apiServerRestarter.js");
}

/**
 * Clear the logfile
 */
function emptyLogFile()
{
    exec("truncate -s 0 /var/log/eufySecurity.log");
}

/**
 * Clear the errorlogfile
 */
function emptyErrFile()
{
    exec("truncate -s 0 /var/log/eufySecurity.err");
}

/**
 * Wait-function for waiting between stop and start when restarting. 
 */
function wait10Seconds() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("");
        }, 10000);
    });
}

process.on('SIGTERM', async () => {
    logger.logInfoBasic("SIGTERM signal received. Save config and shutdown server...");
    await stopServer();
    logger.logInfoBasic("...done. Exiting");
    exit(0);
});

process.on('SIGINT', async () => {
    logger.logInfoBasic("SIGINT signal received. Save config and shutdown server...");
    await stopServer();
    logger.logInfoBasic("...done. Exiting");
    exit(0);
});

main();