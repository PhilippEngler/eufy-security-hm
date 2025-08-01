/*
Language File for English (en)
Schema v9.41
20250802
createdBy: PhilippEngler (via DeepL)
*/
var language = "en";
var languageDesc = "english";
var languageAuthor = "PhilippEngler (via DeepL)";
var languageVersion = "20250802 (v9.41)";

function translateNavbarElement(element) {
    switch(element) {
        case "niMain":
            return "eufy Security for HomeMatic";
        case "niHome":
            return "Home";
        case "niDevices":
            return "Devices";
        case "niStateChange":
            return "Status Change";
        case "niSettings":
            return "Settings";
        case "niLogfiles":
            return "Logfiles";
        case "niInfo":
            return "About";
        default:
            return `{${element}}`;
    }
}

function translateStaticContentElement(element) {
    switch(element) {
        case "divIndexJumbotronAddonHeader":
            return "eufy Security AddOn for HomeMatic";
		case "divIndexJumbotronAddonInfo":		
			return "This AddOn allows you to control your eufy Security System with your CCU.";
        case "divIndexDescription01":
            return "On this website, you will find all stations and devices that are available for the eufy Security Account stored in the settings. Information about the devices is displayed, you can change the settings of the devices and you can check and change the current mode of your eufy Security System.";
		case "divIndexDescription02":
			return "With the help of the API provided by the add-on, you can also display the status of your devices in your CCU and you can also check and change the mode. There are various endpoints for this, which are described in the About tab.";
		case "divDevicesIntroHeader":
			return "Devices";
		case "divDevicesIntroMessage":
			return "Here you will find all devices that are assigned to the specified account.";
		case "divStateChangeIntroHeader":
			return "Status Change";
		case "divStateChangeIntroMessage":
			return "Here you will find the current status of your stations and can change this either for one station or for all stations.";
		case "divStateChangeAllStationsHeader":
			return "All stations";
		case "divStateChangeAllStationsDesc":
			return "Change the status of all stations";
		case "toastOkHeader":
			return "Change of status.";
		case "toastOkText":
			return "The status has been changed successfully.";
		case "toastFailedHeader":
			return "Change of status.";
		case "toastFailedText":
			return "An error occurred while changing the status.";
		case "settingsIntroHeader":
			return "Settings";
		case "settingsCardHeaderEufySecurityAccountData":
			return "eufy Security Account";
		case "settingsHeaderAccountData":
			return "Account data";
		case "settingsAccountDataHintHeader":
			return "Please create your own eufy Security Account for this add-on.";
		case "settingsAccountDataHintMessage":
			return "To use this add-on without any problems, create a new eufy Security Account in the app and enter its access data here.";
		case "settingsAccountDataHintSubText":
			return "If you do not create your own account for this AddOn, you will be logged out in your app every time this AddOn communicates with eufy Security or the AddOn will be logged out when you use your app.";
		case "lblUsername":
			return "User name of the created eufy Security account.";
		case "txtUsername":
			return "Email address";
		case "hintUsername":
			return "The user name is the e-mail address with which you created the eufy Security account.";
		case "divUsernameError":
			return "Please enter the e-mail address of the eufy Security Account.";
		case "lblPassword":
			return "Password of the created eufy Security Account.";
		case "txtPassword":
			return "Password";
		case "hintPassword":
			return "The password that you created for the eufy Security Account.";
		case "divPasswordError":
			return "Please enter the password of the eufy Security Account.";
		case "settingsHeaderAccountMoreSettings":
			return "Further settings";
		case "lblCountry":
			return "Country of the eufy Security Account.";
		case "optPleaseSelectCountry":
		case "optPleaseSelectLanguage":
		case "optPleaseSelectHouse":
		case "optPleaseSelectConnectionType":
		case "optPleaseSelectLogLevelAddon":
		case "optPleaseSelectLogLevelMain":
		case "optPleaseSelectLogLevelHttp":
		case "optPleaseSelectLogLevelP2p":
		case "optPleaseSelectLogLevelPush":
		case "optPleaseSelectLogLevelMqtt":
		case "optPleaseSelectReconnectStation":
			return "Please select...";
		case "hintCountry":
			return "The country for which you have created the eufy Security Account.";
		case "lblLanguage":
			return "Language of the eufy Security Account.";
		case "hintLanguage":
			return "The language used for the eufy Security Account.";
		case "lblTrustedDeviceName":
			return "Name of the device.";
		case "txtTrustedDeviceName":
			return "Name of the device";
		case "btnGenerateNewTrustedDeviceName":
			return "Generate new device name";
		case "hintTrustedDeviceName":
			return "The name of the device is required for the connection with eufy. Please do not enter any reference to the use of the eufy security client.";
		case "divTrustedDeviceNameError":
			return "Please enter a device name. The character string 'eufyclient' must not be included.";
		case "settingsCardHeaderEufySecurityConfig":
			return "Configuration of the add-on";
		case "settingsHeaderConfigHttpSettings":
			return "Settings for HTTP";
		case "lblUseHttp":
			return "HTTP active";
		case "lblPortHttp":
			return "Port via which the eufy Security API should be accessible via HTTP.";
		case "txtPortHttp":
			return "API port";
		case "hintPortHttp":
			return "The specified port must not be in use.";
		case "divPortHttpError":
			return "Please enter a number between 1 and 65535.";
		case "settingsHeaderConfigHttpsSettings":
			return "Settings for HTTPS";
		case "lblUseHttps":
			return "HTTPS active";
		case "lblPortHttps":
			return "Port via which the eufy Security API should be accessible via HTTPS.";
		case "txtPortHttps":
			return "API port";
		case "hintPortHttps":
			return "The specified port must not be in use.";
		case "divPortHttpsError":
			return "Please enter a number between 1 and 65535.";
		case "lblHttpsKeyFile":
			return "Storage location of the file with the private key of the certificate.";
		case "txtHttpsKeyFile":
			return "Key file";
		case "hintHttpsKeyFile":
			return "Storage location of the key file on the CCU.";
		case "lblHttpsCertFile":
			return "Storage location of the certificate.";
		case "txtHttpsCertFile":
			return "Certificate file";
		case "hintHttpsCertFile":
			return "Storage location of the certificate file on the CCU.";
		case "settingsHeaderConfigHouseAdministration":
			return "Settings for the house management function";
		case "lblAcceptInvitations":
			return "Accept invitations automatically";
		case "lblHouseSelection":
			return "Display stations and devices.";
		case "optAllStationsDevices":
			return "All station and devices of the account";
		case "hintHouseSelection":
			return "With the setting 'All station and devices of the account', all devices are displayed. If a house is selected, only devices that have been assigned to this house are displayed.";
		case "settingsHeaderConfigConnectionToStationSettings":
			return "Settings for the connection to the stations";
		case "lblConnectionType":
			return "Establish the connection to the stations.";
		case "optConnectionTypeLocal":
			return "Local connection only";
		case "optConnectionTypeFastest":
			return "Fastest connection";
		case "hintConnectionType":
			return `This setting is used for all stations and devices supplied with power. For battery-powered devices, the connection is always established with the '${translateStaticContentElement("optConnectionTypeFastest")}' option.`;
		case "lblUseUdpStaticPorts":
			return "Establish connection to the stations via fixed ports";
		case "settingsHeaderConfigUpdateSystemVariables":
			return "Settings for updating the system variables";
		case "lblUseSystemVariables":
			return "Automatically update system variables for API actions";
		case "settingsHeaderConfigUpdateState":
			return "Settings for regular mode update";
		case "lblUpdateStateEvent":
			return "Update mode automatically by events sent by the station";
		case "lblUpdateStateIntervall":
			return "Update mode regularly based on intervals";
		case "lblUpdateStateIntervallTimespan":
			return "Time between updates.";
		case "txtUpdateStateIntervallTimespan":
			return "Interval between updates.";
		case "hintStateIntervallTimespan":
			return "Interval in minutes.";
		case "divStateIntervallError":
			return "Please enter an interval between 15 and 240 minutes.";
		case "settingsHeaderConfigPushService":
			return "Settings for push notifications";
		case "lblUsePushService":
			return "Activate push notifications";
		case "hintUsePushService":
			return "Push notifications are required, for example, to determine the time of the last events for the cameras.";
		case "settingsHeaderConfigSecureApiAccessSid":
			return "Settings for securing access to api";
		case "lblUseSecureApiAccessSid":
			return "Activate securing access to api";
		case "hintUseSecureApiAccessSid":
			return "If you enable this setting a sid is needed to access some api endpoints. Please navigate to the CCUs WebUI and select Settings > Addons. There on the section for the eufy SECURITY-Addon select Setting.";
		case "settingsHeaderConfigLogLevel":
			return "Settings for logging";
		case "lblLogLevelAddon":
			return "Scope of the logging for addon.";
		case "lblLogLevelMain":
			return "Scope of the logging for client (category main).";
		case "lblLogLevelHttp":
			return "Scope of the logging for client (category http).";
		case "lblLogLevelP2p":
			return "Scope of the logging for client (category P2P).";
		case "lblLogLevelPush":
			return "Scope of the logging for client (category push).";
		case "lblLogLevelMqtt":
			return "Scope of the logging for client (category mqtt).";
		case "optLogLevelAddon0":
		case "optLogLevelMain0":
		case "optLogLevelHttp0":
		case "optLogLevelP2p0":
		case "optLogLevelPush0":
		case "optLogLevelMqtt0":
			return "Logging level trace";
		case "optLogLevelAddon1":
		case "optLogLevelMain1":
		case "optLogLevelHttp1":
		case "optLogLevelP2p1":
		case "optLogLevelPush1":
		case "optLogLevelMqtt1":
			return "Logging level debug";
		case "optLogLevelAddon2":
		case "optLogLevelMain2":
		case "optLogLevelHttp2":
		case "optLogLevelP2p2":
		case "optLogLevelPush2":
		case "optLogLevelMqtt2":
			return "Logging level information";
		case "optLogLevelAddon3":
		case "optLogLevelMain3":
		case "optLogLevelHttp3":
		case "optLogLevelP2p3":
		case "optLogLevelPush3":
		case "optLogLevelMqtt3":
			return "Logging level warning";
		case "optLogLevelAddon4":
		case "optLogLevelMain4":
		case "optLogLevelHttp4":
		case "optLogLevelP2p4":
		case "optLogLevelPush4":
		case "optLogLevelMqtt4":
			return "Logging level error";
		case "optLogLevelAddon5":
		case "optLogLevelMain5":
		case "optLogLevelHttp5":
		case "optLogLevelP2p5":
		case "optLogLevelPush5":
		case "optLogLevelMqtt5":
			return "Logging level fatal";
		case "optLogLevelAddon6":
		case "optLogLevelMain6":
		case "optLogLevelHttp6":
		case "optLogLevelP2p6":
		case "optLogLevelPush6":
		case "optLogLevelMqtt6":
			return "no logging";
		case "hintLogLevelAddon":
		case "hintLogLevelMain":
		case "hintLogLevelHttp":
		case "hintLogLevelP2p":
		case "hintLogLevelPush":
		case "hintLogLevelMqtt":
			return `Defines the scope of logging. Each level contains all subsequent error message classes (without the last level "no logging").`;
		case "divLogLevelErrorAddon":
		case "divLogLevelErrorMain":
		case "divLogLevelErrorHttp":
		case "divLogLevelErrorP2p":
		case "divLogLevelErrorPush":
		case "divLogLevelErrorMqtt":
			return "Please select a logging level.";
		case "btnSave":
			return "Save settings";
		case "settingsCardHeaderSystemvariables":
			return "System variables";
		case "settingsCardHeaderErrorHandling":
			return "Troubleshooting";
		case "btnEnableTroubleShooting":
			return "Activate troubleshooting";
		case "settingsHintHeaderErrorHandling":
			return "Advanced troubleshooting functions";
		case "settingsHintMessageErrorHandling":
			return "You can use the following buttons to perform various tasks to restore the functionality of the add-on. To avoid unwanted changes, you must first enable editing for some tasks.";
		case "settingsHintSubTextErrorHandling":
			return "Please note that some of the functions change or delete data and settings.";
		case "headerSaveConfig":
			return "Save configuration";
		case "hintSaveConfig":
			return "Please note that this file contains your access data in plain text.";
		case "btnDownloadConfigFile":
			return "Download configuration";
		case "headerUploadConfig":
			return "Restore configuration";
		case "hintUploadConfig":
			return "The file is checked after uploading. If the check is successful, the add-on is restarted to apply the new settings.";
		case "btnUploadConfigFile":
			return "Upload configuration";
		case "headerRemoveInteractions":
			return "Delete Interactions";
		case "hintRemoveInteractions":
			return "All interactions will be deleted in the settings.";
		case "btnRemoveInteractions":
			return "Delete Interactions";
		case "headerReconnectStation":
			return "Reconnect P2P Connection";
		case "hintReconnectStation":
			return "If P2P connection errors are displayed in the log files and you are prompted to reinitialize the P2P connection, you can do this here. To do this, select the relevant station and click on 'Reconnect P2P Connection'.";
		case "btnReconnectStation":
			return "Reconnect P2P Connection";
		case "headerDeleteTokenData":
			return "Delete token";
		case "hintDeleteToken":
			return "If you receive the error <code>401 (Unauthorized)</code> in the log file, you can try to delete the existing token. This will generate a new token for the next request.";
		case "btnDeleteTokenData":
			return "Delete token";
		case "headerServiceManager":
			return "Service Manager";
		case "hintServiceManager":
			return "It may be necessary to start, stop or restart the service.";
		case "btnServiceManager":
			return "Open Service Manager...";
		case "lblModalServiceManagerTitle":
			return "Service Manager";
		case "modalServiceManagerMessage":
			return "It may be necessary to start, stop or restart the service. Please select the logfiles to delete and click the button for the action you want to perform.";
		case "lblDeleteLogfile":
			return "delete logfles";
		case "lblDeleteErrfile":
			return "delete error logfile";
		case "lblDeleteClientLogfile":
			return "delete client logfile";
		case "btnServiceManagerStartService":
			return "Start service";
		case "btnServiceManagerStopService":
			return "Stop service";
		case "btnServiceManagerRestartService":
			return "Restart service";
		case "modalServiceManagerBtnCancel":
			return "Cancel";
		case "lblModalAtLeastOneNeedsActivationTitle":
			return "Check the settings.";
		case "lblModalAtLeastOneNeedsActivationMessage":
			return "To ensure the accessibility of the API, at least one of the two options ('HTTP active' or 'HTTPS active') must be activated.<br /><br />The last deactivated option is reactivated with clicking on 'OK'.";
		case "modalAtLeastOneNeedsActivationBtnOK":
			return "OK";
		case "lblModaStateEventOrIntervalllTitle":
			return "Check the settings.";
		case "lblModaStateEventOrIntervalllMessage":
			return `The option '${translateStaticContentElement("lblUpdateStateEvent")}' and the option '${translateStaticContentElement("lblUpdateStateIntervall")}' cannot be activated at the same time.<br /><br />The last activated option is deactivated with clicking on 'OK'.`;
		case "modalStateEventOrIntervallBtnOK":
			return "OK";
		case "lblModalUDPPortsEqualWrongTitle":
			return "Check the settings.";
		case "modalUDPPortsEqualWrongBtnOK":
			return "OK";
		case "lblModalDeleteSystemVariableTitle":
			return "Remove system variable";
		case "modalDeleteSystemVariableBtnNo":
			return "No";
		case "modalDeleteSystemVariableBtnYes":
			return "Yes, please remove";
		case "lblModalUpdateSystemVariableTitle":
			return "Update system variable";
		case "modalUpdateSystemVariableBtnNo":
			return "No";
		case "modalUpdateSystemVariableBtnYes":
			return "Yes, please update";
		case "lblModalDeleteEventInteractionTitle":
			return "Remove interaction";
		case "modalDeleteEventInteractionBtnNo":
			return "No";
		case "modalDeleteEventInteractionBtnYes":
			return "Yes, please remove";
		case "lblModalDeleteEventInteractionsTitle":
			return "Remove interactions";
		case "modalDeleteEventInteractionsBtnNo":
			return "No";
		case "modalDeleteEventInteractionsBtnYes":
			return "Yes, please remove all";
		case "lblModalDeleteTokenTitle":
			return "Remove token";
		case "modalDeleteTokenBtnNo":
			return "No";
		case "modalDeleteTokenBtnYes":
			return "Yes, please remove";
		case "lblModalEmptyLogfileTitle":
			return "Empty file";
		case "modalEmptyLogfileBtnNo":
			return "No";
		case "modalEmptyLogfileBtnYes":
			return "Yes, please empty file";
		case "lblModalRebootStationTitle":
			return "Reboot station";
		case "modalRebootStationBtnNo":
			return "No";
		case "modalRebootStationBtnYes":
			return "Yes, please reboot";
		case "logfileIntroHeader":
			return "Logfiles";
		case "tabHeaderAddonLog":
			return "Addon - Logfile";
		case "imgReloadLogfileData":
			return "Reload content";
		case "imgDeleteLogfileData":
			return "Remove all entries";
		case "imgDownloadLogfile":
			return "Download";
		case "tabHeaderAddonErr":
			return "Addon - Errorfile";
		case "tabHeaderClientLog":
			return "Client - Logfile";
		case "tabHeaderInstallLog":
			return "Install - Logfile";
		case "lblWaitServiceStart":
			return "Waiting for the service to start...";
		case "lblWaitServiceInit":
			return "Waiting for the service to initialize...";
		case "aboutIntroHeader":
			return "About eufy Security AddOn for HomeMatic";
		case "headerVersionInfo":
			return "Version information";
		case "headerUsage":
			return "Notes on use";
		case "textUsage":
			return "The API currently provides the following functions:";
		case "entryGetStations":
			return "<code>/getStations</code>: Returns all stations in the account as a JSON string.";
		case "entryGetDevices":
			return "<code>/getDevices</code>: Returns all devices in the account as a JSON string.";
		case "entryGetHouses":
			return "<code>/getHouses</code>: Returns all house objects of the account as a JSON string.";
		case "entryGetMode":
			return "<code>/getMode</code>: Returns the status of all stations as a JSON string.";
		case "entryGetModeStation":
			return "<code>/getMode/<i>STATION_SERIAL</i></code>: Returns the status of the station with the serial number <i>STATION_SERIAL</i> as a JSON string.";
		case "entrySetMode":
			return "<code>/setMode/<i>MODE</i></code>: Changes the status of all stations to <i>MODE</i>. <i>MODE</i> can be one of the following values. The response is a JSON string.";
		case "entryModeAway":
			return "<code>away</code>: away";
		case "entryModeCustom1":
			return "<code>custom1</code>: custom 1";
		case "entryModeCustom2":
			return "<code>custom2</code>: custom 2";
		case "entryModeCustom3":
			return "<code>custom3</code>: custom 3";
		case "entryModeDisarmed":
			return "<code>disarmed</code>: disarmed";
		case "entryModeGeo":
			return "<code>geo</code>: geofencing";
		case "entryModeHome":
			return "<code>home</code>: home";
		case "entryModeOff":
			return "<code>off</code>: off";
		case "entryModeSchedule":
			return "<code>schedule</code>: schedule";
		case "entryModePrivacyOn":
			return "<code>privacyOn</code>: indoorcam off";
		case "entryModePrivacyOff":
			return "<code>privacyOff</code>: indoorcam on";
		case "entrySetModeStation":
			return "<code>/setMode/<i>STATION_SERIAL</i>/<i>MODE</i></code>: Changes the status of the station with the serial number <i>STATION_SERIAL</i> to <i>MODE</i>. <i>MODE</i> can be one of the values listed above. The response is a JSON string.";
		case "entryGetLibrary":
			return "<code>/getLibrary</code>: Returns the link to the last still image and the corresponding time as a JSON string.";
		case "entryGetDeviceImage":
			return "<code>/getDeviceImage/<i>DEVICE_SERIAL</i></code>: Returns the last image of the device with the serial number <i>DEVICE_SERIAL</i> as an image.";
		case "entryMoveToPreset":
			return "<code>/moveToPresetPosition/<i>DEVICE_SERIAL</i>/<i>PRESET_NUMBER</i></code>: The device with the serial number <i>DEVICE_SERIAL</i> will move to the saved preset <i>PRESET_NUMBER</i>. <i>PRESET_NUMBER</i> can have the values <code>0</code>, <code>1</code>, <code>2</code> or <code>3</code>. There is no feedback as to whether the corresponding preset is proven and whether the position has been approached.";
		case "hintModeNotSupported":
			return "Please note that some modes can only be used with certain device types. If you want to set a mode that is not supported by the device, you will receive a corresponding message.";
		case "textUseApi":
			return "You can query the API via scripts. You have two options for this:";
		case "entryApiBackground":
			return `If you do not want to evaluate the response, you can use the following code to execute the request in the background (i.e. non-blocking):<ul><li>to RaspberryMatic 3.79.6.20241122<br /><code>system.Exec("curl --max-time 20 'http://127.0.0.1:52789/setMode/away' &");</code></li><li>from RaspberryMatic 3.79.6.20250118<br /><code>system.Exec("curl 'http://127.0.0.1:52789/setMode/away' &", null, null, null, 20000);</code></li></ul>`;
		case "entryApiReturnValues":
			return `If you want to evaluate the response, you can use the following code:<ul><li>to RaspberryMatic 3.79.6.20241122<br /><code>string res;<br />string err;<br />system.Exec("curl --max-time 20 'http://127.0.0.1:52789/setMode/away'", &res, &err);</code><li>from RaspberryMatic 3.79.6.20250118<br /><code>string res;<br />string err;<br />system.Exec("curl 'http://127.0.0.1:52789/setMode/away'", &res, &err, null, 20000);</code></li></ul><br />The JSON response can be found in the string <code>res</code>.`;
		case "descApiSystemVariables":
			return `With both variants, the corresponding system variables are set automatically if the option '${translateStaticContentElement("lblUseSystemVariables")}' has been activated in the settings.`;
		case "descApiIpAddress":
			return "Use the IP address of your CCU instead of <code>127.0.0.1</code> if you want to access the API from devices in your network (e.g. with a browser).";
		case "descApiTimeout":
			return "The specification <code>max-time 20</code> (to RaspberryMatic 3.79.6.20241122) or the last argument of the system.Exec-function (<code>20000</code>, from RaspberryMatic 3.79.6.20250118, value in milliseconds)  means that the execution is aborted after 20 seconds. The API function <code>/setMode</code> can have a maximum runtime of approx. 10 seconds per station. For this reason, the value for <code>max-time</code> in the API function <code>/setMode</code> must be adjusted according to the number of stations. If you use RaspberryMatic-version from 3.79.6.20250118 and you are using the code from the older version, RaspberryMatic will exit the process automatically after 10 seconds.";
		case "hintApiTimestamps":
			return "The timestamps of the last events are only set and updated in the following cases:";
		case "descTimestampStation":
			return `Time of mode change for stations: the setting '${translateStaticContentElement("lblUpdateStateEvent")}' must be activated`;
		case "descTimestampVideo":
			return `Time of the last video event for cameras: the "Activate push notifications" setting must be activated`;
		case "descTimestampNoValue":
			return `If the corresponding setting is not activated, "Last status change: unknown" is displayed for stations and "Last recording not available" for cameras.`;
		case "headerProjectInfo":
			return "Information about the project";
		case "textProjectInfoGitHub":
			return `All information and files for this add-on can be found on the <a href="https://github.com/PhilippEngler/eufy-security-hm" target="_blank">add-on's GitHub page</a>.`;
		case "textProjectDonation":
			return `Do you like this add-on? Then support the development of this add-on with a donation via <a href="https://www.paypal.me/EnglerPhilipp" target="_blank"><i class="bi-paypal" title="PayPal Logo"></i> PayPal</a>. Thank you very much!`;
		case "textProjectInspiration":
			return "This project was created on the basis of various projects. The HomeMatic forum community also contributed to its creation. Below you will find the people and projects that formed the basis for this project and without whose preliminary work this project would not have existed.";
		case "headerAboutEufySecurityApi":
			return "eufy Security API:";
		case "headerAboutWebsite":
			return "Website:";
		case "headerAboutAddOn":
			return "CCU add-on:";
		case "txtLogfileLocation":
			return "Content of file";
		case "txtLogfileUnknown":
			return "Type of logfile unknown";
		default:
            return `{${element}}`;
    }
}

function translateMessages(message, ...options) {
	switch(message) {
		case "messageApiPortInactiveHeader":
			return `Calling the API via ${options[0]} is deactivated`;
		case "messageApiPortInactiveSubText":
			return `Please use an ${options[0]}connection to access the add-on's website.`;
		case "messageApiPortFileNotFoundHeader":
			return "An error has occurred while determining the API ports.";
		case "messageApiPortFileNotFoundMessageText":
			return "Please check the apiPorts.json file in the website directory of this add-on.";
		case "messageErrorPrintErrorMessage":
			return `The following error has occurred: ${options[0]}${options[1] !== undefined ? ` [${options[1]}]` : ""}`;
		case "messageErrorStatusAndReadyState":
			return `Return value 'Status' is '${options[0]}'. Return value 'ReadyState' is '${options[1]}'.${options[2] !== undefined ? ` Function: '${options[2]}'.` : ""}`;
		case "messageAbortLoadingHeader":
			return "Canceled loading.";
		case "messageAbortLoadingText":
			return "The loading process has been canceled.";
		case "messageErrorLoadingHeader":
			return "Error while parsing result.";
		case "messageErrorLoadingText":
			return "The result has been received is nor valid.";
		case "messageCaptchaErrorHeader":
			return "Error loading the captcha status.";
		case "messageErrorCheckingAddonStateHeader":
			return "Error retrieving state of add-on.";
		case "messageErrorAddonNotRunning":
			return "The addon may not be executed or the firewall configuration is blocking the communication. Restarting the add-on, the CCU or changeing the firewall settings could solve the problem.";
		case "messageCaptchaError":
			return "Error loading the captcha status.";
		case "messageCaptchaSendError":
			return "Error sending the captcha string.";
		case "messageNoStationsFoundHeader":
			return "No stations were found.";
		case "messageNoStationsFoundMessage":
			return "No available stations were found.";
		case "messageNoStationsFoundSubText":
			return "Check whether you have enabled stations for the account or whether you have enabled the house for the account and whether you have enabled the correct house in the settings.";
		case "messageNoManageableStationsFoundHeader":
			return "No manageable stations were found.";
		case "messageNoManageableStationsFoundMessage":
			return "There are no stations that where manageable here.";
		case "messageNoManageableStationsFoundSubText":
			return "There are devices that are also a station. To change settings for these stations, open the settings for these devices.";
		case "messageErrorLoadingStationsHeader":
			return "Error loading the station.";
		case "messageNoDevicesFoundHeader":
			return "No devices were found.";
		case "messageNoDevicesFoundMessage":
			return "No available devices were found.";
		case "messageNoDevicesFoundSubText":
			return "Check whether you have enabled devices for the account or whether you have enabled the house for the account and whether you have enabled the correct house in the settings.";
		case "messageErrorLoadingDevicesHeader":
			return "Error loading the devices.";
		case "messageErrorNoDeviceForGetInfo":
			return `No device found. ${options[0]} could not be loaded.`;
		case "messageErrorLoadDeviceForGetInfo":
			return `Error loading the ${options[0]}.`;
		case "messageContinuousRecordingSheduleHint":
			return "Schedule must be configured.";
		case "messageContinuousRecordingSheduleMessage":
			return "The schedule for this function must currently be configured in the app.";
		case "messageInteractionHintHeader":
			return "Notes on interacting with the CCU.";
		case "messageInteractionHintMessage":
			return "The interactions are only carried out if there is a P2P connection to the base and an internet connection. If one of these connections does not exist, interaction with the CCU cannot be guaranteed.";
		case "messageSaveInteractionHeader":
			return "Save interaction.";
		case "messageSaveInteractionUnknownInteractionMessage":
			return `The type of interaction to be saved is unknown ('${options[0]}').`;
		case "messageSaveInteractionOkMessage":
			return "The interaction was saved successfully.";
		case "messageSaveInteractionFailedMessage":
			return "The interaction could not be saved.";
		case "messageTestUnstoredInteractionHeader":
			return "Test unsaved interaction.";
		case "messageTestUnstoredInteractionUnknownInteractionMessage":
			return `The type of interaction to be send is unknown ('${options[0]}').`;
		case "messageTestUnstoredInteractionOkMessage":
			return "The interaction was executed.";
		case "messageTestUnstoredInteractionFailedMessage":
			return "The interaction could not be send.";
		case "messageTestInteractionHeader":
			return "Test interaction.";
		case "messageTestInteractionUnknownInteractionMessage":
			return `The type of interaction to be send is unknown ('${options[0]}').`;
		case "messageTestInteractionOkMessage":
			return "The interaction was executed.";
		case "messageTestInteractionErrorStatusMessage":
			return `The interaction could not be send.<br />Status: '${options[0]}'`;
		case "messageTestInteractionErrorCodeMessage":
			return `The interaction could not be send.<br />Code: '${options[0]}'`;
		case "messageTestInteractionFailedMessage":
			return "The interaction could not be send.";
		case "messageDeleteInteractionHeader":
			return "Delete interaction.";
		case "messageDeleteInteractionUnknownInteractionMessage":
			return `The type of interaction to be deleted is unknown ('${options[0]}').`;
		case "messageDeleteInteractionOkMessage":
			return "The interaction has been removed.";
		case "messageDeleteInteractionFailedMessage":
			return "The interaction could not be removed.";
		case "messageMoveToPresetHeader":
			return "Move to Preset Position.";
		case "messageMoveToPresetOkMessage":
			return `Moved to Preset Position ${options[0]}.`;
		case "messageMoveToPresetFailedMessage":
			return "An error occured during moving to the Preset Position.";
		case "messageCheckConfigFailedHeader":
			return "Checking the entries.";
		case "messageCheckConfigFailedMessage":
			return "The input check has failed. Please check the input fields marked in red and follow the instructions.";
		case "messageSaveConfigOKHeader":
			return "Saving the settings.";
		case "messageSaveConfigOKMessage":
			return "The settings have been saved successfully.";
		case "messageSaveConfigFailedHeader":
			return "Saving the settings.";
		case "messageSaveConfigFailedMessage":
			return "An error occurred while saving the settings.";
		case "messageUploadConfigFailedHeader":
			return "Upload of the configuration file.";
		case "messageUploadConfigFailedMessage":
			return "An error occurred while uploading the configuration file.";
		case "messageRemoveTokenFailedHeader":
			return "Delete token data.";
		case "messageRemoveTokenFailedMessage":
			return "An error has occurred while deleting the token data.";
		case "messageStartOKHeader":
			return "Start the service.";
		case "messageStartOKMessage":
			return "The service will be started.";
		case "messageStartFailedHeader":
			return "Start the service.";
		case "messageStartFailedMessage":
			return "An error occurred when starting the service.";
		case "messageSaveSettingsHeader":
			return "Save settings.";
		case "messageSaveSettingsOkMessage":
			return "The settings were saved successfully.";
		case "messageSaveSettingsFailedMessage":
			return "The settings could not be saved.";
		case "messageSendCommandHeader":
			return "Send Command.";
		case "messageSendCommandOkMessage":
			return "The command was sent successfully.";
		case "messageSendCommandFailedMessage":
			return "The command was not sent successfully.";
		case "messageReconnectStationHeader":
			return "Reconnect P2P Connection.";
		case "messageReconnectStationOkMessage":
			return "The connection has been reconnected.";
		case "messageReconnectStationFailedMessage":
			return "The connection could not be reconnect.";
		case "messageLoadTimeZoneInfoNotSuccessfullMessage":
			return "Time zone information could not be loaded.";
		case "messageLoadTimeZoneInfoFailedMessage":
			return "Error loading the time zone information.";
		case "messageErrorNoStationForGetInfo":
			return `No device found. ${options[0]} could not be loaded.`;
		case "messageErrorLoadStationForGetInfo":
			return `Error loading the ${options[0]}.`;
		case "messageStorageErrorHeader":
			return "The following problem has occurred with the internal memory";
		case "messageStorageErrorSubText":
			return "Please check the settings for the internal memory in the app.";
		case "messageStorageCapacityErrorHeader":
			return "Error retrieving the memory usage.";
		case "messageStorageCapacityErrorSubText":
			return "Please check the memory utilization of the internal memory in the app.";
		case "messageRebootStationHeader":
			return "Restart the station.";
		case "messageRebootStationOkMessage":
			return "The station is restarting. This may take a few minutes.";
		case "messageRebootStationFailedMessage":
			return "The station could not be restarted.";
		case "messageStationsNotFound":
			return "Error loading the stations.";
		case "messageCountriesLoadingFailedHeader":
			return "Error determining the countries.";
		case "messageHousesLoadingFailedHeader":
			return "Error determining the houses.";
		case "messageStationsLoadingError":
			return "Error determining the stations.";
		case "messageSettingsLoadingErrorHeader":
			return "Error determining the settings.";
		case "messageErrorThreeValuesMessage":
			return `The return value '${options[0]}' is '${options[1]}'.<br />Message: '${options[2]}'`;
		case "messageErrorServiceNotRunningHeader":
			return "Service is not active";
		case "messageErrorServiceNotRunningMessage":
			return "The service is currently not running.";
		case "messageSystemVariableHintHeader":
			return `Option '${translateStaticContentElement("lblUseSystemVariables")}' is activated.`;
		case "messageSystemVariableHintMessage":
			return "The AddOn will update the corresponding system variables. In the following table you will find all the system variables that this AddOn requires on the CCU. If the respective line is green, the system variable has already been created on the CCU, otherwise the line is red.</br >If system variables are found that begin with 'eufy' and are no longer required (e.g. for deleted devices), these appear in a second table. These system variables can be deleted there.";
		case "messageSystemVariableHintSubText":
			return `Please ensure that all system variables have been created. If you do not want the system variables to be updated, please deactivate the option '${translateStaticContentElement("lblUseSystemVariables")}'.`;
		case "messageSystemVariablesDeactivatedHeader":
			return "No system variables.";
		case "messageSystemVariablesDeactivatedMessage":
			return "The updating of system variables for API actions is deactivated.";
		case "messageSystemVariablesDeactivatedSubText":
			return `Activate the setting '${translateStaticContentElement("lblUseSystemVariables")}' if you want to work with the system variables.`;
		case "messageSystemVariablesLoadingErrorHeader":
			return "Error when determining the system variables.";
		case "messageSettingsSaveErrorHeader":
			return "Error when saving the settings.";
		case "messageSystemVariablesCreateErrorHeader":
			return "Error when creating the system variables.";
		case "messageSystemVariablesUnusedRemoveErrorHeader":
			return "Error when determining the obsolete system variables.";
		case "messageUploadConfigErrorHeader":
			return "Error uploading the configuration file.";
		case "messageUploadConfigErrorFileToLargeMessage":
			return "The selected file is too large.";
		case "messageUploadConfigErrorCommonMessage":
			return "The configuration file is incorrect.";
		case "messageUdpPortNoNumberMessage":
			return "You have not entered a number or have entered an invalid number. Please enter a number between 1 and 65535.";
		case "messageUdpPortInputRemoveMessage":
			return "The entry will now be deleted.";
		case "messageUdpPortPortAlreadyUsedMessage":
			return "You have entered a port that has already been entered for another station or another device.";
		case "messageLoadLogFileErrorHeader":
			return "Error loading the log file.";
		case "messageLoadLogFileErrorMessage":
			return "An error has occurred while loading the log file.";
		case "messageEmptyLogFileErrorHeader":
			return "Error while emptying logfile.";
		case "messageEmptyLogFileErrorMessage":
			return "An error has occurred while emptying logfile.";
		case "messageErrorLogfileUnknown":
			return `The logfile type '${options[0]}' is unknown.`;
		case "messageLoadVersionInfoErrorHeader":
			return "Error loading the version information.";
		case "messageLoadVersionInfoErrorMessage":
			return "An error has occurred while loading the version information.";
		case "messageRebootStationHeader":
			return "Reboot station.";
		case "messageRebootStationOkMessage":
			return "The station is rebooting. This may take some minutes.";
		case "messageSaveSettingsOkMessage":
			return "The station reboot failed.";
		case "messageRestartWaitErrorHeader":
			return "Error restarting the add-on.";
		case "messageRestartWaitHeaderMessage":
			return `An error has occurred while restarting the add-on.<br />Phase: '${options[0]}'`;
		case "messageRestartWaitHeaderErrorMessage":
			return `An error has occurred while restarting the add-on.<br />Error: '${options[0]}'`;
		case "modalDeleteSystemVariableMessage":
			return `Are you sure that the system variable '${options[0]}' should be deleted?<br />This process cannot be undone.`;
		case "modalUpdateSystemVariableMessage":
			return `Are you sure that the system variable '${options[0]}' should be updated?<br /><b>Please note:</b><br />This process consists of two steps:<br /><ol type="1"><li>current system variable will be deleted</li><li>system variable is recreated with current parameters</li></ol>You must then update existing programs, scripts and middleware (e.g. Home Assistant, ioBroker, etc.) with the new system variable.<br />This process cannot be undone.`;
		case "modalDeleteEventInteractionMessage":
			return `Are you sure that the following interaction should be deleted?<br /><dl><dt>Device:</dt><dd>${options[1]} (${options[2]})</dd><dt>Interaction:</dt><dd>${options[3]}</dd></dl>This process cannot be undone.`;
		case "modalDeleteEventInteractionsMessage":
			return `Are you sure that all interactions should be deleted?<br />This process cannot be undone.`;
		case "modalDeleteTokenMessage":
			return `Are you sure that the token should be deleted?<br />This process cannot be undone.`;
		case "modalEmptyLogfileMessage":
			return `Are you sure that the file '<text class="font-monospace fs-6 fw-medium">${options[0]}</text>' should be emptied?<br />This process cannot be undone.`;
		case "modalRebootStationMessage":
			return `Are you sure that the station ${options[1]} (${options[0]}) should be reboot?<br />It may take a few minutes before the station is available again.`;
		default:
			return `{${message}}`;
	}
}

function translateContent(content, ...options) {
	switch(content) {
		case "lblConfigNeededHeader":
			return "Settings incomplete";
		case "lblConfigNeeded":
			return `You must configure the add-on before you can use it. Click on the '${translateContent("btnGoToSettings")}' button to make the settings.`;
		case "btnGoToSettings":
			return "Go To Settings";
		case "lblTfaHeader":
			return "Login requires TFA code";
		case "lblTfaHint":
			return "Please enter the character string you have received in the text box.";
		case "lblTfaCode":
			return "Character string received:";
		case "btnTfaSubmit":
			return "Continue Login";
		case "lblTfaNotAvailable":
			return "There is currently no TFA for the account.";
		case "lblWaitMessageSendTfa":
			return "Send TFA character string...";
		case "lblCaptchaHeader":
			return "Login requires Captcha code";
		case "lblCaptchaHint":
			return "Please enter the character string shown in the captcha image in the text box.";
		case "lblCaptchaImageAltDesc":
			return "Captcha image"
		case "lblCaptchaCode":
			return "Character string shown in the captcha:";
		case "btnCaptchaSubmit":
			return "Continue Login";
		case "lblCaptchaNotAvailable":
			return "There is currently no captcha for the account.";
		case "lblWaitMessageSendCaptcha":
			return "Send Captcha character string...";
		case "titleNoP2PConnection":
			return "There is no P2P connection to this device.";
		case "titleNoP2PConnectionDesc":
			return "To be able to make settings for this device, the P2P connection must be re-established.";
		case "titleSettings":
			return "Settings";
		case "lblFirmware":
			return "Firmware Version";
		case "lblCurrentState":
			return "Current State";
		case "lblPrivacy":
			return "Privacy";
		case "lblIpAddress":
			return "IP-address";
		case "lblStations":
			return "Stations";
		case "lblWaitMessageLoadStations":
			return "Load available stations...";
		case "lblCameras":
			return "Cameras";
		case "lblIndoorCameras":
			return "Indoor Cameras";
		case "lblSoloCameras":
			return "Solocams";
		case "lblStarlightCameras":
			return "4G LTE Cameras";
		case "lblDoorbellCameras":
			return "Doorbell with Cameras";
		case "lblOutdoorLightCameras":
			return "Outdoorlights with Camera";
		case "lblLocks":
			return "Locks";
		case "lblKeypads":
			return "Keypads";
		case "lblSensors":
			return "Sensors";
		case "lblUnknownDevice":
			return "Unknown Devices";
		case "lblDevices":
			return "Devices";
		case "lblWaitMessageLoadDevices":
			return "Load available devices...";
		case "titleDeactivatedOffline":
			return "This device is currently offline.";
		case "titleDeactivatedOfflineHint":
			return "To be able to make settings for this device, bring the device back into the reception range of the HomeBase or the WLAN.";
		case "titleDeactivatedLowBattery":
			return "This device has been deactivated due to low battery power.";
		case "titleDeactivatedLowBatteryHint":
			return "To be able to make settings for this device, charge the device again.";
		case "titleDeactivatedRemoveAndReadd":
			return "The Device was removed.";
		case "titleDeactivatedRemoveAndReaddHint":
		case "titleDeactivatedResetAndReaddHint":
			return "To be able to make settings for this device, readd the device to your account.";
		case "titleDeactivatedResetAndReadd":
			return "The Device was reset.";
		case "titleDeactivatedUnknownState":
			return "The Device has an unknown state.";
		case "titleDeactivatedUnknownStateHint":
			return "To be able to make settings for the device, please check the device in your App.";
		case "titleWifiSignalLevel":
			return "WiFi reception strength";
		case "lblBatteryLevel":
			return "Charge status of the battery";
		case "lblTemperature":
			return "Temperature";
		case "lblState":
			return "State";
		case "lblLastEvent":
			return "Last event";
		case "lblNotAvailable":
			return "not available";
		case "lblUnknown":
			return "unknown";
		case "lblLastRecording":
			return "Last recording";
		case "lblLastRecordingThumbnail":
			return "Thumbnail";
		case "lblLastRecordingNotAvailable":
			return "no recording available";
		case "lblStationDeviceModalHeader":
			return "Integrated Device";
		case "lblStationDeviceModalDescription":
			return `The selected device ${options[0]} (${options[1]}) is a device that is operated without a base station. For this reason, there is a base station with the same serial number for this device. However, the base station is not displayed in the device overview.`
		case "lblStationDeviceModalActionToPerform":
			return "You can choose below whether you want to make settings for the base station or the device.";
		case "btnGetSettingsForStation":
			return "Settings for Station";
		case "btnGetSettingsForDevice":
			return "Settings for Device";
		case "btnClose":
			return "Close";
		case "lblNotSupportedDeviceHeading":
			return "This device is not fully supported.";
		case "lblNotSupportedDeviceMessage":
			return `You can help with further development by making the information from the two queries "<a href="${options[0]}" target=”_blank” class="alert-link">DeviceProperties</a>" and "<a href="${options[1]}" target=”_blank” class="alert-link">DevicePropertiesMetadata</a>" available to the developer.`
		case "lblNotSupportedDeviceMessageSolo":
			return `As the device is an integrated device, please also making the information from the two queries "<a href="${options[0]}" target=”_blank” class="alert-link">DeviceProperties</a>" and "<a href="${options[1]}" target=”_blank” class="alert-link">DevicePropertiesMetadata</a>" available to the developer.`
		case "lblNotSupportedDeviceSubText":
			return "The queries return results where serial numbers have been truncated and links removed. Please check whether there is any other data that you would like to remove.";
		case "lblNotSupportedDeviceNoSaving":
			return "It is currently not possible to save the settings.";
		case "lblUnknownDeviceHeading":
			return "This device is not supported.";
		case "lblUnknownDeviceMessage":
			return `The device is unknown. You can contact the developer, stating the model number (${options[0]}) and the name of the device, so that the device can possibly be implemented.`
		case "lblUnknownDeviceNoSaving":
			return "It is currently not possible to save the settings.";
		case "lblHeaderCommon":
			return "Common";
		case "lblEnabled":
			return "Device activated";
		case "lblAntitheftDetection":
			return "Anti-theft detection";
		case "lblStatusLed":
			return "Status LED";
		case "lblImageMirrored":
			return "Mirroring image";
		case "lblMotionAutoCruise":
			return "Auto-Cruise";
		case "lblAutoCalibration":
			return "Automatic Calibration";
		case "lblLight":
			return "Spotlight";
		case "lblHeaderMotionDetection":
			return "Motion Detection";
		case "lblMotionDetection":
			return "Motion Detection";
		case "lblMotionDetectionSensitivity":
			return "Detection Sensitivity";
		case "lblMotionDetectionType":
			return "Detection Type";
		case "lblRotationSpeed":
			return "Rotation Speed";
		case "lblMotionTracking":
			return "Motion Tracking";
		case "lblHeaderLoiteringDetection":
			return "Loitering Detection";
		case "lblLoiteringDetection":
			return "Loitering Detection";
		case "lblLoiteringDetectionRange":
			return "Loitering Detection Range";
		case "lblLoiteringDetectionLength":
			return "Loitering Detection Detection Length";
		case "lblLoiteringResponse":
			return "Loitering Response";
		case "lblHeaderDeliveryGuard":
			return "Delivery Guard";
		case "lblDeliveryGuard":
			return "Delivery Guard";
		case "lblDeliveryGuardPackageGuarding":
			return "Delivery Guard Package Guarding";
		case "lblDeliveryGuardUncollectedPackageAlert":
			return "Delivery Guard Uncollected Package Alert";
		case "lblDeliveryGuardPackageLiveCheckAssistance":
			return "Delivery Guard Package Live Check Assistance";
		case "lblHeaderRingAutoResponse":
			return "Ring Auto Response";
		case "lblRingAutoResponse":
			return "Ring Auto Response";
		case "lblRingAutoResponseVoice":
			return "Ring Auto Response Voice";
		case "lblHeaderSoundDetection":
			return "Sound Detection";
		case "lblSoundDetection":
			return "Sound Detection";
		case "lblSoundDetectionSensitivity":
			return "Sound Detection Sensitivity";
		case "lblSoundDetectionType":
			return "Sound Detection Type";
		case "lblSoundDetectionRoundLook":
			return "Round look after sound detection";
		case "lblHeaderPowerManager":
			return "Power Manager";
		case "lblPowerWorkingMode":
			return "Power Working Mode";
		case "lblPowerSource":
			return "Power Source";
		case "lblDetectionStatistic":
			return "Detection Statistic";
		case "lblHeaderContinuousRecording":
			return "Continuous Recording";
		case "lblContinuousRecording":
			return "Continuous Recording";
		case "lblContinuousRecordingType":
			return "Continuous Recording Type";
		case "lblHeaderVideoSettings":
			return "Video Settings";
		case "lblStatusLed":
			return "Status LED";
		case "lblWatermark":
			return "Watermark";
		case "lblVideoRecordingQuality":
			return "Recording Quality";
		case "lblVideoStreamingQuality":
			return "Streaming Quality";
		case "lblNightvision":
			return "Nightvision";
		case "lblVideoWdr":
			return "HDR";
		case "lblFlickerAdjustment":
			return "Picture Refresh Rate";
		case "lblHeaderAudioSettings":
			return "Audio Settings";
		case "lblMicrophone":
			return "Microphone";
		case "lblSpeaker":
			return "Speaker";
		case "lblRingtoneVolume":
			return "Ringtone Volume";
		case "lblHeaderDualCamWatchViewMode":
			return "DualCam Watch View Mode";
		case "lblDualCamWatchViewMode":
			return "DualCam Watch View Mode";
		case "lblChimeSettings":
			return "Chime Settings";
		case "lblChimeIndoor":
			return "USB Chime Indoor";
		case "lblChimeHomebase":
			return "HomeBase Chime";
		case "lblHeaderLightSettings":
			return "Light Settings";
		case "lblManualLighting":
			return "Manual Lighting";
		case "lblScheduleLighting":
			return "Schedule Lighting";
		case "lblMotionLighting":
			return "Motion Lighting";
		case "lblChirpSettings":
			return "Chirp Settings";
		case "lblChirpTone":
			return "Chirp Tone";
		case "lblHeaderPanAndTilt":
			return "Pan and Tilt";
		case "lblMoveToPreset":
			return "Move to Preset Position";
		case "lblHeaderNotificationSettings":
			return "Notification Settings";
		case "lblNotification":
			return "Enable Notification";
		case "lblNotificationType":
			return "Notification Type";
		case "lblNotificationSend":
			return "Notification Send";
		case "lblNotificationIntervalTime":
			return "Time between Notifications";
		case "lblHeaderInteractionCCU":
			return "Interacting with the CCU";
		case "lblInteractionMotion":
			return "Response on Motion";
		case "lblInteractionRadarMotion":
			return "Response on Radar detected Motion";
		case "lblInteractionPerson":
			return "Response on Detected Person";
		case "lblInteractionPet":
			return "Response on Detected Pet";
		case "lblInteractionCrying":
			return "Response on Crying";
		case "lblInteractionSound":
			return "Response on Sound";
		case "lblInteractionStrangerPerson":
			return "Response on Detected Stranger Person";
		case "lblInteractionVehicle":
			return "Response on Detected Vehicle";
		case "lblInteractionDog":
			return "Response on Detected Dog";
		case "lblInteractionDogLick":
			return "Response on Detected DogLick";
		case "lblInteractionDogPoop":
			return "Response on Detected DogPoop";
		case "lblInteractionRing":
			return "Response on Ringing";
		case "lblInteractionSensorOpen":
			return "Response on open shutter contact";
		case "lblInteractionSensorClose":
			return "Response on close shutter contact";
		case "lblNotSupportedStationHeading":
			return "This device is not fully supported.";
		case "lblNotSupportedStationMessage":
			return `You can help with further development by making the information from the two queries "<a href="${options[0]}" target=”_blank” class="alert-link">StationProperties</a>" and "<a href="${options[1]}" target=”_blank” class="alert-link">StationPropertiesMetadata</a>" available to the developer.`
		case "lblNotSupportedStationMessageSolo":
			return `As the device is an integrated device, please also making the information from the two queries "<a href="${options[0]}" target=”_blank” class="alert-link">StationProperties</a>" and "<a href="${options[1]}" target=”_blank” class="alert-link">StationPropertiesMetadata</a>" available to the developer.`
		case "lblNotSupportedStationSubText":
			return "The queries return results where serial numbers have been truncated and links removed. Please check whether there is any other data that you would like to remove.";
		case "lblNotSupportedStationNoSaving":
			return "It is currently not possible to save the settings.";
		case "lblUnknownStationHeading":
			return "This device is not supported.";
		case "lblUnknownStationMessage":
			return `The device is unknown. You can contact the developer, stating the model number (${options[0]}) and the name of the device, so that the device can possibly be implemented.`
		case "lblUnknownStationNoSaving":
			return "It is currently not possible to save the settings.";
		case "lblAlarmTone":
			return "Alarm Tone";
		case "lblPromptVolume":
			return "Prompt Volume";
		case "lblPushNotification":
			return "Push Notification";
		case "lblPushNotificationDesc":
			return "Send Push Notification in case of:";
		case "lblTimeSettings":
			return "Time Settings";
		case "lblTimeZone":
			return "Time Zone";
		case "lblTimeFormat":
			return "Time Format";
		case "lblCrossCameraTracking":
			return "Cross Camera Surveillance";
		case "lblContinuousTrackingTime":
			return "Cross Camera Surveillance Lenghth";
		case "lblTrackingAssistance":
			return "Cross Camera Surveillance Assistance";
		case "lblStorageInfoHeader":
			return "Storage Information";
		case "lblInternalStorage":
			return "Internal Storage";
		case "lblInternalEmmcStorage":
			return "Internal EMMC Storage";
		case "lblHddStorage":
			return "Harddrive Storage"
		case "lblLastStateChange":
			return "Last State Change";
		case "lblHouseManagementStationsAndDevicesOfHome":
			return `Stations and Devices of '${options[0]}'`;
		case "lblUDPPortStationLabel":
			return `UDP port to connect with station ${options[0]} (${options[1]}).`;
		case "lblUDPPortStationPlaceholder":
			return `UDP port ${options[0]}`;
		case "lblUDPPortStationSubText":
			return "The specified port must not be in use and must not be assigned to any other station.";
		case "lblUDPPortStationError":
			return "Please enter a number between 1 and 65535. This number must not be assigned to any other station.";
		case "lblTokenNoToken":
			return "No token is saved. A new token will be generated the next time you log in successfully.";
		case "lblTokenOk":
			return `The token currently in use expires on ${options[0]}. It will be updated before then.`;
		case "lblTokenUnknown":
			return `The expiry date of the token is unknown ('${options[0]}').`;
		case "lblSystemVariableAvailable":
			return "System Variable available";
		case "lblSystemVariableCreate":
			return "Create System Variable";
		case "lblSystemVariableRemove":
			return "Remove System Variable";
		case "lblSystemVariableUpdate":
			return "Update System Variable";
		case "lblSettingsTroubleShootingDisable":
			return "Disable troubleshooting";
		case "lblSettingsTroubleShootingEnable":
			return "Activate troubleshooting";
		case "lblLogLevelToHighTraceMessage":
			return "You have selected the scope of the logging so that TRACE and DEBUG information are also logged. This can lead to a very large log file. For normal operation, select the logging level information or lower.";
		case "lblLogLevelToHighDebugMessage":
			return "You have selected the scope of the logging so that DEBUG information are also logged. This can lead to a very large log file. For normal operation, select the logging level information or lower.";
		case "lblLogLevelToHighSubText":
			return "This setting remains permanently active even after a restart of the add-on or the CCU.";
		case "lblFileIsEmpty":
			return `The file '${options[0]}' is empty.`;
		case "lblFileIsNotAvailable":
			return `The file '${options[0]}' does not exists.`;
		case "lblHeaderApiSettingsErrorCaptcha":
			return "Login attempt is performed";
		case "lblMessageApiSettingsErrorCaptcha":
			return "Please wait while the captcha code is checked. You will then be redirected to the previous page.";
		case "lblHeaderApiSettingsError":
			return "Service will be restarted";
		case "lblMessageApiSettingsError":
			return "Please wait while the service is restarted. You will then be redirected to the previous page.";
		case "emmcCapacity":
		case "hddCapacity":
			return "Storage Capacity";
		case "emmcCapacityUsed":
		case "hddCapacityUsed":
			return "Used Storage Capacity";
		case "emmcCapacityAvailable":
		case "hddCapacityAvailable":
			return "Available Storage Capacity";
		case "emmcVideoUsed":
		case "hddVideoUsed":
			return "Used Storage Capacity by Videos";
		case "emmcHealthState":
			return "Health State";
		case "hddHddType":
			return "Harddrive Type";
		case "hddIsHdd":
			return "HDD";
		case "hddIsSsd":
			return "SSD";
		case "hddIsUnknown":
			return "unknown";
		case "hddCurrentTemperature":
			return "Current Temperature";
		case "titleDeviceDisabled":
			return "Device disabled";
		case "strLoadingVersionInfo":
			return "Loaging Version Informationen...";
		case "strLoadingSettings":
			return "Loading Settings...";
		case "strLoadingHouses":
			return "Loading Houses...";
		case "strLoadingStations":
			return "Loading Stations...";
		case "strLoadingSystemVariables":
			return "Loading System Variables...";
		default:
			return `{${content}}`;
	}
}

function translateString(content) {
	switch(content) {
		case "strLoadingSettings":
			return "Loading Settings...";
		case "strWaitWhileLoading":
			return "Loading...";
		case "strOk":
			return "OK";
		case "strLow":
			return "low";
		case "strInteractionSave":
			return "Save";
		case "strInteractionUnstoredTest":
			return "Test interaction"
		case "strInteractionStoredTest":
			return "Test saved interaction";
		case "strInteractionDelete":
			return "Delete";
		case "strUserDefiniedSpec":
			return "User Defined";
		case "strPowerManagerSpec":
			return "Power Manager";
		case "strSettings":
			return "Settings";
		case "strCurrentState":
			return "Current State";
		case "strLastChargingDays":
			return "Last Charging Days";
		case "strWorkingDays":
			return "Working Days";
		case "strEventsDetected":
			return "Events Detected";
		case "strEventsRecorded":
			return "Events Recorded";
		case "strRebootStation":
			return "Reboot Station";
		case "strActive":
			return "Active";
		case "strInactive":
			return "Inactive";
		case "strActivate":
			return "Activate";
		case "strDeactivate":
			return "Deactivate";
		case "strLoadingCountries":
			return "Loading Countries...";
		case "strLoadingStations":
			return "Loading Stations...";
		case "strSystemVariablesTableHeaderState":
			return "State";
		case "strSystemVariablesTableHeaderSVName":
			return "System Variable Name";
		case "strSystemVariableAvailable":
			return "Created";
		case "strSystemVariableNotAvailable":
			return "Not Created";
		case "strSystemVariablesUnusedHintHeader":
			return "Obsolete System Variablen";
		case "strSystemVariablesUnusedHintMessage":
			return "The following system variables beginning with 'eufy' are no longer used and can be removed.";
		case "strSettingsSaving":
			return "Settings are saved...";
		case "strSystemVariableCreating":
			return "Creating the System Variables...";
		case "strSystemVariableUnusedRemoving":
			return "Loading Obsolete System Variables...";
		case "strUploadConfigUploadingAndTesting":
			return "File is uploaded and checked...";
		case "strLoadingLogFile":
			return "Loading Log File...";
		case "strAddOnName":
			return "eufy Security AddOn";
		case "strClientName":
			return "eufy Security Client";
		case "strHomeMaticApi":
			return "HomeMatic API";
		case "strWebsite":
			return "Website";
		case "strServiceRunning":
			return "Service running.";
		case "strServiceStarted":
			return "Service has been started.";
		case "strWaitWhileLogin":
			return "Wait for login attempt...";
		case "strWaitWhileInit":
			return "Wait for initialization of the service...";
		case "strLoginFinished":
			return "Login finished. You will be redirected...";
		case "strInitFinished":
			return "Service has been initialized. You will be redirected...";
		case "strLanguageFile":
			return "Language";
		case "strVersion":
			return "Version";
		case "strMoveToPreset01":
			return "Move to Position 1";
		case "strMoveToPreset02":
			return "Move to Position 2";
		case "strMoveToPreset03":
			return "Move to Position 3";
		case "strMoveToPreset04":
			return "Move to Position 4";
		case "strEditInteractionStart":
			return "Expand for editing";
		case "strEditInteractionEnd":
			return "Collapse";
		case "strUnknownDevice":
			return "unknown Device";
		default:
			return `{${content}}`;
	}
}

function translateSystemVariableInfo(info) {
	switch(info) {
		case "eufyCurrentState":
			return "Current state of the eufy Systems";
		case "eufyLastConnectionResult":
			return "Result of last communication with eufy";
		case "eufyLastConnectionTime":
			return "Time of last communication with eufy";
		case "eufyLastStatusUpdateTime":
			return "Time of last update of the eufy system state";
		case "eufyLastModeChangeTime":
			return "Time of last eufy mode change";
		case "eufyCentralState":
			return "Current state of the eufy Station";
		case "eufyLastModeChangeTimeStation":
			return "Time of last mode change of station";
		case "eufyCameraVideoTime":
			return "Time of last recording of camera";
		default:
			return `{${info}}`;
	}
}

function translateGuardMode(guardMode) {
	switch(guardMode) {
		case 0:
			return "Away";
		case 1:
			return "Home";
		case 2:
			return "Schedule";
		case 3:
			return "Custom 1";
		case 4:
			return "Custom 2";
		case 5:
			return "Custom 3";
		case 6:
			return "Off";
		case 47:
			return "Geofencing";
		case 63:
			return "Disabled";
		default:
			return "Unknown";
	}
}

function translatePropertyName(propertyName) {
	switch(propertyName) {
		case "enabled":
			return "Enable Device";
		case "antitheftDetection":
			return "Enable Antitheft Detection";
		case "statusLed":
			return "Enable Status LED";
		case "imageMirrored":
			return "Enable Image Mirroring";
		case "motionAutoCruise":
			return "Enable Auto-Cruise";
		case "autoCalibration":
			return "Enable Automatic Calibration";
		case "light":
			return "Enable Spotlight";
		case "motionDetection":
			return "Enable Motion Detection";
		case "motionDetectionSensitivity":
			return "Motion Detection Sensitivity";
		case "motionDetectionType":
			return "Motion Detection Type";
		case "motionDetectionTypeHuman":
			return "Human Detection";
		case "motionDetectionTypeHumanRecognition":
			return "Facial Detection";
		case "motionDetectionTypePet":
			return "Pet Detection";
		case "motionDetectionTypeVehicle":
			return "Vehicle Detection";
		case "motionDetectionTypeAllOtherMotions":
			return "All Other Motions";
		case "rotationSpeed":
			return "Rotation Speed";
		case "motionTracking":
			return "Enable Motion Tracking";
		case "soundDetection":
			return "Enable Sound Detection";
		case "soundDetectionType":
			return "Sound Detection Type";
		case "soundDetectionSensitivity":
			return "Sound Detection Sensitivity";
		case "soundDetectionRoundLook":
			return "Enable Round Look After Sound Detection";
		case "recordingClipLength":
			return "Recording Clip Length";
		case "recordingRetriggerInterval":
			return "Recording Retrigger Interval";
		case "recordingEndClipMotionStops":
			return "Stop Recording when Motion Stops";
		case "powerSource":
			return "Power Source";
		case "continuousRecording":
			return "Enable Continuous Recording";
		case "continuousRecordingType":
			return "Continuous Recording Type";
		case "watermark":
			return "Logo and Watermark";
		case "videoRecordingQuality":
			return "Recording Quality";
		case "videoStreamingQuality":
			return "Streaming Quality";
		case "autoNightvision":
			return "Enable Auto Nightvision";
		case "nightvision":
			return "Nightvision Type";
		case "flickerAdjustment":
			return "Picture Refresh Rate";
		case "lightSettingsEnable":
			return "Enable Light Settings";
		case "lightSettingsBrightnessManual":
		case "lightSettingsBrightnessSchedule":
		case "lightSettingsBrightnessMotion":
			return "Light Brightness";
		case "lightSettingsManualLightingActiveMode":
		case "lightSettingsScheduleLightingActiveMode":
		case "lightSettingsMotionLightingActiveMode":
			return "Light Mode";
		case "lightSettingsManualDailyLighting":
		case "lightSettingsScheduleDailyLighting":
		case "lightSettingsMotionDailyLighting":
			return "Day Light Color";
		case "lightSettingsManualDynamicLighting":
		case "lightSettingsScheduleDynamicLighting":
		case "lightSettingsMotionDynamicLighting":
			return "Dynamic Lighting";
		case "lightSettingsMotionTriggered":
			return "Enable Light When Motion Detected";
		case "lightSettingsMotionTriggeredTimer":
			return "Power-on time after Motion triggered";
		case "lightSettingsMotionActivationMode":
			return "Detection speed for Motion";
		case "microphone":
			return "Enable Microphone";
		case "audioRecording":
			return "Enable Audio Recording";
		case "speaker":
			return "Enable Speaker";
		case "speakerVolume":
			return "Volume";
		case "ringtoneVolume":
			return "Ringtone Volume";
		case "notificationPerson":
			return "On Person Detected";
		case "notificationPet":
			return "On Pet Detected";
		case "notificationCrying":
			return "On Crying Detected";
		case "notificationAllSound":
			return "On All Sound";
		case "notificationRing":
			return "On Ringing";
		case "notificationMotion":
			return "On Motion";
		case "notificationRadarDetector":
			return "On Motion Detected by Radar";
		case "notificationAllOtherMotion":
			return "On All other Motion";
		case "alarmTone":
			return "Select Alarm Tone";
		case "alarmVolume":
			return "Alarm Volume";
		case "promptVolume":
			return "Prompt Volume";
		case "notificationSwitchModeSchedule":
			return "Switch Mode to Mode Schedule";
		case "notificationSwitchModeGeofence":
			return "Switch Mode to Mode Geofence";
		case "notificationSwitchModeApp":
			return "Switch Mode to Mode by App";
		case "notificationSwitchModeKeypad":
			return "Switch Mode to Mode by Keypad";
		case "notificationStartAlarmDelay":
			return "Start Alarm Delay";
		case "timeZone":
			return "Select Time Zone";
		case "timeFormat":
			return "Select Time Format";
		case "crossCameraTracking":
			return "Enable Cross Camera Surveillance";
		case "continuousTrackingTime":
			return "Cross Camera Surveillance Assistance Length";
		case "trackingAssistance":
			return "Enable Cross Camera Surveillance Assistance";
		case "sdCapacityUsedPercent":
		case "emmcCapacityUsedPercent":
		case "hddCapacityUsedPercent":
			return "Storage usage";
		case "sdCapacity":
			return "Storage capacity";
		case "sdCapacityUsed":
			return "Used storage capacity";
		case "sdCapacityAvailable":
			return "available storage capacity";
		case "rebootStation":
			return "Reboot Station";
		case "motionDetectionSensitivityMode":
			return "Detection Sensitivity Mode";
		case "motionDetectionSensitivityStandard":
			return "Detection Sensitivity - Standard";
		case "motionDetectionSensitivityAdvancedA":
			return "Detection Sensitivity - Advanced - A";
		case "motionDetectionSensitivityAdvancedB":
			return "Detection Sensitivity - Advanced - B";
		case "motionDetectionSensitivityAdvancedC":
			return "Detection Sensitivity - Advanced - C";
		case "motionDetectionSensitivityAdvancedD":
			return "Detection Sensitivity - Advanced - D";
		case "motionDetectionSensitivityAdvancedE":
			return "Detection Sensitivity - Advanced - E";
		case "motionDetectionSensitivityAdvancedF":
			return "Detection Sensitivity - Advanced - F";
		case "motionDetectionSensitivityAdvancedG":
			return "Detection Sensitivity - Advanced - G";
		case "motionDetectionSensitivityAdvancedH":
			return "Detection Sensitivity - Advanced - H";
		case "captionTimeFrom":
			return "Start Time";
		case "captionTimeTo":
			return "End Time";
		case "timeUntil":
			return "until";
		case "loiteringDetection":
			return "Enable Loitering Detection";
		case "loiteringDetectionRange":
			return "Loitering Detection Range";
		case "loiteringDetectionLength":
			return "Loitering Detection Length";
		case "loiteringCustomResponsePhoneNotification":
			return "Enable Notification by App";
		case "loiteringCustomResponseAutoVoiceResponse":
			return "Enable Auto Voice Response";
		case "loiteringCustomResponseAutoVoiceResponseVoice":
			return "Auto Voice Response Voice";
		case "loiteringCustomResponseTimespan":
			return "Response Timespan";
		case "loiteringCustomResponseTimeFrom":
			return "Response Time Start";
		case "loiteringCustomResponseTimeTo":
			return "Response Time End";
		case "loiteringCustomResponseHomeBaseNotification":
			return "Enable Notification by HomeBase";
		case "deliveryGuard":
			return "Enable Delivery Guard";
		case "deliveryGuardPackageGuarding":
			return "Enable Package Guarding";
		case "deliveryGuardPackageGuardingVoiceResponseVoice":
			return "Package Guarding Voice";
		case "deliveryGuardPackageGuardingActivatedTimespan":
			return "Package Guarding Activated Timespan";
		case "deliveryGuardPackageGuardingActivatedTimeFrom":
			return "Package Guarding Time Start";
		case "deliveryGuardPackageGuardingActivatedTimeTo":
			return "Package Guarding Time End";
		case "deliveryGuardUncollectedPackageAlert":
			return "Enable Uncollected Package Alert";
		case "deliveryGuardUncollectedPackageAlertTimeToCheck":
			return "Uncollected Package Alert Time To Check";
		case "deliveryGuardPackageLiveCheckAssistance":
			return "Enable Package Live Check Assistance";
		case "ringAutoResponse":
			return "Enable Ring Auto Response";
		case "ringAutoResponseVoiceResponse":
			return "Enable Ring Auto Response Voice Response";
		case "ringAutoResponseVoiceResponseVoice":
			return "Voice Response Voice";
		case "ringAutoResponseTimespan":
			return "Auto Response Timespan";
		case "ringAutoResponseTimeFrom":
			return "Auto Response Time Start";
		case "ringAutoResponseTimeTo":
			return "Auto Response Time End";
		case "videoWdr":
			return "Enable HDR";
		case "chimeIndoor":
			return "Enable USB Chime indoor";
		case "chimeHomebase":
			return "Enable HomeBase chime";
		case "chimeHomebaseRingtoneVolume":
			return "HomeBase Ringtone Volume";
		case "chimeHomebaseRingtoneType":
			return "HomeBase Ringtone Type";
		case "dualCamWatchViewMode":
			return "DualCam Watch View Mode";
		case "notification":
			return "Enable Notification";
		case "chirpTone":
			return "Enable Chirp Tone";
		case "chirpVolume":
			return "Chirp Volume";
		case "motionEventTarget":
		case "radarMotionEventTarget":
		case "personEventTarget":
		case "petEventTarget":
		case "soundEventTarget":
		case "cryingEventTarget":
		case "strangerPersonEventTarget":
		case "vehicleEventTarget":
		case "dogEventTarget":
		case "dogLickEventTarget":
		case "dogPoopEventTarget":
		case "ringEventTarget":
		case "sensorOpenEventTarget":
		case "sensorCloseEventTarget":
			return "CCU on which the interaction is to be executed";
		case "motionEventTargetHint":
		case "radarMotionEventTargetHint":
		case "personEventTargetHint":
		case "petEventTargetHint":
		case "soundEventTargetHint":
		case "cryingEventTargetHint":
		case "strangerPersonEventTargetHint":
		case "vehicleEventTargetHint":
		case "dogEventTargetHint":
		case "dogLickEventTargetHint":
		case "dogPoopEventTargetHint":
		case "ringEventTargetHint":
		case "sensorOpenEventTargetHint":
		case "sensorCloseEventTargetHint":
			return "Please enter 'localhost', the IP-address or the DNS-name of the target CCU without 'http://' or 'https://'.";
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
			return "Establish connection via HTTPS";
		case "motionEventUseLocalCertificate":
		case "radarMotionEventUseLocalCertificate":
		case "personEventUseLocalCertificate":
		case "petEventUseLocalCertificate":
		case "soundEventUseLocalCertificate":
		case "cryingEventUseLocalCertificate":
		case "strangerPersonEventUseLocalCertificate":
		case "vehicleEventUseLocalCertificate":
		case "dogEventUseLocalCertificate":
		case "dogLickEventUseLocalCertificate":
		case "dogPoopEventUseLocalCertificate":
		case "ringEventUseLocalCertificate":
		case "sensorOpenEventUseLocalCertificate":
		case "sensorCloseEventUseLocalCertificate":
			return "Use certificate of the local CCU";
		case "motionEventRejectUnauthorized":
		case "radarMotionEventRejectUnauthorized":
		case "personEventRejectUnauthorized":
		case "petEventRejectUnauthorized":
		case "soundEventRejectUnauthorized":
		case "cryingEventRejectUnauthorized":
		case "strangerPersonEventRejectUnauthorized":
		case "vehicleEventRejectUnauthorized":
		case "dogEventRejectUnauthorized":
		case "dogLickEventRejectUnauthorized":
		case "dogPoopEventRejectUnauthorized":
		case "ringEventRejectUnauthorized":
		case "sensorOpenEventRejectUnauthorized":
		case "sensorCloseEventRejectUnauthorized":
			return "Cancel connection if certificate check failed";
		case "motionEventUser":
		case "radarMotionEventUser":
		case "personEventUser":
		case "petEventUser":
		case "soundEventUser":
		case "cryingEventUser":
		case "strangerPersonEventUser":
		case "vehicleEventUser":
		case "dogEventUser":
		case "dogLickEventUser":
		case "dogPoopEventUser":
		case "ringEventUser":
		case "sensorOpenEventUser":
		case "sensorCloseEventUser":
			return "User name for logging in to the CCU";
		case "motionEventUserHint":
		case "radarMotionEventUserHint":
		case "personEventUserHint":
		case "petEventUserHint":
		case "soundEventUserHint":
		case "cryingEventUserHint":
		case "strangerPersonEventUserHint":
		case "vehicleEventUserHint":
		case "dogEventUserHint":
		case "dogLickEventUserHint":
		case "dogPoopEventUserHint":
		case "ringEventUserHint":
		case "sensorOpenEventUserHint":
		case "sensorCloseEventUserHint":
			return "The user name is only required if you have activated authentication in the CCU settings and select a CCU other than the one on which this add-on is running.";
		case "motionEventPassword":
		case "radarMotionEventPassword":
		case "personEventPassword":
		case "petEventPassword":
		case "soundEventPassword":
		case "cryingEventPassword":
		case "strangerPersonEventPassword":
		case "vehicleEventPassword":
		case "dogEventPassword":
		case "dogLickEventPassword":
		case "dogPoopEventPassword":
		case "ringEventPassword":
		case "sensorOpenEventPassword":
		case "sensorCloseEventPassword":
			return "Password for logging in to the CCU";
		case "motionEventPasswordHint":
		case "radarMotionEventPasswordHint":
		case "personEventPasswordHint":
		case "petEventPasswordHint":
		case "soundEventPasswordHint":
		case "cryingEventPasswordHint":
		case "strangerPersonEventPasswordHint":
		case "vehicleEventPasswordHint":
		case "dogEventPasswordHint":
		case "dogLickEventPasswordHint":
		case "dogPoopEventPasswordHint":
		case "ringEventPasswordHint":
		case "sensorOpenEventPasswordHint":
		case "sensorCloseEventPasswordHint":
			return "The password is only required if you have activated authentication in the CCU settings and select a CCU other than the one on which this add-on is running.";
		case "motionEventCommand":
		case "radarMotionEventCommand":
		case "personEventCommand":
		case "petEventCommand":
		case "soundEventCommand":
		case "cryingEventCommand":
		case "strangerPersonEventCommand":
		case "vehicleEventCommand":
		case "dogEventCommand":
		case "dogLickEventCommand":
		case "dogPoopEventCommand":
		case "ringEventCommand":
		case "sensorOpenEventCommand":
		case "sensorCloseEventCommand":
			return "Command to be executed";
		case "motionEventCommandHint":
		case "radarMotionEventCommandHint":
		case "personEventCommandHint":
		case "petEventCommandHint":
		case "soundEventCommandHint":
		case "cryingEventCommandHint":
		case "strangerPersonEventCommandHint":
		case "vehicleEventCommandHint":
		case "dogEventCommandHint":
		case "dogLickEventCommandHint":
		case "dogPoopEventCommandHint":
		case "ringEventCommandHint":
		case "sensorOpenEventCommandHint":
		case "sensorCloseEventCommandHint":
			return "The command to be entered here should be tested in advance using the script test function of the CCU.";
		case "notificationIntervalTime":
			return "Duration between Notifications";
		default:
			return propertyName;
	}
}

function translateDeviceStateValue(state, propertyName, value) {
	switch(state) {
		case "Humans only":
		case "Person Alerts":
			return "Humans only";
		case "Facial Alerts":
			return "Facial Alerts";
		case "All motions":
		case "All Alerts":
			return "All motions";
		case "Person":
			return "Person";
		case "Pet":
			return "Pet";
		case "Person and Pet":
			return "Person and Pet";
		case "All other motions":
			return "All other motions";
		case "Person and all other motions":
			return "Person and all other motions";
		case "Pet and all other motions":
			return "Pet and all other motions";
		case "Person, Pet and all other motions":
			return "Person, Pet and all other motions";
		case "sec":
			return "sec";
		case "Optimal Battery Life":
			return "Optimal Battery Life";
		case "Balance Surveillance":
			return "Balance Surveillance";
		case "Optimal Surveillance":
			return "Optimal Surveillance";
		case "Custom Recording":
			return "Custom Recording";
		case "Battery":
			return "Battery";
		case "Solar Panel":
			return "Solar Panel";
		case "Charging":
			return "Charging";
		case "Not Charging":
			return "Not Charging";
		case "Always":
			return "Always";
		case "Schedule":
			return "Schedule"
		case "Off":
			switch(propertyName) {
				case "watermark":
					if(value == 1) {
						return "Without Logo";
					}
					return "Off";
				case "nightvision":
					return "No Nightvision";
				case "statusLed":
					return "Off";
				default:
					return state;
			}
		case "On":
			switch(propertyName) {
				case "watermark":
					return "With Logo";
				case "nightvision":
					return "use Nightvision";
				default:
					return state;
			}
		case "Timestamp":
			return "Timestamp";
		case "Timestamp and Logo":
			return "Timestamp and Logo";
		case "B&W Night Vision":
			return "B&W Night Vision";
		case "Color Night Vision":
			return "Color Night Vision";
		case "Low":
			switch(propertyName) {
				case "speakerVolume":
					return "Quiet";
				case "videoStreamingQuality":
				case "soundDetectionSensitivity":
					return "Low";
				case "lightSettingsBrightnessManual":
					return "Dark";
				case "rotationSpeed":
					return "Slow";
				default:
					return state;
			}
		case "Min":
			switch(propertyName) {
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "Min";
			}
		case "Medium":
			switch(propertyName) {
				case "speakerVolume":
				case "videoStreamingQuality":
				case "lightSettingsBrightnessManual":
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "Medium";
				default:
					return state;
			}
		case "High":
			switch(propertyName) {
				case "speakerVolume":
					return "Loud";
				case "videoStreamingQuality":
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "High";
				case "lightSettingsBrightnessManual":
					return "Bright";
				default:
					return state;
			}
		case "Max":
			switch(propertyName) {
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "Max";
			}
		case "All Sounds":
			return "All Sounds";
		case "Crying":
			return "Crying";
		case "Auto":
			return "Auto";
		case "Most Efficient":
			return "Most Efficient";
		case "Include Thumbnail":
		case "With Thumbnail":
			return "Include Thumbnail";
		case "Full Effect":
			return "Full Effect";
		case "Text Only":
			return "Text Only";
		case "Standard":
			return "Standard";
		case "Advanced":
			return "Advanced";
		case "Alarm sound 1":
			return "Alarm sound 1";
		case "Alarm sound 2":
			return "Alarm sound 2";
		case "within 2ft":
			return "within 0,6m (2ft)";
		case "within 4ft":
			return "within 1,2m (4ft)";
		case "within 6ft":
			return "within 1,8m (6ft)";
		case "within 8ft":
			return "within 2,4m (8ft)";
		case "within 10ft":
			return "within 3,0m (10ft)";
		case "3ft":
			return "0,9m (3ft)";
		case "6ft":
			return "1,8m (6ft)";
		case "10ft":
			return "3,0m (10ft)";
		case "15ft":
			return "4,6m (15ft)";
		case "20ft":
			return "6,1m (20ft)";
		case "Excuse me, can I help you":
			return "Excuse me, can I help you";
		case "Please leave it at the door":
			return "Please leave it at the door";
		case "We will be right there":
			return "We will be right there";
		case "Auto / Low Encoding":
			return "Streaming: Auto; Video: Low Encoding";
		case "Low / Low Encoding":
			return "Streaming: Low; Video: Low Encoding";
		case "Medium / Low Encoding":
			return "Streaming: Medium; Video: Low Encoding";
		case "High / Low Encoding":
			return "Streaming: High; Video: Low Encoding";
		case "Auto / High Encoding":
			return "Streaming: Auto; Video: High Encoding";
		case "Low / High Encoding":
			return "Streaming: Low; Video: High Encoding";
		case "Medium / High Encoding":
			return "Streaming: Medium; Video: High Encoding";
		case "High / High Encoding":
			return "Streaming: High; Video: High Encoding";
		case "Default":
			return "Default";
		case "Silent":
			return "Silent";
		case "Beacon":
			return "Beacon";
		case "Chord":
			return "Chord";
		case "Christmas":
			return "Christmas";
		case "Circuit":
			return "Circuit";
		case "Clock":
			return "Clock";
		case "Ding":
			return "Ding";
		case "Hillside":
			return "Hillside";
		case "Presto":
			return "Presto";
		case "Top-Left Picture-in-Picture":
			return "Top-Left Picture-in-Picture";
		case "Top-Right Picture-in-Picture":
			return "Top-Right Picture-in-Picture";
		case "Bottom-Left Picture-in-Picture":
			return "Bottom-Left Picture-in-Picture";
		case "Bottom-Right Picture-in-Picture":
			return "Bottom-Right Picture-in-Picture";
		case "Split-view":
			return "Split-view";
		case "Single view":
			return "Single view";
		case "Double view":
			return "Dual view";
		case "Daily":
			switch(propertyName) {
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "Day White";
			}
		case "Colored":
			switch(propertyName) {
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "Colored";
			}
		case "Dynamic":
			switch(propertyName) {
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "Dynamic";
			}
		case "Cold":
			switch(propertyName) {
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "Cold White";
			}
		case "Warm":
			switch(propertyName) {
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "Warm White";
			}
		case "Very warm":
			switch(propertyName) {
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "Very Warm White";
			}
		case "Aurora":
			switch(propertyName) {
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Aurora";
			}
		case "Warmth":
			switch(propertyName) {
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Warmth";
			}
		case "Let's Party":
			switch(propertyName) {
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Let's Party";
			}
		case "Fast":
			switch(propertyName) {
				case "lightSettingsMotionActivationMode":
					return "Fast";
			}
		case "Smart":
			switch(propertyName) {
				case "lightSettingsMotionActivationMode":
					return "Smart";
			}
		case "At night":
			return "At night";
		case "All day":
			return "All day";
		case "None":
			return "None";
		case "Water":
			return "Water";
		case "Classic":
			return "Classic";
		case "Light":
			return "Light";
		case "Open":
			return "Open";
		case "Closed":
			return "Closed";
		case "0":
			switch (propertyName) {
				case "notificationIntervalTime":
					return "kein Abstand";
				default:
					return state;
			}
		case "1":
			switch (propertyName) {
				case "notificationIntervalTime":
					return "1min";
				default:
					return state;
			}
		case "2":
			switch (propertyName) {
				case "notificationIntervalTime":
					return "2min";
				default:
					return state;
			}
		case "3":
			switch (propertyName) {
				case "notificationIntervalTime":
					return "3min";
				default:
					return state;
			}
		case "4":
			switch (propertyName) {
				case "notificationIntervalTime":
					return "4min";
				default:
					return state;
			}
		case "5":
			switch (propertyName) {
				case "notificationIntervalTime":
					return "5min";
				default:
					return state;
			}
		default:
			return state;
	}
}

function translateSdStatusMessageText(sdStatus) {
	switch(sdStatus) {
		case 0:
			return `The memory is OK.`;
		case 1:
			return `The memory is not formatted.`;
		case 3:
			return `The formatting of the memory has failed.`;
		case 4:
			return `No memory card is inserted.`;
		case 5:
			return `The memory is being formatted.`;
		case 6:
			return `The memory is full.`;
		case 2:
		case 7:
		case 8:
		case 9:
		case 10:
			return `Mounting has failed (${sdStatus}).`;
		case 11:
			return `The memory is being repaired.`;
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
			return `The memory check has failed (${sdStatus}).`;
		case 22:
			return `An I/O error has occurred.`;
		case 23:
			return `A problem was detected with the memory card.`;
		case 24:
			return `The memory is being mounted.`;
		default:
			return `The memory has an unknown status (${sdStatus}).`;
	}
}