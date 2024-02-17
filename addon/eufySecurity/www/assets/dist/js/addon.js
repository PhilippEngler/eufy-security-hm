/**
 * Javascript for eufySecurity Addon
 * 20240217
 */
action = "";
port = "";
redirectTarget = "";
version = "3.0.0";

/**
 * common used java script functions
 */
//#region common
function loadScript(url, async, page)
{
	var scriptElement = document.createElement("script");
	scriptElement.setAttribute("src", url);
	scriptElement.setAttribute("async", async);
	document.body.appendChild(scriptElement);
	
	// success event
	scriptElement.addEventListener("load", () => {
		translateNavbar();
		translateStaticPageContent(page);
		init(page);
	});
	// error event
	scriptElement.addEventListener("error", (ev) => {
		alert("Error on loading file", ev);
	});
}

function start(page)
{
	loadScript(`assets/dist/js/lang/${getLanguage()}.js`, false, page);
}

function init(page)
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
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortInactiveHeader", location.protocol.replace(":", "")), "", translateMessages("messageApiPortInactiveSubText", location.protocol == "http:" ? "https-" : "http-"));
			}
			catch (e)
			{
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortFileNotFoundHeader"), translateMessages("messageApiPortFileNotFoundMessageText"), translateMessages("messageErrorPrintErrorMessage", e));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortFileNotFoundHeader"), translateMessages("messageApiPortFileNotFoundMessageText"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
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
				document.getElementById("captchaMessage").innerHTML = `${createMessageContainer("alert alert-danger", translateMessages("messageCaptchaErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
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
								<div style="text-align:left; float:left;"><h5 class="mb-0">${translateContent("lblCaptchaHeader")}</h5></div>
							</div>
							<div class="modal-body placeholder-glow" id="divModalCaptchaCodeContent">
								<h5 id="captchaHint"></h5>
								<div class="my-3" id="captchaImage"></div>
								<div class="my-3" id="captchaCode"></div>
								<div class="mt-3" id="captchaButton"></div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
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
					document.getElementById("captchaHint").innerHTML = translateContent("lblCaptchaHint");
					document.getElementById("captchaImage").innerHTML = `<label class="my-2" for="txtCaptchaCode">Captcha.</label><br /><img src="${objResp.captcha.captcha}" alt="Captcha">`;
					document.getElementById("captchaCode").innerHTML = `<label class="my-2" for="txtCaptchaCode">${translateContent("lblCaptchaCode")}</label><input type="text" class="form-control" id="txtCaptchaCode">`;
					document.getElementById("captchaButton").innerHTML = `<input id="btnSubmitCaptcha" onclick="setCaptchaCode('${page}')" class="btn btn-primary" type="button" value="${translateContent("btnCaptchaSubmit")}">`;
					document.getElementById("btnCloseModalDeviceSettingsBottom").setAttribute("disabled", true);
				}
				else
				{
					document.getElementById("captchaHint").innerHTML = translateContent("lblCaptchaNotAvailable");
					document.getElementById("btnCloseModalDeviceSettingsBottom").removeAttribute("disabled");
				}
			}
			else
			{
				document.getElementById("captchaHint").innerHTML = `${createMessageContainer("alert alert-danger", translateMessages("messageCaptchaError"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("captchaHint").innerHTML = `${createMessageContainer("alert alert-danger", translateMessages("messageCaptchaError"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState))}`;
		}
		else
		{
			document.getElementById("captchaHint").innerHTML = createWaitMessage(translateContent(lblWaitMessageCaptcha));
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
				document.getElementById("captchaHint").innerHTML = `${createMessageContainer("alert alert-danger", translateMessages("messageCaptchaSendError"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("captchaHint").innerHTML = `${createMessageContainer("alert alert-danger", translateMessages("messageCaptchaSendError"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState))}`;
		}
		else
		{
			document.getElementById("captchaHint").innerHTML = createWaitMessage(translateContent("lblWaitMessageSendCaptcha"));
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
			url = `logfileAddonLogDownload.cgi`;
			break;
		case "err":
			url = `logfileAddonErrDownload.cgi`;
			break;
		case "clientLog":
			url = `logfileClientDownload.cgi`;
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
	card += `<div style="text-align:right;"><h5 class="mb-0">${station.isP2PConnected === false ? `<i class="bi-exclamation-triangle" title="${translateContent("titleNoP2PConnection")}"></i>&nbsp;&nbsp;` : ""}${showSettingsIcon === true ? `<i class="bi-gear" title="${translateContent("titleSettings")}" onclick="generateStationSettingsModal('${station.serialNumber}')"></i>` : ""}</h5></div>`;
	card += `</div>`;
	
	card += `<div class="card-body p-0"><div class="row g-0">`;
	card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${station.modelName} (${station.model})</div></div>`;
	card += `<div class="col-md-8 px-2 py-3">`;
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
	return `<div class="${classText}" role="alert">${messageHeader != "" ? `<h5 class="mb-1 alert-heading">${messageHeader}</h5>` : ""}${messageText != "" ? `<p class="mb-0">${messageText}</p>` : ""}${messageSubText === undefined || messageSubText === "" ? "" : `<hr><p class="my-0 form-text text-muted">${messageSubText}</p>`}</div>`;
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
							stations += createCardStation(objResp.data[station], true, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0">${generateColumnForProperty("col mb-0 pe-1", "spnFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), objResp.data[station].softwareVersion)}${generateColumnForProperty("col mb-0 pe-1", "spnCurrentGuardMode", "text-nowrap", "", "", "bi-shield", translateContent("lblCurrentState"), `${objResp.data[station].privacyMode === undefined || objResp.data[station].privacyMode == false ? translateGuardMode(objResp.data[station].guardMode) : translateContent("lblPrivacy")}`)}</div>`, `<small class="text-muted">${translateContent("lblIpAddress")}: ${objResp.data[station].lanIpAddress} (${objResp.data[station].wanIpAddress})</small></div>`);
						}
					}
					text += createStationTypeCardsContainer(translateContent("lblStations"), "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3", stations);
					document.getElementById("stations").innerHTML =  text;
				}
				else
				{
					document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-primary", translateMessages("messageNoStationsFoundHeader"), translateMessages("messageNoStationsFoundMessage"), translateMessages("messageNoStationsFoundSubText"))}`;
				}
			}
			else
			{
				document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingStationsHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingStationsHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState))}`;
		}
		else
		{
			document.getElementById("stations").innerHTML = createWaitMessage(translateContent("lblWaitMessageLoadStations"));
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
					text += createDeviceTypeCardsContainer("cameras", translateContent("lblCameras"), cams);
					text += createDeviceTypeCardsContainer("indoorcameras", translateContent("lblIndoorCameras"), indoorcams);
					text += createDeviceTypeCardsContainer("solocameras", translateContent("lblSoloCameras"), solocams);
					text += createDeviceTypeCardsContainer("starlight4glte", translateContent("lblStarlightCameras"), solocams);
					text += createDeviceTypeCardsContainer("doorbellcameras", translateContent("lblDoorbellCameras"), doorbellcams);
					text += createDeviceTypeCardsContainer("outdoorlights", translateContent("lblOutdoorLightCameras"), outdoorlights);
					text += createDeviceTypeCardsContainer("locks", translateContent("lblLocks"), locks);
					text += createDeviceTypeCardsContainer("keypads", translateContent("lblKeypads"), keypads);
					text += createDeviceTypeCardsContainer("sensors", translateContent("lblSensors"), sensors);
					text += createDeviceTypeCardsContainer("unknown", translateContent("lblUnknownDevice"), unknown);
					document.getElementById("devices").innerHTML =  text;
				}
				else
				{
					document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-primary", translateMessages("messageNoDevicesFoundHeader"), translateMessages("messageNoDevicesFoundMessage"), translateMessages("messageNoDevicesFoundSubText"))}`;
				}
			}
			else
			{
				document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingDevicesHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingDevicesHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState))}`;
		}
		else
		{
			document.getElementById("devices").innerHTML = createWaitMessage(translateContent("lblWaitMessageLoadDevices"));
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function createCardDevice(device)
{
	var card = "";

	card += `<div class="col"><div class="card">`;
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${device.name}</h5></div>`;
	card += `<div style="text-align:right;"><h5 class="mb-0">${device.enabled === false ? `<i class="bi-power" title="${translateContent("titleDeviceDisabled")}"></i>&nbsp;&nbsp;` : ""}${device.isStationP2PConnected === false ? `<i class="bi-exclamation-triangle" title="${translateContent("titleNoP2PConnection")}"></i>&nbsp;&nbsp;` : ""}${device.state === 0 ? `<i class="bi-exclamation-triangle" title="${translateContent("titleDeactivatedOffline")}"></i>&nbsp;&nbsp;` : device.state === 2 ? `<i class="bi-exclamation-triangle" title="${translateContent("titleDeactivatedLowBattery")}"></i>&nbsp;&nbsp;` : ""}${device.wifiSignalLevel === undefined || device.wifiRssi === undefined ? "" : `<i class="${getWifiSignalLevelIcon(device.wifiSignalLevel, device.wifiRssi)}" title="${translateContent("titleWifiSignalLevel")}: ${device.wifiRssi}dB"></i>&nbsp;&nbsp;`}<i class="bi-gear" title="${translateContent("titleSettings")}" onclick="${device.serialNumber == device.stationSerialNumber ? `generateStationDeviceSettingsSelectionModal('${device.serialNumber}','${device.name}')` : `generateDeviceSettingsModal('${device.serialNumber}')`}"></i></h5></div></div>`;

	card += `<div class="card-body p-0"><div class="row g-0">`;
	card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${device.modelName} (${device.model})</div></div>`;
	card += `<div class="col-md-8 px-2 py-3">`;

	card += `<h6 class="card-subtitle mb-2 text-muted">${device.modelName}</h6>`;
	card += `<p class="card-text mb-1">${device.serialNumber}</p>`;
	card += `<div class="row g-0">`;
	if(device.softwareVersion !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnDeviceFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), device.softwareVersion);
	}
	if(device.battery !== undefined || device.batteryLow !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnBattery", "text-nowrap", "", "", device.chargingStatus === 1 || device.chargingStatus === 4 ? "bi-battery-charging" : "bi-battery", translateContent("lblBatteryLevel"), device.battery !== undefined ? device.battery : device.batteryLow, device.battery !== undefined ? "%" : "");
	}
	if(device.batteryTemperature !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnBatteryTemperature", "text-nowrap", "", "", "bi-thermometer-low", translateContent("lblTemperature"), device.state === 2 ? `---` : device.batteryTemperature, "&deg;C");
	}
	if(device.sensorOpen !== undefined)
	{
		card += generateColumnForProperty("col mb-0 pe-1", "spnSensorState", "text-nowrap", "", "", device.sensorOpen === true ? "bi-door-open" : "bi-door-closed", translateContent("lblState"), device.sensorOpen === true ? translateDeviceStateValue("Open") : translateDeviceStateValue("Closed"), "");
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
			return `${translateContent("lblLastUpdated")}: ${makeDateTimeString(new Date(parseInt(device.sensorChangeTime)))}`;
		}
		else
		{
			return `${translateContent("lblLastUpdated")}: ${translateContent("lblNotAvailable")}`;
		}
	}
	else
	{
		if(device.pictureTime !== undefined && device.pictureTime != "" && device.pictureTime != "n/a" && device.pictureTime != "n/d" && device.pictureTime != "0")
		{
			return `${translateContent("lblLastRecordiung")}: ${makeDateTimeString(new Date(parseInt(device.pictureTime)))} | <a href="javascript:generateDeviceImageModal('${device.serialNumber}','${device.name}');">${translateContent("lblLastRecordingThumbnail")}</a>`;
		}
		else if(device.pictureTime === undefined || device.pictureTime == "n/a")
		{
			return translateContent("lblLastRecordiungNotAvailable");
		}
		else
		{
			return `${translateContent("lblLastRecordiung")}: ${translateContent("lblNotAvailable")}`;
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
	return `<div class="${divClass}${value === `---` ? ` text-muted` : ""}"><span id="${spanName}" class="${spanClass}">${displayFormatStart == "" ? "" : displayFormatStart}<i class="${imageName}" title="${title}"></i>&nbsp;${value === false ? translateString("strOk") : value === true ? translateString("strLow") : value}${unit === undefined ? "" : unit}${displayFormatEnd == "" ? "" : displayFormatEnd}</span></div>`;
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
								<h5>${translateContent("lblStationDeviceModalHeader")}</h5>
								<p>${translateContent("lblStationDeviceModalDescription", deviceName, deviceId)}</p>
								<p>${translateContent("lblStationDeviceModalActionToPerform")}</p>
								<div class="d-grid gap-2">
									${makeButtonElement("btnOpenModalStationSettings", "btn btn-primary", `generateStationSettingsModal('${deviceId}')`, translateContent("btnGetSettingsForStation"), true, "modal", undefined, true)}
									${makeButtonElement("btnOpenModalDeviceSettings", "btn btn-primary", `generateDeviceSettingsModal('${deviceId}')`, translateContent("btnGetSettingsForDevice"), true, "modal", undefined, true)}
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
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
								<img src="${location.protocol}//${location.hostname}:${port}/getDeviceImage/${deviceId}" class="img-fluid" alt="${translateContent("lblLastRecordingThumbnail")}">
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
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
															<i class="bi-gear-wide-connected" title="${translateContent("lblFirmware")}"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
														</span>
													</div>
													<div class="col">
														<span class="text-nowrap">
															<i class="bi-battery" title="${translateContent("lblBatteryLevel")}"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
														</span>
													</div>
													<div class="col">
														<span class="text-nowrap">
															<i class="bi-thermometer-low" title="${translateContent("lblTemperature")}"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
														</span>
													</div>
												</div>
											</h6>
										</span>
									</div>
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
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
					document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorNoDeviceForGetInfo", "DevicePropertiesMetadata"));;
				}
			}
			else
			{
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DevicePropertiesMetadata"));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DevicePropertiesMetadata"));
		}
		else
		{ }
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
					fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, objResp.modelName, objResp.isDeviceKnownByClient, objResp.data, objResp.interactions);
				}
				else
				{
					document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorNoDeviceForGetInfo", "DeviceProperties"));
				}
			}
			else
			{
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DeviceProperties"));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DeviceProperties"));
		}
		else
		{ }
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
											${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
										</div>
									</div>
								</div>`;
}

function fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, modelName, isDeviceKnownByClient, deviceProperties, deviceInteractions)
{
	var setEventHandler = true;
	var deviceModal =  `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">${deviceProperties.name} (${deviceId})</h5></div>${deviceProperties.wifiSignalLevel !== undefined || deviceProperties.wifiRssi !== undefined ? `<div style="text-align:right;"><h5 class="mb-0"><span class="text-nowrap"><i class="${getWifiSignalLevelIcon(deviceProperties.wifiSignalLevel, deviceProperties.wifiRssi)}" title="${translateContent("titleWifiSignalLevel")}: ${deviceProperties.wifiRssi}dB"></i></span></h5></div>` : ""}
							</div>
							<div class="modal-body placeholder-glow" id="divModalDeviceSettingsContent">
								<div class="" id="lblModalDeviceSettingsInfo">`;
	if(isStationOrDevicesKnown(deviceProperties.model.slice(0,5)) === false && isDeviceKnownByClient === true)
	{
		setEventHandler = false;
		deviceModal += `
									${createMessageContainer("alert alert-warning", translateContent("lblNotSupportedDeviceHeading"), translateContent("lblNotSupportedDeviceMessage", `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesTruncated/${deviceId}`, `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${deviceId}`), translateContent("lblNotSupportedDeviceSubText"))}
									${createMessageContainer("alert alert-primary", translateContent("lblNotSupportedDeviceNoSaving"), "", "")}`;
	}
	else if (isDeviceKnownByClient === false)
	{
		setEventHandler = false;
		deviceModal += `
									${createMessageContainer("alert alert-warning", translateContent("lblUnknownDeviceHeading"), translateContent("lblUnknownDeviceMessage", deviceProperties.model), "")}
									${createMessageContainer("alert alert-primary", translateContent("lblUnknownDeviceNoSaving"), "", "")}`;
	}
	deviceModal +=     `
								</div>
								<div class="row text-center">
									<div class="col">
										<span id="lblDeviceModel">
											<h5 class="card-subtitle mb-2">${modelName === "unknown" ? translateString("strUnknownDevice") : modelName} <span class="text-muted">(${deviceProperties.model})</span></h5>
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
													${generateColumnForProperty("col", "spnFimware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), deviceProperties.softwareVersion)}`;
		}
		if(deviceProperties.battery !== undefined || deviceProperties.batteryLow !== undefined)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnBattery", "text-nowrap", "", "", deviceProperties.chargingStatus == 1 || deviceProperties.chargingStatus == 4 ? "bi-battery-charging" : "bi-battery", translateContent("lblBatteryLevel"), deviceProperties.battery !== undefined ? deviceProperties.battery : deviceProperties.batteryLow, deviceProperties.battery !== undefined ? "%" : "")}`;
		}
		if(deviceProperties.batteryTemperature !== undefined && deviceProperties.batteryTemperature > -99 && deviceProperties.batteryTemperature < 99)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnBatteryTemperature", "text-nowrap", "", "", "bi-thermometer-low", translateContent("lblTemperature"), deviceProperties.state === 2 ? `---` : deviceProperties.batteryTemperature, "&deg;C")}`;
		}
		if(deviceProperties.sensorOpen !== undefined)
		{
			deviceModal += `
													${generateColumnForProperty("col", "spnSensorState", "text-nowrap", "", "", deviceProperties.sensorOpen === true ? "bi-door-open" : "bi-door-closed", translateContent("lblState"), deviceProperties.sensorOpen === true ? translateDeviceStateValue("Open") : deviceProperties.sensorOpen === false ? translateDeviceStateValue("Closed") : ``)}`;
		}
		deviceModal +=     `
												</div>
											</h6>
										</span>`;
	}
	deviceModal +=     `
									</div>
								</div>`;
	if(deviceProperties.state === 0)
	{
		deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedOffline"), translateContent("titleDeactivatedOfflineHint"), "")}
								</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
							</div>
						</div>
					</div>`;

		document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
		return;
	}
	if(deviceProperties.state === 3)
	{
		deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedLowBattery"), translateContent("titleDeactivatedLowBatteryHint"), "")}
								</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
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
									<h5 class="card-header">${translateContent("lblHeaderCommon")}</h5>
									<div class="card-body">
										<div class="row gap-3">`;
		if(deviceProperties.enabled !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblEnabled")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.enabled.name, deviceProperties.enabled, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.antitheftDetection !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblAntitheftDetection")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.antitheftDetection.name, deviceProperties.antitheftDetection, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "boolean")
		{
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblStatusLed")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, setEventHandler)}`;
			deviceModal += `
											</div>`;
		}
		if(deviceProperties.imageMirrored !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblImageMirrored")}</h5>
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
								<div class="card mb-3" id="cardDeviceMotionDetectionSettings">
									<h5 class="card-header">${translateContent("lblHeaderMotionDetection")}</h5>
									<div class="card-body">`;
		if(deviceProperties.motionDetection !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblMotionDetection")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetection.name, deviceProperties.motionDetection, setEventHandler)}`;
			if(deviceProperties.motionDetectionSensitivity !== undefined || deviceProperties.motionDetectionSensitivityStandard !== undefined || deviceProperties.motionDetectionSensitivityAdvancedA !== undefined || deviceProperties.motionDetectionSensitivityAdvancedB !== undefined || deviceProperties.motionDetectionSensitivityAdvancedC !== undefined || deviceProperties.motionDetectionSensitivityAdvancedD !== undefined || deviceProperties.motionDetectionSensitivityAdvancedE !== undefined || deviceProperties.motionDetectionSensitivityAdvancedF !== undefined || deviceProperties.motionDetectionSensitivityAdvancedG !== undefined || deviceProperties.motionDetectionSensitivityAdvancedH !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblMotionDetectionSensitivity")}</h5>
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
												<div id="divMotionDetectionSensitivityAdvancedImage" class="mb-2">
													${createMotionDetectionSensitivityAdvancedImage(deviceProperties, 225, 212)}
												</div>
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
										<h5>${translateContent("lblMotionDetectionType")}</h5>
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
										<h5>${translateContent("lblRotationSpeed")}</h5>
										${deviceProperties.rotationSpeed !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.rotationSpeed.name, deviceProperties.rotationSpeed, setEventHandler, devicePropertiesMetadata.rotationSpeed.states)}` : ""}`;
			}
			if(deviceProperties.motionTracking !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity || deviceProperties.motionDetectionType || deviceProperties.rotationSpeed !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblMotionTracking")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderLoiteringDetection")}</h5>
									<div class="card-body">`;
		if(deviceProperties.loiteringDetection !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblLoiteringDetection")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetection.name, deviceProperties.loiteringDetection, setEventHandler)}`;
		}
		if(deviceProperties.loiteringDetectionRange !== undefined)
		{
			deviceModal += `
										${deviceProperties.loiteringDetection !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblLoiteringDetectionRange")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetectionRange.name, deviceProperties.loiteringDetectionRange, setEventHandler, devicePropertiesMetadata.loiteringDetectionRange.states)}`;
		}
		if(deviceProperties.loiteringDetectionLength !== undefined)
		{
			deviceModal += `
										${deviceProperties.loiteringDetectionRange !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblLoiteringDetectionLength")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetectionLength.name, deviceProperties.loiteringDetectionLength, setEventHandler, devicePropertiesMetadata.loiteringDetectionLength.states)}`;
		}
		if(deviceProperties.loiteringCustomResponsePhoneNotification !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponse !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponseVoice !== undefined || deviceProperties.loiteringCustomResponseHomeBaseNotification !== undefined || deviceProperties.loiteringCustomResponseTimeFrom !== undefined || deviceProperties.loiteringCustomResponseTimeTo !== undefined)
		{
			deviceModal += `
										${deviceProperties.loiteringDetectionLength !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblLoiteringResponse")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderDeliveryGuard")}</h5>
									<div class="card-body">`;
		if(deviceProperties.deliveryGuard !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblDeliveryGuard")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuard.name, deviceProperties.deliveryGuard, setEventHandler)}`;
			if(deviceProperties.deliveryGuardPackageGuarding !== undefined || deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined)
			{
				deviceModal += `
										${deviceProperties.deliveryGuard !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblDeliveryGuardPackageGuarding")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuarding.name, deviceProperties.deliveryGuardPackageGuarding, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingVoiceResponseVoice.name, deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.deliveryGuardPackageGuardingVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "deliveryGuardPackageGuardingActivatedTimespan", deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingActivatedTimeFrom.name, deviceProperties.deliveryGuardPackageGuardingActivatedTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingActivatedTimeTo.name, deviceProperties.deliveryGuardPackageGuardingActivatedTimeTo, setEventHandler)}`;
			}
			if(deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck)
			{
				deviceModal += `
										${deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblDeliveryGuardUncollectedPackageAlert")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlert.name, deviceProperties.deliveryGuardUncollectedPackageAlert, setEventHandler)}
										${generateElementTimePicker("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlertTimeToCheck.name, deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck, setEventHandler)}`;
			}
			if(deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined)
			{
				deviceModal += `
										${deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblDeliveryGuardPackageLiveCheckAssistance")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderRingAutoResponse")}</h5>
									<div class="card-body">`;
		if(deviceProperties.ringAutoResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblRingAutoResponse")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponse.name, deviceProperties.ringAutoResponse, setEventHandler)}`;
			if(deviceProperties.ringAutoResponseVoiceResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined)
			{
				deviceModal += `
										${deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblRingAutoResponseVoice")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderSoundDetection")}</h5>
									<div class="card-body">`;
		if(deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionRoundLook !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblSoundDetection")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetection.name, deviceProperties.soundDetection, setEventHandler)}`;
			if(deviceProperties.soundDetectionSensitivity !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblSoundDetectionSensitivity")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionSensitivity.name, deviceProperties.soundDetectionSensitivity, setEventHandler, devicePropertiesMetadata.soundDetectionSensitivity.states)}`;
			}
			else if(deviceProperties.soundDetectionType !== undefined && (deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined))
			{
				deviceModal += `
										${deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionSensitivity ? `<hr />`: ``}
										<h5>${translateContent("lblSoundDetectionType")}</h5>
										${deviceProperties.soundDetectionType !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionType.name, deviceProperties.soundDetectionType, setEventHandler, devicePropertiesMetadata.soundDetectionType.states)}` : ""}`;
			}
			if(deviceProperties.soundDetectionRoundLook !== undefined)
			{
				deviceModal += `
										${deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionSensitivity || (deviceProperties.soundDetectionType !== undefined && (deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined)) ? `<hr />`: ``}
										<h5>${translateContent("lblSoundDetectionRoundLook")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionRoundLook.name, deviceProperties.soundDetectionRoundLook, setEventHandler)}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.powerWorkingMode !== undefined || deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined || deviceProperties.powerSource !== undefined || deviceProperties.lastChargingDays !== undefined || (deviceProperties.detectionStatisticsWorkingDays !== undefined && deviceProperties.detectionStatisticsDetectedEvents !== undefined && deviceProperties.detectionStatisticsRecordedEvents !== undefined))
	{
		deviceModal += `
								<div class="card mb-3" id="cardDevicePowerManagerSettings">
									<h5 class="card-header">${translateContent("lblHeaderPowerManager")}</h5>
									<div class="card-body">`;
		if(deviceProperties.powerWorkingMode !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblPowerWorkingMode")}</h5>
										${generateElementRadioGroup("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.powerWorkingMode.name, deviceProperties.powerWorkingMode, setEventHandler, devicePropertiesMetadata.powerWorkingMode.states)}
										<div id="divDeviceCustomRecordingSettings" ${deviceProperties.powerWorkingMode == 2 ? "" : ` class="collapse"`}>`;
		}
		if(deviceProperties.powerWorkingMode === undefined || deviceProperties.powerWorkingMode == 2)
		{
			if(deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined)
			{
				deviceModal += `
											${deviceProperties.powerWorkingMode !== undefined ? `<hr />` : ""}
											<h5>${deviceProperties.powerWorkingMode !== undefined ? `${translateString("strUserDefiniedSpec")} ` : `${translateString("strPowerManagerSpec")} `}${translateString("strSettings")}</h5>`;
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
										<h5>${translateContent("lblPowerSource")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.powerSource.name, deviceProperties.powerSource, setEventHandler, devicePropertiesMetadata.powerSource.states)}
										<label>${translateString("strCurrentState")}: ${translateDeviceStateValue(devicePropertiesMetadata.chargingStatus.states[deviceProperties.chargingStatus])}</label>`;
		}
		if((deviceProperties.lastChargingDays !== undefined && deviceProperties.lastChargingDays > -1 && deviceProperties.lastChargingTotalEvents !== undefined && deviceProperties.lastChargingRecordedEvents !== undefined) || (deviceProperties.detectionStatisticsWorkingDays !== undefined && deviceProperties.detectionStatisticsDetectedEvents !== undefined && deviceProperties.detectionStatisticsRecordedEvents !== undefined))
		{
			deviceModal += `
										${deviceProperties.powerWorkingMode !== undefined || deviceProperties.powerSource !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblDetectionStatistic")}</h5>
										<div class="row gap-3">
											<div class="col">
												<h5>${deviceProperties.lastChargingDays !== undefined ? deviceProperties.lastChargingDays : deviceProperties.detectionStatisticsWorkingDays}</h5>
												${deviceProperties.lastChargingDays !== undefined ? translateString("strLastChargingDays") : translateString("strWorkingDays")}
											</div>
											<div class="col">
												<h5>${deviceProperties.lastChargingTotalEvents !== undefined ? deviceProperties.lastChargingTotalEvents : deviceProperties.detectionStatisticsDetectedEvents}</h5>
												${translateString("strEventsDetected")}
											</div>
											<div class="col">
												<h5>${deviceProperties.lastChargingRecordedEvents !== undefined ? deviceProperties.lastChargingRecordedEvents : deviceProperties.detectionStatisticsRecordedEvents}</h5>
												${translateString("strEventsRecorded")}
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
								<div class="card mb-3" id="cardContinuousRecordingSettings">
									<h5 class="card-header">${translateContent("lblHeaderContinuousRecording")}</h5>
									<div class="card-body">`;
		if(deviceProperties.continuousRecording !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblContinuousRecording")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.continuousRecording.name, deviceProperties.continuousRecording, setEventHandler)}`;
		}
		if(deviceProperties.continuousRecordingType !== undefined)
		{
			deviceModal += `
										${deviceProperties.continuousRecording !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblContinuousRecordingType")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.continuousRecordingType.name, deviceProperties.continuousRecordingType, setEventHandler, devicePropertiesMetadata.continuousRecordingType.states)}
										${deviceProperties.continuousRecordingType === 0 ? "" : createMessageContainer("alert alert-warning mb-0", translateMessages("messageContinuousRecordingSheduleHint"), translateMessages("messageContinuousRecordingSheduleMessage"))}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if((deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number") || deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined || deviceProperties.videoWdr !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceVideoSettings">
									<h5 class="card-header">${translateContent("lblHeaderVideoSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number")
		{
			deviceModal += `
										<h5>${translateContent("lblStatusLed")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, setEventHandler, devicePropertiesMetadata.statusLed.states)}`;
		}
		if(deviceProperties.watermark !== undefined)
		{
			deviceModal += `
										${deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number" ? `<hr />` : ``}
										<h5>${translateContent("lblWatermark")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.watermark.name, deviceProperties.watermark, setEventHandler, devicePropertiesMetadata.watermark.states)}`;
		}
		if(deviceProperties.videoRecordingQuality !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblVideoRecordingQuality")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoRecordingQuality.name, deviceProperties.videoRecordingQuality, setEventHandler, devicePropertiesMetadata.videoRecordingQuality.states)}`;
		}
		if(deviceProperties.videoStreamingQuality !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblVideoStreamingQuality")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoStreamingQuality.name, deviceProperties.videoStreamingQuality, setEventHandler, devicePropertiesMetadata.videoStreamingQuality.states)}`;
		}
		if(deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblNightvision")}</h5>
										${devicePropertiesMetadata.autoNightvision === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.autoNightvision.name, deviceProperties.autoNightvision, setEventHandler)}
										${devicePropertiesMetadata.nightvision === undefined ? "" : generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.nightvision.name, deviceProperties.nightvision, setEventHandler, devicePropertiesMetadata.nightvision.states)}
										${devicePropertiesMetadata.lightSettingsBrightnessManual === undefined ? "" : generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessManual.name, deviceProperties.lightSettingsBrightnessManual, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessManual.unit, devicePropertiesMetadata.lightSettingsBrightnessManual.min, devicePropertiesMetadata.lightSettingsBrightnessManual.max, devicePropertiesMetadata.lightSettingsBrightnessManual.default)}`;
		}
		if(deviceProperties.videoWdr !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblVideoWdr")}</h5>
										${devicePropertiesMetadata.videoWdr === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoWdr.name, deviceProperties.videoWdr, setEventHandler)}`;
		}
		if(deviceProperties.flickerAdjustment !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined || deviceProperties.videoWdr !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblFlickerAdjustment")}</h5>
										${devicePropertiesMetadata.flickerAdjustment === undefined ? "" : generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.flickerAdjustment.name, deviceProperties.flickerAdjustment, setEventHandler, deviceProperties.flickerAdjustment.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined || deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceAudioSettings">
									<h5 class="card-header">${translateContent("lblHeaderAudioSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblMicrophone")}</h5>`;
			if(deviceProperties.microphone !== undefined)
			{
				deviceModal += `
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.microphone.name, deviceProperties.microphone, setEventHandler)}`;
			}
			if(deviceProperties.audioRecording !== undefined && (deviceProperties.microphone === undefined || (deviceProperties.microphone !== undefined && deviceProperties.microphone === true)))
			{
				deviceModal += `
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.audioRecording.name, deviceProperties.audioRecording, setEventHandler)}`;
			}
		}
		if(deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined)
		{
			deviceModal += `
										${deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblSpeaker")}</h5>
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
										<h5>${translateContent("lblRingtoneVolume")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderDualCamWatchViewMode")}</h5>
									<div class="card-body">`;
		if(deviceProperties.dualCamWatchViewMode !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblDualCamWatchViewMode")}</h5>
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
									<h5 class="card-header">${translateContent("lblChimeSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.chimeIndoor !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblChimeIndoor")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeIndoor.name, deviceProperties.chimeIndoor, setEventHandler)}`;
		}
		if(deviceProperties.chimeHomebase !== undefined)
		{
			deviceModal += `
										${deviceProperties.chimeIndoor !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblChimeHomebase")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderLightSettings")}</h5>
									<div class="card-body">
										<h5>${translateContent("lblManualLighting")}</h5>
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessManual.name, deviceProperties.lightSettingsBrightnessManual, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessManual.unit, devicePropertiesMetadata.lightSettingsBrightnessManual.min, devicePropertiesMetadata.lightSettingsBrightnessManual.max, devicePropertiesMetadata.lightSettingsBrightnessManual.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsManualLightingActiveMode.name, deviceProperties.lightSettingsManualLightingActiveMode, setEventHandler, devicePropertiesMetadata.lightSettingsManualLightingActiveMode.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsManualDailyLighting.name, deviceProperties.lightSettingsManualDailyLighting, setEventHandler, devicePropertiesMetadata.lightSettingsManualDailyLighting.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsManualDynamicLighting.name, deviceProperties.lightSettingsManualDynamicLighting, setEventHandler, devicePropertiesMetadata.lightSettingsManualDynamicLighting.states)}
										<hr />
										<h5>${translateContent("lblScheduleLighting")}</h5>
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessSchedule.name, deviceProperties.lightSettingsBrightnessSchedule, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessSchedule.unit, devicePropertiesMetadata.lightSettingsBrightnessSchedule.min, devicePropertiesMetadata.lightSettingsBrightnessSchedule.max, devicePropertiesMetadata.lightSettingsBrightnessSchedule.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsScheduleLightingActiveMode.name, deviceProperties.lightSettingsScheduleLightingActiveMode, setEventHandler, devicePropertiesMetadata.lightSettingsScheduleLightingActiveMode.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsScheduleDailyLighting.name, deviceProperties.lightSettingsScheduleDailyLighting, setEventHandler, devicePropertiesMetadata.lightSettingsScheduleDailyLighting.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsScheduleDynamicLighting.name, deviceProperties.lightSettingsScheduleDynamicLighting, setEventHandler, devicePropertiesMetadata.lightSettingsScheduleDynamicLighting.states)}
										<hr />
										<h5>${translateContent("lblMotionLighting")}</h5>
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
									<h5 class="card-header">${translateContent("lblChirpSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.chirpTone !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblChirpTone")}</h5>
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
									<h5 class="card-header">${translateContent("lblHeaderNotificationSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.notification !== undefined)
		{
			deviceModal += `
										<h5>${translateContent("lblNotification")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notification.name, deviceProperties.notification, setEventHandler)}`;
		}
		if((deviceProperties.notification !== undefined && deviceProperties.notification === true) || deviceProperties.notification === undefined)
		{
			deviceModal += `
										${deviceProperties.notification !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblNotificationType")}</h5>
										${generateElementRadioGroup("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationType.name, deviceProperties.notificationType, setEventHandler, devicePropertiesMetadata.notificationType.states)}`;
			if(deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined)
			{
				deviceModal += `
										
										<hr />
										<h5>${translateContent("lblNotificationSend")}</h5>
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
		if(deviceProperties.notificationIntervalTime !== undefined)
		{
			deviceModal += `
										${deviceProperties.notification !== undefined || (deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined) ? `<hr />` : ``}
										<h5>${translateContent("lblNotificationIntervalTime")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationIntervalTime.name, deviceProperties.notificationIntervalTime, setEventHandler, devicePropertiesMetadata.notificationIntervalTime.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.motionDetected !== undefined || deviceProperties.radarMotionDetected !== undefined || deviceProperties.personDetected !== undefined || deviceProperties.petDetected !== undefined || deviceProperties.cryingDetected !== undefined || deviceProperties.soundDetected !== undefined || deviceProperties.strangerPersonDetected !== undefined || deviceProperties.vehicleDetected !== undefined || deviceProperties.dogDetected !== undefined || deviceProperties.dogLickDetected !== undefined || deviceProperties.dogPoopDetected !== undefined || deviceProperties.ringing !== undefined)
	{
		var isFirstElement = true;
		deviceModal += `
								<div class="card mt-3" id="cardDeviceInteraction">
									<h5 class="card-header">${translateContent("lblHeaderInteractionCCU")}</h5>
									<div class="card-body">
										${createMessageContainer("alert alert-warning", translateMessages("messageInteractionHintHeader"), translateMessages("messageInteractionHintMessage"), "")}`;
		if(deviceProperties.motionDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("motion", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.radarMotionDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("radarMotion", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.personDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("person", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.petDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("pet", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.cryingDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("crying", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.soundDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("sound", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.strangerPersonDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("strangerPerson", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.vehicleDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("vehicle", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.dogDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("dog", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.dogLickDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("dogLick", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.dogPoopDetected !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("dogPoop", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		if(deviceProperties.ringing !== undefined)
		{
			deviceModal += `
										${isFirstElement === false ? `<hr />` : ``}
										${generateInteractionExpander("ring", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
			isFirstElement = false;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	deviceModal += `
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
							</div>
						</div>
					</div>`;

	document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
}

function toggleInteractionDiv(divElementId, imgElementId)
{
	if(document.getElementById(divElementId).classList.contains("collapse"))
	{
		document.getElementById(divElementId).removeAttribute("class");
		document.getElementById(imgElementId).setAttribute("class", "bi-chevron-up");
		document.getElementById(imgElementId).setAttribute("title", translateString("strEditInteractionEnd"));
	}
	else
	{
		document.getElementById(divElementId).setAttribute("class", "collapse");
		document.getElementById(imgElementId).setAttribute("class", "bi-chevron-down");
		document.getElementById(imgElementId).setAttribute("title", translateString("strEditInteractionStart"));
	}
}

function getEventId(event)
{
	switch(event)
	{
		case "motion":
			return 0;
		case "radarMotion":
			return 1;
		case "person":
			return 2;
		case "pet":
			return 3;
		case "sound":
			return 4;
		case "crying":
			return 5;
		case "strangerPerson":
			return 7;
		case "vehicle":
			return 8;
		case "dog":
			return 9;
		case "dogLick":
			return 10;
		case "dogPoop":
			return 11;
		case "ring":
			return 12;
		default:
			return -1;
	}
}

function saveEventInteraction(deviceId, deviceName, serialNumber, event)
{
	var eventInteraction;
	var eventType = getEventId(event);
	if(eventType == -1)
	{
		const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
		document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
		document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageSaveInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	eventInteraction = `{"serialNumber": "${serialNumber}", "eventType": ${eventType}, "target": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventTarget`).value}", "useHttps": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventUseHttps`).checked}, "command": "${encodeURIComponent(document.getElementById(`txtArea${event.charAt(0).toUpperCase() + event.slice(1)}EventCommand`).value)}"}`;

	var xmlHttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/setInteraction`;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.addEventListener("load", function(event)
	{
		//
	});
	xmlHttp.addEventListener("error", function(event)
	{
		//
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
					const toast = new bootstrap.Toast(toastPropertyUpdateOK);
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
					document.getElementById("toastPropertyUpdateOKText").innerHTML = translateMessages("messageSaveInteractionOkMessage");
					toast.show();
					generateDeviceSettingsModal(deviceId, deviceName)
				}
				else
				{
					const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageSaveInteractionFailedMessage");
					toast.show();
				}
			}
			catch (e)
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
				document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageSaveInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
			document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
			document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageSaveInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
			toast.show();
		}
		else
		{ }
	};
	xmlHttp.open("POST", url);
	xmlHttp.send(eventInteraction);
}

function testEventInteraction(deviceId, deviceName, serialNumber, event)
{
	var eventType;
	var eventType = getEventId(event);
	if(eventType == -1)
	{
		const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
		document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
		document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageTestInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/testInteraction/${serialNumber}/${eventType}`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			try
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastPropertyUpdateOK);
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = translateMessages("messageTestInteractionHeader");
					document.getElementById("toastPropertyUpdateOKText").innerHTML = translateMessages("messageTestInteractionOkMessage");
					toast.show();
					generateDeviceSettingsModal(deviceId, deviceName)
				}
				else
				{
					const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageTestInteractionFailedMessage");
					toast.show();
				}
			}
			catch (e)
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
				document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageTestInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
			document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
			document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageTestInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
			toast.show();
		}
		else
		{ }
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function deleteEventInteraction(deviceId, deviceName, serialNumber, event)
{
	var eventType;
	var eventType = getEventId(event);
	if(eventType == -1)
	{
		const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
		document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
		document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageDeleteInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	var xmlhttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/deleteInteraction/${serialNumber}/${eventType}`;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType('application/json');
	xmlhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			try
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true)
				{
					const toast = new bootstrap.Toast(toastPropertyUpdateOK);
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
					document.getElementById("toastPropertyUpdateOKText").innerHTML = translateMessages("messageDeleteInteractionOkMessage");
					toast.show();
					generateDeviceSettingsModal(deviceId, deviceName)
				}
				else
				{
					const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageDeleteInteractionFailedMessage");
					toast.show();
				}
			}
			catch (e)
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
				document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageDeleteInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
			document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
			document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageDeleteInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
			toast.show();
		}
		else
		{ }
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
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
		case "T8600":
		//IndoorCams
		case "T8400":
		case "T8410":
		case "T8416":
		//Doorbells
		case "T8210":
		case "T8213":
		case "T8214":
		//WallLightCams
		case "T84A1":
		//Sensors
		case "T8900":
			return true;
		default:
			return false;
	}
}

function generateElementTextBox(type, serialNumber, name, propertyName, hint, placeholder, value, disabled, readonly)
{
	return `<div class="mb-2">
		<label for="txtBox${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label">${translatePropertyName(propertyName)}</label>
		<input class="form-control" type="text"${placeholder !== undefined || placeholder !== "" ? ` placeholder="${placeholder}"` : ""} aria-label="" id="txtBox${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" value="${value}"${disabled == true ? " disabled" : ""}${readonly == true ? " readonly" : ""}>
		${hint !== undefined || hint !== "" ? `<div id="passwordHelpBlock" class="form-text">${translatePropertyName(hint)}</div>` : ""}
	</div>`;
}

function generateElementTextArea(type, serialNumber, name, maxLength, rows, propertyName, hint, placeholder, value, disabled, readonly)
{
	return `<div class="mb-2">
		<label for="txtArea${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label">${translatePropertyName(propertyName)}</label>
		<textarea class="form-control" id="txtArea${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" maxlength="${maxLength}" rows="${rows}"${disabled == true ? " disabled" : ""}${readonly == true ? " readonly" : ""} style="font-family:monospace;">${value}</textarea>
		${hint !== undefined || hint !== "" ? `<div id="passwordHelpBlock" class="form-text">${translatePropertyName(hint)}</div>` : ""} 
	</div>`;
}

function generateElementSwitch(type, serialNumber, name, propertyName, value, setEventHandler)
{
	return `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == true ? " checked" : ""}${setEventHandler == true ? ` onclick="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.checked)` : ""}"><label class="form-check-label" for="chk${propertyName}">${translatePropertyName(propertyName)}</label></div>`;
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
	return `<div class="form-check"><input class="form-check-input" type="radio" name="grp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" id="rb${state.charAt(0).toUpperCase() + state.slice(1)}" ${value == true ? " checked" : ""}${setEventHandler == true ? ` onclick="change${type}Property('${serialNumber}', '${name}', '${propertyName}', ${stateValue})` : ""}"><label class="form-check-label" for="rb${state.charAt(0).toUpperCase() + state.slice(1)}">${translateDeviceStateValue(state)}</label></div>`;
}

function generateElementRange(type, serialNumber, name, propertyName, value, setEventHandler, unit, min, max, defaultValue)
{
	return `<div><label for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label mb-0 align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}: <span id="spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value">${value === undefined ? defaultValue : value}</span>${unit === undefined ? "" : translateDeviceStateValue(unit)}</label>${min !== undefined && max !== undefined ? `<div class="d-flex justify-content-between"><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Min">${min}</small></div><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Max">${max}</small></div></div>` : ""}<input type="range" class="form-range ${min === undefined ? "mt-0" : "my-0"}" min="${min}" max="${max}" id="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" value="${value === undefined ? defaultValue : value}" oninput="updateSliderValue('spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value', this.value)"${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)"` : ""}>${defaultValue !== undefined ? `<div class="text-end">${generateElementButton(type, serialNumber, name, propertyName, setEventHandler, "btn btn-outline-secondary btn-sm", true, defaultValue, (defaultValue !== undefined && defaultValue != value))}</div>` : ""}</div>`;
}

function generateElementProgress(propertyName, value)
{
	return `<div><label for="prog${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}: ${isNaN(value) ? `${translateContent("lblUnknown")}` : `${value}%`}</label><div class="progress mb-3"><div id="prog${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="progress-bar" style="width: ${value}%" role="progressbar" aria-label="${translatePropertyName(propertyName)}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"></div></div></div>`;
}

function generateElementSelect(type, serialNumber, name, propertyName, value, setEventHandler, states)
{
	var selectElement = `<div><label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)` : ""}">`;
	for(var state in states)
	{
		selectElement += makeSelectElement(propertyName, value, state, states[state])
	}
	selectElement += `</select></div>`;
	return selectElement;
}

function generateElementSelectTimeZone(type, serialNumber, name, propertyName, value, setEventHandler, states)
{
	var selectElement = `<div><label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value) ` : ""}" disabled>`;
	for(var state in states)
	{
		selectElement += makeSelectElementTimeZone(propertyName, value, states[state]);
	}
	selectElement += `</select></div>`;
	return selectElement;
}

function makeSelectElement(propertyName, value, valueNumber, state)
{
	return `<option value="${valueNumber}" id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == valueNumber ? " selected" : ""}>${translateDeviceStateValue(state, propertyName, valueNumber)}</option>`;
}

function makeSelectElementTimeZone(propertyName, value, state)
{
	return `<option value="${state.timeZoneGMT}|1.${state.timeSn}" id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}${state.timeSn}"${value === `${state.timeZoneGMT}|1.${state.timeSn}` ? " selected" : ""}>${translateDeviceStateValue(state.timeId, propertyName, state.timeZoneGMT)}</option>`;
}

function generateElementButton(type, serialNumber, name, propertyName, setEventHandler, buttonClass, setToDefault, value, enabled)
{
	return `<div>${makeButtonElement(`btn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}${setToDefault == true ? "ToDefault" : ""}`, `${buttonClass}`, `change${type}Property('${serialNumber}', '${name}', '${propertyName}'${value !== undefined ? ` , '${value}'` : ""})`, `${setToDefault == true ? `Standardwert setzen` : `${translatePropertyName(propertyName)}`}`, enabled, undefined, undefined, setEventHandler)}</div>`;
}

function makeButtonElement(buttonId, buttonClass, buttonOnClick, description, enabled, dataBsDismiss, ariaLabel, setEventHandler)
{
	return `<button id="${buttonId}" type="button" class="${buttonClass}"${buttonOnClick !== undefined && setEventHandler == true ? ` onclick="${buttonOnClick}"` : ""}${dataBsDismiss !== undefined ? ` data-bs-dismiss="${dataBsDismiss}"` : ""}${ariaLabel !== undefined ? ` aria-label="${ariaLabel}"` : ""}${enabled == false ? " disabled" : ""}>${description}</button>`;
}

function generateElementTimePicker(type, serialNumber, name, propertyName, value, setEventHandler)
{
	return `<div class="row align-items-center"><label class="mb-2" for="tp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}</label><div class="col"><input type="time" id="tp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-control mb-2" value="${value}" ${setEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)"` : ""}></div><div class="col"></div><div class="col"></div></div>`;
}

function generateElementTimePickerStartEnd(type, serialNumber, caption, startName, startPropertyName, startValue, startSetEventHandler, endName, endPropertyName, endValue, endSetEventHandler)
{
	return `${translatePropertyName(caption)}<div class="row align-items-center"><div class="col"><label class="col-form-label" for="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}">${translatePropertyName("captionTimeFrom")}</label><input type="time" id="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}" class="form-control mb-2" value="${startValue}" ${startSetEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${startName}', '${startPropertyName}', this.value)"` : ""}></div><div class="col text-center"">${translatePropertyName("timeUntil")}</div><div class="col"><label class="col-form-label" for="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}">${translatePropertyName("captionTimeTo")}</label><input type="time" id="tp${endPropertyName.charAt(0).toUpperCase() + endPropertyName.slice(1)}" class="form-control mb-2" value="${endValue}" ${endSetEventHandler == true ? ` onchange="change${type}Property('${serialNumber}', '${endName}', '${endPropertyName}', this.value)"` : ""}></div></div>`;
}

function generateInteractionExpander(event, enabled, deviceProperties, deviceInteractions, deviceId, setEventHandler)
{
	var interactionExpander = `
										<h5 ${enabled === true ? `onclick="toggleInteractionDiv('divInteraction${event.charAt(0).toUpperCase() + event.slice(1)}', 'imgToggleInteraction${event.charAt(0).toUpperCase() + event.slice(1)}')"` : `class="text-muted"`}><div class="row"><div class="col-auto me-0 pe-0"><i id="imgToggleInteraction${event.charAt(0).toUpperCase() + event.slice(1)}" class="${enabled === true ? `bi-chevron-down` : `bi-chevron-right`}" title="${translateString("strEditInteractionStart")}"></i></div><div class="col">${translateContent(`lblInteraction${event.charAt(0).toUpperCase() + event.slice(1)}`)}</div></div></h5>
										<div id="divInteraction${event.charAt(0).toUpperCase() + event.slice(1)}" class="collapse">
											${generateElementTextBox("Device", deviceProperties.serialNumber, deviceProperties.name, `${event}EventTarget`, `${event}EventTargetHint`, "", `${deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].target !== "" ? deviceInteractions.eventInteractions[`${getEventId(event)}`].target : ""}`, false, false)}
											${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, `${event}EventUseHttps`, false, false)}
											${generateElementTextArea("Device", deviceProperties.serialNumber, deviceProperties.name, 100, 2, `${event}EventCommand`, `${event}EventCommandHint`, "", `${deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].command !== "" ? atob(deviceInteractions.eventInteractions[`${getEventId(event)}`].command) : ""}`, false, false)}
											<div class="btn-group" role="group">
												${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}SaveEventInteraction`, "btn btn-outline-secondary", `saveEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-floppy" title="${translateString("strSave")}"></i> ${translateString("strSave")}`, true, undefined, undefined, setEventHandler)}`;
	if(deviceInteractions !== null && (deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].target !== "" && deviceInteractions.eventInteractions[`${getEventId(event)}`].command !== ""))
	{
		interactionExpander += `
												${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}TestEventInteraction`, "btn btn-outline-secondary", `testEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-play" title="${translateString("strTest")}"></i> ${translateString("strTest")}`, true, undefined, undefined, setEventHandler)}
												${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}DeleteEventInteraction`, "btn btn-outline-secondary", `deleteEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-trash3" title="${translateString("strDelete")}"></i> ${translateString("strDelete")}`, true, undefined, undefined, setEventHandler)}`;
	}
	else
	{
		interactionExpander += `
												${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}TestEventInteraction`, "btn btn-outline-secondary", `testEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-play" title="${translateString("strTest")}"></i> ${translateString("strTest")}`, false, undefined, undefined, setEventHandler)}
												${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}DeleteEventInteraction`, "btn btn-outline-secondary", `deleteEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-trash3" title="${translateString("strDelete")}"></i> ${translateString("strDelete")}`, false, undefined, undefined, setEventHandler)}`;
	}
	interactionExpander += `
											</div>
										</div>`;
	return interactionExpander;
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
				document.getElementById("toastPropertyUpdateOKHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastPropertyUpdateOKText").innerHTML = translateMessages("messageSaveSettingsOkMessage");
				toast.show();
				generateDeviceSettingsModal(deviceId, deviceName)
			}
			else
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageSaveSettingsFailedMessage");
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastPropertyUpdateFailedText").innerHTML = `${translateMessages("messageSaveSettingsFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
				toast.show();
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
												<i class="bi-gear-wide-connected" title="${translateContent("lblFirmware")}"></i>&nbsp;<span class="placeholder col-4 placeholder-lg"></span>
											</h6>
										</span>
									</div>
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
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
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageLoadTimeZoneInfoNotSuccessfullMessage"));;
				}
			}
			else
			{
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageLoadTimeZoneInfoFailedMessage"));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageLoadTimeZoneInfoFailedMessage"));
		}
		else
		{ }
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
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorNoStationForGetInfo", "StationPropertiesMetadata"));;
				}
			}
			else
			{
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationPropertiesMetadata"));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationPropertiesMetadata"));
		}
		else
		{ }
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
					fillStationSettingsModal(stationId, timeZones, stationPropertiesMetadata, objResp.modelName, objResp.isDeviceKnownByClient, objResp.isP2PConnected, objResp.data);
				}
				else
				{
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorNoStationForGetInfo", "StationPropertiesMetadata"));
				}
			}
			else
			{
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationPropertiesMetadata"));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationPropertiesMetadata"));
		}
		else
		{ }
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
											${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary", undefined, translateContent("btnClose"), true, "modal", undefined, true)}
										</div>
									</div>
								</div>`;
}

function fillStationSettingsModal(stationId, timeZone, stationPropertiesMetadata, modelName, isDeviceKnownByClient, isP2PConnected, stationProperties)
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
	if(isStationOrDevicesKnown(stationProperties.model.slice(0,5)) == false && isDeviceKnownByClient === true)
	{
		setEventHandler = false;
		stationModal += `
										${createMessageContainer("alert alert-warning", translateContent("lblNotSupportedStationHeading"), translateContent("lblNotSupportedDeviceMessage", `${location.protocol}//${location.hostname}:${port}/getStationPropertiesTruncated/${deviceId}`, `${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${deviceId}`), translateContent("lblNotSupportedStationSubText"))}
										${createMessageContainer("alert alert-primary", translateContent("lblNotSupportedStationNoSaving"), "", "")}`;
	}
	else if (isDeviceKnownByClient === false)
	{
		setEventHandler = false;
		stationModal += `
										${createMessageContainer("alert alert-warning", translateContent("lblUnknownStationHeading"), translateContent("lblUnknownStationMessage", stationProperties.model), "")}
										${createMessageContainer("alert alert-primary", translateContent("lblUnknownStationNoSaving"), "", "")}`;
	}
	stationModal +=     `
									</div>
									<div class="row text-center">
										<div class="col">
											<span id="lblStationModel">
												<h5 class="card-subtitle mb-2">${modelName === "unknown" ? translateString("strUnknownDevice") : modelName} <span class="text-muted">(${stationProperties.model})</span></h5>
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
										${generateColumnForProperty("col", "lblStationFirmware", "", `<h6 class="card-subtitle text-muted">`, `</h6>`, "bi-gear-wide-connected", translateContent("lblFirmware"), stationProperties.softwareVersion)}
									</div>`;
	if(isP2PConnected === false)
	{
		stationModal +=  `
									${createMessageContainer("alert alert-warning", translateContent("titleNoP2PConnection"), translateContent("titleNoP2PConnectionDesc"), "")}
								</div>
								<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
									${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
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
										<h5 class="card-header">${translateContent("lblHeaderAudioSettings")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined)
		{
			stationModal +=  `
											<h5>${translateContent("lblAlarmTone")}</h5>`;
			if(stationPropertiesMetadata.alarmTone !== undefined)
			{
				stationModal +=  `
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmTone.name, stationProperties.alarmTone, setEventHandler, stationPropertiesMetadata.alarmTone.states)}`;
			}
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
											<h5>${translateContent("lblPromptVolume")}</h5>
											${generateElementRange("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.promptVolume.name, stationProperties.promptVolume, setEventHandler, stationPropertiesMetadata.promptVolume.unit, stationPropertiesMetadata.promptVolume.min, stationPropertiesMetadata.promptVolume.max, stationPropertiesMetadata.promptVolume.default)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.notificationSwitchModeSchedule !== undefined || stationPropertiesMetadata.notificationSwitchModeGeofence !== undefined || stationPropertiesMetadata.notificationSwitchModeApp !== undefined || stationPropertiesMetadata.notificationSwitchModeKeypad!== undefined || stationPropertiesMetadata.notificationStartAlarmDelay !== undefined)
	{
		stationModal +=  `
									<div class="card mb-3" id="cardStationNotificationSettings">
										<h5 class="card-header">${translateContent("lblHeaderNotificationSettings")}</h5>
										<div class="card-body">
											<h5>${translateContent("lblPushNotification")}</h5>
											<label class="mb-2" for="chkStationSwitchToSchedule">${translateContent("lblPushNotificationDesc")}</label>
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
										<h5 class="card-header">${translateContent("lblTimeSettings")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.timeZone !== undefined)
		{
			stationModal +=  `
											<h5>${translateContent("lblTimeZone")}</h5>
											${generateElementSelectTimeZone("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.timeZone.name, stationProperties.timeZone, false, timeZone)}`;
		}
		if(stationPropertiesMetadata.timeFormat !== undefined)
		{
			stationModal +=  `
											${stationPropertiesMetadata.timeZone !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblTimeFormat")}</h5>
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.timeFormat.name, stationProperties.timeFormat, setEventHandler, stationPropertiesMetadata.timeFormat.states)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.crossCameraTracking !== undefined || stationPropertiesMetadata.continuousTrackingTime !== undefined || stationPropertiesMetadata.trackingAssistance !== undefined || stationPropertiesMetadata.crossTrackingCameraList !== undefined || stationPropertiesMetadata.crossTrackingGroupList !== undefined)
	{
		stationModal +=  `
									<div class="card mb-3 collapse" id="cardStationCrossCameraTracking">
										<h5 class="card-header">${translateContent("lblCrossCameraTracking")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.crossCameraTracking !== undefined)
		{
			stationModal +=  `
											<h5>${translateContent("lblCrossCameraTracking")}</h5>
											${generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.crossCameraTracking.name, stationProperties.crossCameraTracking, setEventHandler)}`;
		}
		if(stationPropertiesMetadata.continuousTrackingTime !== undefined)
		{
			stationModal +=  `
											${stationPropertiesMetadata.crossCameraTracking !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblContinuousTrackingTime")}</h5>
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.continuousTrackingTime.name, stationProperties.continuousTrackingTime, setEventHandler, stationPropertiesMetadata.continuousTrackingTime.states)}`;
		}
		if(stationPropertiesMetadata.trackingAssistance !== undefined)
		{
			stationModal +=  `
											${stationPropertiesMetadata.crossCameraTracking !== undefined || stationPropertiesMetadata.continuousTrackingTime !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblTrackingAssistance")}</h5>
											${generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.trackingAssistance.name, stationProperties.trackingAssistance, setEventHandler)}`;
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
										<h5 class="card-header">${translateContent("lblStorageInfoHeader")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.sdCapacity !== undefined || stationPropertiesMetadata.sdCapacityAvailable !== undefined)
		{
			stationModal +=  `
											<h5>${translateContent("lblInternalStorage")}</h5>
											${stationProperties.sdStatus == 0 ? createMessageContainer("alert alert-success", "", translateSdStatusMessageText(stationProperties.sdStatus), "") : createMessageContainer("alert alert-warning", "", `${translateMessages("messageStorageErrorHeader")}:<br />${translateSdStatusMessageText(stationProperties.sdStatus)}`, translateMessages("messageStorageErrorSubText"))}`;
			if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity >= 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable >= 0)
			{
				var capacityUnits = ["", "", ""];
				var rawTempValue = stationProperties.sdCapacity/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var sdCapacity = (rawTempValue/1024).toFixed(2);
					capacityUnits[0] = "TB";
				}
				else
				{
					var sdCapacity = (rawTempValue).toFixed(2);
					capacityUnits[0] = "GB";
				}
				rawTempValue = stationProperties.sdCapacityAvailable/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var sdCapacityAvailable = (rawTempValue/1024).toFixed(2);
					capacityUnits[1] = "TB";
				}
				else
				{
					var sdCapacityAvailable = (rawTempValue).toFixed(2);
					capacityUnits[1] = "GB";
				}
				rawTempValue = (stationProperties.sdCapacity/conversionFactor) - (stationProperties.sdCapacityAvailable/conversionFactor);
				if(rawTempValue >= 1024)
				{
					var sdCapacityUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[2] = "TB";
				}
				else
				{
					var sdCapacityUsed = (rawTempValue).toFixed(2);
					capacityUnits[2] = "GB";
				}
				var sdCapacityUsedPercent = (sdCapacityUsed/sdCapacity*100).toFixed(0);
				stationModal += `
											${generateElementProgress("sdCapacityUsedPercent", sdCapacityUsedPercent)}
											<div class="row gap-3">
												<div class="col">
													<h5>${stationProperties.sdCapacity !== undefined ? `${sdCapacity} ${capacityUnits[0]}` : ""}</h5>
													${translatePropertyName(stationPropertiesMetadata.sdCapacity.name)}
												</div>
												<div class="col">
													<h5>${stationProperties.sdCapacity !== undefined && stationProperties.sdCapacityAvailable !== undefined ? `${sdCapacityUsed} ${capacityUnits[1]}` : ""}</h5>
													${translatePropertyName("sdCapacityUsed")}
												</div>
												<div class="col">
													<h5>${stationProperties.sdCapacityAvailable !== undefined ? `${sdCapacityAvailable} ${capacityUnits[2]}` : ""}</h5>
													${translatePropertyName(stationPropertiesMetadata.sdCapacityAvailable.name)}
												</div>
											</div>`;
			}
			else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0)
			{
				stationModal += `
											${createMessageContainer("alert alert-warning", "", translateMessages("messageStorageCapacityErrorHeader"), translateMessages("messageStorageCapacityErrorSubText"))}`;
			}
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.storageInfoEmmc !== undefined || stationPropertiesMetadata.storageInfoHdd !== undefined)
	{
		var conversionFactor = 1024;
		stationModal +=  `
									<div class="card mb-3" id="cardStationStorageSettings">
										<h5 class="card-header">${translateContent("lblStorageInfoHeader")}</h5>
										<div class="card-body">`;
		if(stationProperties.storageInfoEmmc !== undefined)
		{
			stationModal +=  `
											<h5>${translateContent("lblInternalEmmcStorage")}</h5>
											${stationProperties.storageInfoEmmc.health == 0 ? createMessageContainer("alert alert-success", "", translateSdStatusMessageText(stationProperties.storageInfoEmmc.health), "") : createMessageContainer("alert alert-warning", "", `${translateMessages("messageStorageErrorHeader")}:<br />${translateSdStatusMessageText(stationProperties.storageInfoEmmc.health)}`, translateMessages("messageStorageErrorSubText"))}`;
			if(stationProperties.storageInfoEmmc.disk_size !== undefined && stationProperties.storageInfoEmmc.disk_size > 0 && stationProperties.storageInfoEmmc.system_size !== undefined && stationProperties.storageInfoEmmc.system_size >= 0 && stationProperties.storageInfoEmmc.disk_used !== undefined && stationProperties.storageInfoEmmc.disk_used >= 0 && stationProperties.storageInfoEmmc.data_used_percent !== undefined && stationProperties.storageInfoEmmc.data_used_percent >= 0 && stationProperties.storageInfoEmmc.video_size !== undefined && stationProperties.storageInfoEmmc.video_size >= 0 && stationProperties.storageInfoEmmc.video_used !== undefined && stationProperties.storageInfoEmmc.video_used >= 0 && stationProperties.storageInfoEmmc.data_partition_size !== undefined && stationProperties.storageInfoEmmc.data_partition_size >= 0 && stationProperties.storageInfoEmmc.eol_percent !== undefined && stationProperties.storageInfoEmmc.eol_percent >= 0)
			{
				var capacityUnits = ["", "", "", ""];
				var rawTempValue = stationProperties.storageInfoEmmc.disk_size/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var emmcCapacity = (rawTempValue/1024).toFixed(2);
					capacityUnits[0] = "TB";
				}
				else
				{
					var emmcCapacity = (rawTempValue).toFixed(2);
					capacityUnits[0] = "GB";
				}
				rawTempValue = stationProperties.storageInfoEmmc.disk_used/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var emmcCapacityUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[1] = "TB";
				}
				else
				{
					var emmcCapacityUsed = (rawTempValue).toFixed(2);
					capacityUnits[1] = "GB";
				}
				rawTempValue = (stationProperties.storageInfoEmmc.disk_size-stationProperties.storageInfoEmmc.disk_used)/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var emmcCapacityAvailable = (rawTempValue/1024).toFixed(2);
					capacityUnits[2] = "TB";
				}
				else
				{
					var emmcCapacityAvailable = (rawTempValue).toFixed(2);
					capacityUnits[2] = "GB";
				}
				var emmcCapacityUsedPercent = (stationProperties.storageInfoEmmc.disk_used/stationProperties.storageInfoEmmc.disk_size*100).toFixed(0);
				rawTempValue = (stationProperties.storageInfoEmmc.video_used/conversionFactor)/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var emmcVideoUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[3] = "TB";
				}
				else
				{
					var emmcVideoUsed = (rawTempValue).toFixed(2);
					capacityUnits[3] = "GB";
				}
				var emmcHealthState = 100 - stationProperties.storageInfoEmmc.eol_percent;
				stationModal += `
											${generateElementProgress("emmcCapacityUsedPercent", emmcCapacityUsedPercent)}
											<div class="row gap-3">
												<div class="col">
													<h5>${stationProperties.storageInfoEmmc.data_partition_size !== undefined ? `${emmcCapacity} ${capacityUnits[0]}` : ""}</h5>
													${translateContent("emmcCapacity")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoEmmc.disk_used !== undefined ? `${emmcCapacityUsed} ${capacityUnits[1]}` : ""}</h5>
													${translateContent("emmcCapacityUsed")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoEmmc.disk_size !== undefined && stationProperties.storageInfoEmmc.disk_used !== undefined !== undefined ? `${emmcCapacityAvailable} ${capacityUnits[2]}` : ""}</h5>
													${translateContent("emmcCapacityAvailable")}
												</div>
											</div>
											<div class="mt-3 row gap-3">
												<div class="col">
													<h5>${stationProperties.storageInfoEmmc.video_used !== undefined ? `${emmcVideoUsed} ${capacityUnits[3]}` : ""}</h5>
													${translateContent("emmcVideoUsed")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoEmmc.eol_percent !== undefined ? `${emmcHealthState}%` : ""}</h5>
													${translateContent("emmcHealthState")}
												</div>
												<div class="col">
													
												</div>
											</div>`;
			}
			else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0)
			{
				stationModal += `
											${createMessageContainer("alert alert-warning", "", translateMessages("messageStorageCapacityErrorHeader"), translateMessages("messageStorageCapacityErrorSubText"))}`;
			}
		}
		if(stationProperties.storageInfoHdd !== undefined)
		{
			stationModal +=  `
											<hr>
											<h5>${translateContent("lblHddStorage")}</h5>
											${stationProperties.storageInfoHdd.health == 0 ? createMessageContainer("alert alert-success", "", translateSdStatusMessageText(stationProperties.storageInfoHdd.health), "") : createMessageContainer("alert alert-warning", "", `${translateMessages("messageStorageErrorHeader")}:<br />${translateSdStatusMessageText(stationProperties.storageInfoHdd.health)}`, translateMessages("messageStorageErrorSubText"))}`;
			if(stationProperties.storageInfoHdd.disk_size !== undefined && stationProperties.storageInfoHdd.disk_size > 0 && stationProperties.storageInfoHdd.system_size !== undefined && stationProperties.storageInfoHdd.system_size >= 0 && stationProperties.storageInfoHdd.disk_used !== undefined &&  stationProperties.storageInfoHdd.disk_used >= 0 && stationProperties.storageInfoHdd.video_size !== undefined && stationProperties.storageInfoHdd.video_size >= 0 && stationProperties.storageInfoHdd.video_used !== undefined && stationProperties.storageInfoHdd.video_used >= 0)
			{
				var capacityUnits = ["", "", "", ""];
				var rawTempValue = stationProperties.storageInfoHdd.disk_size/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var hddCapacity = (rawTempValue/1024).toFixed(2);
					capacityUnits[0] = "TB";
				}
				else
				{
					var hddCapacity = (rawTempValue).toFixed(2);
					capacityUnits[0] = "GB";
				}
				rawTempValue = stationProperties.storageInfoHdd.disk_used/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var hddCapacityUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[1] = "TB";
				}
				else
				{
					var hddCapacityUsed = (rawTempValue).toFixed(2);
					capacityUnits[1] = "GB";
				}
				rawTempValue = (stationProperties.storageInfoHdd.disk_size-stationProperties.storageInfoHdd.disk_used)/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var hddCapacityAvailable = (rawTempValue/1024).toFixed(2);
					capacityUnits[2] = "TB";
				}
				else
				{
					var hddCapacityAvailable = (rawTempValue).toFixed(2);
					capacityUnits[2] = "GB";
				}
				var hddCapacityUsedPercent = (stationProperties.storageInfoHdd.disk_used/stationProperties.storageInfoHdd.disk_size*100).toFixed(0);
				rawTempValue = stationProperties.storageInfoHdd.video_used/conversionFactor;
				if(rawTempValue >= 1024)
				{
					var hddVideoUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[3] = "TB";
				}
				else
				{
					var hddVideoUsed = (rawTempValue).toFixed(2);
					capacityUnits[3] = "GB";
				}
				var hddHddType = stationProperties.storageInfoHdd.hdd_type;
				var hddCurrentTemperature = stationProperties.storageInfoHdd.cur_temperate;
				stationModal += `
											${generateElementProgress("hddCapacityUsedPercent", hddCapacityUsedPercent)}
											<div class="row gap-3">
												<div class="col">
													<h5>${stationProperties.storageInfoHdd.disk_size !== undefined && stationProperties.storageInfoHdd.system_size !== undefined ? `${hddCapacity} ${capacityUnits[0]}` : ""}</h5>
													${translateContent("hddCapacity")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoHdd.disk_used !== undefined ? `${hddCapacityUsed} ${capacityUnits[1]}` : ""}</h5>
													${translateContent("hddCapacityUsed")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoHdd.disk_size !== undefined && stationProperties.storageInfoHdd.disk_used !== undefined !== undefined ? `${hddCapacityAvailable} ${capacityUnits[2]}` : ""}</h5>
													${translateContent("hddCapacityAvailable")}
												</div>
											</div>
											<div class="mt-3 row gap-3">
												<div class="col">
													<h5>${stationProperties.storageInfoHdd.video_used !== undefined ? `${hddVideoUsed} ${capacityUnits[3]}` : ""}</h5>
													${translateContent("hddVideoUsed")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoHdd.hdd_type !== undefined ? `${hddHddType === -10 ? translateContent("hddIsHdd") : hddHddType === 1 ? translateContent("hddIsSsd") : `${translateContent("hddIsUnknown")} (${hddHddType})`}` : ""}</h5>
													${translateContent("hddHddType")}
												</div>
												<div class="col">
													<h5>${stationProperties.storageInfoHdd.cur_temperate !== undefined ? `${hddCurrentTemperature}°C` : ""}</h5>
													${translateContent("hddCurrentTemperature")}
												</div>
											</div>`;
			}
			else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0)
			{
				stationModal += `
											${createMessageContainer("alert alert-warning", "", translateMessages("messageStorageCapacityErrorHeader"), translateMessages("messageStorageCapacityErrorSubText"))}`;
			}
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	stationModal +=  `
									${makeButtonElement("btnStationReboot", "btn btn-outline-danger", `changeStationProperty('${stationProperties.serialNumber}', '${stationProperties.name}', 'rebootStation')`, translateString("strRebootStation"), true, undefined, undefined, setEventHandler)}`;
	stationModal +=  `
								</div>
								<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
									${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
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
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = translateContent("messageRebootStationHeader");
					document.getElementById("toastPropertyUpdateOKText").innerHTML = translateContent("messageRebootStationOkMessage");
				}
				else
				{
					document.getElementById("toastPropertyUpdateOKHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
					document.getElementById("toastPropertyUpdateOKText").innerHTML = translateMessages("messageSaveSettingsOkMessage");
				}
				toast.show();
				generateStationSettingsModal(stationId, stationName)
			}
			else
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
				if(propertyName == "rebootStation")
				{
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateContent("messageRebootStationHeader");
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateContent("messageRebootStationFailedMessage");
				}
				else
				{
					document.getElementById("toastPropertyUpdateFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
					document.getElementById("toastPropertyUpdateFailedText").innerHTML = translateMessages("messageSaveSettingsFailedMessage");
				}
				toast.show();
			}
		}
		else if(this.readyState == 4)
		{
			
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
					state = `${translateGuardMode(objResp.data[station].guardMode)}`;
					buttons =  `<div class="row g-2">`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnArm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 0 ? undefined : `setArm('${objResp.data[station].serialNumber}')`}` , translateGuardMode(0), (objResp.data[station].guardMode != 0), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 1 ? undefined : `setHome('${objResp.data[station].serialNumber}')`}`, translateGuardMode(1), (objResp.data[station].guardMode != 1), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 2 ? undefined : `setSchedule('${objResp.data[station].serialNumber}')`}`, translateGuardMode(2), (objResp.data[station].guardMode != 2), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnDisarm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 63 ? undefined : `setDisarm('${objResp.data[station].serialNumber}')`}`, translateGuardMode(63), (objResp.data[station].guardMode != 63), undefined, undefined, true)}</div>`;
					if(objResp.data[station].deviceType == "indoorcamera" && objResp.data[station].model == "T8410")
					{
						buttons += `<div class="col-sm-12">${makeButtonElement(`btnPrivacy${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setPrivacy('${objResp.data[station].serialNumber}', ${objResp.data[station].privacyMode === true ? `true` : `false`})`, `${objResp.data[station].privacyMode === true ? translateString("strActivate") : translateString("strDeactivate")}`, true, undefined, undefined, true)}</div>`;
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
						lastChangeTime = translateContent("lblUnknown");
					}
					else
					{
						lastChangeTime = translateContent("lblNotAvailable");
					}
					stations += createCardStation(objResp.data[station], false, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0 mb-1"><div class="col mb-1 pe-1"><span class="text-nowrap"><i class="bi-shield" title="${translateString("strCurrentState")}"></i>&nbsp;${objResp.data[station].privacyMode === undefined || objResp.data[station].privacyMode == false ? translateGuardMode(objResp.data[station].guardMode) : translateString("strInactive")}</span></div></div><div class="card-text d-grid gap-2">${buttons}</div></div>`, `<small class="text-muted">${translateContent("lblLastStateChange")}: ${lastChangeTime}</small>`);
				}
				text += createStationTypeCardsContainer(translateContent("lblStations"), "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3", stations);
				document.getElementById("btnArmAll").removeAttribute("disabled");
				document.getElementById("btnHomeAll").removeAttribute("disabled");
				document.getElementById("btnScheduleAll").removeAttribute("disabled");
				document.getElementById("btnDisarmAll").removeAttribute("disabled");
				document.getElementById("stations").innerHTML =  text;
				if(lastChangeTimeAll == -1)
				{
					lastChangeTimeAll = translateContent("lblUnknown");
				}
				else
				{
					lastChangeTimeAll = makeDateTimeString(new Date(lastChangeTimeAll))
				}
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${lastChangeTimeAll}</small>`;
			}
			else
			{
				document.getElementById("btnArmAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${translateContent("lblUnknown")}</small>`;
				document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageStationsNotFound"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("btnArmAll").setAttribute("disabled", true);
			document.getElementById("btnHomeAll").setAttribute("disabled", true);
			document.getElementById("btnScheduleAll").setAttribute("disabled", true);
			document.getElementById("btnDisarmAll").setAttribute("disabled", true);
			document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${translateContent("lblUnknown")}</small>`;
			document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageStationsNotFound"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			if(showLoading==true)
			{
				document.getElementById("btnArmAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${translateString("strWaitWhileLoading")}</small>`;
				document.getElementById("stations").innerHTML = createWaitMessage(translateContent("lblWaitMessageLoadStations"));
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
		document.getElementById("btnArmAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(0)}`;
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
				document.getElementById("btnArmAll").innerHTML = translateGuardMode(0);
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
		document.getElementById("btnArm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(0)}`;
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
		document.getElementById("btnHomeAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(1)}`;
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
				document.getElementById("btnHomeAll").innerHTML = translateGuardMode(1);
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
		document.getElementById("btnHome" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(1)}`;
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
		document.getElementById("btnScheduleAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(2)}`;
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
				document.getElementById("btnScheduleAll").innerHTML = translateGuardMode(2);
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
		document.getElementById("btnSchedule" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(2)}`;
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
		document.getElementById("btnDisarmAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(63)}`;
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
				document.getElementById("btnDisarmAll").innerHTML = translateGuardMode(63);
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
		document.getElementById("btnDisarm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(63)}`;
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
		document.getElementById("btnPrivacy" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${enabled === true ? translateString("strActivate") : translateString("strDeactivate")}`;
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
	document.getElementById("cbLogLevelAddon").setAttribute("disabled", true);
	document.getElementById("cbLogLevelMain").setAttribute("disabled", true);
	document.getElementById("cbLogLevelHttp").setAttribute("disabled", true);
	document.getElementById("cbLogLevelP2p").setAttribute("disabled", true);
	document.getElementById("cbLogLevelPush").setAttribute("disabled", true);
	document.getElementById("cbLogLevelMqtt").setAttribute("disabled", true);
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
	document.getElementById("cbLogLevelAddon").removeAttribute("disabled");
	document.getElementById("cbLogLevelMain").removeAttribute("disabled");
	document.getElementById("cbLogLevelHttp").removeAttribute("disabled");
	document.getElementById("cbLogLevelP2p").removeAttribute("disabled");
	document.getElementById("cbLogLevelPush").removeAttribute("disabled");
	document.getElementById("cbLogLevelMqtt").removeAttribute("disabled");
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
					document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageCountriesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					loadHouses();
				}
			}
			catch (e)
			{
				document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageCountriesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				loadHouses();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageCountriesLoadingFailedHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
			loadHouses();
		}
		else
		{
			document.getElementById("resultLoading").innerHTML = createWaitMessage(translateString("strLoadingSettings"));
			document.getElementById("countrySelectionMessage").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>${translateString("strLoadingCountries")}</strong></div>`;
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
						option.text=translateContent("lblHouseManagementStationsAndDevicesOfHome", objResp.data[house].houseName);
						document.getElementById("cbHouseSelection").add(option);
					}
					document.getElementById("houseSelectionMessage").innerHTML = "";
					loadStationsSettings();
				}
				else
				{
					document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageHousesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					loadStationsSettings();
				}
			}
			catch (e)
			{
				document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageHousesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				loadStationsSettings();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageHousesLoadingFailedHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
			loadStationsSettings();
		}
		else
		{
			document.getElementById("resultLoading").innerHTML = createWaitMessage(translateString("strLoadingSettings"));
			document.getElementById("houseSelectionMessage").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>${translateString("strLoadingHouses")}</strong></div>`;
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
						stations += `<div class="form-label-group was-validated" class="container-fluid"><label class="my-2" for="txtUdpPortsStation${objResp.data[station].serialNumber}">${translateContent("lblUDPPortStationLabel", objResp.data[station].serialNumber, objResp.data[station].name)}</label>`;
						stations += `<input type="text" name="udpPortsStation${objResp.data[station].serialNumber}" id="txtUdpPortsStation${objResp.data[station].serialNumber}" class="form-control" placeholder="${translateContent("lblUDPPortStationPlaceholder", objResp.data[station].serialNumber)}" onfocusout="checkUDPPorts(udpPortsStation${objResp.data[station].serialNumber})" required>`;
						stations += `<small class="form-text text-muted">${translateContent("lblUDPPortStationSubText")}</small>`;
						stations += `<div class="invalid-feedback">${translateContent("lblUDPPortStationError")}</div></div>`;
					}
					document.getElementById('chkUseUdpStaticPorts').removeAttribute("disabled");
					document.getElementById("useUDPStaticPortsStations").innerHTML = stations;
					loadSystemVariables();
				}
				else
				{
					document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageStationsLoadingError"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
					loadSystemVariables();
				}
			}
			catch (e)
			{
				document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageStationsLoadingError"), "", translateMessages("messageErrorPrintErrorMessage", e));
				document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
				loadSystemVariables();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageStationsLoadingError"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
			document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
			loadSystemVariables();
		}
		else
		{
			document.getElementById("resultLoading").innerHTML = createWaitMessage(translateString("strLoadingSettings"));
			document.getElementById("useUDPStaticPortsStations").innerHTML = `<div class="d-flex align-items-center mt-4"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>${translateString("strLoadingStations")}</strong></div>`;
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
					if(objResp.data.logLevelAddon === undefined || (objResp.data.logLevelAddon < "0" || objResp.data.logLevelAddon > "6"))
					{
						document.getElementById("cbLogLevelAddon").selectedIndex = 3;
					}
					else
					{
						document.getElementById("cbLogLevelAddon").selectedIndex = (Number.parseInt(objResp.data.logLevelAddon)) + 1;
					}
					if(objResp.data.logLevelMain === undefined || (objResp.data.logLevelMain < "0" || objResp.data.logLevelMain > "6"))
					{
						document.getElementById("cbLogLevelMain").selectedIndex = 3;
					}
					else
					{
						document.getElementById("cbLogLevelMain").selectedIndex = (Number.parseInt(objResp.data.logLevelMain)) + 1;
					}
					if(objResp.data.logLevelHttp === undefined || (objResp.data.logLevelHttp < "0" || objResp.data.logLevelHttp > "6"))
					{
						document.getElementById("cbLogLevelHttp").selectedIndex = 3;
					}
					else
					{
						document.getElementById("cbLogLevelHttp").selectedIndex = (Number.parseInt(objResp.data.logLevelHttp)) + 1;
					}
					if(objResp.data.logLevelP2p === undefined || (objResp.data.logLevelP2p < "0" || objResp.data.logLevelP2p > "6"))
					{
						document.getElementById("cbLogLevelP2p").selectedIndex = 3;
					}
					else
					{
						document.getElementById("cbLogLevelP2p").selectedIndex = (Number.parseInt(objResp.data.logLevelP2p)) + 1;
					}
					if(objResp.data.logLevelPush === undefined || (objResp.data.logLevelPush < "0" || objResp.data.logLevelPush > "6"))
					{
						document.getElementById("cbLogLevelPush").selectedIndex = 3;
					}
					else
					{
						document.getElementById("cbLogLevelPush").selectedIndex = (Number.parseInt(objResp.data.logLevelPush)) + 1;
					}
					if(objResp.data.logLevelMqtt === undefined || (objResp.data.logLevelMqtt < "0" || objResp.data.logLevelMqtt > "6"))
					{
						document.getElementById("cbLogLevelMqtt").selectedIndex = 3;
					}
					else
					{
						document.getElementById("cbLogLevelMqtt").selectedIndex = (Number.parseInt(objResp.data.logLevelMqtt)) + 1;
					}
					if(objResp.data.tokenExpire === undefined)
					{
						document.getElementById("hintTokenData").innerHTML = ``;
					}
					else
					{
						if(objResp.data.tokenExpire == 0)
						{
							document.getElementById("hintTokenData").innerHTML = `${translateContent("lblTokenNoToken")}<br />`;
						}
						else if(objResp.data.tokenExpire.toString().length == 10 || objResp.data.tokenExpire.toString().length == 13)
						{
							document.getElementById("hintTokenData").innerHTML = `${translateContent("lblTokenOk", objResp.data.tokenExpire.toString().length == 10 ? makeDateTimeString(new Date(objResp.data.tokenExpire*1000)) : makeDateTimeString(new Date(objResp.data.tokenExpire)))}<br />`;
						}
						else
						{
							document.getElementById("hintTokenData").innerHTML = `${translateContent("lblTokenUnknown", objResp.data.tokenExpire)}.<br />`;
						}
					}
					checkLogLevel("alertLogLevelAddon", objResp.data.logLevelAddon);
					checkLogLevel("alertLogLevelMain", objResp.data.logLevelMain);
					checkLogLevel("alertLogLevelHttp", objResp.data.logLevelHttp);
					checkLogLevel("alertLogLevelP2p", objResp.data.logLevelP2p);
					checkLogLevel("alertLogLevelPush", objResp.data.logLevelPush);
					checkLogLevel("alertLogLevelMqtt", objResp.data.logLevelMqtt);
					document.getElementById("resultLoading").innerHTML = "";
					activateUIElements();
					enableUIElements();
				}
				else
				{
					document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsLoadingErrorHeader"), "", translateMessages("messageErrorTwoValues", "success", objResp.success));
				}
			}
			catch (e)
			{
				document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsLoadingErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsLoadingErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			document.getElementById("resultLoading").innerHTML = createWaitMessage(translateString("strLoadingSettings"));
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
					document.getElementById("divSystemVariablesHint").innerHTML = createMessageContainer("alert alert-primary fade show", translateMessages("messageSystemVariableHintHeader"), translateMessages("messageSystemVariableHintMessage"), translateMessages("messageSystemVariableHintSubText"));
					sysVarTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">${translateString("strSystemVariablesTableHeaderState")}</th><th scope="col" style="width: 75%;">${translateString("strSystemVariablesTableHeaderSVName")}</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
					for(systemVariable in objResp.data)
					{
						sysVarName = objResp.data[systemVariable].sysVarName;
						sysVarInfo = objResp.data[systemVariable].sysVarInfo;
						sysVarAvailable = objResp.data[systemVariable].sysVarAvailable;
						if(objResp.data[systemVariable].sysVarCurrent==true)
						{
							if(sysVarAvailable==true)
							{
								sysVarTable += `<tr class="table-success"><th scope="row" class="align-middle text-center"><i class="bi-check-lg" title="${translateString("strSystemVariableAvailable")}"></i></th>`;
							}
							else
							{
								sysVarTable += `<tr class="table-danger"><th scope="row" class="align-middle text-center"><i class="bi-x-lg" title="${translateString("strSystemVariableNotAvailable")}"></i></th>`;
							}
							sysVarTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
							if(sysVarAvailable==true)
							{
								sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-outline-primary mb-1", undefined, translateContent("lblSystemVariableAvailable"), false, undefined, undefined, false)}</div></td>`;
							}
							else
							{
								sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `createSysVar('${sysVarName}', '${sysVarInfo}')`, translateContent("lblSystemVariableCreate"), true, undefined, undefined, true)}</div></td>`;
							}
							sysVarTable += `</tr>`;
						}
						else
						{
							if(sysVarToDelete==false)
							{
								sysVarDeprTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">${translateString("strSystemVariablesTableHeaderState")}</th><th scope="col" style="width: 75%;">${translateString("strSystemVariablesTableHeaderSVName")}</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
							}
							sysVarToDelete = true;
							sysVarDeprTable += `<tr class="table-danger"><th scope="row" class="align-middle text-center"><i class="bi-check-lg" title="${translateString("strSystemVariableAvailable")}"></i></th>`;
							sysVarDeprTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
							sysVarDeprTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `removeSysVar('${sysVarName}')`, translateContent("lblSystemVariableRemove"), true, undefined, undefined, true)}</div></td>`;
							sysVarDeprTable += `</tr>`;
						}
					}
					sysVarTable += `</tbody></table>`;
					document.getElementById("divSystemVariables").innerHTML = sysVarTable;
					if(sysVarToDelete==true)
					{
						sysVarDeprTable += `</tbody></table>`;
						document.getElementById("divDeprecatedSystemVariables").innerHTML = sysVarDeprTable;
						document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = `<hr /><div class="form-label-group" class="container-fluid"><label for="btnShowDeprecatedSystemVariables" class="mb-2">${translateString("strSystemVariablesUnusedHintHeader")}<br /><small class="form-text text-muted">${translateString("strSystemVariablesUnusedHintMessage")}</small></label></div>`;
					}
				}
				else
				{
					if(objResp.reason == "System variables in config disabled.")
					{
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-info mb-0", translateMessages("messageSystemVariablesDeactivatedHeader"), translateMessages("messageSystemVariablesDeactivatedMessage"), translateMessages("messageSystemVariablesDeactivatedSubText"));
					}
					else
					{
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageSystemVariablesLoadingErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					}
				}
				loadDataSettings();
			}
			catch (e)
			{
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageSystemVariablesLoadingErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				loadDataSettings();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageSystemVariablesLoadingErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
			loadDataSettings();
		}
		else
		{
			document.getElementById("divSystemVariables").innerHTML = createWaitMessage(translateString("strLoadingSystemVariables"));
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
				document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsSaveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsSaveErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			document.getElementById("resultMessage").innerHTML = createWaitMessage(translateString("strSettingsSaving"));
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
					document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesCreateErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
				}
			}
			catch (e)
			{
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesCreateErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesCreateErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = createWaitMessage(translateString("strSystemVariableCreating"));
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
					document.getElementById("divSystemVariablesHint").innerHTML = "";
					document.getElementById("divSystemVariables").innerHTML = "";
					document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
					document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
				}
			}
			catch (e)
			{
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = createWaitMessage(translateString("strSystemVariableUnusedRemoving"));
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
					document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), translateMessages("messageUploadConfigErrorFileToLargeMessage"), "");
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
		document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), "", translateMessages("messageUploadConfigErrorFileToLargeMessage"));
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
					document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), translateMessages("messageUploadConfigErrorCommonMessage"), translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					const toast = new bootstrap.Toast(toastUploadConfigFailed);
					toast.show();
					document.getElementById("btnSelectConfigFile").value = "";
					document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
				}
			}
			catch (e)
			{
				document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				document.getElementById("btnSelectConfigFile").value = "";
				document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
			document.getElementById("btnSelectConfigFile").value = "";
			document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
		}
		else
		{
			document.getElementById("resultUploadMessage").innerHTML = createWaitMessage(translateString("strUploadConfigUploadingAndTesting"));
			document.getElementById("btnSelectConfigFile").value = "";
			document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
		}
	};
	xmlHttp.open("POST", url);
	xmlHttp.send(objFD);
}

function removeInteractions()
{
	var xmlHttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/removeInteractions`;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.overrideMimeType('application/json');
	xmlHttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			try
			{
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true && objResp.interactionsRemoved == true)
				{
					const toast = new bootstrap.Toast(toastSaveConfigOK);
					toast.show();
					return;
				}
				else
				{
					const toast = new bootstrap.Toast(toastSaveConfigFailed);
					toast.show();
				}
			}
			catch (e)
			{
				const toast = new bootstrap.Toast(toastSaveConfigFailed);
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
		document.getElementById("btnEnableTroubleShooting").innerHTML = translateContent("lblSettingsTroubleShootingDisable");
		document.getElementById("headerRemoveInteractions").removeAttribute("class");
		document.getElementById("btnRemoveInteractions").removeAttribute("disabled");
		document.getElementById("headerDeleteTokenData").removeAttribute("class");
		document.getElementById("btnDeleteTokenData").removeAttribute("disabled");
		document.getElementById("headerRestartService").removeAttribute("class");
		document.getElementById("btnRestartService").removeAttribute("disabled");
	}
	else
	{
		document.getElementById("btnEnableTroubleShooting").setAttribute("onclick", "enableButtons(true)");
		document.getElementById("btnEnableTroubleShooting").setAttribute("class", "btn btn-outline-warning btn-block");
		document.getElementById("btnEnableTroubleShooting").innerHTML = translateContent("lblSettingsTroubleShootingEnable");
		document.getElementById("headerRemoveInteractions").setAttribute("class", "text-muted");
		document.getElementById("btnRemoveInteractions").setAttribute("disabled", true);
		document.getElementById("headerDeleteTokenData").setAttribute("class", "text-muted");
		document.getElementById("btnDeleteTokenData").setAttribute("disabled", true);
		document.getElementById("headerRestartService").setAttribute("class", "text-muted");
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

function checkLogLevel(elementName, value)
{
	if(value == "0" || value == "1")
	{
		document.getElementById(elementName).setAttribute("class", "alert alert-warning alert-dismissible fade show");
		document.getElementById(elementName).setAttribute("role", "alert");
		if(value == "0")
		{
			document.getElementById(elementName).innerHTML += `${translateContent("lblLogLevelToHighTraceMessage")}<br />`;
		}
		if(value == "1")
		{
			document.getElementById(elementName).innerHTML += `${translateContent("lblLogLevelToHighDebugMessage")}<br />`;
		}
		document.getElementById(elementName).innerHTML += `<small class="form-text text-muted">${translateContent("lblLogLevelToHighSubText")}</small>`;
	}
	else
	{
		document.getElementById(elementName).removeAttribute("class");
		document.getElementById(elementName).removeAttribute("role");
		document.getElementById(elementName).innerHTML = "";
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
		errorMessage = `${translateMessages("messageUdpPortNoNumberMessage")}<br /><br />${translateMessages("messageUdpPortInputRemoveMessage")}`;
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
						errorMessage = `${translateMessages("messageUdpPortPortAlreadyUsedMessage")}<br /><br />${translateMessages("messageUdpPortInputRemoveMessage")}`;
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
	var xmlHttp, url, objResp, logData;
	switch(logfiletype)
	{
		case "index":
			break;
		case "log":
			url=`logfileAddonLogGetContent.cgi`;
			document.getElementById("tabHeaderAddonErr").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.remove("active");
			document.getElementById("tabHeaderAddonLog").classList.add("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '/var/log/eufySecurity.log'`;
			break;
		case "err":
			url=`logfileAddonErrGetContent.cgi`;
			document.getElementById("tabHeaderAddonLog").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.remove("active");
			document.getElementById("tabHeaderAddonErr").classList.add("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '/var/log/eufySecurity.err'`;
			break;
		case "clientLog":
			url=`logfileClientGetContent.cgi`;
			document.getElementById("tabHeaderAddonLog").classList.remove("active");
			document.getElementById("tabHeaderAddonErr").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.add("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '/var/log/eufySecurityClient.log'`;
			break;
		default:
			return;
	}
	xmlHttp = new XMLHttpRequest();
	xmlHttp.overrideMimeType('application/json');
	xmlHttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			objResp = JSON.parse(this.responseText);
			if(objResp.success === true)
			{
				if(objResp.hasData === true)
				{
					logData = decodeURIComponent(objResp.data);
					
					logData = logData.replace(/  /g, "&#160;&#160;");
					logData = logData.replace(/>/g, '&gt;');
					logData = logData.replace(/</g, '&lt;');
					logData = logData.replace(/\n/g, "<br />");
				}

				if(objResp.hasData === true)
				{
					document.getElementById("log").innerHTML = `<code>${logData}</code>`;
					document.getElementById("btnDeleteLogfileData").removeAttribute("disabled");
					document.getElementById("btnDownloadLogfile").removeAttribute("disabled");
				}
				else
				{
					document.getElementById("log").innerHTML = `<code>${translateContent("lblFileIsEmpty", '/var/log/eufySecurity.log')}</code>`;
					document.getElementById("btnDeleteLogfileData").setAttribute("disabled", true);
					document.getElementById("btnDownloadLogfile").setAttribute("disabled", true);
				}
			}
			else
			{
				document.getElementById("log").innerHTML = `<code>${objResp.reason}</code>`;
				document.getElementById("btnDeleteLogfileData").setAttribute("disabled", true);
				document.getElementById("btnDownloadLogfile").setAttribute("disabled", true);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("log").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageLoadLogFileErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			if(showLoading == true)
			{
				document.getElementById("log").innerHTML = createWaitMessage(translateString("strLoadingLogFile"));
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
				info = `${translateString("strAddOnName")}: ${objResp.apiVersion}<br />${translateString("strClientName")}: ${objResp.eufySecurityClientVersion}<br />${translateString("strHomeMaticApi")}: ${objResp.homematicApiVersion}<br />${translateString("strWebsite")}: ${version}<br />${getLanguageInfo()}`;
				document.getElementById("versionInfo").innerHTML = info;
			}
			else
			{
				document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageLoadVersionInfoErrorHeader"), "", "");
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageLoadVersionInfoErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState));
		}
		else
		{
			if(showLoading == true)
			{
				document.getElementById("versionInfo").innerHTML = createWaitMessage(translateString("strLoadingVersionInfo"));
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
		document.getElementById("headerApiSettingsError").innerHTML = translateContent("lblHeaderApiSettingsErrorCaptcha");
		document.getElementById("messageApiSettingsError").innerHTML = translateContent("lblMessageApiSettingsErrorCaptcha");
		checkServiceState(0, 0, 0);
	}
	else
	{
		document.getElementById("headerApiSettingsError").innerHTML = translateContent("lblHeaderApiSettingsError");
		document.getElementById("messageApiSettingsError").innerHTML = translateContent("lblMessageApiSettingsError");
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
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							}
							else
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha")
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileLogin")}</div>`;
							}
							else
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileInit")}</div>`;
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
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							}
							else
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha")
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileLogin")}</div>`;
							}
							else
							{
								initStart = `<div class="spinner-border m-4 float-left text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileInit")}</div>`;
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
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							}
							else
							{
								startDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initDone = "";
							if(action == "captcha")
							{
								initDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">${translateString("strLoginFinished")}</div>`;
							}
							else
							{
								initDone = `<i class="bi-check-circle fs-2 my-3 mx-4 float-left text-success" title="Einstellungen"></i><div class="fw-bold">${translateString("strInitFinished")}</div>`;
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