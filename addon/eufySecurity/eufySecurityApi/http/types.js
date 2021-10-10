"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceMotionDetectionIndoorSoloFloodProperty = exports.DeviceMotionDetectionProperty = exports.DeviceStatusLedDoorbellProperty = exports.DeviceStatusLedBatteryDoorbellProperty = exports.DeviceStatusLedIndoorSoloFloodProperty = exports.DeviceStatusLedProperty = exports.DeviceEnabledStandaloneProperty = exports.DeviceEnabledProperty = exports.DeviceWifiRSSIKeypadProperty = exports.DeviceWifiRSSIEntrySensorProperty = exports.DeviceWifiRSSILockProperty = exports.DeviceWifiSignalLevelProperty = exports.DeviceWifiRSSIProperty = exports.DeviceNightvisionProperty = exports.DeviceAutoNightvisionWiredDoorbellProperty = exports.DeviceAutoNightvisionProperty = exports.DeviceAntitheftDetectionProperty = exports.DeviceBatteryIsChargingKeypadProperty = exports.DeviceBatteryTempProperty = exports.DeviceBatteryLowSensorProperty = exports.DeviceBatteryLowKeypadProperty = exports.DeviceBatteryLowMotionSensorProperty = exports.DeviceBatteryLockProperty = exports.DeviceBatteryProperty = exports.GenericDeviceProperties = exports.BaseDeviceProperties = exports.GenericTypeProperty = exports.GenericSWVersionProperty = exports.GenericHWVersionProperty = exports.DeviceSerialNumberProperty = exports.DeviceModelProperty = exports.DeviceNameProperty = exports.PropertyName = exports.DeviceEvent = exports.WifiSignalLevel = exports.TimeFormat = exports.NotificationSwitchMode = exports.AlarmTone = exports.NotificationType = exports.FloodlightMotionTriggeredDistance = exports.PublicKeyType = exports.PowerSource = exports.StorageType = exports.AuthResult = exports.VerfyCodeTypes = exports.ResponseErrorCode = exports.GuardMode = exports.AlarmMode = exports.ParamType = exports.DeviceType = void 0;
exports.DeviceMicrophoneProperty = exports.DeviceFloodlightLightSettingsMotionTriggeredTimerProperty = exports.DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty = exports.DeviceFloodlightLightSettingsMotionTriggeredProperty = exports.DeviceFloodlightLightSettingsBrightnessScheduleProperty = exports.DeviceFloodlightLightSettingsBrightnessMotionProperty = exports.DeviceCameraLightSettingsBrightnessManualProperty = exports.DeviceFloodlightLightSettingsBrightnessManualProperty = exports.DeviceFloodlightLightSettingsEnableProperty = exports.DeviceFloodlightLightProperty = exports.DeviceHiddenMotionDetectionModeWiredDoorbellProperty = exports.DeviceHiddenMotionDetectionSensitivityWiredDoorbellProperty = exports.DeviceMotionDetectionSensitivityWiredDoorbellProperty = exports.DeviceMotionDetectionSensitivityBatteryDoorbellProperty = exports.DeviceMotionDetectionSensitivityIndoorProperty = exports.DeviceMotionDetectionSensitivityCamera1Property = exports.DeviceMotionDetectionSensitivityCamera2Property = exports.DeviceMotionDetectionTypeIndoorProperty = exports.DeviceMotionDetectionTypeFloodlightProperty = exports.DeviceMotionDetectionCamera1Property = exports.DeviceMotionDetectionTypeProperty = exports.DevicePictureUrlProperty = exports.DeviceAdvancedLockStatusProperty = exports.DeviceBasicLockStatusProperty = exports.DeviceMotionSensorPIREventProperty = exports.DeviceSensorChangeTimeProperty = exports.DeviceSensorOpenProperty = exports.DeviceRingingProperty = exports.DeviceCryingDetectedProperty = exports.DeviceSoundDetectedProperty = exports.DevicePetDetectedProperty = exports.DevicePersonDetectedProperty = exports.DeviceMotionDetectedProperty = exports.DeviceLockedProperty = exports.DeviceBatteryUsageLastWeekProperty = exports.DeviceLastChargingFalseEventsProperty = exports.DeviceLastChargingRecordedEventsProperty = exports.DeviceLastChargingTotalEventsProperty = exports.DeviceLastChargingDaysProperty = exports.DeviceStateLockProperty = exports.DeviceStateProperty = exports.DeviceWatermarkBatteryDoorbellCamera1Property = exports.DeviceWatermarkSoloWiredDoorbellProperty = exports.DeviceWatermarkIndoorFloodProperty = exports.DeviceWatermarkProperty = exports.DeviceRTSPStreamUrlProperty = exports.DeviceRTSPStreamProperty = exports.DevicePetDetectionProperty = exports.DeviceSoundDetectionProperty = exports.DeviceMotionDetectionDoorbellProperty = void 0;
exports.DeviceChirpToneEntrySensorProperty = exports.DeviceChirpVolumeEntrySensorProperty = exports.DeviceNotificationMotionWiredDoorbellProperty = exports.DeviceNotificationMotionProperty = exports.DeviceNotificationRingWiredDoorbellProperty = exports.DeviceNotificationRingProperty = exports.DeviceNotificationCryingProperty = exports.DeviceNotificationAllSoundProperty = exports.DeviceNotificationAllOtherMotionProperty = exports.DeviceNotificationPetProperty = exports.DeviceNotificationPersonProperty = exports.DeviceSoundDetectionSensitivityProperty = exports.DeviceSoundDetectionTypeProperty = exports.DeviceRotationSpeedProperty = exports.DeviceNotificationTypeWiredDoorbellProperty = exports.DeviceNotificationTypeBatteryDoorbellProperty = exports.DeviceNotificationTypeIndoorFloodlightProperty = exports.DeviceNotificationTypeProperty = exports.DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty = exports.DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty = exports.DeviceChimeHomebaseBatteryDoorbellProperty = exports.DeviceChimeIndoorWiredDoorbellProperty = exports.DeviceChimeIndoorBatteryDoorbellProperty = exports.DeviceWDRProperty = exports.DeviceVideoRecordingQualityProperty = exports.DeviceVideoRecordingQualityWiredDoorbellProperty = exports.DeviceVideoRecordingQualityIndoorProperty = exports.DeviceVideoStreamingQualityCameraProperty = exports.DeviceVideoStreamingQualityBatteryDoorbellProperty = exports.DeviceVideoStreamingQualityProperty = exports.DeviceRecordingEndClipMotionStopsProperty = exports.DeviceRecordingRetriggerIntervalFloodlightProperty = exports.DeviceRecordingRetriggerIntervalBatteryDoorbellProperty = exports.DeviceRecordingRetriggerIntervalProperty = exports.DeviceRecordingClipLengthFloodlightProperty = exports.DeviceRecordingClipLengthProperty = exports.DeviceChargingStatusProperty = exports.DevicePowerWorkingModeBatteryDoorbellProperty = exports.DevicePowerWorkingModeProperty = exports.DevicePowerSourceProperty = exports.DeviceRingtoneVolumeWiredDoorbellProperty = exports.DeviceRingtoneVolumeBatteryDoorbellProperty = exports.DeviceSpeakerVolumeWiredDoorbellProperty = exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty = exports.DeviceSpeakerVolumeProperty = exports.DeviceMotionTrackingProperty = exports.DeviceAudioRecordingWiredDoorbellProperty = exports.DeviceAudioRecordingIndoorFloodlightProperty = exports.DeviceAudioRecordingProperty = exports.DeviceSpeakerProperty = void 0;
exports.StationCommands = exports.DeviceCommands = exports.CommandName = exports.StationProperties = exports.StationTurnOffAlarmWithButtonProperty = exports.StationAutoEndAlarmProperty = exports.StationSwitchModeWithAccessCodeProperty = exports.StationTimeFormatProperty = exports.StationNotificationStartAlarmDelayProperty = exports.StationNotificationSwitchModeKeypadProperty = exports.StationNotificationSwitchModeAppProperty = exports.StationNotificationSwitchModeGeofenceProperty = exports.StationNotificationSwitchModeScheduleProperty = exports.StationAlarmToneProperty = exports.StationPromptVolumeProperty = exports.StationAlarmVolumeProperty = exports.StationMacAddressProperty = exports.StationLanIpAddressStandaloneProperty = exports.StationLanIpAddressProperty = exports.StationCurrentModeKeyPadProperty = exports.StationCurrentModeProperty = exports.StationGuardModeKeyPadProperty = exports.StationGuardModeProperty = exports.BaseStationProperties = exports.StationSerialNumberProperty = exports.StationModelProperty = exports.StationNameProperty = exports.DeviceProperties = exports.DeviceVideoRingRecordWiredDoorbellProperty = exports.DeviceVideoDistortionCorrectionWiredDoorbellProperty = exports.DeviceVideoHDRWiredDoorbellProperty = void 0;
const p2p_1 = require("../p2p");
var DeviceType;
(function (DeviceType) {
    //List retrieved from com.oceanwing.battery.cam.binder.model.QueryDeviceData
    DeviceType[DeviceType["STATION"] = 0] = "STATION";
    DeviceType[DeviceType["CAMERA"] = 1] = "CAMERA";
    DeviceType[DeviceType["SENSOR"] = 2] = "SENSOR";
    DeviceType[DeviceType["FLOODLIGHT"] = 3] = "FLOODLIGHT";
    DeviceType[DeviceType["CAMERA_E"] = 4] = "CAMERA_E";
    DeviceType[DeviceType["DOORBELL"] = 5] = "DOORBELL";
    DeviceType[DeviceType["BATTERY_DOORBELL"] = 7] = "BATTERY_DOORBELL";
    DeviceType[DeviceType["CAMERA2C"] = 8] = "CAMERA2C";
    DeviceType[DeviceType["CAMERA2"] = 9] = "CAMERA2";
    DeviceType[DeviceType["MOTION_SENSOR"] = 10] = "MOTION_SENSOR";
    DeviceType[DeviceType["KEYPAD"] = 11] = "KEYPAD";
    DeviceType[DeviceType["CAMERA2_PRO"] = 14] = "CAMERA2_PRO";
    DeviceType[DeviceType["CAMERA2C_PRO"] = 15] = "CAMERA2C_PRO";
    DeviceType[DeviceType["BATTERY_DOORBELL_2"] = 16] = "BATTERY_DOORBELL_2";
    DeviceType[DeviceType["INDOOR_CAMERA"] = 30] = "INDOOR_CAMERA";
    DeviceType[DeviceType["INDOOR_PT_CAMERA"] = 31] = "INDOOR_PT_CAMERA";
    DeviceType[DeviceType["SOLO_CAMERA"] = 32] = "SOLO_CAMERA";
    DeviceType[DeviceType["SOLO_CAMERA_PRO"] = 33] = "SOLO_CAMERA_PRO";
    DeviceType[DeviceType["INDOOR_CAMERA_1080"] = 34] = "INDOOR_CAMERA_1080";
    DeviceType[DeviceType["INDOOR_PT_CAMERA_1080"] = 35] = "INDOOR_PT_CAMERA_1080";
    DeviceType[DeviceType["FLOODLIGHT_CAMERA_8422"] = 37] = "FLOODLIGHT_CAMERA_8422";
    DeviceType[DeviceType["FLOODLIGHT_CAMERA_8423"] = 38] = "FLOODLIGHT_CAMERA_8423";
    DeviceType[DeviceType["FLOODLIGHT_CAMERA_8424"] = 39] = "FLOODLIGHT_CAMERA_8424";
    DeviceType[DeviceType["INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT"] = 44] = "INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT";
    DeviceType[DeviceType["INDOOR_OUTDOOR_CAMERA_2K"] = 45] = "INDOOR_OUTDOOR_CAMERA_2K";
    DeviceType[DeviceType["INDOOR_OUTDOOR_CAMERA_1080P"] = 46] = "INDOOR_OUTDOOR_CAMERA_1080P";
    DeviceType[DeviceType["LOCK_BASIC"] = 50] = "LOCK_BASIC";
    DeviceType[DeviceType["LOCK_ADVANCED"] = 51] = "LOCK_ADVANCED";
    DeviceType[DeviceType["LOCK_BASIC_NO_FINGER"] = 52] = "LOCK_BASIC_NO_FINGER";
    DeviceType[DeviceType["LOCK_ADVANCED_NO_FINGER"] = 53] = "LOCK_ADVANCED_NO_FINGER";
    DeviceType[DeviceType["SOLO_CAMERA_SPOTLIGHT_1080"] = 60] = "SOLO_CAMERA_SPOTLIGHT_1080";
    DeviceType[DeviceType["SOLO_CAMERA_SPOTLIGHT_2K"] = 61] = "SOLO_CAMERA_SPOTLIGHT_2K";
    DeviceType[DeviceType["SOLO_CAMERA_SPOTLIGHT_SOLAR"] = 62] = "SOLO_CAMERA_SPOTLIGHT_SOLAR";
})(DeviceType = exports.DeviceType || (exports.DeviceType = {}));
var ParamType;
(function (ParamType) {
    //List retrieved from com.oceanwing.battery.cam.binder.model.CameraParams
    ParamType[ParamType["CHIME_STATE"] = 2015] = "CHIME_STATE";
    ParamType[ParamType["DETECT_EXPOSURE"] = 2023] = "DETECT_EXPOSURE";
    ParamType[ParamType["DETECT_MODE"] = 2004] = "DETECT_MODE";
    ParamType[ParamType["DETECT_MOTION_SENSITIVE"] = 2005] = "DETECT_MOTION_SENSITIVE";
    ParamType[ParamType["DETECT_SCENARIO"] = 2028] = "DETECT_SCENARIO";
    ParamType[ParamType["DETECT_SWITCH"] = 2027] = "DETECT_SWITCH";
    ParamType[ParamType["DETECT_ZONE"] = 2006] = "DETECT_ZONE";
    ParamType[ParamType["DOORBELL_AUDIO_RECODE"] = 2042] = "DOORBELL_AUDIO_RECODE";
    ParamType[ParamType["DOORBELL_BRIGHTNESS"] = 2032] = "DOORBELL_BRIGHTNESS";
    ParamType[ParamType["DOORBELL_DISTORTION"] = 2033] = "DOORBELL_DISTORTION";
    ParamType[ParamType["DOORBELL_HDR"] = 2029] = "DOORBELL_HDR";
    ParamType[ParamType["DOORBELL_IR_MODE"] = 2030] = "DOORBELL_IR_MODE";
    ParamType[ParamType["DOORBELL_LED_NIGHT_MODE"] = 2039] = "DOORBELL_LED_NIGHT_MODE";
    ParamType[ParamType["DOORBELL_MOTION_ADVANCE_OPTION"] = 2041] = "DOORBELL_MOTION_ADVANCE_OPTION";
    ParamType[ParamType["DOORBELL_MOTION_NOTIFICATION"] = 2035] = "DOORBELL_MOTION_NOTIFICATION";
    ParamType[ParamType["DOORBELL_NOTIFICATION_JUMP_MODE"] = 2038] = "DOORBELL_NOTIFICATION_JUMP_MODE";
    ParamType[ParamType["DOORBELL_NOTIFICATION_OPEN"] = 2036] = "DOORBELL_NOTIFICATION_OPEN";
    ParamType[ParamType["DOORBELL_RECORD_QUALITY"] = 2034] = "DOORBELL_RECORD_QUALITY";
    ParamType[ParamType["DOORBELL_RING_RECORD"] = 2040] = "DOORBELL_RING_RECORD";
    ParamType[ParamType["DOORBELL_SNOOZE_START_TIME"] = 2037] = "DOORBELL_SNOOZE_START_TIME";
    ParamType[ParamType["DOORBELL_VIDEO_QUALITY"] = 2031] = "DOORBELL_VIDEO_QUALITY";
    ParamType[ParamType["NIGHT_VISUAL"] = 2002] = "NIGHT_VISUAL";
    ParamType[ParamType["OPEN_DEVICE"] = 2001] = "OPEN_DEVICE";
    ParamType[ParamType["RINGING_VOLUME"] = 2022] = "RINGING_VOLUME";
    ParamType[ParamType["SDCARD"] = 2010] = "SDCARD";
    ParamType[ParamType["UN_DETECT_ZONE"] = 2007] = "UN_DETECT_ZONE";
    ParamType[ParamType["VOLUME"] = 2003] = "VOLUME";
    ParamType[ParamType["COMMAND_LED_NIGHT_OPEN"] = 1026] = "COMMAND_LED_NIGHT_OPEN";
    ParamType[ParamType["COMMAND_MOTION_DETECTION_PACKAGE"] = 1016] = "COMMAND_MOTION_DETECTION_PACKAGE";
    ParamType[ParamType["COMMAND_HDR"] = 1019] = "COMMAND_HDR";
    ParamType[ParamType["COMMAND_DISTORTION_CORRECTION"] = 1022] = "COMMAND_DISTORTION_CORRECTION";
    ParamType[ParamType["COMMAND_VIDEO_QUALITY"] = 1020] = "COMMAND_VIDEO_QUALITY";
    ParamType[ParamType["COMMAND_VIDEO_RECORDING_QUALITY"] = 1023] = "COMMAND_VIDEO_RECORDING_QUALITY";
    ParamType[ParamType["COMMAND_VIDEO_RING_RECORD"] = 1027] = "COMMAND_VIDEO_RING_RECORD";
    ParamType[ParamType["COMMAND_AUDIO_RECORDING"] = 1029] = "COMMAND_AUDIO_RECORDING";
    ParamType[ParamType["COMMAND_INDOOR_CHIME"] = 1006] = "COMMAND_INDOOR_CHIME";
    ParamType[ParamType["COMMAND_RINGTONE_VOLUME"] = 1012] = "COMMAND_RINGTONE_VOLUME";
    ParamType[ParamType["COMMAND_NOTIFICATION_RING"] = 1031] = "COMMAND_NOTIFICATION_RING";
    ParamType[ParamType["COMMAND_NOTIFICATION_TYPE"] = 1030] = "COMMAND_NOTIFICATION_TYPE";
    ParamType[ParamType["COMMAND_QUICK_RESPONSE"] = 1004] = "COMMAND_QUICK_RESPONSE";
    ParamType[ParamType["COMMAND_START_LIVESTREAM"] = 1000] = "COMMAND_START_LIVESTREAM";
    ParamType[ParamType["COMMAND_STREAM_INFO"] = 1005] = "COMMAND_STREAM_INFO";
    ParamType[ParamType["COMMAND_VOLTAGE_INFO"] = 1015] = "COMMAND_VOLTAGE_INFO";
    // Inferred from source
    ParamType[ParamType["SNOOZE_MODE"] = 1271] = "SNOOZE_MODE";
    ParamType[ParamType["WATERMARK_MODE"] = 1214] = "WATERMARK_MODE";
    ParamType[ParamType["DEVICE_UPGRADE_NOW"] = 1134] = "DEVICE_UPGRADE_NOW";
    ParamType[ParamType["CAMERA_UPGRADE_NOW"] = 1133] = "CAMERA_UPGRADE_NOW";
    ParamType[ParamType["DEFAULT_SCHEDULE_MODE"] = 1257] = "DEFAULT_SCHEDULE_MODE";
    ParamType[ParamType["GUARD_MODE"] = 1224] = "GUARD_MODE";
    ParamType[ParamType["FLOODLIGHT_MANUAL_SWITCH"] = 1400] = "FLOODLIGHT_MANUAL_SWITCH";
    ParamType[ParamType["FLOODLIGHT_MANUAL_BRIGHTNESS"] = 1401] = "FLOODLIGHT_MANUAL_BRIGHTNESS";
    ParamType[ParamType["FLOODLIGHT_MOTION_BRIGHTNESS"] = 1412] = "FLOODLIGHT_MOTION_BRIGHTNESS";
    ParamType[ParamType["FLOODLIGHT_SCHEDULE_BRIGHTNESS"] = 1413] = "FLOODLIGHT_SCHEDULE_BRIGHTNESS";
    ParamType[ParamType["FLOODLIGHT_MOTION_SENSITIVTY"] = 1272] = "FLOODLIGHT_MOTION_SENSITIVTY";
    ParamType[ParamType["CAMERA_SPEAKER_VOLUME"] = 1230] = "CAMERA_SPEAKER_VOLUME";
    ParamType[ParamType["CAMERA_RECORD_ENABLE_AUDIO"] = 1366] = "CAMERA_RECORD_ENABLE_AUDIO";
    ParamType[ParamType["CAMERA_RECORD_RETRIGGER_INTERVAL"] = 1250] = "CAMERA_RECORD_RETRIGGER_INTERVAL";
    ParamType[ParamType["CAMERA_RECORD_CLIP_LENGTH"] = 1249] = "CAMERA_RECORD_CLIP_LENGTH";
    ParamType[ParamType["CAMERA_IR_CUT"] = 1013] = "CAMERA_IR_CUT";
    ParamType[ParamType["CAMERA_PIR"] = 1011] = "CAMERA_PIR";
    ParamType[ParamType["CAMERA_WIFI_RSSI"] = 1142] = "CAMERA_WIFI_RSSI";
    ParamType[ParamType["CAMERA_MOTION_ZONES"] = 1204] = "CAMERA_MOTION_ZONES";
    // Set only params?
    ParamType[ParamType["PUSH_MSG_MODE"] = 1252] = "PUSH_MSG_MODE";
    ParamType[ParamType["PRIVATE_MODE"] = 99904] = "PRIVATE_MODE";
    ParamType[ParamType["CUSTOM_RTSP_URL"] = 999991] = "CUSTOM_RTSP_URL";
})(ParamType = exports.ParamType || (exports.ParamType = {}));
var AlarmMode;
(function (AlarmMode) {
    AlarmMode[AlarmMode["AWAY"] = 0] = "AWAY";
    AlarmMode[AlarmMode["HOME"] = 1] = "HOME";
    AlarmMode[AlarmMode["CUSTOM1"] = 3] = "CUSTOM1";
    AlarmMode[AlarmMode["CUSTOM2"] = 4] = "CUSTOM2";
    AlarmMode[AlarmMode["CUSTOM3"] = 5] = "CUSTOM3";
    AlarmMode[AlarmMode["DISARMED"] = 63] = "DISARMED";
})(AlarmMode = exports.AlarmMode || (exports.AlarmMode = {}));
var GuardMode;
(function (GuardMode) {
    GuardMode[GuardMode["UNKNOWN"] = -1] = "UNKNOWN";
    GuardMode[GuardMode["AWAY"] = 0] = "AWAY";
    GuardMode[GuardMode["HOME"] = 1] = "HOME";
    GuardMode[GuardMode["DISARMED"] = 63] = "DISARMED";
    GuardMode[GuardMode["SCHEDULE"] = 2] = "SCHEDULE";
    GuardMode[GuardMode["GEO"] = 47] = "GEO";
    GuardMode[GuardMode["CUSTOM1"] = 3] = "CUSTOM1";
    GuardMode[GuardMode["CUSTOM2"] = 4] = "CUSTOM2";
    GuardMode[GuardMode["CUSTOM3"] = 5] = "CUSTOM3";
    GuardMode[GuardMode["OFF"] = 6] = "OFF";
})(GuardMode = exports.GuardMode || (exports.GuardMode = {}));
var ResponseErrorCode;
(function (ResponseErrorCode) {
    ResponseErrorCode[ResponseErrorCode["CODE_CONNECT_ERROR"] = 997] = "CODE_CONNECT_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_ERROR_PIN"] = 36006] = "CODE_ERROR_PIN";
    ResponseErrorCode[ResponseErrorCode["CODE_MULTI_ALARM"] = 36002] = "CODE_MULTI_ALARM";
    ResponseErrorCode[ResponseErrorCode["CODE_NEED_VERIFY_CODE"] = 26052] = "CODE_NEED_VERIFY_CODE";
    ResponseErrorCode[ResponseErrorCode["CODE_NETWORK_ERROR"] = 998] = "CODE_NETWORK_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_PHONE_NONE_SUPPORT"] = 26058] = "CODE_PHONE_NONE_SUPPORT";
    ResponseErrorCode[ResponseErrorCode["CODE_SERVER_ERROR"] = 999] = "CODE_SERVER_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_VERIFY_CODE_ERROR"] = 26050] = "CODE_VERIFY_CODE_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_VERIFY_CODE_EXPIRED"] = 26051] = "CODE_VERIFY_CODE_EXPIRED";
    ResponseErrorCode[ResponseErrorCode["CODE_VERIFY_CODE_MAX"] = 26053] = "CODE_VERIFY_CODE_MAX";
    ResponseErrorCode[ResponseErrorCode["CODE_VERIFY_CODE_NONE_MATCH"] = 26054] = "CODE_VERIFY_CODE_NONE_MATCH";
    ResponseErrorCode[ResponseErrorCode["CODE_VERIFY_PASSWORD_ERROR"] = 26055] = "CODE_VERIFY_PASSWORD_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_WHATEVER_ERROR"] = 0] = "CODE_WHATEVER_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_MAX_FORGET_PASSWORD_ERROR"] = 100035] = "CODE_MAX_FORGET_PASSWORD_ERROR";
    ResponseErrorCode[ResponseErrorCode["CODE_MAX_LOGIN_LIMIT"] = 100028] = "CODE_MAX_LOGIN_LIMIT";
    ResponseErrorCode[ResponseErrorCode["CODE_MAX_REGISTER_ERROR"] = 100034] = "CODE_MAX_REGISTER_ERROR";
    ResponseErrorCode[ResponseErrorCode["EMAIL_NOT_REGISTERED_ERROR"] = 22008] = "EMAIL_NOT_REGISTERED_ERROR";
    ResponseErrorCode[ResponseErrorCode["LOGIN_CAPTCHA_ERROR"] = 100033] = "LOGIN_CAPTCHA_ERROR";
    ResponseErrorCode[ResponseErrorCode["LOGIN_DECRYPTION_FAIL"] = 100030] = "LOGIN_DECRYPTION_FAIL";
    ResponseErrorCode[ResponseErrorCode["LOGIN_ENCRYPTION_FAIL"] = 100029] = "LOGIN_ENCRYPTION_FAIL";
    ResponseErrorCode[ResponseErrorCode["LOGIN_INVALID_TOUCH_ID"] = 26047] = "LOGIN_INVALID_TOUCH_ID";
    ResponseErrorCode[ResponseErrorCode["LOGIN_NEED_CAPTCHA"] = 100032] = "LOGIN_NEED_CAPTCHA";
    ResponseErrorCode[ResponseErrorCode["MULTIPLE_EMAIL_PASSWORD_ERROR"] = 26006] = "MULTIPLE_EMAIL_PASSWORD_ERROR";
    ResponseErrorCode[ResponseErrorCode["MULTIPLE_INACTIVATED_ERROR"] = 26015] = "MULTIPLE_INACTIVATED_ERROR";
    ResponseErrorCode[ResponseErrorCode["MULTIPLE_REGISTRATION_ERROR"] = 26000] = "MULTIPLE_REGISTRATION_ERROR";
    ResponseErrorCode[ResponseErrorCode["RESP_ERROR_CODE_SESSION_TIMEOUT"] = 401] = "RESP_ERROR_CODE_SESSION_TIMEOUT";
})(ResponseErrorCode = exports.ResponseErrorCode || (exports.ResponseErrorCode = {}));
var VerfyCodeTypes;
(function (VerfyCodeTypes) {
    VerfyCodeTypes[VerfyCodeTypes["TYPE_SMS"] = 0] = "TYPE_SMS";
    VerfyCodeTypes[VerfyCodeTypes["TYPE_PUSH"] = 1] = "TYPE_PUSH";
    VerfyCodeTypes[VerfyCodeTypes["TYPE_EMAIL"] = 2] = "TYPE_EMAIL";
})(VerfyCodeTypes = exports.VerfyCodeTypes || (exports.VerfyCodeTypes = {}));
var AuthResult;
(function (AuthResult) {
    AuthResult[AuthResult["ERROR"] = -1] = "ERROR";
    AuthResult[AuthResult["OK"] = 0] = "OK";
    AuthResult[AuthResult["RENEW"] = 2] = "RENEW";
    AuthResult[AuthResult["SEND_VERIFY_CODE"] = 3] = "SEND_VERIFY_CODE";
})(AuthResult = exports.AuthResult || (exports.AuthResult = {}));
var StorageType;
(function (StorageType) {
    StorageType[StorageType["NONE"] = 0] = "NONE";
    StorageType[StorageType["LOCAL"] = 1] = "LOCAL";
    StorageType[StorageType["CLOUD"] = 2] = "CLOUD";
    StorageType[StorageType["LOCAL_AND_CLOUD"] = 3] = "LOCAL_AND_CLOUD";
})(StorageType = exports.StorageType || (exports.StorageType = {}));
var PowerSource;
(function (PowerSource) {
    PowerSource[PowerSource["BATTERY"] = 0] = "BATTERY";
    PowerSource[PowerSource["SOLAR_PANEL"] = 1] = "SOLAR_PANEL";
})(PowerSource = exports.PowerSource || (exports.PowerSource = {}));
var PublicKeyType;
(function (PublicKeyType) {
    PublicKeyType[PublicKeyType["SERVER"] = 1] = "SERVER";
    PublicKeyType[PublicKeyType["LOCK"] = 2] = "LOCK";
})(PublicKeyType = exports.PublicKeyType || (exports.PublicKeyType = {}));
var FloodlightMotionTriggeredDistance;
(function (FloodlightMotionTriggeredDistance) {
    FloodlightMotionTriggeredDistance[FloodlightMotionTriggeredDistance["MIN"] = 66] = "MIN";
    FloodlightMotionTriggeredDistance[FloodlightMotionTriggeredDistance["LOW"] = 76] = "LOW";
    FloodlightMotionTriggeredDistance[FloodlightMotionTriggeredDistance["MEDIUM"] = 86] = "MEDIUM";
    FloodlightMotionTriggeredDistance[FloodlightMotionTriggeredDistance["HIGH"] = 91] = "HIGH";
    FloodlightMotionTriggeredDistance[FloodlightMotionTriggeredDistance["MAX"] = 96] = "MAX";
})(FloodlightMotionTriggeredDistance = exports.FloodlightMotionTriggeredDistance || (exports.FloodlightMotionTriggeredDistance = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["MOST_EFFICIENT"] = 1] = "MOST_EFFICIENT";
    NotificationType[NotificationType["INCLUDE_THUMBNAIL"] = 2] = "INCLUDE_THUMBNAIL";
    NotificationType[NotificationType["FULL_EFFECT"] = 3] = "FULL_EFFECT";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
var AlarmTone;
(function (AlarmTone) {
    AlarmTone[AlarmTone["ALARM_TONE1"] = 1] = "ALARM_TONE1";
    AlarmTone[AlarmTone["ALARM_TONE2"] = 2] = "ALARM_TONE2";
})(AlarmTone = exports.AlarmTone || (exports.AlarmTone = {}));
var NotificationSwitchMode;
(function (NotificationSwitchMode) {
    NotificationSwitchMode[NotificationSwitchMode["APP"] = 16] = "APP";
    NotificationSwitchMode[NotificationSwitchMode["GEOFENCE"] = 32] = "GEOFENCE";
    NotificationSwitchMode[NotificationSwitchMode["SCHEDULE"] = 64] = "SCHEDULE";
    NotificationSwitchMode[NotificationSwitchMode["KEYPAD"] = 128] = "KEYPAD";
})(NotificationSwitchMode = exports.NotificationSwitchMode || (exports.NotificationSwitchMode = {}));
var TimeFormat;
(function (TimeFormat) {
    TimeFormat[TimeFormat["FORMAT_12H"] = 0] = "FORMAT_12H";
    TimeFormat[TimeFormat["FORMAT_24H"] = 1] = "FORMAT_24H";
})(TimeFormat = exports.TimeFormat || (exports.TimeFormat = {}));
var WifiSignalLevel;
(function (WifiSignalLevel) {
    WifiSignalLevel[WifiSignalLevel["NO_SIGNAL"] = 0] = "NO_SIGNAL";
    WifiSignalLevel[WifiSignalLevel["WEAK"] = 1] = "WEAK";
    WifiSignalLevel[WifiSignalLevel["NORMAL"] = 2] = "NORMAL";
    WifiSignalLevel[WifiSignalLevel["STRONG"] = 3] = "STRONG";
    WifiSignalLevel[WifiSignalLevel["FULL"] = 4] = "FULL";
})(WifiSignalLevel = exports.WifiSignalLevel || (exports.WifiSignalLevel = {}));
var DeviceEvent;
(function (DeviceEvent) {
    DeviceEvent[DeviceEvent["MotionDetected"] = 0] = "MotionDetected";
    DeviceEvent[DeviceEvent["PersonDetected"] = 1] = "PersonDetected";
    DeviceEvent[DeviceEvent["PetDetected"] = 2] = "PetDetected";
    DeviceEvent[DeviceEvent["SoundDetected"] = 3] = "SoundDetected";
    DeviceEvent[DeviceEvent["CryingDetected"] = 4] = "CryingDetected";
    DeviceEvent[DeviceEvent["Ringing"] = 5] = "Ringing";
})(DeviceEvent = exports.DeviceEvent || (exports.DeviceEvent = {}));
var PropertyName;
(function (PropertyName) {
    PropertyName["Name"] = "name";
    PropertyName["Model"] = "model";
    PropertyName["SerialNumber"] = "serialNumber";
    PropertyName["HardwareVersion"] = "hardwareVersion";
    PropertyName["SoftwareVersion"] = "softwareVersion";
    PropertyName["Type"] = "type";
    PropertyName["DeviceStationSN"] = "stationSerialNumber";
    PropertyName["DeviceBattery"] = "battery";
    PropertyName["DeviceBatteryTemp"] = "batteryTemperature";
    PropertyName["DeviceBatteryLow"] = "batteryLow";
    PropertyName["DeviceBatteryIsCharging"] = "batteryIsCharging";
    PropertyName["DeviceLastChargingDays"] = "lastChargingDays";
    PropertyName["DeviceLastChargingTotalEvents"] = "lastChargingTotalEvents";
    PropertyName["DeviceLastChargingRecordedEvents"] = "lastChargingRecordedEvents";
    PropertyName["DeviceLastChargingFalseEvents"] = "lastChargingFalseEvents";
    PropertyName["DeviceBatteryUsageLastWeek"] = "batteryUsageLastWeek";
    PropertyName["DeviceWifiRSSI"] = "wifiRssi";
    PropertyName["DeviceWifiSignalLevel"] = "wifiSignalLevel";
    PropertyName["DeviceEnabled"] = "enabled";
    PropertyName["DeviceAntitheftDetection"] = "antitheftDetection";
    PropertyName["DeviceAutoNightvision"] = "autoNightvision";
    PropertyName["DeviceNightvision"] = "nightvision";
    PropertyName["DeviceStatusLed"] = "statusLed";
    PropertyName["DeviceMotionDetection"] = "motionDetection";
    PropertyName["DeviceMotionDetectionType"] = "motionDetectionType";
    PropertyName["DeviceMotionDetectionSensitivity"] = "motionDetectionSensitivity";
    PropertyName["DeviceMotionDetected"] = "motionDetected";
    PropertyName["DeviceMotionTracking"] = "motionTracking";
    PropertyName["DevicePersonDetected"] = "personDetected";
    PropertyName["DevicePersonName"] = "personName";
    PropertyName["DeviceRTSPStream"] = "rtspStream";
    PropertyName["DeviceRTSPStreamUrl"] = "rtspStreamUrl";
    PropertyName["DeviceWatermark"] = "watermark";
    PropertyName["DevicePictureUrl"] = "pictureUrl";
    PropertyName["DeviceState"] = "state";
    PropertyName["DevicePetDetection"] = "petDetection";
    PropertyName["DevicePetDetected"] = "petDetected";
    PropertyName["DeviceSoundDetection"] = "soundDetection";
    PropertyName["DeviceSoundDetectionType"] = "soundDetectionType";
    PropertyName["DeviceSoundDetectionSensitivity"] = "soundDetectionSensitivity";
    PropertyName["DeviceSoundDetected"] = "soundDetected";
    PropertyName["DeviceCryingDetected"] = "cryingDetected";
    PropertyName["DeviceSensorOpen"] = "sensorOpen";
    PropertyName["DeviceSensorChangeTime"] = "sensorChangeTime";
    PropertyName["DeviceMotionSensorPIREvent"] = "motionSensorPirEvent";
    PropertyName["DeviceLocked"] = "locked";
    PropertyName["DeviceRinging"] = "ringing";
    PropertyName["DeviceLockStatus"] = "lockStatus";
    PropertyName["DeviceLight"] = "light";
    PropertyName["DeviceMicrophone"] = "microphone";
    PropertyName["DeviceSpeaker"] = "speaker";
    PropertyName["DeviceSpeakerVolume"] = "speakerVolume";
    PropertyName["DeviceRingtoneVolume"] = "ringtoneVolume";
    PropertyName["DeviceAudioRecording"] = "audioRecording";
    PropertyName["DevicePowerSource"] = "powerSource";
    PropertyName["DevicePowerWorkingMode"] = "powerWorkingMode";
    PropertyName["DeviceChargingStatus"] = "chargingStatus";
    PropertyName["DeviceRecordingEndClipMotionStops"] = "recordingEndClipMotionStops";
    PropertyName["DeviceRecordingClipLength"] = "recordingClipLength";
    PropertyName["DeviceRecordingRetriggerInterval"] = "recordingRetriggerInterval";
    PropertyName["DeviceVideoStreamingQuality"] = "videoStreamingQuality";
    PropertyName["DeviceVideoRecordingQuality"] = "videoRecordingQuality";
    PropertyName["DeviceVideoWDR"] = "videoWdr";
    PropertyName["DeviceLightSettingsEnable"] = "lightSettingsEnable";
    PropertyName["DeviceLightSettingsBrightnessManual"] = "lightSettingsBrightnessManual";
    PropertyName["DeviceLightSettingsBrightnessMotion"] = "lightSettingsBrightnessMotion";
    PropertyName["DeviceLightSettingsBrightnessSchedule"] = "lightSettingsBrightnessSchedule";
    PropertyName["DeviceLightSettingsMotionTriggered"] = "lightSettingsMotionTriggered";
    PropertyName["DeviceLightSettingsMotionTriggeredDistance"] = "lightSettingsMotionTriggeredDistance";
    PropertyName["DeviceLightSettingsMotionTriggeredTimer"] = "lightSettingsMotionTriggeredTimer";
    //DeviceLightSettingsSunsetToSunrise = "lightSettingsSunsetToSunrise",
    //DeviceVideoEncodingFormat = "videoEncodingFormat", //BatteryDoorbell - included in Streaming Quality
    PropertyName["DeviceChimeIndoor"] = "chimeIndoor";
    PropertyName["DeviceChimeHomebase"] = "chimeHomebase";
    PropertyName["DeviceChimeHomebaseRingtoneVolume"] = "chimeHomebaseRingtoneVolume";
    PropertyName["DeviceChimeHomebaseRingtoneType"] = "chimeHomebaseRingtoneType";
    PropertyName["DeviceNotificationType"] = "notificationType";
    PropertyName["DeviceRotationSpeed"] = "rotationSpeed";
    PropertyName["DeviceNotificationPerson"] = "notificationPerson";
    PropertyName["DeviceNotificationPet"] = "notificationPet";
    PropertyName["DeviceNotificationAllOtherMotion"] = "notificationAllOtherMotion";
    PropertyName["DeviceNotificationCrying"] = "notificationCrying";
    PropertyName["DeviceNotificationAllSound"] = "notificationAllSound";
    PropertyName["DeviceNotificationIntervalTime"] = "notificationIntervalTime";
    PropertyName["DeviceNotificationRing"] = "notificationRing";
    PropertyName["DeviceNotificationMotion"] = "notificationMotion";
    //DeviceContinuosRecording = "continousRecording",
    PropertyName["DeviceChirpVolume"] = "chirpVolume";
    PropertyName["DeviceChirpTone"] = "chirpTone";
    PropertyName["DeviceVideoHDR"] = "videoHdr";
    PropertyName["DeviceVideoDistortionCorrection"] = "videoDistortionCorrection";
    PropertyName["DeviceVideoRingRecord"] = "videoRingRecord";
    PropertyName["StationLANIpAddress"] = "lanIpAddress";
    PropertyName["StationMacAddress"] = "macAddress";
    PropertyName["StationGuardMode"] = "guardMode";
    PropertyName["StationCurrentMode"] = "currentMode";
    PropertyName["StationTimeFormat"] = "timeFormat";
    //StationTimezone = "timezone",
    PropertyName["StationAlarmVolume"] = "alarmVolume";
    PropertyName["StationAlarmTone"] = "alarmTone";
    PropertyName["StationPromptVolume"] = "promptVolume";
    PropertyName["StationNotificationSwitchModeSchedule"] = "notificationSwitchModeSchedule";
    PropertyName["StationNotificationSwitchModeGeofence"] = "notificationSwitchModeGeofence";
    PropertyName["StationNotificationSwitchModeApp"] = "notificationSwitchModeApp";
    PropertyName["StationNotificationSwitchModeKeypad"] = "notificationSwitchModeKeypad";
    PropertyName["StationNotificationStartAlarmDelay"] = "notificationStartAlarmDelay";
    PropertyName["StationSwitchModeWithAccessCode"] = "switchModeWithAccessCode";
    PropertyName["StationAutoEndAlarm"] = "autoEndAlarm";
    PropertyName["StationTurnOffAlarmWithButton"] = "turnOffAlarmWithButton";
    PropertyName["DeviceHiddenMotionDetectionSensitivity"] = "hidden-motionDetectionSensitivity";
    PropertyName["DeviceHiddenMotionDetectionMode"] = "hidden-motionDetectionMode";
})(PropertyName = exports.PropertyName || (exports.PropertyName = {}));
exports.DeviceNameProperty = {
    key: "device_name",
    name: PropertyName.Name,
    label: "Name",
    readable: true,
    writeable: false,
    type: "string",
};
exports.DeviceModelProperty = {
    key: "device_model",
    name: PropertyName.Model,
    label: "Model",
    readable: true,
    writeable: false,
    type: "string",
};
exports.DeviceSerialNumberProperty = {
    key: "device_sn",
    name: PropertyName.SerialNumber,
    label: "Serial number",
    readable: true,
    writeable: false,
    type: "string",
};
exports.GenericHWVersionProperty = {
    key: "main_hw_version",
    name: PropertyName.HardwareVersion,
    label: "Hardware version",
    readable: true,
    writeable: false,
    type: "string",
};
exports.GenericSWVersionProperty = {
    key: "main_sw_version",
    name: PropertyName.SoftwareVersion,
    label: "Software version",
    readable: true,
    writeable: false,
    type: "string",
};
exports.GenericTypeProperty = {
    key: "device_type",
    name: PropertyName.Type,
    label: "Type",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        0: "Station",
        1: "Camera",
        2: "Sensor",
        3: "Floodlight",
        4: "Camera E",
        5: "Doorbell",
        7: "Battery Doorbell",
        8: "Camera 2",
        9: "Camera 2c",
        10: "Motion Sensor",
        11: "Keypad",
        14: "Camera 2 Pro",
        15: "Camera 2c Pro",
        16: "Battery Doorbell 2",
        30: "Indoor Camera",
        31: "Indoor Camera PT",
        32: "Solo Camera",
        33: "Solo Camera Pro",
        34: "Indoor Camera 1080",
        35: "Indoor Camera PT 1080",
        37: "Floodlight 8422",
        38: "Floodlight 8423",
        39: "Floodlight 2",
        44: "Outdoor Camera 1080P No Light",
        45: "Outdoor Camera 2k",
        46: "Outdoor Camera 1080P",
        50: "Lock Basic",
        51: "Lock Advanced",
        52: "Lock Basic No Finger",
        53: "Lock Basic Advanced No Finger",
        60: "Solo Camera Spotlight 1080p",
        61: "Solo Camera Spotlight 2k",
        62: "Solo Camera Spotlight Solar",
    },
};
exports.BaseDeviceProperties = {
    [exports.DeviceNameProperty.name]: exports.DeviceNameProperty,
    [exports.DeviceModelProperty.name]: exports.DeviceModelProperty,
    [exports.DeviceSerialNumberProperty.name]: exports.DeviceSerialNumberProperty,
    [exports.GenericTypeProperty.name]: exports.GenericTypeProperty,
    [exports.GenericHWVersionProperty.name]: exports.GenericHWVersionProperty,
    [exports.GenericSWVersionProperty.name]: exports.GenericSWVersionProperty,
};
exports.GenericDeviceProperties = Object.assign(Object.assign({}, exports.BaseDeviceProperties), { [PropertyName.DeviceStationSN]: {
        key: "station_sn",
        name: "stationSerialNumber",
        label: "Station serial number",
        readable: true,
        writeable: false,
        type: "string",
    } });
exports.DeviceBatteryProperty = {
    key: p2p_1.CommandType.CMD_GET_BATTERY,
    name: PropertyName.DeviceBattery,
    label: "Battery percentage",
    readable: true,
    writeable: false,
    type: "number",
    unit: "%",
    min: 0,
    max: 100,
};
exports.DeviceBatteryLockProperty = {
    key: p2p_1.CommandType.CMD_SMARTLOCK_QUERY_BATTERY_LEVEL,
    name: PropertyName.DeviceBattery,
    label: "Battery percentage",
    readable: true,
    writeable: false,
    type: "number",
    unit: "%",
    min: 0,
    max: 100,
};
exports.DeviceBatteryLowMotionSensorProperty = {
    key: p2p_1.CommandType.CMD_MOTION_SENSOR_BAT_STATE,
    name: PropertyName.DeviceBatteryLow,
    label: "Battery low",
    readable: true,
    writeable: false,
    type: "boolean",
    default: false,
};
exports.DeviceBatteryLowKeypadProperty = Object.assign(Object.assign({}, exports.DeviceBatteryLowMotionSensorProperty), { key: p2p_1.CommandType.CMD_KEYPAD_BATTERY_CAP_STATE });
exports.DeviceBatteryLowSensorProperty = Object.assign(Object.assign({}, exports.DeviceBatteryLowMotionSensorProperty), { key: p2p_1.CommandType.CMD_ENTRY_SENSOR_BAT_STATE });
exports.DeviceBatteryTempProperty = {
    key: p2p_1.CommandType.CMD_GET_BATTERY_TEMP,
    name: PropertyName.DeviceBatteryTemp,
    label: "Battery Temperature",
    readable: true,
    writeable: false,
    type: "number",
    unit: "°C",
};
exports.DeviceBatteryIsChargingKeypadProperty = {
    key: p2p_1.CommandType.CMD_KEYPAD_BATTERY_CHARGER_STATE,
    name: PropertyName.DeviceBatteryIsCharging,
    label: "Battery is charging",
    readable: true,
    writeable: false,
    type: "boolean",
    default: false,
};
exports.DeviceAntitheftDetectionProperty = {
    key: p2p_1.CommandType.CMD_EAS_SWITCH,
    name: PropertyName.DeviceAntitheftDetection,
    label: "Antitheft Detection",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceAutoNightvisionProperty = {
    key: p2p_1.CommandType.CMD_IRCUT_SWITCH,
    name: PropertyName.DeviceAutoNightvision,
    label: "Auto Nightvision",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceAutoNightvisionWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceAutoNightvisionProperty), { key: ParamType.NIGHT_VISUAL });
exports.DeviceNightvisionProperty = {
    key: p2p_1.CommandType.CMD_SET_NIGHT_VISION_TYPE,
    name: PropertyName.DeviceNightvision,
    label: "Nightvision",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Off",
        1: "B&W Night Vision",
        2: "Spotlight Night Vision",
    },
};
exports.DeviceWifiRSSIProperty = {
    key: p2p_1.CommandType.CMD_GET_WIFI_RSSI,
    name: PropertyName.DeviceWifiRSSI,
    label: "Wifi RSSI",
    readable: true,
    writeable: false,
    type: "number",
    unit: "dBm",
};
exports.DeviceWifiSignalLevelProperty = {
    key: "custom_wifiSignalLevel",
    name: PropertyName.DeviceWifiSignalLevel,
    label: "Wifi Signal Level",
    readable: true,
    writeable: false,
    type: "number",
    min: 0,
    max: 4,
    states: {
        0: "No signal",
        1: "Weak",
        2: "Normal",
        3: "Strong",
        4: "Full",
    },
};
exports.DeviceWifiRSSILockProperty = Object.assign(Object.assign({}, exports.DeviceWifiRSSIProperty), { key: p2p_1.CommandType.CMD_GET_SUB1G_RSSI });
exports.DeviceWifiRSSIEntrySensorProperty = Object.assign(Object.assign({}, exports.DeviceWifiRSSIProperty), { key: p2p_1.CommandType.CMD_GET_SUB1G_RSSI });
exports.DeviceWifiRSSIKeypadProperty = Object.assign(Object.assign({}, exports.DeviceWifiRSSIProperty), { key: p2p_1.CommandType.CMD_GET_SUB1G_RSSI });
exports.DeviceEnabledProperty = {
    key: ParamType.PRIVATE_MODE,
    name: PropertyName.DeviceEnabled,
    label: "Camera enabled",
    readable: true,
    writeable: true,
    type: "boolean",
    commandId: 1035,
};
exports.DeviceEnabledStandaloneProperty = Object.assign(Object.assign({}, exports.DeviceEnabledProperty), { key: ParamType.OPEN_DEVICE });
exports.DeviceStatusLedProperty = {
    key: p2p_1.CommandType.CMD_DEV_LED_SWITCH,
    name: PropertyName.DeviceStatusLed,
    label: "Status LED",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceStatusLedIndoorSoloFloodProperty = Object.assign(Object.assign({}, exports.DeviceStatusLedProperty), { key: p2p_1.CommandType.CMD_INDOOR_LED_SWITCH });
exports.DeviceStatusLedBatteryDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceStatusLedProperty), { key: p2p_1.CommandType.CMD_BAT_DOORBELL_SET_LED_ENABLE });
exports.DeviceStatusLedDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceStatusLedProperty), { key: ParamType.DOORBELL_LED_NIGHT_MODE });
exports.DeviceMotionDetectionProperty = {
    key: p2p_1.CommandType.CMD_PIR_SWITCH,
    name: PropertyName.DeviceMotionDetection,
    label: "Motion Detection",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceMotionDetectionIndoorSoloFloodProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionProperty), { key: p2p_1.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE });
exports.DeviceMotionDetectionDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionProperty), { key: ParamType.DETECT_SWITCH });
exports.DeviceSoundDetectionProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_ENABLE,
    name: PropertyName.DeviceSoundDetection,
    label: "Sound Detection",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DevicePetDetectionProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_DET_SET_PET_ENABLE,
    name: PropertyName.DevicePetDetection,
    label: "Pet Detection",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceRTSPStreamProperty = {
    key: p2p_1.CommandType.CMD_NAS_SWITCH,
    name: PropertyName.DeviceRTSPStream,
    label: "RTSP Stream",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceRTSPStreamUrlProperty = {
    key: "custom_rtspStreamUrl",
    name: PropertyName.DeviceRTSPStreamUrl,
    label: "RTSP Stream URL",
    readable: true,
    writeable: false,
    type: "string",
    default: "",
};
exports.DeviceWatermarkProperty = {
    key: p2p_1.CommandType.CMD_SET_DEVS_OSD,
    name: PropertyName.DeviceWatermark,
    label: "Watermark",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Off",
        1: "Timestamp",
        2: "Timestamp and Logo",
    },
};
exports.DeviceWatermarkIndoorFloodProperty = Object.assign(Object.assign({}, exports.DeviceWatermarkProperty), { states: {
        0: "Timestamp",
        1: "Timestamp and Logo",
        2: "Off",
    } });
exports.DeviceWatermarkSoloWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceWatermarkProperty), { states: {
        0: "Off",
        1: "On",
    } });
exports.DeviceWatermarkBatteryDoorbellCamera1Property = Object.assign(Object.assign({}, exports.DeviceWatermarkProperty), { states: {
        1: "Off",
        2: "On",
    } });
exports.DeviceStateProperty = {
    key: p2p_1.CommandType.CMD_GET_DEV_STATUS,
    name: PropertyName.DeviceState,
    label: "State",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        0: "Offline",
        1: "Online",
        2: "Manually disabled",
        3: "Offline low battery",
        4: "Remove and readd",
        5: "Reset and readd",
    }
};
exports.DeviceStateLockProperty = Object.assign(Object.assign({}, exports.DeviceStateProperty), { key: p2p_1.CommandType.CMD_GET_DEV_STATUS });
exports.DeviceLastChargingDaysProperty = {
    key: "charging_days",
    name: PropertyName.DeviceLastChargingDays,
    label: "Days since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
};
exports.DeviceLastChargingTotalEventsProperty = {
    key: "charing_total",
    name: PropertyName.DeviceLastChargingTotalEvents,
    label: "Total Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
};
exports.DeviceLastChargingRecordedEventsProperty = {
    key: "charging_reserve",
    name: PropertyName.DeviceLastChargingRecordedEvents,
    label: "Total Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
};
exports.DeviceLastChargingFalseEventsProperty = {
    key: "charging_missing",
    name: PropertyName.DeviceLastChargingFalseEvents,
    label: "False Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
};
exports.DeviceBatteryUsageLastWeekProperty = {
    key: "battery_usage_last_week",
    name: PropertyName.DeviceBatteryUsageLastWeek,
    label: "False Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    unit: "%",
    min: 0,
    max: 100,
    default: 0,
};
exports.DeviceLockedProperty = {
    key: "custom_locked",
    name: PropertyName.DeviceLocked,
    label: "locked",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceMotionDetectedProperty = {
    key: "custom_motionDetected",
    name: PropertyName.DeviceMotionDetected,
    label: "Motion detected",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DevicePersonDetectedProperty = {
    key: "custom_personDetected",
    name: PropertyName.DevicePersonDetected,
    label: "Person detected",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DevicePetDetectedProperty = {
    key: "custom_petDetected",
    name: PropertyName.DevicePetDetected,
    label: "Pet detected",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DeviceSoundDetectedProperty = {
    key: "custom_soundDetected",
    name: PropertyName.DeviceSoundDetected,
    label: "Sound detected",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DeviceCryingDetectedProperty = {
    key: "custom_cryingDetected",
    name: PropertyName.DeviceCryingDetected,
    label: "Crying detected",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DeviceRingingProperty = {
    key: "custom_ringing",
    name: PropertyName.DeviceRinging,
    label: "Ringing",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DeviceSensorOpenProperty = {
    key: p2p_1.CommandType.CMD_ENTRY_SENSOR_STATUS,
    name: PropertyName.DeviceSensorOpen,
    label: "Sensor open",
    readable: true,
    writeable: false,
    type: "boolean",
};
exports.DeviceSensorChangeTimeProperty = {
    key: p2p_1.CommandType.CMD_ENTRY_SENSOR_CHANGE_TIME,
    name: PropertyName.DeviceSensorChangeTime,
    label: "Sensor change time",
    readable: true,
    writeable: false,
    type: "number",
};
exports.DeviceMotionSensorPIREventProperty = {
    key: p2p_1.CommandType.CMD_MOTION_SENSOR_PIR_EVT,
    name: PropertyName.DeviceMotionSensorPIREvent,
    label: "Motion sensor PIR event",
    readable: true,
    writeable: false,
    type: "number",
    //TODO: Define states
};
exports.DeviceBasicLockStatusProperty = {
    key: p2p_1.CommandType.CMD_DOORLOCK_GET_STATE,
    name: PropertyName.DeviceLockStatus,
    label: "Lock status",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        1: "1",
        2: "2",
        3: "Unlocked",
        4: "Locked",
        5: "Mechanical anomaly",
        6: "6",
        7: "7",
    }
};
exports.DeviceAdvancedLockStatusProperty = Object.assign(Object.assign({}, exports.DeviceBasicLockStatusProperty), { key: p2p_1.CommandType.CMD_SMARTLOCK_QUERY_STATUS });
exports.DevicePictureUrlProperty = {
    key: "cover_path",
    name: PropertyName.DevicePictureUrl,
    label: "Last Camera Picture URL",
    readable: true,
    writeable: false,
    type: "string",
};
exports.DeviceMotionDetectionTypeProperty = {
    key: p2p_1.CommandType.CMD_DEV_PUSHMSG_MODE,
    name: PropertyName.DeviceMotionDetectionType,
    label: "Motion Detection Type",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Humans only",
        2: "All motions",
    },
};
exports.DeviceMotionDetectionCamera1Property = Object.assign(Object.assign({}, exports.DeviceMotionDetectionTypeProperty), { key: p2p_1.CommandType.CMD_DEV_PUSHMSG_MODE, states: {
        0: "Person Alerts",
        1: "Facial Alerts",
        2: "All Alerts",
    } });
exports.DeviceMotionDetectionTypeFloodlightProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionTypeProperty), { key: p2p_1.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_TYPE, states: {
        1: "Humans only",
        5: "All motions",
    } });
exports.DeviceMotionDetectionTypeIndoorProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionTypeProperty), { key: p2p_1.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_TYPE, states: {
        1: "Person",
        2: "Pet",
        3: "Person and Pet",
        4: "All other motions",
        5: "Person and all other motions",
        6: "Pet and all other motions",
        7: "Person, Pet and all other motions",
    } });
exports.DeviceMotionDetectionSensitivityCamera2Property = {
    key: p2p_1.CommandType.CMD_SET_PIRSENSITIVITY,
    name: PropertyName.DeviceMotionDetectionSensitivity,
    label: "Motion Detection Sensitivity",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 7,
};
exports.DeviceMotionDetectionSensitivityCamera1Property = Object.assign(Object.assign({}, exports.DeviceMotionDetectionSensitivityCamera2Property), { min: 1, max: 100, steps: 1 });
exports.DeviceMotionDetectionSensitivityIndoorProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionSensitivityCamera2Property), { key: p2p_1.CommandType.CMD_INDOOR_DET_SET_MOTION_SENSITIVITY_IDX, min: 1, max: 5 });
exports.DeviceMotionDetectionSensitivityBatteryDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionSensitivityCamera2Property), { key: p2p_1.CommandType.CMD_SET_MOTION_SENSITIVITY, min: 1, max: 5 });
exports.DeviceMotionDetectionSensitivityWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionSensitivityCamera2Property), { key: "custom_motionDetectionSensitivity", min: 1, max: 5 });
exports.DeviceHiddenMotionDetectionSensitivityWiredDoorbellProperty = {
    key: ParamType.DETECT_MOTION_SENSITIVE,
    name: PropertyName.DeviceHiddenMotionDetectionSensitivity,
    label: "HIDDEN Motion Detection Sensitivity",
    readable: true,
    writeable: false,
    type: "number",
    min: 1,
    max: 3,
};
exports.DeviceHiddenMotionDetectionModeWiredDoorbellProperty = {
    key: ParamType.DETECT_MODE,
    name: PropertyName.DeviceHiddenMotionDetectionMode,
    label: "HIDDEN Motion Detection Mode",
    readable: true,
    writeable: false,
    type: "number",
    min: 1,
    max: 3,
};
exports.DeviceFloodlightLightProperty = {
    key: p2p_1.CommandType.CMD_SET_FLOODLIGHT_MANUAL_SWITCH,
    name: PropertyName.DeviceLight,
    label: "Light",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceFloodlightLightSettingsEnableProperty = {
    key: p2p_1.CommandType.CMD_SET_FLOODLIGHT_TOTAL_SWITCH,
    name: PropertyName.DeviceLightSettingsEnable,
    label: "Light Enable",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceFloodlightLightSettingsBrightnessManualProperty = {
    key: p2p_1.CommandType.CMD_SET_FLOODLIGHT_BRIGHT_VALUE,
    name: PropertyName.DeviceLightSettingsBrightnessManual,
    label: "Light Brightness Manual",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
};
exports.DeviceCameraLightSettingsBrightnessManualProperty = Object.assign(Object.assign({}, exports.DeviceFloodlightLightSettingsBrightnessManualProperty), { min: 40, default: 100 });
exports.DeviceFloodlightLightSettingsBrightnessMotionProperty = {
    key: p2p_1.CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_PIR,
    name: PropertyName.DeviceLightSettingsBrightnessMotion,
    label: "Light Brightness Motion",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
};
exports.DeviceFloodlightLightSettingsBrightnessScheduleProperty = {
    key: p2p_1.CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_SCH,
    name: PropertyName.DeviceLightSettingsBrightnessSchedule,
    label: "Light Brightness Schedule",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
};
exports.DeviceFloodlightLightSettingsMotionTriggeredProperty = {
    key: p2p_1.CommandType.CMD_SET_LIGHT_CTRL_PIR_SWITCH,
    name: PropertyName.DeviceLightSettingsMotionTriggered,
    label: "Light Motion Triggered Enable",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty = {
    key: p2p_1.CommandType.CMD_SET_PIRSENSITIVITY,
    name: PropertyName.DeviceLightSettingsMotionTriggeredDistance,
    label: "Light Motion Triggered Distance",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Min",
        2: "Low",
        3: "Medium",
        4: "High",
        5: "Max",
    },
};
exports.DeviceFloodlightLightSettingsMotionTriggeredTimerProperty = {
    key: p2p_1.CommandType.CMD_SET_LIGHT_CTRL_PIR_TIME,
    name: PropertyName.DeviceLightSettingsMotionTriggeredTimer,
    label: "Light Motion Triggered Timer",
    readable: true,
    writeable: true,
    type: "number",
    unit: "sec",
};
exports.DeviceMicrophoneProperty = {
    key: p2p_1.CommandType.CMD_SET_DEV_MIC_MUTE,
    name: PropertyName.DeviceMicrophone,
    label: "Microphone",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceSpeakerProperty = {
    key: p2p_1.CommandType.CMD_SET_DEV_SPEAKER_MUTE,
    name: PropertyName.DeviceSpeaker,
    label: "Speaker",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceAudioRecordingProperty = {
    key: p2p_1.CommandType.CMD_SET_AUDIO_MUTE_RECORD,
    name: PropertyName.DeviceAudioRecording,
    label: "Audio Recording",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceAudioRecordingIndoorFloodlightProperty = Object.assign(Object.assign({}, exports.DeviceAudioRecordingProperty), { key: p2p_1.CommandType.CMD_INDOOR_SET_RECORD_AUDIO_ENABLE });
exports.DeviceAudioRecordingWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceAudioRecordingProperty), { key: ParamType.DOORBELL_AUDIO_RECODE });
exports.DeviceMotionTrackingProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_PAN_MOTION_TRACK,
    name: PropertyName.DeviceMotionTracking,
    label: "Motion Tracking",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceSpeakerVolumeProperty = {
    key: p2p_1.CommandType.CMD_SET_DEV_SPEAKER_VOLUME,
    name: PropertyName.DeviceSpeakerVolume,
    label: "Speaker Volume",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        90: "Low",
        92: "Medium",
        93: "High"
    },
};
exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty = {
    key: p2p_1.CommandType.CMD_SET_DEV_SPEAKER_VOLUME,
    name: PropertyName.DeviceSpeakerVolume,
    label: "Speaker Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
};
exports.DeviceSpeakerVolumeWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty), { key: ParamType.VOLUME, max: 169 });
exports.DeviceRingtoneVolumeBatteryDoorbellProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_SET_RINGTONE_VOLUME,
    name: PropertyName.DeviceRingtoneVolume,
    label: "Ringtone Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
};
exports.DeviceRingtoneVolumeWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceRingtoneVolumeBatteryDoorbellProperty), { key: ParamType.RINGING_VOLUME, max: 130 });
exports.DevicePowerSourceProperty = {
    key: p2p_1.CommandType.CMD_SET_POWER_CHARGE,
    name: PropertyName.DevicePowerSource,
    label: "Speaker Volume",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Battery",
        1: "Solar Panel",
    },
};
exports.DevicePowerWorkingModeProperty = {
    key: p2p_1.CommandType.CMD_SET_PIR_POWERMODE,
    name: PropertyName.DevicePowerWorkingMode,
    label: "Power Working Mode",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Optimal Battery Life",
        1: "Optimal Surveillance",
        2: "Custom Recording",
    },
};
exports.DevicePowerWorkingModeBatteryDoorbellProperty = Object.assign(Object.assign({}, exports.DevicePowerWorkingModeProperty), { states: {
        0: "Balance Surveillance",
        1: "Optimal Surveillance",
        2: "Custom Recording",
        3: "Optimal Battery Life",
    } });
exports.DeviceChargingStatusProperty = {
    key: p2p_1.CommandType.SUB1G_REP_UNPLUG_POWER_LINE,
    name: PropertyName.DeviceChargingStatus,
    label: "Charging Status",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        1: "Charging",
        2: "Unplugged",
        3: "Plugged",
    },
};
exports.DeviceRecordingClipLengthProperty = {
    key: p2p_1.CommandType.CMD_DEV_RECORD_TIMEOUT,
    name: PropertyName.DeviceRecordingClipLength,
    label: "Recording Clip Length",
    readable: true,
    writeable: true,
    type: "number",
    min: 5,
    max: 120,
    default: 60,
};
exports.DeviceRecordingClipLengthFloodlightProperty = Object.assign(Object.assign({}, exports.DeviceRecordingClipLengthProperty), { min: 30, max: 120 });
exports.DeviceRecordingRetriggerIntervalProperty = {
    key: p2p_1.CommandType.CMD_DEV_RECORD_INTERVAL,
    name: PropertyName.DeviceRecordingRetriggerInterval,
    label: "Recording Clip Length",
    readable: true,
    writeable: true,
    type: "number",
    unit: "sec",
    min: 5,
    max: 60,
    default: 5,
};
exports.DeviceRecordingRetriggerIntervalBatteryDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceRecordingRetriggerIntervalProperty), { min: 2, max: 60, default: 2 });
exports.DeviceRecordingRetriggerIntervalFloodlightProperty = Object.assign(Object.assign({}, exports.DeviceRecordingRetriggerIntervalProperty), { min: 0, max: 30 });
exports.DeviceRecordingEndClipMotionStopsProperty = {
    key: p2p_1.CommandType.CMD_DEV_RECORD_AUTOSTOP,
    name: PropertyName.DeviceRecordingEndClipMotionStops,
    label: "Recording end clip early if motion stops",
    readable: true,
    writeable: true,
    type: "boolean",
    default: true,
};
exports.DeviceVideoStreamingQualityProperty = {
    key: ParamType.DOORBELL_VIDEO_QUALITY,
    name: PropertyName.DeviceVideoStreamingQuality,
    label: "Video Streaming Quality",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Auto",
        1: "Low",
        2: "Medium",
        3: "High",
    },
};
exports.DeviceVideoStreamingQualityBatteryDoorbellProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_VIDEO_QUALITY,
    name: PropertyName.DeviceVideoStreamingQuality,
    label: "Video Streaming Quality",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Auto / Low Encoding",
        1: "Low / Low Encoding",
        2: "Medium / Low Encoding",
        3: "High / Low Encoding",
        5: "Auto / High Encoding",
        6: "Low / High Encoding",
        7: "Medium / High Encoding",
        8: "High / High Encoding",
    },
};
exports.DeviceVideoStreamingQualityCameraProperty = Object.assign(Object.assign({}, exports.DeviceVideoStreamingQualityProperty), { key: p2p_1.CommandType.CMD_BAT_DOORBELL_VIDEO_QUALITY });
exports.DeviceVideoRecordingQualityIndoorProperty = {
    key: ParamType.DOORBELL_RECORD_QUALITY,
    name: PropertyName.DeviceVideoRecordingQuality,
    label: "Video Recording Quality",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        2: "Full HD (1080P)",
        3: "2K HD",
    },
};
exports.DeviceVideoRecordingQualityWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceVideoRecordingQualityIndoorProperty), { key: ParamType.DOORBELL_RECORD_QUALITY, states: {
        1: "Storage Saver (1600 * 1200)",
        2: "Full HD (1600 * 1200)",
        3: "2K HD (2560 * 1920)",
    } });
exports.DeviceVideoRecordingQualityProperty = Object.assign(Object.assign({}, exports.DeviceVideoRecordingQualityIndoorProperty), { key: p2p_1.CommandType.CMD_SET_RECORD_QUALITY, states: {
        2: "Full HD (1080P)",
        3: "2K HD",
    } });
exports.DeviceWDRProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_WDR_SWITCH,
    name: PropertyName.DeviceVideoWDR,
    label: "WDR",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceChimeIndoorBatteryDoorbellProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_MECHANICAL_CHIME_SWITCH,
    name: PropertyName.DeviceChimeIndoor,
    label: "Indoor Chime Enabled",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceChimeIndoorWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceChimeIndoorBatteryDoorbellProperty), { key: ParamType.CHIME_STATE });
exports.DeviceChimeHomebaseBatteryDoorbellProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_CHIME_SWITCH,
    name: PropertyName.DeviceChimeHomebase,
    label: "Homebase Chime Enabled",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_DINGDONG_V,
    name: PropertyName.DeviceChimeHomebaseRingtoneVolume,
    label: "Homebase Chime Ringtone Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 26,
};
exports.DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_DINGDONG_R,
    name: PropertyName.DeviceChimeHomebaseRingtoneType,
    label: "Homebase Chime Ringtone Type",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Default",
        1: "Silent",
        2: "Beacon",
        3: "Chord",
        4: "Christmas",
        5: "Circuit",
        6: "Clock",
        7: "Ding",
        8: "Hillside",
        9: "Presto",
    },
};
exports.DeviceNotificationTypeProperty = {
    key: p2p_1.CommandType.CMD_SET_PUSH_EFFECT,
    name: PropertyName.DeviceNotificationType,
    label: "Notification Type",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Most Efficient",
        2: "Include Thumbnail",
        3: "Full Effect",
    },
};
exports.DeviceNotificationTypeIndoorFloodlightProperty = Object.assign(Object.assign({}, exports.DeviceNotificationTypeProperty), { key: p2p_1.CommandType.CMD_INDOOR_PUSH_NOTIFY_TYPE });
exports.DeviceNotificationTypeBatteryDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceNotificationTypeProperty), { key: p2p_1.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE });
exports.DeviceNotificationTypeWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceNotificationTypeProperty), { key: ParamType.DOORBELL_MOTION_NOTIFICATION });
exports.DeviceRotationSpeedProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_PAN_SPEED,
    name: PropertyName.DeviceRotationSpeed,
    label: "Rotation Speed",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Min",
        2: "Low",
        3: "Medium",
        4: "High",
        5: "Max",
    },
};
exports.DeviceSoundDetectionTypeProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_TYPE,
    name: PropertyName.DeviceSoundDetectionType,
    label: "Sound Detection Type",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Crying",
        2: "All Sounds",
    },
};
exports.DeviceSoundDetectionSensitivityProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_DET_SET_SOUND_SENSITIVITY_IDX,
    name: PropertyName.DeviceSoundDetectionSensitivity,
    label: "Sound Detection Sensitivity",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Min",
        2: "Low",
        3: "Medium",
        4: "High",
        5: "Max",
    },
};
exports.DeviceNotificationPersonProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_AI_PERSON_ENABLE,
    name: PropertyName.DeviceNotificationPerson,
    label: "Notification Person detected",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationPetProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_AI_PET_ENABLE,
    name: PropertyName.DeviceNotificationPet,
    label: "Notification Pet detected",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationAllOtherMotionProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_AI_MOTION_ENABLE,
    name: PropertyName.DeviceNotificationAllOtherMotion,
    label: "Notification All Other Motion",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationAllSoundProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_AI_SOUND_ENABLE,
    name: PropertyName.DeviceNotificationAllSound,
    label: "Notification Sound detected",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationCryingProperty = {
    key: p2p_1.CommandType.CMD_INDOOR_AI_CRYING_ENABLE,
    name: PropertyName.DeviceNotificationCrying,
    label: "Notification Crying detected",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationRingProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
    name: PropertyName.DeviceNotificationRing,
    label: "Notification Ring detected",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationRingWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceNotificationRingProperty), { key: ParamType.DOORBELL_NOTIFICATION_OPEN });
exports.DeviceNotificationMotionProperty = {
    key: p2p_1.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
    name: PropertyName.DeviceNotificationMotion,
    label: "Notification Motion detected",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceNotificationMotionWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceNotificationMotionProperty), { key: ParamType.DOORBELL_NOTIFICATION_OPEN });
exports.DeviceChirpVolumeEntrySensorProperty = {
    key: p2p_1.CommandType.CMD_SENSOR_SET_CHIRP_VOLUME,
    name: PropertyName.DeviceChirpVolume,
    label: "Chirp Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 26,
    steps: 1,
};
exports.DeviceChirpToneEntrySensorProperty = {
    key: p2p_1.CommandType.CMD_SENSOR_SET_CHIRP_TONE,
    name: PropertyName.DeviceChirpTone,
    label: "Chirp Tone",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "None",
        1: "Water",
        2: "Classic",
        3: "Light",
        4: "Ding",
    }
};
exports.DeviceVideoHDRWiredDoorbellProperty = {
    key: ParamType.DOORBELL_HDR,
    name: PropertyName.DeviceVideoHDR,
    label: "HDR",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceVideoDistortionCorrectionWiredDoorbellProperty = {
    key: ParamType.DOORBELL_DISTORTION,
    name: PropertyName.DeviceVideoDistortionCorrection,
    label: "Distortion Correction",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceVideoRingRecordWiredDoorbellProperty = {
    key: ParamType.DOORBELL_RING_RECORD,
    name: PropertyName.DeviceVideoRingRecord,
    label: "Record while live viewing after opening notification",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Disabled",
        1: "Enabled - Recording Quality Preferred",
        2: "Enabled - Streaming Quality Preferred",
    }
};
exports.DeviceProperties = {
    [DeviceType.CAMERA2]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityCamera2Property, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeProperty, [PropertyName.DevicePowerSource]: exports.DevicePowerSourceProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty }),
    [DeviceType.CAMERA2C]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceNightvision]: exports.DeviceNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityCamera2Property, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeProperty, [PropertyName.DevicePowerSource]: exports.DevicePowerSourceProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceCameraLightSettingsBrightnessManualProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty }),
    [DeviceType.CAMERA2C_PRO]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceNightvision]: exports.DeviceNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityCamera2Property, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeProperty, [PropertyName.DevicePowerSource]: exports.DevicePowerSourceProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityCameraProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceCameraLightSettingsBrightnessManualProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty }),
    [DeviceType.CAMERA2_PRO]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityCamera2Property, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeProperty, [PropertyName.DevicePowerSource]: exports.DevicePowerSourceProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty }),
    [DeviceType.CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DevicePowerSource]: exports.DevicePowerSourceProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityCamera1Property, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionCamera1Property }),
    [DeviceType.CAMERA_E]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DevicePowerSource]: exports.DevicePowerSourceProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityCamera1Property, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionCamera1Property }),
    [DeviceType.DOORBELL]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionWiredDoorbellProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionDoorbellProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionDoorbellProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceRinging]: exports.DeviceRingingProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedDoorbellProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceHiddenMotionDetectionSensitivity]: exports.DeviceHiddenMotionDetectionSensitivityWiredDoorbellProperty, [PropertyName.DeviceHiddenMotionDetectionMode]: exports.DeviceHiddenMotionDetectionModeWiredDoorbellProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityWiredDoorbellProperty, [PropertyName.DeviceVideoHDR]: exports.DeviceVideoHDRWiredDoorbellProperty, [PropertyName.DeviceVideoDistortionCorrection]: exports.DeviceVideoDistortionCorrectionWiredDoorbellProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityWiredDoorbellProperty, [PropertyName.DeviceVideoRingRecord]: exports.DeviceVideoRingRecordWiredDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingWiredDoorbellProperty, [PropertyName.DeviceChimeIndoor]: exports.DeviceChimeIndoorWiredDoorbellProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeWiredDoorbellProperty, [PropertyName.DeviceRingtoneVolume]: exports.DeviceRingtoneVolumeWiredDoorbellProperty, [PropertyName.DeviceNotificationRing]: exports.DeviceNotificationRingWiredDoorbellProperty, [PropertyName.DeviceNotificationMotion]: exports.DeviceNotificationMotionWiredDoorbellProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeWiredDoorbellProperty }),
    [DeviceType.BATTERY_DOORBELL]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedBatteryDoorbellProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, 
        //[PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceRinging]: exports.DeviceRingingProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceRingtoneVolume]: exports.DeviceRingtoneVolumeBatteryDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityBatteryDoorbellProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeBatteryDoorbellProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalBatteryDoorbellProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityBatteryDoorbellProperty, [PropertyName.DeviceVideoWDR]: exports.DeviceWDRProperty, [PropertyName.DeviceChimeIndoor]: exports.DeviceChimeIndoorBatteryDoorbellProperty, [PropertyName.DeviceChimeHomebase]: exports.DeviceChimeHomebaseBatteryDoorbellProperty, [PropertyName.DeviceChimeHomebaseRingtoneVolume]: exports.DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty, [PropertyName.DeviceChimeHomebaseRingtoneType]: exports.DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeBatteryDoorbellProperty, [PropertyName.DeviceNotificationRing]: exports.DeviceNotificationRingProperty, [PropertyName.DeviceNotificationMotion]: exports.DeviceNotificationMotionProperty }),
    [DeviceType.BATTERY_DOORBELL_2]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceWifiSignalLevel]: exports.DeviceWifiSignalLevelProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedBatteryDoorbellProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, 
        //[PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceRinging]: exports.DeviceRingingProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceRingtoneVolume]: exports.DeviceRingtoneVolumeBatteryDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityBatteryDoorbellProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeBatteryDoorbellProperty, [PropertyName.DeviceChargingStatus]: exports.DeviceChargingStatusProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalBatteryDoorbellProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityBatteryDoorbellProperty, [PropertyName.DeviceVideoWDR]: exports.DeviceWDRProperty, [PropertyName.DeviceChimeIndoor]: exports.DeviceChimeIndoorBatteryDoorbellProperty, [PropertyName.DeviceChimeHomebase]: exports.DeviceChimeHomebaseBatteryDoorbellProperty, [PropertyName.DeviceChimeHomebaseRingtoneVolume]: exports.DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty, [PropertyName.DeviceChimeHomebaseRingtoneType]: exports.DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeBatteryDoorbellProperty, [PropertyName.DeviceNotificationRing]: exports.DeviceNotificationRingProperty, [PropertyName.DeviceNotificationMotion]: exports.DeviceNotificationMotionProperty }),
    [DeviceType.FLOODLIGHT]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsEnable]: exports.DeviceFloodlightLightSettingsEnableProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty, [PropertyName.DeviceLightSettingsBrightnessMotion]: exports.DeviceFloodlightLightSettingsBrightnessMotionProperty, [PropertyName.DeviceLightSettingsBrightnessSchedule]: exports.DeviceFloodlightLightSettingsBrightnessScheduleProperty, [PropertyName.DeviceLightSettingsMotionTriggered]: exports.DeviceFloodlightLightSettingsMotionTriggeredProperty, [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: exports.DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty, [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: exports.DeviceFloodlightLightSettingsMotionTriggeredTimerProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeFloodlightProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthFloodlightProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalFloodlightProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty }),
    [DeviceType.FLOODLIGHT_CAMERA_8422]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsEnable]: exports.DeviceFloodlightLightSettingsEnableProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty, [PropertyName.DeviceLightSettingsBrightnessMotion]: exports.DeviceFloodlightLightSettingsBrightnessMotionProperty, [PropertyName.DeviceLightSettingsBrightnessSchedule]: exports.DeviceFloodlightLightSettingsBrightnessScheduleProperty, [PropertyName.DeviceLightSettingsMotionTriggered]: exports.DeviceFloodlightLightSettingsMotionTriggeredProperty, [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: exports.DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty, [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: exports.DeviceFloodlightLightSettingsMotionTriggeredTimerProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeFloodlightProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthFloodlightProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalFloodlightProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty }),
    [DeviceType.FLOODLIGHT_CAMERA_8423]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsEnable]: exports.DeviceFloodlightLightSettingsEnableProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty, [PropertyName.DeviceLightSettingsBrightnessMotion]: exports.DeviceFloodlightLightSettingsBrightnessMotionProperty, [PropertyName.DeviceLightSettingsBrightnessSchedule]: exports.DeviceFloodlightLightSettingsBrightnessScheduleProperty, [PropertyName.DeviceLightSettingsMotionTriggered]: exports.DeviceFloodlightLightSettingsMotionTriggeredProperty, [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: exports.DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty, [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: exports.DeviceFloodlightLightSettingsMotionTriggeredTimerProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeFloodlightProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthFloodlightProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalFloodlightProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty }),
    [DeviceType.FLOODLIGHT_CAMERA_8424]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsEnable]: exports.DeviceFloodlightLightSettingsEnableProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty, [PropertyName.DeviceLightSettingsBrightnessMotion]: exports.DeviceFloodlightLightSettingsBrightnessMotionProperty, [PropertyName.DeviceLightSettingsBrightnessSchedule]: exports.DeviceFloodlightLightSettingsBrightnessScheduleProperty, [PropertyName.DeviceLightSettingsMotionTriggered]: exports.DeviceFloodlightLightSettingsMotionTriggeredProperty, [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: exports.DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty, [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: exports.DeviceFloodlightLightSettingsMotionTriggeredTimerProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeFloodlightProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthFloodlightProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalFloodlightProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty }),
    [DeviceType.INDOOR_CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityIndoorProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty }),
    [DeviceType.INDOOR_CAMERA_1080]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty }),
    [DeviceType.INDOOR_PT_CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceMotionTracking]: exports.DeviceMotionTrackingProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityIndoorProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceRotationSpeed]: exports.DeviceRotationSpeedProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty }),
    [DeviceType.INDOOR_PT_CAMERA_1080]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceMotionTracking]: exports.DeviceMotionTrackingProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceRotationSpeed]: exports.DeviceRotationSpeedProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty }),
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceNightvision]: exports.DeviceNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityIndoorProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty }),
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityIndoorProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty }),
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceSoundDetectionType]: exports.DeviceSoundDetectionTypeProperty, [PropertyName.DeviceSoundDetectionSensitivity]: exports.DeviceSoundDetectionSensitivityProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMotionDetectionSensitivity]: exports.DeviceMotionDetectionSensitivityIndoorProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeIndoorFloodDoorbellProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceVideoRecordingQuality]: exports.DeviceVideoRecordingQualityIndoorProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeIndoorFloodlightProperty, [PropertyName.DeviceNotificationPerson]: exports.DeviceNotificationPersonProperty, [PropertyName.DeviceNotificationPet]: exports.DeviceNotificationPetProperty, [PropertyName.DeviceNotificationAllOtherMotion]: exports.DeviceNotificationAllOtherMotionProperty, [PropertyName.DeviceNotificationAllSound]: exports.DeviceNotificationAllSoundProperty, [PropertyName.DeviceNotificationCrying]: exports.DeviceNotificationCryingProperty }),
    [DeviceType.SOLO_CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty }),
    [DeviceType.SOLO_CAMERA_PRO]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty }),
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceNightvision]: exports.DeviceNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty }),
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceNightvision]: exports.DeviceNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty }),
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceNightvision]: exports.DeviceNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceRTSPStreamUrl]: exports.DeviceRTSPStreamUrlProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty, [PropertyName.DeviceMicrophone]: exports.DeviceMicrophoneProperty, [PropertyName.DeviceSpeaker]: exports.DeviceSpeakerProperty, [PropertyName.DeviceSpeakerVolume]: exports.DeviceSpeakerVolumeProperty, [PropertyName.DeviceAudioRecording]: exports.DeviceAudioRecordingIndoorFloodlightProperty, [PropertyName.DeviceMotionDetectionType]: exports.DeviceMotionDetectionTypeIndoorProperty, [PropertyName.DevicePowerWorkingMode]: exports.DevicePowerWorkingModeProperty, [PropertyName.DeviceRecordingClipLength]: exports.DeviceRecordingClipLengthProperty, [PropertyName.DeviceRecordingRetriggerInterval]: exports.DeviceRecordingRetriggerIntervalProperty, [PropertyName.DeviceRecordingEndClipMotionStops]: exports.DeviceRecordingEndClipMotionStopsProperty, [PropertyName.DeviceVideoStreamingQuality]: exports.DeviceVideoStreamingQualityProperty, [PropertyName.DeviceNotificationType]: exports.DeviceNotificationTypeProperty, [PropertyName.DeviceLight]: exports.DeviceFloodlightLightProperty, [PropertyName.DeviceLightSettingsBrightnessManual]: exports.DeviceFloodlightLightSettingsBrightnessManualProperty }),
    [DeviceType.KEYPAD]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBatteryLow]: exports.DeviceBatteryLowKeypadProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIKeypadProperty, [PropertyName.DeviceBatteryIsCharging]: exports.DeviceBatteryIsChargingKeypadProperty }),
    [DeviceType.LOCK_ADVANCED]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { 
        //[PropertyName.DeviceState]: DeviceStateLockProperty,
        [PropertyName.DeviceBattery]: exports.DeviceBatteryLockProperty, 
        //[PropertyName.DeviceWifiRSSI]: DeviceWifiRSSILockProperty,
        //[PropertyName.DeviceLocked]: DeviceLockedProperty,
        [PropertyName.DeviceLockStatus]: exports.DeviceAdvancedLockStatusProperty }),
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { 
        //[PropertyName.DeviceState]: DeviceStateLockProperty,
        [PropertyName.DeviceBattery]: exports.DeviceBatteryLockProperty, 
        //[PropertyName.DeviceWifiRSSI]: DeviceWifiRSSILockProperty,
        //[PropertyName.DeviceLocked]: DeviceLockedProperty,
        [PropertyName.DeviceLockStatus]: exports.DeviceAdvancedLockStatusProperty }),
    [DeviceType.LOCK_BASIC]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceState]: exports.DeviceStateLockProperty, [PropertyName.DeviceBattery]: exports.DeviceBatteryLockProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSILockProperty, [PropertyName.DeviceLocked]: exports.DeviceLockedProperty, [PropertyName.DeviceLockStatus]: exports.DeviceBasicLockStatusProperty }),
    [DeviceType.LOCK_BASIC_NO_FINGER]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceState]: exports.DeviceStateLockProperty, [PropertyName.DeviceBattery]: exports.DeviceBatteryLockProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSILockProperty, [PropertyName.DeviceLocked]: exports.DeviceLockedProperty, [PropertyName.DeviceLockStatus]: exports.DeviceBasicLockStatusProperty }),
    [DeviceType.MOTION_SENSOR]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBatteryLow]: exports.DeviceBatteryLowMotionSensorProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DeviceMotionSensorPIREvent]: exports.DeviceMotionSensorPIREventProperty }),
    [DeviceType.SENSOR]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceSensorOpen]: exports.DeviceSensorOpenProperty, [PropertyName.DeviceBatteryLow]: exports.DeviceBatteryLowSensorProperty, [PropertyName.DeviceSensorChangeTime]: exports.DeviceSensorChangeTimeProperty, [PropertyName.DeviceChirpVolume]: exports.DeviceChirpVolumeEntrySensorProperty, [PropertyName.DeviceChirpTone]: exports.DeviceChirpToneEntrySensorProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIEntrySensorProperty }),
};
exports.StationNameProperty = {
    key: "station_name",
    name: PropertyName.Name,
    label: "Name",
    readable: true,
    writeable: false,
    type: "string",
};
exports.StationModelProperty = {
    key: "station_model",
    name: PropertyName.Model,
    label: "Model",
    readable: true,
    writeable: false,
    type: "string",
};
exports.StationSerialNumberProperty = {
    key: "station_sn",
    name: PropertyName.SerialNumber,
    label: "Serial number",
    readable: true,
    writeable: false,
    type: "string",
};
exports.BaseStationProperties = {
    [exports.StationNameProperty.name]: exports.StationNameProperty,
    [exports.StationModelProperty.name]: exports.StationModelProperty,
    [exports.StationSerialNumberProperty.name]: exports.StationSerialNumberProperty,
    [exports.GenericTypeProperty.name]: exports.GenericTypeProperty,
    [exports.GenericHWVersionProperty.name]: exports.GenericHWVersionProperty,
    [exports.GenericSWVersionProperty.name]: exports.GenericSWVersionProperty,
};
exports.StationGuardModeProperty = {
    key: ParamType.GUARD_MODE,
    name: PropertyName.StationGuardMode,
    label: "Guard Mode",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Away",
        1: "Home",
        2: "Schedule",
        3: "Custom 1",
        4: "Custom 2",
        5: "Custom 3",
        47: "Geofencing",
        63: "Disarmed",
    },
};
exports.StationGuardModeKeyPadProperty = Object.assign(Object.assign({}, exports.StationGuardModeProperty), { states: {
        0: "Away",
        1: "Home",
        2: "Schedule",
        3: "Custom 1",
        4: "Custom 2",
        5: "Custom 3",
        6: "Off",
        47: "Geofencing",
        63: "Disarmed",
    } });
exports.StationCurrentModeProperty = {
    key: p2p_1.CommandType.CMD_GET_ALARM_MODE,
    name: PropertyName.StationCurrentMode,
    label: "Current Mode",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        0: "Away",
        1: "Home",
        3: "Custom 1",
        4: "Custom 2",
        5: "Custom 3",
        63: "Disarmed",
    },
};
exports.StationCurrentModeKeyPadProperty = Object.assign(Object.assign({}, exports.StationCurrentModeProperty), { states: {
        0: "Away",
        1: "Home",
        3: "Custom 1",
        4: "Custom 2",
        5: "Custom 3",
        6: "Off",
        63: "Disarmed",
    } });
exports.StationLanIpAddressProperty = {
    key: p2p_1.CommandType.CMD_GET_HUB_LAN_IP,
    name: PropertyName.StationLANIpAddress,
    label: "LAN IP Address",
    readable: true,
    writeable: false,
    type: "string",
};
exports.StationLanIpAddressStandaloneProperty = Object.assign(Object.assign({}, exports.StationLanIpAddressProperty), { key: "ip_addr" });
exports.StationMacAddressProperty = {
    key: "wifi_mac",
    //key: "sub1g_mac", // are always the same
    name: PropertyName.StationMacAddress,
    label: "MAC Address",
    readable: true,
    writeable: false,
    type: "string",
};
exports.StationAlarmVolumeProperty = {
    key: p2p_1.CommandType.CMD_SET_HUB_SPK_VOLUME,
    name: PropertyName.StationAlarmVolume,
    label: "Alarm Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 26,
    default: 26,
};
exports.StationPromptVolumeProperty = {
    key: p2p_1.CommandType.CMD_SET_PROMPT_VOLUME,
    name: PropertyName.StationPromptVolume,
    label: "Prompt Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 26,
};
exports.StationAlarmToneProperty = {
    key: p2p_1.CommandType.CMD_HUB_ALARM_TONE,
    name: PropertyName.StationAlarmTone,
    label: "Alarm Tone",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Alarm sound 1",
        2: "Alarm sound 2",
    }
};
exports.StationNotificationSwitchModeScheduleProperty = {
    key: p2p_1.CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeSchedule,
    label: "Notification Switch Mode Schedule",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationNotificationSwitchModeGeofenceProperty = {
    key: p2p_1.CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeGeofence,
    label: "Notification Switch Mode Geofence",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationNotificationSwitchModeAppProperty = {
    key: p2p_1.CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeApp,
    label: "Notification Switch Mode App",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationNotificationSwitchModeKeypadProperty = {
    key: p2p_1.CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeKeypad,
    label: "Notification Switch Mode Keypad",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationNotificationStartAlarmDelayProperty = {
    key: p2p_1.CommandType.CMD_HUB_NOTIFY_ALARM,
    name: PropertyName.StationNotificationStartAlarmDelay,
    label: "Notification Start Alarm Delay",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationTimeFormatProperty = {
    key: p2p_1.CommandType.CMD_SET_HUB_OSD,
    name: PropertyName.StationTimeFormat,
    label: "Time Format",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "12h",
        1: "24h",
    }
};
exports.StationSwitchModeWithAccessCodeProperty = {
    key: p2p_1.CommandType.CMD_KEYPAD_PSW_OPEN,
    name: PropertyName.StationSwitchModeWithAccessCode,
    label: "Switch mode with access code",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationAutoEndAlarmProperty = {
    key: p2p_1.CommandType.CMD_SET_HUB_ALARM_AUTO_END,
    name: PropertyName.StationAutoEndAlarm,
    label: "Auto End Alarm",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationTurnOffAlarmWithButtonProperty = {
    key: p2p_1.CommandType.CMD_SET_HUB_ALARM_CLOSE,
    name: PropertyName.StationTurnOffAlarmWithButton,
    label: "Turn off alarm with button",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.StationProperties = {
    [DeviceType.STATION]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty, [PropertyName.StationTimeFormat]: exports.StationTimeFormatProperty, [PropertyName.StationPromptVolume]: exports.StationPromptVolumeProperty, [PropertyName.StationAlarmVolume]: exports.StationAlarmVolumeProperty, [PropertyName.StationAlarmTone]: exports.StationAlarmToneProperty, [PropertyName.StationNotificationSwitchModeSchedule]: exports.StationNotificationSwitchModeScheduleProperty, [PropertyName.StationNotificationSwitchModeGeofence]: exports.StationNotificationSwitchModeGeofenceProperty, [PropertyName.StationNotificationSwitchModeApp]: exports.StationNotificationSwitchModeAppProperty, [PropertyName.StationNotificationSwitchModeKeypad]: exports.StationNotificationSwitchModeKeypadProperty, [PropertyName.StationNotificationStartAlarmDelay]: exports.StationNotificationStartAlarmDelayProperty }),
    [DeviceType.INDOOR_CAMERA]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_CAMERA_1080]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_PT_CAMERA]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_PT_CAMERA_1080]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.DOORBELL]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty, [PropertyName.StationTimeFormat]: exports.StationTimeFormatProperty }),
    [DeviceType.SOLO_CAMERA]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.SOLO_CAMERA_PRO]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.FLOODLIGHT]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.FLOODLIGHT_CAMERA_8422]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.FLOODLIGHT_CAMERA_8423]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.FLOODLIGHT_CAMERA_8424]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.LOCK_ADVANCED]: Object.assign({}, exports.BaseStationProperties),
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: Object.assign({}, exports.BaseStationProperties),
    [DeviceType.LOCK_BASIC]: Object.assign({}, exports.BaseStationProperties),
    [DeviceType.LOCK_BASIC_NO_FINGER]: Object.assign({}, exports.BaseStationProperties),
};
var CommandName;
(function (CommandName) {
    CommandName["DeviceStartLivestream"] = "deviceStartLivestream";
    CommandName["DeviceStopLivestream"] = "deviceStopLivestream";
    CommandName["DeviceQuickResponse"] = "deviceQuickResponse";
    CommandName["DevicePanAndTilt"] = "devicePanAndTilt";
    CommandName["DeviceTriggerAlarmSound"] = "deviceTriggerAlarmSound";
    CommandName["DeviceStartDownload"] = "deviceStartDownload";
    CommandName["DeviceCancelDownload"] = "deviceCancelDownload";
    CommandName["StationReboot"] = "stationReboot";
    CommandName["StationTriggerAlarmSound"] = "stationTriggerAlarmSound";
})(CommandName = exports.CommandName || (exports.CommandName = {}));
exports.DeviceCommands = {
    [DeviceType.CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.CAMERA2]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.CAMERA2C]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.CAMERA2C_PRO]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.CAMERA2_PRO]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.CAMERA_E]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.DOORBELL]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceQuickResponse,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.BATTERY_DOORBELL]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceQuickResponse,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.BATTERY_DOORBELL_2]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceQuickResponse,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_CAMERA_1080]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_PT_CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DevicePanAndTilt,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.INDOOR_PT_CAMERA_1080]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DevicePanAndTilt,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.SOLO_CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.SOLO_CAMERA_PRO]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.FLOODLIGHT]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8422]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8423]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DevicePanAndTilt,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8424]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceStartDownload,
        CommandName.DeviceCancelDownload,
    ],
    [DeviceType.KEYPAD]: [],
    [DeviceType.LOCK_BASIC]: [],
    [DeviceType.LOCK_BASIC_NO_FINGER]: [],
    [DeviceType.LOCK_ADVANCED]: [],
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: [],
    [DeviceType.MOTION_SENSOR]: [],
    [DeviceType.SENSOR]: [],
};
exports.StationCommands = {
    [DeviceType.STATION]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_CAMERA]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_CAMERA_1080]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_PT_CAMERA]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.INDOOR_PT_CAMERA_1080]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.DOORBELL]: [
        CommandName.StationReboot,
    ],
    [DeviceType.SOLO_CAMERA]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.SOLO_CAMERA_PRO]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.FLOODLIGHT]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8422]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8423]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8424]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
    ],
    [DeviceType.KEYPAD]: [],
};
