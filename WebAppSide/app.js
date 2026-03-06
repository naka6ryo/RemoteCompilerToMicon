// ============================================================================
// Main Application Module
// Orchestrates BLE, OTA, and UI interactions
// ============================================================================

class ESP32RemoteApp {
    constructor() {
        this.selectedBinFile = null; // Store the selected binary file
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        console.log('[App] ============ INITIALIZING ============');
        console.log('[App] Initializing...');
        this.logToUI('[System] 🚀 Application initializing...');
        this.logToUI('[System] Version: 2.5 - File Upload Ready');
        
        this.setupEventListeners();
        this.logToUI('[System] ✅ Event listeners configured');
        console.log('[App] setupEventListeners completed');
        
        // Verify callback setup
        const isCallbackSet = typeof bleClient.onLogReceived === 'function';
        console.log('[App] Initial callback verification:', isCallbackSet ? 'OK' : 'FAILED');
        if (isCallbackSet) {
            this.logToUI('[System] ✅ BLE callbacks registered successfully');
        } else {
            this.logToUI('[System] ⚠️ WARNING: BLE callbacks NOT registered');
            uiManager.updateDebugStatus('ERROR: Callbacks not set', 'error');
        }
        
        // Check BLE support
        if (!BLEClient.isSupported()) {
            this.logToUI('[System] ⚠️ WARNING: BLE not supported on this browser');
            uiManager.showError('ble-error', ERROR_MESSAGES.BLE_NOT_SUPPORTED);
        } else {
            this.logToUI('[System] ✅ BLE support confirmed');
        }

        console.log('[App] ============ INITIALIZATION COMPLETE ============');
        this.logToUI('[System] ✅ Ready - Select a .bin file and connect to BLE device');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // BLE section
        const bleConnectBtn = document.getElementById('ble-connect-btn');
        if (bleConnectBtn) {
            bleConnectBtn.addEventListener('click', () => this.handleBleToggle());
            this.logToUI('[System] 🔌 BLE button listener configured');
        } else {
            console.error('[App] ERROR: ble-connect-btn not found');
            this.logToUI('[System] ❌ BLE button not found');
        }
        
        // Wi-Fi section - check if form exists
        const wifiForm = document.getElementById('wifi-form');
        if (wifiForm) {
            wifiForm.addEventListener('submit', (e) => this.handleWiFiSubmit(e));
            this.logToUI('[System] 📡 WiFi form listener configured');
        } else {
            console.warn('[App] WARNING: wifi-form element not found - Wi-Fi form will not submit');
            this.logToUI('[System] ⚠️ WiFi form not found in HTML');
        }
        
        const wifiResetBtn = document.getElementById('wifi-reset-btn');
        if (wifiResetBtn) {
            wifiResetBtn.addEventListener('click', () => this.handleFactoryReset());
            this.logToUI('[System] ✓ WiFi reset button configured');
        } else {
            console.warn('[App] WARNING: wifi-reset-btn not found');
        }

        // Firmware section
        const firmwareFile = document.getElementById('firmware-file');
        if (firmwareFile) {
            console.log('[App] Setting up firmware file input listener');
            this.logToUI('[System] 📁 Setting up file picker...');
            
            // Reset on page load
            firmwareFile.value = '';
            
            // Multiple event listeners for maximum browser compatibility
            const handleFileInput = (e) => {
                console.log('[App] File input event fired!');
                console.log('[App] Event type:', e.type);
                console.log('[App] Files count:', e.target.files.length);
                this.logToUI(`[FileInput] 📂 Event triggered (${e.type}) - Files: ${e.target.files.length}`);
                if (e.target.files.length > 0) {
                    console.log('[App] First file:', e.target.files[0].name);
                    this.logToUI(`[FileInput] ✓ File detected: ${e.target.files[0].name}`);
                }
                this.handleFileSelect(e);
            };
            
            // All major browsers + fallbacks
            firmwareFile.addEventListener('change', handleFileInput);
            this.logToUI('[System] ✓ change event listener added');
            
            firmwareFile.addEventListener('input', handleFileInput);
            this.logToUI('[System] ✓ input event listener added');
            
            // iPad specific workaround
            firmwareFile.addEventListener('touchend', () => {
                console.log('[App] File touchend detected - waiting for input');
                this.logToUI('[FileInput] 👆 Touch detected on file input');
                setTimeout(() => {
                    if (firmwareFile.files.length > 0) {
                        console.log('[App] Touch: file detected after delay');
                        this.logToUI(`[FileInput] ✓ File detected after touch: ${firmwareFile.files[0].name}`);
                        this.handleFileSelect({target: firmwareFile});
                    }
                }, 100);
            });
            this.logToUI('[System] ✓ touchend event listener added');
        } else {
            console.error('[App] ERROR: firmware-file element not found!');
            this.logToUI('[System] ❌ ERROR: firmware-file element NOT found!');
        }
        
        // File container click - trigger file picker
        const fileContainer = document.getElementById('firmware-file-container');
        if (fileContainer) {
            console.log('[App] Setting up file container click listener');
            this.logToUI('[System] 📂 Setting up file container listener...');
            fileContainer.addEventListener('click', (e) => {
                console.log('[App] File container clicked, target:', e.target.id);
                this.logToUI('[FileSelect] 🖱️ File container clicked');
                if (firmwareFile && e.target !== firmwareFile) {
                    console.log('[App] Triggering firmware file click');
                    this.logToUI('[FileSelect] 📂 Opening file picker dialog...');
                    firmwareFile.click();
                    console.log('[App] File click triggered, waiting for dialog...');
                }
            });
            this.logToUI('[System] ✓ File container click listener added');
            
            // Also handle direct clicks on the input
            fileContainer.addEventListener('touchstart', (e) => {
                console.log('[App] File container touchstart');
                this.logToUI('[FileSelect] 👆 Touch start on file container');
            });
        }
        
        // Handle upload button click - works on all platforms including iPhone
        const scriptSendBtn = document.getElementById('script-send-btn');
        if (scriptSendBtn) {
            scriptSendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[App] Upload button clicked');
                this.logToUI('[Upload] ▶️ Upload button pressed');
                this.handleFirmwareSubmit(e);
            });
            this.logToUI('[System] ✓ Upload button listener added');
        }
        
        // Try to set up form submit as well for compatibility
        const scriptForm = document.getElementById('script-form');
        if (scriptForm) {
            scriptForm.addEventListener('submit', (e) => this.handleFirmwareSubmit(e));
            this.logToUI('[System] ✓ Form submit listener added');
        } else {
            console.warn('[App] WARNING: script-form not found');
        }

        // Debug section
        const debugClearBtn = document.getElementById('debug-clear-btn');
        if (debugClearBtn) {
            debugClearBtn.addEventListener('click', () => this.handleDebugClear());
            this.logToUI('[System] ✓ Debug listeners configured');
        }
        
        const debugSubscribeBtn = document.getElementById('debug-subscribe-btn');
        if (debugSubscribeBtn) {
            debugSubscribeBtn.addEventListener('click', () => this.handleDebugSubscribe());
        }
        
        const debugSendCmdBtn = document.getElementById('debug-send-cmd-btn');
        if (debugSendCmdBtn) {
            debugSendCmdBtn.addEventListener('click', () => this.handleDebugSendCmd());
        }

        // BLE client callbacks
        bleClient.onDisconnect = () => this.onBleDisconnect();
        bleClient.onLogReceived = (line) => this.onBleLogReceived(line);
        bleClient.onStatReceived = (stat) => this.onBleStatReceived(stat);
        
        console.log('[App] BLE callbacks configured');
        console.log('[App] bleClient.onLogReceived:', bleClient.onLogReceived);
        this.logToUI('[System] ✓ BLE callbacks configured');
        
        // Update UI to show callback is set
        uiManager.updateCallbackStatus(true);
        uiManager.updateDebugStatus('Callbacks configured', 'success');
    }

    /**
     * Handle file select event (for validation)
     */
    handleFileSelect(event) {
        try {
            console.log('[App] ============ FILE SELECT EVENT ============');
            const files = event.target && event.target.files;
            const file = files && files[0];
            
            console.log('[App] File select event triggered');
            console.log('[App] Files object:', files);
            console.log('[App] Files length:', files ? files.length : 'N/A');
            this.logToUI('[FileSelect] 📂 File dialog response received');
            this.logToUI(`[FileSelect] Files in selection: ${files ? files.length : 0}`);
            
            if (!file) {
                console.log('[App] No file selected');
                this.logToUI('❌ [FileSelect] No file selected - Please choose a .BIN file');
                uiManager.updateFirmwareFileSelection(null, false);
                document.getElementById('script-send-btn').disabled = true;
                return;
            }
            
            console.log('[App] File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
            const fileSizeKB = Math.round(file.size / 1024);
            
            // Update UI immediately
            this.logToUI(`✅ [FileSelect] File selected: ${file.name}`);
            this.logToUI(`📊 [FileSelect] Size: ${fileSizeKB}KB | Type: ${file.type}`);
            uiManager.updateFirmwareFileSelection(file.name, true);
            
            console.log('[App] File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toLocaleString()
            });
            
            // Validate file
            if (!file.name.endsWith('.bin')) {
                console.log('[App] File validation failed: not .bin format');
                this.logToUI(`⚠️ [FileSelect] File validation failed: Not a .bin file`);
                this.logToUI(`[FileSelect] Expected: *.bin | Got: ${file.name}`);
                uiManager.showError('script-error', 'Please select a .bin file');
                uiManager.updateFirmwareFileSelection(file.name, false);
                document.getElementById('script-send-btn').disabled = true;
                event.target.value = '';
                return;
            }
            
            if (file.size === 0) {
                console.log('[App] File validation failed: empty file');
                this.logToUI(`❌ [FileSelect] File is empty (0 bytes) - Invalid firmware file`);
                uiManager.showError('script-error', 'Selected file is empty');
                uiManager.updateFirmwareFileSelection(file.name, false);
                document.getElementById('script-send-btn').disabled = true;
                event.target.value = '';
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                console.log('[App] Large file warning');
                this.logToUI(`⚠️ [FileSelect] Large file detected: ${fileSizeKB}KB (will take longer)`);
            }
            
            console.log('[App] File validation passed');
            this.logToUI(`✅ [FileSelect] File validation PASSED`);
            this.logToUI(`💾 [FileSelect] Ready to upload: ${file.name} (${fileSizeKB}KB)`);
            this.logToUI(`📌 [FileSelect] Next: Click "Upload" button to start OTA`);
            uiManager.clearMessage('script-error');
            
            // Save file for later use
            this.selectedBinFile = file;
            console.log('[App] File saved to this.selectedBinFile for upload');
            this.logToUI(`[FileSelect] ✓ File cached in memory`);
            
            // Update UI to show file is selected
            uiManager.updateFirmwareFileSelection(file.name, true);
            
            // Enable upload button when file is valid
            console.log('[App] Enabling upload button');
            const uploadBtn = document.getElementById('script-send-btn');
            uploadBtn.disabled = false;
            uiManager.setFirmwareButtonState('ready');
            this.logToUI(`✅ [FileSelect] Upload button ENABLED - Ready to proceed`);
            console.log('[App] Upload button enabled');
            console.log('[App] ============ FILE SELECT COMPLETE ============');
            
        } catch (error) {
            console.error('[App] Error in handleFileSelect:', error);
            console.error('[App] Stack trace:', error.stack);
            this.logToUI(`❌ [FileSelect] ERROR: ${error.message}`);
            this.logToUI(`[FileSelect] Stack: ${error.stack}`);
        }
    }

    /**
     * Handle BLE connect/disconnect toggle
     */
    async handleBleToggle() {
        if (bleClient.isConnected) {
            await this.handleBleDisconnect();
        } else {
            await this.handleBleConnect();
        }
    }

    /**
     * Handle BLE connect button click
     */
    async handleBleConnect() {
        try {
            this.logToUI('🔄 [BLE] Initiating connection...');
            uiManager.showError('ble-error', ''); // Clear previous errors
            
            this.logToUI('📡 [BLE] Searching for compatible device...');
            await bleClient.connect();
            
            // Re-verify callbacks are set after connection
            if (!bleClient.onLogReceived) {
                console.warn('[App] Callback not set after connection, re-setting...');
                bleClient.onLogReceived = (line) => this.onBleLogReceived(line);
                uiManager.updateCallbackStatus(true);
                this.logToUI('[System] Callbacks re-initialized');
            }
            
            // Verify callback status
            const isCallbackSet = typeof bleClient.onLogReceived === 'function';
            console.log('[App] BLE callback verification:', isCallbackSet ? 'OK' : 'FAILED');
            uiManager.updateCallbackStatus(isCallbackSet);
            
            const deviceInfo = bleClient.getDeviceInfo();
            this.logToUI(`✅ [BLE] Connection established: ${deviceInfo.name}`);
            this.logToUI(`📱 [BLE] Device ID: ${deviceInfo.id}`);
            
            uiManager.updateBleStatus(true, deviceInfo);

            // Initialize OTA display
            uiManager.updateOTAProgress(0);
            uiManager.updateOTAStatus('IDLE');
            
            uiManager.showSuccess('ble-error', SUCCESS_MESSAGES.BLE_CONNECTED);
            uiManager.updateDebugStatus('BLE Connected - Ready', 'success');

            // File input is always enabled for iPhone compatibility
            // Validation is done during upload
            
            // Enable flash button only if file is already selected
            const fileInput = document.getElementById('firmware-file');
            console.log('[App] Checking file selection on BLE connect:', fileInput.files.length > 0);
            if (fileInput.files.length > 0) {
                console.log('[App] File already selected, enabling button');
                uiManager.setFirmwareButtonState('ready');
                this.logToUI('🚀 [BLE] File already selected - Flash button is ready!');
            } else {
                console.log('[App] No file selected yet, disabling button');
                uiManager.setFirmwareButtonState('disabled');
                this.logToUI('📁 [BLE] Ready - Now select a firmware file to upload');
            }

        } catch (error) {
            console.error('[App] BLE connect error:', error);
            uiManager.updateBleStatus(false);
            uiManager.showError('ble-error', error.message);
            this.logToUI(`❌ [BLE] Connection failed: ${error.message}`);
            uiManager.updateDebugStatus('BLE Connection Failed', 'error');
        }
    }

    /**
     * Handle BLE disconnect
     */
    async handleBleDisconnect() {
        try {
            this.logToUI('🔄 [BLE] Disconnecting...');
            await bleClient.disconnect();
            uiManager.updateBleStatus(false);
            this.logToUI('✅ [BLE] Disconnected from device');
            uiManager.updateDebugStatus('BLE Disconnected', 'info');
            
            // Reset upload UI - but keep file selection for iPhone UX
            // User can select file again without re-opening file picker
            uiManager.setFirmwareButtonState('disabled');
            uiManager.updateOTAProgress(0);
            uiManager.updateOTAStatus('IDLE');
            
            this.logToUI('📁 [Firmware] Ready for next connection');
        } catch (error) {
            console.error('[App] BLE disconnect error:', error);
            uiManager.showError('ble-error', error.message);
            uiManager.updateDebugStatus('BLE Disconnect Error', 'error');
            this.logToUI(`❌ [BLE] Disconnect error: ${error.message}`);
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
            // Note: Device will reboot after receiving, which causes disconnection
            let configSent = false;
            try {
                await bleClient.sendWiFiCredentials(formValues.ssid, formValues.password);
                configSent = true;
            } catch (error) {
                // Check if error is due to device rebooting (expected behavior)
                if (error.message && error.message.includes('GATT Server is disconnected')) {
                    // Device rebooted - this is expected and means success
                    this.logToUI('[Wi-Fi] ℹ️  Device disconnected (expected - device is rebooting)');
                    configSent = true;
                } else {
                    // Real error - re-throw
                    throw error;
                }
            }
            
            if (configSent) {
                this.logToUI('[Wi-Fi] ✓ BLE transmission complete!');
                uiManager.showSuccess('wifi-result', 'Wi-Fi configuration sent! Device will reboot automatically.');
                this.logToUI('[Wi-Fi] ✅ Configuration saved to device');
                this.logToUI('[Wi-Fi] 🔄 Device rebooting now...');
                this.logToUI('[Wi-Fi] 📡 After reboot, device will connect to WiFi');
                this.logToUI('[Wi-Fi] ⚠️  BLE connection lost (device rebooting)');
                this.logToUI('[Info] To update firmware later, reconnect via BLE OTA');
                
                // Clear form
                uiManager.clearWiFiForm();
            }

        } catch (error) {
            console.error('[App] Wi-Fi config error:', error);
            
            // Check specific error type
            if (error.code === 'PROVISION_SERVICE_NOT_AVAILABLE') {
                // Device may be using old firmware or is not responding
                uiManager.showFactoryResetOption();
                this.logToUI('[Wi-Fi] ⚠ Provisioning service not available on device');
                this.logToUI('[Wi-Fi] ℹ Please try one of these options:');
                this.logToUI('[Wi-Fi] 1. Click the "Reset Device" button to enable WiFi provisioning');
                this.logToUI('[Wi-Fi] 2. Or check if the device firmware is up to date');
            } else if (error.message && error.message.includes('GATT')) {
                // Check if it's a disconnection error (which might have slipped through)
                if (error.message.includes('disconnected')) {
                    // This might be a late disconnection - treat as potential success
                    this.logToUI('[Wi-Fi] ⚠️  Device disconnected unexpectedly');
                    this.logToUI('[Wi-Fi] ℹ️  If device rebooted, configuration was successful');
                    this.logToUI('[Wi-Fi] ℹ️  Please check if device connects to WiFi');
                    uiManager.showError('wifi-error', 'Device disconnected - check if WiFi connected');
                } else {
                    // GATT operation failed - likely BLE communication issue
                    uiManager.showError('wifi-error', error.message);
                    this.logToUI(`[Wi-Fi] ❌ Error: ${error.message}`);
                    this.logToUI('[Wi-Fi] 💡 Possible causes:');
                    this.logToUI('[Wi-Fi]   • BLE connection is unstable - try reconnecting');
                    this.logToUI('[Wi-Fi]   • Data size too large (SSID+password > 512 bytes)');
                    this.logToUI('[Wi-Fi]   • Device is busy processing another operation');
                    this.logToUI('[Wi-Fi]   • Device firmware may need updating');
                    this.logToUI('[Wi-Fi] 🔧 Suggested solutions:');
                    this.logToUI('[Wi-Fi]   1. Disconnect and reconnect BLE');
                    this.logToUI('[Wi-Fi]   2. Use a shorter SSID or password');
                    this.logToUI('[Wi-Fi]   3. Wait a few seconds and try again');
                    this.logToUI('[Wi-Fi]   4. Check browser console for detailed error info');
                }
            } else {
                // Other error (timeout, invalid credentials, etc.)
                uiManager.showError('wifi-error', error.message);
                this.logToUI(`[Wi-Fi] Error: ${error.message}`);
                this.logToUI('[Wi-Fi] ℹ Please verify SSID and password are correct');
            }
        }
    }

    /**
     * Handle device factory reset
     */
    async handleFactoryReset() {
        try {
            if (!bleClient.isConnected) {
                throw new Error('BLE not connected');
            }

            // Confirm with user
            const confirmed = confirm(
                'この操作はデバイスをリセットし、WiFiプロビジョニング状態に戻ります。\n\n' +
                'リセットしてもよろしいですか？\n\n' +
                '(OK: リセット実行 / キャンセル: 中止)'
            );

            if (!confirmed) {
                this.logToUI('[Factory Reset] Cancelled by user');
                return;
            }

            this.logToUI('[Factory Reset] Sending reset command to device...');
            uiManager.hideFactoryResetOption();
            
            // Send factory reset command
            await bleClient.sendCommand('FACTORY_RESET');
            
            this.logToUI('[Factory Reset] ✓ Reset command sent!');
            this.logToUI('[Factory Reset] Device will reboot in 2 seconds...');
            this.logToUI('[Factory Reset] ℹ Your BLE connection will be lost during the reboot');
            this.logToUI('[Factory Reset] ⏳ Wait 10 seconds, then reconnect to the device');
            this.logToUI('[Factory Reset] After reconnection, you can configure WiFi');

        } catch (error) {
            console.error('[App] Factory reset error:', error);
            uiManager.showError('wifi-error', `Factory reset failed: ${error.message}`);
            this.logToUI(`[Factory Reset] Error: ${error.message}`);
        }
    }

    /**
     * Handle firmware upload submit
     */
    async handleFirmwareSubmit(event) {
        event.preventDefault();
        
        try {
            console.log('[App] ============ FIRMWARE UPLOAD START ============');
            console.log('[App] handleFirmwareSubmit called');
            this.logToUI('🚀 [Firmware] Starting firmware upload process...');
            
            // Check if file is selected (try multiple sources for fallback)
            let binFile = this.selectedBinFile;
            
            // Fallback 1: Check file input directly
            if (!binFile) {
                const fileInput = document.getElementById('firmware-file');
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    console.log('[App] Fallback: file found in DOM input');
                    binFile = fileInput.files[0];
                    this.selectedBinFile = binFile; // Cache it
                }
            }
            
            if (!binFile) {
                console.log('[App] Upload failed: no file selected');
                this.logToUI('❌ [Firmware] ERROR: No file selected!');
                this.logToUI('💡 [Firmware] Click on the file area to select a .bin firmware file');
                throw new Error('Please select a firmware file first');
            }

            console.log('[App] File selected for upload:', binFile.name, 'Size:', binFile.size);
            this.logToUI(`📦 [Firmware] File: ${binFile.name} (${Math.round(binFile.size/1024)}KB)`);

            // Step 1: Verify BLE connection
            if (!bleClient.isConnected) {
                console.log('[App] Upload failed: BLE not connected');
                this.logToUI('❌ [Firmware] ERROR: Device not connected!');
                this.logToUI('💡 [Firmware] Click "Sync" to connect to a BLE device first');
                throw new Error('Please connect to BLE device first');
            }

            console.log('[App] BLE connected, proceeding with upload');
            this.logToUI('✅ [Firmware] Device connected - starting OTA');

            // Step 2: Send OTA_MODE command to activate OTA mode
            console.log('[App] Activating OTA mode...');
            this.logToUI('⚙️ [OTA] Switching device to OTA mode...');
            uiManager.updateOTAStatus('ACTIVATING');
            await bleClient.sendCommand('OTA_MODE');
            this.logToUI('⏳ [OTA] Device switching to OTA mode...');
            
            // Wait a bit for device to enter OTA mode
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 3: Upload firmware via BLE
            console.log('[App] Starting firmware upload:', binFile.name);
            this.logToUI(`📡 [Firmware] Uploading firmware to device...`);
            uiManager.clearMessage('script-error');
            uiManager.setFirmwareButtonState('uploading');
            uiManager.updateOTAStatus('UPLOADING');
            uiManager.updateOTAProgress(0);

            // Set progress callback (粗め表示)
            let lastUiPercent = -10;
            const progressCallback = (sent, total, percent) => {
                // Update progress bar in real-time
                uiManager.updateOTAProgress(percent);
                
                if (percent >= lastUiPercent + 10 || percent === 100) {
                    lastUiPercent = percent;
                    this.logToUI(`📊 [Firmware] Progress: ${percent}% (${Math.round(sent/1024)}/${Math.round(total/1024)}KB)`);
                }
            };

            const result = await firmwareClient.uploadFirmware(binFile, progressCallback);
            
            this.logToUI('✅ [Firmware] ✓ Firmware uploaded successfully!');
            this.logToUI('🔄 [Firmware] Device is rebooting with new firmware...');
            this.logToUI('⏳ [Firmware] BLE connection will be lost during reboot');
            this.logToUI('📱 [Firmware] You can reconnect after ~5-10 seconds');
            
            uiManager.updateOTAStatus('COMPLETE');
            uiManager.updateOTAProgress(100);
            uiManager.showSuccess('script-result', result.message);
            
            // Clear file input and reset button
            const fileInput = document.getElementById('firmware-file');
            if (fileInput) {
                fileInput.value = '';
            }
            this.selectedBinFile = null;
            uiManager.updateFirmwareFileSelection(null, false);
            uiManager.setFirmwareButtonState('disabled');
            
            // Reset status after 3 seconds
            setTimeout(() => {
                uiManager.updateOTAStatus('IDLE');
                uiManager.updateOTAProgress(0);
            }, 3000);

        } catch (error) {
            console.error('[App] Firmware upload error:', error);
            console.error('[App] Error message:', error.message);
            console.error('[App] Error stack:', error.stack);
            
            this.logToUI(`❌ [Firmware] Upload failed: ${error.message}`);
            this.logToUI('💡 [Firmware] Troubleshooting:');
            this.logToUI('  1. Check BLE connection with device');
            this.logToUI('  2. Try selecting a different .bin file');
            this.logToUI('  3. Refresh the page and try again');
            
            uiManager.showError('script-error', error.message);
            uiManager.updateOTAStatus('FAILED');
            
            // Reset button state - keep file selected if available
            const fileInput = document.getElementById('firmware-file');
            if (fileInput && bleClient.isConnected && fileInput.files.length > 0) {
                console.log('[App] Resetting button to ready state');
                uiManager.setFirmwareButtonState('ready');
            } else {
                console.log('[App] Resetting button to disabled state');
                uiManager.setFirmwareButtonState('disabled');
            }
        }
        console.log('[App] ============ FIRMWARE UPLOAD END ============');
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
        uiManager.updateDebugStatus('Device Disconnected', 'warning');
        
        // Disable upload button but keep file selection for UX
        uiManager.setFirmwareButtonState('disabled');
        uiManager.updateOTAProgress(0);
        uiManager.updateOTAStatus('IDLE');
    }

    /**
     * BLE log received callback
     */
    onBleLogReceived(line) {
        console.log('[App] onBleLogReceived called with:', line);
        uiManager.updateDebugStatus('App callback received', 'success');
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
                    uiManager.updateOTAStatus('OTA_MODE');
                    this.logToUI('[OTA] Device is in OTA mode');
                } else {
                    uiManager.updateOTAStatus('IDLE');
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
        
        // Safety check: verify uiManager exists
        if (!uiManager) {
            console.error('[App] CRITICAL: uiManager not initialized!');
            // Fallback: display error prominently
            const errorDiv = document.createElement('div');
            errorDiv.textContent = '[CRITICAL ERROR] uiManager not initialized\nMessage: ' + message;
            errorDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #cc0000; color: white; padding: 15px; z-index: 99999; font-family: monospace; font-size: 12px; max-width: 400px; white-space: pre-wrap; border: 2px solid #ff0000; border-radius: 4px; font-weight: bold;';
            document.body.appendChild(errorDiv);
            setTimeout(() => {
                try { errorDiv.remove(); } catch(e) {}
            }, 5000);
            return;
        }
        
        try {
            uiManager.logLine(message);
        } catch (error) {
            console.error('[App] Error calling uiManager.logLine():', error);
            // Fallback display
            const errorDiv = document.createElement('div');
            errorDiv.textContent = '[LOG ERROR] ' + error.message + '\nMessage: ' + message;
            errorDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #ff6b6b; color: white; padding: 15px; z-index: 99999; font-family: monospace; font-size: 12px; max-width: 400px; white-space: pre-wrap; border: 2px solid #ff0000; border-radius: 4px;';
            document.body.appendChild(errorDiv);
            setTimeout(() => {
                try { errorDiv.remove(); } catch(e) {}
            }, 3000);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Main] DOM ContentLoaded event fired');
    
    // Show loading message directly on screen as fallback
    const debugMsg = document.createElement('div');
    debugMsg.id = 'startup-message';
    debugMsg.textContent = '[INIT] Application starting...';
    debugMsg.style.cssText = 'position: fixed; bottom: 10px; left: 10px; background: #4CAF50; color: white; padding: 10px; font-family: monospace; font-size: 11px; z-index: 9999; border-radius: 4px;';
    document.body.appendChild(debugMsg);
    
    try {
        window.app = new ESP32RemoteApp();
        console.log('[Main] Application started successfully');
        debugMsg.textContent = '[INIT] ✓ Application ready';
        debugMsg.style.background = '#2196F3';
        setTimeout(() => {
            try { debugMsg.remove(); } catch(e) {}
        }, 2000);
    } catch (error) {
        console.error('[Main] FATAL ERROR:', error);
        debugMsg.textContent = '[FATAL] ' + error.message;
        debugMsg.style.background = '#f44336';
    }
});
