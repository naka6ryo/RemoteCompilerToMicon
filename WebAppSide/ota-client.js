// ============================================================================
// BLE OTA Client Module
// Handles firmware upload to ESP32 via BLE
// ============================================================================

class BleOtaClient {
    constructor() {
        this.device = null;
        this.otaControlChar = null;
        this.otaDataChar = null;
        this.otaStatusChar = null;
        this.onProgressCallback = null;
        this.onStatusCallback = null;
        this.lastStatus = '';
        this.otaCompletionInProgress = false;
        this.disconnectListener = null;
    }

    /**
     * Connect to BLE device and get OTA characteristics
     */
    async connect(bleDevice) {
        try {
            this.device = bleDevice;
            
            if (!this.device || !this.device.gatt.connected) {
                throw new Error('BLE device not connected');
            }

            console.log('[BLE-OTA] Getting OTA service...');
            const otaService = await this.device.gatt.getPrimaryService(BLE_UUIDS.OTA_SERVICE_UUID);
            
            console.log('[BLE-OTA] Getting OTA characteristics...');
            this.otaControlChar = await otaService.getCharacteristic(BLE_UUIDS.OTA_CONTROL_UUID);
            this.otaDataChar = await otaService.getCharacteristic(BLE_UUIDS.OTA_DATA_UUID);
            this.otaStatusChar = await otaService.getCharacteristic(BLE_UUIDS.OTA_STATUS_UUID);

            // Subscribe to status notifications
            await this.otaStatusChar.startNotifications();
            this.otaStatusChar.addEventListener('characteristicvaluechanged', (event) => {
                const status = new TextDecoder().decode(event.target.value);
                this.lastStatus = status;
                console.log('[BLE-OTA] Status update:', status);
                if (this.onStatusCallback) {
                    this.onStatusCallback(status);
                }
            });

            console.log('[BLE-OTA] OTA service ready');
            return true;

        } catch (error) {
            console.error('[BLE-OTA] Connection error:', error);
            throw error;
        }
    }

    /**
     * Upload firmware via BLE OTA
     */
    async uploadFirmware(firmwareData) {
        try {
            if (!this.otaControlChar || !this.otaDataChar || !this.otaStatusChar) {
                throw new Error('OTA service not connected');
            }

            const firmwareSize = firmwareData.byteLength;
            console.log(`[BLE-OTA] Starting firmware upload: ${firmwareSize} bytes`);

            // Step 1: Send START command
            const startCommand = `START:${firmwareSize}`;
            console.log('[BLE-OTA] Sending START command:', startCommand);
            await this.otaControlChar.writeValue(new TextEncoder().encode(startCommand));

            // Wait for READY status
            await this.waitForStatus('READY', 5000);
            console.log('[BLE-OTA] Device ready to receive firmware');

            // Step 2: Send firmware data in chunks
            const CHUNK_SIZE = OTA_CONFIG.CHUNK_SIZE;
            const CHUNK_RETRY_COUNT = OTA_CONFIG.CHUNK_RETRY_COUNT;
            const WRITE_TIMEOUT_MS = OTA_CONFIG.WRITE_TIMEOUT_MS;
            const INTER_CHUNK_DELAY_MS = OTA_CONFIG.INTER_CHUNK_DELAY_MS;
            const INTER_CHUNK_DELAY_NR_MS = OTA_CONFIG.INTER_CHUNK_DELAY_NR_MS;
            const totalChunks = Math.ceil(firmwareSize / CHUNK_SIZE);
            let sentBytes = 0;
            let lastProgressNotified = -1;

            if (this.onProgressCallback) {
                this.onProgressCallback(0, firmwareSize, 0);
            }

            console.log(`[BLE-OTA] Sending firmware in ${totalChunks} chunks (${CHUNK_SIZE} bytes each)...`);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, firmwareSize);
                const chunk = firmwareData.slice(start, end);

                try {
                    let chunkSent = false;
                    let lastChunkError = null;
                    let usedWithoutResponse = false;

                    for (let retry = 0; retry < CHUNK_RETRY_COUNT; retry++) {
                        try {
                            // Try writeWithoutResponse first for speed
                            if (this.otaDataChar.writeValueWithoutResponse) {
                                await this.otaDataChar.writeValueWithoutResponse(chunk);
                                chunkSent = true;
                                usedWithoutResponse = true;
                                break;
                            }
                        } catch (nrError) {
                            lastChunkError = nrError;
                        }

                        // Fallback to write with response if without-response failed
                        if (!chunkSent) {
                            try {
                                const writeWithResponse = this.otaDataChar.writeValue(chunk);
                                const timeoutPromise = new Promise((_, reject) => {
                                    setTimeout(() => reject(new Error('write timeout')), WRITE_TIMEOUT_MS);
                                });

                                await Promise.race([writeWithResponse, timeoutPromise]);
                                chunkSent = true;
                                usedWithoutResponse = false;
                                break;
                            } catch (retryError) {
                                lastChunkError = retryError;
                                await new Promise(resolve => setTimeout(resolve, 20));
                            }
                        }
                    }

                    if (!chunkSent) {
                        throw new Error(lastChunkError ? lastChunkError.message : 'Unknown chunk write error');
                    }

                    sentBytes += chunk.byteLength;

                    const progress = Math.round((sentBytes / firmwareSize) * 100);
                    if (progress >= lastProgressNotified + 5 || i === totalChunks - 1) {
                        lastProgressNotified = progress;
                        console.log(`[BLE-OTA] Progress: ${sentBytes}/${firmwareSize} bytes (${progress}%) - Chunk ${i+1}/${totalChunks}`);
                    }

                    if (this.onProgressCallback && (i % 5 === 0 || i === totalChunks - 1)) {
                        this.onProgressCallback(sentBytes, firmwareSize, progress);
                    }

                    await new Promise(resolve => setTimeout(resolve, usedWithoutResponse ? INTER_CHUNK_DELAY_NR_MS : INTER_CHUNK_DELAY_MS));

                } catch (error) {
                    console.error(`[BLE-OTA] Error sending chunk ${i+1}/${totalChunks}:`, error);
                    throw new Error(`Failed to send chunk ${i+1}: ${error.message}`);
                }
            }

            console.log('[BLE-OTA] All data sent, sending END command...');

            // Give the device a short time slice to process the final chunk before END.
            await new Promise(resolve => setTimeout(resolve, 120));

            // Step 3: Send END command
            this.otaCompletionInProgress = true;
            await this.otaControlChar.writeValue(new TextEncoder().encode('END'));

            // Wait for SUCCESS status or expected reboot disconnect
            await this.waitForCompletion(10000);
            console.log('[BLE-OTA] Firmware upload successful!');

            return {
                success: true,
                message: 'Firmware uploaded successfully. Device will reboot.'
            };

        } catch (error) {
            console.error('[BLE-OTA] Upload error:', error);
            
            // Try to abort OTA on error
            try {
                if (this.otaControlChar) {
                    await this.otaControlChar.writeValue(new TextEncoder().encode('ABORT'));
                }
            } catch (abortError) {
                console.error('[BLE-OTA] Abort error:', abortError);
            }

            throw error;
        }
    }

    /**
     * Wait for specific status from device
     */
    async waitForStatus(expectedStatus, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.onStatusCallback = null;
                reject(new Error(`Timeout waiting for status: ${expectedStatus}`));
            }, timeoutMs);

            const statusHandler = (status) => {
                if (status === expectedStatus) {
                    clearTimeout(timeout);
                    this.onStatusCallback = null;
                    resolve();
                } else if (status.startsWith('ERROR:')) {
                    clearTimeout(timeout);
                    this.onStatusCallback = null;
                    reject(new Error(status));
                }
            };

            this.onStatusCallback = statusHandler;
        });
    }

    /**
     * Wait for OTA completion after END command
     * Accepts either SUCCESS status or expected reboot disconnect.
     */
    async waitForCompletion(timeoutMs) {
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                this.onStatusCallback = null;
                if (this.disconnectListener && this.device) {
                    this.device.removeEventListener('gattserverdisconnected', this.disconnectListener);
                }
                this.disconnectListener = null;
                this.otaCompletionInProgress = false;
            };

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout waiting for OTA completion (SUCCESS or reboot disconnect)'));
            }, timeoutMs);

            this.disconnectListener = () => {
                if (this.otaCompletionInProgress) {
                    console.log('[BLE-OTA] Device disconnected during completion phase, treating as reboot after success');
                    clearTimeout(timeout);
                    cleanup();
                    resolve();
                }
            };

            if (this.device) {
                this.device.addEventListener('gattserverdisconnected', this.disconnectListener, { once: true });
            }

            this.onStatusCallback = (status) => {
                if (status === 'SUCCESS') {
                    clearTimeout(timeout);
                    cleanup();
                    resolve();
                } else if (status.startsWith('ERROR:')) {
                    clearTimeout(timeout);
                    cleanup();
                    reject(new Error(status));
                }
            };
        });
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.onProgressCallback = callback;
    }

    /**
     * Disconnect
     */
    disconnect() {
        if (this.disconnectListener && this.device) {
            this.device.removeEventListener('gattserverdisconnected', this.disconnectListener);
        }
        this.device = null;
        this.otaControlChar = null;
        this.otaDataChar = null;
        this.otaStatusChar = null;
        this.onProgressCallback = null;
        this.onStatusCallback = null;
        this.lastStatus = '';
        this.otaCompletionInProgress = false;
        this.disconnectListener = null;
    }
}

// Global instance
const bleOtaClient = new BleOtaClient();

