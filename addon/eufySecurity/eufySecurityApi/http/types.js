"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceLastChargingRecordedEventsProperty = exports.DeviceLastChargingTotalEventsProperty = exports.DeviceLastChargingDaysProperty = exports.DeviceStateLockProperty = exports.DeviceStateProperty = exports.DeviceWatermarkBatteryDoorbellCamera1Property = exports.DeviceWatermarkSoloWiredDoorbellProperty = exports.DeviceWatermarkIndoorFloodProperty = exports.DeviceWatermarkProperty = exports.DeviceRTSPStreamProperty = exports.DevicePetDetectionProperty = exports.DeviceSoundDetectionProperty = exports.DeviceMotionDetectionDoorbellProperty = exports.DeviceMotionDetectionIndoorSoloFloodProperty = exports.DeviceMotionDetectionProperty = exports.DeviceStatusLedDoorbellProperty = exports.DeviceStatusLedBatteryDoorbellProperty = exports.DeviceStatusLedIndoorSoloFloodProperty = exports.DeviceStatusLedProperty = exports.DeviceEnabledStandaloneProperty = exports.DeviceEnabledProperty = exports.DeviceWifiRSSILockProperty = exports.DeviceWifiRSSIProperty = exports.DeviceAutoNightvisionProperty = exports.DeviceAntitheftDetectionProperty = exports.DeviceBatteryTempProperty = exports.DeviceBatteryLowSensorProperty = exports.DeviceBatteryLowKeypadProperty = exports.DeviceBatteryLowMotionSensorProperty = exports.DeviceBatteryProperty = exports.GenericDeviceProperties = exports.BaseDeviceProperties = exports.GenericTypeProperty = exports.GenericSWVersionProperty = exports.GenericHWVersionProperty = exports.DeviceSerialNumberProperty = exports.DeviceModelProperty = exports.DeviceNameProperty = exports.PropertyName = exports.SupportedFeatures = exports.SupportedFeature = exports.DeviceEvent = exports.StorageType = exports.AuthResult = exports.VerfyCodeTypes = exports.ResponseErrorCode = exports.GuardMode = exports.AlarmMode = exports.ParamType = exports.DeviceType = void 0;
exports.StationProperties = exports.StationMacAddressProperty = exports.StationLanIpAddressStandaloneProperty = exports.StationLanIpAddressProperty = exports.StationCurrentModeProperty = exports.StationGuardModeProperty = exports.BaseStationProperties = exports.StationSerialNumberProperty = exports.StationModelProperty = exports.StationNameProperty = exports.DeviceProperties = exports.DevicePictureUrlProperty = exports.DeviceLockStatusProperty = exports.DeviceMotionSensorPIREventProperty = exports.DeviceSensorChangeTimeProperty = exports.DeviceSensorOpenProperty = exports.DeviceRingingProperty = exports.DeviceCryingDetectedProperty = exports.DeviceSoundDetectedProperty = exports.DevicePetDetectedProperty = exports.DevicePersonDetectedProperty = exports.DeviceMotionDetectedProperty = exports.DeviceLockedProperty = exports.DeviceBatteryUsageLastWeekProperty = exports.DeviceLastChargingFalseEventsProperty = void 0;
const p2p_1 = require("../p2p");
var DeviceType;
(function (DeviceType) {
    //List retrieved from com.oceanwing.battery.cam.binder.model.QueryDeviceData
    DeviceType[DeviceType["BATTERY_DOORBELL"] = 7] = "BATTERY_DOORBELL";
    DeviceType[DeviceType["BATTERY_DOORBELL_2"] = 16] = "BATTERY_DOORBELL_2";
    DeviceType[DeviceType["CAMERA"] = 1] = "CAMERA";
    DeviceType[DeviceType["CAMERA2"] = 9] = "CAMERA2";
    DeviceType[DeviceType["CAMERA2C"] = 8] = "CAMERA2C";
    DeviceType[DeviceType["CAMERA2C_PRO"] = 15] = "CAMERA2C_PRO";
    DeviceType[DeviceType["CAMERA2_PRO"] = 14] = "CAMERA2_PRO";
    DeviceType[DeviceType["CAMERA_E"] = 4] = "CAMERA_E";
    DeviceType[DeviceType["DOORBELL"] = 5] = "DOORBELL";
    DeviceType[DeviceType["FLOODLIGHT"] = 3] = "FLOODLIGHT";
    DeviceType[DeviceType["INDOOR_CAMERA"] = 30] = "INDOOR_CAMERA";
    DeviceType[DeviceType["INDOOR_CAMERA_1080"] = 34] = "INDOOR_CAMERA_1080";
    DeviceType[DeviceType["INDOOR_PT_CAMERA"] = 31] = "INDOOR_PT_CAMERA";
    DeviceType[DeviceType["INDOOR_PT_CAMERA_1080"] = 35] = "INDOOR_PT_CAMERA_1080";
    DeviceType[DeviceType["KEYPAD"] = 11] = "KEYPAD";
    DeviceType[DeviceType["LOCK_ADVANCED"] = 51] = "LOCK_ADVANCED";
    DeviceType[DeviceType["LOCK_ADVANCED_NO_FINGER"] = 53] = "LOCK_ADVANCED_NO_FINGER";
    DeviceType[DeviceType["LOCK_BASIC"] = 50] = "LOCK_BASIC";
    DeviceType[DeviceType["LOCK_BASIC_NO_FINGER"] = 52] = "LOCK_BASIC_NO_FINGER";
    DeviceType[DeviceType["MOTION_SENSOR"] = 10] = "MOTION_SENSOR";
    DeviceType[DeviceType["SENSOR"] = 2] = "SENSOR";
    DeviceType[DeviceType["SOLO_CAMERA"] = 32] = "SOLO_CAMERA";
    DeviceType[DeviceType["SOLO_CAMERA_PRO"] = 33] = "SOLO_CAMERA_PRO";
    DeviceType[DeviceType["STATION"] = 0] = "STATION";
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
var DeviceEvent;
(function (DeviceEvent) {
    DeviceEvent[DeviceEvent["MotionDetected"] = 0] = "MotionDetected";
    DeviceEvent[DeviceEvent["PersonDetected"] = 1] = "PersonDetected";
    DeviceEvent[DeviceEvent["PetDetected"] = 2] = "PetDetected";
    DeviceEvent[DeviceEvent["SoundDetected"] = 3] = "SoundDetected";
    DeviceEvent[DeviceEvent["CryingDetected"] = 4] = "CryingDetected";
    DeviceEvent[DeviceEvent["Ringing"] = 5] = "Ringing";
})(DeviceEvent = exports.DeviceEvent || (exports.DeviceEvent = {}));
var SupportedFeature;
(function (SupportedFeature) {
    SupportedFeature[SupportedFeature["Battery"] = 1] = "Battery";
    SupportedFeature[SupportedFeature["MotionDetection"] = 2] = "MotionDetection";
    SupportedFeature[SupportedFeature["PersonDetection"] = 3] = "PersonDetection";
    SupportedFeature[SupportedFeature["SoundDetection"] = 4] = "SoundDetection";
    SupportedFeature[SupportedFeature["CryingDetection"] = 5] = "CryingDetection";
    SupportedFeature[SupportedFeature["PetDetection"] = 6] = "PetDetection";
    SupportedFeature[SupportedFeature["StatusLED"] = 7] = "StatusLED";
    SupportedFeature[SupportedFeature["AutoNightVision"] = 8] = "AutoNightVision";
    SupportedFeature[SupportedFeature["RTSP"] = 9] = "RTSP";
    SupportedFeature[SupportedFeature["AntiTheftDetection"] = 10] = "AntiTheftDetection";
    SupportedFeature[SupportedFeature["Watermarking"] = 11] = "Watermarking";
    SupportedFeature[SupportedFeature["Livestreaming"] = 12] = "Livestreaming";
    SupportedFeature[SupportedFeature["Locking"] = 13] = "Locking";
    SupportedFeature[SupportedFeature["QuickResponse"] = 14] = "QuickResponse";
    SupportedFeature[SupportedFeature["AudioRecording"] = 15] = "AudioRecording";
    SupportedFeature[SupportedFeature["Speaker"] = 16] = "Speaker";
    SupportedFeature[SupportedFeature["Ringing"] = 17] = "Ringing";
    SupportedFeature[SupportedFeature["LocalStorage"] = 18] = "LocalStorage";
    SupportedFeature[SupportedFeature["OpenClose"] = 19] = "OpenClose";
    SupportedFeature[SupportedFeature["RebootHUB"] = 20] = "RebootHUB";
})(SupportedFeature = exports.SupportedFeature || (exports.SupportedFeature = {}));
exports.SupportedFeatures = {
    [DeviceType.STATION]: [
        SupportedFeature.RebootHUB
    ],
    [DeviceType.BATTERY_DOORBELL]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.QuickResponse,
        SupportedFeature.AudioRecording,
        SupportedFeature.LocalStorage,
        SupportedFeature.Watermarking,
        SupportedFeature.Ringing,
    ],
    [DeviceType.BATTERY_DOORBELL_2]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.QuickResponse,
        SupportedFeature.AudioRecording,
        SupportedFeature.LocalStorage,
        SupportedFeature.Watermarking,
        SupportedFeature.Ringing,
    ],
    [DeviceType.DOORBELL]: [
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.QuickResponse,
        SupportedFeature.AudioRecording,
        SupportedFeature.LocalStorage,
        SupportedFeature.Watermarking,
        SupportedFeature.Ringing,
        SupportedFeature.RebootHUB,
    ],
    [DeviceType.CAMERA]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
    ],
    [DeviceType.CAMERA_E]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
    ],
    [DeviceType.CAMERA2]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
    ],
    [DeviceType.CAMERA2C]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
    ],
    [DeviceType.CAMERA2C_PRO]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
    ],
    [DeviceType.CAMERA2_PRO]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
    ],
    [DeviceType.FLOODLIGHT]: [
        SupportedFeature.MotionDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.RTSP,
        SupportedFeature.LocalStorage,
        SupportedFeature.RebootHUB,
    ],
    [DeviceType.INDOOR_CAMERA]: [
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.PetDetection,
        SupportedFeature.SoundDetection,
        SupportedFeature.CryingDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
        SupportedFeature.RebootHUB,
    ],
    [DeviceType.INDOOR_CAMERA_1080]: [
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.PetDetection,
        SupportedFeature.SoundDetection,
        SupportedFeature.CryingDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
        SupportedFeature.RebootHUB,
    ],
    [DeviceType.INDOOR_PT_CAMERA]: [
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.PetDetection,
        SupportedFeature.SoundDetection,
        SupportedFeature.CryingDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
        SupportedFeature.RebootHUB,
    ],
    [DeviceType.INDOOR_PT_CAMERA_1080]: [
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.PetDetection,
        SupportedFeature.SoundDetection,
        SupportedFeature.CryingDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
        SupportedFeature.RebootHUB,
    ],
    [DeviceType.KEYPAD]: [],
    [DeviceType.LOCK_ADVANCED]: [
        SupportedFeature.Locking,
    ],
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: [
        SupportedFeature.Locking,
    ],
    [DeviceType.LOCK_BASIC]: [
        SupportedFeature.Locking,
    ],
    [DeviceType.LOCK_BASIC_NO_FINGER]: [
        SupportedFeature.Locking,
    ],
    [DeviceType.MOTION_SENSOR]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
    ],
    [DeviceType.SENSOR]: [
        SupportedFeature.Battery,
        SupportedFeature.OpenClose,
    ],
    [DeviceType.SOLO_CAMERA]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
        SupportedFeature.LocalStorage,
    ],
    [DeviceType.SOLO_CAMERA_PRO]: [
        SupportedFeature.Battery,
        SupportedFeature.MotionDetection,
        SupportedFeature.PersonDetection,
        SupportedFeature.StatusLED,
        SupportedFeature.AutoNightVision,
        SupportedFeature.Livestreaming,
        SupportedFeature.AudioRecording,
        SupportedFeature.Watermarking,
        SupportedFeature.AntiTheftDetection,
        SupportedFeature.RTSP,
        SupportedFeature.Speaker,
        SupportedFeature.LocalStorage,
    ],
};
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
    PropertyName["DeviceLastChargingDays"] = "lastChargingDays";
    PropertyName["DeviceLastChargingTotalEvents"] = "lastChargingTotalEvents";
    PropertyName["DeviceLastChargingRecordedEvents"] = "lastChargingRecordedEvents";
    PropertyName["DeviceLastChargingFalseEvents"] = "lastChargingFalseEvents";
    PropertyName["DeviceBatteryUsageLastWeek"] = "batteryUsageLastWeek";
    PropertyName["DeviceWifiRSSI"] = "wifiRSSI";
    PropertyName["DeviceEnabled"] = "enabled";
    PropertyName["DeviceAntitheftDetection"] = "antitheftDetection";
    PropertyName["DeviceAutoNightvision"] = "autoNightvision";
    PropertyName["DeviceStatusLed"] = "statusLed";
    PropertyName["DeviceMotionDetection"] = "motionDetection";
    PropertyName["DeviceMotionDetected"] = "motionDetected";
    PropertyName["DevicePersonDetected"] = "personDetected";
    PropertyName["DevicePersonName"] = "personName";
    PropertyName["DeviceRTSPStream"] = "rtspStream";
    PropertyName["DeviceWatermark"] = "watermark";
    PropertyName["DevicePictureUrl"] = "pictureUrl";
    PropertyName["DeviceState"] = "state";
    PropertyName["DevicePetDetection"] = "petDetection";
    PropertyName["DevicePetDetected"] = "petDetected";
    PropertyName["DeviceSoundDetection"] = "soundDetection";
    PropertyName["DeviceSoundDetected"] = "soundDetected";
    PropertyName["DeviceCryingDetected"] = "cryingDetected";
    PropertyName["DeviceSensorOpen"] = "sensorOpen";
    PropertyName["DeviceSensorChangeTime"] = "sensorChangeTime";
    PropertyName["DeviceMotionSensorPIREvent"] = "motionSensorPIREvent";
    PropertyName["DeviceLocked"] = "locked";
    PropertyName["DeviceRinging"] = "ringing";
    PropertyName["DeviceLockStatus"] = "lockStatus";
    PropertyName["StationLANIpAddress"] = "lanIpAddress";
    PropertyName["StationMacAddress"] = "macAddress";
    PropertyName["StationGuardMode"] = "guardMode";
    PropertyName["StationCurrentMode"] = "currentMode";
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
        50: "Lock Basic",
        51: "Lock Advanced",
        52: "Lock Basic No Finger",
        53: "Lock Basic Advanced No Finger",
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
exports.DeviceBatteryLowMotionSensorProperty = {
    key: p2p_1.CommandType.CMD_MOTION_SENSOR_BAT_STATE,
    name: PropertyName.DeviceBatteryLow,
    label: "Battery low",
    readable: true,
    writeable: false,
    type: "boolean",
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
exports.DeviceWifiRSSIProperty = {
    key: p2p_1.CommandType.CMD_GET_WIFI_RSSI,
    name: PropertyName.DeviceWifiRSSI,
    label: "Wifi RSSI",
    readable: true,
    writeable: false,
    type: "number",
    unit: "dBm",
};
exports.DeviceWifiRSSILockProperty = Object.assign(Object.assign({}, exports.DeviceWifiRSSIProperty), { key: p2p_1.CommandType.CMD_GET_SUB1G_RSSI });
exports.DeviceEnabledProperty = {
    key: ParamType.PRIVATE_MODE,
    name: PropertyName.DeviceEnabled,
    label: "Camera enabled",
    readable: true,
    writeable: true,
    type: "boolean",
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
exports.DeviceStatusLedDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceStatusLedProperty), { key: ParamType.COMMAND_LED_NIGHT_OPEN });
exports.DeviceMotionDetectionProperty = {
    key: p2p_1.CommandType.CMD_PIR_SWITCH,
    name: PropertyName.DeviceMotionDetection,
    label: "Motion Detection",
    readable: true,
    writeable: true,
    type: "boolean",
};
exports.DeviceMotionDetectionIndoorSoloFloodProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionProperty), { key: p2p_1.CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE });
exports.DeviceMotionDetectionDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceMotionDetectionProperty), { key: ParamType.COMMAND_MOTION_DETECTION_PACKAGE });
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
exports.DeviceWatermarkProperty = {
    key: p2p_1.CommandType.CMD_SET_DEVS_OSD,
    name: PropertyName.DeviceWatermark,
    label: "Watermark",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "OFF",
        1: "TIMESTAMP",
        2: "TIMESTAMP_AND_LOGO",
    },
};
exports.DeviceWatermarkIndoorFloodProperty = Object.assign(Object.assign({}, exports.DeviceWatermarkProperty), { states: {
        0: "TIMESTAMP",
        1: "TIMESTAMP_AND_LOGO",
        2: "OFF",
    } });
exports.DeviceWatermarkSoloWiredDoorbellProperty = Object.assign(Object.assign({}, exports.DeviceWatermarkProperty), { states: {
        0: "OFF",
        1: "ON",
    } });
exports.DeviceWatermarkBatteryDoorbellCamera1Property = Object.assign(Object.assign({}, exports.DeviceWatermarkProperty), { states: {
        1: "OFF",
        2: "ON",
    } });
exports.DeviceStateProperty = {
    key: p2p_1.CommandType.CMD_GET_DEV_STATUS,
    name: PropertyName.DeviceState,
    label: "State",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        0: "OFFLINE",
        1: "ONLINE",
        2: "MANUALLY_DISABLED",
        3: "OFFLINE_LOWBAT",
        4: "REMOVE_AND_READD",
        5: "RESET_AND_READD",
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
};
exports.DeviceLastChargingTotalEventsProperty = {
    key: "charing_total",
    name: PropertyName.DeviceLastChargingTotalEvents,
    label: "Total Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
};
exports.DeviceLastChargingRecordedEventsProperty = {
    key: "charging_reserve",
    name: PropertyName.DeviceLastChargingRecordedEvents,
    label: "Total Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
};
exports.DeviceLastChargingFalseEventsProperty = {
    key: "charging_missing",
    name: PropertyName.DeviceLastChargingFalseEvents,
    label: "False Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
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
exports.DeviceLockStatusProperty = {
    key: p2p_1.CommandType.CMD_DOORLOCK_GET_STATE,
    name: PropertyName.DeviceMotionSensorPIREvent,
    label: "Lock status",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        1: "1",
        2: "2",
        3: "UNLOCKED",
        4: "LOCKED",
        5: "MECHANICAL_ANOMALY",
        6: "6",
        7: "7",
    }
};
exports.DevicePictureUrlProperty = {
    key: "cover_path",
    name: PropertyName.DevicePictureUrl,
    label: "Last Camera Picture URL",
    readable: true,
    writeable: false,
    type: "string",
};
exports.DeviceProperties = {
    [DeviceType.CAMERA2]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.CAMERA2C]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.CAMERA2C_PRO]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.CAMERA2_PRO]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.CAMERA_E]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.DOORBELL]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionDoorbellProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionDoorbellProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceRinging]: exports.DeviceRingingProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedDoorbellProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.BATTERY_DOORBELL]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedBatteryDoorbellProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceRinging]: exports.DeviceRingingProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.BATTERY_DOORBELL_2]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceBatteryTemp]: exports.DeviceBatteryTempProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSIProperty, [PropertyName.DeviceEnabled]: exports.DeviceEnabledProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedBatteryDoorbellProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkBatteryDoorbellCamera1Property, [PropertyName.DeviceState]: exports.DeviceStateProperty, [PropertyName.DeviceLastChargingDays]: exports.DeviceLastChargingDaysProperty, [PropertyName.DeviceLastChargingFalseEvents]: exports.DeviceLastChargingFalseEventsProperty, [PropertyName.DeviceLastChargingRecordedEvents]: exports.DeviceLastChargingRecordedEventsProperty, [PropertyName.DeviceLastChargingTotalEvents]: exports.DeviceLastChargingTotalEventsProperty, [PropertyName.DeviceBatteryUsageLastWeek]: exports.DeviceBatteryUsageLastWeekProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceRinging]: exports.DeviceRingingProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.FLOODLIGHT]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.INDOOR_CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.INDOOR_CAMERA_1080]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.INDOOR_PT_CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.INDOOR_PT_CAMERA_1080]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceSoundDetection]: exports.DeviceSoundDetectionProperty, [PropertyName.DevicePetDetection]: exports.DevicePetDetectionProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkIndoorFloodProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DevicePetDetected]: exports.DevicePetDetectedProperty, [PropertyName.DeviceSoundDetected]: exports.DeviceSoundDetectedProperty, [PropertyName.DeviceCryingDetected]: exports.DeviceCryingDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.SOLO_CAMERA]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.SOLO_CAMERA_PRO]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceEnabled]: exports.DeviceEnabledStandaloneProperty, [PropertyName.DeviceAutoNightvision]: exports.DeviceAutoNightvisionProperty, [PropertyName.DeviceMotionDetection]: exports.DeviceMotionDetectionIndoorSoloFloodProperty, [PropertyName.DeviceRTSPStream]: exports.DeviceRTSPStreamProperty, [PropertyName.DeviceAntitheftDetection]: exports.DeviceAntitheftDetectionProperty, [PropertyName.DeviceWatermark]: exports.DeviceWatermarkSoloWiredDoorbellProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DevicePersonDetected]: exports.DevicePersonDetectedProperty, [PropertyName.DeviceStatusLed]: exports.DeviceStatusLedIndoorSoloFloodProperty, [PropertyName.DevicePictureUrl]: exports.DevicePictureUrlProperty }),
    [DeviceType.KEYPAD]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBatteryLow]: exports.DeviceBatteryLowKeypadProperty, [PropertyName.DeviceState]: exports.DeviceStateProperty }),
    [DeviceType.LOCK_ADVANCED]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceState]: exports.DeviceStateLockProperty, [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSILockProperty, [PropertyName.DeviceLocked]: exports.DeviceLockedProperty, [PropertyName.DeviceLockStatus]: exports.DeviceLockStatusProperty }),
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceState]: exports.DeviceStateLockProperty, [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSILockProperty, [PropertyName.DeviceLocked]: exports.DeviceLockedProperty, [PropertyName.DeviceLockStatus]: exports.DeviceLockStatusProperty }),
    [DeviceType.LOCK_BASIC]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceState]: exports.DeviceStateLockProperty, [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSILockProperty, [PropertyName.DeviceLocked]: exports.DeviceLockedProperty, [PropertyName.DeviceLockStatus]: exports.DeviceLockStatusProperty }),
    [DeviceType.LOCK_BASIC_NO_FINGER]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceState]: exports.DeviceStateLockProperty, [PropertyName.DeviceBattery]: exports.DeviceBatteryProperty, [PropertyName.DeviceWifiRSSI]: exports.DeviceWifiRSSILockProperty, [PropertyName.DeviceLocked]: exports.DeviceLockedProperty, [PropertyName.DeviceLockStatus]: exports.DeviceLockStatusProperty }),
    [DeviceType.MOTION_SENSOR]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceBatteryLow]: exports.DeviceBatteryLowMotionSensorProperty, [PropertyName.DeviceMotionDetected]: exports.DeviceMotionDetectedProperty, [PropertyName.DeviceMotionSensorPIREvent]: exports.DeviceMotionSensorPIREventProperty }),
    [DeviceType.SENSOR]: Object.assign(Object.assign({}, exports.GenericDeviceProperties), { [PropertyName.DeviceSensorOpen]: exports.DeviceSensorOpenProperty, [PropertyName.DeviceBatteryLow]: exports.DeviceBatteryLowSensorProperty, [PropertyName.DeviceSensorChangeTime]: exports.DeviceSensorChangeTimeProperty }),
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
        0: "AWAY",
        1: "HOME",
        2: "SCHEDULE",
        3: "CUSTOM1",
        4: "CUSTOM2",
        5: "CUSTOM3",
        6: "OFF",
        47: "GEO",
        63: "DISARMED",
    },
};
exports.StationCurrentModeProperty = {
    key: p2p_1.CommandType.CMD_GET_ALARM_MODE,
    name: PropertyName.StationCurrentMode,
    label: "Current Mode",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        0: "AWAY",
        1: "HOME",
        63: "DISARMED",
    },
};
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
exports.StationProperties = {
    [DeviceType.STATION]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_CAMERA]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_CAMERA_1080]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_PT_CAMERA]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.INDOOR_PT_CAMERA_1080]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.DOORBELL]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.SOLO_CAMERA]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.SOLO_CAMERA_PRO]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
    [DeviceType.FLOODLIGHT]: Object.assign(Object.assign({}, exports.BaseStationProperties), { [PropertyName.StationLANIpAddress]: exports.StationLanIpAddressStandaloneProperty, [PropertyName.StationMacAddress]: exports.StationMacAddressProperty, [PropertyName.StationGuardMode]: exports.StationGuardModeProperty, [PropertyName.StationCurrentMode]: exports.StationCurrentModeProperty }),
};
