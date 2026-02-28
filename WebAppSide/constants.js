// ============================================================================
// Constants for ESP32-S3 Remote Control WebApp
// ============================================================================

// BLE UUIDs from specification
const BLE_UUIDS = {
    // Debug Service (independent from Provisioning service)
    DEBUG_SERVICE_UUID: '7f3f0001-6b7c-4f2e-9b8a-1a2b3c4d5e6f',
    DEBUG_LOG_TX_UUID: '7f3f0002-6b7c-4f2e-9b8a-1a2b3c4d5e6f',
    DEBUG_CMD_RX_UUID: '7f3f0003-6b7c-4f2e-9b8a-1a2b3c4d5e6f',
    DEBUG_STAT_UUID: '7f3f0005-6b7c-4f2e-9b8a-1a2b3c4d5e6f',
    
    // Provisioning Service
    PROV_SERVICE_UUID: '8f4f0001-7c8d-5f3e-ac9b-2b3c4d5e6f70',
    PROV_WIFI_CONFIG_UUID: '8f4f0002-7c8d-5f3e-ac9b-2b3c4d5e6f70',

    // OTA Service
    OTA_SERVICE_UUID: '9f5f0001-8d9e-6f4e-bd0c-3c4d5e6f7180',
    OTA_CONTROL_UUID: '9f5f0002-8d9e-6f4e-bd0c-3c4d5e6f7180',
    OTA_DATA_UUID: '9f5f0003-8d9e-6f4e-bd0c-3c4d5e6f7180',
    OTA_STATUS_UUID: '9f5f0004-8d9e-6f4e-bd0c-3c4d5e6f7180',
};

// Device filter options
const BLE_DEVICE_FILTER = {
    filters: [
        { namePrefix: 'ESP32' }
    ],
    optionalServices: [
        BLE_UUIDS.DEBUG_SERVICE_UUID,
        BLE_UUIDS.PROV_SERVICE_UUID,
        BLE_UUIDS.OTA_SERVICE_UUID,
    ]
};

// BLE OTA Configuration
const OTA_CONFIG = {
    CHUNK_SIZE: 240,              // BLE chunk size (bytes) - optimized for speed
    MAX_FIRMWARE_SIZE: 2097152,   // 2 MB
    TIMEOUT_MS: 120000,           // 2 minutes
    CHUNK_RETRY_COUNT: 5,         // retry count per chunk on transient BLE errors
    WRITE_TIMEOUT_MS: 800,        // timeout for one write operation
    INTER_CHUNK_DELAY_MS: 1,      // pacing delay for write-with-response fallback
    INTER_CHUNK_DELAY_NR_MS: 5,   // pacing delay for write-without-response (primary path)
};

// Debug commands
const DEBUG_COMMANDS = {
    SET_LEVEL_ERROR: 'LVL:0',
    SET_LEVEL_WARN: 'LVL:1',
    SET_LEVEL_INFO: 'LVL:2',
    SET_LEVEL_DEBUG: 'LVL:3',
    CLEAR_BUFFER: 'CLR',
    PING: 'PING',
};

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

// System states
const SYSTEM_STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTED: 'connected',
    PROVISIONING: 'provisioning',
    PROVISIONING_SUCCESS: 'provisioning_success',
    PROVISIONING_FAILED: 'provisioning_failed',
    OTA_ALLOWED: 'ota_allowed',
    OTA_DENIED: 'ota_denied',
    OTA_IN_PROGRESS: 'ota_in_progress',
    OTA_SUCCESS: 'ota_success',
    OTA_FAILED: 'ota_failed',
};

// UI Configuration
const UI_CONFIG = {
    LOG_MAX_LINES: 1000,
    LOG_UPDATE_INTERVAL_MS: 500,
    STATUS_POLL_INTERVAL_MS: 5000,
    OTA_SESSION_TTL_POLL_MS: 1000,
};

// Error messages
const ERROR_MESSAGES = {
    BLE_NOT_SUPPORTED: 'Web Bluetooth API is not supported in this browser. Please use Bluefy.',
    BLE_CONNECTION_FAILED: 'Failed to connect to BLE device. Please try again.',
    BLE_SERVICE_NOT_FOUND: 'Required BLE service not found on device.',
    BLE_CHARACTERISTIC_NOT_FOUND: 'Required BLE characteristic not found.',
    WIFI_CONFIG_FAILED: 'Wi-Fi configuration failed. Please check SSID and password.',
    OTA_SESSION_EXPIRED: 'OTA session has expired. Please re-provision the device.',
    OTA_SESSION_NOT_ALLOWED: 'OTA is only allowed after BLE provisioning.',
    OTA_AUTH_FAILED: 'Authentication failed. Check username and password.',
    OTA_UPLOAD_FAILED: 'Firmware upload failed. Please try again.',
    HTTP_TIMEOUT: 'HTTP request timeout. Please check device IP and network.',
    INVALID_BIN_FILE: 'Invalid firmware file. Please select a valid .bin file.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Success messages
const SUCCESS_MESSAGES = {
    BLE_CONNECTED: 'Successfully connected to ESP32 device.',
    WIFI_PROVISIONED: 'Wi-Fi configuration sent successfully.',
    OTA_SUCCESS: 'Firmware updated successfully. Device rebooting...',
    COMMAND_SENT: 'Command sent to device.',
};
