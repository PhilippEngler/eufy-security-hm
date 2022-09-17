/**
 * Javascript for eufySecurity Addon
 * v1.0 - 20220911
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
        if (this.readyState == 4 && this.status == 200)
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
                var loadSettingsError = `<div class="alert alert-warning alert-dismissible fade show" role="alert">`;
                loadSettingsError += `Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.<br />`;
                loadSettingsError += `<small class="text-muted">Bitte überprüfen Sie die Datei apiPorts.txt im Webseitenverzeichnisses dieses AddOns.</small>`;
                loadSettingsError += `</div>`;
                document.getElementById("loadApiSettingsError").innerHTML = loadSettingsError;
            }
        }
        else if (this.readyState == 4)
        {
            var loadSettingsError = `<div class="alert alert-warning alert-dismissible fade show" role="alert">`;
            loadSettingsError += `Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.<br />`;
            loadSettingsError += `<small class="text-muted">Bitte überprüfen Sie die Datei apiPorts.txt im Webseitenverzeichnisses dieses AddOns.</small>`;
            loadSettingsError += `</div>`;
            document.getElementById("loadApiSettingsError").innerHTML = loadSettingsError;
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
            url=`${location.protocol}//${location.hostname}:${port}/downloadErrFile`;
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
//#endregion

/**
 * Scripts for devices.html
 */
//#region devices.html
 function loadStations()
 {
    document.getElementById("stations").innerHTML = `<p id="stations"></p>`;
    var xmlhttp, myObj, station, stations = "";
    var imagepath = "";
    var type = "";
    var state = "";
    var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200)
        {
            myObj = JSON.parse(this.responseText);
            if(myObj.success == true)
            {
                if(myObj.data.length > 0)
                {
                    stations += `<h4>Basisstationen</h4>`;
                    stations += `<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5">`;
                    for (station in myObj.data)
                    {
                        if(myObj.data[station].device_type == "station")
                        {
                            switch (myObj.data[station].model)
                            {
                                case "T8001":
                                    imagepath = `<img src="assets/devices/eufyHomeBase.png" class="card-img-top" alt="HomeBase">`;
                                    type="HomeBase";
                                    break;
                                case "T8002":
                                    imagepath = `<img src="assets/devices/eufyHomeBase.png" class="card-img-top" alt="HomeBase E">`;
                                    type="HomeBase E";
                                    break;
                                case "T8010":
                                    imagepath = `<img src="assets/devices/eufyHomeBase2.png" class="card-img-top" alt="HomeBase 2">`;
                                    type="HomeBase 2";
                                    break;
                                default:
                                    imagepath = `<img src="assets/devices/eufyHomeBase2.png" class="card-img-top" alt="HomeBase">`;
                                    type="HomeBase";
                            }
                            switch (myObj.data[station].guard_mode)
                            {
                                case "0":
                                    state = "abwesend";
                                    break;
                                case "1":
                                    state = "zu Hause";
                                    break;
                                case "2":
                                    state = "Zeitplan";
                                    break;
                                case "3":
                                    state = "Benutzerdefiniert 1";
                                    break;
                                case "4":
                                    state = "Benutzerdefiniert 2";
                                    break;
                                case "5":
                                    state = "Benutzerdefiniert 3";
                                    break;
                                case "6":
                                    state = "ausgeschaltet";
                                    break;
                                case "47":
                                    state = "Geofencing";
                                    break;
                                case "63":
                                    state = "deaktiviert";
                                    break;
                                default:
                                    state="unbekannt";
                            }
                            stations += `<div class="col">`;
                            stations += `<div class="card mb-3">`;
                            stations += `<div class="card-header">`;
                            stations += `<div style="text-align:left; float:left;"><h5 class="mb-0">${myObj.data[station].name}</h5></div>`;
                            stations += `<div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0"><i class="text-muted bi-gear" title="Einstellungen" onclick="showStationSettings('${myObj.data[station].station_id}')"></i></h5></span></div>`;
                            stations += `</div>`;
                            stations += `<div class="row no-gutters">`;
                            stations += `<div class="col-md-4">${imagepath}</div>`;
                            stations += `<div class="col-md-8">`;
                            stations += `<div class="card-body" style="margin-left: -1rem">`;
                            stations += `<h6 class="card-subtitle mb-2 text-muted">${type}</h6>`;
                            stations += `<p class="card-text">${myObj.data[station].station_id}<br /><span class="text-nowrap"><i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${myObj.data[station].software_version}</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-nowrap"><i class="bi-shield" title="aktueller Status"></i>&nbsp;${state}</span></p>`;
                            stations += `</div>`;
                            stations += `</div>`;
                            stations += `</div>`;
                            stations += `<div class="card-footer">`;
                            stations += `<small class="text-muted">IP-Adresse: ${myObj.data[station].local_ip_address} (${myObj.data[station].external_ip_address})</small>`;
                            stations += `</div>`;
                            stations += `</div>`;
                            stations += `</div>`;
                        }
                    }
                    stations += `</div>`;
                }
                else
                {
                    stations += `<h4>Basisstationen</h4><div class="alert alert-danger" role="alert">Es wurden keine Basisstationen gefunden.</div>`;
                }
                document.getElementById("stations").innerHTML = stations;
                type = "";
            }
            else
            {
                document.getElementById("stations").innerHTML = `<h4>Basisstationen</h4><div class="alert alert-danger" role="alert">Fehler beim Laden der Basisstationen.</div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("stations").innerHTML = `<h4>Basisstationen</h4><div class="alert alert-danger" role="alert">Fehler beim Laden der Basisstationen.</div>`;
        }
        else
        {
            document.getElementById("stations").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Lade verfügbare Basisstationen...</strong></div>`;
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function loadDevices()
{
    var xmlhttp, myObj, object;
    var text = "";
    var cams = "";
    var indoorcams = "";
    var doorbellcams = "";
    var floodlightcams = "";
    var imagepath = "";
    var type = "";
    var lastVideo = "keine Aufnahme";
    var url = `${location.protocol}//${location.hostname}:${port}/getDevices`;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200)
        {
            myObj = JSON.parse(this.responseText);
            if(myObj.success == true)
            {
                if(myObj.data.length > 0)
                {
                    for (object in myObj.data)
                    {
                        if(myObj.data[object].device_type == "camera")
                        {
                            switch (myObj.data[object].model)
                            {
                                case "T8111":
                                    imagepath = `<img src="assets/devices/eufyCamE.png" class="card-img-top" alt="eufyCam">`;
                                    type = "eufyCam";
                                    break;
                                case "T8112":
                                    imagepath = `<img src="assets/devices/eufyCamE.png" class="card-img-top" alt="eufyCam E">`;
                                    type = "eufyCam E";
                                    break;
                                case "T8113":
                                    imagepath = `<img src="assets/devices/eufyCam2c.png" class="card-img-top" alt="eufyCam 2C">`;
                                    type = "eufyCam 2C";
                                    break;
                                case "T8114":
                                    imagepath = `<img src="assets/devices/eufyCam2.png" class="card-img-top" alt="eufyCam 2">`;
                                    type = "eufyCam 2";
                                    break;
                                case "T8140":
                                    imagepath = `<img src="assets/devices/eufyCam2.png" class="card-img-top" alt="eufyCam 2 Pro">`;
                                    type = "eufyCam 2 Pro";
                                    break;
                                case "T8142":
                                    imagepath = `<img src="assets/devices/eufyCam2c.png" class="card-img-top" alt="eufyCam 2C Pro">`;
                                    type = "eufyCam 2C Pro";
                                    break;
                                default:
                                    imagepath = `<img src="assets/devices/eufyCam2.png" class="card-img-top" alt="Kamera">`;
                                    type = "Kamera";
                            }
                            if(myObj.data[object].last_camera_image_time != "" && myObj.data[object].last_camera_image_time != "n/a" && myObj.data[object].last_camera_image_time != "n/d" && myObj.data[object].last_camera_image_time != "0")
                            {
                                lastVideo = `Letzte Aufnahme: ${makeDateTimeString(new Date(parseInt(myObj.data[object].last_camera_image_time)))}`;
                                lastVideo += ` | <a href="${myObj.data[object].last_camera_image_url}">Standbild</a>`;
                            }
                            else if(myObj.data[object].last_camera_image_time == "n/a")
                            {
                                lastVideo = "keine Aufnahme";
                            }
                            else
                            {
                                lastVideo = "letzte Aufnahme nicht verfügbar";
                            }
                            cams += `<div class="col mb-3">`;
                            cams += `<div class="card">`;
                            cams += `<div class="card-header">`;
                            cams += `<div style="text-align:left; float:left;"><h5 class="mb-0">${myObj.data[object].name}</h5></div>`;
                            cams += `<div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0">`;
                            cams += `<i class="${myObj.data[object].wifi_rssi_signal_level == 0 ? "bi-reception-0" : myObj.data[object].wifi_rssi_signal_level == 1 ? "bi-reception-1" : myObj.data[object].wifi_rssi_signal_level == 2 ? "bi-reception-2" : myObj.data[object].wifi_rssi_signal_level == 3 ? "bi-reception-3" : myObj.data[object].wifi_rssi_signal_level == 4 ? "bi-reception-4" : "bi-wifi-off"}" title="WiFi Empfangsstärke: ${myObj.data[object].wifi_rssi}dB"></i>`;
                            cams += `&nbsp;&nbsp;`;
                            cams += `<i class="text-muted bi-gear" title="Einstellungen" onclick="showDeviceSettings('${myObj.data[object].device_id}')"></i>`;
                            cams += `</h5></span></div>`;
                            cams += `</div>`;
                            cams += `<div class="row no-gutters">`;
                            cams += `<div class="col-md-4">${imagepath}</div>`;
                            cams += `<div class="col-md-8">`;
                            cams += `<div class="card-body" style="margin-left: -1rem">`;
                            cams += `<h6 class="card-subtitle mb-2 text-muted">${type}</h6>`;
                            cams += `<p class="card-text">${myObj.data[object].device_id}<br /><span class="text-nowrap"><i class="bi-gear-wide-connected" title="Firmwareversion"></i> ${myObj.data[object].software_version}</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-nowrap"><i class="${myObj.data[object].battery_charging == 1 ? "bi-battery-charging" : myObj.data[object].battery_charge < 16 ? "bi-battery" : myObj.data[object].battery_charge < 50 ? "bi-battery-half" : "bi-battery-full"} ${myObj.data[object].battery_charge < 6 ? "text-danger" : myObj.data[object].battery_charge < 16 ? "text-warning" : ""}" title="Ladezustand des Akkus"></i>&nbsp;${myObj.data[object].battery_charge}%</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-nowrap"><i class="${myObj.data[object].battery_temperature < 0 ? "bi-thermometer-low" : myObj.data[object].battery_temperature < 30 ? "bi-thermometer-half" : "bi-thermometer-high"}" title="Temperatur"></i>&nbsp${myObj.data[object].battery_temperature}&deg;C</span></p>`;
                            cams += `</div>`;
                            cams += `</div>`;
                            cams += `</div>`;
                            cams += `<div class="card-footer">`;
                            cams += `<small class="text-muted">${lastVideo}</small>`;
                            cams += `</div>`;
                            cams += `</div>`;
                            cams += `</div>`;
                        }
                        else if(myObj.data[object].device_type == "indoorcamera")
                        {
                            switch (myObj.data[object].model)
                            {
                                case "T8400":
                                    imagepath = `<img src="assets/devices/eufyFloodLightCam.png" class="card-img-top" alt="Indoor Cam 2K">`;
                                    type = "Indoor Cam 2K";
                                    break;
                                case "T8410":
                                    imagepath = `<img src="assets/devices/eufyFloodLightCam.png" class="card-img-top" alt="Indoor Cam 2K P&T">`;                                        type = "Indoor Cam 2K P&T";
                                    break;
                                default:
                                    imagepath = `<img src="assets/devices/eufyCam2.png" class="card-img-top" alt="Innenkamera">`;
                                    type = "Innenkamera";
                            }
                            if(myObj.data[object].last_camera_image_time != "" && myObj.data[object].last_camera_image_time != "n/a" && myObj.data[object].last_camera_image_time != "n/d" && myObj.data[object].last_camera_image_time != "0")
                            {
                                lastVideo = makeDateTimeString(new Date(parseInt(myObj.data[object].last_camera_image_time)));
                                lastVideo += ` | <a href="${myObj.data[object].last_camera_image_url}">Standbild</a>`;
                            }
                            else if(myObj.data[object].last_camera_image_time == "n/a")
                            {
                                lastVideo = "keine Aufnahme";
                            }
                            else
                            {
                                lastVideo = "letzte Aufnahme nicht verfügbar";
                            }
                            indoorcams += `<div class="col mb-3">`;
                            indoorcams += `<div class="card">`;
                            indoorcams += `<h5 class="card-header">${myObj.data[object].name}</h5>`;
                            indoorcams += `<div class="row no-gutters">`;
                            indoorcams += `<div class="col-md-4">${imagepath}</div>`;
                            indoorcams += `<div class="col-md-8">`;
                            indoorcams += `<div class="card-body" style="margin-left: -1rem">`;
                            indoorcams += `<h6 class="card-subtitle mb-2 text-muted">${type}</h6>`;
                            indoorcams += `<p class="card-text">${myObj.data[object].device_id}<br />SW: ${myObj.data[object].software_version}<br /></p>`;
                            indoorcams += `</div>`;
                            indoorcams += `</div>`;
                            indoorcams += `</div>`;
                            indoorcams += `<div class="card-footer">`;
                            indoorcams += `<small class="text-muted">Letzte Aufnahme: ${lastVideo}</small>`;
                            indoorcams += `</div>`;
                            indoorcams += `</div>`;
                            indoorcams += `</div>`;
                        }
                        else if(myObj.data[object].device_type == "doorbell")
                        {
                            // T8210 > Video Doorbell 2K (battery)
                            // T8200 > Video Doorbell 2K (wired)
                            // T8222 > Video Doorbell 1080p (battery)
                        }
                        else if(myObj.data[object].device_type == "floodlight")
                        {
                            switch (myObj.data[object].model)
                            {
                                case "T8420":
                                    imagepath = `<img src="assets/devices/eufyFloodLightCam.png" class="card-img-top" alt="Floodlight Camera">`;
                                    type = "Floodlight Camera";
                                    break;
                                default:
                                    imagepath = `<img src="assets/devices/eufyCam2.png" class="card-img-top" alt="Flutlichtkamera">`;
                                    type = "Flutlichtkamera";
                            }
                            if(myObj.data[object].last_camera_image_time != "" && myObj.data[object].last_camera_image_time != "n/a" && myObj.data[object].last_camera_image_time != "n/d" && myObj.data[object].last_camera_image_time != "0")
                            {
                                lastVideo = makeDateTimeString(new Date(parseInt(myObj.data[object].last_camera_image_time)));
                                lastVideo += ` | <a href="${myObj.data[object].last_camera_image_url}">Standbild</a>`;
                            }
                            else if(myObj.data[object].last_camera_image_time == "n/a")
                            {
                                lastVideo = "keine Aufnahme";
                            }
                            else
                            {
                                lastVideo = "letzte Aufnahme nicht verfügbar";
                            }
                            floodlightcams += `<div class="col mb-3">`;
                            floodlightcams += `<div class="card">`;
                            floodlightcams += `<h5 class="card-header">${myObj.data[object].name}</h5>`;
                            floodlightcams += `<div class="row no-gutters">`;
                            floodlightcams += `<div class="col-md-4">${imagepath}</div>`;
                            floodlightcams += `<div class="col-md-8">`;
                            floodlightcams += `<div class="card-body" style="margin-left: -1rem">`;
                            floodlightcams += `<h6 class="card-subtitle mb-2 text-muted">${type}</h6>`;
                            floodlightcams += `<p class="card-text">${myObj.data[object].device_id}"<br />SW: ${myObj.data[object].software_version}</p>`;
                            floodlightcams += `</div>`;
                            floodlightcams += `</div>`;
                            floodlightcams += `</div>`;
                            floodlightcams += `<div class="card-footer">`;
                            floodlightcams += `<small class="text-muted">Letzte Aufnahme: ${lastVideo}</small>`;
                            floodlightcams += `</div>`;
                            floodlightcams += `</div>`;
                            floodlightcams += `</div>`;
                        }
                        else if(myObj.data[object].device_type == "lock")
                        {}
                        else if(myObj.data[object].device_type == "keypad")
                        {}
                        else if(myObj.data[object].device_type == "sensor")
                        {}
                    }
                    if(cams != "")
                    {
                        text += `<p id="cameras"><h4>Kameras</h4><div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5">${cams}</div></p>`;
                        type = "";
                    }
                    if(indoorcams != "")
                    {
                        text += `<p id="indoorcameras"><h4>Innenkameras</h4><div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5">${indoorcams}</div></p>`;
                        type="";
                    }
                    if(floodlightcams != "")
                    {
                        text += `<p id="floodlightcameras"><h4>Flutlichtkameras</h4><div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5">${floodlightcams}</div></p>`;
                        type = "";
                    }
                    document.getElementById("devices").innerHTML =  text;
                }
                else
                {
                    document.getElementById("devices").innerHTML = `<h4>Geräte</h4><div class="alert alert-danger" role="alert">Es wurden keine Geräte gefunden.</div>`;
                }
            }
            else
            {
                document.getElementById("devices").innerHTML = `<h4>Geräte</h4><div class="alert alert-danger" role="alert">Fehler beim Laden der Geräte.</div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("devices").innerHTML = `<h4>Geräte</h4><div class="alert alert-danger" role="alert">Fehler beim Laden der Geräte.</div>`;
        }
        else
        {
            document.getElementById("devices").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Lade verfügbare Geräte...</strong></div>`;
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function showDeviceSettings(deviceId)
{
    const myModal = new bootstrap.Modal(document.getElementById('modalNotImplemented'));
    //document.getElementById("btnOKModalNotImplemented").removeAttribute("onClick");
    //document.getElementById("btnOKModalNotImplemented").setAttribute("onClick", `checkCheckField("chkUseHttps")`);
    myModal.show();
}

function showStationSettings(stationId)
{
    const myModal = new bootstrap.Modal(document.getElementById('modalNotImplemented'));
    //document.getElementById("btnOKModalNotImplemented").removeAttribute("onClick");
    //document.getElementById("btnOKModalNotImplemented").setAttribute("onClick", `checkCheckField("chkUseHttps")`);
    myModal.show();
}
//#endregion

/**
 * Scripts for statechange.html
 */
//#region statechange.html
function loadDataStatechange(showLoading)
{
	var xmlHttp, objResp, objIter, stations = "", lastChangeTime;
	var lastChangeTimeAll = -1;
	var imagepath = "";
	var type = "";
	var state = "";
	var buttons = "";
	var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.overrideMimeType('application/json');
	xmlHttp.onreadystatechange = function()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				stations = `<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5">`;
				for (objIter in objResp.data)
				{
					if(objResp.data[objIter].device_type == "station")
					{
						switch (objResp.data[objIter].model)
						{
							case "T8001":
								imagepath = `<img src="assets/devices/eufyHomeBase.png" class="card-img-top" alt="HomeBase">`;
								type="HomeBase";
								break;
							case "T8002":
								imagepath = `<img src="assets/devices/eufyHomeBase.png" class="card-img-top" alt="HomeBase E">`;
								type="HomeBase E";
								break;
							case "T8010":
								imagepath = `<img src="assets/devices/eufyHomeBase2.png" class="card-img-top" alt="HomeBase 2">`;
								type="HomeBase 2";
								break;
							default:
								imagepath = `<img src="assets/devices/eufyHomeBase2.png" class="card-img-top" alt="HomeBase">`;
								type="HomeBase";
						}
						switch (objResp.data[objIter].guard_mode)
						{
                            case "0":
								state = "abwesend";
								buttons =  `<button id="btnArm${objResp.data[objIter].station_id}" type="button" class="btn btn-sm btn-primary mb-2 me-3" disabled>abwesend</button>`;
								buttons += `<button id="btnHome${objResp.data[objIter].station_id}" onclick="setHome('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">zu Hause</button>`;
								buttons += `<button id="btnSchedule${objResp.data[objIter].station_id}" onclick="setSchedule('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">Zeitsteuerung</button>`;
								buttons += `<button id="btnDisarm${objResp.data[objIter].station_id}" onclick="setDisarm('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary my-2">deaktiviert</button>`;
								break;
							case "1":
								state = "zu Hause";
								buttons =  `<button id="btnArm${objResp.data[objIter].station_id}" onclick="setArm('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">abwesend</button>`;
								buttons += `<button id="btnHome${objResp.data[objIter].station_id}" type="button" class="btn btn-sm btn-primary mb-2 me-3" disabled>zu Hause</button>`;
								buttons += `<button id="btnSchedule${objResp.data[objIter].station_id}" onclick="setSchedule('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">Zeitsteuerung</button>`;
								buttons += `<button id="btnDisarm${objResp.data[objIter].station_id}" onclick="setDisarm('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary my-2">deaktiviert</button>`;
								break;
							case "2":
								state = "Zeitsteuerung";
								buttons =  `<button id="btnArm${objResp.data[objIter].station_id}" onclick="setArm('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">abwesend</button>`;
								buttons += `<button id="btnHome${objResp.data[objIter].station_id}" onclick="setHome('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">zu Hause</button>`;
								buttons += `<button id="btnSchedule${objResp.data[objIter].station_id}" type="button" class="btn btn-sm btn-primary mb-2 me-3" disabled>Zeitsteuerung</button>`;
								buttons += `<button id="btnDisarm${objResp.data[objIter].station_id}" onclick="setDisarm('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary my-2">deaktiviert</button>`;
								break;
							case "63":
								state = "deaktiviert";
								buttons =  `<button id="btnArm${objResp.data[objIter].station_id}" onclick="setArm('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">abwesend</button>`;
								buttons += `<button id="btnHome${objResp.data[objIter].station_id}" onclick="setHome('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">zu Hause</button>`;
								buttons += `<button id="btnSchedule${objResp.data[objIter].station_id}" onclick="setSchedule('${objResp.data[objIter].station_id}')" type="button" class="btn btn-sm btn-primary mb-2 me-3">Zeitsteuerung</button>`;
								buttons += `<button id="btnDisarm${objResp.data[objIter].station_id}" type="button" class="btn btn-sm btn-primary mb-2" disabled>deaktiviert</button>`;
								break;
							default:
								state="unbekannt";
						}
						stations += `<div class="col">`;
						stations += `<div class="card mb-3">`;
						stations += `<h5 class="card-header">${objResp.data[objIter].name}</h5>`;
						stations += `<div class="row no-gutters">`;
						stations += `<div class="col-md-4">${imagepath}</div>`;
						stations += `<div class="col-md-8">`;
						stations += `<div class="card-body" style="margin-left: -1rem">`;
						stations += `<h6 class="card-subtitle mb-2 text-muted">${type}</h6>`;
						stations += `<p class="card-text">${objResp.data[objIter].station_id}<br /><span class="text-nowrap"><i class="bi-shield" title="aktueller Status"></i>&nbsp;<span id="state_${objResp.data[objIter].station_id}">${state}</span></span></p>`;
						stations += `</div>`;
						stations += `</div>`;
						stations += `</div>`;
						//stations += `<div class="row no-gutters">`;
						stations += `<div class="card-body">${buttons}</div>`;
						//stations += `</div>`;
						if(objResp.data[objIter].guard_mode_last_change_time != "" && objResp.data[objIter].guard_mode_last_change_time != "n/a" && objResp.data[objIter].guard_mode_last_change_time != "n/d" && objResp.data[objIter].guard_mode_last_change_time != "undefined")
						{
							lastChangeTime = makeDateTimeString(new Date(parseInt(objResp.data[objIter].guard_mode_last_change_time)));
							if(parseInt(objResp.data[objIter].guard_mode_last_change_time) > lastChangeTimeAll)
							{
								lastChangeTimeAll = parseInt(objResp.data[objIter].guard_mode_last_change_time);
							}
						}
						else if(myObj.data[object].last_camera_image_time == "n/a")
						{
							lastChangeTime = "letzter Statuswechsel unbekannt";
						}
						else
						{
							lastChangeTime = "letzter Statuswechsel nicht verfügbar";
						}

                        stations += `<div class="card-footer"><small class="text-muted">Letzer Statuswechsel: ${lastChangeTime}</small></div>`;
						stations += `</div>`;
						stations += `</div>`;
                    }
				}
				document.getElementById("btnArmAll").removeAttribute("disabled");
				document.getElementById("btnHomeAll").removeAttribute("disabled");
				document.getElementById("btnScheduleAll").removeAttribute("disabled");
				document.getElementById("btnDisarmAll").removeAttribute("disabled");
				document.getElementById("stations").innerHTML = stations;
				if(lastChangeTimeAll == -1)
				{
					lastChangeTimeAll = "unbekannt";
				}
				else
				{
					lastChangeTimeAll = makeDateTimeString(new Date(lastChangeTimeAll))
				}
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">Letzer Statuswechsel: ${lastChangeTimeAll}</small>`;
				type = "";
			}
			else
			{
				document.getElementById("btnArmAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">Letzer Statuswechsel: unbekannt</small>`;
				document.getElementById("stations").innerHTML = `<div class="alert alert-danger" role="alert">Fehler beim Laden der Basisstationen.</div>`;
			}
		}
		else if (this.readyState == 4)
		{
			document.getElementById("btnArmAll").setAttribute("disabled", true);
			document.getElementById("btnHomeAll").setAttribute("disabled", true);
			document.getElementById("btnScheduleAll").setAttribute("disabled", true);
			document.getElementById("btnDisarmAll").setAttribute("disabled", true);
			document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">Letzer Statuswechsel: unbekannt</small>`;
			document.getElementById("stations").innerHTML = `<div class="alert alert-danger" role="alert">Fehler beim Laden der Basisstationen.</div>`;
		}
		else
		{
			if(showLoading==true)
			{
				document.getElementById("btnArmAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">Letzer Statuswechsel: wird geladen...</small>`;
				document.getElementById("stations").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Lade verfügbare Basisstationen...</strong></div>`;
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState == 4)
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState == 4)
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState == 4)
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState == 4)
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
            if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState == 4)
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState == 4)
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState != 4)
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
			if (this.readyState == 4 && this.status == 200)
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
			else if (this.readyState != 4)
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
        if (form.checkValidity() === false)
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
    var xmlHttp, objResp, objIter, stations = "";
    var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    for (objIter in objResp.data)
                    {
                        stations += `<div class="form-label-group was-validated" class="container-fluid"><label class="mt-2" for="txtUdpPortsStation${objResp.data[objIter].station_id}">UDP Port für Verbindung mit der Basisstation ${objResp.data[objIter].station_id} (${objResp.data[objIter].name}).</label>`;
                        stations += `<input type="text" name="udpPortsStation${objResp.data[objIter].station_id}" id="txtUdpPortsStation${objResp.data[objIter].station_id}" class="form-control" placeholder="UDP Port ${objResp.data[objIter].station_id}" onfocusout="checkUDPPorts(udpPortsStation${objResp.data[objIter].station_id})" required>`;
                        stations += `<small class="form-text text-muted">Der angegebene Port darf nicht in Verwendung und keiner anderen Basisstation zugeordnet sein.</small>`;
                        stations += `<div class="invalid-feedback">Bitte geben Sie eine Zahl zwischen 1 und 65535 ein. Diese Zahl darf keiner anderen Basisstation zugeordnet sein.</div></div>`;
                    }
                    document.getElementById('chkUseUdpStaticPorts').removeAttribute("disabled");
                    document.getElementById("useUDPStaticPortsStations").innerHTML = stations;
                    loadDataSettings();
                }
                else
                {
                    document.getElementById("useUDPStaticPortsStations").innerHTML = `<div class="alert alert-danger mt-2" role="alert">Fehler bei der Ermittlung der Basisstationen.</div>`;
                    document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
                    loadDataSettings();
                }
            }
            catch (e)
            {
                document.getElementById("useUDPStaticPortsStations").innerHTML = `<div class="alert alert-danger mt-2" role="alert">Fehler bei der Ermittlung der Basisstationen.</div>`;
                document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
                loadDataSettings();
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("useUDPStaticPortsStations").innerHTML = `<div class="alert alert-danger mt-2" role="alert">Fehler bei der Ermittlung der Basisstationen.</div>`;
            document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
            loadDataSettings();
        }
        else
        {
            document.getElementById("resultLoading").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Einstellungen...</strong></div>`;
            document.getElementById("useUDPStaticPortsStations").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Basisstationen...</strong></div>`;
            document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function loadDataSettings()
{
    var xmlHttp, objResp, objIter, username, password, accountcountry, accountlanguage, apiusehttp, apiporthttp, apiusehttps, apiporthttps, apikeyhttps, apicerthttps, apiconnectiontype, apiuseudplocalstaticports, apiudpports, apiusesystemvariables, apicameradefaultimage, apicameradefaultvideo, apiuseupdatestateevent, apiuseupdatestateintervall, apiupdatestatetimespan, apiuseupdatelinks, apiuseupdatelinksonlywhenactive, apiupdatelinkstimespan, apiusepushservice, apiloglevel;
    var url = `${location.protocol}//${location.hostname}:${port}/getConfig`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    for (objIter in objResp.data)
                    {
                        username = objResp.data[objIter].username;
                        password = objResp.data[objIter].password;
                        accountcountry = objResp.data[objIter].country;
                        accountlanguage = objResp.data[objIter].language;
                        apiusehttp = objResp.data[objIter].api_http_active;
                        apiporthttp = objResp.data[objIter].api_http_port;
                        apiusehttps = objResp.data[objIter].api_https_active;
                        apiporthttps = objResp.data[objIter].api_https_port;
                        apikeyhttps = objResp.data[objIter].api_https_key_file;
                        apicerthttps = objResp.data[objIter].api_https_cert_file;
                        apiconnectiontype = objResp.data[objIter].api_connection_type;
                        apiuseudplocalstaticports = objResp.data[objIter].api_udp_local_static_ports_active;
                        apiudpports = objResp.data[objIter].api_udp_local_static_ports;
                        apiusesystemvariables = objResp.data[objIter].api_use_system_variables;
                        apicameradefaultimage = objResp.data[objIter].api_camera_default_image;
                        apicameradefaultvideo = objResp.data[objIter].api_camera_default_video;
                        apiuseupdatestateevent = objResp.data[objIter].api_use_update_state_event;
                        apiuseupdatestateintervall = objResp.data[objIter].api_use_update_state_intervall;
                        apiupdatestatetimespan = objResp.data[objIter].api_update_state_timespan;
                        apiuseupdatelinks = objResp.data[objIter].api_use_update_links;
                        apiuseupdatelinksonlywhenactive =objResp.data[objIter].api_use_update_links_only_when_active;
                        apiupdatelinkstimespan = objResp.data[objIter].api_update_links_timespan;
                        apiusepushservice = objResp.data[objIter].api_use_pushservice;
                        apiloglevel = objResp.data[objIter].api_log_level;
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
                    for (var i=0, m=element.length; i<m; i++)
                    {
                        if(element[i].name.startsWith("udpPortsStation"))
                        {
                            var tempSerial = element[i].name.replace("udpPortsStation", "");
                            var tempPorts = objResp.data[objIter]["api_udp_local_static_ports_" + tempSerial];
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
                    document.getElementById("resultLoading").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei der Ermittlung der Einstellungen.<br /><small class="form-text text-muted">Rückgabewert 'success' ist 'false'.</small></div>`;
                }
            }
            catch (e)
            {
                document.getElementById("resultLoading").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei der Ermittlung der Einstellungen.<br /><small class="form-text text-muted">${e}</small></div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("resultLoading").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei der Ermittlung der Einstellungen.<br /><small class="form-text text-muted">Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.</small></div>`;
        }
        else
        {
            document.getElementById("resultLoading").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Einstellungen...</strong></div>`;
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function loadSystemVariables()
{
    var xmlHttp, objResp, objIter, sysVarName, sysVarInfo, sysVarAvailable, sysVarHint, sysVarTable = "";
    var url = `${location.protocol}//${location.hostname}:${port}/checkSystemVariables`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    xmlHttp.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    sysVarHint  = `<div class="alert alert-primary fade show" role="alert">Die Option 'Systemvariablen bei API Aktionen automatisch aktualisieren' ist aktiviert. Somit aktualisiert das AddOn die entsprechenden Systemvariablen. In der folgenden Tabelle finden Sie alle Systemvariablen, die dieses AddOn auf der CCU benötigt. Wenn die jeweilige Zeile grün ist, ist die Systemvariable auf der CCU bereits angelegt, ansonsten ist die Zeile rot.<br />`;
                    sysVarHint += `<small class="form-text text-muted">Bitte achten Sie darauf, dass alle Systemvariablen angelegt sind. Wenn Sie die Aktualisierung der Systemvariablen nicht wünschen, deaktivieren Sie bitte die Option 'Systemvariablen bei API Aktionen automatisch aktualisieren'.</small>`;
                    sysVarHint += `</div>`;
                    document.getElementById("divSystemVariablesHint").innerHTML = sysVarHint;
                    sysVarTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col">Status</th><th scope="col">Name der Systemvariable</th><th scope="col"></th></tr></thead><tbody>`;
                    for (objIter in objResp.data)
                    {
                        sysVarName = objResp.data[objIter].sysVar_name;
                        sysVarInfo = objResp.data[objIter].sysVar_info;
                        sysVarAvailable = objResp.data[objIter].sysVar_available;
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
                        document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-info mb-0" role="alert">Die Aktualisierung von Systemvariablen bei API Aktionen ist deaktiviert.</div>`;
                    }
                    else
                    {
                        document.getElementById("divSystemVariablesHint").innerHTML = "";
                        document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-danger mb-0" role="alert">Fehler bei der Ermittlung der Systemvariablen.<br /><small class="form-text text-muted">Es ist folgender Fehler ist aufgetreten: '${objResp.reason}'</small></div>`;
                    }
                }
            }
            catch (e)
            {
                document.getElementById("divSystemVariablesHint").innerHTML = "";
                document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-danger mb-0" role="alert">Fehler bei der Ermittlung der Systemvariablen.</div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-danger mb-0" role="alert">Fehler bei der Ermittlung der Systemvariablen.</div>`;
        }
        else
        {
            document.getElementById("divSystemVariables").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Systemvariablen...</strong></div>`;
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
        if (this.readyState == 4 && this.status == 200)
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
                document.getElementById("resultMessage").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei dem Speichern der Einstellungen.<br /><small class="form-text text-muted">${e}</small></div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("resultMessage").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei dem Speichern der Einstellungen.<br /><small class="form-text text-muted">Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.</small></div>`;
        }
        else
        {
            document.getElementById("resultMessage").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Einstellungen werden gespeichert...</strong></div>`;
        }
    };
    xmlHttp.open("POST", url);
    xmlHttp.send(obfFD);
}

function createSysVar(varName, varInfo)
{
    var xmlHttp, objResp, text = "";
    var url = `${location.protocol}//${location.hostname}:${port}/createSystemVariable/${varName}/${varInfo}`;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType('application/json');
    text = `<table class="table"><thead><tr><th scope="col">Status</th><th scope="col">Name der Systemvariable</th><th scope="col"></th></tr></thead><tbody>`;
    xmlHttp.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200)
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
                    document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei der Ermittlung der Systemvariablen.</div>`;
                }
            }
            catch (e)
            {
                document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei der Ermittlung der Systemvariablen.</div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("divSystemVariables").innerHTML = `<div class="alert alert-danger" role="alert">Fehler bei der Ermittlung der Systemvariablen.</div>`;
        }
        else
        {
            document.getElementById("divSystemVariables").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Systemvariablen...</strong></div>`;
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
        if (this.readyState == 4 && this.status == 200)
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
        else if (this.readyState == 4)
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
        if (this.readyState == 4 && this.status == 200)
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
        else if (this.readyState == 4)
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
                for (var i=0, m=element.length; i<m; i++)
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
                for (var i=0, m=element.length; i<m; i++)
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
    for (var i=0, m=element.length; i<m; i++)
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
        for(var i=0, m=element.length; i<m; i++)
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
    var xmlHttp;
    var url;
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
        if (this.readyState == 4 && this.status == 200)
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
        else if (this.readyState == 4)
        {
            switch(logfiletype)
            {
                case "log":
                    document.getElementById("log").innerHTML = `<div class="alert alert-danger" role="alert">Fehler beim Laden der Protokolldatei.</div>`;
                    break;
                case "err":
                    document.getElementById("err").innerHTML = `<div class="alert alert-danger" role="alert">Fehler beim Laden der Fehlerprotokolldatei.</div>`;
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
                        document.getElementById("log").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Lade Protokolldatei...</strong></div>`;
                        break;
                    case "err":
                        document.getElementById("err").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Lade Fehlerprotokolldatei...</strong></div>`;
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
    var xmlhttp, myObj;
    var url;
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
        if (this.readyState == 4 && this.status == 200)
        {
            myObj = JSON.parse(this.responseText);
            if(myObj.success == true)
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
        else if (this.readyState == 4)
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
        if (this.readyState == 4 && this.status == 200)
        {
            objResp = JSON.parse(this.responseText);
            if(objResp.success == true)
            {
                info = `eufy Security AddOn: ${objResp.api_version}<br />eufy Security Client: ${objResp.eufy_security_client_version}<br />HomeMatic API: ${objResp.homematic_api_version}<br />Webseite: 1.6.2`;
                document.getElementById("versionInfo").innerHTML = info;
            }
            else
            {
                document.getElementById("versionInfo").innerHTML = `<div class="alert alert-danger" role="alert">Fehler beim Laden der Versionsinformationen.</div>`;
            }
        }
        else if (this.readyState == 4)
        {
            document.getElementById("versionInfo").innerHTML = `<div class="alert alert-danger" role="alert">Fehler beim Laden der Versionsinformationen.</div>`;
        }
        else
        {
            if(showLoading == true)
            {
                document.getElementById("versionInfo").innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Lade verfügbare Versionsinformationen...</strong></div>`;
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
        if (this.readyState == 4 && this.status == 200)
        {
            try
            {
                objResp = JSON.parse(this.responseText);
                if(objResp.success == true)
                {
                    //console.log(`Resp: ${objResp.message} | cntStart: ${cntStart} | cntInit: ${cntInit} | postInit: ${postInit}`);
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
                            //return;
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
                            //return;
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
                        //return;
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
                    //console.log(`Resp: ${objResp.message} | cntStart: ${cntStart} | cntInit: ${cntInit} | postInit: ${postInit}`);
                    if(cntStart < 20)
                    {
                        cntStart = cntStart + 1;
                        await delay(1000);
                        checkServiceState(cntStart, cntInit, postInit);
                        //return;
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
                    //return;
                }
                else
                {
                    alert("Maximum cntStart reached (pos3).");
                }
            }
        }
        else if (this.readyState == 4)
        {
            //console.log(`ReadyState: ${this.readyState} | status: ${this.status} | cntStart: ${cntStart} | cntInit: ${cntInit} | postInit: ${postInit}`);
            if(cntStart < 20)
            {
                cntStart = cntStart + 1;
                await delay(2000);
                checkServiceState(cntStart, cntInit, postInit);
                //return;
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