import { Commands } from ".";
import { CommandType } from "../p2p";
import { IndexedProperty, Properties, PropertyMetadataBoolean, PropertyMetadataNumeric, PropertyMetadataString } from "./interfaces";

export enum DeviceType {
    //List retrieved from com.oceanwing.battery.cam.binder.model.QueryDeviceData
    STATION = 0,
    CAMERA = 1,
    SENSOR = 2,
    FLOODLIGHT = 3,
    CAMERA_E = 4,
    DOORBELL = 5,
    BATTERY_DOORBELL = 7,
    CAMERA2C = 8,
    CAMERA2 = 9,
    MOTION_SENSOR = 10,
    KEYPAD = 11,
    CAMERA2_PRO = 14,
    CAMERA2C_PRO = 15,
    BATTERY_DOORBELL_2 = 16,
    INDOOR_CAMERA = 30,
    INDOOR_PT_CAMERA = 31,
    SOLO_CAMERA = 32,
    SOLO_CAMERA_PRO = 33,
    INDOOR_CAMERA_1080 = 34,
    INDOOR_PT_CAMERA_1080 = 35,
    FLOODLIGHT_CAMERA_8422 = 37,
    FLOODLIGHT_CAMERA_8423 = 38,
    FLOODLIGHT_CAMERA_8424 = 39,
    INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT = 44,
    INDOOR_OUTDOOR_CAMERA_2K = 45,
    INDOOR_OUTDOOR_CAMERA_1080P = 46,
    LOCK_BASIC = 50,
    LOCK_ADVANCED = 51,
    LOCK_BASIC_NO_FINGER = 52,
    LOCK_ADVANCED_NO_FINGER = 53,
    SOLO_CAMERA_SPOTLIGHT_1080 = 60,
    SOLO_CAMERA_SPOTLIGHT_2K = 61,
    SOLO_CAMERA_SPOTLIGHT_SOLAR = 62,
}

export enum ParamType {
    //List retrieved from com.oceanwing.battery.cam.binder.model.CameraParams
    CHIME_STATE = 2015,
    DETECT_EXPOSURE = 2023,
    DETECT_MODE = 2004,
    DETECT_MOTION_SENSITIVE = 2005,
    DETECT_SCENARIO = 2028,
    DETECT_SWITCH = 2027,
    DETECT_ZONE = 2006,
    DOORBELL_AUDIO_RECODE = 2042,
    DOORBELL_BRIGHTNESS = 2032,
    DOORBELL_DISTORTION = 2033,
    DOORBELL_HDR = 2029,
    DOORBELL_IR_MODE = 2030,
    DOORBELL_LED_NIGHT_MODE = 2039,
    DOORBELL_MOTION_ADVANCE_OPTION = 2041,
    DOORBELL_MOTION_NOTIFICATION = 2035,
    DOORBELL_NOTIFICATION_JUMP_MODE = 2038,
    DOORBELL_NOTIFICATION_OPEN = 2036,
    DOORBELL_RECORD_QUALITY = 2034,
    DOORBELL_RING_RECORD = 2040,
    DOORBELL_SNOOZE_START_TIME = 2037,
    DOORBELL_VIDEO_QUALITY = 2031,
    NIGHT_VISUAL = 2002,
    OPEN_DEVICE = 2001,
    RINGING_VOLUME = 2022,
    SDCARD = 2010,
    UN_DETECT_ZONE = 2007,
    VOLUME = 2003,

    COMMAND_LED_NIGHT_OPEN = 1026,
    COMMAND_MOTION_DETECTION_PACKAGE = 1016,

    // Inferred from source
    SNOOZE_MODE = 1271,                         // The value is base64 encoded
    WATERMARK_MODE = 1214,                      // 1 - hide, 2 - show
    DEVICE_UPGRADE_NOW = 1134,
    CAMERA_UPGRADE_NOW = 1133,
    DEFAULT_SCHEDULE_MODE = 1257,               // 0 - Away, 1 - Home, 63 - Disarmed
    GUARD_MODE = 1224,                          // 0 - Away, 1 - Home, 63 - Disarmed, 2 - Schedule

    FLOODLIGHT_MANUAL_SWITCH = 1400,
    FLOODLIGHT_MANUAL_BRIGHTNESS = 1401,        // The range is 22-100
    FLOODLIGHT_MOTION_BRIGHTNESS = 1412,        // The range is 22-100
    FLOODLIGHT_SCHEDULE_BRIGHTNESS = 1413,      // The range is 22-100
    FLOODLIGHT_MOTION_SENSITIVTY = 1272,        // The range is 1-5

    CAMERA_SPEAKER_VOLUME = 1230,
    CAMERA_RECORD_ENABLE_AUDIO = 1366,          // Enable microphone
    CAMERA_RECORD_RETRIGGER_INTERVAL = 1250,    // In seconds
    CAMERA_RECORD_CLIP_LENGTH = 1249,           // In seconds

    CAMERA_IR_CUT = 1013,
    CAMERA_PIR = 1011,
    CAMERA_WIFI_RSSI = 1142,

    CAMERA_MOTION_ZONES = 1204,

    // Set only params?
    PUSH_MSG_MODE = 1252,                       // 0 to ???

    PRIVATE_MODE = 99904,
    CUSTOM_RTSP_URL = 999991
}

export enum AlarmMode {
    AWAY = 0,
    HOME = 1,
    CUSTOM1 = 3,
    CUSTOM2 = 4,
    CUSTOM3 = 5,
    DISARMED = 63
}

export enum GuardMode {
    UNKNOWN = -1,
    AWAY = 0,
    HOME = 1,
    DISARMED = 63,
    SCHEDULE = 2,
    GEO = 47,
    CUSTOM1 = 3,
    CUSTOM2 = 4,
    CUSTOM3 = 5,
    OFF = 6
}

export enum ResponseErrorCode {
    CODE_CONNECT_ERROR = 997,
    CODE_ERROR_PIN = 36006,
    CODE_MULTI_ALARM = 36002,
    CODE_NEED_VERIFY_CODE = 26052,
    CODE_NETWORK_ERROR = 998,
    CODE_PHONE_NONE_SUPPORT = 26058,
    CODE_SERVER_ERROR = 999,
    CODE_VERIFY_CODE_ERROR = 26050,
    CODE_VERIFY_CODE_EXPIRED = 26051,
    CODE_VERIFY_CODE_MAX = 26053,
    CODE_VERIFY_CODE_NONE_MATCH = 26054,
    CODE_VERIFY_PASSWORD_ERROR = 26055,
    CODE_WHATEVER_ERROR = 0,
    CODE_MAX_FORGET_PASSWORD_ERROR = 100035,
    CODE_MAX_LOGIN_LIMIT = 100028,
    CODE_MAX_REGISTER_ERROR = 100034,
    EMAIL_NOT_REGISTERED_ERROR = 22008,
    LOGIN_CAPTCHA_ERROR = 100033,
    LOGIN_DECRYPTION_FAIL = 100030,
    LOGIN_ENCRYPTION_FAIL = 100029,
    LOGIN_INVALID_TOUCH_ID = 26047,
    LOGIN_NEED_CAPTCHA = 100032,
    MULTIPLE_EMAIL_PASSWORD_ERROR = 26006,
    MULTIPLE_INACTIVATED_ERROR = 26015,
    MULTIPLE_REGISTRATION_ERROR = 26000,
    RESP_ERROR_CODE_SESSION_TIMEOUT = 401
}

export enum VerfyCodeTypes {
    TYPE_SMS = 0,
    TYPE_PUSH = 1,
    TYPE_EMAIL = 2
}

export enum AuthResult {
    ERROR = -1,
    OK = 0,
    RENEW = 2,
    SEND_VERIFY_CODE = 3
}

export enum StorageType {
    NONE = 0,
    LOCAL = 1,
    CLOUD = 2,
    LOCAL_AND_CLOUD = 3
}

export enum PowerSource {
    BATTERY = 0,
    SOLAR_PANEL = 1
}

export enum PublicKeyType {
    SERVER = 1,
    LOCK = 2
}

export enum FloodlightMotionTriggeredDistance {
    MIN = 66,
    LOW = 76,
    MEDIUM = 86,
    HIGH = 91,
    MAX = 96
}

export enum NotificationType {
    MOST_EFFICIENT = 1,
    INCLUDE_THUMBNAIL = 2,
    FULL_EFFECT = 3,
}

export enum AlarmTone {
    ALARM_TONE1 = 1,
    ALARM_TONE2 = 2,
}

export enum NotificationSwitchMode {
    APP = 16,
    GEOFENCE = 32,
    SCHEDULE = 64,
    KEYPAD = 128,
}

export enum TimeFormat {
    FORMAT_12H = 0,
    FORMAT_24H = 1,
}

export interface EventFilterType {
    deviceSN?: string;
    stationSN?: string;
    storageType?: StorageType;
}

export enum DeviceEvent {
    MotionDetected,
    PersonDetected,
    PetDetected,
    SoundDetected,
    CryingDetected,
    Ringing
}

export enum PropertyName {
    Name = "name",
    Model = "model",
    SerialNumber = "serialNumber",
    HardwareVersion = "hardwareVersion",
    SoftwareVersion = "softwareVersion",
    Type = "type",
    DeviceStationSN = "stationSerialNumber",
    DeviceBattery = "battery",
    DeviceBatteryTemp = "batteryTemperature",
    DeviceBatteryLow = "batteryLow",
    DeviceLastChargingDays = "lastChargingDays",
    DeviceLastChargingTotalEvents = "lastChargingTotalEvents",
    DeviceLastChargingRecordedEvents = "lastChargingRecordedEvents",
    DeviceLastChargingFalseEvents = "lastChargingFalseEvents",
    DeviceBatteryUsageLastWeek = "batteryUsageLastWeek",
    DeviceWifiRSSI = "wifiRSSI",
    DeviceEnabled = "enabled",
    DeviceAntitheftDetection= "antitheftDetection",
    DeviceAutoNightvision = "autoNightvision",
    DeviceStatusLed = "statusLed",
    DeviceMotionDetection = "motionDetection",
    DeviceMotionDetectionType = "motionDetectionType",
    DeviceMotionDetectionSensivity = "motionDetectionSensivity",
    DeviceMotionDetected = "motionDetected",
    DeviceMotionTracking = "motionTracking",
    DevicePersonDetected = "personDetected",
    DevicePersonName = "personName",
    DeviceRTSPStream = "rtspStream",
    DeviceWatermark = "watermark",
    DevicePictureUrl = "pictureUrl",
    DeviceState = "state",
    DevicePetDetection = "petDetection",
    DevicePetDetected = "petDetected",
    DeviceSoundDetection = "soundDetection",
    DeviceSoundDetectionType = "soundDetectionType",
    DeviceSoundDetectionSensivity = "soundDetectionSensivity",
    DeviceSoundDetected = "soundDetected",
    DeviceCryingDetected = "cryingDetected",
    DeviceSensorOpen = "sensorOpen",
    DeviceSensorChangeTime = "sensorChangeTime",
    DeviceMotionSensorPIREvent = "motionSensorPIREvent",
    DeviceLocked = "locked",
    DeviceRinging = "ringing",
    DeviceLockStatus = "lockStatus",
    DeviceLight = "light",
    DeviceMicrophone = "microphone",
    DeviceSpeaker = "speaker",
    DeviceSpeakerVolume = "speakerVolume",
    DeviceRingtoneVolume = "ringtoneVolume",
    DeviceAudioRecording = "audioRecording",
    DevicePowerSource = "powerSource",
    DevicePowerWorkingMode = "powerWorkingMode",
    DeviceRecordingEndClipMotionStops = "recordingEndClipMotionStops",
    DeviceRecordingClipLength = "recordingClipLength",
    DeviceRecordingRetriggerInterval = "recordingRetriggerInterval",
    DeviceVideoStreamingQuality = "videoStreamingQuality",
    DeviceVideoRecordingQuality = "videoRecordingQuality",
    DeviceVideoWDR = "videoWDR",
    DeviceLightSettingsEnable = "lightSettingsEnable",
    DeviceLightSettingsBrightnessManual = "lightSettingsBrightnessManual",
    DeviceLightSettingsBrightnessMotion = "lightSettingsBrightnessMotion",
    DeviceLightSettingsBrightnessSchedule = "lightSettingsBrightnessSchedule",
    DeviceLightSettingsMotionTriggered = "lightSettingsMotionTriggered",
    DeviceLightSettingsMotionTriggeredDistance = "lightSettingsMotionTriggeredDistance",
    DeviceLightSettingsMotionTriggeredTimer = "lightSettingsMotionTriggeredTimer",
    //DeviceLightSettingsSunsetToSunrise = "lightSettingsSunsetToSunrise",
    //DeviceVideoEncodingFormat = "videoEncodingFormat", //BatteryDoorbell - included in Streaming Quality
    DeviceChimeIndoor = "chimeIndoor",  //BatteryDoorbell
    DeviceChimeHomebase = "chimeHomebase",  //BatteryDoorbell
    DeviceChimeHomebaseRingtoneVolume = "chimeHomebaseRingtoneVolume",  //BatteryDoorbell
    DeviceChimeHomebaseRingtoneType = "chimeHomebaseRingtoneType",  //BatteryDoorbell
    DeviceNotificationType = "notificationType",
    DeviceRotationSpeed = "rotationSpeed",
    DeviceNotificationPerson = "notificationPerson",  //Indoor
    DeviceNotificationPet = "notificationPet",  //Indoor
    DeviceNotificationAllOtherMotion = "notificationAllOtherMotion",  //Indoor
    DeviceNotificationCrying = "notificationCrying",  //Indoor
    DeviceNotificationAllSound = "notificationAllSound",  //Indoor
    DeviceNotificationIntervalTime = "notificationIntervalTime",  //Indoor
    DeviceNotificationRing = "notificationRing",  //BatteryDoorbell
    DeviceNotificationMotion = "notificationMotion",  //BatteryDoorbell
    //DeviceContinuosRecording = "continousRecording",

    StationLANIpAddress = "lanIpAddress",
    StationMacAddress = "macAddress",
    StationGuardMode = "guardMode",
    StationCurrentMode = "currentMode",
    StationTimeFormat = "timeFormat",
    //StationTimezone = "timezone",
    StationAlarmVolume = "alarmVolume",
    StationAlarmTone = "alarmTone",
    StationPromptVolume = "promptVolume",
    StationNotificationSwitchModeSchedule = "notificationSwitchModeSchedule",
    StationNotificationSwitchModeGeofence = "notificationSwitchModeGeofence",
    StationNotificationSwitchModeApp = "notificationSwitchModeApp",
    StationNotificationSwitchModeKeypad = "notificationSwitchModeKeypad",
    StationNotificationStartAlarmDelay = "notificationStartAlarmDelay",
}

export const DeviceNameProperty: PropertyMetadataString = {
    key: "device_name",
    name: PropertyName.Name,
    label: "Name",
    readable: true,
    writeable: false,
    type: "string",
}

export const DeviceModelProperty: PropertyMetadataString = {
    key: "device_model",
    name: PropertyName.Model,
    label: "Model",
    readable: true,
    writeable: false,
    type: "string",
}

export const DeviceSerialNumberProperty: PropertyMetadataString = {
    key: "device_sn",
    name: PropertyName.SerialNumber,
    label: "Serial number",
    readable: true,
    writeable: false,
    type: "string",
}

export const GenericHWVersionProperty: PropertyMetadataString = {
    key: "main_hw_version",
    name: PropertyName.HardwareVersion,
    label: "Hardware version",
    readable: true,
    writeable: false,
    type: "string",
}

export const GenericSWVersionProperty: PropertyMetadataString = {
    key: "main_sw_version",
    name: PropertyName.SoftwareVersion,
    label: "Software version",
    readable: true,
    writeable: false,
    type: "string",
}

export const GenericTypeProperty: PropertyMetadataNumeric = {
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
}

export const BaseDeviceProperties: IndexedProperty = {
    [DeviceNameProperty.name]: DeviceNameProperty,
    [DeviceModelProperty.name]: DeviceModelProperty,
    [DeviceSerialNumberProperty.name]: DeviceSerialNumberProperty,
    [GenericTypeProperty.name]: GenericTypeProperty,
    [GenericHWVersionProperty.name]: GenericHWVersionProperty,
    [GenericSWVersionProperty.name]: GenericSWVersionProperty,
}

export const GenericDeviceProperties: IndexedProperty = {
    ...BaseDeviceProperties,
    [PropertyName.DeviceStationSN]: {
        key: "station_sn",
        name: "stationSerialNumber",
        label: "Station serial number",
        readable: true,
        writeable: false,
        type: "string",
    },
}

export const DeviceBatteryProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_GET_BATTERY,
    name: PropertyName.DeviceBattery,
    label: "Battery percentage",
    readable: true,
    writeable: false,
    type: "number",
    unit: "%",
    min: 0,
    max: 100,
}

export const DeviceBatteryLockProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SMARTLOCK_QUERY_BATTERY_LEVEL,
    name: PropertyName.DeviceBattery,
    label: "Battery percentage",
    readable: true,
    writeable: false,
    type: "number",
    unit: "%",
    min: 0,
    max: 100,
}

export const DeviceBatteryLowMotionSensorProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_MOTION_SENSOR_BAT_STATE,
    name: PropertyName.DeviceBatteryLow,
    label: "Battery low",
    readable: true,
    writeable: false,
    type: "boolean",
    default: false,
}

export const DeviceBatteryLowKeypadProperty: PropertyMetadataBoolean = {
    ...DeviceBatteryLowMotionSensorProperty,
    key: CommandType.CMD_KEYPAD_BATTERY_CAP_STATE,
};

export const DeviceBatteryLowSensorProperty: PropertyMetadataBoolean = {
    ...DeviceBatteryLowMotionSensorProperty,
    key: CommandType.CMD_ENTRY_SENSOR_BAT_STATE,
};

export const DeviceBatteryTempProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_GET_BATTERY_TEMP,
    name: PropertyName.DeviceBatteryTemp,
    label: "Battery Temperature",
    readable: true,
    writeable: false,
    type: "number",
    unit: "°C",
}

export const DeviceAntitheftDetectionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_EAS_SWITCH,
    name: PropertyName.DeviceAntitheftDetection,
    label: "Antitheft Detection",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceAutoNightvisionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_IRCUT_SWITCH,
    name: PropertyName.DeviceAutoNightvision,
    label: "Auto Nightvision",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceWifiRSSIProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_GET_WIFI_RSSI,
    name: PropertyName.DeviceWifiRSSI,
    label: "Wifi RSSI",
    readable: true,
    writeable: false,
    type: "number",
    unit: "dBm",
}

export const DeviceWifiRSSILockProperty: PropertyMetadataNumeric = {
    ...DeviceWifiRSSIProperty,
    key: CommandType.CMD_GET_SUB1G_RSSI,
};

export const DeviceEnabledProperty: PropertyMetadataBoolean = {
    key: ParamType.PRIVATE_MODE,
    name: PropertyName.DeviceEnabled,
    label: "Camera enabled",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceEnabledStandaloneProperty: PropertyMetadataBoolean = {
    ...DeviceEnabledProperty,
    key: ParamType.OPEN_DEVICE,
};

export const DeviceStatusLedProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_DEV_LED_SWITCH,
    name: PropertyName.DeviceStatusLed,
    label: "Status LED",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceStatusLedIndoorSoloFloodProperty: PropertyMetadataBoolean = {
    ...DeviceStatusLedProperty,
    key: CommandType.CMD_INDOOR_LED_SWITCH,
};

export const DeviceStatusLedBatteryDoorbellProperty: PropertyMetadataBoolean = {
    ...DeviceStatusLedProperty,
    key: CommandType.CMD_BAT_DOORBELL_SET_LED_ENABLE,
};

export const DeviceStatusLedDoorbellProperty: PropertyMetadataBoolean = {
    ...DeviceStatusLedProperty,
    key: ParamType.COMMAND_LED_NIGHT_OPEN,
};

export const DeviceMotionDetectionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_PIR_SWITCH,
    name: PropertyName.DeviceMotionDetection,
    label: "Motion Detection",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceMotionDetectionIndoorSoloFloodProperty: PropertyMetadataBoolean = {
    ...DeviceMotionDetectionProperty,
    key: CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE,
};

export const DeviceMotionDetectionDoorbellProperty: PropertyMetadataBoolean = {
    ...DeviceMotionDetectionProperty,
    key: ParamType.COMMAND_MOTION_DETECTION_PACKAGE,
};

export const DeviceSoundDetectionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_ENABLE,
    name: PropertyName.DeviceSoundDetection,
    label: "Sound Detection",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DevicePetDetectionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_DET_SET_PET_ENABLE,
    name: PropertyName.DevicePetDetection,
    label: "Pet Detection",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceRTSPStreamProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_NAS_SWITCH,
    name: PropertyName.DeviceRTSPStream,
    label: "RTSP Stream",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceWatermarkProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_DEVS_OSD,
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
}

export const DeviceWatermarkIndoorFloodProperty: PropertyMetadataNumeric = {
    ...DeviceWatermarkProperty,
    states: {
        0: "TIMESTAMP",
        1: "TIMESTAMP_AND_LOGO",
        2: "OFF",
    },
};

export const DeviceWatermarkSoloWiredDoorbellProperty: PropertyMetadataNumeric = {
    ...DeviceWatermarkProperty,
    states: {
        0: "OFF",
        1: "ON",
    },
};

export const DeviceWatermarkBatteryDoorbellCamera1Property: PropertyMetadataNumeric = {
    ...DeviceWatermarkProperty,
    states: {
        1: "OFF",
        2: "ON",
    },
};

export const DeviceStateProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_GET_DEV_STATUS,
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
}

export const DeviceStateLockProperty: PropertyMetadataNumeric = {
    ...DeviceStateProperty,
    key: CommandType.CMD_GET_DEV_STATUS,
};

export const DeviceLastChargingDaysProperty: PropertyMetadataNumeric = {
    key: "charging_days",
    name: PropertyName.DeviceLastChargingDays,
    label: "Days since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
}

export const DeviceLastChargingTotalEventsProperty: PropertyMetadataNumeric = {
    key: "charing_total",
    name: PropertyName.DeviceLastChargingTotalEvents,
    label: "Total Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
}

export const DeviceLastChargingRecordedEventsProperty: PropertyMetadataNumeric = {
    key: "charging_reserve",
    name: PropertyName.DeviceLastChargingRecordedEvents,
    label: "Total Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
}

export const DeviceLastChargingFalseEventsProperty: PropertyMetadataNumeric = {
    key: "charging_missing",
    name: PropertyName.DeviceLastChargingFalseEvents,
    label: "False Events since last charging",
    readable: true,
    writeable: false,
    type: "number",
    default: 0,
}

export const DeviceBatteryUsageLastWeekProperty: PropertyMetadataNumeric = {
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
}

export const DeviceLockedProperty: PropertyMetadataBoolean = {
    key: "custom_locked",
    name: PropertyName.DeviceLocked,
    label: "locked",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceMotionDetectedProperty: PropertyMetadataBoolean = {
    key: "custom_motionDetected",
    name: PropertyName.DeviceMotionDetected,
    label: "Motion detected",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DevicePersonDetectedProperty: PropertyMetadataBoolean = {
    key: "custom_personDetected",
    name: PropertyName.DevicePersonDetected,
    label: "Person detected",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DevicePetDetectedProperty: PropertyMetadataBoolean = {
    key: "custom_petDetected",
    name: PropertyName.DevicePetDetected,
    label: "Pet detected",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DeviceSoundDetectedProperty: PropertyMetadataBoolean = {
    key: "custom_soundDetected",
    name: PropertyName.DeviceSoundDetected,
    label: "Sound detected",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DeviceCryingDetectedProperty: PropertyMetadataBoolean = {
    key: "custom_cryingDetected",
    name: PropertyName.DeviceCryingDetected,
    label: "Crying detected",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DeviceRingingProperty: PropertyMetadataBoolean = {
    key: "custom_ringing",
    name: PropertyName.DeviceRinging,
    label: "Ringing",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DeviceSensorOpenProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_ENTRY_SENSOR_STATUS,
    name: PropertyName.DeviceSensorOpen,
    label: "Sensor open",
    readable: true,
    writeable: false,
    type: "boolean",
}

export const DeviceSensorChangeTimeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_ENTRY_SENSOR_CHANGE_TIME,
    name: PropertyName.DeviceSensorChangeTime,
    label: "Sensor change time",
    readable: true,
    writeable: false,
    type: "number",
}

export const DeviceMotionSensorPIREventProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_MOTION_SENSOR_PIR_EVT,
    name: PropertyName.DeviceMotionSensorPIREvent,
    label: "Motion sensor PIR event",
    readable: true,
    writeable: false,
    type: "number",
    //TODO: Define states
}

export const DeviceBasicLockStatusProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_DOORLOCK_GET_STATE,
    name: PropertyName.DeviceLockStatus,
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
}

export const DeviceAdvancedLockStatusProperty: PropertyMetadataNumeric = {
    ...DeviceBasicLockStatusProperty,
    key: CommandType.CMD_SMARTLOCK_QUERY_STATUS,
}

export const DevicePictureUrlProperty: PropertyMetadataString = {
    key: "cover_path",
    name: PropertyName.DevicePictureUrl,
    label: "Last Camera Picture URL",
    readable: true,
    writeable: false,
    type: "string",
}

export const DeviceMotionDetectionTypeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_DEV_PUSHMSG_MODE,
    name: PropertyName.DeviceMotionDetectionType,
    label: "Motion Detection Type",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Humans only",
        2: "All motions",
    },
}

export const DeviceMotionDetectionTypeFloodlightProperty: PropertyMetadataNumeric = {
    ...DeviceMotionDetectionTypeProperty,
    key: CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_TYPE,
    states: {
        1: "Humans only",
        5: "All motions",
    },
}

export const DeviceMotionDetectionTypeIndoorProperty: PropertyMetadataNumeric = {
    ...DeviceMotionDetectionTypeProperty,
    key: CommandType.CMD_INDOOR_DET_SET_MOTION_DETECT_TYPE,
    states: {
        1: "Person",
        2: "Pet",
        3: "Person and Pet",
        4: "All other motions",
        5: "Person and all other motions",
        6: "Pet and all other motions",
        7: "Person, Pet and all other motions",
    },
}

export const DeviceMotionDetectionSensivityCamera2Property: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_PIRSENSITIVITY,
    name: PropertyName.DeviceMotionDetectionSensivity,
    label: "Motion Detection Sensivity",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 7,
}

export const DeviceMotionDetectionSensivityIndoorProperty: PropertyMetadataNumeric = {
    ...DeviceMotionDetectionSensivityCamera2Property,
    key: CommandType.CMD_INDOOR_DET_SET_MOTION_SENSITIVITY_IDX,
    min: 1,
    max: 5,
}

export const DeviceFloodlightLightProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_SET_FLOODLIGHT_MANUAL_SWITCH,
    name: PropertyName.DeviceLight,
    label: "Light",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceFloodlightLightSettingsEnableProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_SET_FLOODLIGHT_TOTAL_SWITCH,
    name: PropertyName.DeviceLightSettingsEnable,
    label: "Light Enable",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceFloodlightLightSettingsBrightnessManualProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_FLOODLIGHT_BRIGHT_VALUE,
    name: PropertyName.DeviceLightSettingsBrightnessManual,
    label: "Light Brightness Manual",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
}

export const DeviceFloodlightLightSettingsBrightnessMotionProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_PIR,
    name: PropertyName.DeviceLightSettingsBrightnessMotion,
    label: "Light Brightness Motion",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
}

export const DeviceFloodlightLightSettingsBrightnessScheduleProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_LIGHT_CTRL_BRIGHT_SCH,
    name: PropertyName.DeviceLightSettingsBrightnessSchedule,
    label: "Light Brightness Schedule",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
}

export const DeviceFloodlightLightSettingsMotionTriggeredProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_SET_LIGHT_CTRL_PIR_SWITCH,
    name: PropertyName.DeviceLightSettingsMotionTriggered,
    label: "Light Motion Triggered Enable",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_PIRSENSITIVITY,
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
}

export const DeviceFloodlightLightSettingsMotionTriggeredTimerProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_LIGHT_CTRL_PIR_TIME,
    name: PropertyName.DeviceLightSettingsMotionTriggeredTimer,
    label: "Light Motion Triggered Timer",
    readable: true,
    writeable: true,
    type: "number",
    unit: "sec",
}

export const DeviceMicrophoneProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_SET_DEV_MIC_MUTE,
    name: PropertyName.DeviceMicrophone,
    label: "Microphone",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceSpeakerProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_SET_DEV_SPEAKER_MUTE,
    name: PropertyName.DeviceSpeaker,
    label: "Speaker",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceAudioRecordingProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_SET_AUDIO_MUTE_RECORD,
    name: PropertyName.DeviceAudioRecording,
    label: "Audio Recording",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceAudioRecordingIndoorFloodlightProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_SET_RECORD_AUDIO_ENABLE,
    name: PropertyName.DeviceAudioRecording,
    label: "Audio Recording",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceMotionTrackingProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_PAN_MOTION_TRACK,
    name: PropertyName.DeviceMotionTracking,
    label: "Motion Tracking",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceSpeakerVolumeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_DEV_SPEAKER_VOLUME,
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
}

export const DeviceSpeakerVolumeIndoorFloodDoorbellProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_DEV_SPEAKER_VOLUME,
    name: PropertyName.DeviceSpeakerVolume,
    label: "Speaker Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
}

export const DeviceRingtoneVolumeBatteryDoorbellProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_BAT_DOORBELL_SET_RINGTONE_VOLUME,
    name: PropertyName.DeviceRingtoneVolume,
    label: "Ringtone Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 100,
}

export const DevicePowerSourceProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_POWER_CHARGE,
    name: PropertyName.DevicePowerSource,
    label: "Speaker Volume",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "Battery",
        1: "Solar Panel",
    },
}

export const DevicePowerWorkingModeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_PIR_POWERMODE,
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
}

export const DevicePowerWorkingModeBatteryDoorbellProperty: PropertyMetadataNumeric = {
    ...DevicePowerWorkingModeProperty,
    states: {
        0: "Balance Surveillance",
        1: "Optimal Surveillance",
        2: "Custom Recording",
        3: "Optimal Battery Life",
    },
}

export const DeviceRecordingClipLengthProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_DEV_RECORD_TIMEOUT,
    name: PropertyName.DeviceRecordingClipLength,
    label: "Recording Clip Length",
    readable: true,
    writeable: true,
    type: "number",
    min: 5,
    max: 120,
}

export const DeviceRecordingClipLengthFloodlightProperty: PropertyMetadataNumeric = {
    ...DeviceRecordingClipLengthProperty,
    min: 30,
    max: 120,
}

export const DeviceRecordingRetriggerIntervalProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_DEV_RECORD_INTERVAL,
    name: PropertyName.DeviceRecordingRetriggerInterval,
    label: "Recording Clip Length",
    readable: true,
    writeable: true,
    type: "number",
    unit: "sec",
    min: 5,
    max: 60,
}

export const DeviceRecordingRetriggerIntervalBatteryDoorbellProperty: PropertyMetadataNumeric = {
    ...DeviceRecordingRetriggerIntervalProperty,
    min: 2,
    max: 60,
}

export const DeviceRecordingRetriggerIntervalFloodlightProperty: PropertyMetadataNumeric = {
    ...DeviceRecordingRetriggerIntervalProperty,
    min: 0,
    max: 30,
}

export const DeviceRecordingEndClipMotionStopsProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_DEV_RECORD_AUTOSTOP,
    name: PropertyName.DeviceRecordingEndClipMotionStops,
    label: "Recording end clip early if motion stops",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceVideoStreamingQualityProperty: PropertyMetadataNumeric = {
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
}

export const DeviceVideoStreamingQualityBatteryDoorbellProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_BAT_DOORBELL_VIDEO_QUALITY,
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
}

export const DeviceVideoRecordingQualityIndoorProperty: PropertyMetadataNumeric = {
    key: 1023,
    name: PropertyName.DeviceVideoRecordingQuality,
    label: "Video Recording Quality",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        2: "Full HD (1080P)",
        3: "2K HD",
    },
}

export const DeviceWDRProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_BAT_DOORBELL_WDR_SWITCH,
    name: PropertyName.DeviceVideoWDR,
    label: "WDR",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceChimeIndoorBatteryDoorbellProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_BAT_DOORBELL_MECHANICAL_CHIME_SWITCH,
    name: PropertyName.DeviceChimeIndoor,
    label: "Indoor Chime Enabled",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceChimeHomebaseBatteryDoorbellProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_BAT_DOORBELL_CHIME_SWITCH,
    name: PropertyName.DeviceChimeHomebase,
    label: "Homebase Chime Enabled",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_BAT_DOORBELL_DINGDONG_V,
    name: PropertyName.DeviceChimeHomebaseRingtoneVolume,
    label: "Homebase Chime Ringtone Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 26,
}

export const DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_BAT_DOORBELL_DINGDONG_R,
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
}

export const DeviceNotificationTypeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_PUSH_EFFECT,
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
}

export const DeviceNotificationTypeIndoorFloodlightProperty: PropertyMetadataNumeric = {
    ...DeviceNotificationTypeProperty,
    key: CommandType.CMD_INDOOR_PUSH_NOTIFY_TYPE,
}

export const DeviceNotificationTypeBatteryDoorbellProperty: PropertyMetadataNumeric = {
    ...DeviceNotificationTypeProperty,
    key: CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
}

export const DeviceRotationSpeedProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_INDOOR_PAN_SPEED,
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
}

export const DeviceSoundDetectionTypeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_INDOOR_DET_SET_SOUND_DETECT_TYPE,
    name: PropertyName.DeviceSoundDetectionType,
    label: "Sound Detection Type",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Crying",
        2: "All Sounds",
    },
}

export const DeviceSoundDetectionSensivityProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_INDOOR_DET_SET_SOUND_SENSITIVITY_IDX,
    name: PropertyName.DeviceSoundDetectionSensivity,
    label: "Sound Detection Sensivity",
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
}

export const DeviceNotificationPersonProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_AI_PERSON_ENABLE,
    name: PropertyName.DeviceNotificationPerson,
    label: "Notification Person detected",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceNotificationPetProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_AI_PET_ENABLE,
    name: PropertyName.DeviceNotificationPet,
    label: "Notification Pet detected",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceNotificationAllOtherMotionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_AI_MOTION_ENABLE,
    name: PropertyName.DeviceNotificationAllOtherMotion,
    label: "Notification All Other Motion",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceNotificationAllSoundProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_AI_SOUND_ENABLE,
    name: PropertyName.DeviceNotificationAllSound,
    label: "Notification Sound detected",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceNotificationCryingProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_INDOOR_AI_CRYING_ENABLE,
    name: PropertyName.DeviceNotificationCrying,
    label: "Notification Crying detected",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceNotificationRing: PropertyMetadataBoolean = {
    key: CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
    name: PropertyName.DeviceNotificationRing,
    label: "Notification Ring detected",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceNotificationMotionProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE,
    name: PropertyName.DeviceNotificationMotion,
    label: "Notification Motion detected",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const DeviceProperties: Properties = {
    [DeviceType.CAMERA2]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkProperty,
        [PropertyName.DeviceState]: DeviceStateProperty,
        [PropertyName.DeviceLastChargingDays]: DeviceLastChargingDaysProperty,
        [PropertyName.DeviceLastChargingFalseEvents]: DeviceLastChargingFalseEventsProperty,
        [PropertyName.DeviceLastChargingRecordedEvents]: DeviceLastChargingRecordedEventsProperty,
        [PropertyName.DeviceLastChargingTotalEvents]: DeviceLastChargingTotalEventsProperty,
        [PropertyName.DeviceBatteryUsageLastWeek]: DeviceBatteryUsageLastWeekProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityCamera2Property,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeProperty,
        [PropertyName.DevicePowerSource]: DevicePowerSourceProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.CAMERA2C]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkProperty,
        [PropertyName.DeviceState]: DeviceStateProperty,
        [PropertyName.DeviceLastChargingDays]: DeviceLastChargingDaysProperty,
        [PropertyName.DeviceLastChargingFalseEvents]: DeviceLastChargingFalseEventsProperty,
        [PropertyName.DeviceLastChargingRecordedEvents]: DeviceLastChargingRecordedEventsProperty,
        [PropertyName.DeviceLastChargingTotalEvents]: DeviceLastChargingTotalEventsProperty,
        [PropertyName.DeviceBatteryUsageLastWeek]: DeviceBatteryUsageLastWeekProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityCamera2Property,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeProperty,
        [PropertyName.DevicePowerSource]: DevicePowerSourceProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.CAMERA2C_PRO]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkProperty,
        [PropertyName.DeviceState]: DeviceStateProperty,
        [PropertyName.DeviceLastChargingDays]: DeviceLastChargingDaysProperty,
        [PropertyName.DeviceLastChargingFalseEvents]: DeviceLastChargingFalseEventsProperty,
        [PropertyName.DeviceLastChargingRecordedEvents]: DeviceLastChargingRecordedEventsProperty,
        [PropertyName.DeviceLastChargingTotalEvents]: DeviceLastChargingTotalEventsProperty,
        [PropertyName.DeviceBatteryUsageLastWeek]: DeviceBatteryUsageLastWeekProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityCamera2Property,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeProperty,
        [PropertyName.DevicePowerSource]: DevicePowerSourceProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.CAMERA2_PRO]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkProperty,
        [PropertyName.DeviceState]: DeviceStateProperty,
        [PropertyName.DeviceLastChargingDays]: DeviceLastChargingDaysProperty,
        [PropertyName.DeviceLastChargingFalseEvents]: DeviceLastChargingFalseEventsProperty,
        [PropertyName.DeviceLastChargingRecordedEvents]: DeviceLastChargingRecordedEventsProperty,
        [PropertyName.DeviceLastChargingTotalEvents]: DeviceLastChargingTotalEventsProperty,
        [PropertyName.DeviceBatteryUsageLastWeek]: DeviceBatteryUsageLastWeekProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityCamera2Property,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeProperty,
        [PropertyName.DevicePowerSource]: DevicePowerSourceProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.CAMERA]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkBatteryDoorbellCamera1Property,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DevicePowerSource]: DevicePowerSourceProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.CAMERA_E]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkBatteryDoorbellCamera1Property,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DevicePowerSource]: DevicePowerSourceProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.DOORBELL]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionDoorbellProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkSoloWiredDoorbellProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectionDoorbellProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceRinging]: DeviceRingingProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedDoorbellProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        //[PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
    },
    [DeviceType.BATTERY_DOORBELL]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedBatteryDoorbellProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        //[PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkBatteryDoorbellCamera1Property,
        [PropertyName.DeviceState]: DeviceStateProperty,
        [PropertyName.DeviceLastChargingDays]: DeviceLastChargingDaysProperty,
        [PropertyName.DeviceLastChargingFalseEvents]: DeviceLastChargingFalseEventsProperty,
        [PropertyName.DeviceLastChargingRecordedEvents]: DeviceLastChargingRecordedEventsProperty,
        [PropertyName.DeviceLastChargingTotalEvents]: DeviceLastChargingTotalEventsProperty,
        [PropertyName.DeviceBatteryUsageLastWeek]: DeviceBatteryUsageLastWeekProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceRinging]: DeviceRingingProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceRingtoneVolume]: DeviceRingtoneVolumeBatteryDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeBatteryDoorbellProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalBatteryDoorbellProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoWDR]: DeviceWDRProperty,
        [PropertyName.DeviceChimeIndoor]: DeviceChimeIndoorBatteryDoorbellProperty,
        [PropertyName.DeviceChimeHomebase]: DeviceChimeHomebaseBatteryDoorbellProperty,
        [PropertyName.DeviceChimeHomebaseRingtoneVolume]: DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty,
        [PropertyName.DeviceChimeHomebaseRingtoneType]: DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeBatteryDoorbellProperty,
        [PropertyName.DeviceNotificationRing]: DeviceNotificationRing,
        [PropertyName.DeviceNotificationMotion]: DeviceNotificationMotionProperty,
    },
    [DeviceType.BATTERY_DOORBELL_2]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBattery]: DeviceBatteryProperty,
        [PropertyName.DeviceBatteryTemp]: DeviceBatteryTempProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSIProperty,
        [PropertyName.DeviceEnabled]: DeviceEnabledProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedBatteryDoorbellProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionProperty,
        //[PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkBatteryDoorbellCamera1Property,
        [PropertyName.DeviceState]: DeviceStateProperty,
        [PropertyName.DeviceLastChargingDays]: DeviceLastChargingDaysProperty,
        [PropertyName.DeviceLastChargingFalseEvents]: DeviceLastChargingFalseEventsProperty,
        [PropertyName.DeviceLastChargingRecordedEvents]: DeviceLastChargingRecordedEventsProperty,
        [PropertyName.DeviceLastChargingTotalEvents]: DeviceLastChargingTotalEventsProperty,
        [PropertyName.DeviceBatteryUsageLastWeek]: DeviceBatteryUsageLastWeekProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceRinging]: DeviceRingingProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceRingtoneVolume]: DeviceRingtoneVolumeBatteryDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeBatteryDoorbellProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalBatteryDoorbellProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoWDR]: DeviceWDRProperty,
        [PropertyName.DeviceChimeIndoor]: DeviceChimeIndoorBatteryDoorbellProperty,
        [PropertyName.DeviceChimeHomebase]: DeviceChimeHomebaseBatteryDoorbellProperty,
        [PropertyName.DeviceChimeHomebaseRingtoneVolume]: DeviceChimeHomebaseRingtoneVolumeBatteryDoorbellProperty,
        [PropertyName.DeviceChimeHomebaseRingtoneType]: DeviceChimeHomebaseRingtoneTypeBatteryDoorbellProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeBatteryDoorbellProperty,
        [PropertyName.DeviceNotificationRing]: DeviceNotificationRing,
        [PropertyName.DeviceNotificationMotion]: DeviceNotificationMotionProperty,
    },
    [DeviceType.FLOODLIGHT]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceLight]: DeviceFloodlightLightProperty,
        [PropertyName.DeviceLightSettingsEnable]: DeviceFloodlightLightSettingsEnableProperty,
        [PropertyName.DeviceLightSettingsBrightnessManual]: DeviceFloodlightLightSettingsBrightnessManualProperty,
        [PropertyName.DeviceLightSettingsBrightnessMotion]: DeviceFloodlightLightSettingsBrightnessMotionProperty,
        [PropertyName.DeviceLightSettingsBrightnessSchedule]: DeviceFloodlightLightSettingsBrightnessScheduleProperty,
        [PropertyName.DeviceLightSettingsMotionTriggered]: DeviceFloodlightLightSettingsMotionTriggeredProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: DeviceFloodlightLightSettingsMotionTriggeredTimerProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeFloodlightProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthFloodlightProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalFloodlightProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
    },
    [DeviceType.FLOODLIGHT_CAMERA_8422]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceLight]: DeviceFloodlightLightProperty,
        [PropertyName.DeviceLightSettingsEnable]: DeviceFloodlightLightSettingsEnableProperty,
        [PropertyName.DeviceLightSettingsBrightnessManual]: DeviceFloodlightLightSettingsBrightnessManualProperty,
        [PropertyName.DeviceLightSettingsBrightnessMotion]: DeviceFloodlightLightSettingsBrightnessMotionProperty,
        [PropertyName.DeviceLightSettingsBrightnessSchedule]: DeviceFloodlightLightSettingsBrightnessScheduleProperty,
        [PropertyName.DeviceLightSettingsMotionTriggered]: DeviceFloodlightLightSettingsMotionTriggeredProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: DeviceFloodlightLightSettingsMotionTriggeredTimerProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeFloodlightProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthFloodlightProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalFloodlightProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
    },
    [DeviceType.FLOODLIGHT_CAMERA_8423]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceLight]: DeviceFloodlightLightProperty,
        [PropertyName.DeviceLightSettingsEnable]: DeviceFloodlightLightSettingsEnableProperty,
        [PropertyName.DeviceLightSettingsBrightnessManual]: DeviceFloodlightLightSettingsBrightnessManualProperty,
        [PropertyName.DeviceLightSettingsBrightnessMotion]: DeviceFloodlightLightSettingsBrightnessMotionProperty,
        [PropertyName.DeviceLightSettingsBrightnessSchedule]: DeviceFloodlightLightSettingsBrightnessScheduleProperty,
        [PropertyName.DeviceLightSettingsMotionTriggered]: DeviceFloodlightLightSettingsMotionTriggeredProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: DeviceFloodlightLightSettingsMotionTriggeredTimerProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeFloodlightProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthFloodlightProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalFloodlightProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
    },
    [DeviceType.FLOODLIGHT_CAMERA_8424]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceLight]: DeviceFloodlightLightProperty,
        [PropertyName.DeviceLightSettingsEnable]: DeviceFloodlightLightSettingsEnableProperty,
        [PropertyName.DeviceLightSettingsBrightnessManual]: DeviceFloodlightLightSettingsBrightnessManualProperty,
        [PropertyName.DeviceLightSettingsBrightnessMotion]: DeviceFloodlightLightSettingsBrightnessMotionProperty,
        [PropertyName.DeviceLightSettingsBrightnessSchedule]: DeviceFloodlightLightSettingsBrightnessScheduleProperty,
        [PropertyName.DeviceLightSettingsMotionTriggered]: DeviceFloodlightLightSettingsMotionTriggeredProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredDistance]: DeviceFloodlightLightSettingsMotionTriggeredDistanceProperty,
        [PropertyName.DeviceLightSettingsMotionTriggeredTimer]: DeviceFloodlightLightSettingsMotionTriggeredTimerProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeFloodlightProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthFloodlightProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalFloodlightProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
    },
    [DeviceType.INDOOR_CAMERA]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoRecordingQuality]: DeviceVideoRecordingQualityIndoorProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.INDOOR_CAMERA_1080]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.INDOOR_PT_CAMERA]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceMotionTracking]: DeviceMotionTrackingProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoRecordingQuality]: DeviceVideoRecordingQualityIndoorProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceRotationSpeed]: DeviceRotationSpeedProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.INDOOR_PT_CAMERA_1080]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceMotionTracking]: DeviceMotionTrackingProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceRotationSpeed]: DeviceRotationSpeedProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoRecordingQuality]: DeviceVideoRecordingQualityIndoorProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoRecordingQuality]: DeviceVideoRecordingQualityIndoorProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceSoundDetection]: DeviceSoundDetectionProperty,
        [PropertyName.DevicePetDetection]: DevicePetDetectionProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkIndoorFloodProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DevicePetDetected]: DevicePetDetectedProperty,
        [PropertyName.DeviceSoundDetected]: DeviceSoundDetectedProperty,
        [PropertyName.DeviceSoundDetectionType]: DeviceSoundDetectionTypeProperty,
        [PropertyName.DeviceSoundDetectionSensivity]: DeviceSoundDetectionSensivityProperty,
        [PropertyName.DeviceCryingDetected]: DeviceCryingDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMotionDetectionSensivity]: DeviceMotionDetectionSensivityIndoorProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeIndoorFloodDoorbellProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceVideoRecordingQuality]: DeviceVideoRecordingQualityIndoorProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeIndoorFloodlightProperty,
        [PropertyName.DeviceNotificationPerson]: DeviceNotificationPersonProperty,
        [PropertyName.DeviceNotificationPet]: DeviceNotificationPetProperty,
        [PropertyName.DeviceNotificationAllOtherMotion]: DeviceNotificationAllOtherMotionProperty,
        [PropertyName.DeviceNotificationAllSound]: DeviceNotificationAllSoundProperty,
        [PropertyName.DeviceNotificationCrying]: DeviceNotificationCryingProperty,
    },
    [DeviceType.SOLO_CAMERA]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkSoloWiredDoorbellProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.SOLO_CAMERA_PRO]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkSoloWiredDoorbellProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkSoloWiredDoorbellProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkSoloWiredDoorbellProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceEnabled]: DeviceEnabledStandaloneProperty,
        [PropertyName.DeviceAutoNightvision]: DeviceAutoNightvisionProperty,
        [PropertyName.DeviceMotionDetection]: DeviceMotionDetectionIndoorSoloFloodProperty,
        [PropertyName.DeviceRTSPStream]: DeviceRTSPStreamProperty,
        [PropertyName.DeviceAntitheftDetection]: DeviceAntitheftDetectionProperty,
        [PropertyName.DeviceWatermark]: DeviceWatermarkSoloWiredDoorbellProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DevicePersonDetected]: DevicePersonDetectedProperty,
        [PropertyName.DeviceStatusLed]: DeviceStatusLedIndoorSoloFloodProperty,
        [PropertyName.DevicePictureUrl]: DevicePictureUrlProperty,
        [PropertyName.DeviceMicrophone]: DeviceMicrophoneProperty,
        [PropertyName.DeviceSpeaker]: DeviceSpeakerProperty,
        [PropertyName.DeviceSpeakerVolume]: DeviceSpeakerVolumeProperty,
        [PropertyName.DeviceAudioRecording]: DeviceAudioRecordingIndoorFloodlightProperty,
        [PropertyName.DeviceMotionDetectionType]: DeviceMotionDetectionTypeIndoorProperty,
        [PropertyName.DevicePowerWorkingMode]: DevicePowerWorkingModeProperty,
        [PropertyName.DeviceRecordingClipLength]: DeviceRecordingClipLengthProperty,
        [PropertyName.DeviceRecordingRetriggerInterval]: DeviceRecordingRetriggerIntervalProperty,
        [PropertyName.DeviceRecordingEndClipMotionStops]: DeviceRecordingEndClipMotionStopsProperty,
        [PropertyName.DeviceVideoStreamingQuality]: DeviceVideoStreamingQualityProperty,
        [PropertyName.DeviceNotificationType]: DeviceNotificationTypeProperty,
    },
    [DeviceType.KEYPAD]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBatteryLow]: DeviceBatteryLowKeypadProperty,
        [PropertyName.DeviceState]: DeviceStateProperty,
    },
    [DeviceType.LOCK_ADVANCED]: {
        ...GenericDeviceProperties,
        //[PropertyName.DeviceState]: DeviceStateLockProperty,
        [PropertyName.DeviceBattery]: DeviceBatteryLockProperty,
        //[PropertyName.DeviceWifiRSSI]: DeviceWifiRSSILockProperty,
        //[PropertyName.DeviceLocked]: DeviceLockedProperty,
        [PropertyName.DeviceLockStatus]: DeviceAdvancedLockStatusProperty,
    },
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: {
        ...GenericDeviceProperties,
        //[PropertyName.DeviceState]: DeviceStateLockProperty,
        [PropertyName.DeviceBattery]: DeviceBatteryLockProperty,
        //[PropertyName.DeviceWifiRSSI]: DeviceWifiRSSILockProperty,
        //[PropertyName.DeviceLocked]: DeviceLockedProperty,
        [PropertyName.DeviceLockStatus]: DeviceAdvancedLockStatusProperty,
    },
    [DeviceType.LOCK_BASIC]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceState]: DeviceStateLockProperty,
        [PropertyName.DeviceBattery]: DeviceBatteryLockProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSILockProperty,
        [PropertyName.DeviceLocked]: DeviceLockedProperty,
        [PropertyName.DeviceLockStatus]: DeviceBasicLockStatusProperty,
    },
    [DeviceType.LOCK_BASIC_NO_FINGER]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceState]: DeviceStateLockProperty,
        [PropertyName.DeviceBattery]: DeviceBatteryLockProperty,
        [PropertyName.DeviceWifiRSSI]: DeviceWifiRSSILockProperty,
        [PropertyName.DeviceLocked]: DeviceLockedProperty,
        [PropertyName.DeviceLockStatus]: DeviceBasicLockStatusProperty,
    },
    [DeviceType.MOTION_SENSOR]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceBatteryLow]: DeviceBatteryLowMotionSensorProperty,
        [PropertyName.DeviceMotionDetected]: DeviceMotionDetectedProperty,
        [PropertyName.DeviceMotionSensorPIREvent]: DeviceMotionSensorPIREventProperty,
    },
    [DeviceType.SENSOR]: {
        ...GenericDeviceProperties,
        [PropertyName.DeviceSensorOpen]: DeviceSensorOpenProperty,
        [PropertyName.DeviceBatteryLow]: DeviceBatteryLowSensorProperty,
        [PropertyName.DeviceSensorChangeTime]: DeviceSensorChangeTimeProperty,
    },
}

export const StationNameProperty: PropertyMetadataString = {
    key: "station_name",
    name: PropertyName.Name,
    label: "Name",
    readable: true,
    writeable: false,
    type: "string",
}

export const StationModelProperty: PropertyMetadataString = {
    key: "station_model",
    name: PropertyName.Model,
    label: "Model",
    readable: true,
    writeable: false,
    type: "string",
}

export const StationSerialNumberProperty: PropertyMetadataString = {
    key: "station_sn",
    name: PropertyName.SerialNumber,
    label: "Serial number",
    readable: true,
    writeable: false,
    type: "string",
}

export const BaseStationProperties: IndexedProperty = {
    [StationNameProperty.name]: StationNameProperty,
    [StationModelProperty.name]: StationModelProperty,
    [StationSerialNumberProperty.name]: StationSerialNumberProperty,
    [GenericTypeProperty.name]: GenericTypeProperty,
    [GenericHWVersionProperty.name]: GenericHWVersionProperty,
    [GenericSWVersionProperty.name]: GenericSWVersionProperty,
}

export const StationGuardModeProperty: PropertyMetadataNumeric = {
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
        47: "GEO",
        63: "DISARMED",
    },
}

export const StationGuardModeKeyPadProperty: PropertyMetadataNumeric = {
    ...StationGuardModeProperty,
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
}

export const StationCurrentModeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_GET_ALARM_MODE,
    name: PropertyName.StationCurrentMode,
    label: "Current Mode",
    readable: true,
    writeable: false,
    type: "number",
    states: {
        0: "AWAY",
        1: "HOME",
        3: "CUSTOM1",
        4: "CUSTOM2",
        5: "CUSTOM3",
        63: "DISARMED",
    },
}

export const StationLanIpAddressProperty: PropertyMetadataString = {
    key: CommandType.CMD_GET_HUB_LAN_IP,
    name: PropertyName.StationLANIpAddress,
    label: "LAN IP Address",
    readable: true,
    writeable: false,
    type: "string",
}

export const StationLanIpAddressStandaloneProperty: PropertyMetadataString = {
    ...StationLanIpAddressProperty,
    key: "ip_addr",
};

export const StationMacAddressProperty: PropertyMetadataString = {
    key: "wifi_mac",
    //key: "sub1g_mac", // are always the same
    name: PropertyName.StationMacAddress,
    label: "MAC Address",
    readable: true,
    writeable: false,
    type: "string",
}

export const StationAlarmVolumeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_HUB_SPK_VOLUME,
    name: PropertyName.StationAlarmVolume,
    label: "Alarm Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 1,
    max: 26,
}

export const StationPromptVolumeProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_PROMPT_VOLUME,
    name: PropertyName.StationPromptVolume,
    label: "Prompt Volume",
    readable: true,
    writeable: true,
    type: "number",
    min: 0,
    max: 26,
}

export const StationAlarmToneProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_HUB_ALARM_TONE,
    name: PropertyName.StationAlarmTone,
    label: "Alarm Tone",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        1: "Alarm sound 1",
        2: "Alarm sound 2",
    }
}

export const StationNotificationSwitchModeScheduleProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeSchedule,
    label: "Notification Switch Mode Schedule",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const StationNotificationSwitchModeGeofenceProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeGeofence,
    label: "Notification Switch Mode Geofence",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const StationNotificationSwitchModeAppProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeApp,
    label: "Notification Switch Mode App",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const StationNotificationSwitchModeKeypadProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_HUB_NOTIFY_MODE,
    name: PropertyName.StationNotificationSwitchModeKeypad,
    label: "Notification Switch Mode Keypad",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const StationNotificationStartAlarmDelayProperty: PropertyMetadataBoolean = {
    key: CommandType.CMD_HUB_NOTIFY_ALARM,
    name: PropertyName.StationNotificationStartAlarmDelay,
    label: "Notification Start Alarm Delay",
    readable: true,
    writeable: true,
    type: "boolean",
}

export const StationTimeFormatProperty: PropertyMetadataNumeric = {
    key: CommandType.CMD_SET_HUB_OSD,
    name: PropertyName.StationTimeFormat,
    label: "Time Format",
    readable: true,
    writeable: true,
    type: "number",
    states: {
        0: "12h",
        1: "24h",
    }
}

export const StationProperties: Properties = {
    [DeviceType.STATION]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
        [PropertyName.StationTimeFormat]: StationTimeFormatProperty,
        [PropertyName.StationPromptVolume]: StationPromptVolumeProperty,
        [PropertyName.StationAlarmVolume]: StationAlarmVolumeProperty,
        [PropertyName.StationAlarmTone]: StationAlarmToneProperty,
        [PropertyName.StationNotificationSwitchModeSchedule]: StationNotificationSwitchModeScheduleProperty,
        [PropertyName.StationNotificationSwitchModeGeofence]: StationNotificationSwitchModeGeofenceProperty,
        [PropertyName.StationNotificationSwitchModeApp]: StationNotificationSwitchModeAppProperty,
        [PropertyName.StationNotificationSwitchModeKeypad]: StationNotificationSwitchModeKeypadProperty,
        [PropertyName.StationNotificationStartAlarmDelay]: StationNotificationStartAlarmDelayProperty,
    },
    [DeviceType.INDOOR_CAMERA]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.INDOOR_CAMERA_1080]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.INDOOR_PT_CAMERA]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.INDOOR_PT_CAMERA_1080]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.DOORBELL]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.SOLO_CAMERA]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.SOLO_CAMERA_PRO]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.FLOODLIGHT]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.FLOODLIGHT_CAMERA_8422]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.FLOODLIGHT_CAMERA_8423]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.FLOODLIGHT_CAMERA_8424]: {
        ...BaseStationProperties,
        [PropertyName.StationLANIpAddress]: StationLanIpAddressStandaloneProperty,
        [PropertyName.StationMacAddress]: StationMacAddressProperty,
        [PropertyName.StationGuardMode]: StationGuardModeProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
    [DeviceType.KEYPAD]: {
        ...BaseStationProperties,
        [PropertyName.StationGuardMode]: StationGuardModeKeyPadProperty,
        [PropertyName.StationCurrentMode]: StationCurrentModeProperty,
    },
}

export enum CommandName {
    DeviceStartLivestream,
    DeviceStopLivestream,
    DeviceQuickResponse,
    DevicePanAndTilt,
    DeviceTriggerAlarmSound,
    StationReboot,
    StationTriggerAlarmSound,
    StationDownload,
}

export const DeviceCommands: Commands = {
    [DeviceType.CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
    ],
    [DeviceType.CAMERA2]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
    ],
    [DeviceType.CAMERA2C]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
    ],
    [DeviceType.CAMERA2C_PRO]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
    ],
    [DeviceType.CAMERA2_PRO]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceTriggerAlarmSound,
    ],
    [DeviceType.CAMERA_E]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.DOORBELL]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceQuickResponse,
    ],
    [DeviceType.BATTERY_DOORBELL]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceQuickResponse,
    ],
    [DeviceType.BATTERY_DOORBELL_2]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DeviceQuickResponse,
    ],
    [DeviceType.INDOOR_CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.INDOOR_CAMERA_1080]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.INDOOR_PT_CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DevicePanAndTilt,
    ],
    [DeviceType.INDOOR_PT_CAMERA_1080]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
        CommandName.DevicePanAndTilt,
    ],
    [DeviceType.SOLO_CAMERA]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.SOLO_CAMERA_PRO]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.FLOODLIGHT]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8422]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8423]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8424]: [
        CommandName.DeviceStartLivestream,
        CommandName.DeviceStopLivestream,
    ],
    [DeviceType.KEYPAD]: [],
    [DeviceType.LOCK_BASIC]: [],
    [DeviceType.LOCK_BASIC_NO_FINGER]: [],
    [DeviceType.LOCK_ADVANCED]: [],
    [DeviceType.LOCK_ADVANCED_NO_FINGER]: [],
    [DeviceType.MOTION_SENSOR]: [],
    [DeviceType.SENSOR]: [],
}

export const StationCommands: Commands = {
    [DeviceType.STATION]: [
        CommandName.StationReboot,
        CommandName.StationTriggerAlarmSound,
        CommandName.StationDownload,
    ],
    [DeviceType.INDOOR_CAMERA]: [
        CommandName.StationReboot,
    ],
    [DeviceType.INDOOR_CAMERA_1080]: [
        CommandName.StationReboot,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P]: [
        CommandName.StationReboot,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT]: [
        CommandName.StationReboot,
    ],
    [DeviceType.INDOOR_OUTDOOR_CAMERA_2K]: [
        CommandName.StationReboot,
    ],
    [DeviceType.INDOOR_PT_CAMERA]: [
        CommandName.StationReboot,
    ],
    [DeviceType.INDOOR_PT_CAMERA_1080]: [
        CommandName.StationReboot,
    ],
    [DeviceType.DOORBELL]: [],
    [DeviceType.SOLO_CAMERA]: [],
    [DeviceType.SOLO_CAMERA_PRO]: [],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_1080]: [],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_2K]: [],
    [DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR]: [],
    [DeviceType.FLOODLIGHT]: [
        CommandName.StationReboot,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8422]: [
        CommandName.StationReboot,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8423]: [
        CommandName.StationReboot,
    ],
    [DeviceType.FLOODLIGHT_CAMERA_8424]: [
        CommandName.StationReboot,
    ],
    [DeviceType.KEYPAD]: [],
}