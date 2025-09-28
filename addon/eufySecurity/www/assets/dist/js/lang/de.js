/*
Language File for German (de)
Schema v9.43
20250928
createdBy: PhilippEngler
*/
var language = "de";
var languageDesc = "deutsch";
var languageAuthor = "PhilippEngler";
var languageVersion = "20250928 (v9.43)";

function translateNavbarElement(element) {
    switch(element) {
        case "niMain":
            return "eufy Security für HomeMatic";
        case "niHome":
            return "Home";
        case "niDevices":
            return "Geräte";
        case "niStateChange":
            return "Statuswechsel";
        case "niSettings":
            return "Einstellungen";
        case "niLogfiles":
            return "Logdateien";
        case "niInfo":
            return "Über";
        default:
            return `{${element}}`;
    }
}

function translateStaticContentElement(element) {
    switch(element) {
        case "divIndexJumbotronAddonHeader":
            return "eufy Security AddOn für HomeMatic";
		case "divIndexJumbotronAddonInfo":		
			return "Dieses AddOn ermöglicht die Steuerung Ihres eufy Security Systems mit Ihrer CCU.";
        case "divIndexDescription01":
            return "Sie finden auf dieser Webseite alle Stationen und Geräte, die für den in den Einstellungen hinterlegten eufy Security Account verfügbar sind. Es werden Informationen zu den Geräten angezeigt, Sie können die Einstellungen der Geräte ändern und Sie können den aktuellen Modus Ihrers eufy Security Systems überprüfen und ändern.";
		case "divIndexDescription02":
			return "Mit Hilfe der durch das AddOn bereitgestellten API haben Sie die Möglichkeit, den Status Ihrer Geräte auch in Ihrer CCU abzubilden und Sie können ebenfalls den Modus überprüfen und ändern. Dazu gibt es verschiedene Endpunkte, die im Reiter Über beschrieben werden.";
		case "divDevicesIntroHeader":
			return "Geräte";
		case "divDevicesIntroMessage":
			return "Hier finden Sie alle Geräte, die dem angegebenen Account zugeordnet sind.";
		case "divStateChangeIntroHeader":
			return "Statusänderung";
		case "divStateChangeIntroMessage":
			return "Hier finden Sie den aktuellen Status Ihrer Stationen und können diesen entweder für eine Station oder für alle Stationen ändern.";
		case "divStateChangeAllStationsHeader":
			return "alle Stationen";
		case "divStateChangeAllStationsDesc":
			return "Ändern des Status aller Stationen";
		case "toastOkHeader":
			return "Änderung des Status.";
		case "toastOkText":
			return "Die Änderung des Status wurde erfolgreich durchgeführt.";
		case "toastFailedHeader":
			return "Änderung des Status.";
		case "toastFailedText":
			return "Bei der Änderung des Status ist ein Fehler aufgetreten.";
		case "settingsIntroHeader":
			return "Einstellungen";
		case "settingsCardHeaderEufySecurityAccountData":
			return "eufy Security Account";
		case "settingsHeaderAccountData":
			return "Zugangsdaten";
		case "settingsAccountDataHintHeader":
			return "Bitte erzeugen Sie einen eigenen eufy Security Account für dieses AddOn.";
		case "settingsAccountDataHintMessage":
			return "Zur problemlosen Nutzung dieses Addons erzeugen Sie einen neuen eufy Security Account in der App und geben Sie dessen Zugangsdaten hier ein.";
		case "settingsAccountDataHintSubText":
			return "Wenn Sie keinen eigenen Account für dieses AddOn anlegen, werden Sie jedes mal in Ihrer App abgemeldet, wenn dieses AddOn mit eufy Security kommuniziert bzw. das AddOn wird abgemeldet, wenn Sie Ihre App nutzen.";
		case "lblUsername":
			return "Benutzername des angelegten eufy Security Accounts.";
		case "txtUsername":
			return "eMail-Adresse";
		case "hintUsername":
			return "Der Benutzername ist die eMail-Adresse, mit der Sie den eufy Security Account angelegt haben.";
		case "divUsernameError":
			return "Bitte geben Sie die eMail-Adresse des eufy Security Accounts ein.";
		case "lblPassword":
			return "Passwort des angelegten eufy Security Accounts.";
		case "txtPassword":
			return "Password";
		case "hintPassword":
			return "Das Passwort, dass Sie für den eufy Security Account angelegt haben.";
		case "divPasswordError":
			return "Bitte geben Sie das Passwort des eufy Security Accounts ein.";
		case "settingsHeaderAccountMoreSettings":
			return "Weitere Einstellungen";
		case "lblCountry":
			return "Land des eufy Security Accounts.";
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
			return "Bitte auswählen...";
		case "hintCountry":
			return "Das Land, für den Sie den eufy Security Account erstellt haben.";
		case "lblLanguage":
			return "Sprache des eufy Security Accounts.";
		case "hintLanguage":
			return "Die Sprache, die für den eufy Security Account genutzt wird.";
		case "lblTrustedDeviceName":
			return "Name des Gerätes.";
		case "txtTrustedDeviceName":
			return "Name des Gerätes";
		case "btnGenerateNewTrustedDeviceName":
			return "neuen Gerätenamen generieren";
		case "hintTrustedDeviceName":
			return "Der Name des Gerätes wird für die Verbindung mit eufy benötigt. Bitte keinen Hinweis auf die Nutzung des eufy-security-client geben.";
		case "divTrustedDeviceNameError":
			return "Bitte geben Sie einen Gerätenamen ein. Die Zeichenkette 'eufyclient' darf nicht enthalten sein.";
		case "settingsCardHeaderEufySecurityConfig":
			return "Konfiguration des AddOns";
		case "settingsHeaderConfigHttpSettings":
			return "Einstellungen für HTTP";
		case "lblUseHttp":
			return "HTTP aktiv";
		case "lblPortHttp":
			return "Port über den die eufy Security API über HTTP erreichbar sein soll.";
		case "txtPortHttp":
			return "API-Port";
		case "hintPortHttp":
			return "Der angegebene Port darf nicht in Verwendung sein.";
		case "divPortHttpError":
			return "Bitte geben Sie eine Zahl zwischen 1 und 65535 ein.";
		case "settingsHeaderConfigHttpsSettings":
			return "Einstellungen für HTTPS";
		case "lblUseHttps":
			return "HTTPS aktiv";
		case "lblPortHttps":
			return "Port über den die eufy Security API über HTTPS erreichbar sein soll.";
		case "txtPortHttps":
			return "API-Port";
		case "hintPortHttps":
			return "Der angegebene Port darf nicht in Verwendung sein.";
		case "divPortHttpsError":
			return "Bitte geben Sie eine Zahl zwischen 1 und 65535 ein.";
		case "lblHttpsKeyFile":
			return "Speicherort der Datei mit dem privaten Schlüssel des Zertifikats.";
		case "txtHttpsKeyFile":
			return "Schlüsseldatei";
		case "hintHttpsKeyFile":
			return "Speicherort der Schlüsseldatei auf der CCU.";
		case "lblHttpsCertFile":
			return "Speicherort des Zertifikats.";
		case "txtHttpsCertFile":
			return "Zertifikatsdatei";
		case "hintHttpsCertFile":
			return "Speicherort der Zertifikatsdatei auf der CCU.";
		case "settingsHeaderConfigHouseAdministration":
			return "Einstellungen für die Hausverwaltungsfunktion";
		case "lblAcceptInvitations":
			return "Einladungen automatisch akzeptieren";
		case "lblHouseSelection":
			return "Stationen und Geräte angezeigen.";
		case "optAllStationsDevices":
			return "alle Stationen und Geräte des Accounts";
		case "hintHouseSelection":
			return "Bei der Einstellunge 'alle Stationen und Geräte des Accounts' werden alle Geräte angezeigt. Wird ein Haus ausgewählt, werden nur Geräte angezeigt, die diesem Haus zugeordnet wurden.";
		case "settingsHeaderConfigConnectionToStationSettings":
			return "Einstellungen für die Verbindung zu den Stationen";
		case "lblConnectionType":
			return "Herstellen der Verbindung zu den Stationen.";
		case "optConnectionTypeLocal":
			return "nur lokale Verbindung";
		case "optConnectionTypeFastest":
			return "schnellste Verbindung";
		case "hintConnectionType":
			return `Diese Einstellung wird für alle mit Strom versorgten Stationen und Geräten genutzt. Bei batteriebetriebenen Geräten wird die Verbindung immer mit der Option '${translateStaticContentElement("optConnectionTypeFastest")}' hergestellt.`;
		case "lblUseUdpStaticPorts":
			return "Verbindung zu den Station über feste Ports aufbauen";
		case "settingsHeaderConfigUpdateSystemVariables":
			return "Einstellungen für die Aktualisierung der Systemvariablen";
		case "lblUseSystemVariables":
			return "Systemvariablen bei API Aktionen automatisch aktualisieren";
		case "settingsHeaderConfigUpdateState":
			return "Einstellungen für regelmäßige Aktualisierung des Modus";
		case "lblUpdateStateEvent":
			return "Modus automatisch durch von der Station gesendete Ereignisse aktualisieren";
		case "lblUpdateStateIntervall":
			return "Modus regelmäßig intervallbasierend aktualisieren";
		case "lblUpdateStateIntervallTimespan":
			return "Zeit zwischen den Aktualisierungen.";
		case "txtUpdateStateIntervallTimespan":
			return "Intervall zwischen Aktualisierungen.";
		case "hintStateIntervallTimespan":
			return "Intervall in Minuten.";
		case "divStateIntervallError":
			return "Bitte geben Sie ein Intervall zwischen 15 und 240 Minuten ein.";
		case "settingsHeaderConfigPushService":
			return "Einstellungen für Pushbenachrichtigungen";
		case "lblUsePushService":
			return "Pushbenachrichtigungen aktivieren";
		case "hintUsePushService":
			return "Pushbenachrichtigungen werden z.B. für die Ermittlung der Zeitangabe der letzten Ereignisse für die Kameras benötigt.";
		case "settingsHeaderConfigSecureApiAccessSid":
			return "Einstellungen für Sicherung des Zugriffs auf die API";
		case "lblUseSecureApiAccessSid":
			return "Sicherung des Zugriffs auf die API aktivieren";
		case "hintUseSecureApiAccessSid":
			return "Wenn Sie diese Einstellung aktivieren, wird für einige API-Funktionen eine gültige SID benötigt. Gehen Sie dazu bitte auf die WebUI der CCU, navigieren Sie zu Einstellungen > Zusatzsoftware und wählen Sie Einstellen in den Optionen des eufy SECURITY-Addons aus.";
		case "settingsHeaderConfigEnableEmbeddedPKCS1Support":
			return "Einstellungen für RSA PKCS#1 (Public-Key Cryptography Standards)";
		case "lblUseEnableEmbeddedPKCS1Support":
			return "Internen PKCS#1 Support aktivieren";
		case "hintUseEnableEmbeddedPKCS1Support":
			return "Wenn Sie diese Einstellung aktivieren, wird für PKCS#1 auf interne Funktionalitäten zurückgegriffen, da PKCS#1 auf Grund einer Sicherheitslücke aus node.js entfernt wurde (vergl. CVE-2023-46809: Marvin attack on PKCS#1 padding). Für node.js Version 22 und neuer muss diese Einstellung aktiviert werden.";
		case "settingsHeaderConfigLogLevel":
			return "Einstellungen für Protokollierung";
		case "lblLogLevelAddon":
			return "Umfang der Protokollierung des Addons.";
		case "lblLogLevelMain":
			return "Umfang der Protokollierung des Client (Rubrik Main).";
		case "lblLogLevelHttp":
			return "Umfang der Protokollierung des Client (Rubrik Http).";
		case "lblLogLevelP2p":
			return "Umfang der Protokollierung des Client (Rubrik P2P).";
		case "lblLogLevelPush":
			return "Umfang der Protokollierung des Client (Rubrik Push).";
		case "lblLogLevelMqtt":
			return "Umfang der Protokollierung des Client (Rubrik Mqtt).";
		case "optLogLevelAddon0":
		case "optLogLevelMain0":
		case "optLogLevelHttp0":
		case "optLogLevelP2p0":
		case "optLogLevelPush0":
		case "optLogLevelMqtt0":
			return "Protokollierungsstufe Trace";
		case "optLogLevelAddon1":
		case "optLogLevelMain1":
		case "optLogLevelHttp1":
		case "optLogLevelP2p1":
		case "optLogLevelPush1":
		case "optLogLevelMqtt1":
			return "Protokollierungsstufe Debug";
		case "optLogLevelAddon2":
		case "optLogLevelMain2":
		case "optLogLevelHttp2":
		case "optLogLevelP2p2":
		case "optLogLevelPush2":
		case "optLogLevelMqtt2":
			return "Protokollierungsstufe Information";
		case "optLogLevelAddon3":
		case "optLogLevelMain3":
		case "optLogLevelHttp3":
		case "optLogLevelP2p3":
		case "optLogLevelPush3":
		case "optLogLevelMqtt3":
			return "Protokollierungsstufe Warnung";
		case "optLogLevelAddon4":
		case "optLogLevelMain4":
		case "optLogLevelHttp4":
		case "optLogLevelP2p4":
		case "optLogLevelPush4":
		case "optLogLevelMqtt4":
			return "Protokollierungsstufe Fehler";
		case "optLogLevelAddon5":
		case "optLogLevelMain5":
		case "optLogLevelHttp5":
		case "optLogLevelP2p5":
		case "optLogLevelPush5":
		case "optLogLevelMqtt5":
			return "Protokollierungsstufe Fatal";
		case "optLogLevelAddon6":
		case "optLogLevelMain6":
		case "optLogLevelHttp6":
		case "optLogLevelP2p6":
		case "optLogLevelPush6":
		case "optLogLevelMqtt6":
			return "keine Protokollierung";
		case "hintLogLevelAddon":
		case "hintLogLevelMain":
		case "hintLogLevelHttp":
		case "hintLogLevelP2p":
		case "hintLogLevelPush":
		case "hintLogLevelMqtt":
			return `Legt den Umfang der Protokollierung fest. Jede Stufe enthält alle nachfolgenden Fehlermeldungsklassen (ohne letzte Stufe "keine Protokollierung").`;
		case "divLogLevelErrorAddon":
		case "divLogLevelErrorMain":
		case "divLogLevelErrorHttp":
		case "divLogLevelErrorP2p":
		case "divLogLevelErrorPush":
		case "divLogLevelErrorMqtt":
			return "Bitte wählen Sie eine Protokollierungsstufe aus.";
		case "btnSave":
			return "Einstellungen speichern";
		case "settingsCardHeaderSystemvariables":
			return "Systemvariablen";
		case "settingsCardHeaderErrorHandling":
			return "Fehlerbehebung";
		case "btnEnableTroubleShooting":
			return "Fehlerbehebung aktivieren";
		case "settingsHintHeaderErrorHandling":
			return "Erweiterte Funktionen zur Fehlerbehebung";
		case "settingsHintMessageErrorHandling":
			return "Mit den folgenden Buttons können Sie verschiedene Aufgaben ausführen, um die Funktionsfähigkeit des AddOns wiederherzustellen. Um ungewollte Änderungen zu vermeiden, müssen Sie die Bearbeitung für einige Aufgaben zuerst freischalten.";
		case "settingsHintSubTextErrorHandling":
			return "Bitte beachten Sie, dass einige der Funktionen Daten und Einstellungen verändern oder löschen.";
		case "headerSaveConfig":
			return "Konfiguration sichern";
		case "hintSaveConfig":
			return "Bitte beachten Sie, dass diese Datei Ihre Zugangsdaten im Klartext enthält.";
		case "btnDownloadConfigFile":
			return "Konfiguration herunterladen";
		case "headerUploadConfig":
			return "Konfiguration wiederherstellen";
		case "hintUploadConfig":
			return "Die Datei wird nach dem Hochladen überprüft. Wenn die Überprüfung erfolgreich ist, wird das AddOn neu gestartet um die neuen Einstellungen zu übernehmen.";
		case "btnUploadConfigFile":
			return "Konfiguration hochladen";
		case "headerRemoveInteractions":
			return "Interaktionen löschen";
		case "hintRemoveInteractions":
			return "Es werden alle Interaktionen aus den Einstellungen gelöscht.";
		case "btnRemoveInteractions":
			return "Interaktionen löschen";
		case "headerReconnectStation":
			return "P2P Verbindung neu herstellen";
		case "hintReconnectStation":
			return "Falls in den Logdateien P2P-Verbindungfehler angezeigt werden und Sie dort aufgefordert werden, die P2P-Verbindung erneut zu initialisieren, können Sie dies hier tun. Wählen Sie dazu die entsprechende Station aus und klicken Sie auf 'P2P Verbindung neu herstellen'.";
		case "btnReconnectStation":
			return "P2P Verbindung neu herstellen";
		case "headerDeleteTokenData":
			return "Token löschen";
		case "hintDeleteToken":
			return "Wenn Sie in der Logdatei den Fehler <code>401 (Unauthorized)</code> erhalten, können Sie versuchen, das vorhandene Token zu löschen. Dadurch wird bei der nächsten Anfrage ein neues Token erzeugt.";
		case "btnDeleteTokenData":
			return "Token löschen";
		case "headerModulesManager":
			return "Abhängigkeitsverwaltung";
		case "hintModuleseManager":
			return "Übersicht über die installierten Abhängigkeiten, die dieses AddOn benötigt.";
		case "btnModulesManager":
			return "Abhängigkeitsverwaltung starten...";
		case "lblModalModulesManagerTitle":
			return "Abhängigkeitsverwaltung";
		case "modalModulesManagerMessage":
			return "Hier finden Sie alle für das AddOn notwenigen Abhängigkeiten, deren aktuelle Version sowie deren Aktualisierungsstatus.";
		case "tableHeaderModuleName":
			return "Abhängigkeit";
		case "tableHeaderModuleCurrentVersion":
			return "aktuelle Version";
		case "tableHeaderModuleWantedVersion":
			return "kompatible Version";
		case "modalModulesManagerBtnUpdate":
			return "Aktualisierung starten"
		case "modalModulesManagerBtnClose":
			return "Schließen";
		case "headerServiceManager":
			return "Service Manager";
		case "hintServiceManager":
			return "Unter Umständen kann es notwendig sein, den Service zu starten, zu beenden oder neu zu starten.";
		case "btnServiceManager":
			return "Service Manager starten...";
		case "lblModalServiceManagerTitle":
			return "Service Manager";
		case "modalServiceManagerMessage":
			return "Unter Umständen kann es notwendig sein, den Service zu starten, zu beenden oder neu zu starten. Wählen Sie aus, welche Logdateien bei der Aktion gelöscht werden sollen und klicken Sie auf die entsprechende Schaltfläche, um die gewünschte Aktion auszuführen.";
		case "lblDeleteLogfile":
			return "Logdatei bei der Aktion entfernen";
		case "lblDeleteErrfile":
			return "Fehlerlogdatei bei der Aktion entfernen";
		case "lblDeleteClientLogfile":
			return "Client Logdatei bei der Aktion entfernen";
		case "btnServiceManagerStartService":
			return "Service starten";
		case "btnServiceManagerStopService":
			return "Service stoppen";
		case "btnServiceManagerRestartService":
			return "Service neu starten";
		case "modalServiceManagerBtnCancel":
			return "Abbrechen";
		case "lblModalAtLeastOneNeedsActivationTitle":
			return "Einstellungen überprüfen.";
		case "lblModalAtLeastOneNeedsActivationMessage":
			return "Um die Erreichbarkeit der API zu gewährleisten, muss mindestens eine der beiden Optionen ('HTTP aktiv' oder 'HTTPS aktiv') aktiviert sein.<br /><br />Mit 'OK' wird die zuletzt deaktivierte Option wieder aktiviert.";
		case "modalAtLeastOneNeedsActivationBtnOK":
			return "OK";
		case "lblModaStateEventOrIntervalllTitle":
			return "Einstellungen überprüfen.";
		case "lblModaStateEventOrIntervalllMessage":
			return `Es kann nicht gleichzeitig die Option '${translateStaticContentElement("lblUpdateStateEvent")}' und die Option '${translateStaticContentElement("lblUpdateStateIntervall")}' aktiviert werden.<br /><br />Mit 'OK' wird die zuletzt aktivierte Option deaktiviert.`;
		case "modalStateEventOrIntervallBtnOK":
			return "OK";
		case "lblModalUDPPortsEqualWrongTitle":
			return "Einstellungen überprüfen.";
		case "modalUDPPortsEqualWrongBtnOK":
			return "OK";
		case "lblModalDeleteSystemVariableTitle":
			return "Systemvariable entfernen";
		case "modalDeleteSystemVariableBtnNo":
			return "Nein";
		case "modalDeleteSystemVariableBtnYes":
			return "Ja, bitte entfernen";
		case "lblModalUpdateSystemVariableTitle":
			return "Systemvariable aktualisieren";
		case "modalUpdateSystemVariableBtnNo":
			return "Nein";
		case "modalUpdateSystemVariableBtnYes":
			return "Ja, bitte aktualisieren";
		case "lblModalDeleteEventInteractionTitle":
			return "Interaktion entfernen";
		case "modalDeleteEventInteractionBtnNo":
			return "Nein";
		case "modalDeleteEventInteractionBtnYes":
			return "Ja, bitte entfernen";
		case "lblModalDeleteEventInteractionsTitle":
			return "Interaktionen entfernen";
		case "modalDeleteEventInteractionsBtnNo":
			return "Nein";
		case "modalDeleteEventInteractionsBtnYes":
			return "Ja, bitte alle entfernen";
		case "lblModalDeleteTokenTitle":
			return "Token entfernen";
		case "modalDeleteTokenBtnNo":
			return "Nein";
		case "modalDeleteTokenBtnYes":
			return "Ja, bitte entfernen";
		case "lblModalEmptyLogfileTitle":
			return "Datei leeren";
		case "modalEmptyLogfileBtnNo":
			return "Nein";
		case "modalEmptyLogfileBtnYes":
			return "Ja, bitte Datei leeren";
		case "lblModalRebootStationTitle":
			return "Station neu starten";
		case "modalRebootStationBtnNo":
			return "Nein";
		case "modalRebootStationBtnYes":
			return "Ja, bitte neu starten";
		case "logfileIntroHeader":
			return "Logdateien";
		case "tabHeaderAddonLog":
			return "Addon - Logdatei";
		case "imgReloadLogfileData":
			return "Inhalt neu laden";
		case "imgDeleteLogfileData":
			return "Entferne alle Einträge";
		case "imgDownloadLogfile":
			return "Download";
		case "tabHeaderAddonErr":
			return "Addon - Fehlerdatei";
		case "tabHeaderClientLog":
			return "Client - Logdatei";
		case "tabHeaderInstallLog":
			return "Install - Logdatei";
		case "lblWaitServiceStart":
			return "Warte auf Start des Services...";
		case "lblWaitServiceInit":
			return "Warte auf Initialisierung des Services...";
		case "aboutIntroHeader":
			return "Über eufy Security AddOn für HomeMatic";
		case "headerVersionInfo":
			return "Versionsinformationen";
		case "headerUsage":
			return "Hinweise zur Nutzung";
		case "textUsage":
			return "Die API stellt derzeit folgende Funktionen bereit:";
		case "entryGetStations":
			return "<code>/getStations</code>: Liefert alle Stationen des Accounts als JSON-String zurück.";
		case "entryGetDevices":
			return "<code>/getDevices</code>: Liefert alle Geräte des Accounts als JSON-String zurück.";
		case "entryGetHouses":
			return "<code>/getHouses</code>: Liefert alle Hausobjekte des Accounts als JSON-String zurück.";
		case "entryGetMode":
			return "<code>/getMode</code>: Liefert den Status aller Stationen als JSON-String zurück.";
		case "entryGetModeStation":
			return "<code>/getMode/<i>STATION_SERIAL</i></code>: Liefert den Status der Station mit der Seriennummer <i>STATION_SERIAL</i> als JSON-String zurück.";
		case "entrySetMode":
			return "<code>/setMode/<i>MODE</i></code>: Ändert den Status aller Stationen auf <i>MODE</i>. <i>MODE</i> kann einer der folgenden Werte sein. Die Antwort ist ein JSON-String.";
		case "entryModeAway":
			return "<code>away</code>: abwesend";
		case "entryModeCustom1":
			return "<code>custom1</code>: Benutzerdefiniert 1";
		case "entryModeCustom2":
			return "<code>custom2</code>: Benutzerdefiniert 2";
		case "entryModeCustom3":
			return "<code>custom3</code>: Benutzerdefiniert 3";
		case "entryModeDisarmed":
			return "<code>disarmed</code>: deaktiviert";
		case "entryModeGeo":
			return "<code>geo</code>: Geofencing";
		case "entryModeHome":
			return "<code>home</code>: zu Hause";
		case "entryModeOff":
			return "<code>off</code>: ausgeschaltet";
		case "entryModeSchedule":
			return "<code>schedule</code>: Zeitplan";
		case "entryModePrivacyOn":
			return "<code>privacyOn</code>: Indoorcam ausschalten";
		case "entryModePrivacyOff":
			return "<code>privacyOff</code>: Indoorcam einschalten";
		case "entrySetModeStation":
			return "<code>/setMode/<i>STATION_SERIAL</i>/<i>MODE</i></code>: Ändert den Status der Station mit der Seriennummer <i>STATION_SERIAL</i> auf <i>MODE</i>. <i>MODE</i> kann einer der oben genannten Werte sein. Die Antwort ist ein JSON-String.";
		case "entryGetLibrary":
			return "<code>/getLibrary</code>: Liefert den Link zum letzten Standbild sowie den dazugehörigen Zeitpunkt als JSON-String zurück.";
		case "entryGetDeviceImage":
			return "<code>/getDeviceImage/<i>DEVICE_SERIAL</i></code>: Gibt das letzte Bild des Gerätes mit der Seriennummer <i>DEVICE_SERIAL</i> als Bild zurück.";
		case "entryMoveToPreset":
			return "<code>/moveToPresetPosition/<i>DEVICE_SERIAL</i>/<i>PRESET_NUMBER</i></code>: Fährt für das Gerät mit der Seriennummer <i>DEVICE_SERIAL</i> die gespeicherte Position <i>PRESET_NUMBER</i> an. <i>PRESET_NUMBER</i> kann die Werte <code>0</code>, <code>1</code>, <code>2</code> oder <code>3</code> annehmen. Es erfolgt keine Rückmeldung, ob der entsprechende Preset belegt ist und ob die Position angefahren wurde.";
		case "hintModeNotSupported":
			return "Bitte beachten Sie, dass einige Modi nur mit bestimmten Gerätetypen genutzt werden könnnen. Sollten Sie einen vom Gerät nicht unterstützen Modus setzten wollen, erhalten Sie eine entsprechende Meldung.";
		case "textUseApi":
			return "Über Skripte können Sie die API abfragen. Dazu haben Sie zwei Möglichkeiten:";
		case "entryApiBackground":
			return `Möchten Sie die Antwort nicht auswerten, können Sie folgenden Code verwenden, um die Anfrage im Hintergrund (d.h. nicht-blockierend) auszuführen:<ul><li>bis RaspberryMatic 3.79.6.20241122<br /><code>system.Exec("curl --max-time 20 'http://127.0.0.1:52789/setMode/away' &");</code></li><li>ab RaspberryMatic 3.79.6.20250118<br /><code>system.Exec("curl 'http://127.0.0.1:52789/setMode/away' &", null, null, null, 20000);</code></li></ul>`;
		case "entryApiReturnValues":
			return `Möchten Sie die Antwort auswerten, können Sie folgenden Code verwenden:<ul><li>bis RaspberryMatic 3.79.6.20241122<br /><code>string res;<br />string err;<br />system.Exec("curl --max-time 20 'http://127.0.0.1:52789/setMode/away'", &res, &err);</code><li>ab RaspberryMatic 3.79.6.20250118<br /><code>string res;<br />string err;<br />system.Exec("curl 'http://127.0.0.1:52789/setMode/away'", &res, &err, null, 20000);</code></li></ul>Die JSON-Antwort finden Sie im String <code>res</code>.`;
		case "descApiSystemVariables":
			return `Bei beiden Varianten werden die entsprechenden Systemvariablen automatisch gesetzt, wenn in den Einstellungen die Option '${translateStaticContentElement("lblUseSystemVariables")}' aktiviert wurde.`;
		case "descApiIpAddress":
			return "Verwenden Sie anstelle von <code>127.0.0.1</code> die IP-Adresse Ihrer CCU, wenn Sie von Geräten in Ihrem Netzwerk (beispielsweise mit einem Browser) auf die API zugreifen möchten.";
		case "descApiTimeout":
			return "Die Angabe <code>max-time 20</code> (bis RaspberryMatic 3.79.6.20241122) bzw. das letzte Argument der system.Exec-Funktion (<code>20000</code>, ab RaspberryMatic 3.79.6.20250118, Angabe in Millisekunden) bedeutet, dass die Ausführung nach 20 Sekunden abgebrochen wird. Die API-Funktion <code>/setMode</code> kann je Station eine maximale Laufzeit von ca. 10 Sekunden haben. Aus diesem Grund muss der Wert für <code>max-time</code> bei der API-Funktion <code>/setMode</code> entsprechend der Anzahl der Stationen angepasst werden. Falls Sie bei RaspberryMatic-Versionen ab 3.79.6.20250118 den Code der älteren Version weiternutzen, bricht RaspberryMatic den Prozess automatisch nach 10 Sekunden ab.";
		case "hintApiTimestamps":
			return "Die Zeitstempel der letzten Ereignisse werden nur in folgenden Fällen gesetzt und aktualisiert:";
		case "descTimestampStation":
			return `Zeitpunkt der Änderung des Modus bei Stationen: die Einstellung '${translateStaticContentElement("lblUpdateStateEvent")}' muss aktiviert sein`;
		case "descTimestampVideo":
			return `Zeitpunkt des letzten Videoevents bei Kameras: die Einstellung "Pushbenachrichtigungen aktivieren" muss aktiviert sein`;
		case "descTimestampNoValue":
			return `Ist die entsprechende Einstellung nicht aktiviert, wird bei Stationen "letzter Statuswechsel: unbekannt" und bei Kameras "letzte Aufnahme nicht verfügbar" angezeigt.`;
		case "headerProjectInfo":
			return "Informationen zum Projekt";
		case "textProjectInfoGitHub":
			return `Alle Informationen und Dateien zu diesem AddOn finden Sie auf der <a href="https://github.com/PhilippEngler/eufy-security-hm" target="_blank">GitHub-Seite des AddOns</a>.`;
		case "textProjectDonation":
			return `Gefällt Ihnen dieses Addon? Dann unterstützen Sie die Entwickung dieses Addons mit einer Spende über <a href="https://www.paypal.me/EnglerPhilipp" target="_blank"><i class="bi-paypal" title="PayPal Logo"></i> PayPal</a>. Vielen Dank!`;
		case "textProjectInspiration":
			return "Dieses Projekt enstand auf der Grundlage von diversen Projekten. Weiterhin trug die HomeMatic-Forum Community zu der Erstellung bei. Nachfolgend finden sich Personen und Projekte, die die Grundlage für dieses Projekt bildeten und ohne deren Vorarbeit es dieses Projekt nicht gegeben hätte.";
		case "headerAboutEufySecurityApi":
			return "eufy Security API:";
		case "headerAboutWebsite":
			return "Webseite:";
		case "headerAboutAddOn":
			return "CCU AddOn:";
		case "txtLogfileLocation":
			return "Inhalt der Datei";
		case "txtLogfileUnknown":
			return "Logdateityp unbekannt";
		default:
            return `{${element}}`;
    }
}

function translateMessages(message, ...options) {
	switch(message) {
		case "messageApiPortInactiveHeader":
			return `Der Aufruf der API über ${options[0]} ist deaktiviert`;
		case "messageApiPortInactiveSubText":
			return `Bitte nutzen Sie zum Aufruf der Addon-Webseite eine ${options[0]}Verbindung.`;
		case "messageApiPortFileNotFoundHeader":
			return "Bei der Ermittlung der API-Ports ist ein Fehler aufgetreten.";
		case "messageApiPortFileNotFoundMessageText":
			return "Bitte überprüfen Sie die Datei apiPorts.json im Webseitenverzeichnisses dieses AddOns.";
		case "messageErrorPrintErrorMessage":
			return `Es ist folgender Fehler aufgetreten: ${options[0]}${options[1] !== undefined ? ` [${options[1]}]` : ""}`;
		case "messageErrorStatusAndReadyState":
			return `Rückgabewert 'Status' ist '${options[0]}'. Rückgabewert 'ReadyState' ist '${options[1]}'.${options[2] !== undefined ? ` Funktion: '${options[2]}'.` : ""}`;
		case "messageAbortLoadingHeader":
			return "Anfrage wurde abgebrochen.";
		case "messageAbortLoadingText":
			return "Die Anfrage wurde abgebrochen.";
		case "messageErrorLoadingHeader":
			return "Fehler bei der Auswertung der Antwort.";
		case "messageErrorLoadingText":
			return "Es wurde eine ungültige Antwort empfangen.";
		case "messageCaptchaErrorHeader":
			return "Fehler beim Laden des Captcha Status.";
		case "messageErrorCheckingAddonStateHeader":
			return "Fehler bei der Ermittlung des Status des Addons.";
		case "messageErrorAddonNotRunning":
			return "Eventuell wird das Addon nicht ausgeführt oder die Firewalleinstellungen der CCU blockieren die Kommunikation. Ein Neustart des Addons, der CCU oder eine Änderung der Firewalleinstellungen könnte das Problem beheben.";
		case "messageCaptchaError":
			return "Fehler beim Laden des Captcha Status.";
		case "messageCaptchaSendError":
			return "Fehler beim Senden der Captcha Zeichenkette.";
		case "messageNoStationsFoundHeader":
			return "Es wurden keine Stationen gefunden.";
		case "messageNoStationsFoundMessage":
			return "Es wurden keine vefügbaren Stationen gefunden.";
		case "messageNoStationsFoundSubText":
			return "Überprüfen Sie, ob Sie dem Account Stationen freigegeben haben beziehungsweise ob Sie das Haus für den Account freigegeben haben und ob Sie das korrekte Haus in den Einstellungen freigegeben haben.";
		case "messageNoManageableStationsFoundHeader":
			return "Es wurden keine verwaltbaren Stationen gefunden.";
		case "messageNoManageableStationsFoundMessage":
			return "Es wurden keine Stationen gefunden, die hier verwaltbar sind.";
		case "messageNoManageableStationsFoundSubText":
			return "Es sind Geräte vorhanden, die gleichzeitig eine Station sind. Rufen Sie die Einstellungen für diese Geräte auf, um Einstellungen für die Station vornehmen zu können.";
		case "messageErrorLoadingStationsHeader":
			return "Fehler beim Laden der Station.";
		case "messageNoDevicesFoundHeader":
			return "Es wurden keine Geräte gefunden.";
		case "messageNoDevicesFoundMessage":
			return "Es wurden keine vefügbaren Geräte gefunden.";
		case "messageNoDevicesFoundSubText":
			return "Überprüfen Sie, ob Sie dem Account Geräte freigegeben haben beziehungsweise ob Sie das Haus für den Account freigegeben haben und ob Sie das korrekte Haus in den Einstellungen freigegeben haben.";
		case "messageErrorLoadingDevicesHeader":
			return "Fehler beim Laden der Geräte.";
		case "messageErrorNoDeviceForGetInfo":
			return `Kein Gerät gefunden. ${options[0]} konnte nicht geladen werden.`;
		case "messageErrorLoadDeviceForGetInfo":
			return `Fehler beim Laden der ${options[0]}.`;
		case "messageContinuousRecordingSheduleHint":
			return "Zeitplan muss konfiguriert werden.";
		case "messageContinuousRecordingSheduleMessage":
			return "Der Zeitplan für diese Funktion muss derzeit in der App konfiguriert werden.";
		case "messageInteractionHintHeader":
			return "Hinweise zur Interaktion mit der CCU.";
		case "messageInteractionHintMessage":
			return "Die Interaktionen werden nur dann ausgeführt, wenn eine P2P-Verbindung zur Basis sowie eine Internetverbindung besteht. Besteht eine dieser Verbindungen nicht, kann eine Interaktion mit der CCU nicht sichergestellt werden.";
		case "messageSaveInteractionHeader":
			return "Interaktion speichern.";
		case "messageSaveInteractionUnknownInteractionMessage":
			return `Der Typ der zu speichernden Interaktion ist unbekannt ('${options[0]}').`;
		case "messageSaveInteractionOkMessage":
			return "Die Interaktion wurde erfolgreich gespeichert.";
		case "messageSaveInteractionFailedMessage":
			return "Die Interaktion konnte nicht gespeichert werden.";
		case "messageTestUnstoredInteractionHeader":
			return "Ungespeicherte Interaktion testen.";
		case "messageTestUnstoredInteractionUnknownInteractionMessage":
			return `Der Typ der zu testenden Interaktion ist unbekannt ('${options[0]}').`;
		case "messageTestUnstoredInteractionOkMessage":
			return "Die Interaktion wurde erfolgreich gesendet.";
		case "messageTestUnstoredInteractionFailedMessage":
			return "Die Interaktion konnte nicht gesendet werden.";
		case "messageTestInteractionHeader":
			return "Interaktion testen.";
		case "messageTestInteractionUnknownInteractionMessage":
			return `Der Typ der zu testenden Interaktion ist unbekannt ('${options[0]}').`;
		case "messageTestInteractionOkMessage":
			return "Die Interaktion wurde erfolgreich gesendet.";
		case "messageTestInteractionErrorStatusMessage":
			return `Die Interaktion konnte nicht gesendet werden.<br />Status: '${options[0]}'`;
		case "messageTestInteractionErrorCodeMessage":
			return `Die Interaktion konnte nicht gesendet werden.<br />Code: '${options[0]}'`;
		case "messageTestInteractionFailedMessage":
			return "Die Interaktion konnte nicht gesendet werden.";
		case "messageDeleteInteractionHeader":
			return "Interaktion löschen.";
		case "messageDeleteInteractionUnknownInteractionMessage":
			return `Der Typ der zu löschenden Interaktion ist unbekannt ('${options[0]}').`;
		case "messageDeleteInteractionOkMessage":
			return "Die Interaktion wurde entfernt.";
		case "messageDeleteInteractionFailedMessage":
			return "Die Interaktion konnte nicht entfernt werden.";
		case "messageMoveToPresetHeader":
			return "Anfahren der gespeicherten Position.";
		case "messageMoveToPresetOkMessage":
			return `Die Position ${options[0]} wurde angefahren.`;
		case "messageMoveToPresetFailedMessage":
			return "Beim Anfahren der Position ist ein Fehler aufgetreten.";
		case "messageCheckConfigFailedHeader":
			return "Überprüfung der Eingaben.";
		case "messageCheckConfigFailedMessage":
			return "Die Überprüfung der Eingaben ist fehlgeschlagen. Bitte überprüfen Sie die rot markierten Eingabefelder und beachten Sie die Hinweise.";
		case "messageSaveConfigOKHeader":
			return "Speicherung der Einstellungen.";
		case "messageSaveConfigOKMessage":
			return "Die Einstellungen wurden erfolgreich gespeichert.";
		case "messageSaveConfigFailedHeader":
			return "Speicherung der Einstellungen.";
		case "messageSaveConfigFailedMessage":
			return "Bei dem Speichern der Einstellungen ist ein Fehler aufgetreten.";
		case "messageUploadConfigFailedHeader":
			return "Upload der Konfigurationsdatei.";
		case "messageUploadConfigFailedMessage":
			return "Bei dem Hochladen der Konfigrationsdatei ist ein Fehler aufgetreten.";
		case "messageRemoveTokenFailedHeader":
			return "Tokendaten löschen.";
		case "messageRemoveTokenFailedMessage":
			return "Bei dem Löschen der Tokendaten ist ein Fehler aufgetreten.";
		case "messageStartOKHeader":
			return "Service starten.";
		case "messageStartOKMessage":
			return "Der Service wird gestartet.";
		case "messageStartFailedHeader":
			return "Service starten.";
		case "messageStartFailedMessage":
			return "Bei dem Starten des Services ist ein Fehler aufgetreten.";
		case "messageSaveSettingsHeader":
			return "Einstellungen speichern.";
		case "messageSaveSettingsOkMessage":
			return "Die Einstellungen wurden erfolgreich gespeichert.";
		case "messageSaveSettingsFailedMessage":
			return "Die Einstellungen konnten nicht gespeichert werden.";
		case "messageSendCommandHeader":
			return "Befehl senden.";
		case "messageSendCommandOkMessage":
			return "Der Befehl wurde erfolgreich gesendet.";
		case "messageSendCommandFailedMessage":
			return "Der Befehl konnte nicht gesendet werden.";
		case "messageReconnectStationHeader":
			return "P2P Verbindung neu aufbauen.";
		case "messageReconnectStationOkMessage":
			return "Die Verbindung wurde neu aufgebaut.";
		case "messageReconnectStationFailedMessage":
			return "Die Verbindung konnte nicht neu aufgebaut werden.";
		case "messageLoadTimeZoneInfoNotSuccessfullMessage":
			return "Zeitzoneninformationen konnte nicht geladen werden.";
		case "messageLoadTimeZoneInfoFailedMessage":
			return "Fehler beim Laden der Zeitzoneninformationen.";
		case "messageErrorNoStationForGetInfo":
			return `Kein Gerät gefunden. ${options[0]} konnte nicht geladen werden.`;
		case "messageErrorLoadStationForGetInfo":
			return `Fehler beim Laden der ${options[0]}.`;
		case "messageStorageErrorHeader":
			return "Es ist folgendes Problem mit dem internen Speicher aufgetreten";
		case "messageStorageErrorSubText":
			return "Bitte überprüfen Sie die Einstellungen für den internen Speicher in der App.";
		case "messageStorageCapacityErrorHeader":
			return "Fehler beim Abrufen der Speicherauslastung.";
		case "messageStorageCapacityErrorSubText":
			return "Bitte überprüfen Sie die Speicherauslastung des internen Speichers in der App.";
		case "messageRebootStationHeader":
			return "Station neu starten.";
		case "messageRebootStationOkMessage":
			return "Die Station startet neu. Dies kann einige Minuten dauern.";
		case "messageRebootStationFailedMessage":
			return "Die Station konnte nicht neu gestartet werden.";
		case "messageStationsNotFound":
			return "Fehler beim Laden der Stationen.";
		case "messageCountriesLoadingFailedHeader":
			return "Fehler bei der Ermittlung der Länder.";
		case "messageHousesLoadingFailedHeader":
			return "Fehler bei der Ermittlung der Häuser.";
		case "messageStationsLoadingError":
			return "Fehler bei der Ermittlung der Stationen.";
		case "messageSettingsLoadingErrorHeader":
			return "Fehler bei der Ermittlung der Einstellungen.";
		case "messageErrorThreeValuesMessage":
			return `Der Rückgabewert '${options[0]}' ist '${options[1]}'.<br />Fehlermeldung: '${options[2]}'`;
		case "messageErrorServiceNotRunningHeader":
			return "Service nicht aktiv";
		case "messageErrorServiceNotRunningMessage":
			return "Der Service wird zur Zeit nicht ausgeführt.";
		case "messageSystemVariableHintHeader":
			return `Option '${translateStaticContentElement("lblUseSystemVariables")}' ist aktiviert.`;
		case "messageSystemVariableHintMessage":
			return "Das AddOn wird die entsprechenden Systemvariablen aktualisieren. In der folgenden Tabelle finden Sie alle Systemvariablen, die dieses AddOn auf der CCU benötigt. Wenn die jeweilige Zeile grün ist, ist die Systemvariable auf der CCU bereits angelegt, ansonsten ist die Zeile rot.</br >Falls Systemvariablen gefunden werden, die mit 'eufy' beginnen und nicht mehr benötigt werden (beispielsweise für gelöschte Geräte), erscheinen diese in einer zweiten Tabelle. Dort können diese Systemvariablen gelöscht werden.";
		case "messageSystemVariableHintSubText":
			return `Bitte achten Sie darauf, dass alle Systemvariablen angelegt sind. Wenn Sie die Aktualisierung der Systemvariablen nicht wünschen, deaktivieren Sie bitte die Option '${translateStaticContentElement("lblUseSystemVariables")}'.`;
		case "messageSystemVariablesDeactivatedHeader":
			return "Keine Systemvariablen.";
		case "messageSystemVariablesDeactivatedMessage":
			return "Die Aktualisierung von Systemvariablen bei API Aktionen ist deaktiviert.";
		case "messageSystemVariablesDeactivatedSubText":
			return `Aktivieren Sie die Einstellung '${translateStaticContentElement("lblUseSystemVariables")}', wenn Sie mit den Systemvariablen arbeiten möchten.`;
		case "messageSystemVariablesLoadingErrorHeader":
			return "Fehler bei der Ermittlung der Systemvariablen.";
		case "messageSettingsSaveErrorHeader":
			return "Fehler bei dem Speichern der Einstellungen.";
		case "messageSystemVariablesCreateErrorHeader":
			return "Fehler bei der Erzeugung der Systemvariablen.";
		case "messageSystemVariablesUnusedRemoveErrorHeader":
			return "Fehler bei der Ermittlung der veralteten Systemvariablen.";
		case "messageUploadConfigErrorHeader":
			return "Fehler bei dem Hochladen der Konfigurationsdatei.";
		case "messageUploadConfigErrorFileToLargeMessage":
			return "Die ausgewählte Datei ist zu groß.";
		case "messageUploadConfigErrorCommonMessage":
			return "Die Konfigurationsdatei ist fehlerhaft.";
		case "messageUdpPortNoNumberMessage":
			return "Sie haben keine Zahl oder eine ungültige Zahl eingegeben. Bitte geben Sie eine Zahl zwischen 1 und 65535 ein.";
		case "messageUdpPortInputRemoveMessage":
			return "Die Eingabe wird nun gelöscht.";
		case "messageUdpPortPortAlreadyUsedMessage":
			return "Sie haben einen Port eingegeben, der bereits für eine andere Station oder ein anderes Gerät eingegeben wurde.";
		case "messageLoadLogFileErrorHeader":
			return "Fehler beim Laden der Logdatei.";
		case "messageLoadLogFileErrorMessage":
			return "Es ist ein Fehler beim Laden der Logdatei aufgetreten.";
		case "messageEmptyLogFileErrorHeader":
			return "Fehler beim Leeren der Logdatei.";
		case "messageEmptyLogFileErrorMessage":
			return "Beim leeren der Logdatei ist ein Fehler aufgetreten.";
		case "messageErrorLogfileUnknown":
			return `Der Logdateityp '${options[0]}' ist unbekannt.`;
		case "messageLoadVersionInfoErrorHeader":
			return "Fehler beim Laden der Versionsinformationen.";
		case "messageLoadVersionInfoErrorMessage":
			return "Es ist ein Fehler beim Laden der Versionsinformationen aufgetreten.";
		case "messageRebootStationHeader":
			return "Station neu starten.";
		case "messageRebootStationOkMessage":
			return "Die Station startet neu. Dies kann einige Minuten dauern.";
		case "messageSaveSettingsOkMessage":
			return "Die Station konnte nicht neu gestartet werden.";
		case "messageInstalledModulesErrorHeader":
			return "Fehler bei der Ermittlung der installierten Abhängigkeiten.";
		case "messageUpdatedModulesErrorHeader":
			return "Fehler bei der Ermittlung der aktualisierbaren Abhängigkeiten.";
		case "messageRestartWaitErrorHeader":
			return "Fehler beim Neustart des Addons.";
		case "messageRestartWaitHeaderMessage":
			return `Es ist ein Fehler beim Neustart des Addons aufgetreten.<br />Phase: '${options[0]}'`;
		case "messageRestartWaitHeaderErrorMessage":
			return `Es ist ein Fehler beim Neustart des Addons aufgetreten.<br />Fehler: '${options[0]}'`;
		case "modalDeleteSystemVariableMessage":
			return `Sind Sie sicher, dass die Systemvariable '${options[0]}' gelöscht werden soll?<br />Dieser Vorgang kann nicht rückgängig gemacht werden.`;
		case "modalUpdateSystemVariableMessage":
			return `Sind Sie sicher, dass die Systemvariable '${options[0]}' aktualisiert werden soll?<br /><b>Bitte beachten Sie:</b><br />Dieser Vorgang umfasst zwei Schritte:<br /><ol type="1"><li>aktuelle Systemvariable wird gelöscht</li><li>Systemvariable wird mit aktuellen Parametern neu erstellt</li></ol>Sie müssen im Anschluss vorhandene Programme, Scripte sowie Middelware (bspw. Home Assistant, ioBroker, etc.) mit der neuen Systemvariable aktualisieren.<br />Dieser Vorgang kann nicht rückgängig gemacht werden.`;
		case "modalDeleteEventInteractionMessage":
			return `Sind Sie sicher, dass folgende Interaktion gelöscht werden soll?<br /><dl><dt>Gerät:</dt><dd>${options[1]} (${options[2]})</dd><dt>Interaktion:</dt><dd>${options[3]}</dd></dl>Dieser Vorgang kann nicht rückgängig gemacht werden.`;
		case "modalDeleteEventInteractionsMessage":
			return `Sind Sie sicher, dass alle Systemvariablen gelöscht werden sollen?<br />Dieser Vorgang kann nicht rückgängig gemacht werden.`;
		case "modalDeleteTokenMessage":
			return `Sind Sie sicher, dass das Token gelöscht werden soll?<br />Dieser Vorgang kann nicht rückgängig gemacht werden.`;
		case "modalEmptyLogfileMessage":
			return `Sind Sie sicher, dass die Datei '<text class="font-monospace fs-6 fw-medium">${options[0]}</text>' geleert werden soll?<br />Dieser Vorgang kann nicht rückgängig gemacht werden.`;
		case "modalRebootStationMessage":
			return `Sind Sie sicher, dass die Station ${options[1]} (${options[0]}) neu gestartet werden soll?<br />Bis die Station wieder vefügbar ist, können einige Minuten vergehen.`;
		default:
			return `{${message}}`;
	}
}

function translateContent(content, ...options) {
	switch(content) {
		case "lblConfigNeededHeader":
			return "Einstellungen unvollständig";
		case "lblConfigNeeded":
			return `Sie müssen das AddOn konfigurieren, bevor Sie es nutzen können. Klicken Sie auf die Schaltfläche '${translateContent("btnGoToSettings")}', um die Einstellungen vornehmen zu können.`;
		case "btnGoToSettings":
			return "zu den Einstellungen";
		case "lblTfaHeader":
			return "Anmeldung benötigt 2FA Code";
		case "lblTfaHint":
			return "Bitte geben Sie in das Textfeld die Zeichenkette ein, die Ihnen zugesandt wurde.";
		case "lblTfaCode":
			return "Zeichenkette, die Sie erhalten haben:";
		case "btnTfaSubmit":
			return "Login fortsetzen";
		case "lblTfaNotAvailable":
			return "Derzeit ist keine Anforderung für 2FA für den Account hinterlegt.";
		case "lblWaitMessageSendTfa":
			return "Sende 2FA Zeichenkette...";
		case "lblCaptchaHeader":
			return "Anmeldung benötigt Captcha-Antwort";
		case "lblCaptchaHint":
			return "Bitte geben Sie in das Textfeld die Zeichenkette ein, die in dem Captcha-Bild dargestellt wird.";
		case "lblCaptchaImageAltDesc":
			return "Captcha-Bild"
		case "lblCaptchaCode":
			return "Zeichenkette, die in dem Captcha dargestellt wird:";
		case "btnCaptchaSubmit":
			return "Login fortsetzen";
		case "lblCaptchaNotAvailable":
			return "Derzeit ist kein Captcha für den Account hinterlegt.";
		case "lblWaitMessageSendCaptcha":
			return "Sende Captcha Zeichenkette...";
		case "titleNoP2PConnection":
			return "Es besteht keine P2P-Verbindung zu diesem Gerät.";
		case "titleNoP2PConnectionDesc":
			return "Um Einstellungen für dieses Gerät vornehmen zu können, muss die P2P-Verbindung wieder hergestellt werden.";
		case "titleSettings":
			return "Einstellungen";
		case "lblFirmware":
			return "Firmwareversion";
		case "lblCurrentState":
			return "aktueller Status";
		case "lblPrivacy":
			return "privatsphäre";
		case "lblIpAddress":
			return "IP-Adresse";
		case "lblStations":
			return "Stationen";
		case "lblWaitMessageLoadStations":
			return "Lade verfügbare Stationen...";
		case "lblCameras":
			return "Kameras";
		case "lblIndoorCameras":
			return "Innenkameras";
		case "lblSoloCameras":
			return "Solokameras";
		case "lblStarlightCameras":
			return "4G LTE Kameras";
		case "lblDoorbellCameras":
			return "Videotürklingel";
		case "lblOutdoorLightCameras":
			return "Außenleuchten mit Kamera";
		case "lblLocks":
			return "Schlösser";
		case "lblKeypads":
			return "Keypads";
		case "lblSensors":
			return "Sensoren";
		case "lblUnknownDevice":
			return "unbekannte Geräte";
		case "lblDevices":
			return "Geräte";
		case "lblWaitMessageLoadDevices":
			return "Lade verfügbare Geräte...";
		case "titleDeactivatedOffline":
			return "Dieses Gerät ist derzeit offline.";
		case "titleDeactivatedOfflineHint":
			return "Um Einstellungen für dieses Gerät vornehmen zu können, bringen Sie das Gerät wieder in den Empfangsbereichs der HomeBase beziehungsweise des WLANs.";
		case "titleDeactivatedLowBattery":
			return "Dieses Gerät wurde auf Grund des niedrigen Akkuladestandes deaktiviert.";
		case "titleDeactivatedLowBatteryHint":
			return "Um Einstellungen für dieses Gerät vornehmen zu können, laden Sie das Gerät wieder auf.";
		case "titleDeactivatedRemoveAndReadd":
			return "Das Gerät wurde entfernt.";
		case "titleDeactivatedRemoveAndReaddHint":
		case "titleDeactivatedResetAndReaddHint":
			return "Um Einstellungen für dieses Gerät vornehmen zu können, fügen Sie das Gerät wieder Ihrem Account hinzu.";
		case "titleDeactivatedResetAndReadd":
			return "Das Gerät wurde zurückgesetzt.";
		case "titleDeactivatedUnknownState":
			return "Das Gerät hat einen unbekannten Status.";
		case "titleDeactivatedUnknownStateHint":
			return "Um Einstellungen für dieses Gerät vornehmen zu können, überprüfen Sie bitte das Gerät in der App.";
		case "titleWifiSignalLevel":
			return "WiFi Empfangsstärke";
		case "lblBatteryLevel":
			return "Ladezustand des Akkus";
		case "lblTemperature":
			return "Temperatur";
		case "lblState":
			return "Status";
		case "lblLastEvent":
			return "letztes Ereignis";
		case "lblNotAvailable":
			return "nicht verfügbar";
		case "lblUnknown":
			return "unbekannt";
		case "lblLastRecording":
			return "letzte Aufnahme";
		case "lblLastRecordingThumbnail":
			return "Standbild";
		case "lblLastRecordingNotAvailable":
			return "keine Aufnahme verfügbar";
		case "lblStationDeviceModalHeader":
			return "Integriertes Gerät";
		case "lblStationDeviceModalDescription":
			return `Bei dem ausgewählten Gerät ${options[0]} (${options[1]}) handelt es sich um ein Gerät, dass ohne Basisstation betrieben wird. Aus diesem Grund gibt es für dieses Gerät eine Basistation mit der selben Seriennummer. In der Geräteübersicht wird die Basisstation jedoch nicht angezeigt.`
		case "lblStationDeviceModalActionToPerform":
			return "Sie können nachfolgend wählen, ob Sie Einstellungen für die Basisstation oder das Gerät vornehmen möchten.";
		case "btnGetSettingsForStation":
			return "Einstellungen für Basisstation aufrufen";
		case "btnGetSettingsForDevice":
			return "Einstellungen für Gerät aufrufen";
		case "btnClose":
			return "Schließen";
		case "lblNotSupportedDeviceHeading":
			return "Dieses Gerät wird nicht vollständig unterstützt.";
		case "lblNotSupportedDeviceMessage":
			return `Sie können bei der Weiterentwicklung helfen, in dem Sie die Informationen der beiden Abfragen "<a href="${options[0]}" target=”_blank” class="alert-link">DeviceProperties</a>" und "<a href="${options[1]}" target=”_blank” class="alert-link">DevicePropertiesMetadata</a>" dem Entwickler zur Verfügung stellen.`
		case "lblNotSupportedDeviceMessageSolo":
			return `Da es sich bei dem Gerät um ein integriertes Gerät handelt, stellen Sie bitte zusätzlich die Informationen der beiden Abfragen "<a href="${options[0]}" target=”_blank” class="alert-link">DeviceProperties</a>" und "<a href="${options[1]}" target=”_blank” class="alert-link">DevicePropertiesMetadata</a>" dem Entwickler zur Verfügung.`
		case "lblNotSupportedDeviceSubText":
			return "Die Abfragen liefern Ergebnisse, bei denen Seriennummern eingekürzt sowie Links entfernt wurden. Bitte prüfen Sie, ob weitere Daten enthalten sind, die Sie entfernen möchten.";
		case "lblNotSupportedDeviceNoSaving":
			return "Das Speichern der Einstellungen ist zur Zeit nicht möglich.";
		case "lblUnknownDeviceHeading":
			return "Dieses Gerät wird nicht unterstützt.";
		case "lblUnknownDeviceMessage":
			return `Das Gerät ist unbekannt. Sie können sich unter Angabe der Modellnummer (${options[0]}) sowie der Bezeichnung des Gerätes an den Entwickler wenden, so dass das Gerät eventuell implementiert werden kann.`
		case "lblUnknownDeviceNoSaving":
			return "Das Speichern der Einstellungen ist zur Zeit nicht möglich.";
		case "lblHeaderCommon":
			return "Allgemeines";
		case "lblEnabled":
			return "Gerät aktiviert";
		case "lblAntitheftDetection":
			return "Diebstahlerkennung";
		case "lblStatusLed":
			return "Status LED";
		case "lblImageMirrored":
			return "Bild spiegeln";
		case "lblMotionAutoCruise":
			return "Auto-Cruise";
		case "lblAutoCalibration":
			return "automatische Kalibirierung";
		case "lblLight":
			return "Scheinwerfer";
		case "lblHeaderMotionDetection":
			return "Bewegungserkennung";
		case "lblMotionDetection":
			return "Bewegungserkennung";
		case "lblMotionDetectionSensitivity":
			return "Erkennungsempfindlichkeit";
		case "lblMotionDetectionType":
			return "Erkennungsart";
		case "lblRotationSpeed":
			return "Bewegungsgeschwindigkeit";
		case "lblMotionTracking":
			return "Bewegungsverfolgung";
		case "lblHeaderLoiteringDetection":
			return "Erkennung von verdächtigem Verhalten";
		case "lblLoiteringDetection":
			return "Erkennung von verdächtigem Verhalten";
		case "lblLoiteringDetectionRange":
			return "Erfassungsbereich";
		case "lblLoiteringDetectionLength":
			return "Erkennungsdauer";
		case "lblLoiteringResponse":
			return "Reaktion auf verdächtiges Verhalten";
		case "lblHeaderDeliveryGuard":
			return "Lieferungsüberwachung";
		case "lblDeliveryGuard":
			return "Lieferungsüberwachung";
		case "lblDeliveryGuardPackageGuarding":
			return "Paketschutz";
		case "lblDeliveryGuardUncollectedPackageAlert":
			return "Benachrichtigung über nicht abgeholte Pakete";
		case "lblDeliveryGuardPackageLiveCheckAssistance":
			return "Live-Überprüfung auf Pakete";
		case "lblHeaderRingAutoResponse":
			return "automatische Klingel-Reaktion";
		case "lblRingAutoResponse":
			return "automatische Klingel-Reaktion";
		case "lblRingAutoResponseVoice":
			return "automatische Sprachausgabe";
		case "lblHeaderSoundDetection":
			return "Geräuscherkennung";
		case "lblSoundDetection":
			return "Geräuscherkennung";
		case "lblSoundDetectionSensitivity":
			return "Erkennungsempfindlichkeit";
		case "lblSoundDetectionType":
			return "Erkennungsart";
		case "lblSoundDetectionRoundLook":
			return "Rundumblick nach Geräuscherkennung";
		case "lblHeaderPowerManager":
			return "Power Manager";
		case "lblPowerWorkingMode":
			return "Arbeitsmodus";
		case "lblPowerSource":
			return "Energiequelle";
		case "lblDetectionStatistic":
			return "Erkennungsstatistik";
		case "lblHeaderContinuousRecording":
			return "Daueraufzeichnung";
		case "lblContinuousRecording":
			return "Daueraufzeichnung";
		case "lblContinuousRecordingType":
			return "Art der Daueraufzeichnung";
		case "lblHeaderVideoSettings":
			return "Videoeinstellungen";
		case "lblStatusLed":
			return "Status LED";
		case "lblWatermark":
			return "Wasserzeichen";
		case "lblVideoRecordingQuality":
			return "Aufzeichnungsqualität";
		case "lblVideoStreamingQuality":
			return "Streamingqualität";
		case "lblNightvision":
			return "Nachtsicht";
		case "lblVideoWdr":
			return "HDR";
		case "lblFlickerAdjustment":
			return "Bildwiederholrate";
		case "lblHeaderAudioSettings":
			return "Audioeinstellungen";
		case "lblMicrophone":
			return "Mikrofon";
		case "lblSpeaker":
			return "Lautsprecher";
		case "lblRingtoneVolume":
			return "Klingeltonlautstärke der Türklingel";
		case "lblHeaderDualCamWatchViewMode":
			return "Anzeige der beiden Kameras";
		case "lblDualCamWatchViewMode":
			return "Anzeige der beiden Kameras";
		case "lblChimeSettings":
			return "Klingeleinstellungen";
		case "lblChimeIndoor":
			return "USB Dongle als Klingel";
		case "lblChimeHomebase":
			return "HomeBase als Klingel";
		case "lblHeaderLightSettings":
			return "Lichteinstellungen";
		case "lblManualLighting":
			return "manuelle Beleuchtung";
		case "lblScheduleLighting":
			return "zeitgesteuerte Beleuchtung";
		case "lblMotionLighting":
			return "Beleuchtung bei erkannter Bewegung";
		case "lblChirpSettings":
			return "Toneinstellungen";
		case "lblChirpTone":
			return "Bestätigungston";
		case "lblHeaderPanAndTilt":
			return "Schwenken und Neigen";
		case "lblMoveToPreset":
			return "Anfahren der gespeicherten Positionen";
		case "lblHeaderNotificationSettings":
			return "Benachrichtigungen";
		case "lblNotification":
			return "Benachrichtigungen aktivieren";
		case "lblNotificationType":
			return "Art der Benachrichtigung";
		case "lblNotificationSend":
			return "Benachrichtigung senden";
		case "lblNotificationIntervalTime":
			return "Zeit zwischen zwei Benachrichtigungen";
		case "lblHeaderInteractionCCU":
			return "Interaktion mit der CCU";
		case "lblInteractionMotion":
			return "Reaktion bei Bewegung";
		case "lblInteractionRadarMotion":
			return "Reaktion bei durch Radar erkannter Bewegung";
		case "lblInteractionPerson":
			return "Reaktion bei erkannter Person";
		case "lblInteractionPet":
			return "Reaktion bei erkanntem Haustier";
		case "lblInteractionCrying":
			return "Reaktion bei Weinen";
		case "lblInteractionSound":
			return "Reaktion bei erkanntem Geräusch";
		case "lblInteractionStrangerPerson":
			return "Reaktion bei erkannter fremder Person";
		case "lblInteractionVehicle":
			return "Reaktion bei erkanntem Fahrzeug";
		case "lblInteractionDog":
			return "Reaktion bei erkanntem Hund";
		case "lblInteractionDogLick":
			return "Reaktion bei erkanntem Hundelecken";
		case "lblInteractionDogPoop":
			return "Reaktion bei erkanntem Hundehaufen";
		case "lblInteractionRing":
			return "Reaktion bei Klingelbetätigung";
		case "lblInteractionSensorOpen":
			return "Reaktion beim Öffnen des Magnetkontakts";
		case "lblInteractionSensorClose":
			return "Reaktion beim Schließen des Magnetkontakts";
		case "lblNotSupportedStationHeading":
			return "Dieses Gerät wird nicht vollständig unterstützt.";
		case "lblNotSupportedStationMessage":
			return `Sie können bei der Weiterentwicklung helfen, in dem Sie die Informationen der beiden Abfragen "<a href="${options[0]}" target=”_blank” class="alert-link">StationProperties</a>" und "<a href="${options[1]}" target=”_blank” class="alert-link">StationPropertiesMetadata</a>" dem Entwickler zur Verfügung stellen.`
		case "lblNotSupportedStationMessageSolo":
			return `Da es sich bei dem Gerät um ein integriertes Gerät handelt, stellen Sie bitte zusätzlich die Informationen der beiden Abfragen "<a href="${options[0]}" target=”_blank” class="alert-link">StationProperties</a>" und "<a href="${options[1]}" target=”_blank” class="alert-link">StationPropertiesMetadata</a>" dem Entwickler zur Verfügung.`
		case "lblNotSupportedStationSubText":
			return "Die Abfragen liefern Ergebnisse, bei denen Seriennummern eingekürzt sowie Links entfernt wurden. Bitte prüfen Sie, ob weitere Daten enthalten sind, die Sie entfernen möchten.";
		case "lblNotSupportedStationNoSaving":
			return "Das Speichern der Einstellungen ist zur Zeit nicht möglich.";
		case "lblUnknownStationHeading":
			return "Dieses Gerät wird nicht unterstützt.";
		case "lblUnknownStationMessage":
			return `Das Gerät ist unbekannt. Sie können sich unter Angabe der Modellnummer (${options[0]}) sowie der Bezeichnung des Gerätes an den Entwickler wenden, so dass das Gerät eventuell implementiert werden kann.`
		case "lblUnknownStationNoSaving":
			return "Das Speichern der Einstellungen ist zur Zeit nicht möglich.";
		case "lblAlarmTone":
			return "Alarmton";
		case "lblPromptVolume":
			return "Eingabeaufforderung";
		case "lblPushNotification":
			return "Pushbenachrichtigungen";
		case "lblPushNotificationDesc":
			return "Pushbenachrichtigungen senden, bei:";
		case "lblTimeSettings":
			return "Zeiteinstellungen";
		case "lblTimeZone":
			return "Zeitzone";
		case "lblTimeFormat":
			return "Zeitformat";
		case "lblCrossCameraTracking":
			return "Kameraübergreifende Überwachung";
		case "lblContinuousTrackingTime":
			return "Dauer des kameraübergreifenden Trackings";
		case "lblTrackingAssistance":
			return "Assistent für kameraübergreifende Überwachung";
		case "lblStorageInfoHeader":
			return "Speicherinformationen";
		case "lblInternalStorage":
			return "interner Speicher";
		case "lblInternalEmmcStorage":
			return "internes EMMC Laufwerk";
		case "lblHddStorage":
			return "Festplatte"
		case "lblLastStateChange":
			return "letzer Statuswechsel";
		case "lblHouseManagementStationsAndDevicesOfHome":
			return `Stationen und Geräte von '${options[0]}'`;
		case "lblUDPPortStationLabel":
			return `UDP Port für Verbindung mit der Station ${options[0]} (${options[1]}).`;
		case "lblUDPPortStationPlaceholder":
			return `UDP Port ${options[0]}`;
		case "lblUDPPortStationSubText":
			return "Der angegebene Port darf nicht in Verwendung und keiner anderen Station zugeordnet sein.";
		case "lblUDPPortStationError":
			return "Bitte geben Sie eine Zahl zwischen 1 und 65535 ein. Diese Zahl darf keiner anderen Station zugeordnet sein.";
		case "lblTokenNoToken":
			return "Es ist kein Token gespeichert. Beim nächsten erfolgreichen Login wird ein neues Token erzeugt.";
		case "lblTokenOk":
			return `Das zur Zeit genutzte Token läuft am ${options[0]} ab. Es wird vorher aktualisiert.`;
		case "lblTokenUnknown":
			return `Der Ablaufzeitpunkt des Tokens ist unbekannt ('${options[0]}').`;
		case "lblSystemVariableAvailable":
			return "Systemvariable vorhanden";
		case "lblSystemVariableCreate":
			return "Systemvariable anlegen";
		case "lblSystemVariableRemove":
			return "Systemvariable entfernen";
		case "lblSystemVariableUpdate":
			return "Systemvariable aktualisieren";
		case "lblSettingsTroubleShootingDisable":
			return "Fehlerbehebung deaktivieren";
		case "lblSettingsTroubleShootingEnable":
			return "Fehlerbehebung aktivieren";
		case "lblLogLevelToHighTraceMessage":
			return "Sie haben den Umfang der Protokollierung so gewählt, dass zusätzlich auch TRACE und DEBUG Informationen protokolliert werden. Dies kann zu einer großen Protokolldatei führen. Wählen Sie für den normalen Betrieb die Protokollierungsstufe Information oder niedriger aus.";
		case "lblLogLevelToHighDebugMessage":
			return "Sie haben den Umfang der Protokollierung so gewählt, dass zusätzlich auch DEBUG Informationen protokolliert werden. Dies kann zu einer großen Protokolldatei führen. Wählen Sie für den normalen Betrieb die Protokollierungsstufe Information oder niedriger aus.";
		case "lblLogLevelToHighSubText":
			return "Diese Einstellung bleibt dauerhaft auch nach einem Neustart des Addons oder der CCU aktiv.";
		case "lblFileIsEmpty":
			return `Die Datei '${options[0]}' ist leer.`;
		case "lblFileIsNotAvailable":
			return `Die Datei '${options[0]}' existiert nicht.`;
		case "lblHeaderApiSettingsErrorCaptcha":
			return "Loginversuch wird durchgeführt";
		case "lblMessageApiSettingsErrorCaptcha":
			return "Bitte warten Sie, wärend der Captcha-Code überprüft wird. Sie werden anschließend auf die vorherige Seite weitergeleitet.";
		case "lblHeaderApiSettingsError":
			return "Service wird neu gestartet";
		case "lblMessageApiSettingsError":
			return "Bitte warten Sie, wärend der Service neu gestartet wird. Sie werden anschließend auf die vorherige Seite weitergeleitet.";
		case "emmcCapacity":
		case "hddCapacity":
			return "Speicherkapazität";
		case "emmcCapacityUsed":
		case "hddCapacityUsed":
			return "belegter Speicher";
		case "emmcCapacityAvailable":
		case "hddCapacityAvailable":
			return "verfügbarer Speicher";
		case "emmcVideoUsed":
		case "hddVideoUsed":
			return "von Videos belegter Speicher";
		case "emmcHealthState":
			return "Laufwerkszustand";
		case "hddHddType":
			return "Laufwerkstyp";
		case "hddIsHdd":
			return "HDD";
		case "hddIsSsd":
			return "SSD";
		case "hddIsUnknown":
			return "unbekannt";
		case "hddCurrentTemperature":
			return "aktuelle Temperatur";
		case "titleDeviceDisabled":
			return "Gerät deaktiviert";
		case "strLoadingVersionInfo":
			return "Lade verfügbare Versionsinformationen...";
		case "strLoadingSettings":
			return "Laden der Einstellungen...";
		case "strLoadingHouses":
			return "Laden der Häuser...";
		case "strLoadingStations":
			return "Laden der Stationen...";
		case "strLoadingSystemVariables":
			return "Laden der Systemvariablen...";
		default:
			return `{${content}}`;
	}
}

function translateString(content) {
	switch(content) {
		case "strLoadingSettings":
			return "Laden der Einstellungen...";
		case "strWaitWhileLoading":
			return "wird geladen...";
		case "strOk":
			return "OK";
		case "strLow":
			return "niedrig";
		case "strInteractionSave":
			return "Speichern";
		case "strInteractionUnstoredTest":
			return "Eingabe testen"
		case "strInteractionStoredTest":
			return "gespeicherte Interaktion testen";
		case "strInteractionDelete":
			return "Löschen";
		case "strUserDefiniedSpec":
			return "Benutzerdefinierte";
		case "strPowerManagerSpec":
			return "Power Manager";
		case "strSettings":
			return "Einstellungen";
		case "strCurrentState":
			return "aktueller Status";
		case "strLastChargingDays":
			return "Tage seit letztem Ladevorgang";
		case "strWorkingDays":
			return "Arbeitstage";
		case "strEventsDetected":
			return "Ereignisse erkannt";
		case "strEventsRecorded":
			return "Ereignisse aufgezeichnet";
		case "strRebootStation":
			return "Station neu starten";
		case "strActive":
			return "eingeschaltet";
		case "strInactive":
			return "ausgeschaltet";
		case "strActivate":
			return "einschalten";
		case "strDeactivate":
			return "ausschalten";
		case "strLoadingCountries":
			return "Laden der Länder...";
		case "strLoadingStations":
			return "Laden der Stationen...";
		case "strSystemVariablesTableHeaderState":
			return "Status";
		case "strSystemVariablesTableHeaderSVName":
			return "Name der Systemvariable";
		case "strSystemVariableAvailable":
			return "angelegt";
		case "strSystemVariableNotAvailable":
			return "nicht angelegt";
		case "strSystemVariablesUnusedHintHeader":
			return "Veraltete Systemvariablen";
		case "strSystemVariablesUnusedHintMessage":
			return "Die nachfolgenden mit 'eufy' beginnenden Systemvariablen werden nicht mehr genutzt und können entfernt werden.";
		case "strSettingsSaving":
			return "Einstellungen werden gespeichert...";
		case "strSystemVariableCreating":
			return "Erzeugen der Systemvariablen...";
		case "strSystemVariableUnusedRemoving":
			return "Laden der veralteten Systemvariablen...";
		case "strUploadConfigUploadingAndTesting":
			return "Datei wird hochgeladen und überprüft...";
		case "strLoadingLogFile":
			return "Lade Protokolldatei...";
		case "strAddOnName":
			return "eufy Security AddOn";
		case "strClientName":
			return "eufy Security Client";
		case "strHomeMaticApi":
			return "HomeMatic API";
		case "strWebsite":
			return "Webseite";
		case "strLoadingModules":
			return "Lade Liste der installierten Abhängigkeiten...";
		case "strLoadingUpdates":
			return "Ermittle Updates...";
		case "strNoModuleUpdateFound":
			return "Es wurde keine Abhängigkeiten gefunden, die aktualisiert werden können.";
		case "strOneModuleUpdateFound":
			return "Es wurde eine Abhängigkeit gefunden, die aktualisiert werden kann.";
		case "strMoreModuleUpdateFound":
			return "Es wurden mehrere Abhängigkeiten gefunden, die aktualisiert werden können.";
		case "strServiceRunning":
			return "Service läuft.";
		case "strServiceStarted":
			return "Service wurde gestartet.";
		case "strWaitWhileLogin":
			return "Warte auf Loginversuch...";
		case "strWaitWhileInit":
			return "Warte auf Initialisierung des Services...";
		case "strLoginFinished":
			return "Loginversuch beendet. Sie werden nun weitergeleitet...";
		case "strInitFinished":
			return "Service wurde initializiert. Sie werden nun weitergeleitet...";
		case "strLanguageFile":
			return "Sprache";
		case "strVersion":
			return "Version";
		case "strMoveToPreset01":
			return "zu Position 1";
		case "strMoveToPreset02":
			return "zu Position 2";
		case "strMoveToPreset03":
			return "zu Position 3";
		case "strMoveToPreset04":
			return "zu Position 4";
		case "strEditInteractionStart":
			return "zur Bearbeitung ausklappen";
		case "strEditInteractionEnd":
			return "einklappen";
		case "strUnknownDevice":
			return "unbekanntes Gerät";
		default:
			return `{${content}}`;
	}
}

function translateSystemVariableInfo(info) {
	switch(info) {
		case "eufyCurrentState":
			return "aktueller Modus des eufy Systems";
		case "eufyLastConnectionResult":
			return "Ergebnis der letzten Kommunikation mit eufy";
		case "eufyLastConnectionTime":
			return "Zeitpunkt der letzten Kommunikation mit eufy";
		case "eufyLastStatusUpdateTime":
			return "Zeitpunkt der letzten Aktualisierung des eufy Systemstatus";
		case "eufyLastModeChangeTime":
			return "Zeitpunkt des letzten Moduswechsels";
		case "eufyCentralState":
			return "aktueller Status der Basis";
		case "eufyLastModeChangeTimeStation":
			return "Zeitpunkt des letzten Moduswechsels der Basis";
		case "eufyCameraVideoTime":
			return "Zeitpunkt des letzten Videos der Kamera";
		default:
			return `{${info}}`;
	}
}

function translateGuardMode(guardMode) {
	switch(guardMode) {
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

function translatePropertyName(propertyName) {
	switch(propertyName) {
		case "enabled":
			return "Gerät aktivieren";
		case "antitheftDetection":
			return "Diebstahlerkennung aktivieren";
		case "statusLed":
			return "Status LED aktivieren";
		case "imageMirrored":
			return "Bild spiegeln aktivieren";
		case "motionAutoCruise":
			return "Auto-Cruise aktivieren";
		case "autoCalibration":
			return "automatische Kalibirierung aktivieren";
		case "light":
			return "Scheinwerfer aktivieren";
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
			return "Bewegungsverfolgung aktivieren";
		case "soundDetection":
			return "Geräuscherkennung aktivieren";
		case "soundDetectionType":
			return "Erkennungsart";
		case "soundDetectionSensitivity":
			return "Erkennungsempfindlichkeit";
		case "soundDetectionRoundLook":
			return "Rundumblick nach Geräuscherkennung aktivieren";
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
		case "flickerAdjustment":
			return "Bildwiederholrate";
		case "lightSettingsEnable":
			return "Scheinwerfereinstellungen aktivieren";
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
		case "crossCameraTracking":
			return "Kameraübergreifende Überwachung aktivieren";
		case "continuousTrackingTime":
			return "Dauer des kameraübergreifenden Trackings auswählen";
		case "trackingAssistance":
			return "Assistent für kameraübergreifende Überwachung aktivieren";
		case "sdCapacityUsedPercent":
		case "emmcCapacityUsedPercent":
		case "hddCapacityUsedPercent":
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
			return "Benachrichtigungston auswählen";
		case "chirpVolume":
			return "Lautstärke Bestätigungstons";
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
			return "CCU, auf der die Interaktion ausgeführt werden soll";
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
			return "Bitte entweder 'localhost', die IP-Adresse oder den DNS-Namen der Ziel-CCU eingeben, ohne die Angabe von 'http://' oder 'https://'.";
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
			return "Verbindung über HTTPS herstellen";
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
			return "Zertifikat der lokalen CCU benutzen";
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
			return "Verbindung nach negativer Zertifikatsüberprüfung abbrechnen";
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
			return "Benutzername zur Anmeldung and die CCU";
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
			return "Der Benutzername wird nur benötigt, wenn Sie die Autentifizierung in den Einstellungen der CCU aktiviert haben und eine andere als die CCU auswählen, auf der dieses Addon ausgeführt wird.";
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
			return "Passwort zur Anmeldung and die CCU";
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
			return "Das Passwort wird nur benötigt, wenn Sie die Autentifizierung in den Einstellungen der CCU aktiviert haben und eine andere als die CCU auswählen, auf der dieses Addon ausgeführt wird.";
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
			return "Befehl, der ausgeführt werden soll";
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
			return "Der hier einzugebende Befehl sollte im Vorfeld über die Skript-Testen-Funktion der CCU getestet werden.";
		case "notificationIntervalTime":
			return "Dauer zwischen zwei Benachrichtigungen";
		default:
			return propertyName;
	}
}

function translateDeviceStateValue(state, propertyName, value) {
	switch(state) {
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
		case "Not Charging":
			return "nicht ladend";
		case "Always":
			return "immer";
		case "Schedule":
			return "nach Zeitplan"
		case "Off":
			switch(propertyName) {
				case "watermark":
					if(value == 1) {
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
			switch(propertyName) {
				case "watermark":
					return "mit Logo";
				case "nightvision":
					return "Nachtsicht aktivieren";
				default:
					return state;
			}
		case "Timestamp":
			return "Zeitstempel";
		case "Timestamp and Logo":
			return "Zeitstempel und Logo";
		case "B&W Night Vision":
			return "schwarz/weiß Nachtsicht";
		case "Color Night Vision":
			return "farbige Nachtsicht";
		case "Low":
			switch(propertyName) {
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
			switch(propertyName) {
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "minimal";
			}
		case "Medium":
			switch(propertyName) {
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
			switch(propertyName) {
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
			switch(propertyName) {
				case "rotationSpeed":
				case "soundDetectionSensitivity":
					return "maximal";
			}
		case "All Sounds":
			return "alle Geräusche";
		case "Crying":
			return "Weinen";
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
		case "3ft":
			return "0,9m";
		case "6ft":
			return "1,8m";
		case "10ft":
			return "3,0m";
		case "15ft":
			return "4,6m";
		case "20ft":
			return "6,1m";
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
		case "Bottom-Right Picture-in-Picture":
			return "Bild-in-Bild: unten rechts";
		case "Split-view":
			return "geteilte Ansicht";
		case "Single view":
			return "Anzeige einer Kamera";
		case "Double view":
			return "Anzeige beider Kameras";
		case "Daily":
			switch(propertyName) {
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "tageslichtweiß";
			}
		case "Colored":
			switch(propertyName) {
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "farbig";
			}
		case "Dynamic":
			switch(propertyName) {
				case "lightSettingsManualLightingActiveMode":
				case "lightSettingsScheduleLightingActiveMode":
				case "lightSettingsMotionLightingActiveMode":
					return "dynamisch";
			}
		case "Cold":
			switch(propertyName) {
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "kaltweiß";
			}
		case "Warm":
			switch(propertyName) {
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "warmweiß";
			}
		case "Very warm":
			switch(propertyName) {
				case "lightSettingsManualDailyLighting":
				case "lightSettingsScheduleDailyLighting":
				case "lightSettingsMotionDailyLighting":
					return "sehr warmes weiß";
			}
		case "Aurora":
			switch(propertyName) {
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Polarlicht";
			}
		case "Warmth":
			switch(propertyName) {
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Wärme";
			}
		case "Let's Party":
			switch(propertyName) {
				case "lightSettingsManualDynamicLighting":
				case "lightSettingsScheduleDynamicLighting":
				case "lightSettingsMotionDynamicLighting":
					return "Partylicht";
			}
		case "Fast":
			switch(propertyName) {
				case "lightSettingsMotionActivationMode":
					return "schnell";
			}
		case "Smart":
			switch(propertyName) {
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
		case "Open":
			return "offen";
		case "Closed":
			return "zu";
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