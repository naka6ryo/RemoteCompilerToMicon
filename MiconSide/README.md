# ESP32-S3 Super Mini - Micon Side (PlatformIO)

BLE Wi-Fiプロビジョニング + BLE OTA + BLEデバッグモニタを実装した、ESP32-S3 Super Mini向けファームウェアです。

**注意: OTA更新はBLEのみを使用します（HTTP OTAは未実装）。**

## 実装済み機能（現行コード準拠）

- BLEデバッグサービス（ログ通知 / コマンド受信 / ステータス通知）
- BLE Wi-Fiプロビジョニング（`SSID\nPassword` 形式）
- BLE OTA（`START:<size>` → データ書き込み → `END` / `ABORT`）
- OTA成功時の自動再起動
- 30秒周期のUARTログ出力（アプリ動作確認用）

## 必要環境

- ESP32-S3 Super Mini
- USBケーブル
- Python 3.x
- PlatformIO CLI または VSCode + PlatformIO拡張

## ビルド・書き込み

```bash
cd c:\Users\naka6\Projects\RemoteCompilerToMicon\MiconSide

# build
platformio run

# flash
platformio run --target upload

# serial monitor (115200)
platformio device monitor --speed 115200
```

`platformio.ini` の現行設定:

- `board = lolin_s3_mini`
- `board_build.partitions = partitions_ota_2m.csv`
- `monitor_speed = 115200`
- `upload_speed = 921600`
- `upload_port` は固定せず自動検出

## BLE仕様（現行コード）

### Debug Service

- Service: `7f3f0001-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
- DebugLogTx (Notify): `7f3f0002-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
- DebugCmdRx (Write / WriteNR): `7f3f0003-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
- DebugStat (Read/Notify): `7f3f0005-6b7c-4f2e-9b8a-1a2b3c4d5e6f`

主なコマンド:

- `STATUS`
- `OTA_MODE`
- `RESET_NVS` / `FACTORY_RESET`

### Provisioning Service

- Service: `8f4f0001-7c8d-5f3e-ac9b-2b3c4d5e6f70`
- WiFi Config (Write / WriteNR): `8f4f0002-7c8d-5f3e-ac9b-2b3c4d5e6f70`

ペイロード形式:

```text
SSID\nPassword
```

例:

```text
MySSID
MyPassword
```

### OTA Service

- Service: `9f5f0001-8d9e-6f4e-bd0c-3c4d5e6f7180`
- OtaControl (Write / WriteNR): `9f5f0002-8d9e-6f4e-bd0c-3c4d5e6f7180`
- OtaData (Write / WriteNR): `9f5f0003-8d9e-6f4e-bd0c-3c4d5e6f7180`
- OtaStatus (Read/Notify): `9f5f0004-8d9e-6f4e-bd0c-3c4d5e6f7180`

制御コマンド:

- `START:<size>`
- `END`
- `ABORT`

ステータス例:

- `IDLE`
- `READY`
- `PROGRESS:<received>/<total>`
- `SUCCESS`
- `ERROR:INVALID_SIZE` / `ERROR:BEGIN_FAILED` / `ERROR:WRITE_FAILED` / `ERROR:END_FAILED` / `ERROR:NOT_STARTED`
- `ABORTED`

## OTA制限（実装値）

- 最大サイズ: `2,000,000 bytes`（`START:<size>` 判定）
- 受信はBLE小チャンク前提（WebApp側は180 bytes/チャンク）
- 中断再開は未実装（中断時は再送）

## パーティション（`partitions_ota_2m.csv`）

- `nvs`: `0x5000`
- `otadata`: `0x2000`
- `app0 (ota_0)`: `0x180000`
- `app1 (ota_1)`: `0x180000`
- `spiffs`: `0xF0000`

## 起動時挙動

- 起動直後に5秒のブート待機ログを出力
- BLEデバイス名は `ESP32-S3-MICON`
- 10秒ごとに `DebugStat` をNotify
- OTAモード中は通常アプリ処理を停止してOTA処理を優先

## ファイル構成

```text
MiconSide/
├── platformio.ini
├── partitions.csv
├── partitions_ota_2m.csv
├── sdkconfig.defaults
├── src/
│   └── main.cpp
├── logs/
└── README.md
```

## 関連

- ルート仕様: `../README.md`
- WebApp側: `../WebAppSide/`
