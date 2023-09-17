/**
 * Javascript for eufySecurity Addon
 * 20230907
 */
action = "";
port = "";
redirectTarget = "";
version = "2.2.2";

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
		
		if(getParameterFromURLSearchParams(urlParams, "action"))
		{
			action = getParameterFromURLSearchParams(urlParams, "action");
		}
		else
		{
			action = "";
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
	document.getElementById("lnkMain").setAttribute("href", document.getElementById("lnkMain").getAttribute("href") + `?sid=${sessionID}`);
	document.getElementById("lnkHome").setAttribute("href", document.getElementById("lnkHome").getAttribute("href") + `?sid=${sessionID}`);
	document.getElementById("lnkDevices").setAttribute("href", document.getElementById("lnkDevices").getAttribute("href") + `?sid=${sessionID}`);
	document.getElementById("lnkStatechange").setAttribute("href", document.getElementById("lnkStatechange").getAttribute("href") + `?sid=${sessionID}`);
	document.getElementById("lnkSettings").setAttribute("href", document.getElementById("lnkSettings").getAttribute("href") + `?sid=${sessionID}`);
	document.getElementById("lnkLogfiles").setAttribute("href", document.getElementById("lnkLogfiles").getAttribute("href") + `?sid=${sessionID}`);
	document.getElementById("lnkInfo").setAttribute("href", document.getElementById("lnkInfo").getAttribute("href") + `?sid=${sessionID}`);
}

function getAPIPort(page)
{
	var url = `${location.protocol}//${location.hostname}/addons/eufySecurity/apiPorts.json`;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			try
			{
				objResp = JSON.parse(this.responseText);
				if(location.protocol == "http:")
				{
					if(objResp.useHttp == true && objResp.httpPort !== undefined)
					{
						port = objResp.httpPort;
						document.getElementById("loadApiSettingsError").innerHTML = "";
						initContent(page);
						return;
					}
				}
				else
				{
					if(objResp.useHttps == true && objResp.httpsPort !== undefined)
					{
						port = objResp.httpsPort;
						document.getElementById("loadApiSettingsError").innerHTML = "";
						initContent(page);
						return;
					}
				}
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", `Der Aufruf der API über ${location.protocol.replace(":", "")} ist deaktiviert`, "", `Bitte nutzen Sie zum Aufruf der Addon-Webseite eine ${location.protocol == "http:" ? "https-" : "http-"}Verbindung.`);
			}
			catch (e)
			{
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", "Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.", "Bitte überprüfen Sie die Datei apiPorts.json im Webseitenverzeichnisses dieses AddOns.", `Es ist folgender Fehler aufgetreten: ${e}`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", "Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.", "Bitte überprüfen Sie die Datei apiPorts.json im Webseitenverzeichnisses dieses AddOns.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function initContent(page)
{
	if(page != "restartWaiter")
	{
		checkCaptchaState(page);
	}
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
			loadCountries();
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

function checkCaptchaState(page)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getCaptchaState`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				if(objResp.captchaNeeded == true)
				{
					generateCaptchaCodeModal(page);
				}
			}
			else
			{
				document.getElementById("captchaMessage").innerHTML = `${createMessageContainer("alert alert-danger", "Fehler beim Laden des Captcha Status.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`)}`;
			}
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function generateCaptchaCodeModal(page)
{
	generateContentCaptchaCodeModal();

	const myModal = new bootstrap.Modal(document.getElementById('modalCaptchaCode'));
	myModal.show();

	getCaptchaImage(page);
}

function generateContentCaptchaCodeModal()
{
	var captchaCodeModal = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalCaptchaCodeTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">Anmeldung benötigt Captcha</h5></div>
							</div>
							<div class="modal-body placeholder-glow" id="divModalCaptchaCodeContent">
								<h5 id="captchaHint"></h5>
								<div class="my-3" id="captchaImage"></div>
								<div class="my-3" id="captchaCode"></div>
								<div class="mt-3" id="captchaButton"></div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalCaptchaCode").innerHTML = captchaCodeModal;
}

function getCaptchaImage(page)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getCaptchaState`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				if(objResp.captchaNeeded == true)
				{
					document.getElementById("captchaHint").innerHTML = `Bitte geben Sie in das Textfeld den String aus dem Captcha ein.`;
					document.getElementById("captchaImage").innerHTML = `<label class="my-2" for="txtCaptchaCode">Captcha.</label><br /><img src="${objResp.captcha.captcha}" alt="Captcha Image">`;
					document.getElementById("captchaCode").innerHTML = `<label class="my-2" for="txtCaptchaCode">Zeichenfolge, die in dem Captcha dargestellt wird.</label><input type="text" class="form-control" id="txtCaptchaCode">`;
					document.getElementById("captchaButton").innerHTML = `<input id="btnSubmitCaptcha" onclick="setCaptchaCode('${page}')" class="btn btn-primary" type="button" value="Login fortsetzen">`;
					document.getElementById("btnCloseModalDeviceSettingsBottom").setAttribute("disabled", true);
				}
				else
				{
					document.getElementById("captchaHint").innerHTML = `Derzeit ist kein Captcha für den Account hinterlegt.`;
					document.getElementById("btnCloseModalDeviceSettingsBottom").removeAttribute("disabled");
				}
			}
			else
			{
				document.getElementById("captchaHint").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden des Captcha Status.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`)}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("captchaHint").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden des Captcha Status.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`)}`;
		}
		else
		{
			document.getElementById("captchaHint").innerHTML = createWaitMessage("Ermittle Captcha Status...");
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function setCaptchaCode(page)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/setCaptchaCode/${document.getElementById("txtCaptchaCode").value}`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?action=captcha&redirect=${page}.html`;
			}
			else
			{
				//document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`)}`;
			}
		}
		else if(this.readyState == 4)
		{
			//document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`)}`;
		}
		else
		{
			//document.getElementById("stations").innerHTML = createWaitMessage("Lade verfügbare Stationen...");
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
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
	switch(guardMode)
	{
		case 0:
			return "abwesend";
		case 1:
			return "zu Hause";
		case 2:
			return "Zeitplan";
		case 3:
			return "Benutzerdefiniert 1";
		case 4:
			return "Benutzerdefiniert 2";
		case 5:
			return "Benutzerdefiniert 3";
		case 6:
			return "ausgeschaltet";
		case 47:
			return "Geofencing";
		case 63:
			return "deaktiviert";
		default:
			return "unbekannt";
	}
}

function getWifiSignalLevelIcon(wifiSignalLevel, wifiRssi)
{
	if(wifiSignalLevel !== undefined)
	{
		return wifiSignalLevel == 0 ? "bi-reception-0" : wifiSignalLevel == 1 ? "bi-reception-1" : wifiSignalLevel == 2 ? "bi-reception-2" : wifiSignalLevel == 3 ? "bi-reception-3" : wifiSignalLevel == 4 ? "bi-reception-4" : "bi-wifi-off";
	}
	else
	{
		return wifiRssi >= 0 ? "bi-reception-0" : wifiRssi >=-64 ? "bi-reception-1" : wifiRssi >=-75 ? "bi-reception-2" : wifiSignalLevel >=-85 ? "bi-reception-3" : wifiSignalLevel == 4 ? "bi-reception-4" : "bi-wifi-off";
	}
}

function createCardStation(station, showSettingsIcon, cardBodyText, cardFooterText)
{
	var card = "";

	card += `<div class="col"><div class="card">`;
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${station.name}</h5></div>`;
	card += `${showSettingsIcon == true ? `<div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0">${station.isP2PConnected === false ? `<i class="bi-exclamation-triangle" title="Es besteht keine P2P-Verbindung zu diesem Gerät."></i>&nbsp;&nbsp;` : ""}<i class="bi-gear" title="Einstellungen" onclick="generateStationSettingsModal('${station.serialNumber}')"></i></h5></span></div>` : ""}`;
	card += `</div>`;
	
	card += `<div class="card-body p-0"><div class="row g-0">`;
	card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${station.modelName} (${station.model})</div></div>`;
	card += `<div class="col-md-8 p-3">`;
	card += `${cardBodyText}`;
	card += `</div></div>`;
	
	card += `<div class="card-footer">${cardFooterText}</div>`;
	card += `</div></div>`;

	return card;
}

function createStationTypeCardsContainer(firendlyTypeName, rowConfig, cards)
{
	if(cards != "")
	{
		return `<p id="stationParagraph"><h4>${firendlyTypeName}</h4><div class="${rowConfig}">${cards}</div></p>`;
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

function createMessageContainer(classText, messageHeader, messageText, messageSubText)
{
	return `<div class="${classText}" role="alert">${messageHeader != "" ? `<h5 class="mb-1 alert-heading">${messageHeader}</h5>` : ""}${messageText != "" ? `<p class="mb-0">${messageText}</p>` : ""}${messageSubText != "" ? `<hr><p class="my-0 form-text text-muted">${messageSubText}</p>` : ""}</div>`;
}
//#endregion

/**
 * Scripts for devices.html
 */
//#region devices.html
 function loadStations()
 {
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
							stations += createCardStation(objResp.data[station], true, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0">${generateColumnForProperty("col mb-0 pe-1", "spnFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", "Firmwareversion", objResp.data[station].softwareVersion)}${generateColumnForProperty("col mb-0 pe-1", "spnCurrentGuardMode", "text-nowrap", "", "", "bi-shield", "aktueller Status", `${objResp.data[station].privacyMode === undefined || objResp.data[station].privacyMode == false ? getGuardModeAsString(objResp.data[station].guardMode) : "privatsphäre"}`)}</div>`, `<small class="text-muted">IP-Adresse: ${objResp.data[station].lanIpAddress} (${objResp.data[station].wanIpAddress})</small></div>`);
						}
					}
					text += createStationTypeCardsContainer("Stationen", "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3", stations);
					document.getElementById("stations").innerHTML =  text;
				}
				else
				{
					document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-primary", "Es wurden keine Stationen gefunden.", "Es wurden keine vefügbaren Stationen gefunden.", "Überprüfen Sie, ob Sie dem Account Stationen freigegeben haben beziehungsweise ob Sie das Haus für den Account freigegeben haben und ob Sie das korrekte Haus in den Einstellungen freigegeben haben.")}`;
				}
			}
			else
			{
				document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`)}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("stations").innerHTML = `<h4>Stationen</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Station.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`)}`;
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
	var text = "", cams = "", indoorcams = "", solocams = "", starlight4glte = "", doorbellcams = "", outdoorlights = "", locks = "", keypads = "", sensors = "", unknown = "";
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
							case "garagecamera":
								indoorcams += createCardDevice(objResp.data[device]);
								break;
							case "solocamera":
								solocams += createCardDevice(objResp.data[device]);
								break;
							case "starlight4glte":
								starlight4glte += createCardDevice(objResp.data[device]);
								break;
							case "doorbell":
								doorbellcams += createCardDevice(objResp.data[device]);
								break;
							case "floodlight":
							case "walllightcamera":
								outdoorlights += createCardDevice(objResp.data[device]);
								break;
							case "lock":
								locks += createCardDevice(objResp.data[device]);
								break;
							case "keypad":
								keypads += createCardDevice(objResp.data[device]);
								break;
							case "sensor":
								sensors += createCardDevice(objResp.data[device]);
								break;
							default:
								unknown += createCardDevice(objResp.data[device]);
						}
					}
					text += createDeviceTypeCardsContainer("cameras", "Kameras", cams);
					text += createDeviceTypeCardsContainer("indoorcameras", "Innenkameras", indoorcams);
					text += createDeviceTypeCardsContainer("solocameras", "Solokameras", solocams);
					text += createDeviceTypeCardsContainer("starlight4glte", "4G LTE Kameras", solocams);
					text += createDeviceTypeCardsContainer("doorbellcameras", "Videotürklingel", doorbellcams);
					text += createDeviceTypeCardsContainer("outdoorlights", "Außenleuchten mit Kamera", outdoorlights);
					text += createDeviceTypeCardsContainer("locks", "Schlösser", locks);
					text += createDeviceTypeCardsContainer("keypads", "Keypads", keypads);
					text += createDeviceTypeCardsContainer("sensors", "Sensoren", sensors);
					text += createDeviceTypeCardsContainer("unknown", "unbekannte Geräte", unknown);
					document.getElementById("devices").innerHTML =  text;
				}
				else
				{
					document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-primary", "Es wurden keine Geräte gefunden.", "Es wurden keine vefügbaren Geräte gefunden.", "Überprüfen Sie, ob Sie dem Account Geräte freigegeben haben beziehungsweise ob Sie das Haus für den Account freigegeben haben und ob Sie das korrekte Haus in den Einstellungen freigegeben haben.")}`;
				}
			}
			else
			{
				document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Geräte.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`)}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden der Geräte.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`)}`;
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
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${device.name}</h5></div><div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0">${device.isStationP2PConnected === false ? `<i class="bi-exclamation-triangle" title="Es besteht keine P2P-Verbindung zu diesem Gerät."></i>&nbsp;&nbsp;` : ""}${device.state === 2 ? `<i class="bi-exclamation-triangle" title="Dieses Gerät wurde auf Grund des niedrigen Akkuladestandes deaktiviert."></i>&nbsp;&nbsp;` : ""}${device.wifiSignalLevel === undefined || device.wifiRssi === undefined ? "" : `<i class="${getWifiSignalLevelIcon(device.wifiSignalLevel, device.wifiRssi)}" title="WiFi Empfangsstärke: ${device.wifiRssi}dB"></i>&nbsp;&nbsp;`}<i class="bi-gear" title="Einstellungen" onclick="${device.serialNumber == device.stationSerialNumber ? `generateStationDeviceSettingsSelectionModal('${device.serialNumber}','${device.name}')` : `generateDeviceSettingsModal('${device.serialNumber}')`}"></i></h5></span></div></div>`;

	card += `<div class="card-body p-0"><div class="row g-0">`;
	card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${device.modelName} (${device.model})</div></div>`;
	card += `<div class="col-md-8 p-3">`;

	card += `<h6 class="card-subtitle mb-2 text-muted">${device.modelName}</h6>`;
	card += `<p class="card-text mb-1">${device.serialNumber}</p>`;
	card += `<div class="row g-0">`;
	if(device.softwareVersion !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnDeviceFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", "Firmwareversion", device.softwareVersion);
	}
	if(device.battery !== undefined || device.batteryLow !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnBattery", "text-nowrap", "", "", device.chargingStatus === 1 || device.chargingStatus === 4 ? "bi-battery-charging" : "bi-battery", "Ladezustand des Akkus", device.battery !== undefined ? device.battery : device.batteryLow, device.battery !== undefined ? "%" : "");
	}
	if(device.batteryTemperature !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnBatteryTemperature", "text-nowrap", "", "", "bi-thermometer-low", "Temperatur", device.state === 2 ? `---` : device.batteryTemperature, "&deg;C");
	}
	if(device.sensorOpen !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnSensorState", "text-nowrap", "", "", device.sensorOpen === true ? "bi-door-open" : "bi-door-closed", "Status", device.sensorOpen === true ? `offen` : `zu`, "");
	}
	card += `</div>`;
	card += `</div></div></div>`;
	card += `<div class="card-footer"><small class="text-muted">${getDeviceLastEventTime(device)}</small></div>`;
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

function getDeviceLastEventTime(device)
{
	if(device.type === 2)
	{
		if(device.sensorChangeTime !== undefined)
		{
			return `letzte Änderung: ${makeDateTimeString(new Date(parseInt(device.sensorChangeTime)))}`;
		}
		else
		{
			return `letzte Änderung: nicht verfügbar`;
		}
	}
	else
	{
		if(device.pictureTime !== undefined && device.pictureTime != "" && device.pictureTime != "n/a" && device.pictureTime != "n/d" && device.pictureTime != "0")
		{
			return `letzte Aufnahme: ${makeDateTimeString(new Date(parseInt(device.pictureTime)))} | <a href="javascript:generateDeviceImageModal('${device.serialNumber}','${device.name}');">Standbild</a>`;
		}
		else if(device.pictureTime === undefined || device.pictureTime == "n/a")
		{
			return "keine Aufnahme verfügbar";
		}
		else
		{
			return "letzte Aufnahme: nicht verfügbar";
		}
	}
}

function generateColumnForProperty(divClass, spanName, spanClass, displayFormatStart, displayFormatEnd, imageName, title, value, unit)
{
	if(value === undefined)
	{
		return "";
	}
	switch (imageName)
	{
		case "bi-battery":
			if(value === true)
			{
				imageName = imageName + " text-danger";
				break;
			}
			if(value === false)
			{
				imageName = "bi-battery-full";
				break;
			}
			if(value < 20)
			{
				imageName = "bi-battery";
			}
			else if(value < 55)
			{
				imageName = "bi-battery-half";
			}
			else
			{
				imageName = "bi-battery-full";
			}
			if(value < 6)
			{
				imageName = imageName + " text-danger";
				break;
			}
			else if(value < 16)
			{
				imageName = imageName + " text-warning";
			}
			break;
		case "bi-thermometer-low":
			if(value < -49 || value > 99)
			{
				return "";
			}
			if(value < 0)
			{
				imageName = "bi-thermometer-low";
			}
			else if(value < 30)
			{
				imageName = "bi-thermometer-half";
			}
			else
			{
				imageName = "bi-thermometer-high";
			}
			break;
	}
	return `<div class="${divClass}${value === `---` ? ` text-muted` : ""}"><span id="${spanName}" class="${spanClass}">${displayFormatStart == "" ? "" : displayFormatStart}<i class="${imageName}" title="${title}"></i>&nbsp;${value === false ? "OK" : value === true ? "niedrig" : value}${unit === undefined ? "" : unit}${displayFormatEnd == "" ? "" : displayFormatEnd}</span></div>`;
}

function generateStationDeviceSettingsSelectionModal(deviceId, deviceName)
{
	generateContentStationDeviceSettingsSelectionModal(deviceId, deviceName);

	const myModal = new bootstrap.Modal(document.getElementById('modalSelectStationDevice'));
	myModal.show();
}

function generateContentStationDeviceSettingsSelectionModal(deviceId, deviceName)
{
	var stationDeviceModal = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								<h5 class="mb-0">${deviceName} (${deviceId})</h5>
							</div>
							<div class="modal-body" id="divModalDeviceSettingsContent">
								<h5>Integriertes Gerät</h5>
								<p>Bei dem ausgewählten Gerät ${deviceName} (${deviceId}) handelt es sich um ein Gerät, dass ohne Basisstation betrieben wird. Aus diesem Grund gibt es für dieses Gerät eine Basistation mit der selben Seriennummer. In der Geräteübersicht wird die Basisstation jedoch nicht angezeigt.</p>
								<p>Sie können nachfolgend wählen, ob Sie Einstellungen für die Basisstation oder das Gerät vornehmen möchten.</p>
								<div class="d-grid gap-2">
									${makeButtonElement("btnOpenModalStationSettings", "btn btn-primary", `generateStationSettingsModal('${deviceId}')`, "Einstellungen für Basisstation aufrufen", true, "modal", undefined, true)}
									${makeButtonElement("btnOpenModalDeviceSettings", "btn btn-primary", `generateDeviceSettingsModal('${deviceId}')`, "Einstellungen für Gerät aufrufen", true, "modal", undefined, true)}
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalSelectStationDevice").innerHTML = stationDeviceModal;
}

function generateDeviceImageModal(deviceId, deviceName)
{
	generateContentDeviceImageModal(deviceId, deviceName);

	const myModal = new bootstrap.Modal(document.getElementById('modalDeviceImage'));
	myModal.show();
}

function generateContentDeviceImageModal(deviceId, deviceName)
{
	var deviceImage = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								<h5 class="mb-0">${deviceName} (${deviceId})</h5>
							</div>
							<div class="modal-body text-center" id="divModalDeviceSettingsContent">
								<img src="${location.protocol}//${location.hostname}:${port}/getDeviceImage/${deviceId}" class="img-fluid" alt="Standbild">
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalDeviceImage").innerHTML = deviceImage;
}

function generateDeviceSettingsModal(deviceId, deviceName)
{
	generateContentDeviceSettingsModal(deviceId, deviceName);

	if(deviceName === undefined)
	{
		const myModal = new bootstrap.Modal(document.getElementById('modalDeviceSettings'));
		myModal.show();
	}

	getDevicePropertiesMetadata(deviceId);
}

function generateContentDeviceSettingsModal(deviceId, deviceName)
{
	var deviceModal = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								${deviceName === undefined ? `<span class="placeholder col-6 bg-light placeholder-md mt-1 mb-1"></span>` : `<div style="text-align:left; float:left;"><h5 class="mb-0">${deviceName} (${deviceId})</h5></div>`}
							</div>
							<div class="modal-body placeholder-glow" id="divModalDeviceSettingsContent">
								<div class="" id="lblModalDeviceSettingsInfo">
									<span class="placeholder col-12 placeholder-lg"></span>
								</div>
								<div class="row text-center">
									<div class="col">
										<span id="lblDeviceModel">
											<span class="placeholder col-6 placeholder-lg"></span>
										</span>
									</div>
									<div class="col">
										<span id="lblDeviceName">
											<span class="placeholder col-6 placeholder-lg"></span>
										</span>
									</div>
								</div>
								<div class="row text-center mb-3">
									<div class="col">
										<span id="lblDeviceSerial">
											<h6 class="card-subtitle text-muted">
												<span class="placeholder col-8 placeholder-lg"></span>
											</h6>
										</span>
									</div>
									<div class="col">
										<span id="lblDeviceInfo">
											<h6 class="card-subtitle text-muted">
												<div class="row">
													<div class="col">
														<span class="text-nowrap">
															<i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
														</span>
													</div>
													<div class="col">
														<span class="text-nowrap">
															<i class="bi-battery" title="Ladezustand des Akkus"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
														</span>
													</div>
													<div class="col">
														<span class="text-nowrap">
															<i class="bi-thermometer-low" title="Temperatur"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
														</span>
													</div>
												</div>
											</h6>
										</span>
									</div>
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
}

function getDevicePropertiesMetadata(deviceId)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${deviceId}`;
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
					getDeviceProperties(deviceId, objResp.data);
				}
				else
				{
					document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage("Kein Gerät gefunden. DevicePropertiesMetadata konnte nicht geladen werden.");;
				}
			}
			else
			{
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage("Fehler beim Laden der DevicePropertiesMetadata.");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage("Fehler beim Laden der DevicePropertiesMetadata.");
		}
		else
		{
			//document.getElementById("divModalDeviceSettingsContent").innerHTML = createWaitMessage("Lade Einstellungen des Geräts...");</strong></div>`;
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function getDeviceProperties(deviceId, devicePropertiesMetadata)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getDeviceProperties/${deviceId}`;
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
					fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, objResp.modelName, objResp.data);
				}
				else
				{
					document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage("Kein Gerät gefunden. DeviceProperties konnte nicht geladen werden.");
				}
			}
			else
			{
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage("Fehler beim Laden der DeviceProperties.");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage("Fehler beim Laden der DeviceProperties.");
		}
		else
		{
			//document.getElementById("divModalDeviceSettingsContent").innerHTML = createWaitMessage("Lade Einstellungen des Geräts...");</strong></div>`;
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function generateDeviceModalErrorMessage(errorMessage)
{
	return `
								<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
									<div class="modal-content">
										<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
											<span class="placeholder col-6 bg-light placeholder-lg mt-1 mb-1"></span>
										</div>
										<div class="modal-body placeholder-glow" id="divModalDeviceSettingsContent">
											<div class="" id="lblModalDeviceSettingsInfo">
												${createMessageContainer("alert alert-warning", errorMessage, "", "")}
											</div>
										</div>
										<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
											${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, true)}
										</div>
									</div>
								</div>`;
}

function fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, modelName, deviceProperties)
{
	var setEventHandler = true;
	var deviceModal =  `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">${deviceProperties.name} (${deviceId})</h5></div>${deviceProperties.wifiSignalLevel !== undefined || deviceProperties.wifiRssi !== undefined ? `<div style="text-align:right;"><h5 class="mb-0"><span class="text-nowrap"><i class="${getWifiSignalLevelIcon(deviceProperties.wifiSignalLevel, deviceProperties.wifiRssi)}" title="WiFi Empfangsstärke: ${deviceProperties.wifiRssi}dB"></i></span></h5></div>` : ""}
							</div>
							<div class="modal-body placeholder-glow" id="divModalDeviceSettingsContent">
								<div class="" id="lblModalDeviceSettingsInfo">`;
	if(isStationOrDevicesKnown(deviceProperties.model.slice(0,5)) == false)
	{
		setEventHandler = false;
		deviceModal += `
									${createMessageContainer("alert alert-warning", "Dieses Gerät wird nicht vollständig unterstützt.", `Sie können bei der Weiterentwicklung helfen, in dem Sie die Informationen der beiden Abfragen "<a href="${location.protocol}//${location.hostname}:${port}/getDevicePropertiesTruncated/${deviceId}" target=”_blank” class="alert-link">DeviceProperties</a>" und "<a href="${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${deviceId}" target=”_blank” class="alert-link">DevicePropertiesMetadata</a>" dem Entwickler zur Verfügung stellen.`, "Die Abfragen liefern Ergebnisse, bei denen Seriennummern eingekürzt sowie Links entfernt wurden. Bitte prüfen Sie, ob weitere Daten enthalten sind, die Sie entfernen möchten.")} ${createMessageContainer("alert alert-primary", "Das Speichern der Einstellungen ist zur Zeit nicht möglich.", "", "")}`;
	}
	deviceModal +=     `
								</div>
								<div class="row text-center">
									<div class="col">
										<span id="lblDeviceModel">
											<h5 class="card-subtitle mb-2">${modelName} <span class="text-muted">(${deviceProperties.model})</span></h5>
										</span>
									</div>
									<div class="col">
										<span id="lblDeviceName">
											<h5 class="card-subtitle mb-2">${deviceProperties.name}</h5>
										</span>
									</div>
								</div>
								<div class="row text-center mb-3">
									<div class="col">
										<span id="lblDeviceSerial">
											<h6 class="card-subtitle text-muted">${deviceProperties.serialNumber}</h6>
										</span>
									</div>
									<div class="col">`;
	if(deviceProperties.softwareVersion !== undefined || deviceProperties.battery !== undefined || deviceProperties.batteryTemperature !== undefined)
	{
		deviceModal += `
										<span id="lblDeviceInfo">
											<h6 class="card-subtitle text-muted">
												<div class="row">`;
		if(deviceProperties.softwareVersion !== undefined)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnFimware", "text-nowrap", "", "", "bi-gear-wide-connected", "Firmwareversion", deviceProperties.softwareVersion)}`;
		}
		if(deviceProperties.battery !== undefined || deviceProperties.batteryLow !== undefined)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnBattery", "text-nowrap", "", "", deviceProperties.chargingStatus == 1 || deviceProperties.chargingStatus == 4 ? "bi-battery-charging" : "bi-battery", "Ladezustand des Akkus", deviceProperties.battery !== undefined ? deviceProperties.battery : deviceProperties.batteryLow, deviceProperties.battery !== undefined ? "%" : "")}`;
		}
		if(deviceProperties.batteryTemperature !== undefined && deviceProperties.batteryTemperature > -99 && deviceProperties.batteryTemperature < 99)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnBatteryTemperature", "text-nowrap", "", "", "bi-thermometer-low", "Temperatur", deviceProperties.state === 2 ? `---` : deviceProperties.batteryTemperature, "&deg;C")}`;
		}
		if(deviceProperties.sensorOpen !== undefined)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnSensorState", "text-nowrap", "", "", deviceProperties.sensorOpen === true ? "bi-door-open" : "bi-door-closed", "Status", deviceProperties.sensorOpen === true ? `offen` : deviceProperties.sensorOpen === false ? `zu` : ``)}`;
		}
		deviceModal +=     `
												</div>
											</h6>
										</span>`;
	}
	deviceModal +=     `
									</div>
								</div>`;
	if(deviceProperties.state === 2)
	{
		deviceModal += `
									${createMessageContainer("alert alert-warning", "Dieses Gerät wurde auf Grund des niedrigen Akkuladestandes deaktiviert.", "Um Einstellungen für dieses Gerät vornehmen zu können, laden Sie das Gerät wieder auf.", "")}
								</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, setEventHandler)}
							</div>
						</div>
					</div>`;

		document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
		return;
	}
	if(deviceProperties.enabled !== undefined || deviceProperties.antitheftDetection !== undefined || deviceProperties.statusLed !== undefined || deviceProperties.imageMirrored !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceCommonSettings">
									<h5 class="card-header">Allgemeines</h5>
									<div class="card-body">
										<div class="row gap-3">`;
		if(deviceProperties.enabled !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>Gerät aktiviert</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.enabled.name, deviceProperties.enabled, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.antitheftDetection !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>Diebstahlerkennung</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.antitheftDetection.name, deviceProperties.antitheftDetection, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "boolean")
		{
			deviceModal += `
											<div class="col">
												<h5>Status LED</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, setEventHandler)}`;
			deviceModal += `
											</div>`;
		}
		if(deviceProperties.imageMirrored !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>Bild spiegeln</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.imageMirrored.name, deviceProperties.imageMirrored, setEventHandler)}
											</div>`;
		}
		deviceModal += `
										</div>
									</div>
								</div>`;
	}
	if(deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity !== undefined || deviceProperties.motionDetectionType !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDevicePowerManagerSettings">
									<h5 class="card-header">Bewegungserkennung</h5>
									<div class="card-body">`;
		if(deviceProperties.motionDetection !== undefined)
		{
			deviceModal += `
										<h5>Bewegungserkennung</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetection.name, deviceProperties.motionDetection, setEventHandler)}`;
			if(deviceProperties.motionDetectionSensitivity !== undefined || deviceProperties.motionDetectionSensitivityStandard !== undefined || deviceProperties.motionDetectionSensitivityAdvancedA !== undefined || deviceProperties.motionDetectionSensitivityAdvancedB !== undefined || deviceProperties.motionDetectionSensitivityAdvancedC !== undefined || deviceProperties.motionDetectionSensitivityAdvancedD !== undefined || deviceProperties.motionDetectionSensitivityAdvancedE !== undefined || deviceProperties.motionDetectionSensitivityAdvancedF !== undefined || deviceProperties.motionDetectionSensitivityAdvancedG !== undefined || deviceProperties.motionDetectionSensitivityAdvancedH !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined ? `<hr />`: ``}
										<h5>Erkennungsempfindlichkeit</h5>
										${deviceProperties.motionDetectionSensitivity !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivity.name, deviceProperties.motionDetectionSensitivity, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivity.unit, devicePropertiesMetadata.motionDetectionSensitivity.min, devicePropertiesMetadata.motionDetectionSensitivity.max, devicePropertiesMetadata.motionDetectionSensitivity.default)}` : ""}
										${deviceProperties.motionDetectionSensitivityMode !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityMode.name, deviceProperties.motionDetectionSensitivityMode, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityMode.states)}` : ``}`;
				if(deviceProperties.motionDetectionSensitivityMode !== undefined)
				{
					deviceModal += `
										<div id="divMotionDetectionSensitivityStandard" ${deviceProperties.motionDetectionSensitivityMode == 0 ? "" : ` class="collapse"`}>
											<div class="card card-body mt-2 mb-2">
												${deviceProperties.motionDetectionSensitivityStandard !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityStandard.name, deviceProperties.motionDetectionSensitivityStandard, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityStandard.unit, devicePropertiesMetadata.motionDetectionSensitivityStandard.min, devicePropertiesMetadata.motionDetectionSensitivityStandard.max, devicePropertiesMetadata.motionDetectionSensitivityStandard.default)}` : ""}
											</div>
										</div>
										<div id="divMotionDetectionSensitivityAdvanced" ${deviceProperties.motionDetectionSensitivityMode == 1 ? "" : ` class="collapse"`}>
											<div class="card card-body mt-2 mb-2">
												${deviceProperties.motionDetectionSensitivityAdvancedA !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedA.name, deviceProperties.motionDetectionSensitivityAdvancedA, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedA.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedA.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedA.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedA.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedB !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedB.name, deviceProperties.motionDetectionSensitivityAdvancedB, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedB.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedB.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedB.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedB.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedC !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedC.name, deviceProperties.motionDetectionSensitivityAdvancedC, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedC.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedC.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedC.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedC.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedD !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedD.name, deviceProperties.motionDetectionSensitivityAdvancedD, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedD.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedD.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedD.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedD.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedE !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedE.name, deviceProperties.motionDetectionSensitivityAdvancedE, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedE.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedE.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedE.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedE.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedF !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedF.name, deviceProperties.motionDetectionSensitivityAdvancedF, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedF.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedF.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedF.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedF.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedG !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedF.name, deviceProperties.motionDetectionSensitivityAdvancedF, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedG.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedG.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedG.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedG.default)}` : ""}
												${deviceProperties.motionDetectionSensitivityAdvancedH !== undefined ? `${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityAdvancedH.name, deviceProperties.motionDetectionSensitivityAdvancedH, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityAdvancedH.unit, devicePropertiesMetadata.motionDetectionSensitivityAdvancedH.min, devicePropertiesMetadata.motionDetectionSensitivityAdvancedH.max, devicePropertiesMetadata.motionDetectionSensitivityAdvancedH.default)}` : ""}
											</div>
										</div>`;
				}

			}
			if(deviceProperties.motionDetectionType !== undefined || deviceProperties.motionDetectionTypeHuman !== undefined || deviceProperties.motionDetectionTypeHumanRecognition !== undefined || deviceProperties.motionDetectionTypePet !== undefined || deviceProperties.motionDetectionTypeVehicle !== undefined || deviceProperties.motionDetectionTypeAllOtherMotions !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity ? `<hr />`: ``}
										<h5>Erkennungsart</h5>
										${deviceProperties.motionDetectionType !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionType.name, deviceProperties.motionDetectionType, setEventHandler, devicePropertiesMetadata.motionDetectionType.states)}` : ""}
										${deviceProperties.motionDetectionTypeHuman !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeHuman.name, deviceProperties.motionDetectionTypeHuman, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypeHumanRecognition !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeHumanRecognition.name, deviceProperties.motionDetectionTypeHumanRecognition, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypePet !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypePet.name, deviceProperties.motionDetectionTypePet, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypeVehicle !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeVehicle.name, deviceProperties.motionDetectionTypeVehicle, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypeAllOtherMotions !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeAllOtherMotions.name, deviceProperties.motionDetectionTypeAllOtherMotions, setEventHandler)}` : ""}`;
			}
			if(deviceProperties.rotationSpeed !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity || deviceProperties.motionDetectionType ? `<hr />`: ``}
										<h5>Bewegungsgeschwindigkeit</h5>
										${deviceProperties.rotationSpeed !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.rotationSpeed.name, deviceProperties.rotationSpeed, setEventHandler, devicePropertiesMetadata.rotationSpeed.states)}` : ""}`;
			}
			if(deviceProperties.motionTracking !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity || deviceProperties.motionDetectionType || deviceProperties.rotationSpeed !== undefined ? `<hr />`: ``}
										<h5>Bewegungsverfolgung</h5>
										${deviceProperties.motionTracking !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionTracking.name, deviceProperties.motionTracking, setEventHandler)}` : ""}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}

	if(deviceProperties.loiteringDetection !== undefined || deviceProperties.loiteringDetectionRange !== undefined || deviceProperties.loiteringDetectionLength !== undefined || deviceProperties.loiteringCustomResponsePhoneNotification !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponse !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponseVoice !== undefined || deviceProperties.loiteringCustomResponseHomeBaseNotification !== undefined || deviceProperties.loiteringCustomResponseTimeFrom !== undefined || deviceProperties.loiteringCustomResponseTimeTo !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceLoiteringSettings">
									<h5 class="card-header">Erkennung von verdächtigem Verhalten</h5>
									<div class="card-body">`;
		if(deviceProperties.loiteringDetection !== undefined)
		{
			deviceModal += `
									<h5>Erkennung von verdächtigem Verhalten</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetection.name, deviceProperties.loiteringDetection, setEventHandler)}`;
		}
		if(deviceProperties.loiteringDetectionRange !== undefined)
		{
			deviceModal += `
										${deviceProperties.loiteringDetection !== undefined ? `<hr />`: ``}
										<h5>Erfassungsbereich</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetectionRange.name, deviceProperties.loiteringDetectionRange, setEventHandler, devicePropertiesMetadata.loiteringDetectionRange.states)}`;
		}
		if(deviceProperties.loiteringDetectionLength !== undefined)
		{
			deviceModal += `
										${deviceProperties.loiteringDetectionRange !== undefined ? `<hr />`: ``}
										<h5>Erkennungsdauer</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetectionLength.name, deviceProperties.loiteringDetectionLength, setEventHandler, devicePropertiesMetadata.loiteringDetectionLength.states)}`;
		}
		if(deviceProperties.loiteringDetectionLength !== undefined)
		{
			deviceModal += `
										${deviceProperties.loiteringDetectionLength !== undefined ? `<hr />`: ``}
										<h5>Reaktion auf verdächtiges Verhalten</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponsePhoneNotification.name, deviceProperties.loiteringCustomResponsePhoneNotification, setEventHandler)}
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponse.name, deviceProperties.loiteringCustomResponseAutoVoiceResponse, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponseVoice.name, deviceProperties.loiteringCustomResponseAutoVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "loiteringCustomResponseTimespan", deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseTimeFrom.name, deviceProperties.loiteringCustomResponseTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseTimeFrom.name, deviceProperties.loiteringCustomResponseTimeFrom, setEventHandler)}
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseHomeBaseNotification.name, deviceProperties.loiteringCustomResponseHomeBaseNotification, setEventHandler)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.deliveryGuard !== undefined || deviceProperties.deliveryGuardPackageGuarding !== undefined || deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceDeliveryGuardSettings">
									<h5 class="card-header">Lieferungsüberwachung</h5>
									<div class="card-body">`;
		if(deviceProperties.deliveryGuard !== undefined)
		{
			deviceModal += `
										<h5>Lieferungsüberwachung</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuard.name, deviceProperties.deliveryGuard, setEventHandler)}`;
			if(deviceProperties.deliveryGuardPackageGuarding !== undefined || deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined)
			{
				deviceModal += `
										${deviceProperties.deliveryGuard !== undefined ? `<hr />`: ``}
										<h5>Paketschutz</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuarding.name, deviceProperties.deliveryGuardPackageGuarding, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingVoiceResponseVoice.name, deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.deliveryGuardPackageGuardingVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "deliveryGuardPackageGuardingActivatedTimespan", deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingActivatedTimeFrom.name, deviceProperties.deliveryGuardPackageGuardingActivatedTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingActivatedTimeTo.name, deviceProperties.deliveryGuardPackageGuardingActivatedTimeTo, setEventHandler)}`;
			}
			if(deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck)
			{
				deviceModal += `
										${deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined ? `<hr />`: ``}
										<h5>Benachrichtigung über nicht abgeholte Pakete</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlert.name, deviceProperties.deliveryGuardUncollectedPackageAlert, setEventHandler)}
										${generateElementTimePicker("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlertTimeToCheck.name, deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck, setEventHandler)}`;
			}
			if(deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined)
			{
				deviceModal += `
										${deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck !== undefined ? `<hr />`: ``}
										<h5>Live-Überprüfung auf Pakete</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageLiveCheckAssistance.name, deviceProperties.deliveryGuardPackageLiveCheckAssistance, setEventHandler)}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.ringAutoResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceRingAutoResponseSettings">
									<h5 class="card-header">automatische Klingel-Reaktion</h5>
									<div class="card-body">`;
		if(deviceProperties.ringAutoResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined)
		{
			deviceModal += `
										<h5>automatische Klingel-Reaktion</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponse.name, deviceProperties.ringAutoResponse, setEventHandler)}`;
			if(deviceProperties.ringAutoResponseVoiceResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined)
			{
				deviceModal += `
										${deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined ? `<hr />`: ``}
										<h5>automatische Sprachausgabe</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponseVoiceResponse.name, deviceProperties.ringAutoResponseVoiceResponse, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponseVoiceResponseVoice.name, deviceProperties.ringAutoResponseVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.ringAutoResponseVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "ringAutoResponseTimespan", deviceProperties.name, devicePropertiesMetadata.ringAutoResponseTimeFrom.name, deviceProperties.ringAutoResponseTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.ringAutoResponseTimeTo.name, deviceProperties.ringAutoResponseTimeTo, setEventHandler)}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionSensitivity !== undefined || deviceProperties.soundDetectionType !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceSoundDetectionSettings">
									<h5 class="card-header">Geräuscherkennung</h5>
									<div class="card-body">`;
		if(deviceProperties.soundDetection !== undefined)
		{
			deviceModal += `
										<h5>Geräuscherkennung</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetection.name, deviceProperties.soundDetection, setEventHandler)}`;
			if(deviceProperties.soundDetectionSensitivity !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined ? `<hr />`: ``}
										<h5>Erkennungsempfindlichkeit</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionSensitivity.name, deviceProperties.soundDetectionSensitivity, setEventHandler, devicePropertiesMetadata.soundDetectionSensitivity.states)}`;
			}
			else if(deviceProperties.soundDetectionType !== undefined && (deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined))
			{
				deviceModal += `
										${deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionSensitivity ? `<hr />`: ``}
										<h5>Erkennungsart</h5>
										${deviceProperties.soundDetectionType !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionType.name, deviceProperties.soundDetectionType, setEventHandler, devicePropertiesMetadata.soundDetectionType.states)}` : ""}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.powerWorkingMode !== undefined || deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined || deviceProperties.powerSource !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDevicePowerManagerSettings">
									<h5 class="card-header">Power Manager</h5>
									<div class="card-body">`;
		if(deviceProperties.powerWorkingMode !== undefined)
		{
			deviceModal += `
										<h5>Arbeitsmodus</h5>
										${generateElementRadioGroup("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.powerWorkingMode.name, deviceProperties.powerWorkingMode, setEventHandler, devicePropertiesMetadata.powerWorkingMode.states)}
										<div id="divDeviceCustomRecordingSettings" ${deviceProperties.powerWorkingMode == 2 ? "" : ` class="collapse"`}>`;
		}
		if(deviceProperties.powerWorkingMode === undefined || deviceProperties.powerWorkingMode == 2)
		{
			if(deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined)
			{
				deviceModal += `
											${deviceProperties.powerWorkingMode !== undefined ? `<hr />` : ""}
											<h5>${deviceProperties.powerWorkingMode !== undefined ? "Benutzerdefinierte " : "Power Manager "}Einstellungen</h5>`;
				if(deviceProperties.recordingClipLength !== undefined)
				{
					deviceModal += `
											${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.recordingClipLength.name, deviceProperties.recordingClipLength, setEventHandler, devicePropertiesMetadata.recordingClipLength.unit, devicePropertiesMetadata.recordingClipLength.min, devicePropertiesMetadata.recordingClipLength.max, devicePropertiesMetadata.recordingClipLength.default)}`;
				}
				if(deviceProperties.recordingRetriggerInterval !== undefined)
				{
					deviceModal += `
											${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.recordingRetriggerInterval.name, deviceProperties.recordingRetriggerInterval, setEventHandler, devicePropertiesMetadata.recordingRetriggerInterval.unit, devicePropertiesMetadata.recordingRetriggerInterval.min, devicePropertiesMetadata.recordingRetriggerInterval.max, devicePropertiesMetadata.recordingRetriggerInterval.default)}`;
				}
				if(deviceProperties.recordingEndClipMotionStops !== undefined)
				{
					deviceModal += `
											${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.recordingEndClipMotionStops.name, deviceProperties.recordingEndClipMotionStops, setEventHandler)}`;
				}
			}
		}
		if(deviceProperties.powerWorkingMode !== undefined)
		{
				deviceModal += `
										</div>`;
		}
		if(deviceProperties.powerSource !== undefined)
		{
			deviceModal += `
										${deviceProperties.powerWorkingMode !== undefined ? `<hr />` : ``}
										<h5>Energiequelle</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.powerSource.name, deviceProperties.powerSource, setEventHandler, devicePropertiesMetadata.powerSource.states)}
										<label>aktueller Status: ${getDeviceStateValueInGerman(devicePropertiesMetadata.chargingStatus.states[deviceProperties.chargingStatus])}</label>`;
		}
		if((deviceProperties.lastChargingDays !== undefined && deviceProperties.lastChargingDays > -1 && deviceProperties.lastChargingTotalEvents !== undefined && deviceProperties.lastChargingRecordedEvents !== undefined) || (deviceProperties.detectionStatisticsWorkingDays !== undefined && deviceProperties.detectionStatisticsDetectedEvents !== undefined && deviceProperties.detectionStatisticsRecordedEvents !== undefined))
		{
			deviceModal += `
										${deviceProperties.powerWorkingMode !== undefined || deviceProperties.powerSource !== undefined ? `<hr />` : ``}
										<h5>Erkennungsstatistik</h5>
										<div class="row gap-3">
											<div class="col">
												<h5>${deviceProperties.lastChargingDays !== undefined ? deviceProperties.lastChargingDays : deviceProperties.detectionStatisticsWorkingDays}</h5>
												${deviceProperties.lastChargingDays !== undefined ? "Tage seit letztem Ladevorgang" : "Arbeitstage"}
											</div>
											<div class="col">
												<h5>${deviceProperties.lastChargingTotalEvents !== undefined ? deviceProperties.lastChargingTotalEvents : deviceProperties.detectionStatisticsDetectedEvents}</h5>
												Ereignisse erkannt
											</div>
											<div class="col">
												<h5>${deviceProperties.lastChargingRecordedEvents !== undefined ? deviceProperties.lastChargingRecordedEvents : deviceProperties.detectionStatisticsRecordedEvents}</h5>
												Ereignisse aufgezeichnet
											</div>
										</div>`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.continuousRecording !== undefined || deviceProperties.continuousRecordingType !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceVideoSettings">
									<h5 class="card-header">Aufnahmeeinstellungen</h5>
									<div class="card-body">`;
		if(deviceProperties.continuousRecording !== undefined)
		{
			deviceModal += `
										<h5>Daueraufzeichnung</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.continuousRecording.name, deviceProperties.continuousRecording, setEventHandler)}`;
		}
		if(deviceProperties.continuousRecordingType !== undefined)
		{
			deviceModal += `
										${deviceProperties.continuousRecording !== undefined ? `<hr />` : ``}
										<h5>Art der Daueraufzeichnung</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.continuousRecordingType.name, deviceProperties.continuousRecordingType, setEventHandler, devicePropertiesMetadata.continuousRecordingType.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if((deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number") || deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined || deviceProperties.videoWdr !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceVideoSettings">
									<h5 class="card-header">Videoeinstellungen</h5>
									<div class="card-body">`;
		if(deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number")
		{
			deviceModal += `
										<h5>Status LED</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, setEventHandler, devicePropertiesMetadata.statusLed.states)}`;
		}
		if(deviceProperties.watermark !== undefined)
		{
			deviceModal += `
										${deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number" ? `<hr />` : ``}
										<h5>Wasserzeichen</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.watermark.name, deviceProperties.watermark, setEventHandler, devicePropertiesMetadata.watermark.states)}`;
		}
		if(deviceProperties.videoRecordingQuality !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined ? `<hr />` : ``}
										<h5>Aufzeichnungsqualität</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoRecordingQuality.name, deviceProperties.videoRecordingQuality, setEventHandler, devicePropertiesMetadata.videoRecordingQuality.states)}`;
		}
		if(deviceProperties.videoStreamingQuality !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>Streamingqualität</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoStreamingQuality.name, deviceProperties.videoStreamingQuality, setEventHandler, devicePropertiesMetadata.videoStreamingQuality.states)}`;
		}
		if(deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>Nachtsicht</h5>
										${devicePropertiesMetadata.autoNightvision === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.autoNightvision.name, deviceProperties.autoNightvision, setEventHandler)}
										${devicePropertiesMetadata.nightvision === undefined ? "" : generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.nightvision.name, deviceProperties.nightvision, setEventHandler, devicePropertiesMetadata.nightvision.states)}
										${devicePropertiesMetadata.lightSettingsBrightnessManual === undefined ? "" : generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessManual.name, deviceProperties.lightSettingsBrightnessManual, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessManual.unit, devicePropertiesMetadata.lightSettingsBrightnessManual.min, devicePropertiesMetadata.lightSettingsBrightnessManual.max, devicePropertiesMetadata.lightSettingsBrightnessManual.default)}`;
		}
		if(deviceProperties.videoWdr !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined ? `<hr />` : ``}
										<h5>HDR</h5>
										${devicePropertiesMetadata.videoWdr === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoWdr.name, deviceProperties.videoWdr, setEventHandler)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined || deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceAudioSettings">
									<h5 class="card-header">Audioeinstellungen</h5>
									<div class="card-body">`;
		if(deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined)
		{
			deviceModal += `
										<h5>Mikrofon</h5>`;
			if(deviceProperties.microphone !== undefined)
			{
				deviceModal += `
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.microphone.name, deviceProperties.microphone, setEventHandler)}`;
			}
			if(deviceProperties.audioRecording !== undefined && (deviceProperties.microphone === undefined || (deviceProperties.microphone !== undefined && deviceProperties.microphone == true)))
			{
				deviceModal += `
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.audioRecording.name, deviceProperties.audioRecording, setEventHandler)}`;
			}
		}
		if(deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined)
		{
			deviceModal += `
										${deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined ? `<hr />` : ``}
										<h5>Lautsprecher</h5>
										${devicePropertiesMetadata.speaker === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speaker.name, deviceProperties.speaker, setEventHandler)}`;
			if(devicePropertiesMetadata.speakerVolume)
			{
				if(devicePropertiesMetadata.speakerVolume.states === undefined)
				{
					deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speakerVolume.name, deviceProperties.speakerVolume, setEventHandler, devicePropertiesMetadata.speakerVolume.unit, devicePropertiesMetadata.speakerVolume.min, devicePropertiesMetadata.speakerVolume.max, devicePropertiesMetadata.speakerVolume.default)}`;
				}
				else
				{
					deviceModal += `
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speakerVolume.name, deviceProperties.speakerVolume, setEventHandler, devicePropertiesMetadata.speakerVolume.states)}`;
				}
			}
		}
		if(deviceProperties.ringtoneVolume !== undefined)
		{
			deviceModal += `
										${deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined ? `<hr />` : ``}
										<h5>Klingeltonlautstärke der Türklingel</h5>
										${devicePropertiesMetadata.speaker === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speaker.name, deviceProperties.speaker, setEventHandler)}`;
			if(devicePropertiesMetadata.ringtoneVolume)
			{
				if(devicePropertiesMetadata.ringtoneVolume.states === undefined)
				{
					deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringtoneVolume.name, deviceProperties.ringtoneVolume, setEventHandler, devicePropertiesMetadata.ringtoneVolume.unit, devicePropertiesMetadata.ringtoneVolume.min, devicePropertiesMetadata.ringtoneVolume.max, devicePropertiesMetadata.ringtoneVolume.default)}`;
				}
				else
				{
					deviceModal += `
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringtoneVolume.name, deviceProperties.ringtoneVolume, setEventHandler, devicePropertiesMetadata.ringtoneVolume.states)}`;
				}
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.dualCamWatchViewMode !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceDualCamWatchViewModeSettings">
									<h5 class="card-header">Anzeige der beiden Kameras</h5>
									<div class="card-body">`;
		if(deviceProperties.dualCamWatchViewMode !== undefined)
		{
			deviceModal += `
										<h5>Anzeige der beiden Kameras</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.dualCamWatchViewMode.name, deviceProperties.dualCamWatchViewMode, setEventHandler, devicePropertiesMetadata.dualCamWatchViewMode.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.chimeIndoor !== undefined || deviceProperties.chimeHomebase !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceChimeSettings">
									<h5 class="card-header">Klingeleinstellungen</h5>
									<div class="card-body">`;
		if(deviceProperties.chimeIndoor !== undefined)
		{
			deviceModal += `
										<h5>USB Dongle als Klingel</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeIndoor.name, deviceProperties.chimeIndoor, setEventHandler)}`;
		}
		if(deviceProperties.chimeHomebase !== undefined)
		{
			deviceModal += `
										${deviceProperties.chimeIndoor !== undefined ? `<hr />` : ``}
										<h5>HomeBase als Klingel</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeHomebase.name, deviceProperties.chimeHomebase, setEventHandler)}
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.name, deviceProperties.chimeHomebaseRingtoneVolume, setEventHandler, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.unit, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.min, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.max, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeHomebaseRingtoneType.name, deviceProperties.chimeHomebaseRingtoneType, setEventHandler, devicePropertiesMetadata.chimeHomebaseRingtoneType.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.lightSettingsBrightnessManual !== undefined && (deviceProperties.lightSettingsManualLightingActiveMode !== undefined || deviceProperties.lightSettingsManualDailyLighting !== undefined || deviceProperties.lightSettingsManualDynamicLighting !== undefined || deviceProperties.lightSettingsBrightnessSchedule !== undefined || deviceProperties.lightSettingsScheduleLightingActiveMode !== undefined || deviceProperties.lightSettingsScheduleDailyLighting !== undefined || deviceProperties.lightSettingsScheduleDynamicLighting !== undefined || deviceProperties.lightSettingsMotionTriggered !== undefined || deviceProperties.lightSettingsMotionTriggeredTimer !== undefined || deviceProperties.lightSettingsMotionActivationMode !== undefined || deviceProperties.lightSettingsBrightnessMotion !== undefined || deviceProperties.lightSettingsMotionLightingActiveMode !== undefined || deviceProperties.lightSettingsMotionDailyLighting !== undefined || deviceProperties.lightSettingsMotionDynamicLighting !== undefined))
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceLightSettings">
									<h5 class="card-header">Lichteinstellungen</h5>
									<div class="card-body">
										<h5>manuelle Beleuchtung</h5>
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessManual.name, deviceProperties.lightSettingsBrightnessManual, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessManual.unit, devicePropertiesMetadata.lightSettingsBrightnessManual.min, devicePropertiesMetadata.lightSettingsBrightnessManual.max, devicePropertiesMetadata.lightSettingsBrightnessManual.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsManualLightingActiveMode.name, deviceProperties.lightSettingsManualLightingActiveMode, setEventHandler, devicePropertiesMetadata.lightSettingsManualLightingActiveMode.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsManualDailyLighting.name, deviceProperties.lightSettingsManualDailyLighting, setEventHandler, devicePropertiesMetadata.lightSettingsManualDailyLighting.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsManualDynamicLighting.name, deviceProperties.lightSettingsManualDynamicLighting, setEventHandler, devicePropertiesMetadata.lightSettingsManualDynamicLighting.states)}
										<hr />
										<h5>zeitgesteuerte Beleuchtung</h5>
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessSchedule.name, deviceProperties.lightSettingsBrightnessSchedule, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessSchedule.unit, devicePropertiesMetadata.lightSettingsBrightnessSchedule.min, devicePropertiesMetadata.lightSettingsBrightnessSchedule.max, devicePropertiesMetadata.lightSettingsBrightnessSchedule.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsScheduleLightingActiveMode.name, deviceProperties.lightSettingsScheduleLightingActiveMode, setEventHandler, devicePropertiesMetadata.lightSettingsScheduleLightingActiveMode.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsScheduleDailyLighting.name, deviceProperties.lightSettingsScheduleDailyLighting, setEventHandler, devicePropertiesMetadata.lightSettingsScheduleDailyLighting.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsScheduleDynamicLighting.name, deviceProperties.lightSettingsScheduleDynamicLighting, setEventHandler, devicePropertiesMetadata.lightSettingsScheduleDynamicLighting.states)}
										<hr />
										<h5>Beleuchtung bei erkannter Bewegung</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionTriggered.name, deviceProperties.lightSettingsMotionTriggered, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionTriggeredTimer.name, deviceProperties.lightSettingsMotionTriggeredTimer, setEventHandler, devicePropertiesMetadata.lightSettingsMotionTriggeredTimer.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionActivationMode.name, deviceProperties.lightSettingsMotionActivationMode, setEventHandler, devicePropertiesMetadata.lightSettingsMotionActivationMode.states)}
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessMotion.name, deviceProperties.lightSettingsBrightnessMotion, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessMotion.unit, devicePropertiesMetadata.lightSettingsBrightnessMotion.min, devicePropertiesMetadata.lightSettingsBrightnessMotion.max, devicePropertiesMetadata.lightSettingsBrightnessMotion.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionLightingActiveMode.name, deviceProperties.lightSettingsMotionLightingActiveMode, setEventHandler, devicePropertiesMetadata.lightSettingsMotionLightingActiveMode.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionDailyLighting.name, deviceProperties.lightSettingsMotionDailyLighting, setEventHandler, devicePropertiesMetadata.lightSettingsMotionDailyLighting.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionDynamicLighting.name, deviceProperties.lightSettingsMotionDynamicLighting, setEventHandler, devicePropertiesMetadata.lightSettingsMotionDynamicLighting.states)}
									</div>
								</div>`;
	}
	if(deviceProperties.chirpTone !== undefined || deviceProperties.chirpVolume !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceChirpSettings">
									<h5 class="card-header">Toneinstellungen</h5>
									<div class="card-body">`;
		if(deviceProperties.chirpTone !== undefined)
		{
			deviceModal += `
										<h5>Bestätigungston</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chirpTone.name, deviceProperties.chirpTone, setEventHandler, devicePropertiesMetadata.chirpTone.states)}`;
		}
		if(deviceProperties.chirpVolume !== undefined)
		{
			deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chirpVolume.name, deviceProperties.chirpVolume, setEventHandler, devicePropertiesMetadata.chirpVolume.unit, devicePropertiesMetadata.chirpVolume.min, devicePropertiesMetadata.chirpVolume.max, devicePropertiesMetadata.chirpVolume.default)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.notification !== undefined || deviceProperties.notificationType !== undefined || deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined)
	{
		deviceModal += `
								<div class="card" id="cardDeviceNotificationSettings">
									<h5 class="card-header">Benachrichtigungen</h5>
									<div class="card-body">`;
		if(deviceProperties.notification !== undefined)
		{
			deviceModal += `
										<h5>Benachrichtigungen aktivieren</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notification.name, deviceProperties.notification, setEventHandler)}`;
		}
		if((deviceProperties.notification !== undefined && deviceProperties.notification === true) || deviceProperties.notification === undefined)
		{
			deviceModal += `
										${deviceProperties.notification !== undefined ? `<hr />` : ``}
										<h5>Art der Benachrichtigung</h5>
										${createMessageContainer("alert alert-warning", "Hinweise zur Nutzung von Clouddiensten.", "Bei einigen Modi werden Informationen vorübergehend in der Cloud gespeichert.", "Weitere Hinweise finden Sie in der App.")}
										${generateElementRadioGroup("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationType.name, deviceProperties.notificationType, setEventHandler, devicePropertiesMetadata.notificationType.states)}`;
			if(deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined)
			{
				deviceModal += `
										
										<hr />
										<h5>Benachrichtigung senden</h5>
										${deviceProperties.notificationPerson !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationPerson.name, deviceProperties.notificationPerson, setEventHandler)}` : ""}
										${deviceProperties.notificationPet !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationPet.name, deviceProperties.notificationPet, setEventHandler)}` : ""}
										${deviceProperties.notificationAllOtherMotion !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationAllOtherMotion.name, deviceProperties.notificationAllOtherMotion, setEventHandler)}` : ""}
										${deviceProperties.notificationCrying !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationCrying.name, deviceProperties.notificationCrying, setEventHandler)}` : ""}
										${deviceProperties.notificationAllSound !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationAllSound.name, deviceProperties.notificationAllSound, setEventHandler)}` : ""}
										${deviceProperties.notificationRing !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationRing.name, deviceProperties.notificationRing, setEventHandler)}` : ""}
										${deviceProperties.notificationMotion !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationMotion.name, deviceProperties.notificationMotion, setEventHandler)}` : ""}
										${deviceProperties.notificationRadarDetector !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationRadarDetector.name, deviceProperties.notificationRadarDetector, setEventHandler)}` : ""}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	deviceModal += `
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, setEventHandler)}
							</div>
						</div>
					</div>`;

	document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
}

function isStationOrDevicesKnown(modell)
{
	switch(modell)
	{
		//Stations
		case "T8002":
		case "T8010":
		case "T8030":
		//eufyCams
		case "T8112":
		case "T8113":
		case "T8114":
		case "T8142":
		case "T8160":
		case "T8161":
		//IndoorCams
		case "T8400":
		case "T8410":
		//Doorbells
		case "T8213":
		//WallLightCams
		case "T84A1":
		//Sensors
		case "T8900":
			return true;
		default:
			return false;
	}
}

function generateElementSwitch(type, serialNumber, name, propertyName, value, setEventHandler)
{
	return `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == true ? " checked" : ""}${setEventHandler == true ? ` onclick="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.checked)` : ""}"><label class="form-check-label" for="chk${propertyName}">${getPropertyNameInGerman(propertyName)}</label></div>`;
}

function generateElementRadioGroup(type, serialNumber, name, propertyName, value, setEventHandler, states)
{
	var radioGroup = ``;
	for(var state in states)
	{
		radioGroup += makeRadioElement(type, serialNumber, name, propertyName, state == value ? true : false, setEventHandler, states[state], state);
	}
	return radioGroup;
}

function makeRadioElement(type, serialNumber, name, propertyName, value, setEventHandler, state, stateValue)
{
	return `<div class="form-check"><input class="form-check-input" type="radio" name="grp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" id="rb${state.charAt(0).toUpperCase() + state.slice(1)}" ${value == true ? " checked" : ""}${setEventHandler == true ? ` onclick="change${type}Property('${serialNumber}', '${name}', '${propertyName}', ${stateValue})` : ""}"><label class="form-check-label" for="rb${state.charAt(0).toUpperCase() + state.slice(1)}">${getDeviceStateValueInGerman(state)}</label></div>`;
}

function generateElementRange(type, serialNumber, name, propertyName, value, setEventHandler, unit, min, max, defaultValue)
{
	return `<div><label for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label mb-0 align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}: <span id="spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value">${value === undefined ? defaultValue : value}</span>${unit === undefined ? "" : getDeviceStateValueInGerman(unit)}</label>${min !== undefined && max !== undefined ? `<div class="d-flex justify-content-between"><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Min">${min}</small></div><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Max">${max}</small></div></div>` : ""}<input type="range" class="form-range ${min === undefined ? "mt-0" : "my-0"}" min="${min}" max="${max}" id="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" value="${value === undefined ? defaultValue : value}" oninput="updateSliderValue('spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value', this.value)"${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)"` : ""}>${defaultValue !== undefined ? `<div class="text-end">${generateElementButton(type, serialNumber, name, propertyName, setEventHandler, "btn btn-outline-secondary btn-sm", true, (defaultValue !== undefined && defaultValue != value))}</div>` : ""}</div>`;
}

function generateElementProgress(propertyName, value)
{
	return `<div><label for="prog${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}</label><div class="progress mb-3"><div id="prog${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="progress-bar" style="width: ${value}%" role="progressbar" aria-label="Speicherauslastung" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"></div></div></div>`;
}

function generateElementSelect(type, serialNumber, name, propertyName, value, setEventHandler, states)
{
	var selectElement = `<div><label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)` : ""}">`;
	for(var state in states)
	{
		selectElement += makeSelectElement(propertyName, value, state, states[state])
	}
	selectElement += `</select></div>`;
	return selectElement;
}

function generateElementSelectTimeZone(type, serialNumber, name, propertyName, value, setEventHandler, states)
{
	var selectElement = `<div><label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value) ` : ""}" disabled>`;
	for(var state in states)
	{
		selectElement += makeSelectElementTimeZone(propertyName, value, `"${states[state].timeZoneGMT}"`, states[state])
	}
	selectElement += `</select></div>`;
	return selectElement;
}

function makeSelectElement(propertyName, value, valueNumber, state)
{
	return `<option value=${valueNumber} id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == valueNumber ? " selected" : ""}>${getDeviceStateValueInGerman(state, propertyName, valueNumber)}</option>`;
}

function makeSelectElementTimeZone(propertyName, value, valueNumber, state)
{
	return `<option value=${valueNumber} id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == state.timeZoneGMT || value ==  state.timeZoneGMT + "|1." + state.timeSn ? " selected" : ""}>${getDeviceStateValueInGerman(state.timeId, propertyName, valueNumber)}</option>`;
}

function generateElementButton(type, serialNumber, name, propertyName, setEventHandler, buttonClass, setToDefault, enabled)
{
	return `<div>${makeButtonElement(`btn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}${setToDefault == true ? "ToDefault" : ""}`, `${buttonClass}`, `change${type}Property('${serialNumber}', '${name}', '${propertyName}')`, `${setToDefault == true ? `Standardwert setzen` : `${getPropertyNameInGerman(propertyName)}`}`, enabled, undefined, undefined, setEventHandler)}</div>`;
}

function makeButtonElement(buttonId, buttonClass, buttonOnClick, description, enabled, dataBsDismiss, ariaLabel, setEventHandler)
{
	return `<button id="${buttonId}" type="button" class="${buttonClass}"${buttonOnClick !== undefined && setEventHandler == true ? ` onclick="${buttonOnClick}"` : ""}${dataBsDismiss !== undefined ? ` data-bs-dismiss="${dataBsDismiss}"` : ""}${ariaLabel !== undefined ? ` aria-label="${ariaLabel}"` : ""}${enabled == false ? " disabled" : ""}>${description}</button>`;
}

function generateElementTimePicker(type, serialNumber, name, propertyName, value, setEventHandler)
{
	return `<div class="row align-items-center"><label class="mb-2" for="tp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}</label><div class="col"><input type="time" id="tp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-control mb-2" value="${value}" ${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)"` : ""}></div><div class="col"></div><div class="col"></div></div>`;
}

function generateElementTimePickerStartEnd(type, serialNumber, caption, startName, startPropertyName, startValue, startSetEventHandler, endName, endPropertyName, endValue, endSetEventHandler)
{
	return `${getPropertyNameInGerman(caption)}<div class="row align-items-center"><div class="col"><label class="col-form-label" for="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}">${getPropertyNameInGerman("captionTimeFrom")}</label><input type="time" id="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}" class="form-control mb-2" value="${startValue}" ${startSetEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${startName}', '${startPropertyName}', this.value)"` : ""}></div><div class="col text-center"">${getPropertyNameInGerman("timeUntil")}</div><div class="col"><label class="col-form-label" for="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}">${getPropertyNameInGerman("captionTimeTo")}</label><input type="time" id="tp${endPropertyName.charAt(0).toUpperCase() + endPropertyName.slice(1)}" class="form-control mb-2" value="${endValue}" ${endSetEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${endName}', '${endPropertyName}', this.value)"` : ""}></div></div>`;
}

function getPropertyNameInGerman(propertyName)
{
	switch(propertyName)
	{
		case "enabled":
			return "Gerät aktivieren";
		case "antitheftDetection":
			return "Diebstahlerkennung aktivieren";
		case "statusLed":
			return "Status LED aktivieren";
		case "imageMirrored":
			return "Bild spiegeln aktivieren";
		case "motionDetection":
			return "Bewegungserkennung aktivieren";
		case "motionDetectionSensitivity":
			return "Erkennungsempfindlichkeit";
		case "motionDetectionType":
			return "Art der Bewegungserkennung";
		case "motionDetectionTypeHuman":
			return "Personenerkennung";
		case "motionDetectionTypeHumanRecognition":
			return "Gesichtserkennung";
		case "motionDetectionTypePet":
			return "Tiererkennung";
		case "motionDetectionTypeVehicle":
			return "Fahrzeugerkennung";
		case "motionDetectionTypeAllOtherMotions":
			return "alle anderen Bewegungen";
		case "rotationSpeed":
			return "Bewegungsgeschwindigkeit";
		case "motionTracking":
			return "Bewegungsverfolgung aktivieren"
		case "soundDetection":
			return "Geräuscherkennung aktivieren";
		case "soundDetectionSensitivity":
			return "Erkennungsempfindlichkeit";
		case "recordingClipLength":
			return "Länge der Aufzeichung";
		case "recordingRetriggerInterval":
			return "Intervall für erneutes Auslösen";
		case "recordingEndClipMotionStops":
			return "Aufzeichung frühzeitiger beenden wenn Bewegung stoppt";
		case "powerSource":
			return "Energiequelle";
		case "continuousRecording":
			return "Daueraufzeichnung aktivieren";
		case "continuousRecordingType":
			return "Art der Daueraufzeichnung";
		case "watermark":
			return "Logo und Wasserzeichen";
		case "videoRecordingQuality":
			return "Aufzeichnungsqualität";
		case "videoStreamingQuality":
			return "Streamingqualität";
		case "autoNightvision":
			return "automatische Nachtsicht aktivieren";
		case "nightvision":
			return "Art der Nachtsicht";
		case "lightSettingsBrightnessManual":
		case "lightSettingsBrightnessSchedule":
		case "lightSettingsBrightnessMotion":
			return "Helligkeit des Scheinwerfers";
		case "lightSettingsManualLightingActiveMode":
		case "lightSettingsScheduleLightingActiveMode":
		case "lightSettingsMotionLightingActiveMode":
			return "Modus der Beleuchtung";
		case "lightSettingsManualDailyLighting":
		case "lightSettingsScheduleDailyLighting":
		case "lightSettingsMotionDailyLighting":
			return "Farbe des Tageslichts";
		case "lightSettingsManualDynamicLighting":
		case "lightSettingsScheduleDynamicLighting":
		case "lightSettingsMotionDynamicLighting":
			return "dnymische Beleuchtungfunktion";
		case "lightSettingsMotionTriggered":
			return "Beleuchtung bei erkannter Bewegung aktivieren";
		case "lightSettingsMotionTriggeredTimer":
			return "Einschaltdauer nach erkannter Bewegung";
		case "lightSettingsMotionActivationMode":
			return "Geschwindigkeit der Erkennung von Bewegungen";
		case "microphone":
			return "Mikrofon aktivieren";
		case "audioRecording":
			return "Audioaufzeichnung aktivieren";
		case "speaker":
			return "Lautsprecher aktivieren";
		case "speakerVolume":
			return "Lautstärke";
		case "ringtoneVolume":
			return "Klingeltonlautstärke";
		case "notificationPerson":
			return "wenn Menschen erkannt";
		case "notificationPet":
			return "wenn Haustier erkannt";
		case "notificationCrying":
			return "wenn Weinen erkannt";
		case "notificationAllSound":
			return "bei allen Geräuschen";
		case "notificationRing":
			return "wenn Türklingel betätigt";
		case "notificationMotion":
			return "wenn Bewegung erkannt";
		case "notificationRadarDetector":
			return "wenn Bewegung durch Radar erkannt";
		case "notificationAllOtherMotion":
			return "bei allen anderen Bewegungen";
		case "alarmTone":
			return "Alarmton auswählen";
		case "alarmVolume":
			return "Lautstärke Alarmton";
		case "promptVolume":
			return "Lautstärke Eingabeaufforderung";
		case "notificationSwitchModeSchedule":
			return "Moduswechsel in Modus Zeitplan";
		case "notificationSwitchModeGeofence":
			return "Moduswechsel in Modus Geofencing";
		case "notificationSwitchModeApp":
			return "Moduswechsel in Modus durch die App";
		case "notificationSwitchModeKeypad":
			return "Moduswechsel in Modus durch das Keypad";
		case "notificationStartAlarmDelay":
			return "Starten der Alarmverzögerung";
		case "timeZone":
			return "Zeitzone auswählen";
		case "timeFormat":
			return "Zeitformat auswählen";
		case "sdUsage":
			return "Speicherauslastung";
		case "sdCapacity":
			return "Speicherkapazität";
		case "sdCapacityUsed":
			return "belegter Speicher";
		case "sdCapacityAvailable":
			return "verfügbarer Speicher";
		case "rebootStation":
			return "Station neu starten";
		case "motionDetectionSensitivityMode":
			return "Erkennungsempflindlichkeit konfigurieren";
		case "motionDetectionSensitivityStandard":
			return "Erkennungsempfindlichkeit - Standard";
		case "motionDetectionSensitivityAdvancedA":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich A";
		case "motionDetectionSensitivityAdvancedB":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich B";
		case "motionDetectionSensitivityAdvancedC":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich C";
		case "motionDetectionSensitivityAdvancedD":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich D";
		case "motionDetectionSensitivityAdvancedE":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich E";
		case "motionDetectionSensitivityAdvancedF":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich F";
		case "motionDetectionSensitivityAdvancedG":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich G";
		case "motionDetectionSensitivityAdvancedH":
			return "Erkennungsempfindlichkeit - Erweitert - Bereich H";
		case "captionTimeFrom":
			return "Startzeitpunkt";
		case "captionTimeTo":
			return "Endzeitpunkt";
		case "timeUntil":
			return "bis";
		case "loiteringDetection":
			return "Erkennung von verdächtigem Verhalten aktivieren";
		case "loiteringDetectionRange":
			return "Größe des Erfassungsbereichs";
		case "loiteringDetectionLength":
			return "Dauer der Erkennung";
		case "loiteringCustomResponsePhoneNotification":
			return "Benachrichtigung über App aktivieren";
		case "loiteringCustomResponseAutoVoiceResponse":
			return "automatische Sprachausgabe aktivieren";
		case "loiteringCustomResponseAutoVoiceResponseVoice":
			return "Ansage der automatischen Sprachausgabe";
		case "loiteringCustomResponseTimespan":
			return "Zeitraum der automatischen Sprachausgabe";
		case "loiteringCustomResponseTimeFrom":
			return "Startzeitpunkt der automatischen Sprachausgabe";
		case "loiteringCustomResponseTimeTo":
			return "Endzeitpunkt der automatischen Sprachausgabe";
		case "loiteringCustomResponseHomeBaseNotification":
			return "Benachrichtigung über HomeBase aktivieren";
		case "deliveryGuard":
			return "Lieferungsüberwachung aktivieren";
		case "deliveryGuardPackageGuarding":
			return "Paketschutz aktivieren";
		case "deliveryGuardPackageGuardingVoiceResponseVoice":
			return "Ansage des Paketschutzes";
		case "deliveryGuardPackageGuardingActivatedTimespan":
			return "Zeitraum des Paketschutzes";
		case "deliveryGuardPackageGuardingActivatedTimeFrom":
			return "Startzeitpunkt des Paketschutzes";
		case "deliveryGuardPackageGuardingActivatedTimeTo":
			return "Endzeitpunkt des Paketschutzes";
		case "deliveryGuardUncollectedPackageAlert":
			return "Benachrichtigung über nicht abgeholte Pakete aktivieren";
		case "deliveryGuardUncollectedPackageAlertTimeToCheck":
			return "Überprüfungszeitpunkt auf nicht abgeholte Pakete";
		case "deliveryGuardPackageLiveCheckAssistance":
			return "Live-Überprüfung auf Pakete aktivieren";
		case "ringAutoResponse":
			return "automatische Klingel-Reaktion aktivieren";
		case "ringAutoResponseVoiceResponse":
			return "automatische Sprachausgabe aktivieren";
		case "ringAutoResponseVoiceResponseVoice":
			return "Ansage der automatischen Sprachausgabe";
		case "ringAutoResponseTimespan":
			return "Zeitraum der automatischen Sprachausgabe";
		case "ringAutoResponseTimeFrom":
			return "Startzeitpunkt der automatischen Sprachausgabe";
		case "ringAutoResponseTimeTo":
			return "Endzeitpunkt der automatischen Sprachausgabe";
		case "videoWdr":
			return "HDR aktivieren";
		case "chimeIndoor":
			return "USB Dongle als Klingel aktivieren";
		case "chimeHomebase":
			return "HomeBase als Klingel aktivieren";
		case "chimeHomebaseRingtoneVolume":
			return "Klingellautstärke der HomeBase";
		case "chimeHomebaseRingtoneType":
			return "Klingelton der HomeBase";
		case "dualCamWatchViewMode":
			return "Anzeige der beiden Kameras in der Liveanzeige und bei Aufnahmen";
		case "notification":
			return "Benachrichtigungen aktivieren";
		case "chirpTone":
			return "Benachrichtigungston auswählen"
		case "chirpVolume":
			return "Lautstärke Bestätigungstons"
		default:
			return propertyName;
	}
}

function getDeviceStateValueInGerman(state, propertyName, value)
{
	switch(state)
	{
		case "Humans only":
		case "Person Alerts":
			return "nur Menschen";
		case "Facial Alerts":
			return "nur Gesichter";
		case "All motions":
		case "All Alerts":
			return "alle Bewegungen";
		case "Person":
			return "Menschen";
		case "Pet":
			return "Haustiere";
		case "Person and Pet":
			return "Menschen und Haustiere";
		case "All other motions":
			return "alle anderen Bewegungen";
		case "Person and all other motions":
			return "Menschen und alle anderen Bewegungen";
		case "Pet and all other motions":
			return "Haustiere und alle anderen Bewegungen";
		case "Person, Pet and all other motions":
			return "Menschen, Haustiere und alle anderen Bewegungen";
		case "sec":
			return "s";
		case "Optimal Battery Life":
			return "optimale Akkulebensdauer";
		case "Balance Surveillance":
			return "ausgewogene Überwachung";
		case "Optimal Surveillance":
			return "optimale Überwachung";
		case "Custom Recording":
			return "Aufzeichnung anpassen";
		case "Battery":
			return "Batterie";
		case "Solar Panel":
			return "externes Solarpanel";
		case "Charging":
			return "ladend";
		case "Unplugged":
			return "nicht angeschlossen";
		case "Plugged":
			return "angeschlossen";
		case "Solar charging":
			return "ladend mit Solarpanel";
		case "Always":
			return "immer";
		case "Schedule":
			return "nach Zeitplan"
		case "Off":
			switch(propertyName)
			{
				case "watermark":
					if(value == 1)
					{
						return "ohne Logo";
					}
					return "aus";
				case "nightvision":
					return "keine Nachtsicht";
				case "statusLed":
					return "aus";
				default:
					return state;
			}
		case "On":
			return "mit Logo";
		case "Timestamp":
			return "Zeitstempel";
		case "Timestamp and Logo":
			return "Zeitstempel und Logo";
		case "B&W Night Vision":
			return "schwarz/weiß Nachtsicht";
		case "Color Night Vision":
			return "farbige Nachtsicht";
		case "Low":
			switch(propertyName)
			{
				case "speakerVolume":
					return "leise";
				case "videoStreamingQuality":
				case "soundDetectionSensitivity":
					return "niedrig";
				case "lightSettingsBrightnessManual":
					return "dunkel";
				case "rotationSpeed":
					return "langsam";
				default:
					return state;
			}
		case "Min":
			switch(propertyName)
			{
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "minimal";
			}
		case "Medium":
			switch(propertyName)
			{
				case "speakerVolume":
				case "videoStreamingQuality":
				case "lightSettingsBrightnessManual":
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "mittel";
				default:
					return state;
			}
		case "High":
			switch(propertyName)
			{
				case "speakerVolume":
					return "laut";
				case "videoStreamingQuality":
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "hoch";
				case "lightSettingsBrightnessManual":
					return "hell";
				default:
					return state;
			}
		case "Max":
			switch(propertyName)
			{
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "maximal";
			}
		case "Auto":
			return "automatisch";
		case "Most Efficient":
			return "am effizientesten";
		case "Include Thumbnail":
		case "With Thumbnail":
			return "mit Miniaturansicht";
		case "Full Effect":
			return "komplett";
		case "Text Only":
			return "ohne Miniaturansicht";
		case "Standard":
			return "Standard";
		case "Advanced":
			return "Erweitert";
		case "Alarm sound 1":
			return "Alarmton 1";
		case "Alarm sound 2":
			return "Alarmton 2";
		case "within 2ft":
			return "innerhalb 0,6m";
		case "within 4ft":
			return "innerhalb 1,2m";
		case "within 6ft":
			return "innerhalb 1,8m";
		case "within 8ft":
			return "innerhalb 2,4m";
		case "within 10ft":
			return "innerhalb 3,0m";
		case "Excuse me, can I help you":
			return "Entschuldigung, kann ich Ihnen helfen";
		case "Please leave it at the door":
			return "Bitte stellen Sie es an der Tür ab";
		case "We will be right there":
			return "Ich bin gleich da";
		case "Auto / Low Encoding":
			return "Streaming: automatisch; Video: niedrige Komprimierung";
		case "Low / Low Encoding":
			return "Streaming: niedrig; Video: niedrige Komprimierung";
		case "Medium / Low Encoding":
			return "Streaming: mittel; Video: niedrige Komprimierung";
		case "High / Low Encoding":
			return "Streaming: hoch; Video: niedrige Komprimierung";
		case "Auto / High Encoding":
			return "Streaming: automatisch; Video: hohe Komprimierung";
		case "Low / High Encoding":
			return "Streaming: niedrig; Video: hohe Komprimierung";
		case "Medium / High Encoding":
			return "Streaming: mittel; Video: hohe Komprimierung";
		case "High / High Encoding":
			return "Streaming: hoch; Video: hohe Komprimierung";
		case "Default":
			return "Standard";
		case "Silent":
			return "Stumm";
		case "Beacon":
			return "Beacon";
		case "Chord":
			return "Akkord";
		case "Christmas":
			return "Weihnachten";
		case "Circuit":
			return "Schaltkreis";
		case "Clock":
			return "Uhr";
		case "Ding":
			return "Klingel";
		case "Hillside":
			return "Berge";
		case "Presto":
			return "Presto";
		case "Top-Left Picture-in-Picture":
			return "Bild-in-Bild: oben links";
		case "Top-Right Picture-in-Picture":
			return "Bild-in-Bild: oben rechts";
		case "Bottom-Left Picture-in-Picture":
			return "Bild-in-Bild: unten links";
		case "Bottom-Left Picture-in-Picture":
			return "Bild-in-Bild: unten rechts";
		case "Split-view":
			return "geteilte Ansicht";
		case "Daily":
			switch(propertyName)
			{
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "tageslichtweiß";
			}
		case "Colored":
			switch(propertyName)
			{
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "farbig";
			}
		case "Dynamic":
			switch(propertyName)
			{
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "dynamisch";
			}
		case "Cold":
			switch(propertyName)
			{
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "kaltweiß";
			}
		case "Warm":
			switch(propertyName)
			{
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "warmweiß";
			}
		case "Very warm":
			switch(propertyName)
			{
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "sehr warmes weiß";
			}
		case "Aurora":
			switch(propertyName)
			{
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Polarlicht";
			}
		case "Warmth":
			switch(propertyName)
			{
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Wärme";
			}
		case "Let's Party":
			switch(propertyName)
			{
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Partylicht";
			}
		case "Fast":
			switch(propertyName)
			{
				case "lightSettingsMotionActivationMode":
					return "schnell";
			}
		case "Smart":
			switch(propertyName)
			{
				case "lightSettingsMotionActivationMode":
					return "intelligent";
			}
		case "At night":
			return "in der Nacht";
		case "All day":
			return "am ganzen Tag";
		case "None":
			return "keiner";
		case "Water":
			return "Wasser";
		case "Classic":
			return "klassisch";
		case "Light":
			return "einfach";
		default:
			return state;
	}
}

function getSdStatusMessageText(sdStatus)
{
	switch(sdStatus)
	{
		case 0:
			return `Der Speicher ist in Ordnung.`;
		case 1:
			return `Der Speicher ist nicht formatiert.`;
		case 3:
			return `Die Formatierung des Speichers ist fehlgeschlagen.`;
		case 4:
			return `Es ist keine Speicherkarte eingesetzt.`;
		case 5:
			return `Der Speicher wird formatiert.`;
		case 6:
			return `Der Speicher ist ausgelastet.`;
		case 2:
		case 7:
		case 8:
		case 9:
		case 10:
			return `Das Mounten ist fehlgeschlagen (${sdStatus}).`;
		case 11:
			return `Der Speicher wird repariert.`;
		case 12:
		case 13:
		case 14:
		case 15:
		case 16:
		case 17:
		case 18:
		case 19:
		case 20:
		case 21:
			return `Die Überprüfung des Speichers ist fehlgeschlagen (${sdStatus}).`;
		case 22:
			return `Es ist ein I/O Fehler aufgetreten.`;
		case 23:
			return `Es wurde ein Problem mit der Speicherkarte festgestellt.`;
		case 24:
			return `Der Speicher wird gemountet.`;
		default:
			return `Der Speicher hat einen unbekannten Zustand (${sdStatus}).`;
	}
}

function changeDeviceProperty(deviceId, deviceName, propertyName, propertyValue)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/setDeviceProperty/${deviceId}/${propertyName}/${propertyValue}`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateOK);
				document.getElementById("toastPropertyUpdateOKHeader").innerHTML = "Einstellungen speichern.";
				document.getElementById("toastPropertyUpdateOKText").innerHTML = "Die Einstellungen wurden erfolgreich gespeichert.";
				toast.show();
				generateDeviceSettingsModal(deviceId, deviceName)
			}
			else
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = "Einstellungen speichern.";
				document.getElementById("toastPropertyUpdateFailedText").innerHTML = "Die Einstellungen konnten nicht gespeichert werden.";
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			//document.getElementById("divModalDeviceSettingsContent").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden des Geräts.", "", "")}`;
		}
		else
		{
			generateContentDeviceSettingsModal(deviceId, deviceName);
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function updateSliderValue(element, value)
{
	document.getElementById(element).innerHTML = value;
}

function generateStationSettingsModal(stationId, stationName)
{
	generateContentStationSettingsModal(stationId, stationName);

	if(stationName === undefined)
	{
		const myModal = new bootstrap.Modal(document.getElementById('modalStationSettings'));
		myModal.show();
	}

	getTimeZones(stationId);
}

function generateContentStationSettingsModal(stationId, stationName)
{
	var stationModal =  `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalStationSettingsTitle">
								${stationName === undefined ? `<span class="placeholder col-6 bg-light placeholder-lg mt-1 mb-1"></span>` : `<div style="text-align:left; float:left;"><h5 class="mb-0">${stationName} (${stationId})</h5></div>`}
								${makeButtonElement("btnStationSettingsModalCloseTop", "btn-close", undefined, "", true, "modal", "close", true)}
							</div>
							<div class="modal-body placeholder-glow" id="divModalStationSettingsContent">
								<div class="" id="lblModalStationSettingsInfo">
									<span class="placeholder col-12 placeholder-lg"></span>
								</div>
								<div class="row text-center">
									<div class="col">
										<span id="lblStationModel">
											<span class="placeholder col-6 placeholder-lg"></span>
										</span>
									</div>
									<div class="col">
										<span id="lblStationName">
											<span class="placeholder col-6 placeholder-lg"></span>
										</span>
									</div>
								</div>
								<div class="row text-center mb-3">
									<div class="col">
										<span id="lblStationSerial">
											<h6 class="card-subtitle text-muted">
												<span class="placeholder col-8 placeholder-lg"></span>
											</h6>
										</span>
									</div>
									<div class="col">
										<span id="lblStationFirmware">
											<h6 class="card-subtitle text-muted">
												<i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;<span class="placeholder col-4 placeholder-lg"></span>
											</h6>
										</span>
									</div>
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalStationSettings").innerHTML = stationModal;
}

function getTimeZones(stationId)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getTimeZones`;
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
					getStationPropertiesMetadata(stationId, objResp.data)
				}
				else
				{
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Zeitzoneninformationen konnte nicht geladen werden.");;
				}
			}
			else
			{
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Fehler beim Laden der Zeitzoneninformationen.");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Fehler beim Laden der Zeitzoneninformationen.");
		}
		else
		{
			//document.getElementById("divModalStationSettingsContent").innerHTML = createWaitMessage("Lade Zeitzoneninformationen...");</strong></div>`;
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function getStationPropertiesMetadata(stationId, timeZones)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${stationId}`;
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
					getStationProperties(stationId, timeZones, objResp.data)
				}
				else
				{
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Kein Gerät gefunden. StationPropertiesMetadata konnte nicht geladen werden.");;
				}
			}
			else
			{
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Fehler beim Laden der StationPropertiesMetadata.");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Fehler beim Laden der StationPropertiesMetadata.");
		}
		else
		{
			//document.getElementById("divModalStationSettingsContent").innerHTML = createWaitMessage("Lade StationPropertiesMetadata...");</strong></div>`;
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function getStationProperties(stationId, timeZones, stationPropertiesMetadata)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getStationProperties/${stationId}`;
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
					fillStationSettingsModal(stationId, timeZones, stationPropertiesMetadata, objResp.modelName, objResp.isP2PConnected, objResp.data);
				}
				else
				{
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Kein Gerät gefunden. StationProperties konnte nicht geladen werden.");
				}
			}
			else
			{
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Fehler beim Laden der StationProperties.");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage("Fehler beim Laden der StationProperties.");
		}
		else
		{
			//document.getElementById("divModalStationSettingsContent").innerHTML = createWaitMessage("Lade StationProperties...");</strong></div>`;
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function generateStationModalErrorMessage(errorMessage)
{
	return `
								<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
									<div class="modal-content">
										<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalStationSettingsTitle">
											<span class="placeholder col-6 bg-light placeholder-lg mt-1 mb-1"></span>
										</div>
										<div class="modal-body placeholder-glow" id="divModalStationSettingsContent">
											<div class="" id="lblModalStationSettingsInfo">
												${createMessageContainer("alert alert-warning", errorMessage, "", "")}
											</div>
										</div>
										<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
											${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary", undefined, "Schließen", true, "modal", undefined, true)}
										</div>
									</div>
								</div>`;
}

function fillStationSettingsModal(stationId, timeZone, stationPropertiesMetadata, modelName, isP2PConnected, stationProperties)
{
	var setEventHandler = true;
	var stationModal =  `
						<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
							<div class="modal-content">
								<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalStationSettingsTitle">
									<div style="text-align:left; float:left;"><h5 class="mb-0">${stationProperties.name} (${stationId})</h5></div>
									${makeButtonElement("btnCloseModalStationSettingsTop", "btn-close", undefined, "", true, "modal", "close", true)}
								</div>
								<div class="modal-body placeholder-glow" id="divModalStationSettingsContent">
									<div class="" id="lblModalStationSettingsInfo">`;
	if(isStationOrDevicesKnown(stationProperties.model.slice(0,5)) == false)
	{
		setEventHandler = false;
		stationModal += `
										${createMessageContainer("alert alert-warning", "Diese Station wird nicht vollständig unterstützt.", `Sie können bei der Weiterentwicklung helfen, in dem Sie die Informationen der beiden Abfragen "<a href="${location.protocol}//${location.hostname}:${port}/getStationPropertiesTruncated/${stationId}" target=”_blank” class="alert-link">StationProperties</a>" und "<a href="${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${stationId}" target=”_blank” class="alert-link">StationPropertiesMetadata</a>" dem Entwickler zur Verfügung stellen.`, "Die Abfragen liefern Ergebnisse, bei denen Seriennummern eingekürzt wurden. Bitte prüfen Sie, ob weitere Daten enthalten sind, die Sie entfernen möchten.")} ${createMessageContainer("alert alert-primary", "Das Speichern der Einstellungen ist zur Zeit nicht möglich.", "", "")}`;
	}
	stationModal +=     `
									</div>
									<div class="row text-center">
										<div class="col">
											<span id="lblStationModel">
												<h5 class="card-subtitle mb-2">${modelName} <span class="text-muted">(${stationProperties.model})</span></h5>
											</span>
										</div>
										<div class="col">
											<span id="lblStationName">
												<h5 class="card-subtitle mb-2">${stationProperties.name}</h6>
											</span>
										</div>
									</div>
									<div class="row text-center mb-3">
										<div class="col">
											<span id="lblStationSerial">
												<h6 class="card-subtitle text-muted">${stationProperties.serialNumber}</h6>
											</span>
										</div>
										${generateColumnForProperty("col", "lblStationFirmware", "", `<h6 class="card-subtitle text-muted">`, `</h6>`, "bi-gear-wide-connected", "Firmwareversion", stationProperties.softwareVersion)}
									</div>`;
	if(isP2PConnected === false)
	{
		stationModal +=  `
									${createMessageContainer("alert alert-warning", "Es besteht keine P2P-Verbindung zu diesem Gerät.", "Um Einstellungen für dieses Gerät vornehmen zu können, muss die P2P-Verbindung wieder hergestellt werden.", "")}
								</div>
								<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
									${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, setEventHandler)}
								</div>
							</div>
						</div>`;
		document.getElementById("modalStationSettings").innerHTML = stationModal;
		return;
	}
	if(stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined || stationPropertiesMetadata.promptVolume !== undefined)
	{
		stationModal +=  `
									<div class="card mb-3" id="cardStationAudioSettings">
										<h5 class="card-header">Audioeinstellungen</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined)
		{
			stationModal +=  `
											<h5>Alarmton</h5>
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmTone.name, stationProperties.alarmTone, setEventHandler, stationPropertiesMetadata.alarmTone.states)}`;
			if(stationPropertiesMetadata.alarmVolume.min !== undefined)
			{
				stationModal +=  `
											${generateElementRange("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmVolume.name, stationProperties.alarmVolume, setEventHandler, stationPropertiesMetadata.alarmVolume.unit, stationPropertiesMetadata.alarmVolume.min, stationPropertiesMetadata.alarmVolume.max, stationPropertiesMetadata.alarmVolume.default)}`;
			}
			else if(stationPropertiesMetadata.alarmVolume.states !== undefined)
			{
				stationModal +=  `
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmVolume.name, stationProperties.alarmVolume, setEventHandler, stationPropertiesMetadata.alarmVolume.states)}`;
			}
		}
		if(stationPropertiesMetadata.promptVolume !== undefined)
		{
			stationModal +=  `
											${stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined ? `<hr />`: ``}
											<h5>Eingabeaufforderung</h5>
											${generateElementRange("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.promptVolume.name, stationProperties.promptVolume, setEventHandler, stationPropertiesMetadata.promptVolume.unit, stationPropertiesMetadata.promptVolume.min, stationPropertiesMetadata.promptVolume.max, stationPropertiesMetadata.promptVolume.default)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.notificationSwitchModeSchedule !== undefined || stationPropertiesMetadata.notificationSwitchModeGeofence !== undefined || stationPropertiesMetadata.notificationSwitchModeApp !== undefined || stationPropertiesMetadata.notificationSwitchModeKeypad!== undefined || stationPropertiesMetadata.notificationStartAlarmDelay !== undefined)
	{
		stationModal +=  `
									<div class="card mb-3" id="cardStationNofificationSettings">
										<h5 class="card-header">Benachrichtigungen</h5>
										<div class="card-body">
											<h5>Pushbenachrichtigungen</h5>
											<label class="mb-2" for="chkStationSwitchToSchedule">Pushbenachrichtigungen senden, bei:</label>
											${stationPropertiesMetadata.notificationSwitchModeSchedule === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeSchedule.name, stationPropertiesMetadata.notificationSwitchModeSchedule, setEventHandler)}
											${stationPropertiesMetadata.notificationSwitchModeGeofence === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeGeofence.name, stationPropertiesMetadata.notificationSwitchModeGeofence, setEventHandler)}
											${stationPropertiesMetadata.notificationSwitchModeApp === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeApp.name, stationPropertiesMetadata.notificationSwitchModeApp, setEventHandler)}
											${stationPropertiesMetadata.notificationSwitchModeKeypad === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeKeypad.name, stationPropertiesMetadata.notificationSwitchModeKeypad, setEventHandler)}
											${stationPropertiesMetadata.notificationStartAlarmDelay === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationStartAlarmDelay.name, stationPropertiesMetadata.notificationStartAlarmDelay, setEventHandler)}
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.timeZone !== undefined || stationPropertiesMetadata.timeFormat !== undefined)
	{
		stationModal +=  `
									<div class="card mb-3" id="cardStationTimeSettings">
										<h5 class="card-header">Zeiteinstellungen</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.timeZone !== undefined)
		{
			stationModal +=  `
											<h5>Zeitzone</h5>
											${generateElementSelectTimeZone("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.timeZone.name, stationProperties.timeZone, false, timeZone)}`;
		}
		if(stationPropertiesMetadata.timeFormat !== undefined)
		{
			stationModal +=  `
											${stationPropertiesMetadata.timeZone !== undefined ? `<hr />`: ``}
											<h5>Zeitformat</h5>
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.timeFormat.name, stationProperties.timeFormat, setEventHandler, stationPropertiesMetadata.timeFormat.states)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.sdCapacity !== undefined || stationPropertiesMetadata.sdCapacityAvailable !== undefined)
	{
		var conversionFactor = 1000;
		if(stationProperties.model.startsWith("T8030"))
		{
			conversionFactor = 1024;
		}
		stationModal +=  `
									<div class="card mb-3" id="cardStationStorageSettings">
										<h5 class="card-header">Speicherinformationen</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.sdCapacity !== undefined || stationPropertiesMetadata.sdCapacityAvailable !== undefined)
		{
			stationModal +=  `
											<h5>interner Speicher</h5>
											<label class="mb-1">Status</label>
											${stationProperties.sdStatus == 0 ? createMessageContainer("alert alert-success", "", getSdStatusMessageText(stationProperties.sdStatus), "") : createMessageContainer("alert alert-warning", "", `Es ist folgendes Problem mit dem internen Speicher aufgetreten:<br />${getSdStatusMessageText(stationProperties.sdStatus)}`, "Bitte überprüfen Sie die Einstellungen für den internen Speicher in der App.")}`;
			if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity >= 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable >= 0)
			{
				var sdCapacity = (stationProperties.sdCapacity/conversionFactor).toFixed(2);
				var sdCapacityAvailable = (stationProperties.sdCapacityAvailable/conversionFactor).toFixed(2);
				var sdCapacityUsed = (sdCapacity - sdCapacityAvailable).toFixed(2);
				var sdCapacityUsedPercent = (sdCapacityUsed/sdCapacity*100).toFixed(0);
				stationModal += `
											${generateElementProgress("sdUsage", sdCapacityUsedPercent)}
											<div class="row gap-3">
												<div class="col">
													<h5>${stationProperties.sdCapacity !== undefined ? sdCapacity : ""} GB</h5>
													${getPropertyNameInGerman(stationPropertiesMetadata.sdCapacity.name)}
												</div>
												<div class="col">
													<h5>${stationProperties.sdCapacity !== undefined && stationProperties.sdCapacityAvailable !== undefined ? sdCapacityUsed : ""} GB</h5>
													${getPropertyNameInGerman("sdCapacityUsed")}
												</div>
												<div class="col">
													<h5>${stationProperties.sdCapacityAvailable !== undefined ? sdCapacityAvailable : ""} GB</h5>
													${getPropertyNameInGerman(stationPropertiesMetadata.sdCapacityAvailable.name)}
												</div>
											</div>`;
			}
			else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0)
			{
				stationModal += `
											${createMessageContainer("alert alert-warning", "", `Fehler beim Abrufen der Speicherauslastung.`, "Bitte überprüfen Sie die Speicherauslastung des internen Speichers in der App.")}`;
			}
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	stationModal +=  `
									${makeButtonElement("btnStationReboot", "btn btn-outline-danger", `changeStationProperty('${stationProperties.serialNumber}', '${stationProperties.name}', 'rebootStation')`, "Station neu starten", true, undefined, undefined, setEventHandler)}`;
	stationModal +=  `
								</div>
								<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
									${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined, setEventHandler)}
								</div>
							</div>
						</div>`;
	
	document.getElementById("modalStationSettings").innerHTML = stationModal;
}

function changeStationProperty(stationId, stationName, propertyName, propertyValue)
{
	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/setStationProperty/${stationId}/${propertyName}${propertyValue !== undefined ? `/${propertyValue}` : ``}`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success == true)
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateOK);
				if(propertyName == "rebootStation")
				{
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = "Station neu starten.";
					document.getElementById("toastPropertyUpdateOKText").innerHTML = "Die Station startet neu. Dies kann einige Minuten dauern.";
				}
				else
				{
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = "Einstellungen speichern.";
					document.getElementById("toastPropertyUpdateOKText").innerHTML = "Die Einstellungen wurden erfolgreich gespeichert.";
				}
				toast.show();
				generateStationSettingsModal(stationId, stationName)
			}
			else
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				if(propertyName == "rebootStation")
				{
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = "Station neu starten.";
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = "Die Station konnte nicht neu gestartet werden.";
				}
				else
				{
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = "Einstellungen speichern.";
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = "Die Einstellungen konnten nicht gespeichert werden.";
				}
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			//document.getElementById("divModalStationSettingsContent").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-danger", "Fehler beim Laden des Geräts.", "", "")}`;
		}
		else
		{
			generateContentStationSettingsModal(stationId, stationName);
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
	var xmlHttp, objResp, station = "", stations = "", buttons = "", text = "", state, lastChangeTime;
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
					state = `${getGuardModeAsString(objResp.data[station].guardMode)}`;
					buttons =  `<div class="row g-2">`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnArm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 0 ? undefined : `setArm('${objResp.data[station].serialNumber}')`}` , "ab&shy;we&shy;send", (objResp.data[station].guardMode != 0), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 1 ? undefined : `setHome('${objResp.data[station].serialNumber}')`}`, "zu Hause", (objResp.data[station].guardMode != 1), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 2 ? undefined : `setSchedule('${objResp.data[station].serialNumber}')`}`, "Zeit&shy;steu&shy;e&shy;rung", (objResp.data[station].guardMode != 2), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnDisarm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 63 ? undefined : `setDisarm('${objResp.data[station].serialNumber}')`}`, "de&shy;ak&shy;ti&shy;viert", (objResp.data[station].guardMode != 63), undefined, undefined, true)}</div>`;
					if(objResp.data[station].deviceType == "indoorcamera" && objResp.data[station].model == "T8410")
					{
						buttons += `<div class="col-sm-12">${makeButtonElement(`btnPrivacy${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setPrivacy('${objResp.data[station].serialNumber}', ${objResp.data[station].privacyMode === true ? `true` : `false`})`, `${objResp.data[station].privacyMode === true ? `ein&shy;schal&shy;ten` : `aus&shy;schal&shy;ten`}`, true, undefined, undefined, true)}</div>`;
					}
					buttons += `</div>`;
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
						lastChangeTime = "unbekannt";
					}
					else
					{
						lastChangeTime = "nicht verfügbar";
					}
					stations += createCardStation(objResp.data[station], false, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0 mb-1"><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="bi-shield" title="aktueller Status"></i>&nbsp;${objResp.data[station].privacyMode === undefined || objResp.data[station].privacyMode == false ? getGuardModeAsString(objResp.data[station].guardMode) : "ausgeschaltet"}</span></div></div><div class="card-text d-grid gap-2">${buttons}</div></div>`, `<small class="text-muted">letzer Statuswechsel: ${lastChangeTime}</small>`);
				}
				text += createStationTypeCardsContainer("Stationen", "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3", stations);
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
				document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Stationen.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("btnArmAll").setAttribute("disabled", true);
			document.getElementById("btnHomeAll").setAttribute("disabled", true);
			document.getElementById("btnScheduleAll").setAttribute("disabled", true);
			document.getElementById("btnDisarmAll").setAttribute("disabled", true);
			document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">letzer Statuswechsel: unbekannt</small>`;
			document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Stationen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
		document.getElementById("btnArmAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;ab&shy;we&shy;send`;
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
		document.getElementById("btnArm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;ab&shy;we&shy;send`;
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
		document.getElementById("btnHomeAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;zu Hause`;
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
		document.getElementById("btnHome" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;zu Hause`;
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
		document.getElementById("btnScheduleAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;Zeit&shy;steu&shy;e&shy;rung`;
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
		document.getElementById("btnSchedule" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;Zeit&shy;steu&shy;e&shy;rung`;
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
		document.getElementById("btnDisarmAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;de&shy;ak&shy;ti&shy;viert`;
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
		document.getElementById("btnDisarm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;de&shy;ak&shy;ti&shy;viert`;
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

function setPrivacy(stationserial, enabled)
{
	if(stationserial=="")
	{
		const toast = new bootstrap.Toast(toastFailed);
		toast.show();
		loadDataStatechange(false);
	}
	else
	{
		document.getElementById("btnPrivacy" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${enabled === true ? `ein&shy;schal&shy;ten` : `aus&shy;schal&shy;ten`}`;
		var xmlHttp, objResp;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationserial}/${enabled === false ? `privacyOn` : `privacyOff`}`;
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

function activateUIElements()
{
	document.getElementById("cardEufySecurityAccountData").classList.remove("collapse");
	document.getElementById("cardEufySecurityConfig").classList.remove("collapse");
	document.getElementById("containerBtnSave").classList.remove("collapse");
	document.getElementById("cardSystemVariables").classList.remove("collapse");
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

function generateNewTrustedDeviceName()
{
	var xmlHttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/generateNewTrustedDeviceName`;
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
					if(objResp.trustedDeviceName !== undefined)
					{
						document.getElementById('txtTrustedDeviceName').value = objResp.trustedDeviceName;
					}
				}
			}
			catch (e)
			{

			}
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function loadCountries()
{
	var xmlHttp, objResp, country;
	var url = `${location.protocol}//${location.hostname}:${port}/getCountries`;
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
					for(country in objResp.data)
					{
						var option = document.createElement("option");
						option.value=objResp.data[country].countryCode;
						option.text=objResp.data[country].countryName;
						document.getElementById("cbCountry").add(option);
					}
					document.getElementById("countrySelectionMessage").innerHTML = "";
					loadHouses();
				}
				else
				{
					document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Länder.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
					loadHouses();
				}
			}
			catch (e)
			{
				document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Länder.", "", `Es ist folgender Fehler aufgetreten: ${e}`);
				loadHouses();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Länder.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
			loadHouses();
		}
		else
		{
			document.getElementById("resultLoading").innerHTML = createWaitMessage("Laden der Einstellungen...");
			document.getElementById("countrySelectionMessage").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Länder...</strong></div>`;
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function loadHouses()
{
	var xmlHttp, objResp, house;
	var url = `${location.protocol}//${location.hostname}:${port}/getHouses`;
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
					for(house in objResp.data)
					{
						var option = document.createElement("option");
						option.value=objResp.data[house].houseId;
						option.text=`Stationen und Geräte von '${objResp.data[house].houseName}'`;
						document.getElementById("cbHouseSelection").add(option);
					}
					document.getElementById("houseSelectionMessage").innerHTML = "";
					loadStationsSettings();
				}
				else
				{
					document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Häuser.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
					loadStationsSettings();
				}
			}
			catch (e)
			{
				document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Häuser.", "", `Es ist folgender Fehler aufgetreten: ${e}`);
				loadStationsSettings();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Häuser.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
			loadStationsSettings();
		}
		else
		{
			document.getElementById("resultLoading").innerHTML = createWaitMessage("Laden der Einstellungen...");
			document.getElementById("houseSelectionMessage").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>Laden der Häuser...</strong></div>`;
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
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
						stations += `<div class="form-label-group was-validated" class="container-fluid"><label class="my-2" for="txtUdpPortsStation${objResp.data[station].serialNumber}">UDP Port für Verbindung mit der Station ${objResp.data[station].serialNumber} (${objResp.data[station].name}).</label>`;
						stations += `<input type="text" name="udpPortsStation${objResp.data[station].serialNumber}" id="txtUdpPortsStation${objResp.data[station].serialNumber}" class="form-control" placeholder="UDP Port ${objResp.data[station].serialNumber}" onfocusout="checkUDPPorts(udpPortsStation${objResp.data[station].serialNumber})" required>`;
						stations += `<small class="form-text text-muted">Der angegebene Port darf nicht in Verwendung und keiner anderen Station zugeordnet sein.</small>`;
						stations += `<div class="invalid-feedback">Bitte geben Sie eine Zahl zwischen 1 und 65535 ein. Diese Zahl darf keiner anderen Station zugeordnet sein.</div></div>`;
					}
					document.getElementById('chkUseUdpStaticPorts').removeAttribute("disabled");
					document.getElementById("useUDPStaticPortsStations").innerHTML = stations;
					loadSystemVariables();
				}
				else
				{
					document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
					document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
					loadSystemVariables();
				}
			}
			catch (e)
			{
				document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.", "", `Es ist folgender Fehler aufgetreten: ${e}`);
				document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
				loadSystemVariables();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
			document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
			loadSystemVariables();
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
	var xmlHttp, objResp;
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
					document.getElementById('txtUsername').value = objResp.data.eMail;
					document.getElementById('txtPassword').value = objResp.data.password;
					if(objResp.data.country === undefined || objResp.data.country == "")
					{
						document.getElementById("cbCountry").selectedIndex = "";
					}
					else
					{
						document.getElementById("cbCountry").value = objResp.data.country;
					}
					if(objResp.data.language === undefined || objResp.data.language == "")
					{
						document.getElementById("cbLanguage").selectedIndex = "";
					}
					else
					{
						document.getElementById("cbLanguage").value = objResp.data.language;
					}
					document.getElementById('txtTrustedDeviceName').value = objResp.data.trustedDeviceName;
					if(objResp.data.httpActive == true)
					{
						document.getElementById("chkUseHttp").setAttribute("checked", true);
						document.getElementById("txtPortHttp").removeAttribute("disabled");
					}
					else
					{
						document.getElementById("txtPortHttp").setAttribute("disabled", true);
					}
					document.getElementById('txtPortHttp').value = objResp.data.httpPort;
					if(objResp.data.httpsActive == true)
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
					document.getElementById('txtPortHttps').value = objResp.data.httpsPort;
					document.getElementById('txtHttpsKeyFile').value = objResp.data.httpsPKeyFile;
					document.getElementById('txtHttpsCertFile').value = objResp.data.httpsCertFile;
					if(objResp.data.acceptInvitations == true)
					{
						document.getElementById("chkAcceptInvitations").setAttribute("checked", true);
					}
					if(objResp.data.houseId === undefined)
					{
						document.getElementById("cbHouseSelection").selectedIndex = 0;
					}
					else
					{
						document.getElementById("cbHouseSelection").value = objResp.data.houseId;
					}
					if(objResp.data.connectionTypeP2p === undefined || (objResp.data.connectionTypeP2p != "0" && objResp.data.connectionTypeP2p != "1" && objResp.data.connectionTypeP2p != "2"))
					{
						document.getElementById("cbConnectionType").selectedIndex = 0;
					}
					else
					{
						document.getElementById("cbConnectionType").value = objResp.data.connectionTypeP2p;
					}
					if(objResp.data.systemVariableActive == true)
					{
						document.getElementById("chkUseSystemVariables").setAttribute("checked", true);
					}
					if(objResp.data.localStaticUdpPortsActive == true)
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
							var tempPorts;
							var portItem;
							for(var portItem in objResp.data.localStaticUdpPorts)
							{
								if(objResp.data.localStaticUdpPorts[portItem].stationSerial == tempSerial)
								{
									tempPorts = objResp.data.localStaticUdpPorts[portItem].port;
									break;
								}
							}
							if(tempPorts === undefined || tempPorts == null || tempPorts == "undefined")
							{
								document.getElementById('txtUdpPortsStation' + tempSerial).value = "";
							}
							else
							{
								document.getElementById('txtUdpPortsStation' + tempSerial).value = tempPorts;
							}
							changeValue("useUdpStaticPorts");
							if(objResp.data.localStaticUdpPortsActive == false)
							{
								document.getElementById('txtUdpPortsStation' + tempSerial).setAttribute("disabled", true);
							}
						}
					}
					document.getElementById('txtDefaultImagePath').value = objResp.data.cameraDefaultImage;
					document.getElementById('txtDefaultVideoPath').value = objResp.data.cameraDefaultVideo;
					if(objResp.data.stateUpdateEventActive == true)
					{
						document.getElementById("chkUpdateStateEvent").setAttribute("checked", true);
					}
					else
					{
						document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
					}
					if(objResp.data.stateUpdateIntervallActive == true)
					{
						document.getElementById("chkUpdateStateIntervall").setAttribute("checked", true);
						document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
					}
					else
					{
						document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
					}
					document.getElementById('txtUpdateStateIntervallTimespan').value=objResp.data.stateUpdateIntervallTimespan;
					if(objResp.data.updateLinksActive == true)
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
					if(objResp.data.updateLinksOnlyWhenArmed == true)
					{
						document.getElementById("chkUpdateLinksOnlyWhenActive").setAttribute("checked", true);
					}
					document.getElementById('txtUpdateLinksIntervallTimespan').value = objResp.data.updateLinksTimespan;
					if(objResp.data.pushServiceActive == true)
					{
						document.getElementById("chkUsePushService").setAttribute("checked", true);
					}
					if(objResp.data.logLevel === undefined || !(objResp.data.logLevel == "0" || objResp.data.logLevel == "1" || objResp.data.logLevel == "2" || objResp.data.logLevel == "3"))
					{
						document.getElementById("cbLogLevel").selectedIndex = 0;
					}
					else
					{
						document.getElementById("cbLogLevel").selectedIndex = (Number.parseInt(objResp.data.logLevel)) + 1;
					}
					if(objResp.data.tokenExpire === undefined)
					{
						document.getElementById("spnToken").innerHTML = ``;
					}
					else
					{
						if(objResp.data.tokenExpire == 0)
						{
							document.getElementById("spnToken").innerHTML = `Es ist kein Token gespeichert. Beim nächsten erfolgreichen Login wird ein neues Token erzeugt.<br />`;
						}
						else if(objResp.data.tokenExpire.toString().length == 10 || objResp.data.tokenExpire.toString().length == 13)
						{
							document.getElementById("spnToken").innerHTML = `Das zur Zeit genutzte Token läuft am ${objResp.data.tokenExpire.toString().length == 10 ? makeDateTimeString(new Date(objResp.data.tokenExpire*1000)) : makeDateTimeString(new Date(objResp.data.tokenExpire))} ab. Es wird vorher aktualisiert.<br />`;
						}
						else
						{
							document.getElementById("spnToken").innerHTML = `Der Ablaufzeitpunkt des Tokens ist unbekannt ('${objResp.data.tokenExpire}').<br />`;
						}
					}
					checkLogLevel(objResp.data.logLevel);
					document.getElementById("resultLoading").innerHTML = "";
					activateUIElements();
					enableUIElements();
				}
				else
				{
					document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Einstellungen.", "", `Rückgabewert 'success' ist 'false'.`);
				}
			}
			catch (e)
			{
				document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Einstellungen.", "", `Es ist folgender Fehler aufgetreten: ${e}`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Einstellungen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
	var xmlHttp, objResp, systemVariable, sysVarName, sysVarInfo, sysVarAvailable, sysVarTable = "", sysVarDeprTable = "";
	var sysVarToDelete = false;
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
					document.getElementById("divSystemVariablesHint").innerHTML = createMessageContainer("alert alert-primary fade show", "Option 'Systemvariablen bei API Aktionen automatisch aktualisieren' ist aktiviert.", "Das AddOn wird die entsprechenden Systemvariablen aktualisieren. In der folgenden Tabelle finden Sie alle Systemvariablen, die dieses AddOn auf der CCU benötigt. Wenn die jeweilige Zeile grün ist, ist die Systemvariable auf der CCU bereits angelegt, ansonsten ist die Zeile rot.</br >Falls Systemvariablen gefunden werden, die mit 'eufy' beginnen und nicht mehr benötigt werden (beispielsweise für gelöschte Geräte), erscheinen diese in einer zweiten Tabelle. Dort können diese Systemvariablen gelöscht werden.", "Bitte achten Sie darauf, dass alle Systemvariablen angelegt sind. Wenn Sie die Aktualisierung der Systemvariablen nicht wünschen, deaktivieren Sie bitte die Option 'Systemvariablen bei API Aktionen automatisch aktualisieren'.");
					sysVarTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">Status</th><th scope="col" style="width: 75%;">Name der Systemvariable</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
					for(systemVariable in objResp.data)
					{
						sysVarName = objResp.data[systemVariable].sysVarName;
						sysVarInfo = objResp.data[systemVariable].sysVarInfo;
						sysVarAvailable = objResp.data[systemVariable].sysVarAvailable;
						if(objResp.data[systemVariable].sysVarCurrent==true)
						{
							if(sysVarAvailable==true)
							{
								sysVarTable += `<tr class="table-success"><th scope="row" class="align-middle text-center"><i class="bi-check-lg" title="angelegt"></i></th>`;
							}
							else
							{
								sysVarTable += `<tr class="table-danger"><th scope="row" class="align-middle text-center"><i class="bi-x-lg" title="nicht angelegt"></i></th>`;
							}
							sysVarTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
							if(sysVarAvailable==true)
							{
								sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", undefined, "System&shy;variable anlegen", false, undefined, undefined, false)}</div></td>`;
							}
							else
							{
								sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `createSysVar('${sysVarName}', '${sysVarInfo}')`, "System&shy;variable anlegen", true, undefined, undefined, true)}</div></td>`;
							}
							sysVarTable += `</tr>`;
						}
						else
						{
							if(sysVarToDelete==false)
							{
								sysVarDeprTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">Status</th><th scope="col" style="width: 75%;">Name der Systemvariable</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
							}
							sysVarToDelete = true;
							sysVarDeprTable += `<tr class="table-danger"><th scope="row" class="align-middle text-center"><i class="bi-check-lg" title="angelegt"></i></th>`;
							sysVarDeprTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
							sysVarDeprTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `removeSysVar('${sysVarName}')`, "System&shy;variable ent&shy;fernen", true, undefined, undefined, true)}</div></td>`;
							sysVarDeprTable += `</tr>`;
						}
					}
					sysVarTable += `</tbody></table>`;
					document.getElementById("divSystemVariables").innerHTML = sysVarTable;
					if(sysVarToDelete==true)
					{
						sysVarDeprTable += `</tbody></table>`;
						document.getElementById("divDeprecatedSystemVariables").innerHTML = sysVarDeprTable;
						document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = `<hr /><div class="form-label-group" class="container-fluid"><label for="btnShowDeprecatedSystemVariables" class="mb-2">Veraltete Systemvariablen<br /><small class="form-text text-muted">Die nachfolgenden mit 'eufy' beginnenden Systemvariablen werden nicht mehr genutzt und können entfernt werden.</small></label></div>`;
					}
				}
				else
				{
					if(objResp.reason == "System variables in config disabled.")
					{
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-info mb-0", "Keine Systemvariablen.", "Die Aktualisierung von Systemvariablen bei API Aktionen ist deaktiviert.", "Aktivieren Sie die Einstellung 'Systemvariablen bei API Aktionen automatisch aktualisieren', wenn Sie mit den Systemvariablen arbeiten möchten.");
					}
					else
					{
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: '${objResp.reason}'.`);
					}
				}
				loadDataSettings();
			}
			catch (e)
			{
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
				loadDataSettings();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
			loadDataSettings();
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
	var xmlHttp, objFD, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/setConfig`;
	xmlHttp = new XMLHttpRequest();
	objFD = new FormData(document.getElementById("configform"));
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
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					if(objResp.serviceRestart == true)
					{
						document.getElementById("resultMessage").innerHTML = "";
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
				document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Speichern der Einstellungen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Speichern der Einstellungen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
		}
		else
		{
			document.getElementById("resultMessage").innerHTML = createWaitMessage("Einstellungen werden gespeichert...");
		}
	};
	xmlHttp.open("POST", url);
	xmlHttp.send(objFD);
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
					document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
					document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
					document.getElementById("divSystemVariablesHint").innerHTML = "";
					document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
				}
			}
			catch (e)
			{
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
		}
		else
		{
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = createWaitMessage("Laden der Systemvariablen...");
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function removeSysVar(varName)
{
	var xmlHttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/removeSystemVariable/${varName}`;
	console.log(url);
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
					document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
					document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
					document.getElementById("divSystemVariablesHint").innerHTML = "";
					document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der veralteten Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
				}
			}
			catch (e)
			{
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der veralteten Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der veralteten Systemvariablen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
		}
		else
		{
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = createWaitMessage("Laden der veralteten Systemvariablen...");
		}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function selectedFile(filetype)
{
	switch(filetype)
	{
		case "conf":
			if(document.getElementById("btnSelectConfigFile").value === undefined || document.getElementById("btnSelectConfigFile").value !== "")
			{
				if(document.getElementById("btnSelectConfigFile").files[0].size > 500000)
				{
					document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Hochladen der Konfigurationsdatei.", "Die ausgewählte Datei ist zu groß.", "");
					document.getElementById("btnSelectConfigFile").value = "";
					return;
				}
				document.getElementById("resultUploadMessage").innerHTML = "";
				document.getElementById("btnUploadConfigFile").removeAttribute("disabled");
			}
			break;
	}
}

async function uploadFile(filetype)
{
	var xmlHttp, objFD, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/uploadConfig`;
	xmlHttp = new XMLHttpRequest();
	objFD = new FormData();
	objFD.append("file", document.getElementById("btnSelectConfigFile").files[0]);
	xmlHttp.addEventListener("load", function(event)
	{
		//
	});
	xmlHttp.addEventListener("error", function(event)
	{
		document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Hochladen der Konfigurationsdatei.", "", `Die ausgewählte Datei ist zu groß.`);
		const toast = new bootstrap.Toast(toastUploadConfigFailed);
		toast.show();
		document.getElementById("btnSelectConfigFile").value = "";
		document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
	});
	xmlHttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			try
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true && objResp.serviceRestart == true)
				{
					document.getElementById("resultUploadMessage").innerHTML = "";
					window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
					return;
				}
				else
				{
					document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Hochladen der Konfigurationsdatei.", "Die Konfigurationsdatei ist fehlerhaft.", `Es ist folgender Fehler aufgetreten: ${objResp.message}`);
					const toast = new bootstrap.Toast(toastUploadConfigFailed);
					toast.show();
					document.getElementById("btnSelectConfigFile").value = "";
					document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
				}
			}
			catch (e)
			{
				document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Hochladen der Konfigurationsdatei.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
				document.getElementById("btnSelectConfigFile").value = "";
				document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Speichern der Einstellungen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
			document.getElementById("btnSelectConfigFile").value = "";
			document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
		}
		else
		{
			document.getElementById("resultUploadMessage").innerHTML = createWaitMessage("Datei wird hochgeladen und überprüft...");
			document.getElementById("btnSelectConfigFile").value = "";
			document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
		}
	};
	xmlHttp.open("POST", url);
	xmlHttp.send(objFD);
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
	switch(element.name)
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
						errorMessage = "Sie haben einen Port eingegeben, der bereits für eine andere Station oder ein anderes Gerät eingegeben wurde.<br /><br />Die Eingabe wird nun gelöscht.";
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
					document.getElementById("log").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler beim Laden der Protokolldatei.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
					break;
				case "err":
					document.getElementById("err").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler beim Laden der Fehlerprotokolldatei.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
				info = `eufy Security AddOn: ${objResp.apiVersion}<br />eufy Security Client: ${objResp.eufySecurityClientVersion}<br />HomeMatic API: ${objResp.homematicApiVersion}<br />Webseite: ${version}`;
				document.getElementById("versionInfo").innerHTML = info;
			}
			else
			{
				document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Versionsinformationen.", "", "");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Versionsinformationen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
	if(action == "captcha")
	{
		document.getElementById("divHeading").innerHTML = `<h2>Loginversuch wird durchgeführt</h2>`;
		document.getElementById("divContentText").innerHTML = `<p>Bitte warten Sie, wärend der Captcha-Code überprüft wird. Sie werden anschließend auf die vorherige Seite weitergeleitet.</p>`;
		checkServiceState(0, 0, 0);
	}
	else
	{
		document.getElementById("divHeading").innerHTML = `<h2><h2>Service wird neu gestartet</h2></h2>`;
		document.getElementById("divContentText").innerHTML = `<p>Bitte warten Sie, wärend der Service neu gestartet wird. Sie werden anschließend auf die vorherige Seite weitergeleitet.</p>`;
		const toast = new bootstrap.Toast(toastRestartOK);
		toast.show();
		await delay(7500);
		checkServiceState(0, 0, 0);
	}
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
							var startDone = "";
							if(action == "captcha")
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service läuft.</div>`;
							}
							else
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde gestartet.</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha")
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">Warte auf Loginversuch...</div>`;
							}
							else
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">Warte auf Initialisierung des Services...</div>`;
							}
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
							var startDone = "";
							if(action == "captcha")
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service läuft.</div>`;
							}
							else
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde gestartet.</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha")
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">Warte auf Loginversuch...</div>`;
							}
							else
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">Warte auf Initialisierung des Services...</div>`;
							}
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
							var startDone = "";
							if(action == "captcha")
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service läuft.</div>`;
							}
							else
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde gestartet.</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initDone = "";
							if(action == "captcha")
							{
								initDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Loginversuch beendet. Sie werden nun weitergeleitet...</div>`;
							}
							else
							{
								initDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">Service wurde initializiert. Sie werden nun weitergeleitet...</div>`;
							}
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