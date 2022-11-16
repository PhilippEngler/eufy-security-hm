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

function getWifiSignalLevelIcon(wifiSignalLevel)
{
	return wifiSignalLevel == 0 ? "bi-reception-0" : wifiSignalLevel == 1 ? "bi-reception-1" : wifiSignalLevel == 2 ? "bi-reception-2" : wifiSignalLevel == 3 ? "bi-reception-3" : wifiSignalLevel == 4 ? "bi-reception-4" : "bi-wifi-off";
}

function createCardStation(station, showSettingsIcon, cardBodyText, cardFooterText)
{
	var card = "";

	card += `<div class="col"><div class="card mb-3">`;
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${station.name}</h5></div>`;
	card += `${showSettingsIcon == true ? `<div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0"><i class="bi-gear" title="Einstellungen" onclick="generateStationSettingsModal('${station.serialNumber}')"></i></h5></span></div>` : ""}`;
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

function createStationTypeCardsContainer(firendlyTypeName, rowConfig, cards)
{
	if(cards != "")
	{
		return `<h4>${firendlyTypeName}</h4><div class="${rowConfig}">${cards}</div>`;
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
	return `<div class="${classText}" role="alert">${messageHeader != "" ? `<h5 class="mb-1 alert-heading">${messageHeader}</h5>` : ""}${messageText != "" ? `<p class="mb-0"}">${messageText}</p>` : ""}${messageSubText != "" ? `<hr><p class="my-0 form-text text-muted">${messageSubText}</p>` : ""}</div>`;
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
					stations += createMessageContainer("alert alert-primary", "Es wurden keine Stationen gefunden.", "", "");
				}
				text += createStationTypeCardsContainer("Stationen", "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-5 g-3", stations);
				document.getElementById("stations").innerHTML =  text;
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
	var text = "", cams = "", indoorcams = "", solocams = "", doorbellcams = "", floodlightcams = "", locks = "", keypads = "", sensors = "", unknown = "";
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
					text += createDeviceTypeCardsContainer("doorbellcameras", "Videotürklingelkameras", doorbellcams);
					text += createDeviceTypeCardsContainer("floodlightcameras", "Flutlichtkameras", floodlightcams);
					text += createDeviceTypeCardsContainer("locks", "Locks", locks);
					text += createDeviceTypeCardsContainer("keypads", "Keypads", keypads);
					text += createDeviceTypeCardsContainer("sensors", "Sensoren", sensors);
					text += createDeviceTypeCardsContainer("unknown", "unbekannte Geräte", unknown);
					document.getElementById("devices").innerHTML =  text;
				}
				else
				{
					document.getElementById("devices").innerHTML = `<h4>Geräte</h4>${createMessageContainer("alert alert-primary", "Es wurden keine Geräte gefunden.", "", "")}`;
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
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${device.name}</h5></div><div style="text-align:right;"><span class="text-nowrap"><h5 class="mb-0"><i class="${getWifiSignalLevelIcon(device.wifiSignalLevel)}" title="WiFi Empfangsstärke: ${device.wifiRssi}dB"></i>&nbsp;&nbsp;<i class="bi-gear" title="Einstellungen" onclick="generateDeviceSettingsModal('${device.serialNumber}')"></i></h5></span></div></div>`;

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
											<span class="placeholder col-8 placeholder-lg"></span>
										</span>
									</div>
									<div class="col">
										<span id="lblDeviceInfo">
											<h6 class="card-subtitle text-muted">
											<div class="row">
												<div class="col">
													<span class="text-nowrap">
														<i class="bi-gear-wide-connected text-muted" title="Firmwareversion"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
													</span>
												</div>
												<div class="col">
													<span class="text-nowrap">
														<i class="bi-battery text-muted" title="Ladezustand des Akkus"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
													</span>
												</div>
												<div class="col">
													<span class="text-nowrap">
														<i class="bi-thermometer-low text-muted" title="Temperatur"></i>&nbsp;<span class="placeholder col-6 placeholder-lg"></span>
													</span>
												</div>
											</div>
										</span>
									</div>
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${generateButton("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined)}
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
					getDeviceProperties(deviceId, objResp.data)
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
											${generateButton("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined)}
										</div>
									</div>
								</div>`;
}

function fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, modelName, deviceProperties)
{
	var deviceModal =  `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">${deviceProperties.name} (${deviceId})</h5></div><div style="text-align:right;"><h5 class="mb-0"><span class="text-nowrap"><i class="${getWifiSignalLevelIcon(deviceProperties.wifiSignalLevel)}" title="WiFi Empfangsstärke: ${deviceProperties.wifiRssi}dB"></i></span></h5></div>
							</div>
							<div class="modal-body placeholder-glow" id="divModalDeviceSettingsContent">
								<div class="" id="lblModalDeviceSettingsInfo">`;
	if(!(deviceProperties.model.startsWith("T8112") || deviceProperties.model.startsWith("T8113") || deviceProperties.model.startsWith("T8114") || deviceProperties.model.startsWith("T8142")))
	{
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
												<div class="col">
													<span class="text-nowrap">
														<i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${deviceProperties.softwareVersion}
													</span>
												</div>`;
		}
		if(deviceProperties.battery !== undefined)
		{
			deviceModal += `
												<div class="col">
													<span class="text-nowrap">
														<i class="${deviceProperties.chargingStatus == 1 ? "bi-battery-charging" : deviceProperties.battery < 5 ? "bi-battery" : deviceProperties.battery < 50 ? "bi-battery-half" : "bi-battery-full"} ${deviceProperties.battery < 5 ? "text-danger" : deviceProperties.battery < 15 ? "text-warning" : ""}" title="Ladezustand des Akkus"></i>&nbsp;${deviceProperties.battery}%</span>
													</span>
												</div>`;
		}
		if(deviceProperties.batteryTemperature !== undefined)
		{
			deviceModal += `
												<div class="col">
													<span class="text-nowrap">
														<i class="${deviceProperties.batteryTemperature < 0 ? "bi-thermometer-low" : deviceProperties.batteryTemperature < 30 ? "bi-thermometer-half" : "bi-thermometer-high"}" title="Temperatur"></i>&nbsp;${deviceProperties.batteryTemperature}&deg;C
													</span>
												</div>`;
		}
		deviceModal +=     `
											</h6>
										</span>`;
	}
	deviceModal +=     `
									</div>
								</div>`;
	if(deviceProperties.enabled !== undefined || deviceProperties.antitheftDetection !== undefined || deviceProperties.statusLed !== undefined)
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
												${generateElementSwitch("Device", devicePropertiesMetadata.enabled.name, deviceProperties.enabled, deviceProperties.serialNumber, deviceProperties.name)}
											</div>`;
		}
		if(deviceProperties.antitheftDetection !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>Diebstahlerkennung</h5>
												${generateElementSwitch("Device", devicePropertiesMetadata.antitheftDetection.name, deviceProperties.antitheftDetection, deviceProperties.serialNumber, deviceProperties.name)}
											</div>`;
		}
		if(deviceProperties.statusLed !== undefined)
		{
			deviceModal += `
											<div class="col">
												<h5>Status LED</h5>
												${generateElementSwitch("Device", devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, deviceProperties.serialNumber, deviceProperties.name)}
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
										${generateElementSwitch("Device", devicePropertiesMetadata.motionDetection.name, deviceProperties.motionDetection, deviceProperties.serialNumber, deviceProperties.name)}`;
			if(deviceProperties.motionDetectionSensitivity !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined ? `<hr />`: ``}
										<h5>Erkennungsempfindlichkeit</h5>
										${generateElementRange("Device", devicePropertiesMetadata.motionDetectionSensitivity.name, devicePropertiesMetadata.motionDetectionSensitivity.min, devicePropertiesMetadata.motionDetectionSensitivity.max, devicePropertiesMetadata.motionDetectionSensitivity.defaut, deviceProperties.motionDetectionSensitivity, devicePropertiesMetadata.motionDetectionSensitivity.unit, deviceProperties.serialNumber, deviceProperties.name)}`;
			}
			if(deviceProperties.motionDetectionType !== undefined)
			{
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity ? `<hr />`: ``}
										<h5>Erkennungsart</h5>
										${generateElementSelect("Device", devicePropertiesMetadata.motionDetectionType.name, devicePropertiesMetadata.motionDetectionType.states, deviceProperties.motionDetectionType, deviceProperties.serialNumber, deviceProperties.name)}`;
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
										${generateRadioGroup("Device", devicePropertiesMetadata.powerWorkingMode.name, devicePropertiesMetadata.powerWorkingMode.states, deviceProperties.powerWorkingMode, deviceProperties.serialNumber, deviceProperties.name)}
										<div id="divDeviceCustomRecordingSettings" ${deviceProperties.powerWorkingMode == 2 ? "" : `class="collapse"`}>`;
			if(deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined)
			{
				deviceModal += `
											<hr />
											<h5>Benutzerdefinierte Einstellungen</h5>`;
				if(deviceProperties.recordingClipLength !== undefined)
				{
					deviceModal += `
											${generateElementRange("Device", devicePropertiesMetadata.recordingClipLength.name, devicePropertiesMetadata.recordingClipLength.min, devicePropertiesMetadata.recordingClipLength.max, devicePropertiesMetadata.recordingClipLength.defaut, deviceProperties.recordingClipLength, devicePropertiesMetadata.recordingClipLength.unit, deviceProperties.serialNumber, deviceProperties.name)}`;
				}
				if(deviceProperties.recordingRetriggerInterval !== undefined)
				{
					deviceModal += `
											${generateElementRange("Device", devicePropertiesMetadata.recordingRetriggerInterval.name, devicePropertiesMetadata.recordingRetriggerInterval.min, devicePropertiesMetadata.recordingRetriggerInterval.max, devicePropertiesMetadata.recordingRetriggerInterval.default, deviceProperties.recordingRetriggerInterval, devicePropertiesMetadata.recordingRetriggerInterval.unit, deviceProperties.serialNumber, deviceProperties.name)}`;
				}
				if(deviceProperties.recordingEndClipMotionStops !== undefined)
				{
					deviceModal += `
											${generateElementSwitch("Device", devicePropertiesMetadata.recordingEndClipMotionStops.name, deviceProperties.recordingEndClipMotionStops, deviceProperties.serialNumber, deviceProperties.name)}`;
				}
				deviceModal += `
										</div>`;
			}
		}
		if(deviceProperties.powerSource !== undefined)
		{
			deviceModal += `
										${deviceProperties.powerWorkingMode !== undefined ? `<hr />` : ``}
										<h5>Energiequelle</h5>
										<label>zur Zeit genutzte Energiequelle: ${getDeviceStateValueInGerman(devicePropertiesMetadata.powerSource.states[deviceProperties.powerSource])} (${getDeviceStateValueInGerman(devicePropertiesMetadata.chargingStatus.states[deviceProperties.chargingStatus])})</label>`;
		}
		if(deviceProperties.lastChargingDays !== undefined || deviceProperties.lastChargingTotalEvents !== undefined || deviceProperties.lastChargingFalseEvents !== undefined || deviceProperties.lastChargingRecordedEvents !== undefined)
		{
			deviceModal += `
										${deviceProperties.powerWorkingMode !== undefined || deviceProperties.powerSource !== undefined ? `<hr />` : ``}
										<h5>Erkennungsstatisik</h5>`;
			if(deviceProperties.lastChargingDays !== undefined)
			{
				deviceModal += `
										<label>Letzter Ladevorgang war vor ${deviceProperties.lastChargingDays} Tag${deviceProperties.lastChargingDays == 1 ?"" : "en"}.</label><br />`;
			}
			if(deviceProperties.lastChargingTotalEvents !== undefined)
			{
				deviceModal += `
										<label>${deviceProperties.lastChargingDays !== undefined ? `Seitdem wurde${deviceProperties.lastChargingTotalEvents > 1 ? "n " : " "}` : `Es wurde${deviceProperties.lastChargingTotalEvents > 1 ? "n " : " "}`}${deviceProperties.lastChargingTotalEvents} Ereignisse erkannt.</label><br />`;
			}
			if(deviceProperties.lastChargingFalseEvents !== undefined)
			{
				deviceModal += `
										<label>Davon waren ${deviceProperties.lastChargingFalseEvents} gefilterte, falsche Ereignisse.</label><br />`;
			}
			if(deviceProperties.lastChargingRecordedEvents !== undefined)
			{
				deviceModal += `
										<label>Insgesamt wurden ${deviceProperties.lastChargingDays !== undefined ? "seitdem " : ""}${deviceProperties.lastChargingRecordedEvents} ausgezeichnet.</label>`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.watermark !== undefined || deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined)
	{
		deviceModal += `
								<div class="card mb-3" id="cardDeviceVideoSettings">
									<h5 class="card-header">Videoeinstellungen</h5>
									<div class="card-body">`;
		if(deviceProperties.watermark !== undefined)
		{
			deviceModal += `
										<h5>Wasserzeichen</h5>
										${generateElementSelect("Device", devicePropertiesMetadata.watermark.name, devicePropertiesMetadata.watermark.states, deviceProperties.watermark, deviceProperties.serialNumber, deviceProperties.name)}`;
		}
		if(deviceProperties.videoRecordingQuality !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined ? `<hr />` : ``}
										<h5>Aufzeichnungsqualität</h5>
										${generateElementSelect("Device", devicePropertiesMetadata.videoRecordingQuality.name, devicePropertiesMetadata.videoRecordingQuality.states, deviceProperties.videoRecordingQuality, deviceProperties.serialNumber, deviceProperties.name)}`;
		}
		if(deviceProperties.videoStreamingQuality !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>Streamingqualität</h5>
										${generateElementSelect("Device", devicePropertiesMetadata.videoStreamingQuality.name, devicePropertiesMetadata.videoStreamingQuality.states, deviceProperties.videoStreamingQuality, deviceProperties.serialNumber, deviceProperties.name)}`;
		}
		if(deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined)
		{
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>Nachtsicht</h5>
										${devicePropertiesMetadata.autoNightvision === undefined ? "" : generateElementSwitch("Device", devicePropertiesMetadata.autoNightvision.name, deviceProperties.autoNightvision, deviceProperties.serialNumber, deviceProperties.name)}
										${devicePropertiesMetadata.nightvision === undefined ? "" : generateElementSelect("Device", devicePropertiesMetadata.nightvision.name, devicePropertiesMetadata.nightvision.states, deviceProperties.nightvision, deviceProperties.serialNumber, deviceProperties.name)}
										${devicePropertiesMetadata.lightSettingsBrightnessManual === undefined ? "" : generateElementRange("Device", devicePropertiesMetadata.lightSettingsBrightnessManual.name, devicePropertiesMetadata.lightSettingsBrightnessManual.min, devicePropertiesMetadata.lightSettingsBrightnessManual.max, devicePropertiesMetadata.lightSettingsBrightnessManual.default, deviceProperties.lightSettingsBrightnessManual, "", deviceProperties.serialNumber, deviceProperties.name)}`;

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
										<h5>Mikrofon</h5>
										${generateElementSwitch("Device", devicePropertiesMetadata.microphone.name, deviceProperties.microphone, deviceProperties.serialNumber, deviceProperties.name)}`;
			if(deviceProperties.audioRecording !== undefined && deviceProperties.microphone !== undefined && deviceProperties.microphone == true)
			{
				deviceModal += `
										${generateElementSwitch("Device", devicePropertiesMetadata.audioRecording.name, deviceProperties.audioRecording, deviceProperties.serialNumber, deviceProperties.name)}`;
			}
		}
		if(deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined)
		{
			deviceModal += `
										${deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined ? `<hr />` : ``}
										<h5>Lautsprecher</h5>
										${devicePropertiesMetadata.speaker === undefined ? "" : generateElementSwitch("Device", devicePropertiesMetadata.speaker.name, deviceProperties.speaker, deviceProperties.serialNumber, deviceProperties.name)}
										${devicePropertiesMetadata.speakerVolume === undefined ? "" : generateElementSelect("Device", devicePropertiesMetadata.speakerVolume.name, devicePropertiesMetadata.speakerVolume.states, deviceProperties.speakerVolume, deviceProperties.serialNumber, deviceProperties.name)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.notificationType !== undefined)
	{
		deviceModal += `
								<div class="card" id="cardDeviceNotificationSettings">
									<h5 class="card-header">Benachrichtigungen</h5>
									<div class="card-body">
										<h5>Art der Benachrichtigung</h5>
										${generateRadioGroup("Device", devicePropertiesMetadata.notificationType.name, devicePropertiesMetadata.notificationType.states, deviceProperties.notificationType, deviceProperties.serialNumber, deviceProperties.name)}
									</div>
								</div>`;
	}
	deviceModal += `
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${generateButton("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined)}
							</div>
						</div>
					</div>`;

	document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
}

function generateElementSwitch(type, propertyName, value, serialNumber, name)
{
	return `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == true ? " checked" : ""} onclick="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.checked)"><label class="form-check-label" for="chk${propertyName}">${getPropertyNameInGerman(propertyName)}</label></div>`;
}

function generateElementRadio(type, propertyName, value, state, stateValue, serialNumber, name)
{
	return `<div class="form-check"><input class="form-check-input" type="radio" name="grp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" id="rb${state.charAt(0).toUpperCase() + state.slice(1)}" ${value == true ? " checked" : ""} onclick="change${type}Property('${serialNumber}', '${name}', '${propertyName}', ${stateValue})"><label class="form-check-label" for="rb${state.charAt(0).toUpperCase() + state.slice(1)}">${getDeviceStateValueInGerman(state)}</label></div>`;
}

function generateRadioGroup(type, propertyName, states, value, serialNumber, name)
{
	var radioGroup = ``;
	for(var state in states)
	{
		radioGroup += generateElementRadio(type, propertyName, state == value ? true : false, states[state], state, serialNumber, name);
	}
	return radioGroup;
}

function generateElementRange(type, propertyName, min, max, defaultValue, value, unit, serialNumber, name)
{
	return `<div><label for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label mb-0 align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}: <span id="spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value">${value == undefined ? defaultValue : value}</span>${unit === undefined ? "" : getDeviceStateValueInGerman(unit)}</label>${min !== undefined && max !== undefined ? `<div class="d-flex justify-content-between"><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Min">${min}</small></div><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Max">${max}</small></div></div>` : ""}<input type="range" class="form-range ${min === undefined ? "mt-0" : "my-0"}" min="${min}" max="${max}" id="${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" value="${value == undefined ? defaultValue : value}" oninput="updateSliderValue('spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value', this.value)" onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)">${defaultValue !== undefined ? `<div class="text-end">${generateElementButton("Station", propertyName, defaultValue, serialNumber, name, "btn btn-outline-secondary btn-sm", true)}</div>` : ""}</div>`;
}

function generateElementSelect(type, propertyName, states, value, serialNumber, name)
{
	var selectElement = `<label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${getPropertyNameInGerman(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" onchange="change${type}Property('${serialNumber}', '${name}', '${propertyName}', this.value)">`;
	for(var state in states)
	{
		selectElement += generateSelectElement(propertyName, value, state, states[state])
	}
	selectElement += `</select>`;
	return selectElement;
}

function generateSelectElement(propertyName, value, valueNumber, state)
{
	return `<option value=${valueNumber} id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == valueNumber ? " selected" : ""}>${getDeviceStateValueInGerman(state, propertyName, valueNumber)}</option>`;
}

function generateElementButton(type, propertyName, value, serialNumber, name, buttonClass, setToDefault)
{
	return `<div>${generateButton(`btn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}${setToDefault == true ? "ToDefault" : ""}`, `${buttonClass}`, `change${type}Property('${serialNumber}', '${name}', '${propertyName}')`, `${setToDefault == true ? `Standardwert setzen` : `${getPropertyNameInGerman(propertyName)}`}`, true)}</div>`;
}

function generateButton(buttonId, buttonClass, buttonOnClick, description, enabled, dataBsDismiss, ariaLabel)
{
	return `<button id="${buttonId}" type="button" class="${buttonClass}"${buttonOnClick !== undefined ? ` onclick="${buttonOnClick}"` : ""}${enabled == false ? " disabled" : ""}${dataBsDismiss !== undefined ? ` data-bs-dismiss="${dataBsDismiss}"` : ""}${ariaLabel !== undefined ? ` aria-label="${ariaLabel}"` : ""}>${description}</button>`;
}

function getPropertyNameInGerman(propertyName)
{
	switch(propertyName)
	{
		case "enabled":
			return "Gerät aktiviert";
		case "antitheftDetection":
			return "Diebstahlerkennung aktiviert";
		case "statusLed":
			return "Status LED aktiviert";
		case "motionDetection":
			return "Bewegungserkennung aktiviert";
		case "motionDetectionSensitivity":
			return "Erkennungsempfindlichkeit";
		case "motionDetectionType":
			return "Art der Bewegungserkennung";
		case "recordingClipLength":
			return "Cliplänge";
		case "recordingRetriggerInterval":
			return "Intervall für erneutes Auslösen";
		case "recordingEndClipMotionStops":
			return "Clip frühzeitiger beenden wenn Bewegung stoppt";
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
			return "Helligkeit des Scheinwerfers"
		case "microphone":
			return "Mikrofon aktivieren";
		case "audioRecording":
			return "Audioaufzeichnung aktivieren";
		case "speaker":
			return "Lautsprecher aktivieren";
		case "speakerVolume":
			return "Lautstärke";
		case "alarmTone":
			return "Alarmton auswählen";
		case "alarmVolume":
			return "Lautstärke Alarmton";
		case "promptVolume":
			return "Lautstärke Eingabeaufforderung";
		case "notificationSwitchModeSchedule":
			return "Moduswechsel in Modus Zeitplan";
		case "notificationSwitchModeGeofence":
			return "Moduswechsel in Modus Geofancing";
		case "notificationSwitchModeApp":
			return "Moduswechsel in Modus durch die App";
		case "notificationSwitchModeKeypad":
			return "Moduswechsel in Modus durch das Keypad";
		case "notificationStartAlarmDelay":
			return "Starten der Alarmverzögerung";
		case "rebootStation":
			return "Station neu starten";
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
		case "sec":
			return "s";
		case "Optimal Battery Life":
			return "optimale Akkulebensdauer";
		case "Optimal Surveillance":
			return "optimale Überwachung";
		case "Custom Recording":
			return "Aufzeichnung anpassen";
		case "Battery":
			return "Batterie";
		case "Solar Panel":
			return "Solarpanel";
		case "Charging":
			return "ladend";
		case "Unplugged":
			return "nicht angeschossen";
		case "Plugged":
			return "angeschlossen";
		case "Solar charging":
			return "ladend mit Solarpanel";
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
		case "Spotlight Night Vision":
			return "farbige Nachtsicht";
		case "Low":
			switch(propertyName)
			{
				case "speakerVolume":
					return "leise";
				case "videoStreamingQuality":
					return "niedrig";
				default:
					return state;
			}
		case "Medium":
			switch(propertyName)
			{
				case "speakerVolume":
				case "videoStreamingQuality":
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
					return "hoch";
				default:
					return state;
			}
		case "Auto":
			return "automatisch";
		case "Most Efficient":
			return "am effizientesten";
		case "Include Thumbnail":
			return "mit Miniaturansicht";
		case "Full Effect":
			return "komplett";
		case "Alarm sound 1":
			return "Alarmton 1";
		case "Alarm sound 2":
			return "Alarmton 2";
		default:
			return state;
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
				toast.show();
				generateDeviceSettingsModal(deviceId, deviceName)
			}
			else
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
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
	var displayText = "";
	switch(element)
	{
		case "spnRecordingClipLengthValue":
			displayText = `${value}`;
			break;
		case "spnDeviceCustomRecordingSettingsRetriggerIntervallValue":
			displayText = `${value}`;
			break;
		case "spnAlarmVolumeValue":
			displayText = `${value}`;
			break;
		case "spnPromptVolumeValue":
			displayText = `${value}`;
			break;
	}
	document.getElementById(element).innerHTML = displayText;
}

function generateStationSettingsModal(stationId, stationName)
{
	generateContentStationSettingsModal(stationId, stationName);

	if(stationName === undefined)
	{
		const myModal = new bootstrap.Modal(document.getElementById('modalStationSettings'));
		myModal.show();
	}

	getStationPropertiesMetadata(stationId);
}

function generateContentStationSettingsModal(stationId, stationName)
{
	var stationModal =  `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalStationSettingsTitle">
								${stationName === undefined ? `<span class="placeholder col-6 bg-light placeholder-lg mt-1 mb-1"></span>` : `<div style="text-align:left; float:left;"><h5 class="mb-0">${stationName} (${stationId})</h5></div>`}
								${generateButton("btnStationSettingsModalCloseTop", "btn-close", undefined, "", true, "modal", "close")}
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
											<span class="placeholder col-8 placeholder-lg"></span>
										</span>
									</div>
									<div class="col">
										<span id="lblStationFirmware">
											<i class="bi-gear-wide-connected text-muted" title="Firmwareversion"></i>&nbsp;
											<span class="placeholder col-4 placeholder-lg"></span>
										</span>
									</div>
								</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${generateButton("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, "Schließen", true, "modal", undefined)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalStationSettings").innerHTML = stationModal;
}

function getStationPropertiesMetadata(stationId)
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
					getStationProperties(stationId, objResp.data)
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
			//document.getElementById("divModalStationSettingsContent").innerHTML = createWaitMessage("Lade Einstellungen des Geräts...");</strong></div>`;
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function getStationProperties(stationId, stationPropertiesMetadata)
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
					fillStationSettingsModal(stationId, stationPropertiesMetadata, objResp.modelName, objResp.data);
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
			//document.getElementById("divModalStationSettingsContent").innerHTML = createWaitMessage("Lade Einstellungen des Geräts...");</strong></div>`;
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
											${generateButton("btnCloseModalStationSettingsBottom", "btn btn-primary", undefined, "Schließen", true, "modal", undefined)}
										</div>
									</div>
								</div>`;
}

function fillStationSettingsModal(stationId, stationPropertiesMetadata, modelName, stationProperties)
{
	var stationModal =  `
						<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
							<div class="modal-content">
								<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalStationSettingsTitle">
									<div style="text-align:left; float:left;"><h5 class="mb-0">${stationProperties.name} (${stationId})</h5></div>
									${generateButton("btnCloseModalStationSettingsTop", "btn-close", undefined, "", true, "modal", "close")}
								</div>
								<div class="modal-body placeholder-glow" id="divModalStationSettingsContent">
									<div class="" id="lblModalStationSettingsInfo">`;
	if(!(stationProperties.model.startsWith("T8002") || stationProperties.model.startsWith("T8010")))
	{
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
										<div class="col">
											<span id="lblStationFirmware">
												<h6 class="card-subtitle text-muted"><i class="bi-gear-wide-connected" title="Firmwareversion"></i>&nbsp;${stationProperties.softwareVersion}</h6>
											</span>
										</div>
									</div>
									<div class="card mb-3 collapse" id="cardStationStorageSettings">
										<h5 class="card-header">Speicher</h5>
										<div class="card-body">
											<label>Speicherbelegung:</label>
										</div>
									</div>`;
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
											${generateElementSelect("Station", stationPropertiesMetadata.alarmTone.name, stationPropertiesMetadata.alarmTone.states, stationProperties.alarmTone, stationProperties.serialNumber, stationProperties.name)}
											${generateElementRange("Station", stationPropertiesMetadata.alarmVolume.name, stationPropertiesMetadata.alarmVolume.min, stationPropertiesMetadata.alarmVolume.max, stationPropertiesMetadata.alarmVolume.defaut, stationProperties.alarmVolume, stationPropertiesMetadata.alarmVolume.unit, stationProperties.serialNumber, stationProperties.name)}`;
		}
		if(stationPropertiesMetadata.promptVolume !== undefined)
		{
			stationModal +=  `
											${stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined ? `<hr />`: ``}
											<h5>Eingabeaufforderung</h5>
											${generateElementRange("Station", stationPropertiesMetadata.promptVolume.name, stationPropertiesMetadata.promptVolume.min, stationPropertiesMetadata.promptVolume.max, stationPropertiesMetadata.promptVolume.defaut, stationProperties.promptVolume, stationPropertiesMetadata.promptVolume.unit, stationProperties.serialNumber, stationProperties.name)}`;
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
											${stationPropertiesMetadata.notificationSwitchModeSchedule === undefined ? "" : generateElementSwitch("Station", stationPropertiesMetadata.notificationSwitchModeSchedule.name, stationPropertiesMetadata.notificationSwitchModeSchedule, stationProperties.serialNumber, stationProperties.name)}
											${stationPropertiesMetadata.notificationSwitchModeGeofence === undefined ? "" : generateElementSwitch("Station", stationPropertiesMetadata.notificationSwitchModeGeofence.name, stationPropertiesMetadata.notificationSwitchModeGeofence, stationProperties.serialNumber, stationProperties.name)}
											${stationPropertiesMetadata.notificationSwitchModeApp === undefined ? "" : generateElementSwitch("Station", stationPropertiesMetadata.notificationSwitchModeApp.name, stationPropertiesMetadata.notificationSwitchModeApp, stationProperties.serialNumber, stationProperties.name)}
											${stationPropertiesMetadata.notificationSwitchModeKeypad === undefined ? "" : generateElementSwitch("Station", stationPropertiesMetadata.notificationSwitchModeKeypad.name, stationPropertiesMetadata.notificationSwitchModeKeypad, stationProperties.serialNumber, stationProperties.name)}
											${stationPropertiesMetadata.notificationStartAlarmDelay === undefined ? "" : generateElementSwitch("Station", stationPropertiesMetadata.notificationStartAlarmDelay.name, stationPropertiesMetadata.notificationStartAlarmDelay, stationProperties.serialNumber, stationProperties.name)}
										</div>
									</div>`;
	}
	stationModal +=  `
									${generateButton("btnStationReboot", "btn btn-outline-danger", `changeStationProperty('${stationProperties.serialNumber}', '${stationProperties.name}', 'rebootStation')`, "Station neu starten", true)}`;
	stationModal +=  `
								</div>
								<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
									${generateButton("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, "Scließen", true, "modal")}
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
				toast.show();
				generateStationSettingsModal(stationId, stationName)
			}
			else
			{
				const toast = new bootstrap.Toast(toastPropertyUpdateFailed);
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
					if(objResp.data[station].deviceType == "station")
					{
						switch(objResp.data[station].guardMode)
						{
							case 0:
								state = "abwesend";
								buttons =  `<div class="row g-2">`;
								buttons += `<div class="col-sm-6">${generateButton(`btnArm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", undefined, "ab&shy;we&shy;send", false)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setHome('${objResp.data[station].serialNumber}'`, "zu Hause", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setSchedule('${objResp.data[station].serialNumber}')`, "Zeit&shy;steu&shy;e&shy;rung", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnDisarm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setDisarm('${objResp.data[station].serialNumber}')`, "de&shy;ak&shy;ti&shy;viert", true)}</div>`;
								buttons += `</div>`;
								break;
							case 1:
								state = "zu Hause";
								buttons =  `<div class="row g-2">`;
								buttons += `<div class="col-sm-6">${generateButton(`btnArm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setArm('${objResp.data[station].serialNumber}')`, "ab&shy;we&shy;send", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", undefined, "zu Hause", false)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setSchedule('${objResp.data[station].serialNumber}')`, "Zeit&shy;steu&shy;e&shy;rung", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnDisarm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setDisarm('${objResp.data[station].serialNumber}')`, "de&shy;ak&shy;ti&shy;viert", true)}</div>`;
								buttons += `</div>`;
								break;
							case 2:
								state = "Zeitsteuerung";
								buttons =  `<div class="row g-2">`;
								buttons += `<div class="col-sm-6">${generateButton(`btnArm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setArm('${objResp.data[station].serialNumber}')`, "ab&shy;we&shy;send", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setHome('${objResp.data[station].serialNumber}'`, "zu Hause", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", undefined, "Zeit&shy;steu&shy;e&shy;rung", false)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnDisarm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setDisarm('${objResp.data[station].serialNumber}')`, "de&shy;ak&shy;ti&shy;viert", true)}</div>`;
								buttons += `</div>`;
								break;
							case 63:
								state = "deaktiviert";
								buttons =  `<div class="row g-2">`;
								buttons += `<div class="col-sm-6">${generateButton(`btnArm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setArm('${objResp.data[station].serialNumber}')`, "ab&shy;we&shy;send", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setHome('${objResp.data[station].serialNumber}'`, "zu Hause", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setSchedule('${objResp.data[station].serialNumber}')`, "Zeit&shy;steu&shy;e&shy;rung", true)}</div>`;
								buttons += `<div class="col-sm-6">${generateButton(`btnDisarm${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", undefined, "de&shy;ak&shy;ti&shy;viert", false)}</div>`;
								buttons += `</div>`;
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
				text += createStationTypeCardsContainer("Stationen", "row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-5 g-3", stations);
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
		document.getElementById("btnArmAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;abwesend`;
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
		document.getElementById("btnArm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;abwesend`;
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
		document.getElementById("btnScheduleAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;Zeitsteuerung`;
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
		document.getElementById("btnSchedule" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;Zeitsteuerung`;
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
		document.getElementById("btnDisarmAll").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;deaktiviert`;
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
		document.getElementById("btnDisarm" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;deaktiviert`;
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
						stations += `<div class="form-label-group was-validated" class="container-fluid"><label class="mt-2" for="txtUdpPortsStation${objResp.data[station].serialNumber}">UDP Port für Verbindung mit der Station ${objResp.data[station].serialNumber} (${objResp.data[station].name}).</label>`;
						stations += `<input type="text" name="udpPortsStation${objResp.data[station].serialNumber}" id="txtUdpPortsStation${objResp.data[station].serialNumber}" class="form-control" placeholder="UDP Port ${objResp.data[station].serialNumber}" onfocusout="checkUDPPorts(udpPortsStation${objResp.data[station].serialNumber})" required>`;
						stations += `<small class="form-text text-muted">Der angegebene Port darf nicht in Verwendung und keiner anderen Station zugeordnet sein.</small>`;
						stations += `<div class="invalid-feedback">Bitte geben Sie eine Zahl zwischen 1 und 65535 ein. Diese Zahl darf keiner anderen Station zugeordnet sein.</div></div>`;
					}
					document.getElementById('chkUseUdpStaticPorts').removeAttribute("disabled");
					document.getElementById("useUDPStaticPortsStations").innerHTML = stations;
					loadDataSettings();
				}
				else
				{
					document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
					document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
					loadDataSettings();
				}
			}
			catch (e)
			{
				document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.", "", `Es ist folgender Fehler aufgetreten: ${e}`);
				document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
				loadDataSettings();
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", "Fehler bei der Ermittlung der Stationen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
					if(objResp.data.country == undefined || objResp.data.country == "")
					{
						document.getElementById("cbCountry").selectedIndex = "";
					}
					else
					{
						document.getElementById("cbCountry").value = objResp.data.country;
					}
					if(objResp.data.language == undefined || objResp.data.language == "")
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
					if(objResp.data.connectionTypeP2p == undefined || (objResp.data.connectionTypeP2p != "0" && objResp.data.connectionTypeP2p != "1" && objResp.data.connectionTypeP2p != "2"))
					{
						document.getElementById("cbConnectionType").selectedIndex = 0;
					}
					else
					{
						document.getElementById("cbConnectionType").selectedIndex = (Number.parseInt(objResp.data.connectionTypeP2p)) + 1;
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
							if(tempPorts == undefined || tempPorts == null || tempPorts == "undefined")
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
					document.getElementById("divSystemVariablesHint").innerHTML = createMessageContainer("alert alert-primary fade show", "Option 'Systemvariablen bei API Aktionen automatisch aktualisieren' ist aktiviert.", "Das AddOn wird die entsprechenden Systemvariablen aktualisieren. In der folgenden Tabelle finden Sie alle Systemvariablen, die dieses AddOn auf der CCU benötigt. Wenn die jeweilige Zeile grün ist, ist die Systemvariable auf der CCU bereits angelegt, ansonsten ist die Zeile rot.", "Bitte achten Sie darauf, dass alle Systemvariablen angelegt sind. Wenn Sie die Aktualisierung der Systemvariablen nicht wünschen, deaktivieren Sie bitte die Option 'Systemvariablen bei API Aktionen automatisch aktualisieren`");
					sysVarTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">Status</th><th scope="col" style="width: 75%;">Name der Systemvariable</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
					for(systemVariable in objResp.data)
					{
						sysVarName = objResp.data[systemVariable].sysVarName;
						sysVarInfo = objResp.data[systemVariable].sysVarInfo;
						sysVarAvailable = objResp.data[systemVariable].sysVarAvailable;
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
							sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${generateButton(`btn${sysVarName}`, "btn btn-primary mb-1", undefined, "System&shy;variable anlegen", false)}</div></td>`;
						}
						else
						{
							sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${generateButton(`btn${sysVarName}`, "btn btn-primary mb-1", `createSysVar('${sysVarName}', '${sysVarInfo}')`, "System&shy;variable anlegen")}</div></td>`;
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
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-info mb-0", "Die Aktualisierung von Systemvariablen bei API Aktionen ist deaktiviert.", "", "");
					}
					else
					{
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: '${objResp.reason}'.`);
					}
				}
			}
			catch (e)
			{
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", "Fehler bei der Ermittlung der Systemvariablen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
					document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${objResp.reason}`);
				}
			}
			catch (e)
			{
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
			}
		}
		else if(this.readyState == 4)
		{
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei der Ermittlung der Systemvariablen.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
		}
		else
		{
			document.getElementById("divSystemVariables").innerHTML = createWaitMessage("Laden der Systemvariablen...");
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
	xmlHttp.addEventListener( "error", function(event)
	{
		document.getElementById("resultUploadMessage").innerHTML = "";
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
				document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", "Fehler bei dem Speichern der Einstellungen.", "", `Es ist folgender Fehler aufgetreten: ${e}.`);
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
					document.getElementById("log").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Protokolldatei.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
					break;
				case "err":
					document.getElementById("err").innerHTML = createMessageContainer("alert alert-danger", "Fehler beim Laden der Fehlerprotokolldatei.", "Eventuell wird das Addon nicht ausgeführt. Ein Neustart des Addons oder der CCU könnte das Problem beheben.", `Rückgabewert 'Status' ist '${this.status}'. Rückgabewert 'ReadyState' ist '4'.`);
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
				info = `eufy Security AddOn: ${objResp.apiVersion}<br />eufy Security Client: ${objResp.eufySecurityClientVersion}<br />HomeMatic API: ${objResp.homematicApiVersion}<br />Webseite: 1.7.0`;
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