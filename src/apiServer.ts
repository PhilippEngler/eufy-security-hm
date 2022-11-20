import { createServer as createServerHttp, IncomingMessage, ServerResponse } from 'http';
import { createServer as createServerHttps } from 'https';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';
import { EufySecurityApi } from './eufySecurityApi/eufySecurityApi';
import { GuardMode } from './eufySecurityApi/http';
import { Logger } from './eufySecurityApi/utils/logging';
import { exec } from 'child_process';

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
        apiPortFile(api.getHttpActive(), api.getHttpPort(), api.getHttpsActive(), api.getHttpsPort());
        this.startServer(api.getHttpActive(), api.getHttpPort(), api.getHttpsActive(), api.getHttpsPort(), api.getHttpsPKeyFile(), api.getHttpsCertFile(), logger);
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
        logger.logInfoBasic(`eufy-security-hm version ${api.getEufySecurityApiVersion()} (${api.getEufySecurityClientVersion()})`);
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
                    case "getAccountInfo":
                        responseString = await api.getAccountInfoAsJson();
                        break;
                    case "getDevices":
                        responseString = await api.getDevicesAsJson();
                        break;
                    case "getDevice":
                        if(url.length == 3)
                        {
                            responseString = await api.getDeviceAsJson(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDevicePropertiesMetadata":
                        if(url.length == 3)
                        {
                            responseString = await api.getDevicePropertiesMetadataAsJson(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDeviceProperties":
                        if(url.length == 3)
                        {
                            responseString = await api.getDevicePropertiesAsJson(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDevicePropertiesTruncated":
                        if(url.length == 3)
                        {
                            var json = JSON.parse(await api.getDevicePropertiesAsJson(url[2]));
                            if(json.success == true)
                            {
                                json.data.serialNumber = replaceLastChars(json.data.serialNumber, "X", 6);
                                json.data.stationSerialNumber = replaceLastChars(json.data.stationSerialNumber, "X", 6);
                                json.data.pictureUrl = "REMOVED DUE TO PRIVACY REASONS.";
                            }
                            responseString = JSON.stringify(json);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "setDeviceProperty":
                        if(url.length == 5)
                        {
                            responseString = await api.setDeviceProperty(url[2], url[3], url[4]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStations":
                    case "getBases":
                        responseString = await api.getStationsAsJson();
                        break;
                    case "getStation":
                    case "getBase":
                        if(url.length == 3)
                        {
                            responseString = await api.getStationAsJson(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationPropertiesMetadata":
                        if(url.length == 3)
                        {
                            responseString = await api.getStationPropertiesMetadataAsJson(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationProperties":
                        if(url.length == 3)
                        {
                            responseString = await api.getStationPropertiesAsJson(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationPropertiesTruncated":
                        if(url.length == 3)
                        {
                            var json = JSON.parse(await api.getStationPropertiesAsJson(url[2]));
                            if(json.success == true)
                            {
                                json.data.serialNumber = replaceLastChars(json.data.serialNumber, "X", 6);
                                json.data.macAddress = "XX:XX:XX:XX:XX:XX";
                                json.data.lanIpAddress = "XXX.XXX.XXX.XXX";
                            }
                            responseString = JSON.stringify(json);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "setStationProperty":
                        if(url.length == 5)
                        {
                            responseString = await api.setStationProperty(url[2], url[3], url[4]);
                        }
                        else if(url[3] == "rebootStation" && url.length == 4)
                        {
                            responseString = await api.rebootStation(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getHouses":
                        responseString = await api.getHousesAsJson();
                        break;
                    case "getHouse":
                        if(url.length == 3)
                        {
                            responseString = await api.getHouseAsJson(url[2]);
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
                            responseString = await api.getGuardModeStation(url[2]);
                        }
                        else
                        {
                            responseString = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getConfig":
                        responseString = await api.getAPIConfigAsJson();
                        break;
                    case "getApiInfo":
                        responseString = api.getApiVersionAsJson();
                        break;
                    case "getApiState":
                        responseString = await api.getApiStateAsJson();
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
                                    responseString = `{"success":false,"message":"This mode cannot be set for all stations."}`;
                                    break;
                                case "privacyOff":
                                    responseString = `{"success":false,"message":"This mode cannot be set for all stations."}`;
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
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.GEO);
                                    break;
                                case "home":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.HOME);
                                    break;
                                case "off":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseString = await api.setGuardModeStation(url[2], GuardMode.SCHEDULE);
                                    break;
                                case "privacyOn":
                                    responseString = await api.setPrivacyMode(url[2], false);
                                    break;
                                case "privacyOff":
                                    responseString = await api.setPrivacyMode(url[2], true);
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
                        responseString = api.setTokenData("", 0);
                        break;
                    case "generateNewTrustedDeviceName":
                        responseString = api.generateNewTrustedDeviceNameJson();
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
                        responseString = readFileSync('config.json', 'utf-8');
                        contentType = "text/json";
                        var dateTime = new Date();
                        fileName = "config_" + dateTime.getFullYear().toString() + (dateTime.getMonth()+1).toString ().padStart(2, '0') + dateTime.getDate().toString ().padStart(2, '0') + "-" + dateTime.getHours().toString ().padStart(2, '0') + dateTime.getMinutes().toString ().padStart(2, '0') + dateTime.getSeconds().toString ().padStart(2, '0') + ".json";
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
                switch (url[1])
                {
                    case "setConfig":
                        var postData = "";
                        var isDataOK = true;
                        request.on("data", function (chunk) {
                            postData += chunk.toString();
                        });

                        request.on("end", async function(){
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

                            var trustedDeviceName = "";
                            if(postData.indexOf("trustedDeviceName") >= 0)
                            {
                                trustedDeviceName = getDataFromPOSTData(postData, "trustedDeviceName", "string");
                            }

                            var useHttp = false;
                            if(postData.indexOf("useHttp") >= 0)
                            {
                                useHttp = getDataFromPOSTData(postData, "useHttp", "boolean");
                            }

                            var apiporthttp = 52789;
                            if(postData.indexOf("httpPort") >= 0)
                            {
                                apiporthttp = getDataFromPOSTData(postData, "httpPort", "number");
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

                            var apiporthttps = 52790;
                            if(postData.indexOf("httpsPort") >= 0)
                            {
                                apiporthttps = getDataFromPOSTData(postData, "httpsPort", "number");
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

                            var apiconnectiontype = 1;
                            if(postData.indexOf("connectionType") >= 0)
                            {
                                apiconnectiontype = getDataFromPOSTData(postData, "connectionType", "number");
                            }

                            var apiuseudpstaticports = false;
                            if(postData.indexOf("useUdpStaticPorts") >= 0)
                            {
                                apiuseudpstaticports = getDataFromPOSTData(postData, "useUdpStaticPorts", "boolean");
                            }

                            var apiudpports : string[][] = [[],[]];
                            if(postData.indexOf("udpPortsStation") >= 0)
                            {
                                apiudpports = getAllUdpPortsForStations(postData);
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

                            var updatestatetimespan = 15;
                            if(postData.indexOf("updateStateIntervallTimespan") >= 0)
                            {
                                updatestatetimespan = getDataFromPOSTData(postData, "updateStateIntervallTimespan", "number");
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

                            var updatelinkstimespan = 15;
                            if(postData.indexOf("updateLinksIntervallTimespan") >= 0)
                            {
                                updatelinkstimespan = getDataFromPOSTData(postData, "updateLinksIntervallTimespan", "number");
                            }

                            var usepushservice = false;
                            if(postData.indexOf("usePushService") >= 0)
                            {
                                usepushservice = getDataFromPOSTData(postData, "usePushService", "boolean");
                            }

                            var apiloglevel = 0;
                            if(postData.indexOf("logLevel") >= 0)
                            {
                                apiloglevel = getDataFromPOSTData(postData, "logLevel", "number");
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
                            if(useHttps == true && (apiporthttps == 0 || apikeyfile == "" || apicertfile == ""))
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
                                apiPortFile(useHttp, Number(apiporthttp), useHttps, Number(apiporthttps));

                                responseString = await api.setConfig(username, password, country, language, trustedDeviceName, useHttp, apiporthttp, useHttps, apiporthttps, apikeyfile, apicertfile, apiconnectiontype, apiuseudpstaticports, apiudpports, useSystemVariables, apicameradefaultimage, apicameradefaultvideo, useupdatestateevent, useupdatestateintervall, updatestatetimespan, useupdatelinks, useupdatelinksonlywhenactive, updatelinkstimespan, usepushservice, apiloglevel);
                            }
                            else
                            {
                                responseString = `{"success":false,"serviceRestart":false,"message":"Got invalid settings data. Please check values."}`;
                            }

                            var resJson = JSON.parse(responseString);

                            response.setHeader('Access-Control-Allow-Origin', '*');
                            response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                            response.writeHead(200);
                            response.end(responseString);

                            if(resJson.success == true && resJson.serviceRestart == true)
                            {
                                logger.logInfoBasic("Settings saved. Restarting apiServer.");
                                restartServer();
                            }
                            else if(resJson.success == true && resJson.serviceRestart == false)
                            {
                                logger.logInfoBasic("Settings saved.");
                            }
                            else
                            {
                                logger.logInfoBasic("Error during saving settings.");
                            }
                        });
                        break;
                    case "uploadConfig":
                        var postData = "";
                        var isDataOK = true;
                        request.on("data", function (chunk) {
                            postData += chunk.toString();
                            if(request.headers['content-length'] !== undefined && Number.parseInt(request.headers['content-length']?.toString()) > 500000)
                            {
                                logger.logInfoBasic("Error during upload and saving config file: File is to large.");
                                request.destroy();
                            }
                        });

                        request.on("destroy", function () {
                            
                        });

                        request.on("end", function() {
                            responseString = "";
                            if(checkUploadedFileMetadata(postData) == false)
                            {
                                logger.logInfoBasic("Error during upload and saving config file: File metadata are unsopported or missing.");
                                responseString = `{"success":false,"serviceRestart":false,"message":"File metadata are unsopported or missing."}`;
                            }
                            else
                            {
                                var fileContent = getUploadFileContent(postData);
                                if(fileContent === undefined)
                                {
                                    if(responseString == "")
                                    {
                                        logger.logInfoBasic("Error during upload and saving config file: File content could not be determined.");
                                        responseString = `{"success":false,"serviceRestart":false,"message":"File content could not be determined."}`;
                                    }
                                    else
                                    {
                                        logger.logInfoBasic("Error during upload and saving config file: File metadata are unsopported or missing. File content could not be determined.");
                                        responseString = `{"success":false,"serviceRestart":false,"message":"File metadata are unsopported or missing. File content could not be determined."}`;
                                    }
                                }
                                else
                                {
                                    writeFileSync("config.json.upload", fileContent, 'utf-8');
                                    responseString = `{"success":true,"serviceRestart":true,"message":"File uploaded and saved."}`;
                                }
                            }

                            var resJson = JSON.parse(responseString);

                            response.setHeader('Access-Control-Allow-Origin', '*');
                            response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                            response.writeHead(200);
                            response.end(responseString);

                            if(resJson.success == true && resJson.serviceRestart == true)
                            {
                                logger.logInfoBasic("Config file uploaded and saved. Restarting apiServer.");
                                restartServer();
                            }
                            else
                            {
                                logger.logInfoBasic("Config file was not saved.");
                            }
                        });
                        break;
                    default:
                        responseString = `{"success":false,"message":"Unknown command."}`;
                        response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                        response.writeHead(200);
                        response.end(responseString);
                }
            }
            else
            {
                responseString = `{"success":false,"message":"Wrong amount of arguments."}`;
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
function apiPortFile(useHttp : boolean, httpPort : number, useHttps : boolean, httpsPort : number)
{
    try
    {
        if(existsSync('www/apiPorts.json'))
        {
            var resJson = JSON.parse(readFileSync('www/apiPorts.json', 'utf-8'));

            if(useHttp !== resJson.useHttp as boolean || httpPort !== Number.parseInt(resJson.httpPort) || useHttps !== resJson.useHttps as boolean || httpsPort !== Number.parseInt(resJson.httpsPort))
            {
                writeFileSync('www/apiPorts.json', `{"useHttp":${useHttp},"httpPort":${httpPort},"useHttps":${useHttps},"httpsPort":${httpsPort}}`);
            }
        }
        else
        {
            writeFileSync('www/apiPorts.json', `{"useHttp":${useHttp},"httpPort":${httpPort},"useHttps":${useHttps},"httpsPort":${httpsPort}}`);
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
function checkNumberValue(value : number, lowestValue : number, highestValue : number) : boolean
{
    try
    {
        var val = value;
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
            if(checkNumberValue(val, lowestValue, highestValue) == false)
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
        temp = temp.substring(2, temp.indexOf("----") - 2);
        return temp;
    }
    else if(dataType == "number")
    {
        var temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.replace("\r\n","");
        temp = temp.substring(2, temp.indexOf("----") - 2);
        return Number.parseInt(temp);
    }
    else if(dataType == "boolean")
    {
        var temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.substring(2, temp.indexOf("----") - 2);
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
 * Helperfunction for extracting the UDP ports for each setGuardModeStation from the post event.
 * @param postData The data from the post event.
 * @returns The array with the setGuardModeStationserials and the port number.
 */
function getAllUdpPortsForStations(postData : string) : string[][]
{
    var pos = postData.indexOf("udpPortsStation");
    var res : string[][] = [[],[]];
    var i = 0;
    while (pos > 0)
    {
        var temp = postData.substring(pos + 29);
        var stationSerial = postData.substring(pos + 15, pos + 31);
        temp = temp.replace("\r\n","");
        temp = temp.substring(5, temp.indexOf("----") - 2);
        res[i][0] = stationSerial;
        res[i][1] = temp;

        pos = postData.indexOf("udpPortsStation", pos + 19);
        i++;
    }
    return res;
}

/**
 * Checks if the received post data could be a config.json.
 * @param postData The postData to check.
 * @returns A boolean value.
 */
function checkUploadedFileMetadata(postData : string) : boolean
{
    var pos = postData.indexOf("Content-Disposition: form-data;");
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf("Content-Type: application/json");
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"accountData":`);
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"eMail":`);
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"password":`);
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"httpActive":`);
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"httpPort":`);
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"httpsActive":`);
    if(pos < 0)
    {
        return false;
    }
    pos = postData.indexOf(`"httpsPort":`);
    if(pos < 0)
    {
        return false;
    }
    return true;
}

/**
 * Retrieves the json-part containing the config.
 * @param postData The postData to check.
 * @returns A string value or undefined.
 */
function getUploadFileContent(postData : string) : string | undefined
{
    var start = postData.indexOf("{");
    if(start < 0)
    {
        return undefined;
    }
    var end = postData.lastIndexOf("}");
    if(end < 0)
    {
        return undefined;
    }
    return postData.substring(start, end+1);
}

/**
 * Will write config, stop the server and exit.
 */
async function stopServer()
{
    logger.logInfoBasic("Set service state to shutdown...");
    api.setServiceState("shutdown");
    logger.logInfoBasic("Stopping scheduled tasks...");
    api.clearScheduledTasks();
    logger.logInfoBasic("Stopping EufySecurityApi...");
    await api.close();
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

/**
 * Returns a string with the first numberOfChars chars from input, all other chars will be replaced by X. replaceLastCars("ABCDEFGH", "X", 2) will return "ABXXXXXX".
 * @param input The input string.
 * @param char The char replaces each char after position numberOfChars.
 * @param numberOfChars The number of chars which should not be replaced.
 * @returns The result string.
 */
function replaceLastChars(input : string, char : string, numberOfChars : number)
{
    return input.slice(0, numberOfChars) + Array(input.length - numberOfChars + 1).join(char);
}

main();