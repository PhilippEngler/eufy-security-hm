/**
 * Javascript for eufySecurity Addon
 * v1.3 - 20220927
 */
port = "";
redirectTarget = "";

/**
 * common used java script functions
 */
//#region common
function start(page)
{
    if(window.location.search != "")
    {
        urlParams = new URLSearchParams(window.location.search);
        if(getParameterFromURLSearchParams(urlParams, "sid"))
        {
            addSidToLinks(getParameterFromURLSearchParams(urlParams, "sid"));
            redirectTarget = `?sid=${getParameterFromURLSearchParams(urlParams, "sid")}`;
        }
        if(getParameterFromURLSearchParams(urlParams, "redirect"))
        {
            if(getParameterFromURLSearchParams(urlParams, "redirect") == "index.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "devices.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "statechange.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "settings.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "logfiles.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "info.html")
            {
                redirectTarget = getParameterFromURLSearchParams(urlParams, "redirect") + redirectTarget;
            }
            else
            {
                redirectTarget = "";
            }
        }
        else
        {
            redirectTarget = "";
        }
    }
    getAPIPort(page);
}

function getParameterFromURLSearchParams(urlParams, parameterName)
{
    return urlParams.get(parameterName);
}

function addSidToLinks(sessionID)
{
    document.getElementById("lnkMain").setAttribute("href", document.getElementById("lnkHome").getAttribute("href") + `?sid=${sessionID}`);
    document.getElementById("lnkHome").setAttribute("href", document.getElementById("lnkHome").getAttribute("href") + `?sid=${sessionID}`);
    document.getElementById("lnkDevices").setAttribute("href", document.getElementById("lnkDevices").getAttribute("href") + `?sid=${sessionID}`);
    document.getElementById("lnkStatechange").setAttribute("href", document.getElementById("lnkStatechange").getAttribute("href") + `?sid=${sessionID}`);
    document.getElementById("lnkSettings").setAttribute("href", document.getElementById("lnkSettings").getAttribute("href") + `?sid=${sessionID}`);
    document.getElementById("lnkLogfiles").setAttribute("href", document.getElementById("lnkLogfiles").getAttribute("href") + `?sid=${sessionID}`);
    document.getElementById("lnkInfo").setAttribute("href", document.getElementById("lnkInfo").getAttribute("href") + `?sid=${sessionID}`);
}

function getAPIPort(page)
{
    var apiPorts;
    var url = `${location.protocol}//${location.hostname}/addons/eufySecurity/apiPorts.txt`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('text/plain');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                apiPorts = this.responseText;
                apiPorts = apiPorts.split(",");
                if(apiPorts.length == 2)
                {
                    port = apiPorts[0];
                    if(location.protocol == "https:")
                    {
                        port = apiPorts[1];
                    }
                }
                else
                {
                    port = "52789";
                    if(location.protocol == "https:")
                    {
                        port = "52790";
                    }
                }
                initContent(page);
            }
            catch (e)
            {
                document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", `Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.<br /><small class="text-muted">Bitte überprüfen Sie die Datei apiPorts.txt im Webseitenverzeichnisses dieses AddOns.</small>`);
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", `Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.<br /><small class="text-muted">Bitte überprüfen Sie die Datei apiPorts.txt im Webseitenverzeichnisses dieses AddOns.</small>`);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function initContent(page)
{
    switch(page)
    {
        case "devices":
            loadStations();
            loadDevices();
            break;
        case "statechange":
            loadDataStatechange(true);
            break;
        case "settings":
            validateFormSettings();
            loadStationsSettings();
            loadSystemVariables();
            break;
        case "logfiles":
            loadLogfile("log", true);
            loadLogfile("err", true);
            break;
        case "info":
            loadDataInfo(true);
            break;
        case "restartWaiter":
            restartAPIService();
            break;
    }
}

function downloadFile(filetype)
{
    var url;
    switch(filetype)
    {
        case "log":
            url = `${location.protocol}//${location.hostname}:${port}/downloadLogFile`;
            break;
        case "err":
            url = `${location.protocol}//${location.hostname}:${port}/downloadErrFile`;
            break;
        case "conf":
            url = `${location.protocol}//${location.hostname}:${port}/downloadConfig`;
            break;
    }
    window.open(url);
}

function makeDateTimeString(dateTime)
{
	return (`${dateTime.getDate().toString().padStart(2,'0')}.${(dateTime.getMonth()+1).toString().padStart(2,'0')}.${dateTime.getFullYear().toString()} ${dateTime.getHours().toString().padStart(2,'0')}:${dateTime.getMinutes().toString().padStart(2,'0')}:${dateTime.getSeconds().toString().padStart(2,'0')}`);
}

function getGuardModeAsString(guardMode)
{
    switch (guardMode)
    {
        case "0":
            return "abwesend";
        case "1":
            return "zu Hause";
        case "2":
            return "Zeitplan";
        case "3":
            return "Benutzerdefiniert 1";
        case "4":
            return "Benutzerdefiniert 2";
        case "5":
            return "Benutzerdefiniert 3";
        case "6":
            return "ausgeschaltet";
        case "47":
            return "Geofencing";
        case "63":
            return "deaktiviert";
        default:
            return "unbekannt";
    }
}

function getWifiSignalLevelIcon(wifiSignalLevel)
{
    return wifiSignalLevel == 0 ? "bi-reception-0" : wifiSignalLevel == 1 ? "bi-reception-1" : wifiSignalLevel == 2 ? "bi-reception-2" : wifiSignalLevel == 3 ? "bi-reception-3" : wifiSignalLevel == 4 ? "bi-reception-4" : "bi-wifi-off";
}

function createCardStation(station, showSettingsIcon, cardBodyText, cardFooterText)
{
    var card = "";

    card += `<div class="col"><div class="card mb-3">`;
    card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${station.name}</h5></div>`;
    card += `${showSettingsIcon == true ? `<div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0"><i class="bi-gear" title="Einstellungen" onclick="showStationSettings('${station.serialNumber}')"></i></h5></span></div>` : ""}`;
    card += `</div>`;
    
    card += `<div class="card-body p-0"><div class="row g-0">`;
    card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${station.modelName} (${station.model})</div></div>`;
    card += `<div class="col-md-8 p-3">`;
    card += `${cardBodyText}</div>`;
    card += `</div></div>`;
    
    card += `<div class="card-footer">${cardFooterText}</div>`;
    card += `</div></div>`;

    return card;
}

function createStationTypeCardsContainer(firendlyTypeName, cards)
{
    if(cards != "")
    {
        return `<h4>${firendlyTypeName}</h4><div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3">${cards}</div>`;
    }
    else
    {
        return "";
    }
}

function createWaitMessage(messageText)
{
    return `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>${messageText}</strong></div>`;
}

function createMessageContainer(classText, messageText)
{
    return `<div class="${classText}" role="alert">${messageText}</div>`;
}
//#endregion

/**
 * Scripts for devices.html
 */
//#region devices.html
 function loadStations()
 {
    document.getElementById("stations").innerHTML = `<p id="stations"></p>`;
    var xmlhttp, objResp, text = "", station = "", stations = "";
    var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                if(objResp.data.length > 0)
                {
                    for(station in objResp.data)
                    {
                        if(objResp.data[station].deviceType == "station")
                        {
                            stations += createCardStation(objResp.data[station], true, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0"><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${objResp.data[station].softwareVersion}</span></div><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="bi-shield" title="aktueller Status"></i>&nbsp;${getGuardModeAsString(objResp.data[station].guardMode)}</span></div>`, `<small class="text-muted">IP-Adresse: ${objResp.data[station].lanIpAddress} (${objResp.data[station].wanIpAddress})</small></div>`);
                        }
                    }
                }
                else
                {
                    stations += createMessageContainer("alert alert-danger", "Es wurden keine Stationen gefunden.");
                }
                text += createStationTypeCardsContainer("Stationen", stations);
                document.getElementById("stations").innerHTML =  text;
            }
            else
            {
                document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.")}`;
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.")}`;
        }
        else
        {
            document.getElementById("stations").innerHTML = createWaitMessage("Lade verfügbare Stationen...");
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function loadDevices()
{
    var xmlhttp, objResp, device;
    var text = "", cams = "", indoorcams = "", solocams = "", doorbellcams = "", floodlightcams = "", keypads = "", sensors = "";
    var url = `${location.protocol}//${location.hostname}:${port}/getDevices`;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                if(objResp.data.length > 0)
                {
                    for(device in objResp.data)
                    {
                        switch(objResp.data[device].deviceType)
                        {
                            case "camera":
                                cams += createCardDevice(objResp.data[device]);
                                break;
                            case "indoorcamera":
                                indoorcams += createCardDevice(objResp.data[device]);
                                break;
                            case "solocamera":
                                solocams += createCardDevice(objResp.data[device]);
                                break;
                            case "doorbell":
                                doorbellcams += createCardDevice(objResp.data[device]);
                                break;
                            case "floodlight":
                                floodlightcams += createCardDevice(objResp.data[device]);
                                break;
                            case "lock":
                                //locks =??
                                break;
                            case "keypad":
                                keypads += createCardDevice(objResp.data[device]);
                                break;
                            case "sensor":
                                sensors += createCardDevice(objResp.data[device]);
                                break;
                        }
                    }
                    text += createDeviceTypeCardsContainer("cameras", "Kameras", cams);
                    text += createDeviceTypeCardsContainer("indoorcameras", "Innenkameras", indoorcams);
                    text += createDeviceTypeCardsContainer("solocameras", "Solokameras", solocams);
                    text += createDeviceTypeCardsContainer("doorbellcameras", "Videotürklingelkameras", doorbellcams);
                    text += createDeviceTypeCardsContainer("floodlightcameras", "Flutlichtkameras", floodlightcams);
                    text += createDeviceTypeCardsContainer("keypads", "Keypads", keypads);
                    text += createDeviceTypeCardsContainer("sensors", "Sensoren", sensors);
                    document.getElementById("devices").innerHTML =  text;
                }
                else
                {
                    document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Es wurden keine Geräte gefunden.")}`;
                }
            }
            else
            {
                document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Geräte.")}`;
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Geräte.")}`;
        }
        else
        {
            document.getElementById("devices").innerHTML = createWaitMessage("Lade verfügbare Geräte...");
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function createCardDevice(device)
{
    var card = "";

    card += `<div class="col"><div class="card">`;
    card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${device.name}</h5></div><div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0"><i class="${getWifiSignalLevelIcon(device.wifiSignalLevel)}" title="WiFi Empfangsstärke: ${device.wifiRssi}dB"></i>&nbsp;&nbsp;<i class="bi-gear" title="Einstellungen" onclick="showDeviceSettings('${device.serialNumber}')"></i></h5></span></div></div>`;

    card += `<div class="card-body p-0"><div class="row g-0">`;
    card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${device.modelName} (${device.model})</div></div>`;
    card += `<div class="col-md-8 p-3">`;

    card += `<h6 class="card-subtitle mb-2 text-muted">${device.modelName}</h6>`;
    card += `<p class="card-text mb-1">${device.serialNumber}</p>`;
    card += `<div class="row g-0"><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${device.softwareVersion}</span></div><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="${device.chargingStatus == 1 ? "bi-battery-charging" : device.battery < 16 ? "bi-battery" : device.battery < 50 ? "bi-battery-half" : "bi-battery-full"} ${device.battery < 6 ? "text-danger" : device.battery < 16 ? "text-warning" : ""}" title="Ladezustand des Akkus"></i>&nbsp;${device.battery}%</span></div><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="${device.batteryTemperature < 0 ? "bi-thermometer-low" : device.batteryTemperature < 30 ? "bi-thermometer-half" : "bi-thermometer-high"}" title="Temperatur"></i>&nbsp;${device.batteryTemperature}&deg;C</span></div></div>`;
    card += `</div></div></div>`;
    card += `<div class="card-footer"><small class="text-muted">${getDeviceLastEventTime(device.pictureTime, device.pictureUrl)}</small></div>`;
    card += `</div></div>`;

    return card;
}

function createDeviceTypeCardsContainer(typeName, firendlyTypeName, cards)
{
    if(cards != "")
    {
        return `<p id="${typeName}"><h4>${firendlyTypeName}</h4><div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3">${cards}</div></p>`;
    }
    else
    {
        return "";
    }
}

function getDeviceLastEventTime(time, url)
{
    if(time != "" && time != "n/a" && time != "n/d" && time != "0")
    {
        return `letzte Aufnahme: ${makeDateTimeString(new Date(parseInt(time)))} | <a href="${url}">Standbild</a>`;
    }
    else if(time == "n/a")
    {
        return "keine Aufnahme";
    }
    else
    {
        return "letzte Aufnahme nicht verfügbar";
    }
}

function showDeviceSettings(deviceId)
{
    const myModal = new bootstrap.Modal(document.getElementById('modalDeviceSettings'));
    
    document.getElementById("lblModalDeviceSettingsTitle").innerHTML = `<span class="placeholder col-6 bg-light placeholder-lg mt-1 mb-1"></span>`;
    document.getElementById("lblModalDeviceSettingsInfo").innerHTML = `<span class="placeholder col-12 placeholder-lg"></span>`;
    document.getElementById("lblDeviceModel").innerHTML = `<span class="placeholder col-6 placeholder-lg"></span>`;
    document.getElementById("lblDeviceName").innerHTML = `<span class="placeholder col-6 placeholder-lg"></span>`;
    document.getElementById("lblDeviceSerial").innerHTML = `<span class="placeholder col-8 placeholder-lg"></span>`;
    document.getElementById("lblDeviceInfo").innerHTML= `<i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;<span class="placeholder col-2 placeholder-lg"></span>&nbsp;&nbsp;&nbsp;&nbsp;<i class="bi-battery" title="Ladezustand des Akkus"></i>&nbsp;<span class="placeholder col-2 placeholder-lg"></span>&nbsp;&nbsp;&nbsp;&nbsp;<i class="bi-thermometer-low" title="Temperatur"></i>&nbsp;<span class="placeholder col-2 placeholder-lg"></span>`;
    document.getElementById("chkDeviceEnabled").removeAttribute("checked");
    document.getElementById("chkDeviceAntitheftDetection").removeAttribute("checked");
    document.getElementById("chkDeviceStatusLed").removeAttribute("checked");
    document.getElementById("rbDeviceWMOptimalAccu").removeAttribute("checked");
    document.getElementById("rbDeviceWMOptimalSurv").removeAttribute("checked");
    document.getElementById("rbDeviceWMCustom").removeAttribute("checked");
    document.getElementById("lblDevicePowerSource").innerHTML = ``;



    document.getElementById("chkDeviceMicrophoneEnable").removeAttribute("checked");
    document.getElementById("chkDeviceAudioRecording").setAttribute("disabled", true);
    document.getElementById("chkDeviceSpeakerEnable").removeAttribute("checked");
    document.getElementById("rbDeviceNTMostEfficient").removeAttribute("checked");
    document.getElementById("rbDeviceNTIncludeThumbnail").removeAttribute("checked");
    document.getElementById("rbDeviceNTFullEffect").removeAttribute("checked");

    document.getElementById("cardDeviceCommonSettings").classList.add("collapse", true);
    document.getElementById("cardDevicePowerManagerSettings").classList.add("collapse", true);
    document.getElementById("cardDeviceVideoSettings").classList.add("collapse", true);
    document.getElementById("cardDeviceAudioSettings").classList.add("collapse", true);
    document.getElementById("cardDeviceNotificationSettings").classList.add("collapse", true);

    myModal.show();

    var xmlhttp, objResp;
    var url = `${location.protocol}//${location.hostname}:${port}/getDevice/${deviceId}`;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                if(objResp.data.length = 1)
                {
                    document.getElementById("lblModalDeviceSettingsTitle").innerHTML = `<div style="text-align:left; float:left;"><h5 class="mb-0">${objResp.data[0].name} (${deviceId})</h5></div><div style="text-align:right;"><h5 class="mb-0"><span class="text-nowrap"><i class="${getWifiSignalLevelIcon(objResp.data[0].wifiSignalLevel)}" title="WiFi Empfangsstärke: ${objResp.data[0].wifiRssi}dB"></i></span></h5></div>`;

                    document.getElementById("lblDeviceModel").innerHTML = `<h5 class="card-subtitle mb-2">${objResp.data[0].modelName} <span class="text-muted">(${objResp.data[0].model})</span></h5>`;
                    document.getElementById("lblDeviceName").innerHTML = `<h5 class="card-subtitle mb-2">${objResp.data[0].name}</h5>`;
                    document.getElementById("lblDeviceSerial").innerHTML = `<h6 class="card-subtitle text-muted">${objResp.data[0].serialNumber}</h6>`;
                    document.getElementById("lblDeviceInfo").innerHTML = `<h6 class="card-subtitle text-muted"><span class="text-nowrap"><i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${objResp.data[0].softwareVersion}&nbsp;&nbsp;&nbsp;&nbsp;<i class="${objResp.data[0].chargingStatus == 1 ? "bi-battery-charging" : objResp.data[0].battery < 5 ? "bi-battery" : objResp.data[0].battery < 50 ? "bi-battery-half" : "bi-battery-full"} ${objResp.data[0].battery < 5 ? "text-danger" : objResp.data[0].battery < 15 ? "text-warning" : ""}" title="Ladezustand des Akkus"></i>&nbsp;${objResp.data[0].battery}%</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-nowrap"><i class="${objResp.data[0].batteryTemperature < 0 ? "bi-thermometer-low" : objResp.data[0].batteryTemperature < 30 ? "bi-thermometer-half" : "bi-thermometer-high"}" title="Temperatur"></i>&nbsp;${objResp.data[0].batteryTemperature}&deg;C</span></h6>`;

                    if(objResp.data[0].enabled == "true")
                    {
                        document.getElementById("chkDeviceEnabled").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkDeviceEnabled").removeAttribute("checked");
                    }
                    if(objResp.data[0].antitheftDetection == "true")
                    {
                        document.getElementById("chkDeviceAntitheftDetection").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkDeviceAntitheftDetection").removeAttribute("checked");
                    }
                    if(objResp.data[0].statusLed == "true")
                    {
                        document.getElementById("chkDeviceStatusLed").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkDeviceStatusLed").removeAttribute("checked");
                    }
                    switch (objResp.data[0].powerWorkingMode)
                    {
                        case "0":
                            document.getElementById("rbDeviceWMOptimalAccu").setAttribute("checked", true);
                            document.getElementById("rbDeviceWMOptimalSurv").removeAttribute("checked");
                            document.getElementById("rbDeviceWMCustom").removeAttribute("checked");
                            document.getElementById("divDeviceCustomRecordingSettings").classList.add("collapse", true);
                            break;
                        case "1":
                            document.getElementById("rbDeviceWMOptimalAccu").removeAttribute("checked");
                            document.getElementById("rbDeviceWMOptimalSurv").setAttribute("checked", true);
                            document.getElementById("rbDeviceWMCustom").removeAttribute("checked");
                            document.getElementById("divDeviceCustomRecordingSettings").classList.add("collapse", true);
                            break;
                        case "2":
                            document.getElementById("rbDeviceWMOptimalAccu").removeAttribute("checked");
                            document.getElementById("rbDeviceWMOptimalSurv").removeAttribute("checked");
                            document.getElementById("rbDeviceWMCustom").setAttribute("checked", true);
                            document.getElementById("divDeviceCustomRecordingSettings").classList.remove("collapse");
                            break;
                        default:
                            document.getElementById("rbDeviceWMOptimalAccu").removeAttribute("checked");
                            document.getElementById("rbDeviceWMOptimalSurv").removeAttribute("checked");
                            document.getElementById("rbDeviceWMCustom").removeAttribute("checked");
                    }
                    document.getElementById("rgDeviceCustomRecordingSettingsClipLength").value = Number.parseInt(objResp.data[0].recordingClipLength);
                    document.getElementById("rgDeviceCustomRecordingSettingsRetriggerIntervall").value = Number.parseInt(objResp.data[0].recordingRetriggerInterval);
                    if(objResp.data[0].recordingEndClipMotionStops == true)
                    {
                        document.getElementById("chkDeviceCustomRecordingSettingsStoppWhenMotionEnds").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkDeviceCustomRecordingSettingsStoppWhenMotionEnds").removeAttribute("checked");
                    }
                    switch (objResp.data[0].powerSource)
                    {
                        case "0":
                            document.getElementById("lblDevicePowerSource").innerHTML = `Batterie ${objResp.data[0].chargingStatus == 1 ? " (ladend)" : objResp.data[0].chargingStatus == 2 ? " (nicht angeschlossen)" : objResp.data[0].chargingStatus == 3 ? " (angeschlossen)" : ""}`;
                            break;
                        case "1":
                            document.getElementById("lblDevicePowerSource").innerHTML = `Solar ${objResp.data[0].chargingStatus == 1 ? " (ladend)" : ""}`;
                            break;
                        default:
                            document.getElementById("lblDevicePowerSource").innerHTML = `unbekannt`;
                    }
                    switch (objResp.data[0].watermark)
                    {
                        case "0":
                            document.getElementById("cbDeviceWatermark").selectedIndex = (Number.parseInt(objResp.data[0].watermark) + 1);
                            break;
                        case "1":
                            if(objResp.data[0].model == "T8112")
                            {
                                document.getElementById("cbDeviceWatermark").selectedIndex = 0;
                            }
                            else
                            {
                                document.getElementById("cbDeviceWatermark").selectedIndex = (Number.parseInt(objResp.data[0].watermark) + 1);
                            }
                            break;
                        case "2":
                            document.getElementById("cbDeviceWatermark").selectedIndex = (Number.parseInt(objResp.data[0].watermark) + 1);
                            break;
                        default:
                            document.getElementById("cbDeviceWatermark").selectedIndex = 0
                    }
                    if(objResp.data[0].autoNightvision == undefined)
                    {
                        document.getElementById("divDeviceAutoNightvision").classList.add("collapse", true);
                    }
                    else
                    {
                        document.getElementById("divDeviceAutoNightvision").classList.remove("collapse");
                        if(objResp.data[0].autoNightvision == "true")
                        {
                            document.getElementById("chkDeviceAutoNightvision").setAttribute("checked", true);
                        }
                        else
                        {
                            document.getElementById("chkDeviceAutoNightvision").removeAttribute("checked");
                        }
                    }
                    if(objResp.data[0].nightvision == undefined)
                    {
                        document.getElementById("divDeviceNightvision").classList.add("collapse", true);
                    }
                    else
                    {
                        document.getElementById("divDeviceNightvision").classList.remove("collapse");
                        document.getElementById("cbDeviceNightvision").selectedIndex = (Number.parseInt(objResp.data[0].nightvision));
                    }
                    if(objResp.data[0].microphone == "true")
                    {
                        document.getElementById("chkDeviceMicrophoneEnable").setAttribute("checked", true);
                        document.getElementById("chkDeviceAudioRecording").removeAttribute("disabled");
                    }
                    else
                    {
                        document.getElementById("chkDeviceMicrophoneEnable").removeAttribute("checked");
                    }
                    if(objResp.data[0].audioRecording == "true")
                    {
                        if(objResp.data[0].microphone == "true")
                        {
                            document.getElementById("divDeviceAudioRecording").classList.remove("collapse");
                        }
                        else
                        {
                            document.getElementById("divDeviceAudioRecording").classList.add("collapse", true);
                        }
                        document.getElementById("chkDeviceAudioRecording").setAttribute("checked", true);
                    }
                    else
                    {
                        if(objResp.data[0].microphone == "true")
                        {
                            document.getElementById("divDeviceAudioRecording").classList.add("collapse", true);
                        }
                        else
                        {
                            document.getElementById("divDeviceAudioRecording").classList.remove("collapse");
                        }
                        document.getElementById("chkDeviceAudioRecording").removeAttribute("checked");
                    }
                    if(objResp.data[0].speaker == "true")
                    {
                        document.getElementById("chkDeviceSpeakerEnable").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkDeviceSpeakerEnable").removeAttribute("checked");
                    }
                    if(objResp.data[0].speakerVolume != undefined)
                    {
                        if(objResp.data[0].speaker == "true")
                        {
                            document.getElementById("divDeviceSpeakerVolume").classList.remove("collapse");
                        }
                        else
                        {
                            document.getElementById("divDeviceSpeakerVolume").classList.add("collapse", true);
                        }
                        document.getElementById("rgDeviceSpeakerVolume").removeAttribute("disabled");
                        switch (objResp.data[0].speakerVolume)
                        {
                            case "90":
                                document.getElementById("rgDeviceSpeakerVolume").value = 1;
                                break;
                            case "92":
                                document.getElementById("rgDeviceSpeakerVolume").value = 2;
                                break;
                            case "93":
                                document.getElementById("rgDeviceSpeakerVolume").value = 3;
                                break;
                            default:
                                document.getElementById("rgDeviceSpeakerVolume").value = 1;
                        }
                    }
                    else
                    {
                        document.getElementById("divDeviceSpeakerVolume").classList.add("collapse", true);
                    }
                    switch (objResp.data[0].notificationType)
                    {
                        case "1":
                            document.getElementById("rbDeviceNTMostEfficient").setAttribute("checked", true);
                            document.getElementById("rbDeviceNTIncludeThumbnail").removeAttribute("checked");
                            document.getElementById("rbDeviceNTFullEffect").removeAttribute("checked");
                            break;
                        case "2":
                            document.getElementById("rbDeviceNTMostEfficient").removeAttribute("checked");
                            document.getElementById("rbDeviceNTIncludeThumbnail").setAttribute("checked", true);
                            document.getElementById("rbDeviceNTFullEffect").removeAttribute("checked");
                            break;
                        case "3":
                            document.getElementById("rbDeviceNTMostEfficient").removeAttribute("checked");
                            document.getElementById("rbDeviceNTIncludeThumbnail").removeAttribute("checked");
                            document.getElementById("rbDeviceNTFullEffect").setAttribute("checked", true);
                            break;
                        default:
                            document.getElementById("rbDeviceNTMostEfficient").removeAttribute("checked");
                            document.getElementById("rbDeviceNTIncludeThumbnail").removeAttribute("checked");
                            document.getElementById("rbDeviceNTFullEffect").removeAttribute("checked");
                    }

                    document.getElementById("lblModalDeviceSettingsInfo").innerHTML = ``;
                    if(objResp.data[0].model != "T8112x" && objResp.data[0].model != "T8113x" && objResp.data[0].model != "T8114x")
                    {
                        document.getElementById("lblModalDeviceSettingsInfo").innerHTML = createMessageContainer("alert alert-warning", `Dieses Gerät wird nicht vollständig unterstützt. Sie können bei der Weiterentwicklung helfen, in dem Sie die Informationen der beiden Abfragen "<a href="${location.protocol}//${location.hostname}:${port}/getDeviceProperties/${deviceId}" target=”_blank” class="alert-link">DevicePropperties</a>" und "<a href="${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${deviceId}" target=”_blank” class="alert-link">DevicePropertiesMetadata</a>" dem Entwickler zur Verfügung stellen.`);
                    }
                    document.getElementById("lblModalDeviceSettingsInfo").innerHTML += createMessageContainer("alert alert-primary", "Das Speichern der Einstellungen ist zur Zeit nicht möglich.");
                    document.getElementById("cardDeviceCommonSettings").classList.remove("collapse");
                    document.getElementById("cardDevicePowerManagerSettings").classList.remove("collapse");
                    document.getElementById("cardDeviceVideoSettings").classList.remove("collapse");
                    document.getElementById("cardDeviceAudioSettings").classList.remove("collapse");
                    document.getElementById("cardDeviceNotificationSettings").classList.remove("collapse");
                }
                else
                {
                    //document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Es wurden keine Geräte gefunden.")}`;
                }
            }
            else
            {
                //document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden des Geräts.")}`;
            }
        }
        else if(this.readyState == 4)
        {
            //document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden des Geräts.")}`;
        }
        else
        {
            //document.getElementById("divModalDeviceSettingsContent").innerHTML = createWaitMessage("Lade Einstellungen des Geräts...");</strong></div>`;
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function showStationSettings(stationId)
{
    const myModal = new bootstrap.Modal(document.getElementById('modalStationSettings'));
    document.getElementById("lblModalStationSettingsTitle").innerHTML = `<span class="placeholder col-6 bg-light placeholder-lg mt-1 mb-1"></span>`;
    document.getElementById("lblModalStationSettingsInfo").innerHTML = `<span class="placeholder col-12 placeholder-lg"></span>`;
    document.getElementById("lblStationModel").innerHTML = `<span class="placeholder col-6 placeholder-lg"></span>`;
    document.getElementById("lblStationName").innerHTML = `<span class="placeholder col-6 placeholder-lg"></span>`;
    document.getElementById("lblStationSerial").innerHTML = `<span class="placeholder col-8 placeholder-lg"></span>`;
    document.getElementById("lblStationFirmware").innerHTML= `<i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;<span class="placeholder col-4 placeholder-lg"></span>`;
    document.getElementById("cbStationAlarmTone").selectedIndex = 0;
    document.getElementById("rgStationAlarmVolume").value = 1;
    document.getElementById("rgStationPromtVolume").value = 0;
    document.getElementById("chkStationSwitchToSchedule").removeAttribute("checked");
    document.getElementById("chkStationSwitchToGeofencing").removeAttribute("checked");
    document.getElementById("chkStationSwitchByApp").removeAttribute("checked");
    document.getElementById("chkStationSwitchByKeypad").removeAttribute("checked");
    document.getElementById("chkStationStartAlarmDelay").removeAttribute("checked");

    document.getElementById("cardStationStorageSettings").classList.add("collapse", true);
    document.getElementById("cardStationAudioSettings").classList.add("collapse", true);
    document.getElementById("cardStationNofificationSettings").classList.add("collapse", true);

    myModal.show();

    var xmlhttp, objResp;
    var url = `${location.protocol}//${location.hostname}:${port}/getStation/${stationId}`;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                if(objResp.data.length = 1)
                {
                    document.getElementById("lblModalStationSettingsTitle").innerHTML = `<div style="text-align:left; float:left;"><h5 class="mb-0">${objResp.data[0].name} (${stationId})</h5></div>`;
                    document.getElementById("lblStationModel").innerHTML = `<h5 class="card-subtitle mb-2">${objResp.data[0].modelName} <span class="text-muted">(${objResp.data[0].model})</span></h5>`;
                    document.getElementById("lblStationName").innerHTML = `<h5 class="card-subtitle mb-2">${objResp.data[0].name}</h6>`;
                    document.getElementById("lblStationSerial").innerHTML = `<h6 class="card-subtitle text-muted">${objResp.data[0].serialNumber}</h6>`;
                    document.getElementById("lblStationFirmware").innerHTML = `<h6 class="card-subtitle text-muted"><i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${objResp.data[0].softwareVersion}</h6>`;

                    if(objResp.data[0].model == "T8002")
                    {
                        if(objResp.data[0].alarmTone == "255")
                        {
                            document.getElementById("cbStationAlarmTone").selectedIndex = 1;
                        }
                    }
                    else
                    {
                        document.getElementById("cbStationAlarmTone").selectedIndex = (Number.parseInt(objResp.data[0].alarmTone) + 1);
                    }
                    document.getElementById("rgStationAlarmVolume").value = objResp.data[0].alarmVolume;
                    document.getElementById("rgStationPromtVolume").value = objResp.data[0].promtVolume;

                    if(objResp.data[0].notificationSwitchModeSchedule == "true")
                    {
                        document.getElementById("chkStationSwitchToSchedule").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkStationSwitchToSchedule").removeAttribute("checked");
                    }
                    if(objResp.data[0].notificationSwitchModeGeofence == "true")
                    {
                        document.getElementById("chkStationSwitchToGeofencing").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkStationSwitchToGeofencing").removeAttribute("checked");
                    }
                    if(objResp.data[0].notificationSwitchModeApp == "true")
                    {
                        document.getElementById("chkStationSwitchByApp").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkStationSwitchByApp").removeAttribute("checked");
                    }
                    if(objResp.data[0].notificationSwitchModeKeypad == "true")
                    {
                        document.getElementById("chkStationSwitchByKeypad").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkStationSwitchByKeypad").removeAttribute("checked");
                    }
                    if(objResp.data[0].notificationStartAlarmDelay == "true")
                    {
                        document.getElementById("chkStationStartAlarmDelay").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("chkStationStartAlarmDelay").removeAttribute("checked");
                    }

                    document.getElementById("lblModalStationSettingsInfo").innerHTML = ``;
                    if(objResp.data[0].model != "T8002x" && objResp.data[0].model != "T8010x")
                    {
                        document.getElementById("lblModalStationSettingsInfo").innerHTML = createMessageContainer("alert alert-warning", `Dieses Gerät wird nicht vollständig unterstützt. Sie können bei der Weiterentwicklung helfen, in dem Sie die Informationen der beiden Abfragen "<a href="${location.protocol}//${location.hostname}:${port}/getStationProperties/${stationId}" target=”_blank” class="alert-link">StationPropperties</a>" und "<a href="${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${stationId}" target=”_blank” class="alert-link">StationPropertiesMetadata</a>" dem Entwickler zur Verfügung stellen.`);
                    }
                    document.getElementById("lblModalStationSettingsInfo").innerHTML += createMessageContainer("alert alert-primary", "Das Speichern der Einstellungen ist zur Zeit nicht möglich.");
                    //document.getElementById("cardStationStorageSettings").classList.remove("collapse");
                    document.getElementById("cardStationAudioSettings").classList.remove("collapse");
                    document.getElementById("cardStationNofificationSettings").classList.remove("collapse");
                }
                else
                {
                    //document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Es wurden keine Geräte gefunden.")}`;
                }
            }
            else
            {
                //document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.")}`;
            }
        }
        else if(this.readyState == 4)
        {
            //document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Stationen</h4>${createMessageContainer(alert alert-danger", "Fehler beim Laden der Station.")}`;
        }
        else
        {
            //document.getElementById("divModalDeviceSettingsContent").innerHTML = createWaitMessage("Lade Einstellungen der Station...");
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}
//#endregion

/**
 * Scripts for statechange.html
 */
//#region statechange.html
function loadDataStatechange(showLoading)
{
	var xmlHttp, objResp, station = "", stations = "", buttons = "", text = "", lastChangeTime;
	var lastChangeTimeAll = -1;
	var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.overrideMimeType('application/json');
	xmlHttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				for(station in objResp.data)
				{
					if(objResp.data[station].deviceType == "station")
					{
						switch (objResp.data[station].guardMode)
						{
                            case "0":
								state = "abwesend";
								buttons =  `<div class="row g-2"><div class="col-sm-6"><button id="btnArm${objResp.data[station].serialNumber}" type="button" class="btn btn-sm btn-primary col-12 h-100" disabled>ab&shy;we&shy;send</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnHome${objResp.data[station].serialNumber}" onclick="setHome('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">zu Hause</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnSchedule${objResp.data[station].serialNumber}" onclick="setSchedule('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">Zeit&shy;steu&shy;e&shy;rung</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnDisarm${objResp.data[station].serialNumber}" onclick="setDisarm('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">de&shy;ak&shy;ti&shy;viert</button></div></div>`;
								break;
							case "1":
								state = "zu Hause";
								buttons =  `<div class="row g-2"><div class="col-sm-6"><button id="btnArm${objResp.data[station].serialNumber}" onclick="setArm('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">ab&shy;we&shy;send</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnHome${objResp.data[station].serialNumber}" type="button" class="btn btn-sm btn-primary col-12 h-100" disabled>zu Hause</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnSchedule${objResp.data[station].serialNumber}" onclick="setSchedule('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">Zeit&shy;steu&shy;e&shy;rung</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnDisarm${objResp.data[station].serialNumber}" onclick="setDisarm('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">de&shy;ak&shy;ti&shy;viert</button></div></div>`;
								break;
							case "2":
								state = "Zeitsteuerung";
								buttons =  `<div class="row g-2"><div class="col-sm-6"><button id="btnArm${objResp.data[station].serialNumber}" onclick="setArm('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">ab&shy;we&shy;send</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnHome${objResp.data[station].serialNumber}" onclick="setHome('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">zu Hause</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnSchedule${objResp.data[station].serialNumber}" type="button" class="btn btn-sm btn-primary col-12 h-100" disabled>Zeit&shy;steu&shy;e&shy;rung</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnDisarm${objResp.data[station].serialNumber}" onclick="setDisarm('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">de&shy;ak&shy;ti&shy;viert</button></div></div>`;
								break;
							case "63":
								state = "deaktiviert";
								buttons =  `<div class="row g-2"><div class="col-sm-6"><button id="btnArm${objResp.data[station].serialNumber}" onclick="setArm('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">ab&shy;we&shy;send</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnHome${objResp.data[station].serialNumber}" onclick="setHome('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">zu Hause</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnSchedule${objResp.data[station].serialNumber}" onclick="setSchedule('${objResp.data[station].serialNumber}')" type="button" class="btn btn-sm btn-primary col-12 h-100">Zeit&shy;steu&shy;e&shy;rung</button></div>`;
								buttons += `<div class="col-sm-6"><button id="btnDisarm${objResp.data[station].serialNumber}" type="button" class="btn btn-sm btn-primary col-12 h-100" disabled>de&shy;ak&shy;ti&shy;viert</button></div></div>`;
								break;
							default:
								state = "unbekannt";
						}
						
                        if(objResp.data[station].guardModeTime != "" && objResp.data[station].guardModeTime != "n/a" && objResp.data[station].guardModeTime != "n/d" && objResp.data[station].guardModeTime != "undefined")
						{
							lastChangeTime = makeDateTimeString(new Date(parseInt(objResp.data[station].guardModeTime)));
							if(parseInt(objResp.data[station].guardModeTime) > lastChangeTimeAll)
							{
								lastChangeTimeAll = parseInt(objResp.data[station].guardModeTime);
							}
						}
						else if(objResp.data[station].pictureTime == "n/a")
						{
							lastChangeTime = "letzter Statuswechsel unbekannt";
						}
						else
						{
							lastChangeTime = "letzter Statuswechsel nicht verfügbar";
						}
                        stations += createCardStation(objResp.data[station], false, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0 mb-1"><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="bi-shield" title="aktueller Status"></i>&nbsp;${getGuardModeAsString(objResp.data[station].guardMode)}</span></div></div><div class="card-text d-grid gap-2">${buttons}</div>`, `<small class="text-muted">letzer Statuswechsel: ${lastChangeTime}</small>`);
                    }
				}
                text += createStationTypeCardsContainer("Stationen", stations);
				document.getElementById("btnArmAll").removeAttribute("disabled");
				document.getElementById("btnHomeAll").removeAttribute("disabled");
				document.getElementById("btnScheduleAll").removeAttribute("disabled");
				document.getElementById("btnDisarmAll").removeAttribute("disabled");
                document.getElementById("stations").innerHTML =  text;
				if(lastChangeTimeAll == -1)
				{
					lastChangeTimeAll = "unbekannt";
				}
				else
				{
					lastChangeTimeAll = makeDateTimeString(new Date(lastChangeTimeAll))
				}
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">letzer Statuswechsel: ${lastChangeTimeAll}</small>`;
			}
			else
			{
				document.getElementById("btnArmAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">letzer Statuswechsel: unbekannt</small>`;
				document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Stationen.");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("btnArmAll").setAttribute("disabled", true);
			document.getElementById("btnHomeAll").setAttribute("disabled", true);
			document.getElementById("btnScheduleAll").setAttribute("disabled", true);
			document.getElementById("btnDisarmAll").setAttribute("disabled", true);
			document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">letzer Statuswechsel: unbekannt</small>`;
			document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Stationen.");
		}
		else
		{
			if(showLoading==true)
			{
				document.getElementById("btnArmAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">letzer Statuswechsel: wird geladen...</small>`;
				document.getElementById("stations").innerHTML = createWaitMessage("Lade verfügbare Stationen...");
			}
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function setArm(stationserial)
{
	if(stationserial == "")
	{
		document.getElementById("btnArmAll").innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;abwesend`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/away`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
				document.getElementById("btnArmAll").innerHTML = "abwesend";
			}
			else if(this.readyState == 4)
			{

            }
			else
			{

            }
        };
        xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
	else
	{
		document.getElementById("btnArm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;abwesend`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationserial}/away`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
			}
			else if(this.readyState == 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
}

function setHome(stationserial)
{
	if(stationserial=="")
	{
		document.getElementById("btnHomeAll").innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;zu Hause`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/home`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
				document.getElementById("btnHomeAll").innerHTML = "zu Hause";
			}
			else if(this.readyState == 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
	else
	{
		document.getElementById("btnHome" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;zu Hause`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationserial}/home`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
			}
			else if(this.readyState == 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
}

function setSchedule(stationserial)
{
	if(stationserial=="")
	{
		document.getElementById("btnScheduleAll").innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;Zeitsteuerung`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/schedule`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
            if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
				document.getElementById("btnScheduleAll").innerHTML = "Zeitsteuerung";
			}
			else if(this.readyState == 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
	else
	{
		document.getElementById("btnSchedule" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;Zeitsteuerung`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationserial}/schedule`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
			}
			else if(this.readyState == 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
}

function setDisarm(stationserial)
{
	if(stationserial=="")
	{
		document.getElementById("btnDisarmAll").innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;deaktiviert`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/disarmed`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
				document.getElementById("btnDisarmAll").innerHTML = "deaktiviert";
			}
			else if(this.readyState != 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
	else
	{
		document.getElementById("btnDisarm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;deaktiviert`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationserial}/disarmed`;
		xmlHttp = new XMLHttpRequest();
		xmlHttp.overrideMimeType('application/json');
		xmlHttp.onreadystatechange = function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				}
				else
				{
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
			}
			else if(this.readyState != 4)
			{

            }
			else
			{

            }
		};
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
}
//#endregion

/**
 * Scripts for settings.html
 */
//#region settings.html
function disableUIElements()
{
    document.getElementById("txtUsername").setAttribute("disabled", true);
    document.getElementById("txtPassword").setAttribute("disabled", true);
    document.getElementById("cbCountry").setAttribute("disabled", true);
    document.getElementById("cbLanguage").setAttribute("disabled", true);
    document.getElementById("txtPortHttp").setAttribute("disabled", true);
    document.getElementById("txtPortHttps").setAttribute("disabled", true);
    document.getElementById("txtPortHttps").setAttribute("disabled", true);
    document.getElementById("txtHttpsKeyFile").setAttribute("disabled", true);
    document.getElementById("txtHttpsCertFile").setAttribute("disabled", true);
    document.getElementById("cbConnectionType").setAttribute("disabled", true);
    document.getElementById('txtDefaultImagePath').setAttribute("disabled", true);
    document.getElementById('txtDefaultVideoPath').setAttribute("disabled", true);
    document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
    document.getElementById("chkUpdateLinksOnlyWhenActive").setAttribute("disabled", true);
    document.getElementById("txtUpdateLinksIntervallTimespan").setAttribute("disabled", true);
    document.getElementById("chkUsePushService").setAttribute("disabled", true);
    document.getElementById("cbLogLevel").setAttribute("disabled", true);
}

function enableUIElements()
{
    document.getElementById("txtUsername").removeAttribute("disabled");
    document.getElementById("txtPassword").removeAttribute("disabled");
    document.getElementById("cbCountry").removeAttribute("disabled");
    document.getElementById("cbLanguage").removeAttribute("disabled");
    document.getElementById("cbConnectionType").removeAttribute("disabled");
    document.getElementById('txtDefaultImagePath').removeAttribute("disabled");
    document.getElementById('txtDefaultVideoPath').removeAttribute("disabled");
    document.getElementById("chkUsePushService").removeAttribute("disabled");
    document.getElementById("cbLogLevel").removeAttribute("disabled");
}

function validateFormSettings()
{
    var form = document.getElementById("configform");
    form.addEventListener('submit', function(event)
    {
        if(form.checkValidity() === false)
        {
            event.preventDefault();
            event.stopPropagation();
            const toast = new bootstrap.Toast(toastCheckConfigFailed);
            toast.show();
        }
        //form.classList.add('was-validated');
    }, false);
}

function loadStationsSettings()
{
    var xmlHttp, objResp, station, stations = "";
    var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    for(station in objResp.data)
                    {
                        stations += `<div class="form-label-group was-validated" class="container-fluid"><label class="mt-2" for="txtUdpPortsStation${objResp.data[station].serialNumber}">UDP Port für Verbindung mit der Basisstation ${objResp.data[station].serialNumber} (${objResp.data[station].name}).</label>`;
                        stations += `<input type="text" name="udpPortsStation${objResp.data[station].serialNumber}" id="txtUdpPortsStation${objResp.data[station].serialNumber}" class="form-control" placeholder="UDP Port ${objResp.data[station].serialNumber}" onfocusout="checkUDPPorts(udpPortsStation${objResp.data[station].serialNumber})" required>`;
                        stations += `<small class="form-text text-muted">Der angegebene Port darf nicht in Verwendung und keiner anderen Basisstation zugeordnet sein.</small>`;
                        stations += `<div class="invalid-feedback">Bitte geben Sie eine Zahl zwischen 1 und 65535 ein. Diese Zahl darf keiner anderen Basisstation zugeordnet sein.</div></div>`;
                    }
                    document.getElementById('chkUseUdpStaticPorts').removeAttribute("disabled");
                    document.getElementById("useUDPStaticPortsStations").innerHTML = stations;
                    loadDataSettings();
                }
                else
                {
                    document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.");
                    document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
                    loadDataSettings();
                }
            }
            catch (e)
            {
                document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.");
                document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
                loadDataSettings();
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.");
            document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
            loadDataSettings();
        }
        else
        {
            document.getElementById("resultLoading").innerHTML = createWaitMessage("Laden der Einstellungen...");
            document.getElementById("useUDPStaticPortsStations").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Stationen...</strong></div>`;
            document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function loadDataSettings()
{
    var xmlHttp, objResp, configData, username, password, accountcountry, accountlanguage, apiusehttp, apiporthttp, apiusehttps, apiporthttps, apikeyhttps, apicerthttps, apiconnectiontype, apiuseudplocalstaticports, apiudpports, apiusesystemvariables, apicameradefaultimage, apicameradefaultvideo, apiuseupdatestateevent, apiuseupdatestateintervall, apiupdatestatetimespan, apiuseupdatelinks, apiuseupdatelinksonlywhenactive, apiupdatelinkstimespan, apiusepushservice, apiloglevel;
    var url = `${location.protocol}//${location.hostname}:${port}/getConfig`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    for(configData in objResp.data)
                    {
                        username = objResp.data[configData].username;
                        password = objResp.data[configData].password;
                        accountcountry = objResp.data[configData].country;
                        accountlanguage = objResp.data[configData].language;
                        apiusehttp = objResp.data[configData].api_http_active;
                        apiporthttp = objResp.data[configData].api_http_port;
                        apiusehttps = objResp.data[configData].api_https_active;
                        apiporthttps = objResp.data[configData].api_https_port;
                        apikeyhttps = objResp.data[configData].api_https_key_file;
                        apicerthttps = objResp.data[configData].api_https_cert_file;
                        apiconnectiontype = objResp.data[configData].api_connection_type;
                        apiuseudplocalstaticports = objResp.data[configData].api_udp_local_static_ports_active;
                        apiudpports = objResp.data[configData].api_udp_local_static_ports;
                        apiusesystemvariables = objResp.data[configData].api_use_system_variables;
                        apicameradefaultimage = objResp.data[configData].api_camera_default_image;
                        apicameradefaultvideo = objResp.data[configData].api_camera_default_video;
                        apiuseupdatestateevent = objResp.data[configData].api_use_update_state_event;
                        apiuseupdatestateintervall = objResp.data[configData].api_use_update_state_intervall;
                        apiupdatestatetimespan = objResp.data[configData].api_update_state_timespan;
                        apiuseupdatelinks = objResp.data[configData].api_use_update_links;
                        apiuseupdatelinksonlywhenactive =objResp.data[configData].api_use_update_links_only_when_active;
                        apiupdatelinkstimespan = objResp.data[configData].api_update_links_timespan;
                        apiusepushservice = objResp.data[configData].api_use_pushservice;
                        apiloglevel = objResp.data[configData].api_log_level;
                    }
                    var text = document.getElementById('txtUsername');
                    text.value = username;
                    text = document.getElementById('txtPassword');
                    text.value = password;
                    if(accountcountry == undefined || accountcountry == "" )
                    {
                        document.getElementById("cbCountry").selectedIndex = "";
                    }
                    else
                    {
                        document.getElementById("cbCountry").value = accountcountry;
                    }
                    if(accountlanguage == undefined || accountlanguage == "" )
                    {
                        document.getElementById("cbLanguage").selectedIndex = "";
                    }
                    else
                    {
                        document.getElementById("cbLanguage").value = accountlanguage;
                    }
                    if(apiusehttp == "true")
                    {
                        document.getElementById("chkUseHttp").setAttribute("checked", true);
                        document.getElementById("txtPortHttp").removeAttribute("disabled");
                    }
                    else
                    {
                        document.getElementById("txtPortHttp").setAttribute("disabled", true);
                    }
                    text = document.getElementById('txtPortHttp');
                    text.value = apiporthttp;
                    if(apiusehttps == "true")
                    {
                        document.getElementById("chkUseHttps").setAttribute("checked", true);
                        document.getElementById("txtPortHttps").removeAttribute("disabled");
                        document.getElementById("txtHttpsKeyFile").removeAttribute("disabled");
                        document.getElementById("txtHttpsCertFile").removeAttribute("disabled");
                    }
                    else
                    {
                        document.getElementById("txtPortHttps").setAttribute("disabled", true);
                        document.getElementById("txtHttpsKeyFile").setAttribute("disabled", true);
                        document.getElementById("txtHttpsCertFile").setAttribute("disabled", true);
                    }
                    text = document.getElementById('txtPortHttps');
                    text.value = apiporthttps;
                    text = document.getElementById('txtHttpsKeyFile');
                    text.value = apikeyhttps;
                    text = document.getElementById('txtHttpsCertFile');
                    text.value = apicerthttps;
                    if(apiconnectiontype == undefined || (apiconnectiontype != "0" && apiconnectiontype != "1" && apiconnectiontype != "2"))
                    {
                        document.getElementById("cbConnectionType").selectedIndex = "";
                    }
                    else
                    {
                        document.getElementById("cbConnectionType").selectedIndex = (Number.parseInt(apiconnectiontype)) + 1;
                    }
                    if(apiusesystemvariables == "true")
                    {
                        document.getElementById("chkUseSystemVariables").setAttribute("checked", true);
                    }
                    if(apiuseudplocalstaticports == "true")
                    {
                        document.getElementById("chkUseUdpStaticPorts").setAttribute("checked", true);
                    }

                    var element = document.getElementsByTagName("INPUT");
                    var max = element.length;
                    for(var i=0; i<max; i++)
                    {
                        if(element[i].name.startsWith("udpPortsStation"))
                        {
                            var tempSerial = element[i].name.replace("udpPortsStation", "");
                            var tempPorts = objResp.data[configData]["api_udp_local_static_ports_" + tempSerial];
                            text = document.getElementById('txtUdpPortsStation' + tempSerial);
                            if(tempPorts == undefined || tempPorts == "undefined")
                            {
                                text.value = "";
                            }
                            else
                            {
                                text.value = tempPorts;
                            }
                            changeValue("useUdpStaticPorts");
                            if(apiuseudplocalstaticports == "false")
                            {
                                document.getElementById('txtUdpPortsStation' + tempSerial).setAttribute("disabled", true);
                            }
                        }
                    }
                    text = document.getElementById('txtDefaultImagePath');
                    text.value = apicameradefaultimage;
                    text = document.getElementById('txtDefaultVideoPath');
                    text.value = apicameradefaultvideo;
                    if(apiuseupdatestateevent == "true")
                    {
                        document.getElementById("chkUpdateStateEvent").setAttribute("checked", true);
                    }
                    else
                    {
                        document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
                    }
                    if(apiuseupdatestateintervall == "true")
                    {
                        document.getElementById("chkUpdateStateIntervall").setAttribute("checked", true);
                        document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
                    }
                    else
                    {
                        document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
                    }
                    text = document.getElementById('txtUpdateStateIntervallTimespan');
                    text.value=apiupdatestatetimespan;
                    if(apiuseupdatelinks == "true")
                    {
                        document.getElementById("chkUseUpdateLinksIntervall").setAttribute("checked", true);
                        document.getElementById("chkUpdateLinksOnlyWhenActive").removeAttribute("disabled");
                        document.getElementById("txtUpdateLinksIntervallTimespan").removeAttribute("disabled");
                    }
                    else
                    {
                        document.getElementById("chkUpdateLinksOnlyWhenActive").setAttribute("disabled", true);
                        document.getElementById("txtUpdateLinksIntervallTimespan").setAttribute("disabled", true);
                    }
                    if(apiuseupdatelinksonlywhenactive == "true")
                    {
                        document.getElementById("chkUpdateLinksOnlyWhenActive").setAttribute("checked", true);
                    }
                    text = document.getElementById('txtUpdateLinksIntervallTimespan');
                    text.value=apiupdatelinkstimespan;
                    if(apiusepushservice == "true")
                    {
                        document.getElementById("chkUsePushService").setAttribute("checked", true);
                    }
                    if(apiloglevel == undefined || !(apiloglevel == "0" || apiloglevel == "1" || apiloglevel == "2" || apiloglevel == "3"))
                    {
                        document.getElementById("cbLogLevel").selectedIndex = "";
                    }
                    else
                    {
                        document.getElementById("cbLogLevel").selectedIndex = (Number.parseInt(apiloglevel)) + 1;
                    }
                    checkLogLevel(apiloglevel);
                    document.getElementById("resultLoading").innerHTML = "";
                    enableUIElements();
                }
                else
                {
                    document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", `Fehler bei der Ermittlung der Einstellungen.<br /><small class="form-text text-muted">Rückgabewert 'success' ist 'false'.</small>`);
                }
            }
            catch (e)
            {
                document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", `Fehler bei der Ermittlung der Einstellungen.<br /><small class="form-text text-muted">${e}</small>`);
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", `Fehler bei der Ermittlung der Einstellungen.<br /><small class="form-text text-muted">Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.</small>`);
        }
        else
        {
            document.getElementById("resultLoading").innerHTML = createWaitMessage("Laden der Einstellungen...");
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function loadSystemVariables()
{
    var xmlHttp, objResp, systemVariable, sysVarName, sysVarInfo, sysVarAvailable, sysVarTable = "";
    var url = `${location.protocol}//${location.hostname}:${port}/checkSystemVariables`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    document.getElementById("divSystemVariablesHint").innerHTML = createMessageContainer("alert alert-primary fade show", `Die Option 'Systemvariablen bei API Aktionen automatisch aktualisieren' ist aktiviert. Somit aktualisiert das AddOn die entsprechenden Systemvariablen. In der folgenden Tabelle finden Sie alle Systemvariablen, die dieses AddOn auf der CCU benötigt. Wenn die jeweilige Zeile grün ist, ist die Systemvariable auf der CCU bereits angelegt, ansonsten ist die Zeile rot.<br /><small class="form-text text-muted">Bitte achten Sie darauf, dass alle Systemvariablen angelegt sind. Wenn Sie die Aktualisierung der Systemvariablen nicht wünschen, deaktivieren Sie bitte die Option 'Systemvariablen bei API Aktionen automatisch aktualisieren'.</small>`);
                    sysVarTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col">Status</th><th scope="col">Name der Systemvariable</th><th scope="col"></th></tr></thead><tbody>`;
                    for(systemVariable in objResp.data)
                    {
                        sysVarName = objResp.data[systemVariable].sysVar_name;
                        sysVarInfo = objResp.data[systemVariable].sysVar_info;
                        sysVarAvailable = objResp.data[systemVariable].sysVar_available;
                        if(sysVarAvailable==true)
                        {
                            sysVarTable += `<tr class="table-success"><th scope="row" class="align-middle">angelegt</th>`;
                        }
                        else
                        {
                            sysVarTable += `<tr class="table-danger"><th scope="row" class="align-middle">nicht angelegt</th>`;
                        }
                        sysVarTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
                        if(sysVarAvailable==true)
                        {
                            sysVarTable += `<td class="align-middle"><button id="btn${sysVarName}" type="button" class="btn btn-primary mb-1" disabled>Systemvariable anlegen</button></td>`;
                        }
                        else
                        {
                            sysVarTable += `<td class="align-middle"><button id="btn${sysVarName}" onclick="createSysVar('${sysVarName}', '${sysVarInfo}')" type="button" class="btn btn-primary mb-1">Systemvariable anlegen</button></td>`;
                        }
                        sysVarTable += `</tr>`;
                    }
                    sysVarTable += `</tbody></table>`;
                    document.getElementById("divSystemVariables").innerHTML = sysVarTable;
                }
                else
                {
                    if(objResp.reason == "System variables in config disabled.")
                    {
                        document.getElementById("divSystemVariablesHint").innerHTML = "";
                        document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-info mb-0", "Die Aktualisierung von Systemvariablen bei API Aktionen ist deaktiviert.");
                    }
                    else
                    {
                        document.getElementById("divSystemVariablesHint").innerHTML = "";
                        document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", `Fehler bei der Ermittlung der Systemvariablen.<br /><small class="form-text text-muted">Es ist folgender Fehler ist aufgetreten: '${objResp.reason}'</small>`);
                    }
                }
            }
            catch (e)
            {
                document.getElementById("divSystemVariablesHint").innerHTML = "";
                document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.");
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.");
        }
        else
        {
            document.getElementById("divSystemVariables").innerHTML = createWaitMessage("Laden der Systemvariablen...");
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function saveConfig()
{
    var xmlHttp, obfFD;
    var url = `${location.protocol}//${location.hostname}:${port}/setConfig`;
    xmlHttp = new XMLHttpRequest();
    obfFD = new FormData(document.getElementById("configform"));
    xmlHttp.addEventListener("load", function(event)
    {
        //loadDataSettings();
    });
    xmlHttp.addEventListener( "error", function(event)
    {
        document.getElementById("resultMessage").innerHTML = "";
        const toast = new bootstrap.Toast(toastSaveConfigFailed);
        toast.show();
    });
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                obfFD = JSON.parse(this.responseText);
                if(obfFD.success == true)
                {
                    if(obfFD.serviceRestart == true)
                    {
                        document.getElementById("resultMessage").innerHTML = "";
                        //const toast = new bootstrap.Toast(toastSaveConfigOKRestart);
                        //toast.show();
                        window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
                        return;
                    }
                    else
                    {
                        document.getElementById("resultMessage").innerHTML = "";
                        const toast = new bootstrap.Toast(toastSaveConfigOK);
                        toast.show();
                    }
                    loadDataSettings();
                    loadSystemVariables();
                }
                else
                {
                    document.getElementById("resultMessage").innerHTML = "";
                    const toast = new bootstrap.Toast(toastSaveConfigFailed);
                    toast.show();
                }
            }
            catch (e)
            {
                document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", `Fehler bei dem Speichern der Einstellungen.<br /><small class="form-text text-muted">${e}</small>`);
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", `Fehler bei dem Speichern der Einstellungen.<br /><small class="form-text text-muted">Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.</small>`);
        }
        else
        {
            document.getElementById("resultMessage").innerHTML = createWaitMessage("Einstellungen werden gespeichert...");
        }
    };
    xmlHttp.open("POST", url);
    xmlHttp.send(obfFD);
}

function createSysVar(varName, varInfo)
{
    var xmlHttp, objResp;
    var url = `${location.protocol}//${location.hostname}:${port}/createSystemVariable/${varName}/${varInfo}`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    text = `<table class="table"><thead><tr><th scope="col">Status</th><th scope="col">Name der Systemvariable</th><th scope="col"></th></tr></thead><tbody>`;
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    loadSystemVariables();
                }
                else
                {
                    document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.");
                }
            }
            catch (e)
            {
                document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.");
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.");
        }
        else
        {
            document.getElementById("divSystemVariables").innerHTML = createWaitMessage("Laden der Systemvariablen...");
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function removeTokenData()
{
    var xmlHttp, objResp;
    var url = `${location.protocol}//${location.hostname}:${port}/removeTokenData`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true && objResp.dataRemoved == true)
                {
                    //const toast = new bootstrap.Toast(toastRemoveTokenOK);
                    //toast.show();
                    window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
                    return;
                }
                else
                {
                    const toast = new bootstrap.Toast(toastRestartFailed);
                    toast.show();
                }
            }
            catch (e)
            {
                const toast = new bootstrap.Toast(toastRestartFailed);
                toast.show();
            }
        }
        else if(this.readyState == 4)
        {}
        else
        {}
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function restartService()
{
    var xmlHttp, objResp;
    var url = `${location.protocol}//${location.hostname}:${port}/restartService`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    //const toast = new bootstrap.Toast(toastRestartOK);
                    //toast.show();
                    window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
                    return;
                }
                else
                {
                    const toast = new bootstrap.Toast(toastRestartFailed);
                    toast.show();
                }
            }
            catch (e)
            {
                const toast = new bootstrap.Toast(toastRestartFailed);
                toast.show();
            }
        }
        else if(this.readyState == 4)
        {}
        else
        {}
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function enableButtons(enable)
{
    if(enable == true)
    {
        document.getElementById("btnEnableTroubleShooting").setAttribute("onclick", "enableButtons(false)");
        document.getElementById("btnEnableTroubleShooting").setAttribute("class", "btn btn-warning btn-block");
        document.getElementById("btnEnableTroubleShooting").innerHTML = "Fehlerbehebung deaktivieren";
        document.getElementById("lblDeleteTokenData").removeAttribute("class");
        document.getElementById("btnDeleteTokenData").removeAttribute("disabled");
        document.getElementById("lblRestartService").removeAttribute("class");
        document.getElementById("btnRestartService").removeAttribute("disabled");
    }
    else
    {
        document.getElementById("btnEnableTroubleShooting").setAttribute("onclick", "enableButtons(true)");
        document.getElementById("btnEnableTroubleShooting").setAttribute("class", "btn btn-outline-warning btn-block");
        document.getElementById("btnEnableTroubleShooting").innerHTML = "Fehlerbehebung aktivieren";
        document.getElementById("lblDeleteTokenData").setAttribute("class", "text-muted");
        document.getElementById("btnDeleteTokenData").setAttribute("disabled", true);
        document.getElementById("lblRestartService").setAttribute("class", "text-muted");
        document.getElementById("btnRestartService").setAttribute("disabled", true);
    }
}

function changeValue(element)
{
    switch (element.name)
    {
        case "useHttp":
            if(element.checked == true)
            {
                document.getElementById("txtPortHttp").removeAttribute("disabled");
            }
            else
            {
                if((element.checked == false) && (document.getElementById("chkUseHttps").checked == false))
                {
                    const myModal = new bootstrap.Modal(document.getElementById('modalAtLeastOneNeedsActivation'));
                    document.getElementById("modalAtLeastOneNeedsActivationBtnOK").removeAttribute("onClick");
                    document.getElementById("modalAtLeastOneNeedsActivationBtnOK").setAttribute("onClick", `checkCheckField("chkUseHttp")`);
                    myModal.show();
                }
                else
                {
                    document.getElementById("txtPortHttp").setAttribute("disabled", true);
                }
            }
            break;
        case "useHttps":
            if(element.checked == true)
            {
                document.getElementById("txtPortHttps").removeAttribute("disabled");
                document.getElementById("txtHttpsKeyFile").removeAttribute("disabled");
                document.getElementById("txtHttpsCertFile").removeAttribute("disabled");
            }
            else
            {
                if((element.checked == false) && (document.getElementById("chkUseHttp").checked == false))
                {
                    const myModal = new bootstrap.Modal(document.getElementById('modalAtLeastOneNeedsActivation'));
                    document.getElementById("modalAtLeastOneNeedsActivationBtnOK").removeAttribute("onClick");
                    document.getElementById("modalAtLeastOneNeedsActivationBtnOK").setAttribute("onClick", `checkCheckField("chkUseHttps")`);
                    myModal.show();
                }
                else
                {
                    document.getElementById("txtPortHttps").setAttribute("disabled", true);
                    document.getElementById("txtHttpsKeyFile").setAttribute("disabled", true);
                    document.getElementById("txtHttpsCertFile").setAttribute("disabled", true);
                }
            }
            break;
        case "useUdpStaticPorts":
            if(element.checked == true)
            {
                var element = document.getElementsByTagName("INPUT");
                var max = element.length;
                for(var i=0; i<max; i++)
                {
                    if(element[i].name.startsWith("udpPortsStation"))
                    {
                        var tempSerial = element[i].name.replace("udpPortsStation", "");
                        document.getElementById('txtUdpPortsStation' + tempSerial).removeAttribute("disabled");
                    }
                }
            }
            else
            {
                var element = document.getElementsByTagName("INPUT");
                var max = element.length;
                for(var i=0; i<max; i++)
                {
                    if(element[i].name.startsWith("udpPortsStation"))
                    {
                        var tempSerial = element[i].name.replace("udpPortsStation", "");
                        document.getElementById('txtUdpPortsStation' + tempSerial).setAttribute("disabled", true);
                    }
                }
            }
            break;
        case "useUpdateStateIntervall":
            if(element.checked == true)
            {
                if(document.getElementById("chkUpdateStateEvent").checked == true)
                {
                    const myModal = new bootstrap.Modal(document.getElementById('modalStateEventOrIntervall'));
                    document.getElementById("modalStateEventOrIntervallBtnOK").removeAttribute("onClick");
                    document.getElementById("modalStateEventOrIntervallBtnOK").setAttribute("onClick", `uncheckCheckField("chkUpdateStateEvent")`);
                    myModal.show();
                }
                document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
            }
            else
            {
                document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
            }
            break;
        case "useUpdateLinksIntervall":
            if(element.checked == true)
            {
                document.getElementById("txtUpdateLinksIntervallTimespan").removeAttribute("disabled");
                document.getElementById("chkUpdateLinksOnlyWhenActive").removeAttribute("disabled");
            }
            else
            {
                document.getElementById("txtUpdateLinksIntervallTimespan").setAttribute("disabled", true);
                document.getElementById("chkUpdateLinksOnlyWhenActive").setAttribute("disabled", true);
            }
            break;
        case "useUpdateStateEvent":
            if(element.checked == true)
            {
                if(document.getElementById("chkUpdateStateIntervall").checked == true)
                {
                    const myModal = new bootstrap.Modal(document.getElementById('modalStateEventOrIntervall'));
                    document.getElementById("modalStateEventOrIntervallBtnOK").removeAttribute("onClick");
                    document.getElementById("modalStateEventOrIntervallBtnOK").setAttribute("onClick", `uncheckCheckField("chkUpdateStateIntervall")`);
                    myModal.show();
                }
                document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
            }
            else
            {}
            break;
    }
}

function checkLogLevel(value)
{
    if(value == "3")
    {
        document.getElementById("alertLogLevel").setAttribute("class", "alert alert-warning alert-dismissible fade show");
        document.getElementById("alertLogLevel").setAttribute("role", "alert");
        document.getElementById("alertLogLevel").innerHTML += "Sie haben den Umfang der Protokollierung so gewählt, dass zusätzlich auch DEBUG Informationen protokolliert werden. Dies kann zu einer sehr großen Protokolldatei führen. Wählen Sie für den normalen Betrieb einen Wert kleiner als 3 aus.<br />";
        document.getElementById("alertLogLevel").innerHTML += `<small class="form-text text-muted">Diese Einstellung bleibt dauerhaft auch nach einem Neustart des Addons oder der CCU aktiv.</small>`;
    }
    else
    {
        document.getElementById("alertLogLevel").removeAttribute("class");
        document.getElementById("alertLogLevel").removeAttribute("role");
        document.getElementById("alertLogLevel").innerHTML = "";
    }
}

function checkUDPPorts(elementName)
{
    var element = document.getElementsByTagName("INPUT");
    var cnt = 0;
    var error = false;
    var errorMessage = "";
    var regex = new RegExp("^(1|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$");
    var max = element.length;
    for(var i=0; i<max; i++)
    {
        if(element[i].name.startsWith("udpPortsStation"))
        {
            cnt = cnt + 1;
        }
    }
    if(elementName.value == "")
    {
        return;
    }
    if(!regex.test(elementName.value))
    {
        error = true;
        errorMessage = "Sie haben keine Zahl oder eine ungültige Zahl eingegeben. Bitte geben Sie eine Zahl zwischen 1 und 65535 ein.<br /><br />Die Eingabe wird nun gelöscht.";
    }
    if(error == false && cnt > 1)
    {
        max = element.length;
        for(var i=0; i<max; i++)
        {
            if(element[i].name.startsWith("udpPortsStation"))
            {
                var eName = 'txtUdpPortsStation' + element[i].name.replace("udpPortsStation", "");
                if(eName != elementName.id)
                {
                    if(document.getElementById('txtUdpPortsStation' + element[i].name.replace("udpPortsStation", "")).value == elementName.value)
                    {
                        error = true;
                        errorMessage = "Sie haben einen Port eingegeben, der bereits für eine andere Basisstation oder ein anderes Gerät eingegeben wurde.<br /><br />Die Eingabe wird nun gelöscht.";
                        break;
                    }
                }
            }
        }
    }
    if(error == true)
    {
        const myModal = new bootstrap.Modal(document.getElementById('modalUDPPortsEqualWrong'));
        document.getElementById("modalUDPPortsEqualWrongBtnOK").removeAttribute("onClick");
        document.getElementById("modalUDPPortsEqualWrongBtnOK").setAttribute("onClick", `clearInputField("` + elementName.id + `")`);
        document.getElementById("modalUDPPortsEqualWrongMessage").innerHTML = errorMessage;
        myModal.show();
    }
}

function checkCheckField(elementName)
{
    document.getElementById(elementName).checked = true;
}

function uncheckCheckField(elementName)
{
    document.getElementById(elementName).checked = false;
}

function clearInputField(elementName)
{
    document.getElementById(elementName).value = "";
}
//#endregion

/**
 * Scripts for logfiles.html
 */
//#region logfiles.html
function loadLogfile(logfiletype, showLoading)
{
    var xmlHttp, url;
    switch(logfiletype)
    {
        case "index":
            break;
        case "log":
            url = `${location.protocol}//${location.hostname}:${port}/getLogFileContent`;
            break;
        case "err":
            url=`${location.protocol}//${location.hostname}:${port}/getErrorFileContent`;
            break;
    }
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            var log = this.responseText;
            log = log.replace(/  /g, " &nbsp;");
            log = log.replace(/<[^>]*>/g, '');
            log = log.replace(/\n/g, "<br />");
            switch(logfiletype)
            {
                case "log":
                    document.getElementById("log").innerHTML = `<code>${log}</code>`;
                    break;
                case "err":
                    document.getElementById("err").innerHTML = `<code>${log}</code>`;
                    break;
            }
        }
        else if(this.readyState == 4)
        {
            switch(logfiletype)
            {
                case "log":
                    document.getElementById("log").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Protokolldatei.");
                    break;
                case "err":
                    document.getElementById("err").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Fehlerprotokolldatei.");
                    break;
            }
        }
        else
        {
            if(showLoading == true)
            {
                switch(logfiletype)
                {
                    case "log":
                        document.getElementById("log").innerHTML = createWaitMessage("Lade Protokolldatei...");
                        break;
                    case "err":
                        document.getElementById("err").innerHTML = createWaitMessage("Lade Fehlerprotokolldatei...");
                        break;
                }
            }
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function emptyLogfile(logfiletype)
{
    var xmlhttp, objResp, url;
    switch(logfiletype)
    {
        case "log":
            url = `${location.protocol}//${location.hostname}:${port}/clearLogFile`;
            break;
        case "err":
            url=`${location.protocol}//${location.hostname}:${port}/clearErrFile`;
            break;
    }
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                switch(logfiletype)
                {
                    case "log":
                        loadLogfile("log", true);
                        break;
                    case "err":
                        loadLogfile("err", true);
                        break;
                }
            }
            else
            {

            }
        }
        else if(this.readyState == 4)
        {

        }
        else
        {

        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}
//#endregion

/**
 * Scripts for info.html
 */
//#region info.html
function loadDataInfo(showLoading)
{
    var xmlHttp, objResp, info = "";
    var url = `${location.protocol}//${location.hostname}:${port}/getApiInfo`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                info = `eufy Security AddOn: ${objResp.api_version}<br />eufy Security Client: ${objResp.eufy_security_client_version}<br />HomeMatic API: ${objResp.homematic_api_version}<br />Webseite: 1.6.3`;
                document.getElementById("versionInfo").innerHTML = info;
            }
            else
            {
                document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Versionsinformationen.");
            }
        }
        else if(this.readyState == 4)
        {
            document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Versionsinformationen.");
        }
        else
        {
            if(showLoading == true)
            {
                document.getElementById("versionInfo").innerHTML = createWaitMessage("Lade verfügbare Versionsinformationen...");
            }
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}
//#endregion

/**
 * Scripts for restartWaiter.html
 */
//#region restartWaiter.html
async function restartAPIService()
{
    const toast = new bootstrap.Toast(toastRestartOK);
    toast.show();
    await delay(7500);
    checkServiceState(0, 0, 0);
}

async function checkServiceState(cntStart, cntInit, postInit)
{
    var xmlHttp, objResp;
    var url = `${location.protocol}//${location.hostname}:${port}/getServiceState`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = async function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    if(objResp.message == "init")
                    {
                        if(cntInit == 0)
                        {
                            var startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde gestartet.</div>`;
                            document.getElementById("serviceRestart").innerHTML = startDone;
                            var initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">Warte auf Initialisierung des Services...</div>`;
                            document.getElementById("serviceInit").innerHTML = initStart;
                        }
                        if(cntInit < 20)
                        {
                            cntInit = cntInit + 1;
                            await delay(1000);
                            checkServiceState(cntStart, cntInit, postInit);
                        }
                        else
                        {
                            alert("Maximum cntInit reached.");
                        }
                    }
                    else if(objResp.message == "ok")
                    {
                        if(cntInit == 0 && postInit == 0)
                        {
                            var startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde gestartet.</div>`;
                            document.getElementById("serviceRestart").innerHTML = startDone;
                            var initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">Warte auf Initialisierung des Services...</div>`;
                            document.getElementById("serviceInit").innerHTML = initStart;
                        }
                        if(postInit < 5)
                        {
                            postInit = postInit + 1;
                            await delay(1000);
                            checkServiceState(cntStart, cntInit, postInit);
                        }
                        else
                        {
                            var startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde gestartet.</div>`;
                            document.getElementById("serviceRestart").innerHTML = startDone;
                            var initDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde initializiert. Sie werden nun weitergeleitet...</div>`;
                            document.getElementById("serviceInit").innerHTML = initDone;
                            await delay(5000);
                            window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/` + redirectTarget;
                        }
                    }
                    else if(objResp.message == "shutdown")
                    {
                        cntStart = 0;
                        cntInit = 0;
                        postInit = 0;
                        await delay(5000);
                        checkServiceState(cntStart, cntInit, postInit);
                    }
                    else
                    {
                        if(cntStart < 20)
                        {
                            cntStart = cntStart + 1;
                            await delay(1000);
                            checkServiceState(cntStart, cntInit, postInit);
                            //return;
                        }
                        else
                        {
                            alert("Maximum cntStart reached (pos1).");
                        }
                    }
                }
                else
                {
                    if(cntStart < 20)
                    {
                        cntStart = cntStart + 1;
                        await delay(1000);
                        checkServiceState(cntStart, cntInit, postInit);
                    }
                    else
                    {
                        alert("Maximum cntStart reached (pos2).");
                    }
                }
            }
            catch (e)
            {
                alert(e.message);
                if(cntStart < 20)
                {
                    cntStart = cntStart + 1;
                    await delay(1000);
                    checkServiceState(cntStart, cntInit, postInit);
                }
                else
                {
                    alert("Maximum cntStart reached (pos3).");
                }
            }
        }
        else if(this.readyState == 4)
        {
            if(cntStart < 20)
            {
                cntStart = cntStart + 1;
                await delay(2000);
                checkServiceState(cntStart, cntInit, postInit);
            }
        }
        else
        {}
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function delay(time)
{
    return new Promise(resolve => setTimeout(resolve, time));
}
//#endregion