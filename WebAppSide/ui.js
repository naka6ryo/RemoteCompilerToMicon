// ============================================================================
// UI Module - Handles UI updates and interactions
// ============================================================================

class UIManager {
    constructor() {
        this.logLines = [];
        this.bleRxCount = 0;
        this.uiLogCount = 0;
    }

    /**
     * Update debug status display
     */
    updateDebugStatus(status, type = 'info') {
        const statusEl = document.getElementById('debug-status');
        if (statusEl) {
            statusEl.textContent = status;
            // Color based on type
            if (type === 'error') {
                statusEl.className = 'text-red-400';
            } else if (type === 'success') {
                statusEl.className = 'text-green-400';
            } else if (type === 'warning') {
                statusEl.className = 'text-yellow-400';
            } else {
                statusEl.className = 'text-slate-400';
            }
        }
    }

    /**
     * Update BLE RX counter
     */
    incrementBleRx() {
        this.bleRxCount++;
        const el = document.getElementById('ble-rx-count');
        if (el) {
            el.textContent = this.bleRxCount;
        }
        this.updateDebugStatus('BLE Data Received', 'success');
    }

    /**
     * Update callback status
     */
    updateCallbackStatus(isSet) {
        const el = document.getElementById('callback-status');
        if (el) {
            if (isSet) {
                el.textContent = 'OK';
                el.className = 'text-green-400 font-bold';
            } else {
                el.textContent = 'NOT SET';
                el.className = 'text-red-400';
            }
        }
    }

    /**
     * Update UI log counter
     */
    updateUiLogCount() {
        const el = document.getElementById('ui-log-count');
        if (el) {
            el.textContent = this.uiLogCount;
        }
    }

    /**
     * Update BLE connection status
     */
    updateBleStatus(isConnected, deviceInfo = null) {
        const statusEl = document.getElementById('ble-status');
        const dotEl = statusEl.querySelector('div:first-child');
        const textEl = statusEl.querySelector('span');
        const btnEl = document.getElementById('ble-connect-btn');
        const btnTextEl = btnEl.querySelector('span');
        const deviceNameEl = document.getElementById('device-name');

        if (isConnected) {
            // Update status display
            dotEl.className = 'w-2 h-2 bg-green-500 rounded-full';
            textEl.textContent = 'ONLINE';
            textEl.className = 'font-teko text-sm text-green-600 leading-none';
            
            // Update button text (preserve the span structure for rotated text)
            if (btnTextEl) {
                btnTextEl.textContent = 'Desync';
            } else {
                btnEl.textContent = 'Desync';
            }
            btnEl.classList.remove('btn-hdd');
            btnEl.classList.add('btn-hdd-secondary');
            
            if (deviceInfo && deviceInfo.name) {
                deviceNameEl.textContent = deviceInfo.name;
            }
            
            // Enable Wi-Fi form
            this.enableWiFiForm();
            this.enableDebugSection();
        } else {
            // Update status display
            dotEl.className = 'w-2 h-2 bg-slate-300 rounded-full animate-blink';
            textEl.textContent = 'OFFLINE';
            textEl.className = 'font-teko text-sm text-slate-400 leading-none';
            
            // Update button text (preserve the span structure for rotated text)
            if (btnTextEl) {
                btnTextEl.textContent = 'Sync';
            } else {
                btnEl.textContent = 'Sync';
            }
            btnEl.classList.remove('btn-hdd-secondary');
            btnEl.classList.add('btn-hdd');
            
            deviceNameEl.textContent = 'UNLINKED';
            
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
        const debugCommand = document.getElementById('debug-command');
        const debugSendBtn = document.getElementById('debug-send-cmd-btn');
        if (debugCommand) debugCommand.disabled = false;
        if (debugSendBtn) debugSendBtn.disabled = false;
    }

    /**
     * Disable debug section
     */
    disableDebugSection() {
        const debugCommand = document.getElementById('debug-command');
        const debugSendBtn = document.getElementById('debug-send-cmd-btn');
        if (debugCommand) debugCommand.disabled = true;
        if (debugSendBtn) debugSendBtn.disabled = true;
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
        this.updateDebugStatus('Writing to UI...', 'info');
        
        const logEl = document.getElementById('debug-log');
        if (!logEl) {
            console.error('[UI] CRITICAL ERROR: debug-log element not found!');
            console.error('[UI] Message was:', message);
            // Fallback: display error prominently on screen
            const errorDiv = document.createElement('div');
            errorDiv.textContent = '[UI ERROR] debug-log element missing: ' + message;
            errorDiv.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #ff4444; color: white; padding: 15px; z-index: 99999; font-family: monospace; font-size: 12px; max-width: 400px; white-space: pre-wrap; border: 2px solid #ff0000; border-radius: 4px;';
            document.body.appendChild(errorDiv);
            setTimeout(() => {
                try { errorDiv.remove(); } catch(e) {}
            }, 3000);
            this.updateDebugStatus('ERROR: debug-log not found!', 'error');
            return;
        }
        
        console.log('[UI] logLine called with:', message); // Debug log
        
        // Add to local log lines array
        this.logLines.push(message);

        // Keep only last 1000 lines
        if (this.logLines.length > UI_CONFIG.LOG_MAX_LINES) {
            this.logLines.shift();
        }

        // Remove initial placeholder message on first real message
        const initialMsg = logEl.querySelector('[data-initial="true"]');
        if (initialMsg) {
            console.log('[UI] Removing initial placeholder message');
            initialMsg.remove();
        }

        // Create log line element
        const lineEl = document.createElement('div');
        lineEl.className = 'border-l-2 pl-2 leading-tight';

        // Determine log level and styling
        if (message.includes('[E]') || message.includes('ERROR')) {
            lineEl.className += ' opacity-100 border-l-[var(--hdd-pink)] text-[var(--hdd-pink)] font-bold bg-white/50';
        } else if (message.includes('[W]') || message.includes('WARN')) {
            lineEl.className += ' opacity-80 border-l-[var(--hdd-orange)] text-[var(--hdd-orange)]';
        } else if (message.includes('[I]') || message.includes('INFO')) {
            lineEl.className += ' opacity-70 border-l-[var(--hdd-green)] text-slate-700';
        } else if (message.includes('[D]') || message.includes('DEBUG')) {
            lineEl.className += ' opacity-60 border-l-slate-400 text-slate-600';
        } else {
            lineEl.className += ' opacity-70 border-l-slate-300 text-slate-700';
        }

        lineEl.textContent = message;
        
        try {
            logEl.appendChild(lineEl);
            console.log('[UI] Log line appended successfully');
            
            // Increment UI log count
            this.uiLogCount++;
            this.updateUiLogCount();
            this.updateDebugStatus('Log written successfully', 'success');
        } catch (error) {
            console.error('[UI] Error appending log line:', error);
            this.updateDebugStatus('ERROR: ' + error.message, 'error');
            // Fallback display
            const errorDiv = document.createElement('div');
            errorDiv.textContent = '[APPEND ERROR] ' + error.message + ': ' + message;
            errorDiv.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #ff4444; color: white; padding: 15px; z-index: 99999; font-family: monospace; font-size: 12px; max-width: 400px; white-space: pre-wrap; border: 2px solid #ff0000; border-radius: 4px;';
            document.body.appendChild(errorDiv);
            setTimeout(() => {
                try { errorDiv.remove(); } catch(e) {}
            }, 3000);
            return;
        }

        // Remove old lines if too many
        const allLines = logEl.querySelectorAll('div');
        while (allLines.length > UI_CONFIG.LOG_MAX_LINES) {
            allLines[0].remove();
        }

        // Scroll to bottom - find the scrollable parent
        // The scrollable parent is: debug-log -> parent (flex-grow overflow-y-auto) -> scroll there
        const scrollableParent = logEl.parentElement;
        if (scrollableParent) {
            console.log('[UI] Scrolling to bottom');
            // Use setTimeout to ensure DOM has updated before scrolling
            setTimeout(() => {
                scrollableParent.scrollTop = scrollableParent.scrollHeight;
                console.log('[UI] Scroll position:', scrollableParent.scrollTop, 'of', scrollableParent.scrollHeight);
            }, 0);
        } else {
            console.warn('[UI] scrollableParent not found');
            this.updateDebugStatus('WARN: scroll parent not found', 'warning');
        }
    }

    /**
     * Clear debug log
     */
    clearDebugLog() {
        const logEl = document.getElementById('debug-log');
        if (!logEl) return;
        
        logEl.innerHTML = '<div class="opacity-40 border-l-2 border-slate-300 pl-2" data-initial="true">&gt; Log cleared by user</div>';
        this.logLines = [];
        
        // Reset UI log counter
        this.uiLogCount = 0;
        this.updateUiLogCount();
        this.updateDebugStatus('Log cleared', 'info');
        
        // Scroll to bottom after clearing
        // Find the scrollable container: look for overflow-y-auto ancestor
        let scrollContainer = logEl.parentElement;
        while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto')) {
            scrollContainer = scrollContainer.parentElement;
        }
        
        if (scrollContainer) {
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 0);
        }
    }

    /**
     * Update OTA progress
     */
    updateOTAProgress(percent) {
        const progressEl = document.getElementById('upload-circle');
        if (progressEl) {
            progressEl.style.setProperty('--progress', percent);
        }
        
        // Update icon based on progress
        const icon = document.getElementById('upload-icon');
        if (icon) {
            if (percent === 0) {
                icon.textContent = 'memory';
                icon.className = 'material-symbols-outlined text-sm text-slate-400';
            } else if (percent < 100) {
                icon.textContent = 'cloud_upload';
                icon.className = 'material-symbols-outlined text-sm text-blue-500 animate-pulse';
            } else {
                icon.textContent = 'check_circle';
                icon.className = 'material-symbols-outlined text-sm text-green-500';
            }
        }
    }

    /**
     * Update OTA status
     */
    updateOTAStatus(status) {
        const statusEl = document.getElementById('ota-status');
        if (statusEl) {
            // Format status with colors
            let displayStatus = status;
            let statusClass = '';
            
            switch (status) {
                case 'IDLE':
                    statusClass = 'text-slate-500';
                    displayStatus = '🔲 IDLE';
                    break;
                case 'ACTIVATING':
                    statusClass = 'text-yellow-600 font-bold';
                    displayStatus = '⚙️ ACTIVATING...';
                    break;
                case 'UPLOADING':
                    statusClass = 'text-blue-600 font-bold animate-pulse';
                    displayStatus = '📤 UPLOADING...';
                    break;
                case 'COMPLETE':
                    statusClass = 'text-green-600 font-bold';
                    displayStatus = '✓ COMPLETE';
                    break;
                case 'FAILED':
                    statusClass = 'text-red-600 font-bold';
                    displayStatus = '✗ FAILED';
                    break;
                default:
                    statusClass = 'text-slate-800';
                    displayStatus = status;
            }
            
            statusEl.textContent = displayStatus;
            statusEl.className = statusClass;
        }
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

    /**
     * Show factory reset option
     */
    showFactoryResetOption() {
        const container = document.getElementById('wifi-reset-container');
        if (container) {
            container.classList.remove('hidden');
        }
    }

    /**
     * Hide factory reset option
     */
    hideFactoryResetOption() {
        const container = document.getElementById('wifi-reset-container');
        if (container) {
            container.classList.add('hidden');
        }
    }

    /**
     * Update firmware file selection status
     */
    updateFirmwareFileSelection(fileName, isValid) {
        const container = document.getElementById('firmware-file-container');
        const label = document.getElementById('firmware-file-label');
        const status = document.getElementById('firmware-file-status');
        
        if (!container) return;
        
        if (fileName && isValid) {
            // Show selected file with success state
            const displayName = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
            label.textContent = displayName;
            label.title = fileName; // Show full name on hover
            status.classList.remove('hidden');
            
            // Update container border color to indicate success
            container.classList.remove('border-slate-300');
            container.classList.add('border-green-400', 'bg-green-50');
        } else {
            // Reset to default state
            label.textContent = 'Select .BIN';
            label.title = '';
            status.classList.add('hidden');
            container.classList.remove('border-green-400', 'bg-green-50');
            container.classList.add('border-slate-300');
        }
    }

    /**
     * Set firmware upload button state
     */
    setFirmwareButtonState(state) {
        const btn = document.getElementById('script-send-btn');
        if (!btn) return;
        
        switch (state) {
            case 'uploading':
                btn.disabled = true;
                btn.classList.add('opacity-75', 'cursor-not-allowed');
                const span = btn.querySelector('span');
                if (span) span.textContent = 'Uploading...';
                break;
            case 'ready':
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
                const span2 = btn.querySelector('span');
                if (span2) span2.textContent = 'Upload';
                break;
            case 'disabled':
            default:
                btn.disabled = true;
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
                const span3 = btn.querySelector('span');
                if (span3) span3.textContent = 'Upload';
                break;
        }
    }
}

// Global instance
const uiManager = new UIManager();
