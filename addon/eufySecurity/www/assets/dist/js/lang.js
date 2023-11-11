const supportedLanguages = ["de","en"];

function getLanguageInfo()
{
    return `${translateString("strLanguageFile")}: ${languageDesc} (${language} - ${translateString("strVersion")}: ${languageVersion})`;
}
function getLanguage()
{
    var lang = navigator.language.slice(0,2);
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
            document.getElementById("btnArmAll").innerHTML = translateGuardMode(0);
            document.getElementById("btnHomeAll").innerHTML = translateGuardMode(1);
            document.getElementById("btnScheduleAll").innerHTML = translateGuardMode(2);
            document.getElementById("btnDisarmAll").innerHTML = translateGuardMode(63);
            translateInnerHtml("divStateChangeToastOkHeader");
            translateInnerHtml("divStateChangeToastOkMessage");
            translateInnerHtml("divStateChangeToastFailedHeader");
            translateInnerHtml("divStateChangeToastFailedMessage");
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
            translateInnerHtml("optPleaseSelect");
            translateInnerHtml("hintCountry");
            translateInnerHtml("lblLanguage");
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
            translateInnerHtml("optAllStationsDevices");
            translateInnerHtml("hintHouseSelection");
            translateInnerHtml("settingsHeaderConfigConnectionToStationSettings");
            translateInnerHtml("lblConnectionType");
            translateInnerHtml("optConnectionTypeLocal");
            translateInnerHtml("optConnectionTypeFastest");
            translateInnerHtml("hintConnectionType");
            translateInnerHtml("lblUseUdpStaticPorts");
            translateInnerHtml("settingsHeaderConfigUpdateSystemVariables");
            translateInnerHtml("lblUseSystemVariables");
            translateInnerHtml("settingsHeaderConfigDefaultImageSettings");
            translateInnerHtml("lblDefaultImagePath");
            translatePlaceholer("txtDefaultImagePath");
            translateInnerHtml("hintDefaultImagePath");
            translateInnerHtml("settingsHeaderConfigDefaultVideoSettings");
            translateInnerHtml("lblDefaultVideoPath");
            translatePlaceholer("txtDefaultVideoPath");
            translateInnerHtml("hintDefaultVideoPath");
            translateInnerHtml("settingsHeaderConfigUpdateState");
            translateInnerHtml("lblUpdateStateEvent");
            translateInnerHtml("lblUpdateStateIntervall");
            translateInnerHtml("lblUpdateStateIntervallTimespan");
            translatePlaceholer("txtUpdateStateIntervallTimespan");
            translateInnerHtml("hintStateIntervallTimespan");
            translateInnerHtml("divStateIntervallError");
            translateInnerHtml("settingsHeaderConfigUpdateLinks");
            translateInnerHtml("lblUseUpdateLinksIntervall");
            translateInnerHtml("lblUpdateLinksOnlyWhenActive");
            translateInnerHtml("lblUpdateLinksIntervallTimespan");
            translatePlaceholer("txtUpdateLinksIntervallTimespan");
            translateInnerHtml("hintLinksIntervallTimespan");
            translateInnerHtml("divLinksIntervallTimespanError");
            translateInnerHtml("settingsHeaderConfigPushService");
            translateInnerHtml("lblUsePushService");
            translateInnerHtml("hintUsePushService");
            translateInnerHtml("settingsHeaderConfigLogLevel");
            translateInnerHtml("lblLogLevel");
            translateInnerHtml("optLogLevel0");
            translateInnerHtml("optLogLevel1");
            translateInnerHtml("optLogLevel2");
            translateInnerHtml("optLogLevel3");
            translateInnerHtml("hintLogLevel");
            translateInnerHtml("divLogLevelError");
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
            translateInnerHtml("headerDeleteTokenData");
            translateInnerHtml("hintDeleteToken");
            translateInnerHtml("btnDeleteTokenData");
            translateInnerHtml("headerRestartService");
            translateInnerHtml("hintRestartService");
            translateInnerHtml("btnRestartService");
            translateInnerHtml("headerCheckConfigFailed");
            translateInnerHtml("divCheckConfigFailed");
            translateInnerHtml("headerSaveConfigOK");
            translateInnerHtml("divSaveConfigOK");
            translateInnerHtml("headerSaveConfigFailed");
            translateInnerHtml("divSaveConfigFailed");
            translateInnerHtml("headerUploadConfigFailed");
            translateInnerHtml("divUploadConfigFailed");
            translateInnerHtml("headerRemoveTokenOK");
            translateInnerHtml("divRemoveTokenOK");
            translateInnerHtml("headerRemoveTokenFailed");
            translateInnerHtml("divRemoveTokenFailed");
            translateInnerHtml("headerRestartOK");
            translateInnerHtml("divRestartOK");
            translateInnerHtml("headerRestartFailed");
            translateInnerHtml("divRestartFailed");
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
            translateInnerHtml("headerLogfile");
            translateTitle("imgDeleteLogfileData");
            translateTitle("imgDownloadLogfile");
            translateInnerHtml("headerErrorfile");
            translateTitle("imgDeleteErrorfileData");
            translateTitle("imgDownloadErrorfile");
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
            translateInnerHtml("headerSaveConfigOKRestart");
            translateInnerHtml("divSaveConfigOKRestart");
            translateInnerHtml("headerRemoveTokenOK");
            translateInnerHtml("divRemoveTokenOK");
            translateInnerHtml("headerRestartOK");
            translateInnerHtml("divRestartOK");
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