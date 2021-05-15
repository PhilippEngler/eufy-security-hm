# eufy Security AddOn for HomeMatic - eufy-security-hm
With this addon for the ELV/eq-3 CCU3 or a central based on the CCU3 (like RaspberryMatic) you are able to control your eufy security system and integrate them in your existing connected home environment. The addon provide a web based user interface for configuaration and monitoring and an API to communicate with your eufy security system and your CCU by using predefinied system variables.

## Features
This addon suports multiple bases and multiple cams. The login token is stored in the config, so there is no need to login every time a connection to eufy is established. After retrieving the bases at startup, the local network address of each base is stored in the config and will be used for switching the mode.

## Devices
* CCU3 or RaspberryMatic (only RaspberryPi modells are tested; CCU1 and CCU2 are not supported)
* The following eufy security devices are known as compatible at the moment (please report other devices if they are compatible):
  * HomeBase: HomeBase E (T8002) and HomeBase 2 (T8010)
  * eufyCam: eufyCam E (T8112), eufyCam 2C (T8113), eufyCam 2 (T8114) and eufyCam 2C Pro (T8142)

## Installation
To install this addon on your CCU follow these steps:
1. Download the lastest version from release as tar.gz-file. Do not extract this file (important for Apple users).
2. Open the WebUI of your CCU and navigate to "Einstellungen" -> "Systemsteuerung" -> "Zusatzsoftware" and select the tar.gz-file downloaded in step 1.
3. Click on "Installieren" and wait about one minute.
4. In the new popup, select "Installation starten".
5. - If you use a orginal CCU: Wait at least 10 minutes to install. During this time, the WebUI is not accessable and you will receive several error messages. Please ignore these error messages. When the installiation is done, the CCU will reboot automatically.
   - If you use a RaspberryMatic, the installation is mutch faster and the CCU will not reboot.
6. When the installation is done, navigate to http://<IP_OF_CCU>/addons/eufySecurity and start configuration of the addon.

## Configuration
On the website of the addon (http://<IP_OF_CCU>/addons/eufySecurity), navigate to "Einstellungen" and provide your eufy security account data. Please note, that this eufy security account does not use 2FA, is only used for this addon and the bases and cams are shared with this account. After you click on "Einstellungen speichern", the addon will be restarting the API and you will see your devices under "Geräte". More information how to use this addon you will find on the "Über" page in the addon website.

For creating the needed system variables you have two alternatives.
- Run the two HM-Script files provided in the HMScript folder. On your CCUs WebUI you navigate to "Programme und Verknüpfungen" -> "Programme & Zentralenverknüpfungen" and click on "Skript testen" on the bottom of the website. Than copy the content of HM-Script-files into the window and execute.
or
- Use the table of system variables on the "Einstellungen" page of the addons website. The problem with the description text was fixed in v1.0.4.

## Notes
1. To reduce the size of the backup, some folders are excluded. The configfile is included in the backup. So simply reinstall the addon after restoring the ccu.
2. For communication with your API or HomeBase you need to change the firewall settings of your CCU.
   - For communicating with the API you have to open at least these two ports (standard setting: 52789 and 52790). From v.1.0.3 on you are able to specify the ports for the API individually. In this case you need to enter these values.
   - For communicating with the HomeBaseFrom you have to set the firewall to open all ports (set the rule to ports open) if you are using the default setting. From v1.0.2 on you can specify ports to use. In this case you need to exclude the specified ports in the firewall settings.
4. If you run piVCCU in a container add the port forwarding to the two api ports, e.g. in /etc/network/if-up.d/pivccu add `iptables -t nat -A PREROUTING -p tcp -i $HOST_IF --dport 52789 -j DNAT --to-destination $CCU_IP:52789` and `iptables -t nat -A PREROUTING -p tcp -i $HOST_IF --dport 52790 -j DNAT --to-destination $CCU_IP:52790` (for the two standard ports).
5. If your HomeBase firmware is equal or higher than 2.1.6.9(h), you have to use an addon-version greater than 1.0.7.

## Credits
This addon based on the [eufy-node-client](https://github.com/JanLoebel/eufy-node-client) of @JanLoebel. Some changes were done for example to support multiple bases, close the P2P connection or an other implementation for configuration data. The following projects also influenced this project:
- [https://github.com/FuzzyMistborn/python-eufy-security](https://github.com/FuzzyMistborn/python-eufy-security)
- [https://github.com/keshavdv/python-eufy-security/tree/p2p](https://github.com/keshavdv/python-eufy-security/tree/p2p)
- [https://github.com/bropat/ioBroker.eufy-security](https://github.com/bropat/ioBroker.eufy-security)

For integrateing into the CCU the knowledge of
- Jens Maus [https://github.com/jens-maus](https://github.com/jens-maus)
- Sebastian Raff [https://github.com/hobbyquaker](https://github.com/hobbyquaker)
and the community of the HomeMatic-Forum [https://www.homematic-forum.de](https://www.homematic-forum.de) was appreciated.

The addons website is build on bootstrap [https://getbootstrap.com/](https://getbootstrap.com/).

eufy, eufy security, ELV, eq-3, CCU, HomeMatic, homematic ip and RaspberryMatic are trademarks of there respective owners.
