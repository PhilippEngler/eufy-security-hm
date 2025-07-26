"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const https_1 = require("https");
const os_1 = __importDefault(require("os"));
const fs_1 = require("fs");
const process_1 = require("process");
const eufySecurityApi_1 = require("./eufySecurityApi/eufySecurityApi");
const http_2 = require("./eufySecurityApi/http");
const child_process_1 = require("child_process");
const logging_1 = require("./eufySecurityApi/logging");
process.chdir(__dirname);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let apiServer;
const serverHttp = (0, http_1.createServer)();
const serverHttps = (0, https_1.createServer)();
let api;
class ApiServer {
    /**
     * Create the ApiServer-Object.
     */
    constructor() {
        logging_1.InternalLogger.logger = logging_1.dummyLogger;
        api = new eufySecurityApi_1.EufySecurityApi();
        apiPortFile(api.getHttpActive(), api.getHttpPort(), api.getHttpsActive(), api.getHttpsPort());
        this.startServer(api.getHttpActive(), api.getHttpPort(), api.getHttpsActive(), api.getHttpsPort(), api.getHttpsPKeyFile(), api.getHttpsCertFile());
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
    async startServer(httpActive, portHttp, httpsActive, portHttps, keyHttps, certHttps) {
        logging_1.rootAddonLogger.info(`eufy-security-hm version v${api.getEufySecurityApiVersion()} (${api.getEufySecurityClientVersion()})`);
        logging_1.rootAddonLogger.info(`  Host: ${os_1.default.hostname}`);
        logging_1.rootAddonLogger.info(`  Platform: ${os_1.default.platform}_${os_1.default.arch}`);
        logging_1.rootAddonLogger.info(`  Node: ${process.version}`);
        if (httpActive === true) {
            logging_1.rootAddonLogger.info("Starting http server...");
            serverHttp.on("error", this.errorListener);
            serverHttp.on("request", this.requestListener);
            serverHttp.listen(portHttp);
            logging_1.rootAddonLogger.info(`...started. http listening on port '${portHttp}'`);
        }
        if (httpsActive === true) {
            logging_1.rootAddonLogger.info("Starting https server...");
            if ((0, fs_1.existsSync)(keyHttps) && (0, fs_1.existsSync)(certHttps)) {
                const options = {
                    key: (0, fs_1.readFileSync)(keyHttps),
                    cert: (0, fs_1.readFileSync)(certHttps)
                };
                serverHttps.setSecureContext(options);
                serverHttps.on("error", this.errorListener);
                serverHttps.on("request", this.requestListener);
                serverHttps.listen(portHttps);
                logging_1.rootAddonLogger.info(`...started. https listening on port '${portHttps}'`);
            }
            else {
                let keyCertFileHint = "key file and/or cert file";
                if (!(0, fs_1.existsSync)(keyHttps) && !(0, fs_1.existsSync)(certHttps)) {
                    keyCertFileHint = "key file and cert file";
                }
                else if (!(0, fs_1.existsSync)(keyHttps) && (0, fs_1.existsSync)(certHttps)) {
                    keyCertFileHint = "key file";
                }
                else {
                    keyCertFileHint = "cert file";
                }
                logging_1.rootAddonLogger.error(`...failed. ${keyCertFileHint} not found`);
            }
        }
    }
    /**
     * The error listener for the api.
     * @param error The error object.
     */
    async errorListener(error) {
        if (error.code === "EADDRINUSE") {
            logging_1.rootAddonLogger.error(`Errorcode: ${error.code}: port '${error.port}' already in use.`);
        }
        else {
            logging_1.rootAddonLogger.error(`Errorcode: ${error.code}: ${error.message}`);
        }
    }
    /**
     * The request listener for the api.
     * @param request The request object.
     * @param response The response object.
     */
    async requestListener(request, response) {
        let responseData = "";
        let contentType = "application/json";
        let fileName = "";
        let url = request.url?.split("/");
        if (url === undefined) {
            url = [];
        }
        // we use 'GET' for all api-functions exept setConfig and uploadConfig
        if (request.method === "GET") {
            if (url.length > 1) {
                switch (url[1]) {
                    case "getServiceState":
                        responseData = `{"success":true,"message":"${api.getServiceState()}"}`;
                        break;
                    case "getAccountInfo":
                        responseData = await api.getAccountInfoAsJson();
                        break;
                    case "getTfaCaptchaState":
                        responseData = api.getTfaCaptchaState();
                        break;
                    case "setCaptchaCode":
                        if (url.length === 3) {
                            responseData = api.setCaptchaCode(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "setTfaCode":
                        if (url.length === 3) {
                            responseData = api.setTfaCode(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDevices":
                        responseData = await api.getDevicesAsJson();
                        break;
                    case "getDevice":
                        if (url.length === 3) {
                            responseData = await api.getDeviceAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDevicePropertiesMetadata":
                        if (url.length === 3) {
                            responseData = await api.getDevicePropertiesMetadataAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDeviceProperties":
                        if (url.length === 3) {
                            responseData = await api.getDevicePropertiesAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDeviceParams":
                        if (url.length === 3) {
                            responseData = await api.getDeviceParams(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDevicePropertiesTruncated":
                        if (url.length === 3) {
                            const json = JSON.parse(await api.getDevicePropertiesAsJson(url[2]));
                            if (json.success === true) {
                                json.data.properties.serialNumber = replaceLastChars(json.data.properties.serialNumber, "X", 6);
                                json.data.properties.stationSerialNumber = replaceLastChars(json.data.properties.stationSerialNumber, "X", 6);
                                if (json.data.properties.rtspStreamUrl !== undefined) {
                                    json.data.properties.rtspStreamUrl = "REMOVED DUE TO PRIVACY REASONS.";
                                }
                                if (json.data.properties.pictureUrl !== undefined) {
                                    json.data.properties.pictureUrl = "REMOVED DUE TO PRIVACY REASONS.";
                                }
                                if (json.data.properties.picture !== undefined) {
                                    json.data.properties.picture = "REMOVED DUE TO PRIVACY REASONS.";
                                }
                            }
                            responseData = JSON.stringify(json);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "setDeviceProperty":
                        if (url.length === 5) {
                            responseData = await api.setDeviceProperty(url[2], url[3], url[4]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getDeviceImage":
                        if (url.length === 3) {
                            const picture = await api.getDeviceImage(url[2]);
                            if (picture !== null) {
                                responseData = picture.data;
                                contentType = picture.type.mime;
                            }
                            else {
                                responseData = `{"success":false,"message":"No image for device."}`;
                            }
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "moveToPresetPosition":
                        if (url.length === 4) {
                            responseData = await api.moveToPresetPosition(url[2], url[3]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStations":
                    case "getBases":
                        responseData = await api.getStationsAsJson();
                        break;
                    case "getStation":
                    case "getBase":
                        if (url.length === 3) {
                            responseData = await api.getStationAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationPropertiesMetadata":
                        if (url.length === 3) {
                            responseData = await api.getStationPropertiesMetadataAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationProperties":
                        if (url.length === 3) {
                            responseData = await api.getStationPropertiesAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationParams":
                        if (url.length === 3) {
                            responseData = await api.getStationParams(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getStationPropertiesTruncated":
                        if (url.length === 3) {
                            const json = JSON.parse(await api.getStationPropertiesAsJson(url[2]));
                            if (json.success === true) {
                                json.data.properties.serialNumber = replaceLastChars(json.data.properties.serialNumber, "X", 6);
                                json.data.properties.macAddress = "XX:XX:XX:XX:XX:XX";
                                json.data.properties.lanIpAddress = "XXX.XXX.XXX.XXX";
                            }
                            responseData = JSON.stringify(json);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "setStationProperty":
                        if (url.length === 5) {
                            responseData = await api.setStationProperty(url[2], url[3], url[4]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "sendCommand":
                        if (url.length === 4 && url[2] === "rebootStation") {
                            responseData = await api.rebootStation(url[3]);
                        }
                        else if (url.length === 5 && url[2] === "moveToPreset") {
                            responseData = await api.moveToPresetPosition(url[3], url[4]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getHouses":
                        responseData = await api.getHousesAsJson();
                        break;
                    case "getHouse":
                        if (url.length === 3) {
                            responseData = await api.getHouseAsJson(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getMode":
                        if (url.length === 2) {
                            responseData = await api.getGuardMode();
                        }
                        else if (url.length === 3) {
                            responseData = await api.getGuardModeStation(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getConfig":
                        if (api.isSidCheckEnabled() === false || (api.isSidCheckEnabled() === true && url.length === 3 && url[2] !== "" && await api.checkSid(url[2]))) {
                            responseData = await api.getAPIConfigAsJson();
                        }
                        else if (api.isSidCheckEnabled() === true && url.length === 3) {
                            if (url[2] === "" || !await api.checkSid(url[2])) {
                                responseData = `{"success":false,"message":"The sid is not valid."}`;
                            }
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getCountries":
                        responseData = api.getCountriesAsJson();
                        break;
                    case "getApiInfo":
                        responseData = api.getApiVersionAsJson();
                        break;
                    case "getApiState":
                        responseData = await api.getApiStateAsJson();
                        break;
                    case "setMode":
                        if (url.length === 3) {
                            switch (url[2]) {
                                case "away":
                                    responseData = await api.setGuardMode(http_2.GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseData = await api.setGuardMode(http_2.GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseData = await api.setGuardMode(http_2.GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseData = await api.setGuardMode(http_2.GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseData = await api.setGuardMode(http_2.GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseData = await api.setGuardMode(http_2.GuardMode.GEO);
                                    break;
                                case "home":
                                    responseData = await api.setGuardMode(http_2.GuardMode.HOME);
                                    break;
                                case "off":
                                    responseData = await api.setGuardMode(http_2.GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseData = await api.setGuardMode(http_2.GuardMode.SCHEDULE);
                                    break;
                                case "privacyOn":
                                    responseData = `{"success":false,"message":"This mode cannot be set for all stations."}`;
                                    break;
                                case "privacyOff":
                                    responseData = `{"success":false,"message":"This mode cannot be set for all stations."}`;
                                    break;
                                default:
                                    responseData = `{"success":false,"message":"Unknown mode to set."}`;
                            }
                        }
                        else if (url.length === 4) {
                            switch (url[3]) {
                                case "away":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.GEO);
                                    break;
                                case "home":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.HOME);
                                    break;
                                case "off":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseData = await api.setGuardModeStation(url[2], http_2.GuardMode.SCHEDULE);
                                    break;
                                case "privacyOn":
                                    responseData = await api.setPrivacyMode(url[2], false);
                                    break;
                                case "privacyOff":
                                    responseData = await api.setPrivacyMode(url[2], true);
                                    break;
                                default:
                                    responseData = `{"success":false,"message":"Unknown mode to set."}`;
                            }
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "refreshCloudDeviceData":
                        if (url.length === 2) {
                            responseData = await api.refreshCloudDeviceData("all");
                        }
                        else if (url.length === 3) {
                            switch (url[2]) {
                                case "devices":
                                    responseData = await api.refreshCloudDeviceData("devices");
                                    break;
                                case "houses":
                                    responseData = await api.refreshCloudDeviceData("houses");
                                    break;
                                case "stations":
                                    responseData = await api.refreshCloudDeviceData("stations");
                                    break;
                                default:
                                    responseData = `{"success":false,"message":"Argument not supported."}`;
                            }
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "checkSystemVariables":
                        responseData = await api.checkSystemVariables();
                        break;
                    case "removeSystemVariable":
                        if (url.length === 3) {
                            responseData = await api.removeSystemVariable(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "connect":
                        if (url.length === 3) {
                            responseData = await api.connectStation(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "disconnect":
                        if (url.length === 3) {
                            responseData = await api.disconnectStation(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "reconnect":
                        if (url.length === 3) {
                            responseData = await api.reconnectStation(url[2]);
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "getTimeZones":
                        responseData = api.getTimeZones();
                        break;
                    case "removeInteractions":
                        responseData = api.removeInteractions();
                        break;
                    case "removeTokenData":
                        responseData = api.setTokenData("", 0);
                        break;
                    case "generateNewTrustedDeviceName":
                        responseData = api.generateNewTrustedDeviceNameJson();
                        break;
                    case "testStoredInteraction":
                        if (url.length === 4) {
                            try {
                                responseData = await api.testStoredInteraction(url[2], Number.parseInt(url[3]));
                            }
                            catch (error) {
                                responseData = `{"success":false,"message":"Error occured. Error: ${error.message}"}`;
                            }
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "deleteInteraction":
                        if (url.length === 4) {
                            try {
                                responseData = await api.deleteInteraction(url[2], Number.parseInt(url[3]));
                            }
                            catch (error) {
                                responseData = `{"success":false,"message":"Error occured. Error: ${error.message}"}`;
                            }
                        }
                        else {
                            responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                        }
                        break;
                    case "restartService":
                        restartServer();
                        responseData = `{"success":true}`;
                        break;
                    case "downloadConfig":
                        api.writeConfig();
                        responseData = (0, fs_1.readFileSync)("config.json", "utf-8");
                        contentType = "text/json";
                        fileName = `config_${os_1.default.hostname}_${getDateTimeAsString(new Date())}.json`;
                        break;
                    default:
                        responseData = `{"success":false,"message":"Unknown command."}`;
                }
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Content-Type", contentType + "; charset=UTF-8");
                if (fileName === "") {
                    response.writeHead(200);
                    //response.end(responseData);
                }
                else if (fileName !== "") {
                    response.setHeader("Content-Disposition", "attachment;filename=" + fileName);
                    //response.end(responseData);
                }
                response.end(responseData);
            }
            else {
                responseData = `{"success":false,"message":"Unknown command."}`;
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Content-Type", "; charset=UTF-8");
                response.writeHead(200);
                response.end(responseData);
            }
        }
        else if (request.method === "POST") {
            // using 'POST' for setConfig and uploadConfig
            if (url.length > 1) {
                let postData = "";
                let isDataOK = true;
                switch (url[1]) {
                    case "setConfig":
                        if (api.isSidCheckEnabled() === false || (api.isSidCheckEnabled() === true && url.length === 3 && url[2] !== "" && await api.checkSid(url[2]))) {
                            request.on("data", function (chunk) {
                                postData += chunk.toString();
                            });
                            request.on("end", async function () {
                                let username = "";
                                if (postData.indexOf("username") >= 0) {
                                    username = getDataFromPOSTData(postData, "username", "string");
                                }
                                let password = "";
                                if (postData.indexOf("password") >= 0) {
                                    password = getDataFromPOSTData(postData, "password", "string");
                                }
                                let country = "";
                                if (postData.indexOf("country") >= 0) {
                                    country = getDataFromPOSTData(postData, "country", "string");
                                }
                                let language = "";
                                if (postData.indexOf("language") >= 0) {
                                    language = getDataFromPOSTData(postData, "language", "string");
                                }
                                let trustedDeviceName = "";
                                if (postData.indexOf("trustedDeviceName") >= 0) {
                                    trustedDeviceName = getDataFromPOSTData(postData, "trustedDeviceName", "string");
                                }
                                let useHttp = false;
                                if (postData.indexOf("useHttp") >= 0) {
                                    useHttp = getDataFromPOSTData(postData, "useHttp", "boolean");
                                }
                                let apiporthttp = 52789;
                                if (postData.indexOf("httpPort") >= 0) {
                                    apiporthttp = getDataFromPOSTData(postData, "httpPort", "number");
                                }
                                let useHttps = false;
                                if (postData.indexOf("useHttps") >= 0) {
                                    useHttps = getDataFromPOSTData(postData, "useHttps", "boolean");
                                }
                                if (useHttp === false && useHttps === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("At least 'useHttp' or 'useHttps' must be activated.");
                                }
                                let apiporthttps = 52790;
                                if (postData.indexOf("httpsPort") >= 0) {
                                    apiporthttps = getDataFromPOSTData(postData, "httpsPort", "number");
                                }
                                let apikeyfile = "/usr/local/etc/config/server.pem";
                                if (postData.indexOf("httpsKeyFile") >= 0) {
                                    apikeyfile = getDataFromPOSTData(postData, "httpsKeyFile", "string");
                                }
                                let apicertfile = "/usr/local/etc/config/server.pem";
                                if (postData.indexOf("httpsCertFile") >= 0) {
                                    apicertfile = getDataFromPOSTData(postData, "httpsCertFile", "string");
                                }
                                let apiacceptinvitations = false;
                                if (postData.indexOf("acceptInvitations") >= 0) {
                                    apiacceptinvitations = getDataFromPOSTData(postData, "acceptInvitations", "boolean");
                                }
                                let apihouseid = "all";
                                if (postData.indexOf("house") >= 0) {
                                    apihouseid = getDataFromPOSTData(postData, "house", "string");
                                }
                                let apiconnectiontype = 1;
                                if (postData.indexOf("connectionType") >= 0) {
                                    apiconnectiontype = getDataFromPOSTData(postData, "connectionType", "number");
                                }
                                let apiuseudpstaticports = false;
                                if (postData.indexOf("useUdpStaticPorts") >= 0) {
                                    apiuseudpstaticports = getDataFromPOSTData(postData, "useUdpStaticPorts", "boolean");
                                }
                                let apiudpports = undefined;
                                if (postData.indexOf("udpPortsStation") >= 0) {
                                    apiudpports = getAllUdpPortsForStations(postData);
                                }
                                let useSystemVariables = false;
                                if (postData.indexOf("useSystemVariables") >= 0) {
                                    useSystemVariables = getDataFromPOSTData(postData, "useSystemVariables", "boolean");
                                }
                                let useupdatestateevent = false;
                                if (postData.indexOf("useUpdateStateEvent") >= 0) {
                                    useupdatestateevent = getDataFromPOSTData(postData, "useUpdateStateEvent", "boolean");
                                }
                                let useupdatestateintervall = false;
                                if (postData.indexOf("useUpdateStateIntervall") >= 0) {
                                    useupdatestateintervall = getDataFromPOSTData(postData, "useUpdateStateIntervall", "boolean");
                                }
                                let updatestatetimespan = 15;
                                if (postData.indexOf("updateStateIntervallTimespan") >= 0) {
                                    updatestatetimespan = getDataFromPOSTData(postData, "updateStateIntervallTimespan", "number");
                                }
                                let usepushservice = false;
                                if (postData.indexOf("usePushService") >= 0) {
                                    usepushservice = getDataFromPOSTData(postData, "usePushService", "boolean");
                                }
                                let usesecureapiaccesssid = false;
                                if (postData.indexOf("useSecureApiAccessSid") >= 0) {
                                    usesecureapiaccesssid = getDataFromPOSTData(postData, "useSecureApiAccessSid", "boolean");
                                }
                                let logleveladdon = 6;
                                if (postData.indexOf("logLevelAddon") >= 0) {
                                    logleveladdon = getDataFromPOSTData(postData, "logLevelAddon", "number");
                                }
                                let loglevelmain = 6;
                                if (postData.indexOf("logLevelMain") >= 0) {
                                    loglevelmain = getDataFromPOSTData(postData, "logLevelMain", "number");
                                }
                                let loglevelhttp = 6;
                                if (postData.indexOf("logLevelHttp") >= 0) {
                                    loglevelhttp = getDataFromPOSTData(postData, "logLevelHttp", "number");
                                }
                                let loglevelp2p = 6;
                                if (postData.indexOf("logLevelP2p") >= 0) {
                                    loglevelp2p = getDataFromPOSTData(postData, "logLevelP2p", "number");
                                }
                                let loglevelpush = 6;
                                if (postData.indexOf("logLevelPush") >= 0) {
                                    loglevelpush = getDataFromPOSTData(postData, "logLevelPush", "number");
                                }
                                let loglevelmqtt = 6;
                                if (postData.indexOf("logLevelAddon") >= 0) {
                                    loglevelmqtt = getDataFromPOSTData(postData, "logLevelMqtt", "number");
                                }
                                if (checkNumberValue(apiporthttp, 1, 53535) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'apiporthttp' is out of range. Please use a value between '1' and '53535'.");
                                }
                                if (checkNumberValue(apiporthttps, 1, 53535) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'apiporthttps' is out of range. Please use a value between '1' and '53535'.");
                                }
                                if (apiuseudpstaticports === true) {
                                    /*if (checkNumbersValue(apiudpports, 0, 53535) === false) {
                                        isDataOK = false;
                                    }*/
                                }
                                if (useHttps === true && (apiporthttps === 0 || apikeyfile === "" || apicertfile === "")) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The settings for using https are incomplete. Please set 'apiporthttps', 'apikeyfile' and 'apicertfile'.");
                                }
                                if (checkNumberValue(logleveladdon, 0, 6) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'logleveladdon' is out of range. Please use a value between '0' and '6'.");
                                }
                                if (checkNumberValue(loglevelmain, 0, 6) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'loglevelmain' is out of range. Please use a value between '0' and '6'.");
                                }
                                if (checkNumberValue(loglevelhttp, 0, 6) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'loglevelhttp' is out of range. Please use a value between '0' and '6'.");
                                }
                                if (checkNumberValue(loglevelp2p, 0, 6) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'loglevelp2p' is out of range. Please use a value between '0' and '6'.");
                                }
                                if (checkNumberValue(loglevelpush, 0, 6) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'loglevelpush' is out of range. Please use a value between '0' and '6'.");
                                }
                                if (checkNumberValue(loglevelmqtt, 0, 6) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'loglevelmqtt' is out of range. Please use a value between '0' and '6'.");
                                }
                                if (checkNumberValue(updatestatetimespan, 15, 240) === false) {
                                    isDataOK = false;
                                    logging_1.rootAddonLogger.info("The value for 'updatestatetimespan' is out of range. Please use a value between '15' and '240'.");
                                }
                                if (isDataOK === true) {
                                    apiPortFile(useHttp, Number(apiporthttp), useHttps, Number(apiporthttps));
                                    responseData = await api.setConfig(username, password, country, language, trustedDeviceName, useHttp, apiporthttp, useHttps, apiporthttps, apikeyfile, apicertfile, apiacceptinvitations, apihouseid, apiconnectiontype, apiuseudpstaticports, apiudpports, useSystemVariables, useupdatestateevent, useupdatestateintervall, updatestatetimespan, usepushservice, usesecureapiaccesssid, logleveladdon, loglevelmain, loglevelhttp, loglevelp2p, loglevelpush, loglevelmqtt);
                                }
                                else {
                                    responseData = `{"success":false,"serviceRestart":false,"message":"Got invalid settings data. Please check logfile and values."}`;
                                }
                                const resJson = JSON.parse(responseData);
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                response.writeHead(200);
                                response.end(responseData);
                                if (resJson.success === true && resJson.serviceRestart === true) {
                                    logging_1.rootAddonLogger.info("Settings saved. Restarting apiServer.");
                                    restartServer();
                                }
                                else if (resJson.success === true && resJson.serviceRestart === false) {
                                    logging_1.rootAddonLogger.info("Settings saved.");
                                }
                                else {
                                    logging_1.rootAddonLogger.info("Error during saving settings.");
                                }
                            });
                        }
                        else if (api.isSidCheckEnabled() === true && url.length === 3) {
                            if (url[2] === "" || !await api.checkSid(url[2])) {
                                request.on("data", function (chunk) {
                                    postData += chunk.toString();
                                });
                                request.on("end", async function () {
                                    responseData = `{"success":false,"message":"The sid is not valid."}`;
                                    response.setHeader("Access-Control-Allow-Origin", "*");
                                    response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                    response.writeHead(200);
                                    response.end(responseData);
                                    logging_1.rootAddonLogger.info("Error during saving settings. The sid is not valid.");
                                });
                            }
                        }
                        else {
                            request.on("data", function (chunk) {
                                postData += chunk.toString();
                            });
                            request.on("end", async function () {
                                responseData = `{"success":false,"message":"Number of arguments not supported."}`;
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                response.writeHead(200);
                                response.end(responseData);
                                logging_1.rootAddonLogger.info("Error during saving settings. The sid is not valid.");
                            });
                        }
                        break;
                    case "uploadConfig":
                        request.on("data", function (chunk) {
                            postData += chunk.toString();
                            if (request.headers["content-length"] !== undefined && Number.parseInt(request.headers["content-length"]?.toString()) > 500000) {
                                logging_1.rootAddonLogger.info("Error during upload and saving config file: File is to large.");
                                request.destroy(new Error("FileToLarge"));
                            }
                        });
                        request.on("end", function () {
                            try {
                                responseData = "";
                                if (checkUploadedFileMetadata(postData) === false) {
                                    logging_1.rootAddonLogger.info("Error during upload and saving config file: File metadata are unsopported or missing.");
                                    responseData = `{"success":false,"serviceRestart":false,"message":"File metadata are unsopported or missing."}`;
                                }
                                else {
                                    const fileContent = getUploadFileContent(postData);
                                    if (fileContent === undefined) {
                                        if (responseData === "") {
                                            logging_1.rootAddonLogger.info("Error during upload and saving config file: File content could not be determined.");
                                            responseData = `{"success":false,"serviceRestart":false,"message":"File content could not be determined."}`;
                                        }
                                        else {
                                            logging_1.rootAddonLogger.info("Error during upload and saving config file: File metadata are unsopported or missing. File content could not be determined.");
                                            responseData = `{"success":false,"serviceRestart":false,"message":"File metadata are unsopported or missing. File content could not be determined."}`;
                                        }
                                    }
                                    else {
                                        (0, fs_1.writeFileSync)("config.json.upload", fileContent, "utf-8");
                                        responseData = `{"success":true,"serviceRestart":true,"message":"File uploaded and saved."}`;
                                    }
                                }
                                const resJson = JSON.parse(responseData);
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                response.writeHead(200);
                                response.end(responseData);
                                if (resJson.success === true && resJson.serviceRestart === true) {
                                    logging_1.rootAddonLogger.info("Config file uploaded and saved. Restarting apiServer.");
                                    restartServer();
                                }
                                else {
                                    logging_1.rootAddonLogger.info("Config file was not saved.");
                                }
                            }
                            catch (e) {
                                logging_1.rootAddonLogger.info("Error during upload config", e);
                            }
                        });
                        break;
                    case "setInteraction":
                        request.on("data", function (chunk) {
                            postData += chunk.toString();
                        });
                        request.on("end", async function () {
                            try {
                                const resJson = JSON.parse(postData);
                                responseData = api.setInteraction(resJson.serialNumber, resJson.eventType, resJson.target, resJson.useHttps, resJson.useLocalCertificate, resJson.rejectUnauthorized, decodeURIComponent(resJson.command), resJson.user, resJson.password);
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                response.writeHead(200);
                                response.end(responseData);
                            }
                            catch (e) {
                                logging_1.rootAddonLogger.error(`Error occured at setInteraction: ${e.message}`, postData);
                            }
                        });
                        break;
                    case "testUnstoredInteraction":
                        request.on("data", function (chunk) {
                            postData += chunk.toString();
                        });
                        request.on("end", async function () {
                            try {
                                const resJson = JSON.parse(postData);
                                responseData = await api.testUnstoredInteraction(resJson.serialNumber, resJson.eventType, resJson.target, resJson.useHttps, resJson.useLocalCertificate, resJson.rejectUnauthorized, decodeURIComponent(resJson.command), resJson.user, resJson.password);
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                response.writeHead(200);
                                response.end(responseData);
                            }
                            catch (e) {
                                logging_1.rootAddonLogger.error(`Error occured at testUnstoredInteraction: ${e.message}`, postData);
                            }
                        });
                        break;
                    case "createSystemVariable":
                        request.on("data", function (chunk) {
                            postData += chunk.toString();
                        });
                        request.on("end", async function () {
                            try {
                                const resJson = JSON.parse(postData);
                                responseData = await api.createSystemVariable(resJson);
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                                response.writeHead(200);
                                response.end(responseData);
                            }
                            catch (e) {
                                logging_1.rootAddonLogger.error(`Error occured at createSystemVariable: ${e.message}`, postData);
                            }
                        });
                        break;
                    default:
                        responseData = `{"success":false,"reason":"Unknown command."}`;
                        response.setHeader("Access-Control-Allow-Origin", "*");
                        response.setHeader("Content-Type", "application/json; charset=UTF-8");
                        response.writeHead(200);
                        response.end(responseData);
                }
            }
            else {
                responseData = `{"success":false,"message":"Wrong amount of arguments."}`;
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Content-Type", "application/json; charset=UTF-8");
                response.writeHead(200);
                response.end(responseData);
            }
        }
        else {
            // Be polite and give an answer even we know that there is nothing to answer...
            responseData = `{"success":false,"message":"Unknown command."}`;
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Content-Type", "application/json; charset=UTF-8");
            response.writeHead(200);
            response.end(responseData);
        }
    }
}
/**
 * The main function will start the ApiServer
 */
function main() {
    apiServer = new ApiServer();
}
/**
 * Create the apiPorts.json file needed for using the api on the website if file does not exist or update it when the ports have changed.
 * @param httpPort The new http port.
 * @param httpsPort The new https port.
 */
function apiPortFile(useHttp, httpPort, useHttps, httpsPort) {
    try {
        if ((0, fs_1.existsSync)("www/apiPorts.json")) {
            const resJson = JSON.parse((0, fs_1.readFileSync)("www/apiPorts.json", "utf-8"));
            if (useHttp !== resJson.useHttp || httpPort !== Number.parseInt(resJson.httpPort) || useHttps !== resJson.useHttps || httpsPort !== Number.parseInt(resJson.httpsPort)) {
                (0, fs_1.writeFileSync)("www/apiPorts.json", `{"useHttp":${useHttp},"httpPort":${httpPort},"useHttps":${useHttps},"httpsPort":${httpsPort}}`);
            }
        }
        else {
            (0, fs_1.writeFileSync)("www/apiPorts.json", `{"useHttp":${useHttp},"httpPort":${httpPort},"useHttps":${useHttps},"httpsPort":${httpsPort}}`);
        }
    }
    catch (ENOENT) {
        logging_1.rootAddonLogger.info("Error during handling apiPortFile.", ENOENT);
    }
}
/**
 * Checks if a given string is a number between two values.
 * @param value The value as string to check.
 * @param lowestValue The lowest value allowd.
 * @param highestValue The highest value allowed.
 */
function checkNumberValue(value, lowestValue, highestValue) {
    try {
        const val = value;
        if (val >= lowestValue && val <= highestValue) {
            return true;
        }
        else {
            return false;
        }
    }
    catch {
        return false;
    }
}
/**
 * Checks if a given string contains an array of number and each number is between two values.
 * @param values The value as string to check.
 * @param lowestValue The lowest value allowd.
 * @param highestValue The highest value allowed.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkNumbersValue(values, lowestValue, highestValue) {
    if (values === "") {
        return false;
    }
    const vals = (values.split(",")).map((i) => Number(i));
    if (vals.length > 0) {
        for (const val of vals) {
            if (checkNumberValue(val, lowestValue, highestValue) === false) {
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
function getDataFromPOSTData(postData, target, dataType) {
    if (dataType === "string") {
        let temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.replace("\r\n", "");
        temp = temp.substring(2, temp.indexOf("----") - 2);
        return temp;
    }
    else if (dataType === "number") {
        let temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.replace("\r\n", "");
        temp = temp.substring(2, temp.indexOf("----") - 2);
        return Number.parseInt(temp);
    }
    else if (dataType === "boolean") {
        let temp = postData.substring(postData.indexOf(target) + (target.length + 1));
        temp = temp.substring(2, temp.indexOf("----") - 2);
        if (temp.trim() === "on") {
            return true;
        }
        else {
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
function getAllUdpPortsForStations(postData) {
    let pos = postData.indexOf("udpPortsStation");
    const res = [];
    while (pos > 0) {
        let temp = postData.substring(pos + 29);
        const stationSerial = postData.substring(pos + 15, pos + 31);
        temp = temp.replace("\r\n", "");
        temp = temp.substring(5, temp.indexOf("----") - 2);
        const line = [];
        line[0] = stationSerial;
        line[1] = temp;
        res.push(line);
        pos = postData.indexOf("udpPortsStation", pos + 19);
    }
    return res;
}
/**
 * Checks if the received post data could be a config.json.
 * @param postData The postData to check.
 * @returns A boolean value.
 */
function checkUploadedFileMetadata(postData) {
    let pos = postData.indexOf("Content-Disposition: form-data;");
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf("Content-Type: application/json");
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"accountData":`);
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"eMail":`);
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"password":`);
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"httpActive":`);
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"httpPort":`);
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"httpsActive":`);
    if (pos < 0) {
        return false;
    }
    pos = postData.indexOf(`"httpsPort":`);
    if (pos < 0) {
        return false;
    }
    return true;
}
/**
 * Retrieves the json-part containing the config.
 * @param postData The postData to check.
 * @returns A string value or undefined.
 */
function getUploadFileContent(postData) {
    const start = postData.indexOf("{");
    if (start < 0) {
        return undefined;
    }
    const end = postData.lastIndexOf("}");
    if (end < 0) {
        return undefined;
    }
    return postData.substring(start, end + 1);
}
/**
 * Will write config, stop the server and exit.
 */
async function stopServer() {
    logging_1.rootAddonLogger.info("Set service state to shutdown...");
    api.setServiceState("shutdown");
    logging_1.rootAddonLogger.info("Stopping scheduled tasks...");
    api.clearScheduledTasks();
    logging_1.rootAddonLogger.info("Stopping EufySecurityApi...");
    await api.close();
    logging_1.rootAddonLogger.info("Write config...");
    api.writeConfig();
    logging_1.rootAddonLogger.info("Stopping...");
    serverHttp.close();
    logging_1.rootAddonLogger.info("Stopped...");
}
/**
 * Will write config and restart the server.
 */
async function restartServer() {
    logging_1.rootAddonLogger.info("Going to restart with apiServerRestarter...");
    (0, child_process_1.exec)(`/usr/local/addons/eufySecurity/bin/node "/usr/local/addons/eufySecurity/apiServerRestarter.js" >> "/var/log/eufySecurity.log" 2>> "/var/log/eufySecurity.err"`);
}
/**
 * Wait-function for waiting between stop and start when restarting.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
function wait10Seconds() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("");
        }, 10000);
    });
}
process.on("SIGTERM", async () => {
    logging_1.rootAddonLogger.info("SIGTERM signal received. Save config and shutdown server...");
    await stopServer();
    logging_1.rootAddonLogger.info("...done. Exiting");
    (0, process_1.exit)(0);
});
process.on("SIGINT", async () => {
    logging_1.rootAddonLogger.info("SIGINT signal received. Save config and shutdown server...");
    await stopServer();
    logging_1.rootAddonLogger.info("...done. Exiting");
    (0, process_1.exit)(0);
});
/**
 * Returns a string with the first numberOfChars chars from input, all other chars will be replaced by X. replaceLastCars("ABCDEFGH", "X", 2) will return "ABXXXXXX".
 * @param input The input string.
 * @param char The char replaces each char after position numberOfChars.
 * @param numberOfChars The number of chars which should not be replaced.
 * @returns The result string.
 */
function replaceLastChars(input, char, numberOfChars) {
    return input.substring(0, numberOfChars) + Array(input.length - numberOfChars + 1).join(char);
}
/**
 * Returns the sting representation of a Date object as YYYYMMDD-HHMMSS.
 * @param dateTime The date as Date object.
 * @returns The date and time as string.
 */
function getDateTimeAsString(dateTime) {
    return `${dateTime.getFullYear().toString()}${(dateTime.getMonth() + 1).toString().padStart(2, "0")}${dateTime.getDate().toString().padStart(2, "0")}-${dateTime.getHours().toString().padStart(2, "0")}${dateTime.getMinutes().toString().padStart(2, "0")}${dateTime.getSeconds().toString().padStart(2, "0")}`;
}
main();
