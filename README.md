# eufy Security AddOn for OpenCCU - eufy-security-hm
> [!IMPORTANT]
> This addon is independent of Anker and eufy. eufy does not provide an open API, in case of any problems with this addon please *do not* contact eufy.

> [!NOTE]
> CCU3 users with firmware other than OpenCCU / RaspberryMatic please note:
> Starting with version v3.0.0, this addon will no longer be compatible to the CCU3 with firmware other than OpenCCU / RaspberryMatic. If you operate a CCU3 with firmware other than OpenCCU / RaspberryMatic please read the [Notes | CCU3 with firmware other than OpenCCU / RaspberryMatic](#ccu3-with-firmware-other-than-OpenCCU-or-RaspberryMatic) section.

With this addon for the ELV/eq-3 CCU3 (operated with OpenCCU / RaspberryMatic) or a central based on OpenCCU / RaspberryMatic or debmatic you can control your eufy security system and integrate it in your existing connected home environment. The addon provide a web-based user interface for configuration and monitoring. Communication between your eufy security system and your OpenCCU is done by using predefined system variables. For interaction with your eufy security device there is an API.

## Features
This addon supports multiple stations and multiple devices. The login token is stored in the config, so there is no need to login every time a connection to eufy is established. After retrieving the stations at startup, the local network address of each station is stored in the config and will be used for switching the guard mode.
Since v2.6.0 the addon has a multi-language website, since v3.2.2 the system variables will be filled localized. Currently German and English are supported.
Some of the key features are:
* view and change the guard mode of your stations
* view and edit settings of your stations and devices
* some states (e.g. guard mode) are written to system variables (if configured)
* execute interactions to specific events (e.g. motion detected) by using HMScript

## Devices
Starting with v3.0.0, the addon will only run with OpenCCU, RaspberryMatic and debmatic. The CCU3 with firmware other than OpenCCU / RaspberryMatic and piVCCU will currently not support v3.0.0 and newer.
* CCU3 with firmware other than OpenCCU / RaspberryMatic: use the *ccu3* package (CCU1 and CCU2 are not supported) [not supported by v3.0.0 and newer]
* OpenCCU and RaspberryMatic:
  * on arm-based hardware other than RaspberryPi 3 or 4: use the *arm32* flagged *.tar.gz*-package
  * on RaspberryPi 3 or 4 based hardware (including RaspberryMatic running on CCU3): you can use the *arm64* flagged *.tar.gz*-package
  * on OVA platforms: use the *amd64* flagged *.tar.gz*-package
* debmatic:
  * on other arm-based hardware than RaspberryPi 3 or 4: use the *arm32* flagged *.deb*-package
  * on RaspberryPi 3 or 4 based hardware (including RaspberryMatic running on CCU3): you can use the *arm64* flagged *.deb*-package
  * on OVA platforms: use the *amd64* flagged *.deb*-package

Most of the eufy security devices should be compatible, but there might be issues with recently released devices. The following eufy security devices are known as compatible:
* HomeBase: HomeBase E (T8002), HomeBase 2 (T8010), HomeBase mini (T8025)<sup>1</sup> and HomeBase 3 (T8030)
* eufyCam: eufyCam E (T8112), eufyCam 2C (T8113), eufyCam 2 (T8114), eufyCam 2C Pro (T8142), eufyCam 2 Pro (T8140), eufyCam 3 (T8160) and eufyCam 3C (T8161)
* IndoorCam: IndoorCam C24 (T8400), IndoorCam P24 (T8410) and IndoorCam S350 (T8416)<sup>1</sup>
* Doorbell: Video Doorbell 2K (T8210), Video Doorbell Dual (T8213) and Video Doorbell Dual E340 (T8214)<sup>1</sup>
* SoloCam: eufyCam C35 (T8110)<sup>1</sup>, SoloCam S340 (T8170)<sup>1</sup>, SoloCam S220 (T8134)<sup>1</sup>
* WallLightCam: Wall Light Cam S100 (T84A1)<sup>1</sup>
* Sensor: Motion Sensor (T8900) and Entry Sensor (T8910)<sup>1</sup>

<sup>1</sup>: This device is not compatible with versions before v3.0.0.

If you are using other devices, please send the files you can find on top of the settings page of the device to me, so that they can properly be integrated in one of the next releases.

## Installation
To install this addon on OpenCCU or RaspberryMatic follow these steps:
1. Download the latest version from release as `.tar.gz`-file for your architecture. Do not extract this file (important for Apple users).
2. Open the WebUI and navigate to "Settings" -> "Control Panel" -> "Additional software" -> "Choose file..." and select the `.tar.gz`-file downloaded in step 1.
3. Click on "Install" and wait about one minute.
4. In the new popup, select "Start installation".
5. - If you use the original CCU3 firmware: Wait at least 10 minutes to install. During this time, the WebUI is not accessible, and you will receive several error messages. Please ignore these messages. When the installation is done, the CCU will reboot automatically.
   - If you use OpenCCU or RaspberryMatic: The installation is much faster and the CCU will not reboot. Please ensure you have a working internet connection.
6. When the installation is done, please go to [Configuration](#configuration).

To install this addon on debmatic follow these steps:
1. Download the latest version from release as `.deb`-file for your architecture.
2. Start installation on your debmatic's command line by typing `sudo apt install <PATH_TO_DEB_FILE>`
6. When the installation is done, please go to [Configuration](#configuration).

## Configuration
After installation, on the website of the addon (`http://<IP_OF_CCU>/addons/eufySecurity`) you will see a popup that will bring you to the "Settings" page. On this page you must provide at least your eufy security account data. Please also read the [Notes | Addon](#addon) section.
> [!TIP]
> If you receive error messages while opening the settings page, please check the [Notes | Firewall settings](#firewall-settings) section.

> [!CAUTION]
> Please use an account created and used only for this addon. Please refer to the [Notes | Addon](#addon) section.

After you click on "Save settings", the addon will restart the API and you will see your stations and devices under "Devices". You will find more information on how to use this addon you will find on the "About" page on the addon website.

For creating the needed system variables, please use the table of system variables on the "Settings" page of the addons website.

## Notes
### Account
- Please do not use 2FA with the eufy security account you want to use with this addon.
- Please do not use the account on multiple devices (use the account only for this addon).
- You can share the stations and devices with the account *or* include the account to your created home.

### Addon
- To reduce the size of the backup, some folders are excluded. The configfile is included in the backup. After restoring the CCU from the backup you must reinstall the addon.
- ONLY FOR VERSIONS OLDER THAN v3.0.0: If you run piVCCU in a container add the port forwarding to the ports, e.g. in `/etc/network/if-up.d/pivccu` add `iptables -t nat -A PREROUTING -p tcp -i $HOST_IF --dport 52789 -j DNAT --to-destination $CCU_IP:52789` and `iptables -t nat -A PREROUTING -p tcp -i $HOST_IF --dport 52790 -j DNAT --to-destination $CCU_IP:52790` (for the two standard ports).

### Firewall settings
For communication between API and stations or devices you need to change the firewall settings of your CCU.
- For communicating with the API, you have to open at least the two ports 52789 and 52790 (default values). You can specify individual ports for the API.
- For communicating with the stations or devices you must set the firewall to open all ports (set the rule to ports open) if you are using the default settings. Alternatively, you can specify for each station one port and exclude this in the firewall settings.

### CCU3 with firmware other than OpenCCU or RaspberryMatic
If you are using a CCU3 with firmware other than OpenCCU / RaspberryMatic, this addon will no longer be compatible. If you want to use the addon from v3.0.0 onwards with your CCU3, please update your CCU3 to OpenCCU. If your CCU3 is already running OpenCCU or RaspberryMatic, no additional steps are necessary.

## Credits
This addon based on the [eufy-security-client](https://github.com/bropat/eufy-security-client) of @bropat. Some changes were made to adapt adapting the client to the API. The following projects also influenced this project:
- [https://github.com/FuzzyMistborn/python-eufy-security](https://github.com/FuzzyMistborn/python-eufy-security)
- [https://github.com/keshavdv/python-eufy-security/tree/p2p](https://github.com/keshavdv/python-eufy-security/tree/p2p)
- [https://github.com/JanLoebel/eufy-node-client](https://github.com/JanLoebel/eufy-node-client)

For integrating into the CCU and debmatic environments the knowledge of
- Jens Maus [https://github.com/jens-maus](https://github.com/jens-maus),
- Sebastian Raff [https://github.com/hobbyquaker](https://github.com/hobbyquaker), 
- Alexander Reinert [https://github.com/alexreinert](https://github.com/alexreinert) and
- the community of the HomeMatic-Forum [https://www.homematic-forum.de](https://www.homematic-forum.de)

was appreciated.

The addons website is built on [Bootstrap](https://getbootstrap.com/) The icons used are the [Bootstrap Icons](https://icons.getbootstrap.com/). To show the log files the [CodeMirror editor](https://codemirror.net/) is used.

I would also like to thank the people who are sponsoring and supporting this project. I appreciate that. Thank you very much.

eufy, eufy security, ELV, eq-3, CCU, HomeMatic, homematic ip, OpenCCU, RaspberryMatic and debmatic are trademarks of their respective owners.