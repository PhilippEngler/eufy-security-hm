# eufy Security AddOn for HomeMatic - eufy-security-hm
With this addon for the ELV/eq-3 CCU3 or a central based on the CCU3 (like RaspberryMatic) you can control your eufy security system and integrate it in your existing connected home environment. The addon provide a web-based user interface for configuration and monitoring. The communication between your eufy security system and your CCU is done by using predefined system variables. For interaction with your eufy security device there is an API.

> Starting with the v1.7.0 branch, the file format for the config is changed from *ini* to *json*. At the first startup, the config will be automatically converted to *json*. Please backup your existing *ini* config before updating to any newer version. With the v2.0.0 branch, the capability to read the *ini* files will be removed. That means, that from v2.0.0 onwards, the *ini* to *json* converting process will be removed.

## Features
This addon supports multiple stations and multiple cams. The login token is stored in the config, so there is no need to login every time a connection to eufy is established. After retrieving the stations at startup, the local network address of each station is stored in the config and will be used for switching the guard mode.

## Devices
The addon will only run with the original CCU3 Firmware and other community projects (RaspberryMatic, piVCCU and debmatic).
* CCU3 or RaspberryMatic on arm processors: use the *ccu3* package (CCU1 and CCU2 are not supported)
* RaspberryMatic running on RaspberryPi 3 or 4 based hardware: you can use the *arm64* instead of the *ccu3* package
* RaspberryMatic on OVA platforms: use the *amd64* package

Theoretically, most of the eufy security devices should be compatible. There might be issues with new devices. The following eufy security devices are known as compatible (please report other compatible devices):
* HomeBase: HomeBase E (T8002), HomeBase 2 (T8010) and HomeBase 3 (T8030)
* eufyCam: eufyCam E (T8112), eufyCam 2C (T8113), eufyCam 2 (T8114), eufyCam 2C Pro (T8142), eufyCam 2 Pro (T8140) and eufyCam 3C (T8161)
* IndoorCam: IndoorCam C24 (T8400) and IndoorCam P24 (T8410)

## Installation
To install this addon on your CCU follow these steps:
1. Download the latest version from release as tar.gz-file. Do not extract this file (important for Apple users).
2. Open the WebUI of your CCU and navigate to "Einstellungen" -> "Systemsteuerung" -> "Zusatzsoftware" and select the tar.gz-file downloaded in step 1.
3. Click on "Installieren" and wait about one minute.
4. In the new popup, select "Installation starten".
5. - If you use the original CCU3 firmware: Wait at least 10 minutes to install. During this time, the WebUI is not accessible and you will receive several error messages. Please ignore these messages. When the installation is done, the CCU will reboot automatically.
   - If you use a RaspberryMatic: The installation is much faster and the CCU will not reboot.
6. When the installation is done, navigate to http://<IP_OF_CCU>/addons/eufySecurity and start configuration of the addon.

## Configuration
On the website of the addon (http://<IP_OF_CCU>/addons/eufySecurity), navigate to "Einstellungen" and provide your eufy security account data. Please read also the Notes section.
After you click on "Einstellungen speichern", the addon will restart the API and you will see your stations and devices under "Geräte". More information how to use this addon you will find on the "Über" page in the addon website.

For creating the needed system variables, please use the table of system variables on the "Einstellungen" page of the addons website.

## Notes
### Account
1. Please do not use 2FA with the the eufy security account you want to use with this addon.
2. Please do not use the account on multiple devices (use the account only for this addon).
3. You can share the stations and cams are with the account *or* include the account to your created home.

### Addon
1. To reduce the size of the backup, some folders are excluded. The configfile is included in the backup. So simply reinstall the addon after restoring the ccu.
2. For communication between API and stations or devices you need to change the firewall settings of your CCU.
   - For communicating with the API you have to open at least these two ports (standard setting: 52789 and 52790). From v.1.0.3 on you can specify the ports for the API individually. In this case you need to enter these values.
   - For communicating with the stations or devices you must set the firewall to open all ports (set the rule to ports open) if you are using the default setting. Alternatively you can specify ports to use. In this case you need to exclude the specified ports in the firewall settings.
4. If you run piVCCU in a container add the port forwarding to the ports, e.g. in /etc/network/if-up.d/pivccu add `iptables -t nat -A PREROUTING -p tcp -i $HOST_IF --dport 52789 -j DNAT --to-destination $CCU_IP:52789` and `iptables -t nat -A PREROUTING -p tcp -i $HOST_IF --dport 52790 -j DNAT --to-destination $CCU_IP:52790` (for the two standard ports).
5. If your HomeBase firmware is equal or higher than 2.1.6.9(h), you must use an addon-version equal or greater than 1.5.0.

## Credits
This addon based on the [eufy-security-client](https://github.com/bropat/eufy-security-client) of @bropat. Some changes were done for adapting the client to the api. The following projects also influenced this project:
- [https://github.com/FuzzyMistborn/python-eufy-security](https://github.com/FuzzyMistborn/python-eufy-security)
- [https://github.com/keshavdv/python-eufy-security/tree/p2p](https://github.com/keshavdv/python-eufy-security/tree/p2p)
- [https://github.com/bropat/ioBroker.eufy-security](https://github.com/bropat/ioBroker.eufy-security)
- [https://github.com/JanLoebel/eufy-node-client](https://github.com/JanLoebel/eufy-node-client)

For integrating into the CCU the knowledge of
- Jens Maus [https://github.com/jens-maus](https://github.com/jens-maus)
- Sebastian Raff [https://github.com/hobbyquaker](https://github.com/hobbyquaker)
and the community of the HomeMatic-Forum [https://www.homematic-forum.de](https://www.homematic-forum.de) was appreciated.

The addons website is built on bootstrap [https://getbootstrap.com/](https://getbootstrap.com/).

Also I would like to say thank the people sponsoring this project. I appreciate that. Thank you very much.

eufy, eufy security, ELV, eq-3, CCU, HomeMatic, homematic ip and RaspberryMatic are trademarks of their respective owners.
