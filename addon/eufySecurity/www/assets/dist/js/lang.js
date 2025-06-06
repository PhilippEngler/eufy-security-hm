const supportedLanguages = ["de","en"];

function getLanguageInfo()
{
    return `${translateString("strLanguageFile")}: ${languageDesc} (${language} - ${translateString("strVersion")}: ${languageVersion})`;
}
function getLanguage()
{
    var lang = "en";
    var urlParams = new URLSearchParams(window.location.search);
    if(getParameterFromURLSearchParams(urlParams, "lang"))
	{
		lang = urlParams.get(lang);
	}
    else
    {
        lang = navigator.language.slice(0,2);
    }
    if(supportedLanguages.includes(lang))
    {
        document.documentElement.setAttribute('lang',lang);
        return lang;
    }
    else
    {
        document.documentElement.setAttribute('lang',"en");
        return "en";
    }
}

function translateNavbar()
{
    document.getElementById("niMain").innerHTML = translateNavbarElement("niMain");
    document.getElementById("niHome").innerHTML = translateNavbarElement("niHome");
    document.getElementById("niDevices").innerHTML = translateNavbarElement("niDevices");
    document.getElementById("niStateChange").innerHTML = translateNavbarElement("niStateChange");
    document.getElementById("niSettings").innerHTML = translateNavbarElement("niSettings");
    document.getElementById("niLogfiles").innerHTML = translateNavbarElement("niLogfiles");
    document.getElementById("niInfo").innerHTML = translateNavbarElement("niInfo");
}

function translateStaticPageContent(page)
{
    switch(page)
    {
        case "index":
            translateInnerHtml("divIndexJumbotronAddonHeader");
            translateInnerHtml("divIndexJumbotronAddonInfo");
            translateInnerHtml("divIndexDescription01");
            translateInnerHtml("divIndexDescription02");
            break;
        case "devices":
            translateInnerHtml("divDevicesIntroHeader");
            translateInnerHtml("divDevicesIntroMessage");
            break;
        case "statechange":
            translateInnerHtml("divStateChangeIntroHeader");
            translateInnerHtml("divStateChangeIntroMessage");
            translateInnerHtml("divStateChangeAllStationsHeader");
            translateInnerHtml("divStateChangeAllStationsDesc");
            document.getElementById("btnAwayAll").innerHTML = translateGuardMode(0);
            document.getElementById("btnHomeAll").innerHTML = translateGuardMode(1);
            document.getElementById("btnScheduleAll").innerHTML = translateGuardMode(2);
            document.getElementById("btnDisarmedAll").innerHTML = translateGuardMode(63);
            translateInnerHtml("toastOkHeader");
            translateInnerHtml("toastOkText");
            translateInnerHtml("toastFailedHeader");
            translateInnerHtml("toastFailedText");
            break;
        case "settings":
            translateInnerHtml("settingsIntroHeader");
            translateInnerHtmlByReplace("settingsCardHeaderEufySecurityAccountData");
            translateInnerHtml("settingsHeaderAccountData");
            translateInnerHtml("settingsAccountDataHintHeader");
            translateInnerHtml("settingsAccountDataHintMessage");
            translateInnerHtml("settingsAccountDataHintSubText");
            translateInnerHtml("lblUsername");
            translatePlaceholer("txtUsername");
            translateInnerHtml("hintUsername");
            translateInnerHtml("divUsernameError");
            translateInnerHtml("lblPassword");
            translatePlaceholer("txtPassword");
            translateInnerHtml("hintPassword");
            translateInnerHtml("divPasswordError");
            translateInnerHtml("settingsHeaderAccountMoreSettings");
            translateInnerHtml("lblCountry");
            translateInnerHtml("optPleaseSelectCountry");
            translateInnerHtml("hintCountry");
            translateInnerHtml("lblLanguage");
            translateInnerHtml("optPleaseSelectLanguage");
            translateInnerHtml("hintLanguage");
            translateInnerHtml("lblTrustedDeviceName");
            translatePlaceholer("txtTrustedDeviceName");
            translateInnerHtml("btnGenerateNewTrustedDeviceName");
            translateInnerHtml("hintTrustedDeviceName");
            translateInnerHtml("divTrustedDeviceNameError");
            translateInnerHtmlByReplace("settingsCardHeaderEufySecurityConfig");
            translateInnerHtml("settingsHeaderConfigHttpSettings");
            translateInnerHtml("lblUseHttp");
            translateInnerHtml("lblPortHttp");
            translatePlaceholer("txtPortHttp");
            translateInnerHtml("hintPortHttp");
            translateInnerHtml("divPortHttpError");
            translateInnerHtml("settingsHeaderConfigHttpsSettings");
            translateInnerHtml("lblUseHttps");
            translateInnerHtml("lblPortHttps");
            translatePlaceholer("txtPortHttps");
            translateInnerHtml("hintPortHttps");
            translateInnerHtml("divPortHttpsError");
            translateInnerHtml("lblHttpsKeyFile");
            translatePlaceholer("txtHttpsKeyFile");
            translateInnerHtml("hintHttpsKeyFile");
            translateInnerHtml("lblHttpsCertFile");
            translatePlaceholer("txtHttpsCertFile");
            translateInnerHtml("hintHttpsCertFile");
            translateInnerHtml("settingsHeaderConfigHouseAdministration");
            translateInnerHtml("lblAcceptInvitations");
            translateInnerHtml("lblHouseSelection");
            translateInnerHtml("optPleaseSelectHouse");
            translateInnerHtml("optAllStationsDevices");
            translateInnerHtml("hintHouseSelection");
            translateInnerHtml("settingsHeaderConfigConnectionToStationSettings");
            translateInnerHtml("lblConnectionType");
            translateInnerHtml("optPleaseSelectConnectionType");
            translateInnerHtml("optConnectionTypeLocal");
            translateInnerHtml("optConnectionTypeFastest");
            translateInnerHtml("hintConnectionType");
            translateInnerHtml("lblUseUdpStaticPorts");
            translateInnerHtml("settingsHeaderConfigUpdateSystemVariables");
            translateInnerHtml("lblUseSystemVariables");
            translateInnerHtml("settingsHeaderConfigUpdateState");
            translateInnerHtml("lblUpdateStateEvent");
            translateInnerHtml("lblUpdateStateIntervall");
            translateInnerHtml("lblUpdateStateIntervallTimespan");
            translatePlaceholer("txtUpdateStateIntervallTimespan");
            translateInnerHtml("hintStateIntervallTimespan");
            translateInnerHtml("divStateIntervallError");
            translateInnerHtml("settingsHeaderConfigPushService");
            translateInnerHtml("lblUsePushService");
            translateInnerHtml("hintUsePushService");
            translateInnerHtml("settingsHeaderConfigSecureApiAccessSid");
            translateInnerHtml("lblUseSecureApiAccessSid");
            translateInnerHtml("hintUseSecureApiAccessSid");
            translateInnerHtml("settingsHeaderConfigLogLevel");
            translateInnerHtml("lblLogLevelAddon");
            translateInnerHtml("lblLogLevelMain");
            translateInnerHtml("lblLogLevelHttp");
            translateInnerHtml("lblLogLevelP2p");
            translateInnerHtml("lblLogLevelPush");
            translateInnerHtml("lblLogLevelMqtt");
            translateInnerHtml("optPleaseSelectLogLevelAddon");
            translateInnerHtml("optPleaseSelectLogLevelMain");
            translateInnerHtml("optPleaseSelectLogLevelHttp");
            translateInnerHtml("optPleaseSelectLogLevelP2p");
            translateInnerHtml("optPleaseSelectLogLevelPush");
            translateInnerHtml("optPleaseSelectLogLevelMqtt");
            translateInnerHtml("optLogLevelAddon0");
            translateInnerHtml("optLogLevelAddon1");
            translateInnerHtml("optLogLevelAddon2");
            translateInnerHtml("optLogLevelAddon3");
            translateInnerHtml("optLogLevelAddon4");
            translateInnerHtml("optLogLevelAddon5");
            translateInnerHtml("optLogLevelAddon6");
            translateInnerHtml("optLogLevelMain0");
            translateInnerHtml("optLogLevelMain1");
            translateInnerHtml("optLogLevelMain2");
            translateInnerHtml("optLogLevelMain3");
            translateInnerHtml("optLogLevelMain4");
            translateInnerHtml("optLogLevelMain5");
            translateInnerHtml("optLogLevelMain6");
            translateInnerHtml("optLogLevelHttp0");
            translateInnerHtml("optLogLevelHttp1");
            translateInnerHtml("optLogLevelHttp2");
            translateInnerHtml("optLogLevelHttp3");
            translateInnerHtml("optLogLevelHttp4");
            translateInnerHtml("optLogLevelHttp5");
            translateInnerHtml("optLogLevelHttp6");
            translateInnerHtml("optLogLevelP2p0");
            translateInnerHtml("optLogLevelP2p1");
            translateInnerHtml("optLogLevelP2p2");
            translateInnerHtml("optLogLevelP2p3");
            translateInnerHtml("optLogLevelP2p4");
            translateInnerHtml("optLogLevelP2p5");
            translateInnerHtml("optLogLevelP2p6");
            translateInnerHtml("optLogLevelPush0");
            translateInnerHtml("optLogLevelPush1");
            translateInnerHtml("optLogLevelPush2");
            translateInnerHtml("optLogLevelPush3");
            translateInnerHtml("optLogLevelPush4");
            translateInnerHtml("optLogLevelPush5");
            translateInnerHtml("optLogLevelPush6");
            translateInnerHtml("optLogLevelMqtt0");
            translateInnerHtml("optLogLevelMqtt1");
            translateInnerHtml("optLogLevelMqtt2");
            translateInnerHtml("optLogLevelMqtt3");
            translateInnerHtml("optLogLevelMqtt4");
            translateInnerHtml("optLogLevelMqtt5");
            translateInnerHtml("optLogLevelMqtt6");
            translateInnerHtml("hintLogLevelAddon");
            translateInnerHtml("hintLogLevelMain");
            translateInnerHtml("hintLogLevelHttp");
            translateInnerHtml("hintLogLevelP2p");
            translateInnerHtml("hintLogLevelPush");
            translateInnerHtml("hintLogLevelMqtt");
            /*translateInnerHtml("divLogLevelAddonError");
            translateInnerHtml("divLogLevelMainError");
            translateInnerHtml("divLogLevelHttpError");
            translateInnerHtml("divLogLevelP2pError");
            translateInnerHtml("divLogLevelPushError");
            translateInnerHtml("divLogLevelMqttError");*/
            translateInnerHtml("btnSave");
            translateInnerHtmlByReplace("settingsCardHeaderSystemvariables");
            translateInnerHtmlByReplace("settingsCardHeaderErrorHandling");
            translateInnerHtml("btnEnableTroubleShooting");
            translateInnerHtml("settingsHintHeaderErrorHandling");
            translateInnerHtml("settingsHintMessageErrorHandling");
            translateInnerHtml("settingsHintSubTextErrorHandling");
            translateInnerHtml("headerSaveConfig");
            translateInnerHtml("hintSaveConfig");
            translateInnerHtml("btnDownloadConfigFile");
            translateInnerHtml("headerUploadConfig");
            translateInnerHtml("hintUploadConfig");
            translateInnerHtml("btnUploadConfigFile");
            translateInnerHtml("optPleaseSelectReconnectStation");
            translateInnerHtml("headerDeleteTokenData");
            translateInnerHtml("hintDeleteToken");
            translateInnerHtml("btnDeleteTokenData");
            translateInnerHtml("headerServiceManager");
            translateInnerHtml("hintServiceManager");
            translateInnerHtml("btnServiceManager");
            translateInnerHtml("lblModalServiceManagerTitle");
            translateInnerHtml("modalServiceManagerMessage");
            translateInnerHtml("lblDeleteLogfile");
            translateInnerHtml("lblDeleteErrfile");
            translateInnerHtml("lblDeleteClientLogfile");
            translateInnerHtml("btnServiceManagerStartService");
            translateInnerHtml("btnServiceManagerStopService");
            translateInnerHtml("btnServiceManagerRestartService");
            translateInnerHtml("modalServiceManagerBtnCancel");
            translateInnerHtml("headerRemoveInteractions");
            translateInnerHtml("hintRemoveInteractions");
            translateInnerHtml("btnRemoveInteractions");
            translateInnerHtml("headerReconnectStation");
            translateInnerHtml("hintReconnectStation");
            translateInnerHtml("btnReconnectStation");
            translateInnerHtml("lblModalAtLeastOneNeedsActivationTitle");
            translateInnerHtml("lblModalAtLeastOneNeedsActivationMessage");
            translateInnerHtml("modalAtLeastOneNeedsActivationBtnOK");
            translateInnerHtml("lblModaStateEventOrIntervalllTitle");
            translateInnerHtml("lblModaStateEventOrIntervalllMessage");
            translateInnerHtml("modalStateEventOrIntervallBtnOK");
            translateInnerHtml("lblModalUDPPortsEqualWrongTitle");
            translateInnerHtml("modalUDPPortsEqualWrongBtnOK");
            break;
        case "logfiles":
            translateInnerHtml("logfileIntroHeader");
            translateInnerHtml("tabHeaderAddonLog");
            translateTitle("imgReloadLogfileData");
            translateTitle("imgDeleteLogfileData");
            translateTitle("imgDownloadLogfile");
            translateInnerHtml("tabHeaderAddonErr");
            translateInnerHtml("tabHeaderClientLog");
            break;
        case "info":
            translateInnerHtml("aboutIntroHeader");
            translateInnerHtml("headerVersionInfo");
            translateInnerHtml("headerUsage");
            translateInnerHtml("textUsage");
            translateInnerHtml("entryGetStations");
            translateInnerHtml("entryGetDevices");
            translateInnerHtml("entryGetHouses");
            translateInnerHtml("entryGetMode");
            translateInnerHtml("entryGetModeStation");
            translateInnerHtml("entrySetMode");
            translateInnerHtml("entryModeAway");
            translateInnerHtml("entryModeCustom1");
            translateInnerHtml("entryModeCustom2");
            translateInnerHtml("entryModeCustom3");
            translateInnerHtml("entryModeDisarmed");
            translateInnerHtml("entryModeGeo");
            translateInnerHtml("entryModeHome");
            translateInnerHtml("entryModeOff");
            translateInnerHtml("entryModeSchedule");
            translateInnerHtml("entryModePrivacyOn");
            translateInnerHtml("entryModePrivacyOff");
            translateInnerHtml("entrySetModeStation");
            translateInnerHtml("entryGetLibrary");
            translateInnerHtml("entryGetDeviceImage");
            translateInnerHtml("entryMoveToPreset");
            translateInnerHtml("hintModeNotSupported");
            translateInnerHtml("textUseApi");
            translateInnerHtml("entryApiBackground");
            translateInnerHtml("entryApiReturnValues");
            translateInnerHtml("descApiSystemVariables");
            translateInnerHtml("descApiIpAddress");
            translateInnerHtml("descApiTimeout");
            translateInnerHtml("hintApiTimestamps");
            translateInnerHtml("descTimestampStation");
            translateInnerHtml("descTimestampVideo");
            translateInnerHtml("descTimestampNoValue");
            translateInnerHtml("headerProjectInfo");
            translateInnerHtml("textProjectInfoGitHub");
            translateInnerHtml("textProjectDonation");
            translateInnerHtml("textProjectInspiration");
            translateInnerHtml("headerAboutEufySecurityApi");
            translateInnerHtml("headerAboutWebsite");
            translateInnerHtml("headerAboutAddOn");
            break;
        case "restartWaiter":
            translateInnerHtml("lblWaitServiceStart");
            translateInnerHtml("lblWaitServiceInit");
            break;
    }
}

function translateInnerHtml(elementId)
{
    document.getElementById(elementId).innerHTML = translateStaticContentElement(elementId);
}

function translateInnerHtmlByReplace(elementId)
{
    document.getElementById(elementId).innerHTML = document.getElementById(elementId).innerHTML.replace(`{${elementId}}`, translateStaticContentElement(elementId));
}

function translatePlaceholer(elementId)
{
    document.getElementById(elementId).placeholder = translateStaticContentElement(elementId);
}

function translateTitle(elementId)
{
    document.getElementById(elementId).title = translateStaticContentElement(elementId);
}