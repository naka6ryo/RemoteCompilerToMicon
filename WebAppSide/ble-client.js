// ============================================================================
// BLE Client Module for ESP32-S3 Remote Control
// Handles Web Bluetooth API communication
// ============================================================================

class BLEClient {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.provService = null;
        this.characteristics = {};
        this.isConnected = false;
        this.onDisconnect = null;
        this.onLogReceived = null;
        this.onStatReceived = null;
    }

    /**
     * Check if Web Bluetooth is supported
     */
    static isSupported() {
        return navigator.bluetooth !== undefined;
    }

    /**
     * Request and connect to BLE device
     */
    async connect() {
        try {
            if (!BLEClient.isSupported()) {
                throw new Error(ERROR_MESSAGES.BLE_NOT_SUPPORTED);
            }

            console.log('[BLE] Requesting device...');
            this.device = await navigator.bluetooth.requestDevice(BLE_DEVICE_FILTER);

            console.log('[BLE] Connecting to GATT server...');
            this.device.addEventListener('gattserverdisconnected', () => this._onDisconnect());
            
            this.server = await this.device.gatt.connect();
            console.log('[BLE] Connected to GATT server');

            // Try to get debug service
            await this._getDebugService();

            // Try to get provisioning service (may not exist if already provisioned)
            try {
                await this._getProvisioningService();
            } catch (e) {
                console.log('[BLE] Provisioning service not available (device may be already provisioned)');
            }

            this.isConnected = true;
            console.log('[BLE] Connection successful');
            
            // Set BLE device for firmware client
            firmwareClient.setBleDevice(this.device);
            
            return true;

        } catch (error) {
            console.error('[BLE] Connection error:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Get debug service and characteristics
     */
    async _getDebugService() {
        try {
            this.service = await this.server.getPrimaryService(BLE_UUIDS.DEBUG_SERVICE_UUID);
            console.log('[BLE] Debug service found');

            // Get DebugLogTx (Notify)
            try {
                this.characteristics.logTx = await this.service.getCharacteristic(BLE_UUIDS.DEBUG_LOG_TX_UUID);
                await this.characteristics.logTx.startNotifications();
                this.characteristics.logTx.addEventListener('characteristicvaluechanged', 
                    (event) => this._onLogNotify(event));
                console.log('[BLE] DebugLogTx subscribed');
            } catch (e) {
                console.warn('[BLE] DebugLogTx not available:', e.message);
            }

            // Get DebugCmdRx (Write)
            try {
                this.characteristics.cmdRx = await this.service.getCharacteristic(BLE_UUIDS.DEBUG_CMD_RX_UUID);
                console.log('[BLE] DebugCmdRx available');
            } catch (e) {
                console.warn('[BLE] DebugCmdRx not available:', e.message);
            }

            // Get DebugStat (Read/Notify)
            try {
                this.characteristics.stat = await this.service.getCharacteristic(BLE_UUIDS.DEBUG_STAT_UUID);
                await this.characteristics.stat.startNotifications();
                this.characteristics.stat.addEventListener('characteristicvaluechanged',
                    (event) => this._onStatNotify(event));
                console.log('[BLE] DebugStat subscribed');
            } catch (e) {
                console.warn('[BLE] DebugStat not available:', e.message);
            }

        } catch (error) {
            console.warn('[BLE] Debug service not found:', error.message);
            throw new Error(ERROR_MESSAGES.BLE_SERVICE_NOT_FOUND);
        }
    }

    /**
     * Disconnect from BLE device
     */
    async disconnect() {
        try {
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
                this.isConnected = false;
                console.log('[BLE] Disconnected');
            }
        } catch (error) {
            console.error('[BLE] Disconnect error:', error);
        }
    }

    /**
     * Handle log notification
     */
    _onLogNotify(event) {
        const characteristic = event.target;
        const value = characteristic.value;
        
        // Decode UTF-8
        const decoder = new TextDecoder();
        const logLine = decoder.decode(value);
        
        console.log('[BLE Log]', logLine);
        
        if (this.onLogReceived) {
            this.onLogReceived(logLine);
        }
    }

    /**
     * Handle stat notification
     */
    _onStatNotify(event) {
        const characteristic = event.target;
        const value = characteristic.value;
        
        // Decode UTF-8
        const decoder = new TextDecoder();
        const statStr = decoder.decode(value);
        
        console.log('[BLE Stat]', statStr);
        
        if (this.onStatReceived) {
            this.onStatReceived(statStr);
        }
    }

    /**
     * Handle disconnect event
     */
    _onDisconnect() {
        this.isConnected = false;
        console.log('[BLE] Device disconnected');
        
        if (this.onDisconnect) {
            this.onDisconnect();
        }
    }

    /**
     * Send debug command to device
     */
    async sendCommand(command) {
        try {
            if (!this.isConnected || !this.characteristics.cmdRx) {
                throw new Error('BLE not connected or command characteristic not available');
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(command);
            
            await this.characteristics.cmdRx.writeValue(data);
            console.log('[BLE] Command sent:', command);
            return true;

        } catch (error) {
            console.error('[BLE] Send command error:', error);
            throw error;
        }
    }

    /**
     * Read device status
     */
    async readStatus() {
        try {
            if (!this.isConnected || !this.characteristics.stat) {
                throw new Error('BLE not connected or stat characteristic not available');
            }

            const value = await this.characteristics.stat.readValue();
            const decoder = new TextDecoder();
            const statStr = decoder.decode(value);
            
            console.log('[BLE] Status read:', statStr);
            return statStr;

        } catch (error) {
            console.error('[BLE] Read status error:', error);
            throw error;
        }
    }

    /**
     * Get provisioning service and characteristics
     */
    async _getProvisioningService() {
        try {
            this.provService = await this.server.getPrimaryService(BLE_UUIDS.PROV_SERVICE_UUID);
            console.log('[BLE] Provisioning service found');

            // Get WiFi Config characteristic (Write)
            try {
                this.characteristics.wifiConfig = await this.provService.getCharacteristic(BLE_UUIDS.PROV_WIFI_CONFIG_UUID);
                console.log('[BLE] WiFi Config characteristic available');
            } catch (e) {
                console.warn('[BLE] WiFi Config characteristic not available:', e.message);
            }

        } catch (error) {
            console.warn('[BLE] Provisioning service not found:', error.message);
            // This is not a fatal error - device might already be provisioned
        }
    }

    /**
     * Send WiFi credentials to device
     */
    async sendWiFiCredentials(ssid, password) {
        try {
            if (!this.isConnected) {
                throw new Error('BLE not connected');
            }

            // Try to get provisioning service if not already obtained
            if (!this.provService) {
                await this._getProvisioningService();
            }

            if (!this.characteristics.wifiConfig) {
                const error = new Error('WiFi Config characteristic not available. Device may already be provisioned. Please reset the device to enable WiFi provisioning.');
                error.code = 'PROVISION_SERVICE_NOT_AVAILABLE';
                throw error;
            }

            // Format: "SSID\nPassword"
            const configData = `${ssid}\n${password}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(configData);
            
            await this.characteristics.wifiConfig.writeValue(data);
            console.log('[BLE] WiFi credentials sent');
            return true;

        } catch (error) {
            console.error('[BLE] Send WiFi credentials error:', error);
            throw error;
        }
    }

    /**
     * Get device info
     */
    getDeviceInfo() {
        if (!this.device) {
            return null;
        }

        return {
            name: this.device.name || 'Unknown Device',
            id: this.device.id,
            connected: this.isConnected
        };
    }
}

// Global instance
const bleClient = new BLEClient();
