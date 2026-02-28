// ============================================================================
// Main Application Module
// Orchestrates BLE, OTA, and UI interactions
// ============================================================================

class ESP32RemoteApp {
    constructor() {
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        console.log('[App] Initializing...');
        this.setupEventListeners();
        this.logToUI('[System] Application initialized');
        
        // Check BLE support
        if (!BLEClient.isSupported()) {
            uiManager.showError('ble-error', ERROR_MESSAGES.BLE_NOT_SUPPORTED);
        }

        console.log('[App] Ready');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // BLE section
        document.getElementById('ble-connect-btn').addEventListener('click', () => this.handleBleConnect());
        document.getElementById('ble-disconnect-btn').addEventListener('click', () => this.handleBleDisconnect());

        // Wi-Fi section
        document.getElementById('wifi-form').addEventListener('submit', (e) => this.handleWiFiSubmit(e));

        // Firmware section
        document.getElementById('firmware-file').addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('script-form').addEventListener('submit', (e) => this.handleFirmwareSubmit(e));

        // Debug section
        document.getElementById('debug-clear-btn').addEventListener('click', () => this.handleDebugClear());
        document.getElementById('debug-subscribe-btn').addEventListener('click', () => this.handleDebugSubscribe());
        document.getElementById('debug-send-cmd-btn').addEventListener('click', () => this.handleDebugSendCmd());

        // BLE client callbacks
        bleClient.onDisconnect = () => this.onBleDisconnect();
        bleClient.onLogReceived = (line) => this.onBleLogReceived(line);
        bleClient.onStatReceived = (stat) => this.onBleStatReceived(stat);
    }

    /**
     * Handle file select event (for validation)
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.logToUI('[Firmware] No file selected');
            return;
        }
        
        this.logToUI(`[Firmware] File selected: ${file.name}`);
        console.log('[App] File details:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString()
        });
        
        // Validate file
        if (!file.name.endsWith('.bin')) {
            this.logToUI('[Firmware] ⚠ Warning: Selected file is not a .bin file');
            uiManager.showError('script-error', 'Please select a .bin file');
            event.target.value = '';
            return;
        }
        
        if (file.size === 0) {
            this.logToUI('[Firmware] ✗ Error: File is empty');
            uiManager.showError('script-error', 'Selected file is empty');
            event.target.value = '';
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            this.logToUI(`[Firmware] ⚠ Warning: Large file detected (${Math.round(file.size/1024)}KB)`);
        }
        
        this.logToUI(`[Firmware] ✓ File validated: ${Math.round(file.size/1024)}KB`);
        uiManager.clearMessage('script-error');
    }

    /**
     * Handle BLE connect button click
     */
    async handleBleConnect() {
        try {
            this.logToUI('[BLE] Connecting to device...');
            uiManager.showError('ble-error', ''); // Clear previous errors
            
            await bleClient.connect();
            
            const deviceInfo = bleClient.getDeviceInfo();
            uiManager.updateBleStatus(true, deviceInfo);
            this.logToUI(`[BLE] Connected successfully: ${deviceInfo.name}`);
            uiManager.showSuccess('ble-error', SUCCESS_MESSAGES.BLE_CONNECTED);

            // Enable firmware upload section
            document.getElementById('firmware-file').disabled = false;
            document.getElementById('script-send-btn').disabled = false;

        } catch (error) {
            console.error('[App] BLE connect error:', error);
            uiManager.updateBleStatus(false);
            uiManager.showError('ble-error', error.message);
            this.logToUI(`[BLE] Connection failed: ${error.message}`);
        }
    }

    /**
     * Handle BLE disconnect
     */
    async handleBleDisconnect() {
        try {
            this.logToUI('[BLE] Disconnecting...');
            await bleClient.disconnect();
            uiManager.updateBleStatus(false);
            this.logToUI('[BLE] Disconnected');
        } catch (error) {
            console.error('[App] BLE disconnect error:', error);
            uiManager.showError('ble-error', error.message);
        }
    }

    /**
     * Handle Wi-Fi form submission
     */
    async handleWiFiSubmit(event) {
        event.preventDefault();
        
        try {
            const formValues = uiManager.getWiFiFormValues();
            
            if (!formValues.ssid) {
                throw new Error('SSID is required');
            }

            if (!bleClient.isConnected) {
                throw new Error('BLE not connected. Please connect to the device first.');
            }

            this.logToUI('[Wi-Fi] Sending configuration...');
            uiManager.clearMessage('wifi-error');
            
            this.logToUI(`[Wi-Fi] Provisioning: ${formValues.ssid}`);
            this.logToUI('[Wi-Fi] Sending via BLE...');
            
            // Send WiFi credentials via BLE provisioning service
            await bleClient.sendWiFiCredentials(formValues.ssid, formValues.password);
            
            this.logToUI('[Wi-Fi] ✓ BLE transmission complete!');
            uiManager.showSuccess('wifi-result', 'Wi-Fi configuration sent! Device will reboot and connect.');
            this.logToUI('[Wi-Fi] Device will reboot in 2 seconds.');
            this.logToUI('[Wi-Fi] After reboot, device will connect to WiFi.');
            this.logToUI('[Info] To update firmware, use BLE OTA (Firmware Update panel).');
            
            // Clear form
            uiManager.clearWiFiForm();

        } catch (error) {
            console.error('[App] Wi-Fi config error:', error);
            uiManager.showError('wifi-error', error.message);
            this.logToUI(`[Wi-Fi] Error: ${error.message}`);
        }
    }

    /**
     * Handle firmware upload submit
     */
    async handleFirmwareSubmit(event) {
        event.preventDefault();
        
        try {
            const fileInput = document.getElementById('firmware-file');
            const binFile = fileInput.files[0];
            
            this.logToUI('[Firmware] Starting upload process...');
            console.log('[App] File input element:', fileInput);
            console.log('[App] Files array:', fileInput.files);
            console.log('[App] Selected file:', binFile);
            
            if (!binFile) {
                throw new Error('Please select a firmware file');
            }

            if (!bleClient.isConnected) {
                throw new Error('BLE not connected. Please connect to the device first.');
            }

            // Step 1: Send OTA_MODE command to activate OTA mode
            this.logToUI('[Firmware] Activating OTA mode...');
            await bleClient.sendCommand('OTA_MODE');
            
            // Wait a bit for device to enter OTA mode
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Upload firmware
            this.logToUI(`[Firmware] Selected: ${binFile.name} (${Math.round(binFile.size/1024)}KB)`);
            this.logToUI('[Firmware] Uploading firmware to device via BLE...');
            uiManager.clearMessage('script-error');
            document.getElementById('script-send-btn').disabled = true;

            // Set progress callback (粗め表示)
            let lastUiPercent = -10;
            const progressCallback = (sent, total, percent) => {
                if (percent >= lastUiPercent + 10 || percent === 100) {
                    lastUiPercent = percent;
                    this.logToUI(`[Firmware] Progress: ${percent}% (${sent}/${total} bytes)`);
                }
            };

            const result = await firmwareClient.uploadFirmware(binFile, progressCallback);
            
            this.logToUI('[Firmware] ✓ Firmware uploaded successfully!');
            uiManager.showSuccess('script-result', result.message);
            this.logToUI('[Firmware] Device is rebooting with new firmware...');
            
            // Clear file input
            fileInput.value = '';

        } catch (error) {
            console.error('[App] Firmware upload error:', error);
            this.logToUI(`[Firmware] ✗ Upload failed: ${error.message}`);
            uiManager.showError('script-error', error.message);
        } finally {
            document.getElementById('script-send-btn').disabled = false;
        }
    }

    /**
     * Handle debug clear
     */
    handleDebugClear() {
        uiManager.clearDebugLog();
        this.logToUI('[System] Log cleared by user');
    }

    /**
     * Handle debug subscribe
     */
    async handleDebugSubscribe() {
        try {
            if (!bleClient.isConnected) {
                throw new Error('BLE not connected');
            }

            this.logToUI('[Debug] Subscribing to device logs...');
            
            // Logs will be received via onLogReceived callback
            uiManager.showSuccess('debug-error', 'Subscribed to device logs');
            this.logToUI('[Debug] Log subscription active');

        } catch (error) {
            console.error('[App] Debug subscribe error:', error);
            uiManager.showError('debug-error', error.message);
            this.logToUI(`[Debug] Subscription error: ${error.message}`);
        }
    }

    /**
     * Handle debug command send
     */
    async handleDebugSendCmd() {
        try {
            const command = document.getElementById('debug-command').value.trim();
            
            if (!command) {
                throw new Error('Please enter a command');
            }

            if (!bleClient.isConnected) {
                throw new Error('BLE not connected');
            }

            this.logToUI(`[Debug Command] Sending: ${command}`);
            await bleClient.sendCommand(command);
            
            uiManager.showSuccess('debug-error', SUCCESS_MESSAGES.COMMAND_SENT);
            document.getElementById('debug-command').value = '';

        } catch (error) {
            console.error('[App] Debug command error:', error);
            uiManager.showError('debug-error', error.message);
            this.logToUI(`[Debug] Command error: ${error.message}`);
        }
    }

    /**
     * BLE disconnection callback
     */
    onBleDisconnect() {
        uiManager.updateBleStatus(false);
        this.logToUI('[BLE] Device disconnected');
        uiManager.disableWiFiForm();
        uiManager.disableDebugSection();
        
        // Disable firmware upload section
        document.getElementById('firmware-file').disabled = true;
        document.getElementById('script-send-btn').disabled = true;
    }

    /**
     * BLE log received callback
     */
    onBleLogReceived(line) {
        this.logToUI(line);
    }

    /**
     * BLE stat received callback
     */
    onBleStatReceived(stat) {
        console.log('[App] Device stat:', stat);
        
        // Parse stat and check OTA mode
        // Expected format: STATE:BLE=1,WIFI=2,OTA_MODE=1,IP=192.168.x.x
        try {
            // Check OTA mode
            const otaMatch = stat.match(/OTA_MODE=(\d+)/);
            if (otaMatch) {
                const otaMode = parseInt(otaMatch[1]);
                if (otaMode === 1) {
                    document.getElementById('ota-status').textContent = '🟠 OTA Mode Active';
                    document.getElementById('ota-status').className = 'status-value connected';
                    this.logToUI('[OTA] Device is in OTA mode');
                } else {
                    document.getElementById('ota-status').textContent = '🟢 Normal Mode';
                    document.getElementById('ota-status').className = 'status-value';
                }
            }

            // Check WiFi IP (for information only)
            const ipMatch = stat.match(/IP=([0-9.]+)/);
            if (ipMatch && ipMatch[1] && ipMatch[1] !== '0.0.0.0') {
                const ip = ipMatch[1];
                uiManager.updateDeviceIp(ip);
                this.logToUI(`[WiFi] Device IP: ${ip}`);
            }
        } catch (error) {
            console.warn('[App] Stat parse error:', error);
        }
    }

    /**
     * Log message to UI
     */
    logToUI(message) {
        console.log(message);
        uiManager.logLine(message);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ESP32RemoteApp();
    console.log('[Main] Application started');
});
