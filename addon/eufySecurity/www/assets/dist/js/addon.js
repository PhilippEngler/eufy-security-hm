/**
 * Javascript for eufySecurity Addon
 * 202500921
 */
var action = "";
var port = "";
var redirectTarget = "";
var sid = "";
var codeMirrorEditor = undefined;
var serviceState = undefined;
var version = "3.5.2";

/**
 * common used java script functions
 */
//#region common
function loadScript(url, async, page) {
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

function start(page) {
	loadScript(`assets/dist/js/lang/${getLanguage()}.js`, false, page);
}

function init(page) {
	var urlParams
	if(window.location.search != "") {
		urlParams = new URLSearchParams(window.location.search);
		if(getParameterFromURLSearchParams(urlParams, "sid")) {
			redirectTarget = `${redirectTarget}${redirectTarget === "" ? "?" : "&"}sid=${getParameterFromURLSearchParams(urlParams, "sid")}`;
			sid = getParameterFromURLSearchParams(urlParams, "sid");
		}
		if(getParameterFromURLSearchParams(urlParams, "lang")) {
			redirectTarget = `${redirectTarget}${redirectTarget === "" ? "?" : "&"}lang=${getParameterFromURLSearchParams(urlParams, "lang")}`;
		}
		addUrlParams(redirectTarget);
		if(getParameterFromURLSearchParams(urlParams, "redirect")) {
			if(getParameterFromURLSearchParams(urlParams, "redirect") == "index.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "devices.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "statechange.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "settings.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "logfiles.html" || getParameterFromURLSearchParams(urlParams, "redirect") == "info.html") {
				redirectTarget = getParameterFromURLSearchParams(urlParams, "redirect") + redirectTarget;
			} else {
				redirectTarget = "";
			}
		} else {
			redirectTarget = "";
		}
		
		if(getParameterFromURLSearchParams(urlParams, "action")) {
			action = getParameterFromURLSearchParams(urlParams, "action");
		} else {
			action = "";
		}
	}
	getServiceState(page);
}

function getParameterFromURLSearchParams(urlParams, parameterName) {
	return urlParams.get(parameterName);
}

function addUrlParams(urlParameter) {
	document.getElementById("niMain").setAttribute("href", document.getElementById("niMain").getAttribute("href") + urlParameter);
	document.getElementById("niHome").setAttribute("href", document.getElementById("niHome").getAttribute("href") + urlParameter);
	document.getElementById("niDevices").setAttribute("href", document.getElementById("niDevices").getAttribute("href") + urlParameter);
	document.getElementById("niStateChange").setAttribute("href", document.getElementById("niStateChange").getAttribute("href") + urlParameter);
	document.getElementById("niSettings").setAttribute("href", document.getElementById("niSettings").getAttribute("href") + urlParameter);
	document.getElementById("niLogfiles").setAttribute("href", document.getElementById("niLogfiles").getAttribute("href") + urlParameter);
	document.getElementById("niInfo").setAttribute("href", document.getElementById("niInfo").getAttribute("href") + urlParameter);
}

function retrieveData(method, url, mimeType, postData, waitElementId, waitMessage, waitFunction, waitFuntionArguments, readyStateChangeFunction, readyStateChangeFunctionArguments) {
	return new Promise((resolve, reject) => {
		let xmlHttp = new XMLHttpRequest();
		if(mimeType != undefined) {
			xmlHttp.overrideMimeType(mimeType);
		}

		xmlHttp.onreadystatechange = function() {
			//called on each readyState change
			if(readyStateChangeFunction !== undefined) {
				readyStateChangeFunction.apply(this, readyStateChangeFunctionArguments);
			}
		};

		xmlHttp.onloadstart = function() {
			//called when load starts; readyState is 3
			if(waitElementId !== undefined && waitMessage !== undefined) {
				document.getElementById(waitElementId).innerHTML = createWaitMessage(translateContent(waitMessage));
			} else if(waitFunction !== undefined) {
				waitFunction.apply(this, waitFuntionArguments);
			}
		};

		xmlHttp.onabort = function() {
			reject({"cause": "ABORT"});
		};

		xmlHttp.onload = function() {
			//called when load finished successfully; readyState is 4; state is 200
			if(this.status === 200) {
				resolve(this.responseText)
			} else {
				reject({"cause": "ERROR", "status": this.status, "readyState": this.readyState, "statusText": this.statusText});
			}
		};

		xmlHttp.onerror = function() {
			//called when load finished with error; readyState is 4; state is 0
			reject({"cause": "ERROR", "status": this.status, "readyState": this.readyState, "statusText": this.statusText});
		};

		xmlHttp.onloadend = function() {
			//called when load finished (successfully and with error); readyState is 4; state is 0 or 200
		};

		xmlHttp.open(method, url, true);
		if(method == "POST") {
			xmlHttp.send(postData);
		} else {
			xmlHttp.send();
		}
	});
};

async function getServiceState(page) {
	var url = `${location.protocol}//${location.hostname}/addons/eufySecurity/serviceManager.cgi?action=getServiceState`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.running == true) {
					serviceState = "running";
				} else {
					serviceState = "stopped";
				}
			} else {
				serviceState = undefined;
			}
		} catch (e) {
			serviceState = undefined;
		}
	}).catch((err) => {
		serviceState = undefined;
	});

	getAPIPort(page)
}

async function getAPIPort(page) {
	if(serviceState == "running") {
		var objResp, objErr;
		var url = `${location.protocol}//${location.hostname}/addons/eufySecurity/apiPorts.json`;
		await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(location.protocol == "http:") {
					if(objResp.useHttp == true && objResp.httpPort !== undefined) {
						port = objResp.httpPort;
						document.getElementById("loadApiSettingsError").innerHTML = "";
						checkConfigNeeded(page);
						return;
					}
				} else {
					if(objResp.useHttps == true && objResp.httpsPort !== undefined) {
						port = objResp.httpsPort;
						document.getElementById("loadApiSettingsError").innerHTML = "";
						checkConfigNeeded(page);
						return;
					}
				}
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortInactiveHeader", location.protocol.replace(":", "")), "", translateMessages("messageApiPortInactiveSubText", location.protocol == "http:" ? "https-" : "http-"));
			} catch (e) {
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortFileNotFoundHeader"), translateMessages("messageApiPortFileNotFoundMessageText"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_API_PORT_JSON"));
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortFileNotFoundHeader"), translateMessages("messageApiPortFileNotFoundMessageText"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState));
				}
			} catch (e) {
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageApiPortFileNotFoundHeader"), translateMessages("messageApiPortFileNotFoundMessageText"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_API_PORT_REQUEST"));
			}
		});
	} else {
		if(page !== "logfiles" && page !== "info" && page !== "restartWaiter") {
			document.getElementById("serviceNotRunningError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorServiceNotRunningHeader"), "", translateMessages("messageErrorServiceNotRunningMessage"));
		} else {
			checkConfigNeeded(page);
		}
	}
}

function initContent(page) {
	if(page != "restartWaiter") {
		checkTfaCaptchaState(page);
	}
	switch(page) {
		case "devices":
			loadStations();
			loadDevices();
			break;
		case "statechange":
			loadDataStatechange(true);
			break;
		case "settings":
			validateFormSettings();
			loadSettings();
			break;
		case "logfiles":
			initLogViewer("log", true);
			break;
		case "info":
			loadDataInfo(true);
			break;
		case "restartWaiter":
			restartAPIService();
			break;
	}
}

async function checkConfigNeeded(page) {
	if(page == "settings" || page == "logfiles" || page == "info" || page == "restartWaiter") {
		initContent(page);
		return;
	}
	if(serviceState == "running") {
		var objResp, objErr;
		var url = `${location.protocol}//${location.hostname}:${port}/getApiState`;
		await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
			try {
				document.getElementById("commonError").innerHTML = "";
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					if(objResp.data.serviceState == "configNeeded") {
						generateConfigNeeded(page);
					} else {
						initContent(page);
					}
				} else {
					document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"));
				}
			} catch (e) {
				document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_CONFIG_NEEDED_JSON"));
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorCheckingAddonStateHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "checkConfigNeeded"));
				}
			} catch (e) {
				document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_CONFIG_NEEDED_REQUEST"));
			}
		});
	} else {
		initContent(page);
	}
}

async function checkTfaCaptchaState(page) {
	if(serviceState == "running") {
		var objResp, objErr;
		var url = `${location.protocol}//${location.hostname}:${port}/getTfaCaptchaState`;
		await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					if(objResp.tfaNeeded == true) {
						generateTfaCodeModal(page, objResp);
					} else if(objResp.captchaNeeded == true) {
						generateCaptchaCodeModal(page, objResp);
					}
				} else {
					document.getElementById("captchaMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageCaptchaErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
				}
			} catch (e) {
				document.getElementById("captchaMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_TFA_CAPTCHA_STATE_JSON"));
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("captchaMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("captchaMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorCheckingAddonStateHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "checkTfaCaptchaState"));
				}
			} catch (e) {
				document.getElementById("captchaMessage").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_TFA_CAPTCHA_STATE_REQUEST"));
			}
		});
	}
}

function generateConfigNeeded(page) {
	generateContentConfigNeeded(page);

	const myModal = new bootstrap.Modal(document.getElementById('modalConfigNeeded'));
	myModal.show();
}

function redirectToPage(page) {
	window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/${page}.html` + redirectTarget;
}

function generateContentConfigNeeded(page) {
	var configNeeded = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalConfigNeededTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">${translateContent("lblConfigNeededHeader")}</h5></div>
							</div>
							<div class="modal-body placeholder-glow" id="divModalConfigNeeded">
								<div class="my-3" id="configNeeded">${translateContent("lblConfigNeeded")}</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", "redirectToPage('settings')", translateContent("btnGoToSettings"), true, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalConfigNeeded").innerHTML = configNeeded;
}

function generateTfaCodeModal(page, objResp) {
	generateContentTfaCodeModal(page, objResp);

	const myModal = new bootstrap.Modal(document.getElementById('modalTfaCode'));
	myModal.show();
}

function generateContentTfaCodeModal(page, objResp) {
	var tfaCodeModal = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalTfaCodeTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">${translateContent("lblTfaHeader")}</h5></div>
							</div>
							<div class="modal-body placeholder-glow" id="divModalTfaCodeContent">
								<h5 id="tfaHint">${objResp.tfaNeeded == true ? translateContent("lblTfaHint"): translateContent("lblTfaNotAvailable")}</h5>
								<div class="my-3" id="tfaCode">${objResp.tfaNeeded == true ? `<label class="my-2" for="txtTfaCode">${translateContent("lblTfaCode")}</label><input type="text" class="form-control" id="txtTfaCode">` : ""}</div>
								<div class="mt-3" id="tfaButton">${objResp.tfaNeeded == true ? `<input id="btnSubmitTfa" onclick="setTfaCode('${page}')" class="btn btn-primary" type="button" value="${translateContent("btnTfaSubmit")}">` : ""}</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), !objResp.tfaNeeded, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalTfaCode").innerHTML = tfaCodeModal;
}

async function setTfaCode(page) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/setTfaCode/${document.getElementById("txtTfaCode").value}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?action=tfa&redirect=${page}.html`;
			} else {
				document.getElementById("tfaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageTfaSendError"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		} catch (e) {
			document.getElementById("tfaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_SET_TFA_JSON"));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("tfaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("tfaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageTfaSendError"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "setTfaCode"));
			}
		} catch (e) {
			document.getElementById("tfaHint").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_SET_TFA_REQUEST"));
		}
	});
}

function generateCaptchaCodeModal(page, objResp) {
	generateContentCaptchaCodeModal(page, objResp);

	const myModal = new bootstrap.Modal(document.getElementById('modalCaptchaCode'));
	myModal.show();
}

function generateContentCaptchaCodeModal(page, objResp) {
	var captchaCodeModal = `
					<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalCaptchaCodeTitle">
								<div style="text-align:left; float:left;"><h5 class="mb-0">${translateContent("lblCaptchaHeader")}</h5></div>
							</div>
							<div class="modal-body placeholder-glow" id="divModalCaptchaCodeContent">
								<h5 id="captchaHint">${objResp.captchaNeeded == true ? translateContent("lblCaptchaHint"): translateContent("lblCaptchaNotAvailable")}</h5>
								<div class="mt-3" id="captchaImageLabel">${objResp.captchaNeeded == true ? `<label class="my-2" for="txtCaptchaCode">Captcha:</label>` : ""}</div>
								<div class="mb-3 text-center" id="captchaImage">${objResp.captchaNeeded == true ? `<img src="${objResp.captcha.captcha}" alt="${translateContent("lblCaptchaImageAltDesc")}">` : ""}</div>
								<div class="my-3" id="captchaCode">${objResp.captchaNeeded == true ? `<label class="my-2" for="txtCaptchaCode">${translateContent("lblCaptchaCode")}</label><input type="text" class="form-control" id="txtCaptchaCode">` : ""}</div>
								<div class="mt-3" id="captchaButton">${objResp.captchaNeeded == true ? `<input id="btnSubmitCaptcha" onclick="setCaptchaCode('${page}')" class="btn btn-primary" type="button" value="${translateContent("btnCaptchaSubmit")}"${objResp.captcha.captcha == "" ? " disabled" : ""}>` : ""}</div>
							</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), !objResp.captchaNeeded, "modal", undefined, true)}
							</div>
						</div>
					</div>`;
	
	document.getElementById("modalCaptchaCode").innerHTML = captchaCodeModal;
}

async function setCaptchaCode(page) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/setCaptchaCode/${document.getElementById("txtCaptchaCode").value}`;
	await retrieveData("GET", url, 'application/json', undefined, "captchaHint", "lblWaitMessageSendCaptcha", undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?action=captcha&redirect=${page}.html`;
			} else {
				document.getElementById("captchaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageCaptchaSendError"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		} catch (e) {
			document.getElementById("captchaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_SET_CAPTCHA_JSON"));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("captchaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("captchaHint").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageCaptchaSendError"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "setCaptchCode"));
			}
		} catch (e) {
			document.getElementById("captchaHint").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e, "ERR_SET_TFA_REQUEST"));
		}
	});
}

function downloadFile(filetype) {
	var url;
	switch(filetype) {
		case "log":
			url = `logfiles.cgi?action=download&file=${filetype}`;
			break;
		case "err":
			url = `logfiles.cgi?action=download&file=${filetype}`;
			break;
		case "clientLog":
			url = `logfiles.cgi?action=download&file=${filetype}`;
			break;
		case "installLog":
			url = `logfiles.cgi?action=download&file=${filetype}`;
			break;
		case "conf":
			url = `${location.protocol}//${location.hostname}:${port}/downloadConfig`;
			break;
	}
	window.open(url);
}

function makeDateTimeString(dateTime, withSeconds) {
	return (`${dateTime.getDate().toString().padStart(2,'0')}.${(dateTime.getMonth()+1).toString().padStart(2,'0')}.${dateTime.getFullYear().toString()} ${dateTime.getHours().toString().padStart(2,'0')}:${dateTime.getMinutes().toString().padStart(2,'0')}${withSeconds === undefined || withSeconds === true ? `:${dateTime.getSeconds().toString().padStart(2,'0')}` : ""}`);
}

function getWifiSignalLevelIcon(wifiSignalLevel, wifiRssi) {
	if(wifiSignalLevel !== undefined) {
		return wifiSignalLevel == 0 ? "bi-reception-0" : wifiSignalLevel == 1 ? "bi-reception-1" : wifiSignalLevel == 2 ? "bi-reception-2" : wifiSignalLevel == 3 ? "bi-reception-3" : wifiSignalLevel == 4 ? "bi-reception-4" : "bi-wifi-off";
	} else {
		return wifiRssi >= 0 ? "bi-reception-0" : wifiRssi >=-64 ? "bi-reception-1" : wifiRssi >=-75 ? "bi-reception-2" : wifiSignalLevel >=-85 ? "bi-reception-3" : wifiSignalLevel == 4 ? "bi-reception-4" : "bi-wifi-off";
	}
}

function createCardStation(station, showSettingsIcon, cardBodyText, cardFooterText) {
	var card = "";

	card += `<div class="col"><div class="card">`;
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${station.name}</h5></div>`;
	card += `<div style="text-align:right;"><h5 class="mb-0">${(station.isStationP2PConnected === false && station.isEnergySavingDevice === false) ? `<i class="bi-exclamation-triangle" title="${translateContent("titleNoP2PConnection")}"></i>&nbsp;&nbsp;` : ""}${showSettingsIcon === true ? `<i class="bi-gear" title="${translateContent("titleSettings")}" onclick="generateStationSettingsModal('${station.serialNumber}')"></i>` : ""}</h5></div>`;
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

function createStationTypeCardsContainer(firendlyTypeName, rowConfig, cards) {
	if(cards != "") {
		return `<p id="stationParagraph"><h4>${firendlyTypeName}</h4><div class="${rowConfig}">${cards}</div></p>`;
	} else {
		return "";
	}
}

function createWaitMessage(messageText) {
	return `<div class="d-flex align-items-center"><div class="spinner-border m-4 float-left" role="status" aria-hidden="true"></div><strong>${messageText}</strong></div>`;
}

function createMessageContainer(classText, messageHeader, messageText, messageSubText) {
	return `<div class="${classText}" role="alert">${messageHeader != "" ? `<h5 class="mb-1 alert-heading">${messageHeader}</h5>` : ""}${messageText != "" ? `<p class="mb-0">${messageText}</p>` : ""}${messageSubText === undefined || messageSubText === "" ? "" : `<hr><p class="my-0 form-text text-muted">${messageSubText}</p>`}</div>`;
}
//#endregion

/**
 * Scripts for devices.html
 */
//#region devices.html
async function loadStations() {
	var objResp, objErr, text = "", station = "", stations = "";
	var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
	await retrieveData("GET", url, 'application/json', undefined, "stations", "lblWaitMessageLoadStations", undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.data.length > 0) {
					for(station in objResp.data) {
						if(objResp.data[station].deviceType == "station") {
							stations += createCardStation(objResp.data[station], true, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0">${generateColumnForProperty("col mb-0 pe-1", "spnFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), objResp.data[station].softwareVersion)}${generateColumnForProperty("col mb-0 pe-1", "spnCurrentGuardMode", "text-wrap", "", "", "bi-shield", translateContent("lblCurrentState"), `${objResp.data[station].privacyMode === undefined || objResp.data[station].privacyMode == false ? `${translateGuardMode(objResp.data[station].guardMode)}` : translateContent("lblPrivacy")}`, undefined, `(${translateGuardMode(objResp.data[station].currentMode)})`)}</div>`, `<small class="text-muted">${translateContent("lblIpAddress")}: ${objResp.data[station].lanIpAddress} (${objResp.data[station].wanIpAddress})</small></div>`);
						}
					}
					if(stations == "") {
						text = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-primary", translateMessages("messageNoManageableStationsFoundHeader"), translateMessages("messageNoManageableStationsFoundMessage"), translateMessages("messageNoManageableStationsFoundSubText"))}`
					} else {
						text = createStationTypeCardsContainer(translateContent("lblStations"), "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-6 g-3", stations);
					}
					document.getElementById("stations").innerHTML =  text;
				} else {
					document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-primary", translateMessages("messageNoStationsFoundHeader"), translateMessages("messageNoStationsFoundMessage"), translateMessages("messageNoStationsFoundSubText"))}`;
				}
			} else {
				document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingStationsHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
			}
		} catch (e) {
			document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"))}`;
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"))}`;
			} else {
				document.getElementById("stations").innerHTML = `<h4>${translateContent("lblStations")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingStationsHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadStations"))}`;
			}
		} catch (e) {
			document.getElementById("stations").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function loadDevices() {
	var objResp, objErr, device;
	var text = "", cams = "", indoorcams = "", solocams = "", starlight4glte = "", doorbellcams = "", outdoorlights = "", locks = "", keypads = "", sensors = "", unknown = "";
	var url = `${location.protocol}//${location.hostname}:${port}/getDevices`;
	await retrieveData("GET", url, 'application/json', undefined, "devices", "lblWaitMessageLoadDevices", undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.data.length > 0) {
					for(device in objResp.data) {
						switch (objResp.data[device].deviceType) {
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
					text += createDeviceTypeCardsContainer("starlight4glte", translateContent("lblStarlightCameras"), starlight4glte);
					text += createDeviceTypeCardsContainer("doorbellcameras", translateContent("lblDoorbellCameras"), doorbellcams);
					text += createDeviceTypeCardsContainer("outdoorlights", translateContent("lblOutdoorLightCameras"), outdoorlights);
					text += createDeviceTypeCardsContainer("locks", translateContent("lblLocks"), locks);
					text += createDeviceTypeCardsContainer("keypads", translateContent("lblKeypads"), keypads);
					text += createDeviceTypeCardsContainer("sensors", translateContent("lblSensors"), sensors);
					text += createDeviceTypeCardsContainer("unknown", translateContent("lblUnknownDevice"), unknown);
					document.getElementById("devices").innerHTML =  text;
				} else {
					document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-primary", translateMessages("messageNoDevicesFoundHeader"), translateMessages("messageNoDevicesFoundMessage"), translateMessages("messageNoDevicesFoundSubText"))}`;
				}
			} else {
				document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingDevicesHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason))}`;
			}
		} catch (e) {
			document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"))}`;
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"))}`;
			} else {
				document.getElementById("devices").innerHTML = `<h4>${translateContent("lblDevices")}</h4>${createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingDevicesHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadDevices"))}`;
			}
		} catch (e) {
			document.getElementById("devices").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

function createCardDevice(device) {
	var card = "";

	card += `<div class="col"><div class="card">`;
	card += `<div class="card-header"><div style="text-align:left; float:left;"><h5 class="mb-0">${device.name}</h5></div>`;
	card += `<div style="text-align:right;"><h5 class="mb-0">${device.enabled === false ? `<i class="bi-power" title="${translateContent("titleDeviceDisabled")}"></i>&nbsp;&nbsp;` : ""}${(device.isStationP2PConnected === false && device.isEnergySavingDevice === false) ? `<i class="bi-exclamation-triangle" title="${translateContent("titleNoP2PConnection")}"></i>&nbsp;&nbsp;` : ""}${device.state === 0 ? `<i class="bi-exclamation-triangle" title="${translateContent("titleDeactivatedOffline")}"></i>&nbsp;&nbsp;` : device.state === 2 ? `<i class="bi-exclamation-triangle" title="${translateContent("titleDeactivatedLowBattery")}"></i>&nbsp;&nbsp;` : ""}${device.wifiSignalLevel === undefined || device.wifiRssi === undefined ? "" : `<i class="${getWifiSignalLevelIcon(device.wifiSignalLevel, device.wifiRssi)}" title="${translateContent("titleWifiSignalLevel")}: ${device.wifiRssi}dB"></i>&nbsp;&nbsp;`}<i class="bi-gear" title="${translateContent("titleSettings")}" onclick="${device.serialNumber == device.stationSerialNumber ? `generateStationDeviceSettingsSelectionModal('${device.serialNumber}','${device.name}')` : `generateDeviceSettingsModal('${device.serialNumber}')`}"></i></h5></div></div>`;

	card += `<div class="card-body p-0"><div class="row g-0">`;
	card += `<div class="col-md-4 img-container"><div class="img-overlay-text-centered fs-6 text-muted m-3">${device.modelName} (${device.model})</div></div>`;
	card += `<div class="col-md-8 px-2 py-3">`;

	card += `<h6 class="card-subtitle mb-2 text-muted">${device.modelName}</h6>`;
	card += `<p class="card-text mb-1">${device.serialNumber}</p>`;
	card += `<div class="row g-0 row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 row-cols-xl-3 row-cols-xxl-3 m-0 p-0">`;
	if(device.softwareVersion !== undefined) {
		card += generateColumnForProperty("col mb-0 pe-1", "spnDeviceFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), device.softwareVersion);
	}
	if(device.battery !== undefined || device.batteryLow !== undefined) {
		card += generateColumnForProperty("col mb-0 pe-1", "spnBattery", "text-nowrap", "", "", device.chargingStatus === 1 ? "bi-battery-charging" : "bi-battery", translateContent("lblBatteryLevel"), device.battery !== undefined ? device.battery : device.batteryLow, device.battery !== undefined ? "%" : "");
	}
	if(device.batteryTemperature !== undefined) {
		card += generateColumnForProperty("col mb-0 pe-1", "spnBatteryTemperature", "text-nowrap", "", "", "bi-thermometer-low", translateContent("lblTemperature"), device.state === 2 ? `---` : device.batteryTemperature, "&deg;C");
	}
	if(device.sensorOpen !== undefined) {
		card += generateColumnForProperty("col mb-0 pe-1", "spnSensorState", "text-nowrap", "", "", device.sensorOpen === true ? "bi-door-open" : "bi-door-closed", translateContent("lblState"), device.sensorOpen === true ? translateDeviceStateValue("Open") : translateDeviceStateValue("Closed"), "");
	}
	card += `</div>`;
	card += `</div></div></div>`;
	card += `<div class="card-footer"><small class="text-muted">${getDeviceLastEventTime(device)}</small></div>`;
	card += `</div></div>`;

	return card;
}

function createDeviceTypeCardsContainer(typeName, firendlyTypeName, cards) {
	if(cards != "") {
		return `<p id="${typeName}"><h4>${firendlyTypeName}</h4><div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-6 g-3">${cards}</div></p>`;
	} else {
		return "";
	}
}

function getDeviceLastEventTime(device) {
	if(device.type === 2) {
		if(device.sensorChangeTime !== undefined && device.sensorChangeTime >= 0) {
			return `${translateContent("lblLastEvent")}: ${makeDateTimeString(new Date(parseInt(device.sensorChangeTime)))}`;
		} else {
			return `${translateContent("lblLastEvent")}: ${translateContent("lblNotAvailable")}`;
		}
	} else if(device.type === 10) {
		if(device.motionSensorPirEvent !== undefined && device.motionSensorPirEvent >= 0) {
			return `${translateContent("lblLastEvent")}: ${makeDateTimeString(new Date(parseInt(device.motionSensorPirEvent)))}`;
		} else {
			return `${translateContent("lblLastEvent")}: ${translateContent("lblNotAvailable")}`;
		}
	} else {
		if(device.hasPicture === true && device.pictureTime !== 0) {
			if(device.pictureTime !== undefined && device.pictureTime !== 0) {
				return `${translateContent("lblLastRecording")}: ${makeDateTimeString(new Date(parseInt(device.pictureTime)))} | <a href="javascript:generateDeviceImageModal('${device.serialNumber}','${device.name}');">${translateContent("lblLastRecordingThumbnail")}</a>`;
			} else if(device.pictureTime === undefined) {
				return translateContent("lblLastRecordingNotAvailable");
			} else {
				return `${translateContent("lblLastRecording")}: ${translateContent("lblNotAvailable")}`;
			}
		} else {
			return translateContent("lblLastRecordingNotAvailable");
		}
	}
}

function generateColumnForProperty(divClass, spanName, spanClass, displayFormatStart, displayFormatEnd, imageName, title, value, unit, subvalue) {
	if(value === undefined) {
		return "";
	}
	switch (imageName) {
		case "bi-battery":
			if(value === true) {
				imageName = imageName + " text-danger";
				break;
			}
			if(value === false) {
				imageName = "bi-battery-full";
				break;
			}
			if(value < 20) {
				imageName = "bi-battery";
			} else if(value < 55) {
				imageName = "bi-battery-half";
			} else {
				imageName = "bi-battery-full";
			}
			if(value < 6) {
				imageName = imageName + " text-danger";
				break;
			} else if(value < 16) {
				imageName = imageName + " text-warning";
			}
			break;
		case "bi-thermometer-low":
			if(value < -49 || value > 99) {
				return "";
			}
			if(value < 0) {
				imageName = "bi-thermometer-low";
			} else if(value < 30) {
				imageName = "bi-thermometer-half";
			} else {
				imageName = "bi-thermometer-high";
			}
			break;
	}
	return `<div class="${divClass}${value === `---` ? ` text-muted` : ""}"><span id="${spanName}" class="${spanClass}">${displayFormatStart == "" ? "" : displayFormatStart}<div class="row"><div class="col col-2 me-1 pe-0"><i class="${imageName}" title="${title}"></i></div><div class="col ms-2 ps-1 me-0 pe-0">${value === false ? translateString("strOk") : value === true ? translateString("strLow") : value}${subvalue === undefined || subvalue == "" ? "" : `<small class="text-secondary"> ${subvalue}</small>`}${unit === undefined ? "" : unit}${displayFormatEnd == "" ? "" : displayFormatEnd}</div></div></span></div>`;
}

function generateStationDeviceSettingsSelectionModal(deviceId, deviceName) {
	generateContentStationDeviceSettingsSelectionModal(deviceId, deviceName);

	const myModal = new bootstrap.Modal(document.getElementById('modalSelectStationDevice'));
	myModal.show();
}

function generateContentStationDeviceSettingsSelectionModal(deviceId, deviceName) {
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

function generateDeviceImageModal(deviceId, deviceName) {
	generateContentDeviceImageModal(deviceId, deviceName);

	const myModal = new bootstrap.Modal(document.getElementById('modalDeviceImage'));
	myModal.show();
}

function generateContentDeviceImageModal(deviceId, deviceName) {
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

function generateDeviceSettingsModal(deviceId, deviceName) {
	generateContentDeviceSettingsModal(deviceId, deviceName);

	if(deviceName === undefined) {
		const myModal = new bootstrap.Modal(document.getElementById('modalDeviceSettings'));
		myModal.show();
	}

	getDevicePropertiesMetadata(deviceId);
}

function generateContentDeviceSettingsModal(deviceId, deviceName) {
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

async function getDevicePropertiesMetadata(deviceId) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${deviceId}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.data.length = 1) {
					getDeviceProperties(deviceId, objResp.data);
				} else {
					document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorNoDeviceForGetInfo", "DevicePropertiesMetadata"));
				}
			} else {
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DevicePropertiesMetadata"));
			}
		} catch (e) {
			document.getElementById("modalDeviceSettings").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("modalDeviceSettings").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DevicePropertiesMetadata"));
			}
		} catch (e) {
			document.getElementById("modalDeviceSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function getDeviceProperties(deviceId, devicePropertiesMetadata) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/getDeviceProperties/${deviceId}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.data.length = 1) {
					fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, objResp.modelName, objResp.isDeviceKnownByClient, objResp.data.properties, objResp.data.commands, objResp.interactions);
				} else {
					document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorNoDeviceForGetInfo", "DeviceProperties"));
				}
			} else {
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DeviceProperties"));
			}
		} catch (e) {
			document.getElementById("modalDeviceSettings").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingText"));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("modalDeviceSettings").innerHTML = generateDeviceModalErrorMessage(translateMessages("messageErrorLoadDeviceForGetInfo", "DeviceProperties"));
			}
		} catch (e) {
			document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

function generateDeviceModalErrorMessage(errorMessage) {
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

function fillDeviceSettingsModal(deviceId, devicePropertiesMetadata, modelName, isDeviceKnownByClient, deviceProperties, deviceCommands, deviceInteractions) {
	var setEventHandler = true;
	var deviceModal =  `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
						<div class="modal-content">
							<div class="modal-header text-bg-secondary w-100" style="--bs-bg-opacity: .5;" id="lblModalDeviceSettingsTitle">
								<div class="float-start w-100"><h5 class="mb-0">${deviceProperties.name} (${deviceId})</h5></div>
								${deviceProperties.wifiSignalLevel !== undefined || deviceProperties.wifiRssi !== undefined ? `<div class="float-end" style="text-align:right;"><h5 class="mb-0"><i class="${getWifiSignalLevelIcon(deviceProperties.wifiSignalLevel, deviceProperties.wifiRssi)}" title="${translateContent("titleWifiSignalLevel")}: ${deviceProperties.wifiRssi}dB"></i></h5></div>` : ""}
								${makeButtonElement("btnStationSettingsModalCloseTop", "btn-close ms-2", undefined, "", true, "modal", "close", true)}
							</div>
							<div class="modal-body placeholder-glow" id="divModalDeviceSettingsContent">
								<div class="" id="lblModalDeviceSettingsInfo">`;
	if(isStationOrDevicesKnown(deviceProperties.model.slice(0,5)) === false && isDeviceKnownByClient === true) {
		setEventHandler = false;
		deviceModal += `
									${createMessageContainer("alert alert-warning", translateContent("lblNotSupportedDeviceHeading"), `${translateContent("lblNotSupportedDeviceMessage", `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesTruncated/${deviceId}`, `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${deviceId}`)}${deviceProperties.serialNumber === deviceProperties.stationSerialNumber ? `</p><p class="mt-2">${translateContent("lblNotSupportedStationMessageSolo", `${location.protocol}//${location.hostname}:${port}/getStationPropertiesTruncated/${deviceId}`, `${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${deviceId}`)}` : ""}`, translateContent("lblNotSupportedDeviceSubText"))}
									${createMessageContainer("alert alert-primary", translateContent("lblNotSupportedDeviceNoSaving"), "", "")}`;
	} else if(isDeviceKnownByClient === false) {
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
	if(deviceProperties.softwareVersion !== undefined || deviceProperties.battery !== undefined || deviceProperties.batteryTemperature !== undefined) {
		deviceModal += `
										<span id="lblDeviceInfo">
											<h6 class="card-subtitle text-muted">
												<div class="row">`;
		if(deviceProperties.softwareVersion !== undefined) {
			deviceModal += `
													${generateColumnForProperty("col", "spnFimware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), `${deviceProperties.softwareVersion}${deviceProperties.softwareTime !== undefined && deviceProperties.softwareTime !== "" ? `<br /><small>${makeDateTimeString(new Date(parseInt(deviceProperties.softwareTime*1000)), false)}</small>` : ""}`)}`;
		}
		if(deviceProperties.battery !== undefined || deviceProperties.batteryLow !== undefined) {
			deviceModal += `
													${generateColumnForProperty("col", "spnBattery", "text-nowrap", "", "", deviceProperties.chargingStatus == 1 ? "bi-battery-charging" : "bi-battery", translateContent("lblBatteryLevel"), deviceProperties.battery !== undefined ? deviceProperties.battery : deviceProperties.batteryLow, deviceProperties.battery !== undefined ? "%" : "")}`;
		}
		if(deviceProperties.batteryTemperature !== undefined && deviceProperties.batteryTemperature > -99 && deviceProperties.batteryTemperature < 99) {
			deviceModal += `
													${generateColumnForProperty("col", "spnBatteryTemperature", "text-nowrap", "", "", "bi-thermometer-low", translateContent("lblTemperature"), deviceProperties.state === 2 ? `---` : deviceProperties.batteryTemperature, "&deg;C")}`;
		}
		if(deviceProperties.sensorOpen !== undefined) {
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
	
	if(deviceProperties.state !== undefined && deviceProperties.state !== 1) {
		setEventHandler = false;
		switch (deviceProperties.state) {
			case 0:
				deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedOffline"), translateContent("titleDeactivatedOfflineHint"), "")}`;
				break;
			case 2:
			case 3:
				deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedLowBattery"), translateContent("titleDeactivatedLowBatteryHint"), "")}`;
				break;
			case 4:
				deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedRemoveAndReadd"), translateContent("titleDeactivatedRemoveAndReaddHint"), "")}`;
			case 5:
				deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedResetAndReadd"), translateContent("titleDeactivatedResetAndReaddHint"), "")}`;
				break;
			default:
				deviceModal += `
									${createMessageContainer("alert alert-warning mb-0", translateContent("titleDeactivatedUnknownState"), translateContent("titleDeactivatedUnknownStateHint"), "")}`;
		}
		deviceModal += `
								</div>
							<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
								${makeButtonElement("btnCloseModalDeviceSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
							</div>
						</div>
					</div>`;

		document.getElementById("modalDeviceSettings").innerHTML = deviceModal;
		return;
	} if(deviceProperties.enabled !== undefined || deviceProperties.antitheftDetection !== undefined || deviceProperties.statusLed !== undefined || deviceProperties.imageMirrored !== undefined || deviceProperties.motionAutoCruise !== undefined || deviceProperties.autoCalibration !== undefined || deviceProperties.light !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceCommonSettings">
									<h5 class="card-header">${translateContent("lblHeaderCommon")}</h5>
									<div class="card-body">
										<div class="row gap-3">`;
		if(deviceProperties.enabled !== undefined) {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblEnabled")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.enabled.name, deviceProperties.enabled, devicePropertiesMetadata.enabled.writeable, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.antitheftDetection !== undefined) {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblAntitheftDetection")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.antitheftDetection.name, deviceProperties.antitheftDetection, devicePropertiesMetadata.antitheftDetection.writeable, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "boolean") {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblStatusLed")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, devicePropertiesMetadata.statusLed.writeable, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.imageMirrored !== undefined) {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblImageMirrored")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.imageMirrored.name, deviceProperties.imageMirrored, devicePropertiesMetadata.imageMirrored.writeable, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.motionAutoCruise !== undefined) {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblMotionAutoCruise")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionAutoCruise.name, deviceProperties.motionAutoCruise, devicePropertiesMetadata.motionAutoCruise.writeable, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.autoCalibration !== undefined) {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblAutoCalibration")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.autoCalibration.name, deviceProperties.autoCalibration, devicePropertiesMetadata.autoCalibration.writeable, setEventHandler)}
											</div>`;
		}
		if(deviceProperties.light !== undefined) {
			deviceModal += `
											<div class="col">
												<h5>${translateContent("lblLight")}</h5>
												${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.light.name, deviceProperties.light, devicePropertiesMetadata.light.writeable, setEventHandler)}
											</div>`;
		}
		deviceModal += `
										</div>
									</div>
								</div>`;
	}
	if(deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity !== undefined || deviceProperties.motionDetectionType !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceMotionDetectionSettings">
									<h5 class="card-header">${translateContent("lblHeaderMotionDetection")}</h5>
									<div class="card-body">`;
		if(deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity !== undefined || deviceProperties.motionDetectionSensitivityStandard !== undefined || deviceProperties.motionDetectionSensitivityAdvancedA !== undefined || deviceProperties.motionDetectionSensitivityAdvancedB !== undefined || deviceProperties.motionDetectionSensitivityAdvancedC !== undefined || deviceProperties.motionDetectionSensitivityAdvancedD !== undefined || deviceProperties.motionDetectionSensitivityAdvancedE !== undefined || deviceProperties.motionDetectionSensitivityAdvancedF !== undefined || deviceProperties.motionDetectionSensitivityAdvancedG !== undefined || deviceProperties.motionDetectionSensitivityAdvancedH !== undefined) {
			if(deviceProperties.motionDetection !== undefined) {
				deviceModal += `
										<h5>${translateContent("lblMotionDetection")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetection.name, deviceProperties.motionDetection, devicePropertiesMetadata.motionDetection.writeable, setEventHandler)}`;
			}
			if(deviceProperties.motionDetectionSensitivity !== undefined || deviceProperties.motionDetectionSensitivityStandard !== undefined || deviceProperties.motionDetectionSensitivityAdvancedA !== undefined || deviceProperties.motionDetectionSensitivityAdvancedB !== undefined || deviceProperties.motionDetectionSensitivityAdvancedC !== undefined || deviceProperties.motionDetectionSensitivityAdvancedD !== undefined || deviceProperties.motionDetectionSensitivityAdvancedE !== undefined || deviceProperties.motionDetectionSensitivityAdvancedF !== undefined || deviceProperties.motionDetectionSensitivityAdvancedG !== undefined || deviceProperties.motionDetectionSensitivityAdvancedH !== undefined) {
				deviceModal += `
										${deviceProperties.motionDetection !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblMotionDetectionSensitivity")}</h5>`;
				if(deviceProperties.motionDetectionSensitivity !== undefined) {
					if(devicePropertiesMetadata.motionDetectionSensitivity.states === undefined) {
						deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivity.name, deviceProperties.motionDetectionSensitivity, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivity.unit, devicePropertiesMetadata.motionDetectionSensitivity.min, devicePropertiesMetadata.motionDetectionSensitivity.max, devicePropertiesMetadata.motionDetectionSensitivity.default)}`;
					} else {
						deviceModal += `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivity.name, deviceProperties.motionDetectionSensitivity, false, devicePropertiesMetadata.motionDetectionSensitivity.states)}`;
					}
				}
				deviceModal += `
										${deviceProperties.motionDetectionSensitivityMode !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionSensitivityMode.name, deviceProperties.motionDetectionSensitivityMode, setEventHandler, devicePropertiesMetadata.motionDetectionSensitivityMode.states)}` : ``}`;
				if(deviceProperties.motionDetectionSensitivityMode !== undefined) {
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
			if(deviceProperties.motionDetectionType !== undefined || deviceProperties.motionDetectionTypeHuman !== undefined || deviceProperties.motionDetectionTypeHumanRecognition !== undefined || deviceProperties.motionDetectionTypePet !== undefined || deviceProperties.motionDetectionTypeVehicle !== undefined || deviceProperties.motionDetectionTypeAllOtherMotions !== undefined) {
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity ? `<hr />`: ``}
										<h5>${translateContent("lblMotionDetectionType")}</h5>
										${deviceProperties.motionDetectionType !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionType.name, deviceProperties.motionDetectionType, setEventHandler, devicePropertiesMetadata.motionDetectionType.states)}` : ""}
										${deviceProperties.motionDetectionTypeHuman !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeHuman.name, deviceProperties.motionDetectionTypeHuman, devicePropertiesMetadata.motionDetectionTypeHuman.writeable, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypeHumanRecognition !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeHumanRecognition.name, deviceProperties.motionDetectionTypeHumanRecognition, devicePropertiesMetadata.motionDetectionTypeHumanRecognition.writeable, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypePet !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypePet.name, deviceProperties.motionDetectionTypePet, devicePropertiesMetadata.motionDetectionTypePet.writeable, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypeVehicle !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeVehicle.name, deviceProperties.motionDetectionTypeVehicle, devicePropertiesMetadata.motionDetectionTypeVehicle.writeable, setEventHandler)}` : ""}
										${deviceProperties.motionDetectionTypeAllOtherMotions !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionDetectionTypeAllOtherMotions.name, deviceProperties.motionDetectionTypeAllOtherMotions, devicePropertiesMetadata.motionDetectionTypeAllOtherMotions.writeable, setEventHandler)}` : ""}`;
			}
			if(deviceProperties.rotationSpeed !== undefined) {
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity || deviceProperties.motionDetectionType ? `<hr />`: ``}
										<h5>${translateContent("lblRotationSpeed")}</h5>
										${deviceProperties.rotationSpeed !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.rotationSpeed.name, deviceProperties.rotationSpeed, setEventHandler, devicePropertiesMetadata.rotationSpeed.states)}` : ""}`;
			}
			if(deviceProperties.motionTracking !== undefined) {
				deviceModal += `
										${deviceProperties.motionDetection !== undefined || deviceProperties.motionDetectionSensitivity || deviceProperties.motionDetectionType || deviceProperties.rotationSpeed !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblMotionTracking")}</h5>
										${deviceProperties.motionTracking !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.motionTracking.name, deviceProperties.motionTracking, devicePropertiesMetadata.motionTracking.writeable, setEventHandler)}` : ""}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}

	if(deviceProperties.loiteringDetection !== undefined || deviceProperties.loiteringDetectionRange !== undefined || deviceProperties.loiteringDetectionLength !== undefined || deviceProperties.loiteringCustomResponsePhoneNotification !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponse !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponseVoice !== undefined || deviceProperties.loiteringCustomResponseHomeBaseNotification !== undefined || deviceProperties.loiteringCustomResponseTimeFrom !== undefined || deviceProperties.loiteringCustomResponseTimeTo !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceLoiteringSettings">
									<h5 class="card-header">${translateContent("lblHeaderLoiteringDetection")}</h5>
									<div class="card-body">`;
		if(deviceProperties.loiteringDetection !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblLoiteringDetection")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetection.name, deviceProperties.loiteringDetection, devicePropertiesMetadata.loiteringDetection.writeable, setEventHandler)}`;
		}
		if(deviceProperties.loiteringDetectionRange !== undefined) {
			deviceModal += `
										${deviceProperties.loiteringDetection !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblLoiteringDetectionRange")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetectionRange.name, deviceProperties.loiteringDetectionRange, setEventHandler, devicePropertiesMetadata.loiteringDetectionRange.states)}`;
		}
		if(deviceProperties.loiteringDetectionLength !== undefined) {
			deviceModal += `
										${deviceProperties.loiteringDetectionRange !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblLoiteringDetectionLength")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringDetectionLength.name, deviceProperties.loiteringDetectionLength, setEventHandler, devicePropertiesMetadata.loiteringDetectionLength.states)}`;
		}
		if(deviceProperties.loiteringCustomResponsePhoneNotification !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponse !== undefined || deviceProperties.loiteringCustomResponseAutoVoiceResponseVoice !== undefined || deviceProperties.loiteringCustomResponseHomeBaseNotification !== undefined || deviceProperties.loiteringCustomResponseTimeFrom !== undefined || deviceProperties.loiteringCustomResponseTimeTo !== undefined) {
			deviceModal += `
										${deviceProperties.loiteringDetectionLength !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblLoiteringResponse")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponsePhoneNotification.name, deviceProperties.loiteringCustomResponsePhoneNotification, devicePropertiesMetadata.loiteringCustomResponsePhoneNotification.writeable, setEventHandler)}
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponse.name, deviceProperties.loiteringCustomResponseAutoVoiceResponse, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponse.writeable, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponseVoice.name, deviceProperties.loiteringCustomResponseAutoVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.loiteringCustomResponseAutoVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "loiteringCustomResponseTimespan", deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseTimeFrom.name, deviceProperties.loiteringCustomResponseTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseTimeFrom.name, deviceProperties.loiteringCustomResponseTimeFrom, setEventHandler)}
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.loiteringCustomResponseHomeBaseNotification.name, deviceProperties.loiteringCustomResponseHomeBaseNotification, devicePropertiesMetadata.loiteringCustomResponseHomeBaseNotification.writeable, setEventHandler)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.deliveryGuard !== undefined || deviceProperties.deliveryGuardPackageGuarding !== undefined || deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceDeliveryGuardSettings">
									<h5 class="card-header">${translateContent("lblHeaderDeliveryGuard")}</h5>
									<div class="card-body">`;
		if(deviceProperties.deliveryGuard !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblDeliveryGuard")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuard.name, deviceProperties.deliveryGuard, devicePropertiesMetadata.deliveryGuard.writeable, setEventHandler)}`;
			if(deviceProperties.deliveryGuardPackageGuarding !== undefined || deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined) {
				deviceModal += `
										${deviceProperties.deliveryGuard !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblDeliveryGuardPackageGuarding")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuarding.name, deviceProperties.deliveryGuardPackageGuarding, devicePropertiesMetadata.deliveryGuardPackageGuarding.writeable, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingVoiceResponseVoice.name, deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.deliveryGuardPackageGuardingVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "deliveryGuardPackageGuardingActivatedTimespan", deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingActivatedTimeFrom.name, deviceProperties.deliveryGuardPackageGuardingActivatedTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageGuardingActivatedTimeTo.name, deviceProperties.deliveryGuardPackageGuardingActivatedTimeTo, setEventHandler)}`;
			}
			if(deviceProperties.deliveryGuardUncollectedPackageAlert !== undefined || deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck) {
				deviceModal += `
										${deviceProperties.deliveryGuardPackageGuardingVoiceResponseVoice !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblDeliveryGuardUncollectedPackageAlert")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlert.name, deviceProperties.deliveryGuardUncollectedPackageAlert, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlert.writeable, setEventHandler)}
										${generateElementTimePicker("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardUncollectedPackageAlertTimeToCheck.name, deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck, setEventHandler)}`;
			}
			if(deviceProperties.deliveryGuardPackageLiveCheckAssistance !== undefined) {
				deviceModal += `
										${deviceProperties.deliveryGuardUncollectedPackageAlertTimeToCheck !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblDeliveryGuardPackageLiveCheckAssistance")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.deliveryGuardPackageLiveCheckAssistance.name, deviceProperties.deliveryGuardPackageLiveCheckAssistance, devicePropertiesMetadata.deliveryGuardPackageLiveCheckAssistance.writeable, setEventHandler)}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.ringAutoResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceRingAutoResponseSettings">
									<h5 class="card-header">${translateContent("lblHeaderRingAutoResponse")}</h5>
									<div class="card-body">`;
		if(deviceProperties.ringAutoResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblRingAutoResponse")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponse.name, deviceProperties.ringAutoResponse, devicePropertiesMetadata.ringAutoResponse.writeable, setEventHandler)}`;
			if(deviceProperties.ringAutoResponseVoiceResponse !== undefined || deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined) {
				deviceModal += `
										${deviceProperties.ringAutoResponseVoiceResponseVoice !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblRingAutoResponseVoice")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponseVoiceResponse.name, deviceProperties.ringAutoResponseVoiceResponse, devicePropertiesMetadata.ringAutoResponseVoiceResponse.writeable, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringAutoResponseVoiceResponseVoice.name, deviceProperties.ringAutoResponseVoiceResponseVoice, setEventHandler, devicePropertiesMetadata.ringAutoResponseVoiceResponseVoice.states)}
										${generateElementTimePickerStartEnd("Device", deviceProperties.serialNumber, "ringAutoResponseTimespan", deviceProperties.name, devicePropertiesMetadata.ringAutoResponseTimeFrom.name, deviceProperties.ringAutoResponseTimeFrom, setEventHandler, deviceProperties.name, devicePropertiesMetadata.ringAutoResponseTimeTo.name, deviceProperties.ringAutoResponseTimeTo, setEventHandler)}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionSensitivity !== undefined || deviceProperties.soundDetectionType !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceSoundDetectionSettings">
									<h5 class="card-header">${translateContent("lblHeaderSoundDetection")}</h5>
									<div class="card-body">`;
		if(deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionRoundLook !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblSoundDetection")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetection.name, deviceProperties.soundDetection, devicePropertiesMetadata.soundDetection.writeable, setEventHandler)}`;
			if(deviceProperties.soundDetectionType !== undefined && (deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined)) {
				deviceModal += `
										${deviceProperties.soundDetection !== undefined ? `<hr />`: ``}
										<h5>${translateContent("lblSoundDetectionType")}</h5>
										${deviceProperties.soundDetectionType !== undefined ? `${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionType.name, deviceProperties.soundDetectionType, setEventHandler, devicePropertiesMetadata.soundDetectionType.states)}` : ""}`;
			}
			if(deviceProperties.soundDetectionSensitivity !== undefined) {
				deviceModal += `
										${deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionType ? `<hr />`: ``}
										<h5>${translateContent("lblSoundDetectionSensitivity")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionSensitivity.name, deviceProperties.soundDetectionSensitivity, setEventHandler, devicePropertiesMetadata.soundDetectionSensitivity.states)}`;
			}
			if(deviceProperties.soundDetectionRoundLook !== undefined) {
				deviceModal += `
										${deviceProperties.soundDetection !== undefined || deviceProperties.soundDetectionSensitivity || (deviceProperties.soundDetectionType !== undefined && (deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined)) ? `<hr />`: ``}
										<h5>${translateContent("lblSoundDetectionRoundLook")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.soundDetectionRoundLook.name, deviceProperties.soundDetectionRoundLook, devicePropertiesMetadata.soundDetectionRoundLook.writeable, setEventHandler)}`;
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.powerWorkingMode !== undefined || deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined || deviceProperties.powerSource !== undefined || deviceProperties.lastChargingDays !== undefined || (deviceProperties.detectionStatisticsWorkingDays !== undefined && deviceProperties.detectionStatisticsDetectedEvents !== undefined && deviceProperties.detectionStatisticsRecordedEvents !== undefined)) {
		deviceModal += `
								<div class="card mb-3" id="cardDevicePowerManagerSettings">
									<h5 class="card-header">${translateContent("lblHeaderPowerManager")}</h5>
									<div class="card-body">`;
		if(deviceProperties.powerWorkingMode !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblPowerWorkingMode")}</h5>
										${generateElementRadioGroup("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.powerWorkingMode.name, deviceProperties.powerWorkingMode, setEventHandler, devicePropertiesMetadata.powerWorkingMode.states)}
										<div id="divDeviceCustomRecordingSettings" ${deviceProperties.powerWorkingMode == 2 ? "" : ` class="collapse"`}>`;
		}
		if(deviceProperties.powerWorkingMode === undefined || deviceProperties.powerWorkingMode == 2) {
			if(deviceProperties.recordingClipLength !== undefined || deviceProperties.recordingRetriggerInterval !== undefined || deviceProperties.recordingEndClipMotionStops !== undefined) {
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
											${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.recordingEndClipMotionStops.name, deviceProperties.recordingEndClipMotionStops, devicePropertiesMetadata.recordingEndClipMotionStops.writeable, setEventHandler)}`;
				}
			}
		}
		if(deviceProperties.powerWorkingMode !== undefined) {
				deviceModal += `
										</div>`;
		}
		if(deviceProperties.powerSource !== undefined) {
			deviceModal += `
										${deviceProperties.powerWorkingMode !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblPowerSource")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.powerSource.name, deviceProperties.powerSource, setEventHandler, devicePropertiesMetadata.powerSource.states)}`;
			if(deviceProperties.chargingStatus !== undefined) {
				deviceModal += `
										<label>${translateString("strCurrentState")}: ${translateDeviceStateValue(devicePropertiesMetadata.chargingStatus.states[deviceProperties.chargingStatus])}</label>`;
			}
		}
		if((deviceProperties.lastChargingDays !== undefined && deviceProperties.lastChargingDays > -1 && deviceProperties.lastChargingTotalEvents !== undefined && deviceProperties.lastChargingRecordedEvents !== undefined) || (deviceProperties.detectionStatisticsWorkingDays !== undefined && deviceProperties.detectionStatisticsDetectedEvents !== undefined && deviceProperties.detectionStatisticsRecordedEvents !== undefined)) {
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
	if(deviceProperties.continuousRecording !== undefined || deviceProperties.continuousRecordingType !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardContinuousRecordingSettings">
									<h5 class="card-header">${translateContent("lblHeaderContinuousRecording")}</h5>
									<div class="card-body">`;
		if(deviceProperties.continuousRecording !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblContinuousRecording")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.continuousRecording.name, deviceProperties.continuousRecording, devicePropertiesMetadata.continuousRecording.writeable, setEventHandler)}`;
		}
		if(deviceProperties.continuousRecordingType !== undefined) {
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
	if((deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number") || deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined || deviceProperties.videoWdr !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceVideoSettings">
									<h5 class="card-header">${translateContent("lblHeaderVideoSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number") {
			deviceModal += `
										<h5>${translateContent("lblStatusLed")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.statusLed.name, deviceProperties.statusLed, setEventHandler, devicePropertiesMetadata.statusLed.states)}`;
		}
		if(deviceProperties.watermark !== undefined) {
			deviceModal += `
										${deviceProperties.statusLed !== undefined && devicePropertiesMetadata.statusLed.type === "number" ? `<hr />` : ``}
										<h5>${translateContent("lblWatermark")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.watermark.name, deviceProperties.watermark, setEventHandler, devicePropertiesMetadata.watermark.states)}`;
		}
		if(deviceProperties.videoRecordingQuality !== undefined) {
			deviceModal += `
										${deviceProperties.watermark !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblVideoRecordingQuality")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoRecordingQuality.name, deviceProperties.videoRecordingQuality, setEventHandler, devicePropertiesMetadata.videoRecordingQuality.states)}`;
		}
		if(deviceProperties.videoStreamingQuality !== undefined) {
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblVideoStreamingQuality")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoStreamingQuality.name, deviceProperties.videoStreamingQuality, setEventHandler, devicePropertiesMetadata.videoStreamingQuality.states)}`;
		}
		if(deviceProperties.autoNightvision !== undefined || deviceProperties.nightvision !== undefined) {
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblNightvision")}</h5>
										${devicePropertiesMetadata.autoNightvision === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.autoNightvision.name, deviceProperties.autoNightvision, devicePropertiesMetadata.autoNightvision.writeable, setEventHandler)}
										${devicePropertiesMetadata.nightvision === undefined ? "" : generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.nightvision.name, deviceProperties.nightvision, setEventHandler, devicePropertiesMetadata.nightvision.states)}
										${devicePropertiesMetadata.lightSettingsEnable === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsEnable.name, deviceProperties.lightSettingsEnable, devicePropertiesMetadata.lightSettingsEnable.writeable, setEventHandler)}
										${devicePropertiesMetadata.lightSettingsBrightnessManual === undefined ? "" : generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessManual.name, deviceProperties.lightSettingsBrightnessManual, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessManual.unit, devicePropertiesMetadata.lightSettingsBrightnessManual.min, devicePropertiesMetadata.lightSettingsBrightnessManual.max, devicePropertiesMetadata.lightSettingsBrightnessManual.default)}`;
		}
		if(deviceProperties.videoWdr !== undefined) {
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblVideoWdr")}</h5>
										${devicePropertiesMetadata.videoWdr === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.videoWdr.name, deviceProperties.videoWdr, devicePropertiesMetadata.videoWdr.writeable, setEventHandler)}`;
		}
		if(deviceProperties.flickerAdjustment !== undefined) {
			deviceModal += `
										${deviceProperties.watermark !== undefined || deviceProperties.videoRecordingQuality !== undefined || deviceProperties.videoStreamingQuality !== undefined || deviceProperties.autoNightvision !== undefined || deviceProperties.videoWdr !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblFlickerAdjustment")}</h5>
										${devicePropertiesMetadata.flickerAdjustment === undefined ? "" : generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.flickerAdjustment.name, deviceProperties.flickerAdjustment, setEventHandler, deviceProperties.flickerAdjustment.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined || deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceAudioSettings">
									<h5 class="card-header">${translateContent("lblHeaderAudioSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblMicrophone")}</h5>`;
			if(deviceProperties.microphone !== undefined) {
				deviceModal += `
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.microphone.name, deviceProperties.microphone, devicePropertiesMetadata.microphone.writeable, setEventHandler)}`;
			}
			if(deviceProperties.audioRecording !== undefined && (deviceProperties.microphone === undefined || (deviceProperties.microphone !== undefined && deviceProperties.microphone === true))) {
				deviceModal += `
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.audioRecording.name, deviceProperties.audioRecording, devicePropertiesMetadata.audioRecording.writeable, setEventHandler)}`;
			}
		}
		if(deviceProperties.speaker !== undefined || deviceProperties.speakerVolume !== undefined) {
			deviceModal += `
										${deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblSpeaker")}</h5>
										${devicePropertiesMetadata.speaker === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speaker.name, deviceProperties.speaker, devicePropertiesMetadata.speaker.writeable, setEventHandler)}`;
			if(devicePropertiesMetadata.speakerVolume) {
				if(devicePropertiesMetadata.speakerVolume.states === undefined) {
					deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speakerVolume.name, deviceProperties.speakerVolume, setEventHandler, devicePropertiesMetadata.speakerVolume.unit, devicePropertiesMetadata.speakerVolume.min, devicePropertiesMetadata.speakerVolume.max, devicePropertiesMetadata.speakerVolume.default)}`;
				} else {
					deviceModal += `
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speakerVolume.name, deviceProperties.speakerVolume, setEventHandler, devicePropertiesMetadata.speakerVolume.states)}`;
				}
			}
		}
		if(deviceProperties.ringtoneVolume !== undefined) {
			deviceModal += `
										${deviceProperties.microphone !== undefined || deviceProperties.audioRecording !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblRingtoneVolume")}</h5>
										${devicePropertiesMetadata.speaker === undefined ? "" : generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.speaker.name, deviceProperties.speaker, devicePropertiesMetadata.speaker.writeable, setEventHandler)}`;
			if(devicePropertiesMetadata.ringtoneVolume)
			{
				if(devicePropertiesMetadata.ringtoneVolume.states === undefined) {
					deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringtoneVolume.name, deviceProperties.ringtoneVolume, setEventHandler, devicePropertiesMetadata.ringtoneVolume.unit, devicePropertiesMetadata.ringtoneVolume.min, devicePropertiesMetadata.ringtoneVolume.max, devicePropertiesMetadata.ringtoneVolume.default)}`;
				} else {
					deviceModal += `
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.ringtoneVolume.name, deviceProperties.ringtoneVolume, setEventHandler, devicePropertiesMetadata.ringtoneVolume.states)}`;
				}
			}
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.dualCamWatchViewMode !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceDualCamWatchViewModeSettings">
									<h5 class="card-header">${translateContent("lblHeaderDualCamWatchViewMode")}</h5>
									<div class="card-body">`;
		if(deviceProperties.dualCamWatchViewMode !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblDualCamWatchViewMode")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.dualCamWatchViewMode.name, deviceProperties.dualCamWatchViewMode, setEventHandler, devicePropertiesMetadata.dualCamWatchViewMode.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.chimeIndoor !== undefined || deviceProperties.chimeHomebase !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceChimeSettings">
									<h5 class="card-header">${translateContent("lblChimeSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.chimeIndoor !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblChimeIndoor")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeIndoor.name, deviceProperties.chimeIndoor, devicePropertiesMetadata.chimeIndoor.writeable, setEventHandler)}`;
		}
		if(deviceProperties.chimeHomebase !== undefined) {
			deviceModal += `
										${deviceProperties.chimeIndoor !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblChimeHomebase")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeHomebase.name, deviceProperties.chimeHomebase, devicePropertiesMetadata.chimeHomebase.writeable, setEventHandler)}
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.name, deviceProperties.chimeHomebaseRingtoneVolume, setEventHandler, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.unit, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.min, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.max, devicePropertiesMetadata.chimeHomebaseRingtoneVolume.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chimeHomebaseRingtoneType.name, deviceProperties.chimeHomebaseRingtoneType, setEventHandler, devicePropertiesMetadata.chimeHomebaseRingtoneType.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.lightSettingsBrightnessManual !== undefined && (deviceProperties.lightSettingsManualLightingActiveMode !== undefined || deviceProperties.lightSettingsManualDailyLighting !== undefined || deviceProperties.lightSettingsManualDynamicLighting !== undefined || deviceProperties.lightSettingsBrightnessSchedule !== undefined || deviceProperties.lightSettingsScheduleLightingActiveMode !== undefined || deviceProperties.lightSettingsScheduleDailyLighting !== undefined || deviceProperties.lightSettingsScheduleDynamicLighting !== undefined || deviceProperties.lightSettingsMotionTriggered !== undefined || deviceProperties.lightSettingsMotionTriggeredTimer !== undefined || deviceProperties.lightSettingsMotionActivationMode !== undefined || deviceProperties.lightSettingsBrightnessMotion !== undefined || deviceProperties.lightSettingsMotionLightingActiveMode !== undefined || deviceProperties.lightSettingsMotionDailyLighting !== undefined || deviceProperties.lightSettingsMotionDynamicLighting !== undefined)) {
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
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionTriggered.name, deviceProperties.lightSettingsMotionTriggered, devicePropertiesMetadata.lightSettingsMotionTriggered.writeable, setEventHandler)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionTriggeredTimer.name, deviceProperties.lightSettingsMotionTriggeredTimer, setEventHandler, devicePropertiesMetadata.lightSettingsMotionTriggeredTimer.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionActivationMode.name, deviceProperties.lightSettingsMotionActivationMode, setEventHandler, devicePropertiesMetadata.lightSettingsMotionActivationMode.states)}
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsBrightnessMotion.name, deviceProperties.lightSettingsBrightnessMotion, setEventHandler, devicePropertiesMetadata.lightSettingsBrightnessMotion.unit, devicePropertiesMetadata.lightSettingsBrightnessMotion.min, devicePropertiesMetadata.lightSettingsBrightnessMotion.max, devicePropertiesMetadata.lightSettingsBrightnessMotion.default)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionLightingActiveMode.name, deviceProperties.lightSettingsMotionLightingActiveMode, setEventHandler, devicePropertiesMetadata.lightSettingsMotionLightingActiveMode.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionDailyLighting.name, deviceProperties.lightSettingsMotionDailyLighting, setEventHandler, devicePropertiesMetadata.lightSettingsMotionDailyLighting.states)}
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.lightSettingsMotionDynamicLighting.name, deviceProperties.lightSettingsMotionDynamicLighting, setEventHandler, devicePropertiesMetadata.lightSettingsMotionDynamicLighting.states)}
									</div>
								</div>`;
	}
	if(deviceProperties.chirpTone !== undefined || deviceProperties.chirpVolume !== undefined) {
		deviceModal += `
								<div class="card mb-3" id="cardDeviceChirpSettings">
									<h5 class="card-header">${translateContent("lblChirpSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.chirpTone !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblChirpTone")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chirpTone.name, deviceProperties.chirpTone, setEventHandler, devicePropertiesMetadata.chirpTone.states)}`;
		}
		if(deviceProperties.chirpVolume !== undefined) {
			deviceModal += `
										${generateElementRange("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.chirpVolume.name, deviceProperties.chirpVolume, setEventHandler, devicePropertiesMetadata.chirpVolume.unit, devicePropertiesMetadata.chirpVolume.min, devicePropertiesMetadata.chirpVolume.max, devicePropertiesMetadata.chirpVolume.default)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceCommands.includes("devicePresetPosition")) {
		deviceModal += `
								<div class="card mb-3" id="cardDevicePanAndTiltSettings">
									<h5 class="card-header">${translateContent("lblHeaderPanAndTilt")}</h5>
									<div class="card-body">`;
		if(deviceCommands.includes("devicePresetPosition")) {
			deviceModal += `
										<h5>${translateContent("lblMoveToPreset")}</h5>
										<div class="row g-2">
											<div class="col-sm-3">
												${makeButtonElement("btnDeviceMoveToPreset00", "btn btn-primary col-12 h-100", `sendCommand('Device', '${deviceProperties.serialNumber}', '${deviceProperties.name}', 'moveToPreset', 0)`, translateString("strMoveToPreset01"), true, undefined, undefined, setEventHandler)}
											</div>
											<div class="col-sm-3">
												${makeButtonElement("btnDeviceMoveToPreset01", "btn btn-primary col-12 h-100", `sendCommand('Device', '${deviceProperties.serialNumber}', '${deviceProperties.name}', 'moveToPreset', 1)`, translateString("strMoveToPreset02"), true, undefined, undefined, setEventHandler)}
											</div>
											<div class="col-sm-3">
												${makeButtonElement("btnDeviceMoveToPreset02", "btn btn-primary col-12 h-100", `sendCommand('Device', '${deviceProperties.serialNumber}', '${deviceProperties.name}', 'moveToPreset', 2)`, translateString("strMoveToPreset03"), true, undefined, undefined, setEventHandler)}
											</div>
											<div class="col-sm-3">
												${makeButtonElement("btnDeviceMoveToPreset03", "btn btn-primary col-12 h-100", `sendCommand('Device', '${deviceProperties.serialNumber}', '${deviceProperties.name}', 'moveToPreset', 3)`, translateString("strMoveToPreset04"), true, undefined, undefined, setEventHandler)}
											</div>
										</div>`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.notification !== undefined || deviceProperties.notificationType !== undefined || deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined) {
		deviceModal += `
								<div class="card" id="cardDeviceNotificationSettings">
									<h5 class="card-header">${translateContent("lblHeaderNotificationSettings")}</h5>
									<div class="card-body">`;
		if(deviceProperties.notification !== undefined) {
			deviceModal += `
										<h5>${translateContent("lblNotification")}</h5>
										${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notification.name, deviceProperties.notification, devicePropertiesMetadata.notification.writeable, setEventHandler)}`;
		}
		if((deviceProperties.notification !== undefined && deviceProperties.notification === true) || deviceProperties.notification === undefined) {
			deviceModal += `
										${deviceProperties.notification !== undefined ? `<hr />` : ``}
										<h5>${translateContent("lblNotificationType")}</h5>
										${generateElementRadioGroup("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationType.name, deviceProperties.notificationType, setEventHandler, devicePropertiesMetadata.notificationType.states)}`;
			if(deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined) {
				deviceModal += `
										
										<hr />
										<h5>${translateContent("lblNotificationSend")}</h5>
										${deviceProperties.notificationPerson !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationPerson.name, deviceProperties.notificationPerson, devicePropertiesMetadata.notificationPerson.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationPet !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationPet.name, deviceProperties.notificationPet, devicePropertiesMetadata.notificationPet.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationAllOtherMotion !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationAllOtherMotion.name, deviceProperties.notificationAllOtherMotion, devicePropertiesMetadata.notificationAllOtherMotion.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationCrying !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationCrying.name, deviceProperties.notificationCrying, devicePropertiesMetadata.notificationCrying.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationAllSound !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationAllSound.name, deviceProperties.notificationAllSound, devicePropertiesMetadata.notificationAllSound.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationRing !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationRing.name, deviceProperties.notificationRing, devicePropertiesMetadata.notificationRing.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationMotion !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationMotion.name, deviceProperties.notificationMotion, devicePropertiesMetadata.notificationMotion.writeable, setEventHandler)}` : ""}
										${deviceProperties.notificationRadarDetector !== undefined ? `${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationRadarDetector.name, deviceProperties.notificationRadarDetector, devicePropertiesMetadata.notificationRadarDetector.writeable, setEventHandler)}` : ""}`;
			}
		}
		if(deviceProperties.notificationIntervalTime !== undefined) {
			deviceModal += `
										${deviceProperties.notification !== undefined || (deviceProperties.notificationPerson || deviceProperties.notificationPet || deviceProperties.notificationCrying !== undefined || deviceProperties.notificationAllSound !== undefined || deviceProperties.notificationAllOtherMotion !== undefined || deviceProperties.notificationRing !== undefined || deviceProperties.notificationMotion !== undefined || deviceProperties.notificationRadarDetector !== undefined) ? `<hr />` : ``}
										<h5>${translateContent("lblNotificationIntervalTime")}</h5>
										${generateElementSelect("Device", deviceProperties.serialNumber, deviceProperties.name, devicePropertiesMetadata.notificationIntervalTime.name, deviceProperties.notificationIntervalTime, setEventHandler, devicePropertiesMetadata.notificationIntervalTime.states)}`;
		}
		deviceModal += `
									</div>
								</div>`;
	}
	if(deviceProperties.motionDetected !== undefined || deviceProperties.radarMotionDetected !== undefined || deviceProperties.personDetected !== undefined || deviceProperties.petDetected !== undefined || deviceProperties.cryingDetected !== undefined || deviceProperties.soundDetected !== undefined || deviceProperties.strangerPersonDetected !== undefined || deviceProperties.vehicleDetected !== undefined || deviceProperties.dogDetected !== undefined || deviceProperties.dogLickDetected !== undefined || deviceProperties.dogPoopDetected !== undefined || deviceProperties.ringing !== undefined) {
		deviceModal += `
								<div class="card mt-3" id="cardDeviceInteraction">
									<h5 class="card-header">${translateContent("lblHeaderInteractionCCU")}</h5>
									<div class="card-body">
										${createMessageContainer("alert alert-warning", translateMessages("messageInteractionHintHeader"), translateMessages("messageInteractionHintMessage"), "")}
										<div class="accordion" id="accordionInteractions">`;
		if(deviceProperties.motionDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("motion", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.radarMotionDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("radarMotion", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.personDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("person", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.petDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("pet", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.cryingDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("crying", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.soundDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("sound", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.strangerPersonDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("strangerPerson", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.vehicleDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("vehicle", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.dogDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("dog", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.dogLickDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("dogLick", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.dogPoopDetected !== undefined) {
			deviceModal += `
											${generateInteractionExpander("dogPoop", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.ringing !== undefined) {
			deviceModal += `
											${generateInteractionExpander("ring", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		if(deviceProperties.sensorOpen !== undefined) {
			deviceModal += `
											${generateInteractionExpander("sensorOpen", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}
											${generateInteractionExpander("sensorClose", true, deviceProperties, deviceInteractions, deviceId, setEventHandler)}`;
		}
		deviceModal += `
										</div>
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

function toggleInteractionDiv(divElementId, imgElementId) {
	if(document.getElementById(divElementId).classList.contains("collapse")) {
		document.getElementById(divElementId).removeAttribute("class");
		document.getElementById(imgElementId).setAttribute("class", "bi-chevron-up");
		document.getElementById(imgElementId).setAttribute("title", translateString("strEditInteractionEnd"));
	} else {
		document.getElementById(divElementId).setAttribute("class", "collapse");
		document.getElementById(imgElementId).setAttribute("class", "bi-chevron-down");
		document.getElementById(imgElementId).setAttribute("title", translateString("strEditInteractionStart"));
	}
}

function getEventId(event) {
	switch(event) {
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
		case "sensorOpen":
			return 13;
		case "sensorClose":
			return 14;
		default:
			return -1;
	}
}

async function saveEventInteraction(deviceId, deviceName, serialNumber, event) {
	var eventInteraction;
	var eventType = getEventId(event);
	if(eventType == -1) {
		const toast = new bootstrap.Toast(toastFailed);
		document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
		document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	eventInteraction = `{"serialNumber": "${serialNumber}", "eventType": ${eventType}, "target": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventTarget`).value}", "useHttps": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventUseHttps`).checked}, "useLocalCertificate": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventUseLocalCertificate`).checked}, "rejectUnauthorized": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventRejectUnauthorized`).checked}${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventUser`).value === "" ? "" : `, "user": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventUser`).value}"`}${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventPassword`).value === "" ? "" : `, "password": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventPassword`).value}"`}, "command": "${encodeURIComponent(document.getElementById(`txtArea${event.charAt(0).toUpperCase() + event.slice(1)}EventCommand`).value)}"}`;

	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/setInteraction`;
	await retrieveData("POST", url, 'application/json', eventInteraction, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageSaveInteractionOkMessage");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveInteractionFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
			document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function testUnstoredEventInteraction(deviceId, deviceName, serialNumber, event) {
	var eventInteraction;
	var eventType = getEventId(event);
	if(eventType == -1) {
		const toast = new bootstrap.Toast(toastFailed);
		document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestUnstoredInteractionHeader");
		document.getElementById("toastFailedText").innerHTML = translateMessages("messageTestUnstoredInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	eventInteraction = `{"serialNumber": "${serialNumber}", "eventType": ${eventType}, "target": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventTarget`).value}", "useHttps": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventUseHttps`).checked}, "useLocalCertificate": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventUseLocalCertificate`).checked}, "rejectUnauthorized": ${document.getElementById(`chk${event.charAt(0).toUpperCase() + event.slice(1)}EventRejectUnauthorized`).checked}${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventUser`).value === "" ? "" : `, "user": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventUser`).value}"`}${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventPassword`).value === "" ? "" : `, "password": "${document.getElementById(`txtBox${event.charAt(0).toUpperCase() + event.slice(1)}EventPassword`).value}"`}, "command": "${encodeURIComponent(document.getElementById(`txtArea${event.charAt(0).toUpperCase() + event.slice(1)}EventCommand`).value)}"}`;

	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/testUnstoredInteraction`;
	await retrieveData("POST", url, 'application/json', eventInteraction, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageTestUnstoredInteractionHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageTestUnstoredInteractionOkMessage");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestUnstoredInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageTestUnstoredInteractionFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestUnstoredInteractionHeader");
			document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageTestUnstoredInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestUnstoredInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageTestUnstoredInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function testStoredEventInteraction(deviceId, deviceName, serialNumber, event) {
	var eventType;
	var eventType = getEventId(event);
	if(eventType == -1) {
		const toast = new bootstrap.Toast(toastFailed);
		document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
		document.getElementById("toastFailedText").innerHTML = translateMessages("messageTestInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/testStoredInteraction/${serialNumber}/${eventType}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageTestInteractionHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageTestInteractionOkMessage");
				toast.show();
			} else if(objResp.success == false && objResp.status != undefined) {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageTestInteractionErrorStatusMessage", objResp.status);
				toast.show();
			} else if(objResp.success == false && objResp.code != undefined) {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageTestInteractionErrorCodeMessage", objResp.code);
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageTestInteractionFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
			document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageTestInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageTestInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageTestInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function deleteEventInteractionQuestion(deviceId, deviceName, serialNumber, event) {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalDeleteEventInteractionTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalDeleteEventInteractionMessage", deviceId, deviceName, serialNumber, event);
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalDeleteEventInteractionBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalDeleteEventInteractionBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `deleteEventInteraction("` + deviceId + `", "` + deviceName + `", "` + serialNumber + `", "` + event + `")`);
	myModal.show();
}

async function deleteEventInteraction(deviceId, deviceName, serialNumber, event) {
	var eventType;
	var eventType = getEventId(event);
	if(eventType == -1) {
		const toast = new bootstrap.Toast(toastFailed);
		document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
		document.getElementById("toastFailedText").innerHTML = translateMessages("messageDeleteInteractionUnknownInteractionMessage", event);
		toast.show();
		return;
	}

	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/deleteInteraction/${serialNumber}/${eventType}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageDeleteInteractionOkMessage");
				toast.show();
				generateDeviceSettingsModal(deviceId, deviceName);
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageDeleteInteractionFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
			document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageDeleteInteractionFailedMessage")}<br />${translateMessages("messageErrorPrintErrorMessage", e)}`;
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageDeleteInteractionHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageDeleteInteractionFailedMessage")}<br />${translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

function isStationOrDevicesKnown(modell) {
	switch(modell) {
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
		//SoloCams
		case "T8170":
		case "T8134":
		//Sensors
		case "T8900":
		case "T8910":
			return true;
		default:
			return false;
	}
}

function generateElementTextBox(textBoxType, serialNumber, name, propertyName, hint, placeholder, value, enabled, readonly, onchange) {
	return `<div class="mb-2">
		<label for="txtBox${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label">${translatePropertyName(propertyName)}</label>
		<input class="form-control" type="${textBoxType}"${placeholder !== undefined || placeholder !== "" ? ` placeholder="${placeholder}"` : ""} aria-label="" id="txtBox${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" value="${value}"${onchange !== undefined || onchange !== "" ? ` onchange="${onchange}"` : ""}${enabled == false ? " disabled" : ""}${readonly == true ? " readonly" : ""}>
		${hint !== undefined || hint !== "" ? `<div id="passwordHelpBlock" class="form-text">${translatePropertyName(hint)}</div>` : ""}
	</div>`;
}

function generateElementTextArea(type, serialNumber, name, maxLength, rows, propertyName, hint, placeholder, value, enabled, readonly) {
	return `<div class="mb-2">
		<label for="txtArea${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label">${translatePropertyName(propertyName)}</label>
		<textarea class="form-control" id="txtArea${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" maxlength="${maxLength}" rows="${rows}"${enabled == false ? " disabled" : ""}${readonly == true ? " readonly" : ""} style="font-family:monospace;">${value}</textarea>
		${hint !== undefined || hint !== "" ? `<div id="passwordHelpBlock" class="form-text">${translatePropertyName(hint)}</div>` : ""} 
	</div>`;
}

function generateElementSwitch(deviceType, serialNumber, name, propertyName, value, enabled, setEventHandler) {
	return `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${value === true ? " checked" : ""}${setEventHandler == true ? ` onclick="change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}', this.checked)"` : ""}${enabled != undefined && enabled == false ? " disabled" : ""}><label class="form-check-label" for="chk${propertyName}"${enabled != undefined && enabled == false ? " disabled" : ""}>${translatePropertyName(propertyName)}</label></div>`;
}

function generateElementRadioGroup(deviceType, serialNumber, name, propertyName, value, setEventHandler, states) {
	var radioGroup = ``;
	for(var state in states) {
		radioGroup += makeRadioElement(deviceType, serialNumber, name, propertyName, state == value ? true : false, setEventHandler, states[state], state);
	}
	return radioGroup;
}

function makeRadioElement(deviceType, serialNumber, name, propertyName, value, setEventHandler, state, stateValue) {
	return `<div class="form-check"><input class="form-check-input" type="radio" name="grp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" id="rb${state.charAt(0).toUpperCase() + state.slice(1)}" ${value == true ? " checked" : ""}${setEventHandler == true ? ` onclick="change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}', ${stateValue})` : ""}"><label class="form-check-label" for="rb${state.charAt(0).toUpperCase() + state.slice(1)}">${translateDeviceStateValue(state)}</label></div>`;
}

function generateElementRange(deviceType, serialNumber, name, propertyName, value, setEventHandler, unit, min, max, defaultValue) {
	return `<div><label for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label mb-0 align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}: <span id="spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value">${value === undefined ? defaultValue : value}</span>${unit === undefined ? "" : translateDeviceStateValue(unit)}</label>${min !== undefined && max !== undefined ? `<div class="d-flex justify-content-between"><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Min">${min}</small></div><div><small for="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label my-0 text-muted" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Max">${max}</small></div></div>` : ""}<input type="range" class="form-range ${min === undefined ? "mt-0" : "my-0"}" min="${min}" max="${max}" id="rg${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" value="${value === undefined ? defaultValue : value}" oninput="updateSliderValue('spn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}Value', this.value)"${setEventHandler == true ? ` onchange="change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}', this.value)"` : ""}>${defaultValue !== undefined ? `<div class="text-end">${generateElementButton(deviceType, serialNumber, name, propertyName, setEventHandler, "btn btn-outline-secondary btn-sm", true, defaultValue, (defaultValue !== undefined && defaultValue != value))}</div>` : ""}</div>`;
}

function generateElementProgress(propertyName, value) {
	return `<div><label for="prog${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-label align-text-bottom" id="lbl${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}: ${isNaN(value) ? `${translateContent("lblUnknown")}` : `${value}%`}</label><div class="progress mb-3"><div id="prog${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="progress-bar" style="width: ${value}%" role="progressbar" aria-label="${translatePropertyName(propertyName)}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"></div></div></div>`;
}

function generateElementSelect(deviceType, serialNumber, name, propertyName, value, setEventHandler, states) {
	var selectElement = `<div><label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${setEventHandler == true ? ` onchange="change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}', this.value)` : ""}"${setEventHandler == false ? " disabled" : ""}>`;
	for(var state in states) {
		selectElement += makeSelectElement(propertyName, value, state, states[state])
	}
	selectElement += `</select></div>`;
	return selectElement;
}

function generateElementSelectTimeZone(deviceType, serialNumber, name, propertyName, value, setEventHandler, states) {
	var selectElement = `<div><label class="mb-2" for="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}</label><select class="form-select mb-2" id="cb${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}"${setEventHandler == true ? ` onchange="change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}', this.value) ` : ""}" disabled>`;
	for(var state in states) {
		selectElement += makeSelectElementTimeZone(propertyName, value, states[state]);
	}
	selectElement += `</select></div>`;
	return selectElement;
}

function makeSelectElement(propertyName, value, valueNumber, state) {
	return `<option value="${valueNumber}" id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" ${value == valueNumber ? " selected" : ""}>${translateDeviceStateValue(state, propertyName, valueNumber)}</option>`;
}

function makeSelectElementTimeZone(propertyName, value, state) {
	return `<option value="${state.timeZoneGMT}|1.${state.timeSn}" id="chkElem${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}${state.timeSn}"${value === `${state.timeZoneGMT}|1.${state.timeSn}` ? " selected" : ""}>${translateDeviceStateValue(state.timeId, propertyName, state.timeZoneGMT)}</option>`;
}

function generateElementButton(deviceType, serialNumber, name, propertyName, setEventHandler, buttonClass, setToDefault, value, enabled) {
	return `<div>${makeButtonElement(`btn${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}${setToDefault == true ? "ToDefault" : ""}`, `${buttonClass}`, `change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}'${value !== undefined ? ` , '${value}'` : ""})`, `${setToDefault == true ? `Standardwert setzen` : `${translatePropertyName(propertyName)}`}`, enabled, undefined, undefined, setEventHandler)}</div>`;
}

function makeButtonElement(buttonId, buttonClass, buttonOnClick, description, enabled, dataBsDismiss, ariaLabel, setEventHandler) {
	return `<button id="${buttonId}" type="button" class="${buttonClass}"${buttonOnClick !== undefined && setEventHandler == true ? ` onclick="${buttonOnClick}"` : ""}${dataBsDismiss !== undefined ? ` data-bs-dismiss="${dataBsDismiss}"` : ""}${ariaLabel !== undefined ? ` aria-label="${ariaLabel}"` : ""}${enabled == false ? " disabled" : ""}>${description}</button>`;
}

function generateElementTimePicker(deviceType, serialNumber, name, propertyName, value, setEventHandler) {
	return `<div class="row align-items-center"><label class="mb-2" for="tp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}">${translatePropertyName(propertyName)}</label><div class="col"><input type="time" id="tp${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}" class="form-control mb-2" value="${value}" ${setEventHandler == true ? ` onchange="change${deviceType}Property('${serialNumber}', '${name}', '${propertyName}', this.value)"` : ""}></div><div class="col"></div><div class="col"></div></div>`;
}

function generateElementTimePickerStartEnd(deviceType, serialNumber, caption, startName, startPropertyName, startValue, startSetEventHandler, endName, endPropertyName, endValue, endSetEventHandler) {
	return `${translatePropertyName(caption)}<div class="row align-items-center"><div class="col"><label class="col-form-label" for="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}">${translatePropertyName("captionTimeFrom")}</label><input type="time" id="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}" class="form-control mb-2" value="${startValue}" ${startSetEventHandler == true ? ` onchange="change${deviceType}Property('${serialNumber}', '${startName}', '${startPropertyName}', this.value)"` : ""}></div><div class="col text-center"">${translatePropertyName("timeUntil")}</div><div class="col"><label class="col-form-label" for="tp${startPropertyName.charAt(0).toUpperCase() + startPropertyName.slice(1)}">${translatePropertyName("captionTimeTo")}</label><input type="time" id="tp${endPropertyName.charAt(0).toUpperCase() + endPropertyName.slice(1)}" class="form-control mb-2" value="${endValue}" ${endSetEventHandler == true ? ` onchange="change${deviceType}Property('${serialNumber}', '${endName}', '${endPropertyName}', this.value)"` : ""}></div></div>`;
}

function generateInteractionExpander(event, enabled, deviceProperties, deviceInteractions, deviceId, setEventHandler) {
	var interactionExpander = `
										<div class="accordion-item">
											<div class="accordion-header">
												<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseInteraction${event.charAt(0).toUpperCase() + event.slice(1)}"><h5 class="mb-0 ps-0">${translateContent(`lblInteraction${event.charAt(0).toUpperCase() + event.slice(1)}`)}</h5></button>
											</div>
											<div id="collapseInteraction${event.charAt(0).toUpperCase() + event.slice(1)}" class="accordion-collapse collapse">
												<div class="accordion-body">
													${generateElementTextBox("text", deviceProperties.serialNumber, deviceProperties.name, `${event}EventTarget`, `${event}EventTargetHint`, "", `${deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].target !== "" ? deviceInteractions.eventInteractions[`${getEventId(event)}`].target : ""}`, enabled, false)}
													${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, `${event}EventUseHttps`, deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].useHttps !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].useHttps : false, enabled, true)}
													${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, `${event}EventUseLocalCertificate`, deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].useLocalCertificate !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].useLocalCertificate : false, deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].useHttps !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].useHttps : false, false)}
													${generateElementSwitch("Device", deviceProperties.serialNumber, deviceProperties.name, `${event}EventRejectUnauthorized`, deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].rejectUnauthorized !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].rejectUnauthorized : true, deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].useHttps !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].useHttps : false, false)}
													${generateElementTextBox("text", deviceProperties.serialNumber, deviceProperties.name, `${event}EventUser`, `${event}EventUserHint`, "", `${deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].user !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].user : ""}`, enabled, false)}
													${generateElementTextBox("password", deviceProperties.serialNumber, deviceProperties.name, `${event}EventPassword`, `${event}EventPasswordHint`, "", `${deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].password !== undefined ? deviceInteractions.eventInteractions[`${getEventId(event)}`].password : ""}`, enabled, false)}
													${generateElementTextArea("Device", deviceProperties.serialNumber, deviceProperties.name, 100, 2, `${event}EventCommand`, `${event}EventCommandHint`, "", `${deviceInteractions !== null && deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].command !== "" ? atob(deviceInteractions.eventInteractions[`${getEventId(event)}`].command) : ""}`, enabled, false)}
													<div class="btn-group" role="group">
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}SaveEventInteraction`, "btn btn-outline-secondary", `saveEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-floppy" title="${translateString("strInteractionSave")}"></i> ${translateString("strInteractionSave")}`, enabled, undefined, undefined, setEventHandler)}`;
			if(deviceInteractions !== null && (deviceInteractions.eventInteractions[`${getEventId(event)}`] !== undefined && deviceInteractions.eventInteractions[`${getEventId(event)}`].target !== "" && deviceInteractions.eventInteractions[`${getEventId(event)}`].command !== "")) {
				interactionExpander += `
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}TestUnstoredEventInteraction`, "btn btn-outline-secondary", `testUnstoredEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-play-circle" title="${translateString("strInteractionUnstoredTest")}"></i> ${translateString("strInteractionUnstoredTest")}`, enabled, undefined, undefined, setEventHandler)}
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}TestStoredEventInteraction`, "btn btn-outline-secondary", `testStoredEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-file-play" title="${translateString("strInteractionStoredTest")}"></i> ${translateString("strInteractionStoredTest")}`, enabled, undefined, undefined, setEventHandler)}
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}DeleteEventInteraction`, "btn btn-outline-secondary", `deleteEventInteractionQuestion('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-trash3" title="${translateString("strInteractionDelete")}"></i> ${translateString("strInteractionDelete")}`, enabled, undefined, undefined, setEventHandler)}`;
			} else {
				interactionExpander += `
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}TestUnstoredEventInteraction`, "btn btn-outline-secondary", `testUnstoredEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-play-circle" title="${translateString("strInteractionUnstoredTest")}"></i> ${translateString("strInteractionUnstoredTest")}`, enabled, undefined, undefined, setEventHandler)}
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}TestStoredEventInteraction`, "btn btn-outline-secondary", `testStoredEventInteraction('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-file-play" title="${translateString("strInteractionStoredTest")}"></i> ${translateString("strInteractionStoredTest")}`, false, undefined, undefined, setEventHandler)}
														${makeButtonElement(`btn${event.charAt(0).toUpperCase() + event.slice(1)}DeleteEventInteraction`, "btn btn-outline-secondary", `deleteEventInteractionQuestion('${deviceId}', '${deviceProperties.name}', '${deviceProperties.serialNumber}', '${event}')`, `<i class="bi-trash3" title="${translateString("strInteractionDelete")}"></i> ${translateString("strInteractionDelete")}`, false, undefined, undefined, setEventHandler)}`;
			}
			interactionExpander += `
													</div>
												</div>
											</div>
										</div>`;
	return interactionExpander;
}

async function changeDeviceProperty(deviceId, deviceName, propertyName, propertyValue) {
	switch (propertyName) {
		case "motionEventUseHttps":
		case "radarMotionEventUseHttps":
		case "personEventUseHttps":
		case "petEventUseHttps":
		case "soundEventUseHttps":
		case "cryingEventUseHttps":
		case "strangerPersonEventUseHttps":
		case "vehicleEventUseHttps":
		case "dogEventUseHttps":
		case "dogLickEventUseHttps":
		case "dogPoopEventUseHttps":
		case "ringEventUseHttps":
		case "sensorOpenEventUseHttps":
		case "sensorCloseEventUseHttps":
			if(document.getElementById(`chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`).checked === true) {
				document.getElementById(`chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`.replace("UseHttps", "UseLocalCertificate")).removeAttribute("disabled");
				document.getElementById(`chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`.replace("UseHttps", "RejectUnauthorized")).removeAttribute("disabled");
			} else {
				document.getElementById(`chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`.replace("UseHttps", "UseLocalCertificate")).setAttribute("disabled", true);
				document.getElementById(`chk${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`.replace("UseHttps", "RejectUnauthorized")).setAttribute("disabled", true);
			}
			break;
		default:
			var objResp, objErr;
			var url = `${location.protocol}//${location.hostname}:${port}/setDeviceProperty/${deviceId}/${propertyName}/${propertyValue}`;
			await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, generateContentDeviceSettingsModal, [deviceId, deviceName]).then((result) => {
				try {
					objResp = JSON.parse(result);
					if(objResp.success == true) {
						const toast = new bootstrap.Toast(toastOK);
						document.getElementById("toastOKHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
						document.getElementById("toastOKText").innerHTML = translateMessages("messageSaveSettingsOkMessage");
						toast.show();
						generateDeviceSettingsModal(deviceId, deviceName)
					} else {
						const toast = new bootstrap.Toast(toastFailed);
						document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
						document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveSettingsFailedMessage");
						toast.show();
					}
				} catch (e) {
					document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
				}
			}).catch((err) => {
				try {
					objErr = err;
					if(objErr.cause == "ABORT") {
						const toast = new bootstrap.Toast(toastFailed);
						document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
						document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
						toast.show();
					} else {
						const toast = new bootstrap.Toast(toastFailed);
						document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
						document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveSettingsFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
						toast.show();
					}
				} catch (e) {
					const toast = new bootstrap.Toast(toastFailed);
						document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
						document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
						toast.show();
				}
			});
	}
}

function updateSliderValue(element, value) {
	document.getElementById(element).innerHTML = value;
}

function generateStationSettingsModal(stationId, stationName) {
	generateContentStationSettingsModal(stationId, stationName);

	if(stationName === undefined) {
		const myModal = new bootstrap.Modal(document.getElementById('modalStationSettings'));
		myModal.show();
	}

	getTimeZones(stationId);
}

function generateContentStationSettingsModal(stationId, stationName) {
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

async function getTimeZones(stationId) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/getTimeZones`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
					if(objResp.data.length > 0) {
						getStationPropertiesMetadata(stationId, objResp.data)
					} else {
						document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageLoadTimeZoneInfoNotSuccessfullMessage"));
					}
				} else {
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageLoadTimeZoneInfoFailedMessage"));
				}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function getStationPropertiesMetadata(stationId, timeZones) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${stationId}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.data != undefined) {
					getStationProperties(stationId, timeZones, objResp.data)
				} else {
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorNoStationForGetInfo", "StationPropertiesMetadata"));
				}
			} else {
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationPropertiesMetadata"));
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationPropertiesMetadata"));
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function getStationProperties(stationId, timeZones, stationPropertiesMetadata) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/getStationProperties/${stationId}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.data != undefined) {
					fillStationSettingsModal(stationId, objResp.modelName, objResp.isP2PConnected, objResp.isEnergySavingDevice, objResp.isDeviceKnownByClient, objResp.deviceType, objResp.isIntegratedDevice, objResp.data.properties, objResp.data.commands, stationPropertiesMetadata, timeZones);
				} else {
					document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorNoStationForGetInfo", "StationProperties"));
				}
			} else {
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationProperties"));
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("modalStationSettings").innerHTML = generateStationModalErrorMessage(translateMessages("messageErrorLoadStationForGetInfo", "StationProperties"));
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

function generateStationModalErrorMessage(errorMessage) {
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

function fillStationSettingsModal(stationId, modelName, isP2PConnected, isEnergySavingDevice, isDeviceKnownByClient, deviceType, isIntegratedDevice, stationProperties, stationCommands, stationPropertiesMetadata, timeZone) {
	var setEventHandler = true;
	var stationModal =  `
						<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-lg-down">
							<div class="modal-content">
								<div class="modal-header text-bg-secondary placeholder-glow" style="--bs-bg-opacity: .5;" id="lblModalStationSettingsTitle">
									<div style="text-align:left; float:left;"><h5 class="mb-0">${stationProperties.name} (${stationId})</h5></div>
									${makeButtonElement("btnStationSettingsModalCloseTop", "btn-close", undefined, "", true, "modal", "close", true)}
								</div>
								<div class="modal-body placeholder-glow" id="divModalStationSettingsContent">
									<div class="" id="lblModalStationSettingsInfo">`;
	if(isStationOrDevicesKnown(stationProperties.model.slice(0,5)) == false && isDeviceKnownByClient === true) {
		setEventHandler = false;
		stationModal += `
										${createMessageContainer("alert alert-warning", translateContent("lblNotSupportedStationHeading"), `${translateContent("lblNotSupportedStationMessage", `${location.protocol}//${location.hostname}:${port}/getStationPropertiesTruncated/${stationId}`, `${location.protocol}//${location.hostname}:${port}/getStationPropertiesMetadata/${stationId}`)}${isIntegratedDevice ? `</p><p class="mt-2">${translateContent("lblNotSupportedDeviceMessageSolo", `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesTruncated/${stationId}`, `${location.protocol}//${location.hostname}:${port}/getDevicePropertiesMetadata/${stationId}`)}` : ""}`, translateContent("lblNotSupportedStationSubText"))}
										${createMessageContainer("alert alert-primary", translateContent("lblNotSupportedStationNoSaving"), "", "")}`;
	} else if(isDeviceKnownByClient === false) {
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
										<div class="col">
											<span id="lblStationInfo">
												<h6 class="card-subtitle text-muted">
													<div class="row">
														${generateColumnForProperty("col", "lblStationFirmware", "text-nowrap", "", "", "bi-gear-wide-connected", translateContent("lblFirmware"), `${stationProperties.softwareVersion}${stationProperties.softwareTime !== undefined && stationProperties.softwareTime !== "" ? `<br /><small>${makeDateTimeString(new Date(parseInt(stationProperties.softwareTime*1000)), false)}</small>` : ""}`)}
														${generateColumnForProperty("col", "lblStationLanIpAddress", "text-nowrap", "", "", "bi-router", translateContent("lblStationLanIpAddress"), stationProperties.lanIpAddress)}
													</div>
												</h6>
											</span>
										</div>
									</div>`;
	if(isP2PConnected === false && isEnergySavingDevice === false) {
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
	if(stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined || stationPropertiesMetadata.promptVolume !== undefined) {
		stationModal +=  `
									<div class="card mb-3" id="cardStationAudioSettings">
										<h5 class="card-header">${translateContent("lblHeaderAudioSettings")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined) {
			stationModal +=  `
											<h5>${translateContent("lblAlarmTone")}</h5>`;
			if(stationPropertiesMetadata.alarmTone !== undefined) {
				stationModal +=  `
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmTone.name, stationProperties.alarmTone, setEventHandler, stationPropertiesMetadata.alarmTone.states)}`;
			}
			if(stationPropertiesMetadata.alarmVolume.min !== undefined) {
				stationModal +=  `
											${generateElementRange("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmVolume.name, stationProperties.alarmVolume, setEventHandler, stationPropertiesMetadata.alarmVolume.unit, stationPropertiesMetadata.alarmVolume.min, stationPropertiesMetadata.alarmVolume.max, stationPropertiesMetadata.alarmVolume.default)}`;
			} else if(stationPropertiesMetadata.alarmVolume.states !== undefined) {
				stationModal +=  `
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.alarmVolume.name, stationProperties.alarmVolume, setEventHandler, stationPropertiesMetadata.alarmVolume.states)}`;
			}
		}
		if(stationPropertiesMetadata.promptVolume !== undefined) {
			stationModal +=  `
											${stationPropertiesMetadata.alarmTone !== undefined || stationPropertiesMetadata.alarmVolume !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblPromptVolume")}</h5>
											${generateElementRange("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.promptVolume.name, stationProperties.promptVolume, setEventHandler, stationPropertiesMetadata.promptVolume.unit, stationPropertiesMetadata.promptVolume.min, stationPropertiesMetadata.promptVolume.max, stationPropertiesMetadata.promptVolume.default)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.notificationSwitchModeSchedule !== undefined || stationPropertiesMetadata.notificationSwitchModeGeofence !== undefined || stationPropertiesMetadata.notificationSwitchModeApp !== undefined || stationPropertiesMetadata.notificationSwitchModeKeypad!== undefined || stationPropertiesMetadata.notificationStartAlarmDelay !== undefined) {
		stationModal +=  `
									<div class="card mb-3" id="cardStationNotificationSettings">
										<h5 class="card-header">${translateContent("lblHeaderNotificationSettings")}</h5>
										<div class="card-body">
											<h5>${translateContent("lblPushNotification")}</h5>
											<label class="mb-2" for="chkStationSwitchToSchedule">${translateContent("lblPushNotificationDesc")}</label>
											${stationPropertiesMetadata.notificationSwitchModeSchedule === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeSchedule.name, stationProperties.notificationSwitchModeSchedule, stationPropertiesMetadata.notificationSwitchModeSchedule.writeable, setEventHandler)}
											${stationPropertiesMetadata.notificationSwitchModeGeofence === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeGeofence.name, stationProperties.notificationSwitchModeGeofence, stationPropertiesMetadata.notificationSwitchModeGeofence.writeable, setEventHandler)}
											${stationPropertiesMetadata.notificationSwitchModeApp === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeApp.name, stationProperties.notificationSwitchModeApp, stationPropertiesMetadata.notificationSwitchModeApp.writeable, setEventHandler)}
											${stationPropertiesMetadata.notificationSwitchModeKeypad === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationSwitchModeKeypad.name, stationProperties.notificationSwitchModeKeypad, stationPropertiesMetadata.notificationSwitchModeKeypad.writeable, setEventHandler)}
											${stationPropertiesMetadata.notificationStartAlarmDelay === undefined ? "" : generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.notificationStartAlarmDelay.name, stationProperties.notificationStartAlarmDelay, stationPropertiesMetadata.notificationStartAlarmDelay.writeable, setEventHandler)}
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.timeZone !== undefined || stationPropertiesMetadata.timeFormat !== undefined) {
		stationModal +=  `
									<div class="card mb-3" id="cardStationTimeSettings">
										<h5 class="card-header">${translateContent("lblTimeSettings")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.timeZone !== undefined) {
			stationModal +=  `
											<h5>${translateContent("lblTimeZone")}</h5>
											${generateElementSelectTimeZone("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.timeZone.name, stationProperties.timeZone, false, timeZone)}`;
		}
		if(stationPropertiesMetadata.timeFormat !== undefined) {
			stationModal +=  `
											${stationPropertiesMetadata.timeZone !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblTimeFormat")}</h5>
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.timeFormat.name, stationProperties.timeFormat, setEventHandler, stationPropertiesMetadata.timeFormat.states)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.crossCameraTracking !== undefined || stationPropertiesMetadata.continuousTrackingTime !== undefined || stationPropertiesMetadata.trackingAssistance !== undefined || stationPropertiesMetadata.crossTrackingCameraList !== undefined || stationPropertiesMetadata.crossTrackingGroupList !== undefined) {
		stationModal +=  `
									<div class="card mb-3 collapse" id="cardStationCrossCameraTracking">
										<h5 class="card-header">${translateContent("lblCrossCameraTracking")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.crossCameraTracking !== undefined) {
			stationModal +=  `
											<h5>${translateContent("lblCrossCameraTracking")}</h5>
											${generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.crossCameraTracking.name, stationProperties.crossCameraTracking, stationPropertiesMetadata.crossCameraTracking.writeable, setEventHandler)}`;
		}
		if(stationPropertiesMetadata.continuousTrackingTime !== undefined) {
			stationModal +=  `
											${stationPropertiesMetadata.crossCameraTracking !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblContinuousTrackingTime")}</h5>
											${generateElementSelect("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.continuousTrackingTime.name, stationProperties.continuousTrackingTime, setEventHandler, stationPropertiesMetadata.continuousTrackingTime.states)}`;
		}
		if(stationPropertiesMetadata.trackingAssistance !== undefined) {
			stationModal +=  `
											${stationPropertiesMetadata.crossCameraTracking !== undefined || stationPropertiesMetadata.continuousTrackingTime !== undefined ? `<hr />`: ``}
											<h5>${translateContent("lblTrackingAssistance")}</h5>
											${generateElementSwitch("Station", stationProperties.serialNumber, stationProperties.name, stationPropertiesMetadata.trackingAssistance.name, stationProperties.trackingAssistance, stationPropertiesMetadata.trackingAssistance.writeable, setEventHandler)}`;
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.sdCapacity !== undefined || stationPropertiesMetadata.sdCapacityAvailable !== undefined) {
		var conversionFactor = 1000;
		if(stationProperties.model.startsWith("T8030")) {
			conversionFactor = 1024;
		}
		stationModal +=  `
									<div class="card mb-3" id="cardStationStorageSettings">
										<h5 class="card-header">${translateContent("lblStorageInfoHeader")}</h5>
										<div class="card-body">`;
		if(stationPropertiesMetadata.sdCapacity !== undefined || stationPropertiesMetadata.sdCapacityAvailable !== undefined) {
			stationModal +=  `
											<h5>${translateContent("lblInternalStorage")}</h5>
											${stationProperties.sdStatus == 0 ? createMessageContainer("alert alert-success", "", translateSdStatusMessageText(stationProperties.sdStatus), "") : createMessageContainer("alert alert-warning", "", `${translateMessages("messageStorageErrorHeader")}:<br />${translateSdStatusMessageText(stationProperties.sdStatus)}`, translateMessages("messageStorageErrorSubText"))}`;
			if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity >= 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable >= 0) {
				var capacityUnits = ["", "", ""];
				var rawTempValue = stationProperties.sdCapacity/conversionFactor;
				if(rawTempValue >= 1024) {
					var sdCapacity = (rawTempValue/1024).toFixed(2);
					capacityUnits[0] = "TB";
				} else {
					var sdCapacity = (rawTempValue).toFixed(2);
					capacityUnits[0] = "GB";
				}
				rawTempValue = stationProperties.sdCapacityAvailable/conversionFactor;
				if(rawTempValue >= 1024) {
					var sdCapacityAvailable = (rawTempValue/1024).toFixed(2);
					capacityUnits[1] = "TB";
				} else {
					var sdCapacityAvailable = (rawTempValue).toFixed(2);
					capacityUnits[1] = "GB";
				}
				rawTempValue = (stationProperties.sdCapacity/conversionFactor) - (stationProperties.sdCapacityAvailable/conversionFactor);
				if(rawTempValue >= 1024) {
					var sdCapacityUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[2] = "TB";
				} else {
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
			} else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0) {
				stationModal += `
											${createMessageContainer("alert alert-warning", "", translateMessages("messageStorageCapacityErrorHeader"), translateMessages("messageStorageCapacityErrorSubText"))}`;
			}
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationPropertiesMetadata.storageInfoEmmc !== undefined || stationPropertiesMetadata.storageInfoHdd !== undefined) {
		var conversionFactor = 1024;
		stationModal +=  `
									<div class="card mb-3" id="cardStationStorageSettings">
										<h5 class="card-header">${translateContent("lblStorageInfoHeader")}</h5>
										<div class="card-body">`;
		if(stationProperties.storageInfoEmmc !== undefined) {
			stationModal +=  `
											<h5>${translateContent("lblInternalEmmcStorage")}</h5>
											${stationProperties.storageInfoEmmc.health == 0 ? createMessageContainer("alert alert-success", "", translateSdStatusMessageText(stationProperties.storageInfoEmmc.health), "") : createMessageContainer("alert alert-warning", "", `${translateMessages("messageStorageErrorHeader")}:<br />${translateSdStatusMessageText(stationProperties.storageInfoEmmc.health)}`, translateMessages("messageStorageErrorSubText"))}`;
			if(stationProperties.storageInfoEmmc.disk_size !== undefined && stationProperties.storageInfoEmmc.disk_size > 0 && stationProperties.storageInfoEmmc.system_size !== undefined && stationProperties.storageInfoEmmc.system_size >= 0 && stationProperties.storageInfoEmmc.disk_used !== undefined && stationProperties.storageInfoEmmc.disk_used >= 0 && stationProperties.storageInfoEmmc.data_used_percent !== undefined && stationProperties.storageInfoEmmc.data_used_percent >= 0 && stationProperties.storageInfoEmmc.video_size !== undefined && stationProperties.storageInfoEmmc.video_size >= 0 && stationProperties.storageInfoEmmc.video_used !== undefined && stationProperties.storageInfoEmmc.video_used >= 0 && stationProperties.storageInfoEmmc.data_partition_size !== undefined && stationProperties.storageInfoEmmc.data_partition_size >= 0 && stationProperties.storageInfoEmmc.eol_percent !== undefined && stationProperties.storageInfoEmmc.eol_percent >= 0) {
				var capacityUnits = ["", "", "", ""];
				var rawTempValue = stationProperties.storageInfoEmmc.disk_size/conversionFactor;
				if(rawTempValue >= 1024) {
					var emmcCapacity = (rawTempValue/1024).toFixed(2);
					capacityUnits[0] = "TB";
				} else {
					var emmcCapacity = (rawTempValue).toFixed(2);
					capacityUnits[0] = "GB";
				}
				rawTempValue = stationProperties.storageInfoEmmc.disk_used/conversionFactor;
				if(rawTempValue >= 1024) {
					var emmcCapacityUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[1] = "TB";
				} else {
					var emmcCapacityUsed = (rawTempValue).toFixed(2);
					capacityUnits[1] = "GB";
				}
				rawTempValue = (stationProperties.storageInfoEmmc.disk_size-stationProperties.storageInfoEmmc.disk_used)/conversionFactor;
				if(rawTempValue >= 1024) {
					var emmcCapacityAvailable = (rawTempValue/1024).toFixed(2);
					capacityUnits[2] = "TB";
				} else {
					var emmcCapacityAvailable = (rawTempValue).toFixed(2);
					capacityUnits[2] = "GB";
				}
				var emmcCapacityUsedPercent = (stationProperties.storageInfoEmmc.disk_used/stationProperties.storageInfoEmmc.disk_size*100).toFixed(0);
				rawTempValue = (stationProperties.storageInfoEmmc.video_used/conversionFactor)/conversionFactor;
				if(rawTempValue >= 1024) {
					var emmcVideoUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[3] = "TB";
				} else {
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
			} else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0) {
				stationModal += `
											${createMessageContainer("alert alert-warning", "", translateMessages("messageStorageCapacityErrorHeader"), translateMessages("messageStorageCapacityErrorSubText"))}`;
			}
		}
		if(stationProperties.storageInfoHdd !== undefined) {
			stationModal +=  `
											<hr>
											<h5>${translateContent("lblHddStorage")}</h5>
											${stationProperties.storageInfoHdd.health == 0 ? createMessageContainer("alert alert-success", "", translateSdStatusMessageText(stationProperties.storageInfoHdd.health), "") : createMessageContainer("alert alert-warning", "", `${translateMessages("messageStorageErrorHeader")}:<br />${translateSdStatusMessageText(stationProperties.storageInfoHdd.health)}`, translateMessages("messageStorageErrorSubText"))}`;
			if(stationProperties.storageInfoHdd.disk_size !== undefined && stationProperties.storageInfoHdd.disk_size > 0 && stationProperties.storageInfoHdd.system_size !== undefined && stationProperties.storageInfoHdd.system_size >= 0 && stationProperties.storageInfoHdd.disk_used !== undefined &&  stationProperties.storageInfoHdd.disk_used >= 0 && stationProperties.storageInfoHdd.video_size !== undefined && stationProperties.storageInfoHdd.video_size >= 0 && stationProperties.storageInfoHdd.video_used !== undefined && stationProperties.storageInfoHdd.video_used >= 0) {
				var capacityUnits = ["", "", "", ""];
				var rawTempValue = stationProperties.storageInfoHdd.disk_size/conversionFactor;
				if(rawTempValue >= 1024) {
					var hddCapacity = (rawTempValue/1024).toFixed(2);
					capacityUnits[0] = "TB";
				} else {
					var hddCapacity = (rawTempValue).toFixed(2);
					capacityUnits[0] = "GB";
				}
				rawTempValue = stationProperties.storageInfoHdd.disk_used/conversionFactor;
				if(rawTempValue >= 1024) {
					var hddCapacityUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[1] = "TB";
				} else {
					var hddCapacityUsed = (rawTempValue).toFixed(2);
					capacityUnits[1] = "GB";
				}
				rawTempValue = (stationProperties.storageInfoHdd.disk_size-stationProperties.storageInfoHdd.disk_used)/conversionFactor;
				if(rawTempValue >= 1024) {
					var hddCapacityAvailable = (rawTempValue/1024).toFixed(2);
					capacityUnits[2] = "TB";
				} else {
					var hddCapacityAvailable = (rawTempValue).toFixed(2);
					capacityUnits[2] = "GB";
				}
				var hddCapacityUsedPercent = (stationProperties.storageInfoHdd.disk_used/stationProperties.storageInfoHdd.disk_size*100).toFixed(0);
				rawTempValue = stationProperties.storageInfoHdd.video_used/conversionFactor;
				if(rawTempValue >= 1024) {
					var hddVideoUsed = (rawTempValue/1024).toFixed(2);
					capacityUnits[3] = "TB";
				} else {
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
			} else if(stationProperties.sdCapacity !== undefined && stationProperties.sdCapacity < 0 && stationProperties.sdCapacityAvailable !== undefined && stationProperties.sdCapacityAvailable < 0) {
				stationModal += `
											${createMessageContainer("alert alert-warning", "", translateMessages("messageStorageCapacityErrorHeader"), translateMessages("messageStorageCapacityErrorSubText"))}`;
			}
		}
		stationModal +=  `
										</div>
									</div>`;
	}
	if(stationCommands.includes("stationReboot")) {
		stationModal +=  `
									${makeButtonElement("btnStationReboot", "btn btn-outline-danger", `rebootStationQuestion('${stationProperties.serialNumber}', '${stationProperties.name}')`, translateString("strRebootStation"), true, undefined, undefined, setEventHandler)}`;
	}
	stationModal +=  `
								</div>
								<div class="modal-footer bg-secondary" style="--bs-bg-opacity: .5;">
									${makeButtonElement("btnCloseModalStationSettingsBottom", "btn btn-primary btn-sm", undefined, translateContent("btnClose"), true, "modal", undefined, setEventHandler)}
								</div>
							</div>
						</div>`;
	
	document.getElementById("modalStationSettings").innerHTML = stationModal;
}

async function changeStationProperty(stationId, stationName, propertyName, propertyValue, additionalArg) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/setStationProperty/${stationId}/${propertyName}${propertyValue !== undefined ? `/${propertyValue}${additionalArg === undefined ? "" : `/${additionalArg}`}` : ``}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, generateContentStationSettingsModal, [stationId, stationName]).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageSaveSettingsOkMessage");
				toast.show();
				generateStationSettingsModal(stationId, stationName);
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveSettingsFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveSettingsFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function rebootStationQuestion(stationSerial, stationName) {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalRebootStationTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalRebootStationMessage", stationSerial, stationName);
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalRebootStationBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalRebootStationBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `sendCommand('Station', '` + stationSerial + `', '` + stationName + `', 'rebootStation')`);
	myModal.show();
}

async function sendCommand(deviceType, deviceId, deviceName, commandName, commandValue) {
	var objResp, objErr;
	var waitFunction = undefined, waitFunctionArguments = undefined;
	var url = `${location.protocol}//${location.hostname}:${port}/sendCommand/${commandName}/${deviceId}${commandValue !== undefined ? `/${commandValue}` : ``}`;
	if(deviceType == "Station") {
		waitFunction = generateContentStationSettingsModal;
		waitFunctionArguments = [deviceId, deviceName];
	} else if(deviceType == "Device" && commandName != "moveToPreset") {
		waitFunction = generateContentDeviceSettingsModal;
		waitFunctionArguments = [deviceId, deviceName];
	}
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, waitFunction, waitFunctionArguments).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				if(commandName == "rebootStation") {
					document.getElementById("toastOKHeader").innerHTML = translateMessages("messageRebootStationHeader");
					document.getElementById("toastOKText").innerHTML = translateMessages("messageRebootStationOkMessage");
				} else if(commandName == "moveToPreset") {
					document.getElementById("toastOKHeader").innerHTML = translateMessages("messageMoveToPresetHeader");
					document.getElementById("toastOKText").innerHTML = translateMessages("messageMoveToPresetOkMessage", commandValue+1);
				} else {
					document.getElementById("toastOKHeader").innerHTML = translateMessages("messageSendCommandHeader");
					document.getElementById("toastOKText").innerHTML = translateMessages("messageSendCommandOkMessage");
				}
				toast.show();
				if(deviceType == "Station") {
					generateStationSettingsModal(deviceId, deviceName);
				} else if(deviceType == "Device" && commandName != "moveToPreset") {
					generateDeviceSettingsModal(deviceId, deviceName);
				}
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				if(commandName == "rebootStation") {
					document.getElementById("toastFailedHeader").innerHTML = translateContent("messageRebootStationHeader");
					document.getElementById("toastFailedText").innerHTML = translateContent("messageSaveSettingsOkMessage");
				} else if(commandName == "moveToPreset") {
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageMoveToPresetHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageMoveToPresetFailedMessage", commandValue+1);
				} else {
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSendCommandHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageSendCommandFailedMessage");
				}
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				if(commandName == "rebootStation") {
					document.getElementById("toastFailedHeader").innerHTML = translateContent("messageRebootStationHeader");
					document.getElementById("toastFailedText").innerHTML = `${translateContent("messageSaveSettingsOkMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				} else if(commandName == "moveToPreset") {
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageMoveToPresetHeader");
					document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageMoveToPresetFailedMessage", commandValue+1)}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				} else {
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSendCommandHeader");
					document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSendCommandFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				}
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}
//#endregion

/**
 * Scripts for statechange.html
 */
//#region statechange.html
function showLoadingStatechange() {
	document.getElementById("btnAwayAll").setAttribute("disabled", true);
	document.getElementById("btnHomeAll").setAttribute("disabled", true);
	document.getElementById("btnScheduleAll").setAttribute("disabled", true);
	document.getElementById("btnDisarmedAll").setAttribute("disabled", true);
	document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${translateString("strWaitWhileLoading")}</small>`;
	document.getElementById("stations").innerHTML = createWaitMessage(translateContent("lblWaitMessageLoadStations"));
}

async function loadDataStatechange(showLoading) {
	var objResp, objErr, station = "", stations = "", buttons = "", text = "", state, lastChangeTime;
	var waitFunction = undefined;
	var lastChangeTimeAll = -1;
	var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
	if(showLoading == true) {
		waitFunction = showLoadingStatechange;
	}
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, waitFunction, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				for(station in objResp.data) {
					state = `${translateGuardMode(objResp.data[station].guardMode)}`;
					buttons =  `<div class="row g-2">`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnAway${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 0 ? undefined : `setMode('${objResp.data[station].serialNumber}', 'away', 0)`}` , translateGuardMode(0), (objResp.data[station].guardMode != 0), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnHome${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 1 ? undefined : `setMode('${objResp.data[station].serialNumber}', 'home', 1)`}`, translateGuardMode(1), (objResp.data[station].guardMode != 1), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnSchedule${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 2 ? undefined : `setMode('${objResp.data[station].serialNumber}', 'schedule', 2)`}`, translateGuardMode(2), (objResp.data[station].guardMode != 2), undefined, undefined, true)}</div>`;
					buttons += `<div class="col-sm-6">${makeButtonElement(`btnDisarmed${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `${objResp.data[station].guardMode == 63 ? undefined : `setMode('${objResp.data[station].serialNumber}', 'disarmed', 63)`}`, translateGuardMode(63), (objResp.data[station].guardMode != 63), undefined, undefined, true)}</div>`;
					if(objResp.data[station].deviceType === "indoorcamera" && objResp.data[station].privacyMode !== undefined) {
						buttons += `<div class="col-sm-12">${makeButtonElement(`btnPrivacy${objResp.data[station].serialNumber}`, "btn btn-primary col-12 h-100", `setPrivacy('${objResp.data[station].serialNumber}', ${objResp.data[station].privacyMode === true ? `true` : `false`})`, `${objResp.data[station].privacyMode === true ? translateString("strActivate") : translateString("strDeactivate")}`, true, undefined, undefined, true)}</div>`;
					}
					buttons += `</div>`;
					if(objResp.data[station].guardModeTime !== undefined) {
						if(objResp.data[station].guardModeTime <= 0) {
							lastChangeTime = translateContent("lblUnknown");
						} else {
							lastChangeTime = makeDateTimeString(new Date(parseInt(objResp.data[station].guardModeTime)));
							if(parseInt(objResp.data[station].guardModeTime) > lastChangeTimeAll) {
								lastChangeTimeAll = parseInt(objResp.data[station].guardModeTime);
							}
						}
					} else {
						lastChangeTime = translateContent("lblNotAvailable");
					}
					stations += createCardStation(objResp.data[station], false, `<h6 class="card-subtitle mb-2 text-muted">${objResp.data[station].modelName}</h6><p class="card-text mb-1">${objResp.data[station].serialNumber}</p><div class="row g-0 mb-1">${generateColumnForProperty("col mb-1 pe-1", "spnCurrentGuardMode", "text-wrap", "", "", "bi-shield", translateContent("lblCurrentState"), `${objResp.data[station].privacyMode === undefined || objResp.data[station].privacyMode == false ? `${translateGuardMode(objResp.data[station].guardMode)}` : translateContent("lblPrivacy")}`, undefined, `(${translateGuardMode(objResp.data[station].currentMode)})`)}<div class="card-text d-grid gap-2">${buttons}</div></div>`, `<small class="text-muted">${translateContent("lblLastStateChange")}: ${lastChangeTime}</small></div>`);
				}
				text += createStationTypeCardsContainer(translateContent("lblStations"), "row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-6 g-3", stations);
				document.getElementById("btnAwayAll").removeAttribute("disabled");
				document.getElementById("btnHomeAll").removeAttribute("disabled");
				document.getElementById("btnScheduleAll").removeAttribute("disabled");
				document.getElementById("btnDisarmedAll").removeAttribute("disabled");
				document.getElementById("stations").innerHTML =  text;
				if(lastChangeTimeAll == -1) {
					lastChangeTimeAll = translateContent("lblUnknown");
				} else {
					lastChangeTimeAll = makeDateTimeString(new Date(lastChangeTimeAll))
				}
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${lastChangeTimeAll}</small>`;
			} else {
				document.getElementById("btnAwayAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmedAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${translateContent("lblUnknown")}</small>`;
				document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageStationsNotFound"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("btnAwayAll").setAttribute("disabled", true);
				document.getElementById("btnHomeAll").setAttribute("disabled", true);
				document.getElementById("btnScheduleAll").setAttribute("disabled", true);
				document.getElementById("btnDisarmedAll").setAttribute("disabled", true);
				document.getElementById("lastEventTimeAll").innerHTML = `<small class="text-muted">${translateContent("lblLastStateChange")}: ${translateContent("lblUnknown")}</small>`;
				document.getElementById("stations").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageStationsNotFound"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState, "loadDataStatechange"));
			}
		} catch (e) {
			document.getElementById("stations").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function setMode(stationSerial, modeName, modeId) {
	var objResp, objErr;
	var url;
	if(stationSerial == "") {
		url = `${location.protocol}//${location.hostname}:${port}/setMode/${modeName}`;
		document.getElementById(`btn${modeName.charAt(0).toUpperCase() + modeName.slice(1)}All`).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(modeId)}`;
	} else {
		url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationSerial}/${modeName}`;
		document.getElementById(`btn${modeName.charAt(0).toUpperCase() + modeName.slice(1)}` + stationSerial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${translateGuardMode(modeId)}`;
	}
	
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				toast.show();
				loadDataStatechange(false);
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				toast.show();
				loadDataStatechange(false);
			}
			if(stationSerial == "") {
				document.getElementById(`btn${modeName.charAt(0).toUpperCase() + modeName.slice(1)}All`).innerHTML = translateGuardMode(modeId);
			} else {
				document.getElementById(`btn${modeName.charAt(0).toUpperCase() + modeName.slice(1)}` + stationSerial).innerHTML = translateGuardMode(modeId);
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveSettingsFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function setPrivacy(stationserial, enabled) {
	if(stationserial=="") {
		const toast = new bootstrap.Toast(toastFailed);
		toast.show();
		loadDataStatechange(false);
	} else {
		document.getElementById("btnPrivacy" + stationserial).innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;${enabled === true ? translateString("strActivate") : translateString("strDeactivate")}`;
		var objResp, objErr;
		var url = `${location.protocol}//${location.hostname}:${port}/setMode/${stationserial}/${enabled === false ? `privacyOn` : `privacyOff`}`;
		await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					const toast = new bootstrap.Toast(toastOK);
					toast.show();
					loadDataStatechange(false);
				} else {
					const toast = new bootstrap.Toast(toastFailed);
					toast.show();
					loadDataStatechange(false);
				}
			} catch (e) {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
				toast.show();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
					toast.show();
				} else {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
					document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveSettingsFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
					toast.show();
				}
			} catch (e) {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
				toast.show();
			}
		});
	}
}
//#endregion

/**
 * Scripts for settings.html
 */
//#region settings.html
function disableUIElements() {
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
	document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
	document.getElementById("chkUsePushService").setAttribute("disabled", true);
	document.getElementById("cbLogLevelAddon").setAttribute("disabled", true);
	document.getElementById("cbLogLevelMain").setAttribute("disabled", true);
	document.getElementById("cbLogLevelHttp").setAttribute("disabled", true);
	document.getElementById("cbLogLevelP2p").setAttribute("disabled", true);
	document.getElementById("cbLogLevelPush").setAttribute("disabled", true);
	document.getElementById("cbLogLevelMqtt").setAttribute("disabled", true);
}

function enableUIElements() {
	document.getElementById("txtUsername").removeAttribute("disabled");
	document.getElementById("txtPassword").removeAttribute("disabled");
	document.getElementById("cbCountry").removeAttribute("disabled");
	document.getElementById("cbLanguage").removeAttribute("disabled");
	document.getElementById("cbConnectionType").removeAttribute("disabled");
	document.getElementById("chkUsePushService").removeAttribute("disabled");
	document.getElementById("cbLogLevelAddon").removeAttribute("disabled");
	document.getElementById("cbLogLevelMain").removeAttribute("disabled");
	document.getElementById("cbLogLevelHttp").removeAttribute("disabled");
	document.getElementById("cbLogLevelP2p").removeAttribute("disabled");
	document.getElementById("cbLogLevelPush").removeAttribute("disabled");
	document.getElementById("cbLogLevelMqtt").removeAttribute("disabled");
}

function collapseUICards() {
	document.getElementById("cardEufySecurityAccountData").classList.add("collapse");
	document.getElementById("cardEufySecurityConfig").classList.add("collapse");
	document.getElementById("containerBtnSave").classList.add("collapse");
	document.getElementById("cardSystemVariables").classList.add("collapse");
}

function deCollapseUICards() {
	document.getElementById("cardEufySecurityAccountData").classList.remove("collapse");
	document.getElementById("cardEufySecurityConfig").classList.remove("collapse");
	document.getElementById("containerBtnSave").classList.remove("collapse");
	document.getElementById("cardSystemVariables").classList.remove("collapse");
}

function validateFormSettings() {
	var form = document.getElementById("configform");
	form.addEventListener('submit', function(event)
	{
		if(form.checkValidity() === false)
		{
			event.preventDefault();
			event.stopPropagation();
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageCheckConfigFailedHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageCheckConfigFailedMessage");
			toast.show();
		}
		//form.classList.add('was-validated');
	}, false);
}

async function generateNewTrustedDeviceName() {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/generateNewTrustedDeviceName`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.trustedDeviceName !== undefined) {
					document.getElementById('txtTrustedDeviceName').value = objResp.trustedDeviceName;
				}
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				
			}
		} catch (e) {
			document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

function loadSettings() {
	document.getElementById("resultLoading").innerHTML = createWaitMessage(translateString("strLoadingSettings"));
	loadCountries();
}

async function loadCountries() {
	if(serviceState == "running") {
		var objResp, objErr, country;
		var url = `${location.protocol}//${location.hostname}:${port}/getCountries`;
		await retrieveData("GET", url, 'application/json', undefined, "countrySelectionMessage", "strLoadingSettings", undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					for(country in objResp.data) {
						var option = document.createElement("option");
						option.value=objResp.data[country].countryCode;
						option.text=objResp.data[country].countryName;
						document.getElementById("cbCountry").add(option);
					}
					document.getElementById("countrySelectionMessage").innerHTML = "";
					loadHouses();
				} else {
					document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageCountriesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					loadHouses();
				}
			} catch (e) {
				document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageCountriesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				loadHouses();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageCountriesLoadingFailedHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadCountries"));
					loadHouses();
				}
			} catch (e) {
				document.getElementById("countrySelectionMessage").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
			}
		});
	} else {
		loadHouses();
	}
}

async function loadHouses() {
	if(serviceState == "running") {
		var objResp, objErr, house;
		var url = `${location.protocol}//${location.hostname}:${port}/getHouses`;
		await retrieveData("GET", url, 'application/json', undefined, "houseSelectionMessage", "strLoadingHouses", undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					for(house in objResp.data) {
						var option = document.createElement("option");
						option.value=objResp.data[house].houseId;
						option.text=translateContent("lblHouseManagementStationsAndDevicesOfHome", objResp.data[house].houseName);
						document.getElementById("cbHouseSelection").add(option);
					}
					document.getElementById("houseSelectionMessage").innerHTML = "";
					loadStationsSettings();
				} else {
					document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageHousesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					loadStationsSettings();
				}
			} catch (e) {
				document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageHousesLoadingFailedHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				loadStationsSettings();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageHousesLoadingFailedHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadHouses"));
					loadStationsSettings();
				}
			} catch (e) {
				document.getElementById("houseSelectionMessage").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
			}
		});
	}
	else
	{
		loadStationsSettings();
	}
}

async function loadStationsSettings() {
	document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
	if(serviceState == "running") {
		var objResp, objErr, station, stations = "";
		var url = `${location.protocol}//${location.hostname}:${port}/getStations`;
		await retrieveData("GET", url, 'application/json', undefined, "useUDPStaticPortsStations", "strLoadingStations", undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					for(station in objResp.data) {
						stations += `<div class="form-label-group was-validated" class="container-fluid"><label class="my-2" for="txtUdpPortsStation${objResp.data[station].serialNumber}">${translateContent("lblUDPPortStationLabel", objResp.data[station].serialNumber, objResp.data[station].name)}</label>`;
						stations += `<input type="text" name="udpPortsStation${objResp.data[station].serialNumber}" id="txtUdpPortsStation${objResp.data[station].serialNumber}" class="form-control" placeholder="${translateContent("lblUDPPortStationPlaceholder", objResp.data[station].serialNumber)}" onfocusout="checkUDPPorts(udpPortsStation${objResp.data[station].serialNumber})" required>`;
						stations += `<small class="form-text text-muted">${translateContent("lblUDPPortStationSubText")}</small>`;
						stations += `<div class="invalid-feedback">${translateContent("lblUDPPortStationError")}</div></div>`;
						var option = document.createElement("option");
						option.value=objResp.data[station].serialNumber;
						option.text=`${objResp.data[station].name} (${objResp.data[station].serialNumber})`;
						document.getElementById("cbReconnectStation").add(option);
					}
					document.getElementById('chkUseUdpStaticPorts').removeAttribute("disabled");
					document.getElementById("useUDPStaticPortsStations").innerHTML = stations;
					loadSystemVariables();
				} else {
					document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageStationsLoadingError"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
					loadSystemVariables();
				}
			} catch (e) {
				document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageStationsLoadingError"), "", translateMessages("messageErrorPrintErrorMessage", e));
				document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
				loadSystemVariables();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("useUDPStaticPortsStations").innerHTML = createMessageContainer("alert alert-danger mt-2", translateMessages("messageStationsLoadingError"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState, "loadStationsSettings"));
					document.getElementById('chkUseUdpStaticPorts').setAttribute("disabled", true);
					loadSystemVariables();
				}
			} catch (e) {
				document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
			}
		});
	} else {
		loadSystemVariables();
	}
}

async function loadDataSettings() {
	if(serviceState == "running") {
		var objResp, objErr;
		var url = `${location.protocol}//${location.hostname}:${port}/getConfig${sid !== "" ? `/${sid}` : ""}`;
		await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					document.getElementById('txtUsername').value = objResp.data.eMail;
					document.getElementById('txtPassword').value = objResp.data.password;
					if(objResp.data.country === undefined || objResp.data.country == "") {
						document.getElementById("cbCountry").selectedIndex = "";
					} else {
						document.getElementById("cbCountry").value = objResp.data.country;
					}
					if(objResp.data.language === undefined || objResp.data.language == "") {
						document.getElementById("cbLanguage").selectedIndex = "";
					} else {
						document.getElementById("cbLanguage").value = objResp.data.language;
					}
					document.getElementById('txtTrustedDeviceName').value = objResp.data.trustedDeviceName;
					if(objResp.data.httpActive == true) {
						document.getElementById("chkUseHttp").setAttribute("checked", true);
						document.getElementById("txtPortHttp").removeAttribute("disabled");
					} else {
						document.getElementById("txtPortHttp").setAttribute("disabled", true);
					}
					document.getElementById('txtPortHttp').value = objResp.data.httpPort;
					if(objResp.data.httpsActive == true) {
						document.getElementById("chkUseHttps").setAttribute("checked", true);
						document.getElementById("txtPortHttps").removeAttribute("disabled");
						document.getElementById("txtHttpsKeyFile").removeAttribute("disabled");
						document.getElementById("txtHttpsCertFile").removeAttribute("disabled");
					} else {
						document.getElementById("txtPortHttps").setAttribute("disabled", true);
						document.getElementById("txtHttpsKeyFile").setAttribute("disabled", true);
						document.getElementById("txtHttpsCertFile").setAttribute("disabled", true);
					}
					document.getElementById('txtPortHttps').value = objResp.data.httpsPort;
					document.getElementById('txtHttpsKeyFile').value = objResp.data.httpsPKeyFile;
					document.getElementById('txtHttpsCertFile').value = objResp.data.httpsCertFile;
					if(objResp.data.acceptInvitations == true) {
						document.getElementById("chkAcceptInvitations").setAttribute("checked", true);
					}
					if(objResp.data.houseId === undefined) {
						document.getElementById("cbHouseSelection").selectedIndex = 0;
					} else {
						document.getElementById("cbHouseSelection").value = objResp.data.houseId;
					}
					if(objResp.data.connectionTypeP2p === undefined || (objResp.data.connectionTypeP2p != "0" && objResp.data.connectionTypeP2p != "1" && objResp.data.connectionTypeP2p != "2")) {
						document.getElementById("cbConnectionType").selectedIndex = 0;
					} else {
						document.getElementById("cbConnectionType").value = objResp.data.connectionTypeP2p;
					}
					if(objResp.data.systemVariableActive == true) {
						document.getElementById("chkUseSystemVariables").setAttribute("checked", true);
					}
					if(objResp.data.localStaticUdpPortsActive == true) {
						document.getElementById("chkUseUdpStaticPorts").setAttribute("checked", true);
					}

					var element = document.getElementsByTagName("INPUT");
					var max = element.length;
					for(var i=0; i<max; i++) {
						if(element[i].name.startsWith("udpPortsStation")) {
							var tempSerial = element[i].name.replace("udpPortsStation", "");
							var tempPorts;
							var portItem;
							for(var portItem in objResp.data.localStaticUdpPorts) {
								if(objResp.data.localStaticUdpPorts[portItem].stationSerial == tempSerial) {
									tempPorts = objResp.data.localStaticUdpPorts[portItem].port;
									break;
								}
							}
							if(tempPorts === undefined || tempPorts == null || tempPorts == "undefined") {
								document.getElementById('txtUdpPortsStation' + tempSerial).value = "";
							} else {
								document.getElementById('txtUdpPortsStation' + tempSerial).value = tempPorts;
							}
							changeValue("useUdpStaticPorts");
							if(objResp.data.localStaticUdpPortsActive == false) {
								document.getElementById('txtUdpPortsStation' + tempSerial).setAttribute("disabled", true);
							}
						}
					}
					if(objResp.data.stateUpdateEventActive == true) {
						document.getElementById("chkUpdateStateEvent").setAttribute("checked", true);
					} else {
						document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
					}
					if(objResp.data.stateUpdateIntervallActive == true) {
						document.getElementById("chkUpdateStateIntervall").setAttribute("checked", true);
						document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
					} else {
						document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
					}
					document.getElementById('txtUpdateStateIntervallTimespan').value=objResp.data.stateUpdateIntervallTimespan;
					if(objResp.data.pushServiceActive == true) {
						document.getElementById("chkUsePushService").setAttribute("checked", true);
					}
					if(objResp.data.secureApiAccessBySid == true) {
						document.getElementById("chkUseSecureApiAccessSid").setAttribute("checked", true);
					}
					if(objResp.data.enableEmbeddedPKCS1Support == true) {
						document.getElementById("chkUseEnableEmbeddedPKCS1Support").setAttribute("checked", true);
					}
					if(objResp.data.enableEmbeddedPKCS1SupportEditable == true) {
						document.getElementById("chkUseEnableEmbeddedPKCS1Support").removeAttribute("disabled");
					} else {
						document.getElementById("chkUseEnableEmbeddedPKCS1Support").setAttribute("disabled", true);
					}
					if(objResp.data.logLevelAddon === undefined || (objResp.data.logLevelAddon < "0" || objResp.data.logLevelAddon > "6")) {
						document.getElementById("cbLogLevelAddon").selectedIndex = 3;
					} else {
						document.getElementById("cbLogLevelAddon").selectedIndex = (Number.parseInt(objResp.data.logLevelAddon)) + 1;
					}
					if(objResp.data.logLevelMain === undefined || (objResp.data.logLevelMain < "0" || objResp.data.logLevelMain > "6")) {
						document.getElementById("cbLogLevelMain").selectedIndex = 3;
					} else {
						document.getElementById("cbLogLevelMain").selectedIndex = (Number.parseInt(objResp.data.logLevelMain)) + 1;
					}
					if(objResp.data.logLevelHttp === undefined || (objResp.data.logLevelHttp < "0" || objResp.data.logLevelHttp > "6")) {
						document.getElementById("cbLogLevelHttp").selectedIndex = 3;
					} else {
						document.getElementById("cbLogLevelHttp").selectedIndex = (Number.parseInt(objResp.data.logLevelHttp)) + 1;
					}
					if(objResp.data.logLevelP2p === undefined || (objResp.data.logLevelP2p < "0" || objResp.data.logLevelP2p > "6")) {
						document.getElementById("cbLogLevelP2p").selectedIndex = 3;
					} else {
						document.getElementById("cbLogLevelP2p").selectedIndex = (Number.parseInt(objResp.data.logLevelP2p)) + 1;
					}
					if(objResp.data.logLevelPush === undefined || (objResp.data.logLevelPush < "0" || objResp.data.logLevelPush > "6")) {
						document.getElementById("cbLogLevelPush").selectedIndex = 3;
					} else {
						document.getElementById("cbLogLevelPush").selectedIndex = (Number.parseInt(objResp.data.logLevelPush)) + 1;
					}
					if(objResp.data.logLevelMqtt === undefined || (objResp.data.logLevelMqtt < "0" || objResp.data.logLevelMqtt > "6")) {
						document.getElementById("cbLogLevelMqtt").selectedIndex = 3;
					} else {
						document.getElementById("cbLogLevelMqtt").selectedIndex = (Number.parseInt(objResp.data.logLevelMqtt)) + 1;
					}
					if(objResp.data.tokenExpire === undefined) {
						document.getElementById("hintTokenData").innerHTML = ``;
					} else {
						if(objResp.data.tokenExpire == 0) {
							document.getElementById("hintTokenData").innerHTML = `${translateContent("lblTokenNoToken")}<br />`;
						} else if(objResp.data.tokenExpire.toString().length == 10 || objResp.data.tokenExpire.toString().length == 13) {
							document.getElementById("hintTokenData").innerHTML = `${translateContent("lblTokenOk", objResp.data.tokenExpire.toString().length == 10 ? makeDateTimeString(new Date(objResp.data.tokenExpire*1000)) : makeDateTimeString(new Date(objResp.data.tokenExpire)))}<br />`;
						} else {
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
					deCollapseUICards();
					enableUIElements();
				} else {
					document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsLoadingErrorHeader"), "", translateMessages("messageErrorThreeValuesMessage", "success", objResp.success, objResp.message));
					collapseUICards();
					disableUIElements();
				}
			} catch (e) {
				document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsLoadingErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsLoadingErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadDataSettings"));
				}
			} catch (e) {
				document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
			}
		});
	}
	else
	{
		document.getElementById("resultLoading").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageErrorServiceNotRunningHeader"), "", translateMessages("messageErrorServiceNotRunningMessage"));
		collapseUICards();
		disableUIElements();
	}
}

async function loadSystemVariables() {
	if(serviceState == "running") {
		var objResp, objErr, systemVariable, sysVar, sysVarName, sysVarInfo, sysVarValueType, sysVarValueSubType, sysVarValueUnit, sysVarValueMin, sysVarValueMax, sysVarValueName0, sysVarValueName1, sysVarValueList, sysVarState, sysVarAvailable, sysVarValueTypeCorrect, sysVarTable = "", sysVarDeprTable = "";
		var sysVarToDelete = false;
		var url = `${location.protocol}//${location.hostname}:${port}/checkSystemVariables`;
		await retrieveData("GET", url, 'application/json', undefined, "divSystemVariables", "strLoadingSystemVariables", undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					document.getElementById("divSystemVariablesHint").innerHTML = createMessageContainer("alert alert-primary fade show", translateMessages("messageSystemVariableHintHeader"), translateMessages("messageSystemVariableHintMessage"), translateMessages("messageSystemVariableHintSubText"));
					sysVarTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">${translateString("strSystemVariablesTableHeaderState")}</th><th scope="col" style="width: 75%;">${translateString("strSystemVariablesTableHeaderSVName")}</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
					for(systemVariable in objResp.data) {
						sysVar = objResp.data[systemVariable].sysVar;
						sysVarName = sysVar.name;
						sysVarInfo = sysVar.info;
						sysVarValueType = sysVar.valueType;
						sysVarValueSubType = sysVar.valueSubType;
						sysVarValueUnit = sysVar.valueUnit;
						sysVarValueMax = sysVar.valueMax;
						sysVarValueName0 = sysVar.valueName0;
						sysVarValueName1 = sysVar.valueName1;
						sysVarValueList = sysVar.valueList;
						sysVarState = sysVar.state;
						sysVarAvailable = objResp.data[systemVariable].sysVarAvailable;
						sysVarValueTypeCorrect = objResp.data[systemVariable].sysVarValueTypeCorrect;
						if(objResp.data[systemVariable].sysVarCurrent==true) {
							if(sysVarAvailable==true) {
								if(sysVarValueTypeCorrect==true) {
									sysVarTable += `<tr class="table-success"><th scope="row" class="align-middle text-center"><i class="bi-check-lg" title="${translateString("strSystemVariableAvailable")}"></i></th>`;
								} else {
									sysVarTable += `<tr class="table-warning"><th scope="row" class="align-middle text-center"><i class="bi-exclamation-lg" title="${translateString("strSystemVariableAvailable")}"></i></th>`;
								}
							} else {
								sysVarTable += `<tr class="table-danger"><th scope="row" class="align-middle text-center"><i class="bi-x-lg" title="${translateString("strSystemVariableNotAvailable")}"></i></th>`;
							}
							sysVarTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
							if(sysVarAvailable==true) {
								if(sysVarValueTypeCorrect==true) {
									sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-outline-primary mb-1", undefined, translateContent("lblSystemVariableAvailable"), false, undefined, undefined, false)}</div></td>`;
								} else {
									sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `updateSystemVariableQuestion('${sysVarName}', '${sysVarInfo}', '${sysVarValueType}', '${sysVarValueSubType}', '${sysVarValueUnit}', '${sysVarValueMin}', '${sysVarValueMax}', '${sysVarValueName0}', '${sysVarValueName1}', '${sysVarValueList}', '${sysVarState}')`, translateContent("lblSystemVariableUpdate"), true, undefined, undefined, true)}</div></td>`;
								}
							} else {
								sysVarTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `createSysVar('${sysVarName}', '${sysVarInfo}', '${sysVarValueType}', '${sysVarValueSubType}', '${sysVarValueUnit}', '${sysVarValueMin}', '${sysVarValueMax}', '${sysVarValueName0}', '${sysVarValueName1}', '${sysVarValueList}', '${sysVarState}')`, translateContent("lblSystemVariableCreate"), true, undefined, undefined, true)}</div></td>`;
							}
							sysVarTable += `</tr>`;
						} else {
							if(sysVarToDelete==false) {
								sysVarDeprTable = `<table class="table mb-0"><thead class="thead-dark"><tr><th scope="col" class="align-middle text-center" style="width: 4%;">${translateString("strSystemVariablesTableHeaderState")}</th><th scope="col" style="width: 75%;">${translateString("strSystemVariablesTableHeaderSVName")}</th><th scope="col" style="width: 21%;"></th></tr></thead><tbody class="table-group-divider">`;
							}
							sysVarToDelete = true;
							sysVarDeprTable += `<tr class="table-danger"><th scope="row" class="align-middle text-center"><i class="bi-check-lg" title="${translateString("strSystemVariableAvailable")}"></i></th>`;
							sysVarDeprTable += `<td class="text-break align-middle">${sysVarName}<br /><small class="form-text text-muted">${sysVarInfo}</small></td>`;
							sysVarDeprTable += `<td class="align-middle text-center"><div class="d-grid">${makeButtonElement(`btn${sysVarName}`, "btn btn-primary mb-1", `removeSystemVariableQuestion('${sysVarName}')`, translateContent("lblSystemVariableRemove"), true, undefined, undefined, true)}</div></td>`;
							sysVarDeprTable += `</tr>`;
						}
					}
					sysVarTable += `</tbody></table>`;
					document.getElementById("divSystemVariables").innerHTML = sysVarTable;
					if(sysVarToDelete==true) {
						sysVarDeprTable += `</tbody></table>`;
						document.getElementById("divDeprecatedSystemVariables").innerHTML = sysVarDeprTable;
						document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = `<hr /><div class="form-label-group" class="container-fluid"><label for="btnShowDeprecatedSystemVariables" class="mb-2">${translateString("strSystemVariablesUnusedHintHeader")}<br /><small class="form-text text-muted">${translateString("strSystemVariablesUnusedHintMessage")}</small></label></div>`;
					}
				} else {
					if(objResp.reason == "System variables in config disabled.") {
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-info mb-0", translateMessages("messageSystemVariablesDeactivatedHeader"), translateMessages("messageSystemVariablesDeactivatedMessage"), translateMessages("messageSystemVariablesDeactivatedSubText"));
					} else {
						document.getElementById("divSystemVariablesHint").innerHTML = "";
						document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageSystemVariablesLoadingErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
					}
				}
				loadDataSettings();
			} catch (e) {
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageSystemVariablesLoadingErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
				loadDataSettings();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
				} else {
					document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger mb-0", translateMessages("messageSystemVariablesLoadingErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", this.status, this.readyState, "loadSystemVariables"));
					loadDataSettings();
				}
			} catch (e) {
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
			}
		});
	} else {
		loadDataSettings();
	}
}

async function saveConfig() {
	var objResp, objErr, objFD;
	var url = `${location.protocol}//${location.hostname}:${port}/setConfig${sid !== "" ? `/${sid}` : ""}`;
	objFD = new FormData(document.getElementById("configform"));
	await retrieveData("POST", url, undefined, objFD, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(objResp.serviceRestart == true) {
					document.getElementById("resultMessage").innerHTML = "";
					window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
					return;
				} else {
					document.getElementById("resultMessage").innerHTML = "";
					const toast = new bootstrap.Toast(toastOK);
					document.getElementById("toastOKHeader").innerHTML = translateMessages("messageSaveConfigOKHeader");
					document.getElementById("toastOKText").innerHTML = translateMessages("messageSaveConfigOKMessage");
					toast.show();
				}
				loadDataSettings();
				loadSystemVariables();
			} else {
				document.getElementById("resultMessage").innerHTML = "";
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveConfigFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveConfigFailedMessage");
				toast.show();
			}
		} catch (e) {
			document.getElementById("modalStationSettings").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSettingsSaveErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "saveConfig"));
			}
		} catch (e) {
			document.getElementById("resultMessage").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function createSysVar(varName, varInfo, varValueType, varValueSubType, varValueUnit, varValueMin, varValueMax, varValueName0, varValueName1, varValueList, varState) {
	var systemVariable;
	systemVariable = `{"name": "${varName}", "info": "${varInfo}", "valueType": "${varValueType}", "valueSubType": "${varValueSubType}", "valueUnit": "${varValueUnit}", "valueMin": "${varValueMin}", "valueMax": "${varValueMax}", "valueName0": "${varValueName0}", "valueName1": "${varValueName1}", "valueList": "${varValueList}", "state": "${varState}"}`;

	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/createSystemVariable`;
	await retrieveData("POST", url, 'application/json', systemVariable, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				loadSystemVariables();
			} else {
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesCreateErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		} catch (e) {
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesCreateErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = "";
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesCreateErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "createSysVar"));
			}
		} catch (e) {
			document.getElementById("divSystemVariables").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function removeSystemVariableQuestion(varName) {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalDeleteSystemVariableTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalDeleteSystemVariableMessage", varName);
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalDeleteSystemVariableBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalDeleteSystemVariableBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `removeSystemVariable("` + varName + `")`);
	myModal.show();
}

async function removeSystemVariable(varName) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/removeSystemVariable/${varName}`;
	await retrieveData("GET", url, 'application/json', undefined, "divDeprecatedSystemVariables", "strSystemVariableUnusedRemoving", undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				loadSystemVariables();
			} else {
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		} catch (e) {
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "removeSystemVariable"));
			}
		} catch (e) {
			document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function updateSystemVariableQuestion(varName, varInfo, varValueType, varValueSubType, varValueUnit, varValueMin, varValueMax, varValueName0, varValueName1, varValueList, varState) {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalUpdateSystemVariableTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalUpdateSystemVariableMessage", varName);
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalUpdateSystemVariableBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalUpdateSystemVariableBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `updateSystemVariable("` + varName + `", "` + varInfo + `", "` + varValueType + `", "` + varValueSubType + `", "` + varValueUnit + `", "` + varValueMin + `", "` + varValueMax + `", "` + varValueName0 + `", "` + varValueName1 + `", "` + varValueList + `", "` + varState + `")`);
	myModal.show();
}

async function updateSystemVariable(varName, varInfo, varValueType, varValueSubType, varValueUnit, varValueMin, varValueMax, varValueName0, varValueName1, varValueList, varState) {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/removeSystemVariable/${varName}`;
	await retrieveData("GET", url, 'application/json', undefined, "divDeprecatedSystemVariables", "strSystemVariableUnusedRemoving", undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				createSysVar(varName, varInfo, varValueType, varValueSubType, varValueUnit, varValueMin, varValueMax, varValueName0, varValueName1, varValueList, varState);
			} else {
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", objResp.reason));
			}
		} catch (e) {
			document.getElementById("divSystemVariablesHint").innerHTML = "";
			document.getElementById("divSystemVariables").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
			document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));

		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else {
				document.getElementById("divSystemVariablesHint").innerHTML = "";
				document.getElementById("divSystemVariables").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariablesHint").innerHTML = "";
				document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageSystemVariablesUnusedRemoveErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "removeSystemVariable"));
			}
		} catch (e) {
			document.getElementById("divDeprecatedSystemVariables").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

function selectedFile(filetype) {
	switch(filetype) {
		case "conf":
			if(document.getElementById("btnSelectConfigFile").value === undefined || document.getElementById("btnSelectConfigFile").value !== "") {
				if(document.getElementById("btnSelectConfigFile").files[0].size > 500000) {
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

function disableFileUpload() {
	document.getElementById("btnSelectConfigFile").value = "";
	document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
}

async function uploadFile(filetype) {
	var objResp, objErr, objFD;
	var url = `${location.protocol}//${location.hostname}:${port}/uploadConfig`;
	objFD = new FormData();
	objFD.append("file", document.getElementById("btnSelectConfigFile").files[0]);
	await retrieveData("POST", url, undefined, objFD, "resultUploadMessage", "strUploadConfigUploadingAndTesting", disableFileUpload, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true && objResp.serviceRestart == true) {
				document.getElementById("resultUploadMessage").innerHTML = "";
				window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
				return;
			} else {
				document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), translateMessages("messageUploadConfigErrorCommonMessage"), translateMessages("messageErrorPrintErrorMessage", objResp.reason));
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageUploadConfigFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageUploadConfigFailedMessage");
				toast.show();
				document.getElementById("btnSelectConfigFile").value = "";
				document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
			}
		} catch (e) {
			document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), "", translateMessages("messageErrorPrintErrorMessage", e));
			document.getElementById("btnSelectConfigFile").value = "";
			document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				document.getElementById("commonError").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageAbortLoadingHeader"), translateMessages("messageAbortLoadingText"));
			} else if(objErr.readyState != undefined && objErr.status != undefined) {
				document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), translateMessages("messageErrorAddonNotRunning"), translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "uploadFile"));
				document.getElementById("btnSelectConfigFile").value = "";
				document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
			} else {
				document.getElementById("resultUploadMessage").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageUploadConfigErrorHeader"), "", translateMessages("messageUploadConfigErrorFileToLargeMessage"));
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageUploadConfigFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageUploadConfigFailedMessage");
				toast.show();
				document.getElementById("btnSelectConfigFile").value = "";
				document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
			}
		} catch (e) {
			document.getElementById("loadApiSettingsError").innerHTML = createMessageContainer("alert alert-warning alert-dismissible fade show", translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorLoadingHeader"), translateMessages("messageErrorPrintErrorMessage", e));
		}
	});
}

async function removeInteractionsQuestion() {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalDeleteEventInteractionsTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalDeleteEventInteractionsMessage");
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalDeleteEventInteractionsBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalDeleteEventInteractionsBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `removeInteractions()`);
	myModal.show();
}

async function removeInteractions() {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/removeInteractions`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true && objResp.interactionsRemoved == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageSaveConfigOKHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageSaveConfigOKMessage");
				toast.show();
				return;
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveConfigFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveConfigFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveConfigFailedHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageSaveConfigFailedMessage");
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageSaveSettingsHeader");
				document.getElementById("toastFailedText").innerHTML = `${translateMessages("messageSaveSettingsFailedMessage")}<br>${translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState)}`;
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

function checkReconnectStation(stationId) {
	if(stationId == "0") {
		document.getElementById("btnReconnectStation").setAttribute("disabled", true);
	} else {
		document.getElementById("btnReconnectStation").removeAttribute("disabled");
	}
}

async function reconnectStation() {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/reconnect/${document.getElementById("cbReconnectStation").value}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("messageReconnectStationHeader");
				document.getElementById("toastOKText").innerHTML = translateMessages("messageReconnectStationOkMessage");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageReconnectStationHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageReconnectStationFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageReconnectStationHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageReconnectStationFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function removeTokenDataQuestion() {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalDeleteTokenTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalDeleteTokenMessage");
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalDeleteTokenBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalDeleteTokenBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `removeTokenData()`);
	myModal.show();}

async function removeTokenData() {
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}:${port}/removeTokenData`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true && objResp.dataRemoved == true) {
				/*const toast = new bootstrap.Toast(toastOK);
				document.getElementById("toastOKHeader").innerHTML = translateMessages("");
				document.getElementById("toastOKText").innerHTML = translateMessages("");
				toast.show();*/
				window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?redirect=settings.html`;
				return;
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageRemoveTokenFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageRemoveTokenFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageRemoveTokenFailedHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageRemoveTokenFailedMessage");
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageReconnectStationHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageReconnectStationFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

function openServiceManagerModal() {
	const myModal = new bootstrap.Modal(document.getElementById('modalServiceManager'));
	if(serviceState == "running") {
		document.getElementById("btnServiceManagerStartService").setAttribute("disabled", true);
		document.getElementById("btnServiceManagerStopService").removeAttribute("disabled");
	} else if(serviceState == "stopped") {
		document.getElementById("btnServiceManagerStartService").removeAttribute("disabled");
		document.getElementById("btnServiceManagerStopService").setAttribute("disabled", true);
	}
	myModal.show();
}

async function serviceManager(action) {
	var deleteLogfile = document.getElementById("chkDeleteLogfile").checked;
	var deleteErrfile = document.getElementById("chkDeleteErrfile").checked;
	var deleteClientLogfile = document.getElementById("chkDeleteClientLogfile").checked;
	if(action === "startService") {
		document.getElementById("btnServiceManagerStartService").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;` + document.getElementById("btnServiceManagerStartService").innerHTML;
	}
	if(action === "stopService") {
		document.getElementById("btnServiceManagerStopService").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;` + document.getElementById("btnServiceManagerStopService").innerHTML;
	}
	if(action === "restartService") {
		document.getElementById("btnServiceManagerRestartService").innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 1.25rem; height: 1.25rem;" role="status" aria-hidden="true"></span>&nbsp;` + document.getElementById("btnServiceManagerRestartService").innerHTML;
	}
	document.getElementById("chkDeleteLogfile").setAttribute("disabled", true);
	document.getElementById("chkDeleteErrfile").setAttribute("disabled", true);
	document.getElementById("chkDeleteClientLogfile").setAttribute("disabled", true);
	document.getElementById("btnServiceManagerStartService").setAttribute("disabled", true);
	document.getElementById("btnServiceManagerStopService").setAttribute("disabled", true);
	document.getElementById("btnServiceManagerRestartService").setAttribute("disabled", true);
	document.getElementById("modalServiceManagerBtnCancel").setAttribute("disabled", true);
	var objResp, objErr;
	var url = `${location.protocol}//${location.hostname}/addons/eufySecurity/serviceManager.cgi?action=${action}&deleteLogfile=${deleteLogfile}&deleteErrfile=${deleteErrfile}&deleteClientLogfile=${deleteClientLogfile}`;
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				if(action == "stopService") {
					window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/logfiles.html`;
				} else {
					window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/restartWaiter.html?action=${action}&redirect=logfiles.html`;
				}
				return;
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageStartFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageStartFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageStartFailedHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageStartFailedMessage");
				toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageReconnectStationHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageReconnectStationFailedMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageErrorLoadingHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

function enableButtons(enable) {
	if(enable == true) {
		document.getElementById("btnEnableTroubleShooting").setAttribute("onclick", "enableButtons(false)");
		document.getElementById("btnEnableTroubleShooting").setAttribute("class", "btn btn-warning btn-block");
		document.getElementById("btnEnableTroubleShooting").innerHTML = translateContent("lblSettingsTroubleShootingDisable");
		if(serviceState == "running") {
			document.getElementById("headerUploadConfig").removeAttribute("class");
			document.getElementById("btnDownloadConfigFile").removeAttribute("disabled");
			document.getElementById("btnSelectConfigFile").removeAttribute("disabled");
			document.getElementById("headerRemoveInteractions").removeAttribute("class");
			document.getElementById("btnRemoveInteractions").removeAttribute("disabled");
			document.getElementById("cbReconnectStation").removeAttribute("disabled");
			if(document.getElementById("cbReconnectStation").value != "0") {
				document.getElementById("btnReconnectStation").removeAttribute("disabled");
			}
			document.getElementById("headerDeleteTokenData").removeAttribute("class");
			document.getElementById("btnDeleteTokenData").removeAttribute("disabled");
		} else {
			document.getElementById("headerUploadConfig").setAttribute("class", "text-muted");
			document.getElementById("btnDownloadConfigFile").setAttribute("disabled", true);
			document.getElementById("btnSelectConfigFile").setAttribute("disabled", true);
			document.getElementById("btnUploadConfigFile").setAttribute("disabled", true);
			document.getElementById("headerRemoveInteractions").setAttribute("class", "text-muted");
			document.getElementById("btnRemoveInteractions").setAttribute("disabled", true);
			document.getElementById("cbReconnectStation").setAttribute("disabled", true);
			document.getElementById("btnReconnectStation").setAttribute("disabled", true);
			document.getElementById("headerDeleteTokenData").setAttribute("class", "text-muted");
			document.getElementById("btnDeleteTokenData").setAttribute("disabled", true);
		}
		document.getElementById("headerServiceManager").removeAttribute("class");
		document.getElementById("btnServiceManager").removeAttribute("disabled");
	} else {
		document.getElementById("btnEnableTroubleShooting").setAttribute("onclick", "enableButtons(true)");
		document.getElementById("btnEnableTroubleShooting").setAttribute("class", "btn btn-outline-warning btn-block");
		document.getElementById("btnEnableTroubleShooting").innerHTML = translateContent("lblSettingsTroubleShootingEnable");
		document.getElementById("btnSelectConfigFile").setAttribute("disabled", true);
		document.getElementById("headerRemoveInteractions").setAttribute("class", "text-muted");
		document.getElementById("btnRemoveInteractions").setAttribute("disabled", true);
		document.getElementById("cbReconnectStation").setAttribute("disabled", true);
		document.getElementById("btnReconnectStation").setAttribute("disabled", true);
		document.getElementById("headerDeleteTokenData").setAttribute("class", "text-muted");
		document.getElementById("btnDeleteTokenData").setAttribute("disabled", true);
		document.getElementById("headerServiceManager").setAttribute("disabled", true);
		document.getElementById("btnServiceManager").setAttribute("disabled", true);
	}
}

function changeValue(element) {
	switch(element.name) {
		case "useHttp":
			if(element.checked == true) {
				document.getElementById("txtPortHttp").removeAttribute("disabled");
			} else {
				if((element.checked == false) && (document.getElementById("chkUseHttps").checked == false)) {
					const myModal = new bootstrap.Modal(document.getElementById('modalAtLeastOneNeedsActivation'));
					document.getElementById("modalAtLeastOneNeedsActivationBtnOK").removeAttribute("onClick");
					document.getElementById("modalAtLeastOneNeedsActivationBtnOK").setAttribute("onClick", `checkCheckField("chkUseHttp")`);
					myModal.show();
				} else {
					document.getElementById("txtPortHttp").setAttribute("disabled", true);
				}
			}
			break;
		case "useHttps":
			if(element.checked == true) {
				document.getElementById("txtPortHttps").removeAttribute("disabled");
				document.getElementById("txtHttpsKeyFile").removeAttribute("disabled");
				document.getElementById("txtHttpsCertFile").removeAttribute("disabled");
			} else {
				if((element.checked == false) && (document.getElementById("chkUseHttp").checked == false)) {
					const myModal = new bootstrap.Modal(document.getElementById('modalAtLeastOneNeedsActivation'));
					document.getElementById("modalAtLeastOneNeedsActivationBtnOK").removeAttribute("onClick");
					document.getElementById("modalAtLeastOneNeedsActivationBtnOK").setAttribute("onClick", `checkCheckField("chkUseHttps")`);
					myModal.show();
				} else {
					document.getElementById("txtPortHttps").setAttribute("disabled", true);
					document.getElementById("txtHttpsKeyFile").setAttribute("disabled", true);
					document.getElementById("txtHttpsCertFile").setAttribute("disabled", true);
				}
			}
			break;
		case "useUdpStaticPorts":
			if(element.checked == true) {
				var element = document.getElementsByTagName("INPUT");
				var max = element.length;
				for(var i=0; i<max; i++) {
					if(element[i].name.startsWith("udpPortsStation")) {
						var tempSerial = element[i].name.replace("udpPortsStation", "");
						document.getElementById('txtUdpPortsStation' + tempSerial).removeAttribute("disabled");
					}
				}
			} else {
				var element = document.getElementsByTagName("INPUT");
				var max = element.length;
				for(var i=0; i<max; i++) {
					if(element[i].name.startsWith("udpPortsStation")) {
						var tempSerial = element[i].name.replace("udpPortsStation", "");
						document.getElementById('txtUdpPortsStation' + tempSerial).setAttribute("disabled", true);
					}
				}
			}
			break;
		case "useUpdateStateIntervall":
			if(element.checked == true) {
				if(document.getElementById("chkUpdateStateEvent").checked == true) {
					const myModal = new bootstrap.Modal(document.getElementById('modalStateEventOrIntervall'));
					document.getElementById("modalStateEventOrIntervallBtnOK").removeAttribute("onClick");
					document.getElementById("modalStateEventOrIntervallBtnOK").setAttribute("onClick", `uncheckCheckField("chkUpdateStateEvent")`);
					myModal.show();
				}
				document.getElementById("txtUpdateStateIntervallTimespan").removeAttribute("disabled");
			} else {
				document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
			}
			break;
		case "useUpdateStateEvent":
			if(element.checked == true) {
				if(document.getElementById("chkUpdateStateIntervall").checked == true) {
					const myModal = new bootstrap.Modal(document.getElementById('modalStateEventOrIntervall'));
					document.getElementById("modalStateEventOrIntervallBtnOK").removeAttribute("onClick");
					document.getElementById("modalStateEventOrIntervallBtnOK").setAttribute("onClick", `uncheckCheckField("chkUpdateStateIntervall")`);
					myModal.show();
				}
				document.getElementById("txtUpdateStateIntervallTimespan").setAttribute("disabled", true);
			} else {

			}
			break;
	}
}

function checkLogLevel(elementName, value) {
	if(value == "0" || value == "1") {
		document.getElementById(elementName).setAttribute("class", "alert alert-warning alert-dismissible fade show");
		document.getElementById(elementName).setAttribute("role", "alert");
		if(value == "0") {
			document.getElementById(elementName).innerHTML = `${translateContent("lblLogLevelToHighTraceMessage")}<br />`;
		} else if(value == "1") {
			document.getElementById(elementName).innerHTML = `${translateContent("lblLogLevelToHighDebugMessage")}<br />`;
		}
		document.getElementById(elementName).innerHTML += `<small class="form-text text-muted">${translateContent("lblLogLevelToHighSubText")}</small>`;
	} else {
		document.getElementById(elementName).removeAttribute("class");
		document.getElementById(elementName).removeAttribute("role");
		document.getElementById(elementName).innerHTML = "";
	}
}

function checkUDPPorts(elementName) {
	var element = document.getElementsByTagName("INPUT");
	var cnt = 0;
	var error = false;
	var errorMessage = "";
	var regex = new RegExp("^(1|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$");
	var max = element.length;
	for(var i=0; i<max; i++) {
		if(element[i].name.startsWith("udpPortsStation")) {
			cnt = cnt + 1;
		}
	}
	if(elementName.value == "") {
		return;
	}
	if(!regex.test(elementName.value)) {
		error = true;
		errorMessage = `${translateMessages("messageUdpPortNoNumberMessage")}<br /><br />${translateMessages("messageUdpPortInputRemoveMessage")}`;
	}
	if(error == false && cnt > 1) {
		max = element.length;
		for(var i=0; i<max; i++) {
			if(element[i].name.startsWith("udpPortsStation")) {
				var eName = 'txtUdpPortsStation' + element[i].name.replace("udpPortsStation", "");
				if(eName != elementName.id) {
					if(document.getElementById('txtUdpPortsStation' + element[i].name.replace("udpPortsStation", "")).value == elementName.value) {
						error = true;
						errorMessage = `${translateMessages("messageUdpPortPortAlreadyUsedMessage")}<br /><br />${translateMessages("messageUdpPortInputRemoveMessage")}`;
						break;
					}
				}
			}
		}
	}
	if(error == true) {
		const myModal = new bootstrap.Modal(document.getElementById('modalUDPPortsEqualWrong'));
		document.getElementById("modalUDPPortsEqualWrongBtnOK").removeAttribute("onClick");
		document.getElementById("modalUDPPortsEqualWrongBtnOK").setAttribute("onClick", `clearInputField("` + elementName.id + `")`);
		document.getElementById("modalUDPPortsEqualWrongMessage").innerHTML = errorMessage;
		myModal.show();
	}
}

function checkCheckField(elementName) {
	document.getElementById(elementName).checked = true;
}

function uncheckCheckField(elementName) {
	document.getElementById(elementName).checked = false;
}

function clearInputField(elementName) {
	document.getElementById(elementName).value = "";
}
//#endregion

/**
 * Scripts for logfiles.html
 */
//#region logfiles.html
function initLogViewer(logfiletype, showLoading) {
	codeMirrorEditor = CodeMirror(document.getElementById("logContent"), {
		lineNumbers: false,
		//mode: "logfile",
		theme: "neo",
		lineWrapping: false,
		readOnly: true
	});
	loadLogfile(logfiletype, showLoading);
}

function waitLogFile() {
	document.getElementById("logHandlingInfo").style.display = 'block';
	document.getElementById("logHandlingInfo").innerHTML = createWaitMessage(translateString("strLoadingLogFile"));
}

async function loadLogfile(logfiletype, showLoading) {
	var objResp, objErr, url;
	var waitFunction = undefined;
	if(showLoading == true) {
		waitFunction = waitLogFile;
	}
	document.getElementById("logContent").style.display = 'none';
	codeMirrorEditor.setValue("");
	switch(logfiletype) {
		case "log":
			url=`logfiles.cgi?action=getcontent&file=${logfiletype}`;
			document.getElementById("tabHeaderAddonLog").classList.add("active");
			document.getElementById("tabHeaderAddonErr").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.remove("active");
			document.getElementById("tabHeaderInstallLog").classList.remove("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '<text class="font-monospace fs-6 fw-medium">/var/log/eufySecurity.log</text>'`;
			document.getElementById("btnReloadLogfileData").setAttribute("onclick","loadLogfile('log', true)");
			document.getElementById("btnDeleteLogfileData").setAttribute("onclick","emptyLogfileQuestion('log', '/var/log/eufySecurity.log')");
			document.getElementById("btnDownloadLogfile").setAttribute("onclick","downloadFile('log')");
			break;
		case "err":
			url=`logfiles.cgi?action=getcontent&file=${logfiletype}`;
			document.getElementById("tabHeaderAddonLog").classList.remove("active");
			document.getElementById("tabHeaderAddonErr").classList.add("active");
			document.getElementById("tabHeaderClientLog").classList.remove("active");
			document.getElementById("tabHeaderInstallLog").classList.remove("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '<text class="font-monospace fs-6 fw-medium"><div-tab-code>/var/log/eufySecurity.err</div-tab-code></text>'`;
			document.getElementById("btnReloadLogfileData").setAttribute("onclick","loadLogfile('err', true)");
			document.getElementById("btnDeleteLogfileData").setAttribute("onclick","emptyLogfileQuestion('err', '/var/log/eufySecurity.err')");
			document.getElementById("btnDownloadLogfile").setAttribute("onclick","downloadFile('err')");
			break;
		case "clientLog":
			url=`logfiles.cgi?action=getcontent&file=${logfiletype}`;
			document.getElementById("tabHeaderAddonLog").classList.remove("active");
			document.getElementById("tabHeaderAddonErr").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.add("active");
			document.getElementById("tabHeaderInstallLog").classList.remove("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '<text class="font-monospace fs-6 fw-medium">/var/log/eufySecurityClient.log</text>'`;
			document.getElementById("btnReloadLogfileData").setAttribute("onclick","loadLogfile('clientLog', true)");
			document.getElementById("btnDeleteLogfileData").setAttribute("onclick","emptyLogfileQuestion('clientLog', '/var/log/eufySecurityClient.log')");
			document.getElementById("btnDownloadLogfile").setAttribute("onclick","downloadFile('clientLog')");
			break;
		case "installLog":
			url=`logfiles.cgi?action=getcontent&file=${logfiletype}`;
			document.getElementById("tabHeaderAddonLog").classList.remove("active");
			document.getElementById("tabHeaderAddonErr").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.remove("active");
			document.getElementById("tabHeaderInstallLog").classList.add("active");
			document.getElementById("txtLogfileLocation").innerHTML = `${translateStaticContentElement('txtLogfileLocation')} '<text class="font-monospace fs-6 fw-medium">/usr/local/addons/eufySecurity/install.log</text>'`;
			document.getElementById("btnReloadLogfileData").setAttribute("onclick","loadLogfile('clientLog', true)");
			document.getElementById("btnDeleteLogfileData").setAttribute("onclick","emptyLogfileQuestion('installLog', '/usr/local/addons/eufySecurity/install.log')");
			document.getElementById("btnDownloadLogfile").setAttribute("onclick","downloadFile('installLog')");
			break;
		default:
			document.getElementById("tabHeaderAddonLog").classList.remove("active");
			document.getElementById("tabHeaderAddonErr").classList.remove("active");
			document.getElementById("tabHeaderClientLog").classList.remove("active");
			document.getElementById("tabHeaderInstallLog").classList.remove("active");
			document.getElementById("btnReloadLogfileData").setAttribute("disabled", true);
			document.getElementById("btnDeleteLogfileData").setAttribute("disabled", true);
			document.getElementById("btnDownloadLogfile").setAttribute("disabled", true);
			document.getElementById("txtLogfileLocation").innerHTML = translateStaticContentElement('txtLogfileUnknown');
			document.getElementById("logHandlingInfo").innerHTML = createMessageContainer("alert alert-danger m-0", translateMessages("messageLoadLogFileErrorHeader"), translateMessages("messageErrorLogfileUnknown", logfiletype), "");
			return;
	}
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, waitFunction, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success === true) {
				if(objResp.hasData === true) {
					document.getElementById("logHandlingInfo").style.display = 'none';
					document.getElementById("logContent").style.display = 'block';
					codeMirrorEditor.setValue(decodeURIComponent(objResp.data).slice(0,-1));
					document.getElementById("btnReloadLogfileData").removeAttribute("disabled");
					document.getElementById("btnDeleteLogfileData").removeAttribute("disabled");
					document.getElementById("btnDownloadLogfile").removeAttribute("disabled");
				} else {
					document.getElementById("logHandlingInfo").style.display = 'block';
					switch(logfiletype) {
						case "log":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsEmpty", '/var/log/eufySecurity.log')}</code>`;
							break;
						case "err":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsEmpty", '/var/log/eufySecurity.err')}</code>`;
							break;
						case "clientLog":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsEmpty", '/var/log/eufySecurityClient.log')}</code>`;
							break;
						case "installLog":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsEmpty", '/usr/local/addons/eufySecurity/install.log')}</code>`;
							break;
					}
					document.getElementById("btnReloadLogfileData").setAttribute("disabled", true);
					document.getElementById("btnDeleteLogfileData").setAttribute("disabled", true);
					document.getElementById("btnDownloadLogfile").setAttribute("disabled", true);
				}
			} else {
				if (objResp.reason === "The file does not exists.") {
					document.getElementById("logHandlingInfo").style.display = 'block';
					switch(logfiletype) {
						case "log":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsNotAvailable", '/var/log/eufySecurity.log')}</code>`;
							break;
						case "err":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsNotAvailable", '/var/log/eufySecurity.err')}</code>`;
							break;
						case "clientLog":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsNotAvailable", '/var/log/eufySecurityClient.log')}</code>`;
							break;
						case "installLog":
							document.getElementById("logHandlingInfo").innerHTML = `<code>${translateContent("lblFileIsNotAvailable", '/usr/local/addons/eufySecurity/install.log')}</code>`;
							break;
					}
				} else {
					document.getElementById("logHandlingInfo").style.display = 'none';
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadLogFileErrorHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageLoadLogFileErrorMessage");
					toast.show();
				}
			}
		} catch (e) {
			document.getElementById("logHandlingInfo").style.display = 'none';
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadLogFileErrorHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadLogFileErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadLogfile");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadLogFileErrorHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}

async function emptyLogfileQuestion(logfiletype, filePathAndName) {
	const myModal = new bootstrap.Modal(document.getElementById('modalQuestionYesNo'));
	document.getElementById("lblModalQuestionYesNoTitle").innerHTML = translateStaticContentElement("lblModalEmptyLogfileTitle");
	document.getElementById("modalQuestionYesNoMessage").innerHTML = translateMessages("modalEmptyLogfileMessage", filePathAndName);
    document.getElementById("modalQuestionYesNoBtnNo").innerHTML = translateStaticContentElement("modalEmptyLogfileBtnNo");
    document.getElementById("modalQuestionYesNoBtnYes").innerHTML = translateStaticContentElement("modalEmptyLogfileBtnYes");
	document.getElementById("modalQuestionYesNoBtnYes").setAttribute("onclick", `emptyLogfile("` + logfiletype + `")`);
	myModal.show();
}

async function emptyLogfile(logfiletype) {
	var objResp, objErr, url;
	switch(logfiletype) {
		case "log":
			url = `logfiles.cgi?action=emptyfile&file=${logfiletype}`;
			break;
		case "err":
			url = `logfiles.cgi?action=emptyfile&file=${logfiletype}`;
			break;
		case "clientLog":
			url = `logfiles.cgi?action=emptyfile&file=${logfiletype}`;
			break;
		case "installLog":
			url = `logfiles.cgi?action=emptyfile&file=${logfiletype}`;
			break;
		default:
			document.getElementById("log").innerHTML = createMessageContainer("alert alert-danger m-0", translateMessages("messageEmptyLogFileErrorHeader"), translateMessages("messageErrorLogfileUnknown", logfiletype), "");
			return;
	}
	await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
		try {
			objResp = JSON.parse(result);
			if(objResp.success == true) {
				loadLogfile(logfiletype, true);
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageEmptyLogFileErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageEmptyLogFileErrorMessage");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageEmptyLogFileErrorHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	}).catch((err) => {
		try {
			objErr = err;
			if(objErr.cause == "ABORT") {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
				toast.show();
			} else {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageEmptyLogFileErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadLogfile");
				toast.show();
			}
		} catch (e) {
			const toast = new bootstrap.Toast(toastFailed);
			document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageEmptyLogFileErrorHeader");
			document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
			toast.show();
		}
	});
}
//#endregion

/**
 * Scripts for info.html
 */
//#region info.html
async function loadDataInfo(showLoading) {
	var waitElementId = undefined, waitMessage = undefined;
	if(showLoading == true) {
		waitElementId = "versionInfo";
		waitMessage = "strLoadingVersionInfo";
	}
	if(serviceState == "running") {
		var objResp, objErr, info = "";
		var url = `${location.protocol}//${location.hostname}:${port}/getApiInfo`;
		await retrieveData("GET", url, 'application/json', undefined, waitElementId, waitMessage, undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					info = `${translateString("strAddOnName")}: ${objResp.apiVersion}<br />${translateString("strClientName")}: ${objResp.eufySecurityClientVersion}<br />${translateString("strHomeMaticApi")}: ${objResp.homematicApiVersion}<br />${translateString("strWebsite")}: ${version}<br />${getLanguageInfo()}`;
					document.getElementById("versionInfo").innerHTML = info;
				} else {
					document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageLoadVersionInfoErrorHeader"), "", "");
				}
			} catch (e) {
				document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageLoadVersionInfoErrorHeader"), "", "");
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadVersionInfoErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
				toast.show();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
					toast.show();
				} else {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadVersionInfoErrorHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadLogfile");
					toast.show();
				}
			} catch (e) {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadVersionInfoErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
				toast.show();
			}
		});
	} else {
		var objResp, objErr, info = "";
		var url = `${location.protocol}//${location.hostname}/addons/eufySecurity/serviceManager.cgi?action=getServiceVersion`;
		await retrieveData("GET", url, 'application/json', undefined, undefined, undefined, undefined, undefined).then((result) => {
			try {
				objResp = JSON.parse(result);
				if(objResp.success == true) {
					info = `${translateString("strAddOnName")}: ${objResp.version}<br />${translateString("strWebsite")}: ${version}<br />${getLanguageInfo()}`;
					document.getElementById("versionInfo").innerHTML = info;
				} else {
					document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageLoadVersionInfoErrorHeader"), "", "");
				}
			} catch (e) {
				document.getElementById("versionInfo").innerHTML = createMessageContainer("alert alert-danger", translateMessages("messageLoadVersionInfoErrorHeader"), "", "");
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadVersionInfoErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
				toast.show();
			}
		}).catch((err) => {
			try {
				objErr = err;
				if(objErr.cause == "ABORT") {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageAbortLoadingHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageAbortLoadingText");
					toast.show();
				} else {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadVersionInfoErrorHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorStatusAndReadyState", objErr.status, objErr.readyState, "loadLogfile");
					toast.show();
				}
			} catch (e) {
				const toast = new bootstrap.Toast(toastFailed);
				document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageLoadVersionInfoErrorHeader");
				document.getElementById("toastFailedText").innerHTML = translateMessages("messageErrorPrintErrorMessage", e);
				toast.show();
			}
		});
	}
}
//#endregion

/**
 * Scripts for restartWaiter.html
 */
//#region restartWaiter.html
async function restartAPIService() {
	if(action == "captcha") {
		document.getElementById("headerApiSettingsError").innerHTML = translateContent("lblHeaderApiSettingsErrorCaptcha");
		document.getElementById("messageApiSettingsError").innerHTML = translateContent("lblMessageApiSettingsErrorCaptcha");
		checkServiceState(0, 0, 0);
	} else if(action == "tfa") {
		document.getElementById("headerApiSettingsError").innerHTML = translateContent("lblHeaderApiSettingsErrorTfa");
		document.getElementById("messageApiSettingsError").innerHTML = translateContent("lblMessageApiSettingsErrorTfa");
		checkServiceState(0, 0, 0);
	} else {
		document.getElementById("headerApiSettingsError").innerHTML = translateContent("lblHeaderApiSettingsError");
		document.getElementById("messageApiSettingsError").innerHTML = translateContent("lblMessageApiSettingsError");
		const toast = new bootstrap.Toast(toastOK);
		document.getElementById("toastOKHeader").innerHTML = translateMessages("messageStartOKHeader");
		document.getElementById("toastOKText").innerHTML = translateMessages("messageStartOKMessage");
		toast.show();
		await delay(7500);
		checkServiceState(0, 0, 0);
	}
}

async function checkServiceState(cntStart, cntInit, postInit) {
	var xmlHttp, objResp;
	var url = `${location.protocol}//${location.hostname}:${port}/getServiceState`;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.overrideMimeType('application/json');
	xmlHttp.onreadystatechange = async function() {
		if(this.readyState == 4 && this.status == 200) {
			try {
				objResp = JSON.parse(this.responseText);
				if(objResp.success == true) {
					if(objResp.message == "init") {
						if(cntInit == 0) {
							var startDone = "";
							if(action == "captcha") {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							} else {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha") {
								initStart = `<div class="spinner-border mt-4 mb-2 float-center text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileLogin")}</div>`;
							} else {
								initStart = `<div class="spinner-border mt-4 mb-2 float-center text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileInit")}</div>`;
							}
							document.getElementById("serviceInit").innerHTML = initStart;
						}
						if(cntInit < 20) {
							cntInit = cntInit + 1;
							await delay(1000);
							checkServiceState(cntStart, cntInit, postInit);
						} else {
							const toast = new bootstrap.Toast(toastFailed);
							document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageRestartWaitErrorHeader");
							document.getElementById("toastFailedText").innerHTML = translateMessages("messageRestartWaitHeaderMessage", objResp.message);
							toast.show();
						}
					} else if(objResp.message == "ok") {
						if(cntInit == 0 && postInit == 0) {
							var startDone = "";
							if(action == "captcha") {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							} else {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha") {
								initStart = `<div class="spinner-border mt-4 mb-2 float-center text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileLogin")}</div>`;
							} else {
								initStart = `<div class="spinner-border mt-4 mb-2 float-center text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileInit")}</div>`;
							}
							document.getElementById("serviceInit").innerHTML = initStart;
						}
						if(postInit < 5) {
							postInit = postInit + 1;
							await delay(1000);
							checkServiceState(cntStart, cntInit, postInit);
						} else {
							var startDone = "";
							if(action == "captcha") {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							} else {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initDone = "";
							if(action == "captcha") {
								initDone = `<i class="bi-check-circle fs-2 mt-4 mb-2 float-center text-success" title="Einstellungen"></i><div class="fw-bold">${translateString("strLoginFinished")}</div>`;
							} else {
								initDone = `<i class="bi-check-circle fs-2 mt-4 mb-2 float-center text-success" title="Einstellungen"></i><div class="fw-bold">${translateString("strInitFinished")}</div>`;
							}
							document.getElementById("serviceInit").innerHTML = initDone;
							await delay(5000);
							window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/` + redirectTarget;
						}
					} else if(objResp.message == "configNeeded") {
						if(cntInit == 0 && postInit == 0) {
							var startDone = "";
							if(action == "captcha") {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							} else {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initStart = "";
							if(action == "captcha") {
								initStart = `<div class="spinner-border mt-4 mb-2 float-center text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileLogin")}</div>`;
							} else {
								initStart = `<div class="spinner-border mt-4 mb-2 float-center text-info" role="status" aria-hidden="true"></div><div class="fw-bold">${translateString("strWaitWhileInit")}</div>`;
							}
							document.getElementById("serviceInit").innerHTML = initStart;
						}
						if(postInit < 5) {
							postInit = postInit + 1;
							await delay(1000);
							checkServiceState(cntStart, cntInit, postInit);
						} else {
							var startDone = "";
							if(action == "captcha") {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceRunning")}"></i><div class="fw-bold">${translateString("strServiceRunning")}</div>`;
							} else {
								startDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="${translateString("strServiceStarted")}"></i><div class="fw-bold">${translateString("strServiceStarted")}</div>`;
							}
							document.getElementById("serviceRestart").innerHTML = startDone;
							var initDone = "";
							if(action == "captcha") {
								initDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="Einstellungen"></i><div class="fw-bold">${translateString("strLoginFinished")}</div>`;
							} else {
								initDone = `<i class="bi-check-circle fs-2 my-2 float-center text-success" title="Einstellungen"></i><div class="fw-bold">${translateString("strInitFinished")}</div>`;
							}
							document.getElementById("serviceInit").innerHTML = initDone;
							await delay(5000);
							window.location.href = `${location.protocol}//${location.hostname}/addons/eufySecurity/` + redirectTarget;
						}
					} else if(objResp.message == "shutdown") {
						cntStart = 0;
						cntInit = 0;
						postInit = 0;
						await delay(5000);
						checkServiceState(cntStart, cntInit, postInit);
					} else {
						if(cntStart < 20) {
							cntStart = cntStart + 1;
							await delay(1000);
							checkServiceState(cntStart, cntInit, postInit);
						} else {
							const toast = new bootstrap.Toast(toastFailed);
							document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageRestartWaitErrorHeader");
							document.getElementById("toastFailedText").innerHTML = translateMessages("messageRestartWaitHeaderMessage", objResp.message);
							toast.show();
						}
					}
				} else {
					if(cntStart < 20) {
						cntStart = cntStart + 1;
						await delay(1000);
						checkServiceState(cntStart, cntInit, postInit);
					} else {
						const toast = new bootstrap.Toast(toastFailed);
						document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageRestartWaitErrorHeader");
						document.getElementById("toastFailedText").innerHTML = translateMessages("messageRestartWaitHeaderMessage", objResp.message);
						toast.show();
					}
				}
			} catch (e) {
				if(cntStart < 20) {
					cntStart = cntStart + 1;
					await delay(1000);
					checkServiceState(cntStart, cntInit, postInit);
				} else {
					const toast = new bootstrap.Toast(toastFailed);
					document.getElementById("toastFailedHeader").innerHTML = translateMessages("messageRestartWaitErrorHeader");
					document.getElementById("toastFailedText").innerHTML = translateMessages("messageRestartWaitHeaderErrorMessage", e.message);
					toast.show();
				}
			}
		} else if(this.readyState == 4) {
			if(cntStart < 20) {
				cntStart = cntStart + 1;
				await delay(2000);
				checkServiceState(cntStart, cntInit, postInit);
			}
		} else {}
	};
	xmlHttp.open("GET", url, true);
	xmlHttp.send();
}

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}
//#endregion