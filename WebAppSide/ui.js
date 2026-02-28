// ============================================================================
// UI Module - Handles UI updates and interactions
// ============================================================================

class UIManager {
    constructor() {
        this.logLines = [];
    }

    /**
     * Update BLE connection status
     */
    updateBleStatus(isConnected, deviceInfo = null) {
        const statusEl = document.getElementById('ble-status');
        const disconnectBtn = document.getElementById('ble-disconnect-btn');
        const connectBtn = document.getElementById('ble-connect-btn');
        const deviceNameEl = document.getElementById('device-name');

        if (isConnected) {
            statusEl.textContent = '🟢 Connected';
            statusEl.className = 'status-value connected';
            disconnectBtn.disabled = false;
            connectBtn.disabled = true;
            
            if (deviceInfo && deviceInfo.name) {
                deviceNameEl.textContent = deviceInfo.name;
            }
            
            // Enable Wi-Fi form
            this.enableWiFiForm();
            this.enableDebugSection();
        } else {
            statusEl.textContent = '⚪ Disconnected';
            statusEl.className = 'status-value disconnected';
            disconnectBtn.disabled = true;
            connectBtn.disabled = false;
            deviceNameEl.textContent = '---';
            
            // Disable forms
            this.disableWiFiForm();
            this.disableDebugSection();
        }
    }

    /**
     * Update Wi-Fi device IP (for display only, BLE OTA is used)
     */
    updateDeviceIp(ip) {
        const ipEl = document.getElementById('device-ip');
        const otaIpEl = document.getElementById('ota-target-ip');
        
        ipEl.textContent = ip || '---';
        otaIpEl.textContent = ip || '---';
    }

    /**
     * Enable Wi-Fi form
     */
    enableWiFiForm() {
        document.getElementById('wifi-ssid').disabled = false;
        document.getElementById('wifi-password').disabled = false;
        document.getElementById('wifi-send-btn').disabled = false;
    }

    /**
     * Disable Wi-Fi form
     */
    disableWiFiForm() {
        document.getElementById('wifi-ssid').disabled = true;
        document.getElementById('wifi-password').disabled = true;
        document.getElementById('wifi-send-btn').disabled = true;
    }

    /**
     * Enable debug section
     */
    enableDebugSection() {
        document.getElementById('debug-subscribe-btn').disabled = false;
        document.getElementById('debug-command').disabled = false;
        document.getElementById('debug-send-cmd-btn').disabled = false;
    }

    /**
     * Disable debug section
     */
    disableDebugSection() {
        document.getElementById('debug-subscribe-btn').disabled = true;
        document.getElementById('debug-command').disabled = true;
        document.getElementById('debug-send-cmd-btn').disabled = true;
    }

    /**
     * Show error message
     */
    showError(sectionId, message) {
        const errorEl = document.getElementById(sectionId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
                errorEl.classList.remove('show');
            }, 8000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(sectionId, message) {
        const infoEl = document.getElementById(sectionId);
        if (infoEl) {
            infoEl.textContent = message;
            infoEl.classList.add('show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                infoEl.classList.remove('show');
            }, 5000);
        }
    }

    /**
     * Clear error/info message
     */
    clearMessage(sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
            el.classList.remove('show');
            el.textContent = '';
        }
    }

    /**
     * Log line to debug monitor
     */
    logLine(message) {
        const logEl = document.getElementById('debug-log');
        
        // Add to local log lines array
        this.logLines.push(message);

        // Keep only last 1000 lines
        if (this.logLines.length > UI_CONFIG.LOG_MAX_LINES) {
            this.logLines.shift();
        }

        // Create log line element
        const lineEl = document.createElement('p');
        lineEl.className = 'log-line';

        // Determine log level from message
        if (message.includes('[E]') || message.includes('ERROR')) {
            lineEl.classList.add('log-error');
        } else if (message.includes('[W]') || message.includes('WARN')) {
            lineEl.classList.add('log-warn');
        } else if (message.includes('[I]') || message.includes('INFO')) {
            lineEl.classList.add('log-info');
        } else if (message.includes('[D]') || message.includes('DEBUG')) {
            lineEl.classList.add('log-debug');
        } else {
            lineEl.classList.add('log-info');
        }

        lineEl.textContent = message;
        logEl.appendChild(lineEl);

        // Remove old lines if too many
        const lineEls = logEl.querySelectorAll('.log-line');
        while (lineEls.length > UI_CONFIG.LOG_MAX_LINES) {
            lineEls[0].remove();
        }

        // Auto-scroll to bottom
        logEl.scrollTop = logEl.scrollHeight;
    }

    /**
     * Clear debug log
     */
    clearDebugLog() {
        const logEl = document.getElementById('debug-log');
        logEl.innerHTML = '<p class="log-line log-info">[System] Log cleared</p>';
        this.logLines = [];
    }

    /**
     * Get form values
     */
    getWiFiFormValues() {
        return {
            ssid: document.getElementById('wifi-ssid').value,
            password: document.getElementById('wifi-password').value
        };
    }

    /**
     * Clear forms
     */
    clearWiFiForm() {
        document.getElementById('wifi-ssid').value = '';
        document.getElementById('wifi-password').value = '';
    }
}

// Global instance
const uiManager = new UIManager();
