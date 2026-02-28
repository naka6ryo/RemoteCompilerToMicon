// ============================================================================
// Firmware Upload Client Module
// Handles firmware binary upload to ESP32 via BLE
// ============================================================================

class FirmwareClient {
    constructor() {
        this.bleDevice = null;
    }

    /**
     * Set BLE device reference
     */
    setBleDevice(device) {
        this.bleDevice = device;
        console.log('[Firmware] BLE device set');
    }

    /**
     * Upload firmware binary via BLE
     */
    async uploadFirmware(binFile, progressCallback) {
        try {
            console.log('[Firmware] Upload started');
            console.log('[Firmware] File name:', binFile ? binFile.name : 'null');
            console.log('[Firmware] File size:', binFile ? binFile.size : 'null');

            if (!this.bleDevice || !this.bleDevice.gatt.connected) {
                throw new Error('BLE device not connected. Please connect to device first.');
            }

            if (!binFile) {
                throw new Error('No file selected. Please select a firmware file.');
            }

            if (!binFile.name.endsWith('.bin')) {
                throw new Error('Invalid file type. Please select a .bin file');
            }

            if (binFile.size === 0) {
                throw new Error('File is empty. Please select a valid firmware file.');
            }

            if (binFile.size > 2 * 1024 * 1024) {
                console.warn('[Firmware] Large file detected:', binFile.size, 'bytes');
            }

            // Read file as ArrayBuffer
            console.log('[Firmware] Reading file...');
            const arrayBuffer = await this.readFileAsArrayBuffer(binFile);
            console.log('[Firmware] ✓ File read successfully:', arrayBuffer.byteLength, 'bytes');

            // Connect BLE OTA client
            await bleOtaClient.connect(this.bleDevice);

            // Set progress callback
            if (progressCallback) {
                bleOtaClient.setProgressCallback(progressCallback);
            }

            // Upload firmware
            const result = await bleOtaClient.uploadFirmware(arrayBuffer);
            console.log('[Firmware] Upload completed:', result);

            return result;

        } catch (error) {
            console.error('[Firmware] Upload error:', error);
            throw error;
        }
    }

    /**
     * Read file as ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            console.log('[Firmware] FileReader starting...');
            const reader = new FileReader();
            
            reader.onloadstart = () => {
                console.log('[Firmware] FileReader: load started');
            };
            
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    console.log(`[Firmware] FileReader: ${percent}% (${e.loaded}/${e.total} bytes)`);
                }
            };
            
            reader.onload = () => {
                console.log('[Firmware] FileReader: load complete');
                resolve(reader.result);
            };
            
            reader.onerror = (e) => {
                console.error('[Firmware] FileReader error:', e);
                reject(new Error(`Failed to read file: ${reader.error ? reader.error.message : 'Unknown error'}`));
            };
            
            reader.onabort = () => {
                console.error('[Firmware] FileReader aborted');
                reject(new Error('File reading was aborted'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
}

// Global instance
const firmwareClient = new FirmwareClient();

