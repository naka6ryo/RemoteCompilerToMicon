# ESP32-S3 Remote Control WebApp

ESP32-S3 Super Mini向けの、BLE接続・Wi-Fiプロビジョニング・BLE OTA・デバッグモニタ用Webアプリです。

**注意: ファームウェア更新はBLE経由のみで実行します。HTTP OTAは実装していません。**

## 現行機能（実装準拠）

1. **BLE Device Connection**

- `Connect Device` で `namePrefix: ESP32` のデバイスを検索
- Debug Service / OTA Service /（あれば）Provisioning Service を利用

2. **Wi-Fi Provisioning**

- BLEでWi-Fi資格情報を送信
- 送信形式は `SSID\nPassword`

3. **Firmware Upload (BLE OTA)**

- `.bin` を選択して `Upload Firmware`
- 内部的に `OTA_MODE` → `START:<size>` → チャンク送信（180 bytes）→ `END`
- 完了判定は `SUCCESS` または再起動による切断

4. **BLE Debug Monitor**

- DebugLogTx通知を表示
- 任意のデバッグコマンドを送信

## 対応ブラウザ

- Bluefy（iPad）
- Web Bluetooth API対応のChrome / Edge

Safari単体はWeb Bluetooth API非対応です。

## ディレクトリ構成

```text
WebAppSide/
├── index.html
├── styles.css
├── constants.js
├── ble-client.js
├── ota-client.js
├── firmware-client.js
├── ui.js
├── app.js
├── package.json
├── netlify.toml
└── README.md
```

## ローカル起動

### Node.js（推奨）

```bash
cd c:\Users\naka6\Projects\RemoteCompilerToMicon\WebAppSide
npm run dev
```

`package.json` のスクリプト:

- `npm run start` → `npx http-server -p 8080 -o`
- `npm run dev` → `npx http-server -p 8080`

### Python簡易サーバー

```bash
python -m http.server 8000
```

## 使い方

1. **BLE接続**

- `Connect Device` を押してESP32を選択

2. **Wi-Fi設定（任意）**

- SSID / Password を入力して `Send Configuration`

3. **OTA更新**

- `.bin` ファイルを選択して `Upload Firmware`
- UIに進捗（10%刻み）と結果を表示

4. **デバッグ**

- `Subscribe to Logs` でログ受信
- 必要ならコマンド送信（例: `STATUS`, `OTA_MODE`, `RESET_NVS`）

## 主要定数（`constants.js`）

- OTAチャンクサイズ: `180`
- OTA最大ファームサイズ（WebApp側設定値）: `2,097,152 bytes`
- BLEデバイスフィルタ: `namePrefix: ESP32`

※ デバイス側（ESP32）の `START:<size>` 判定上限は `2,000,000 bytes` です。

## トラブルシューティング

### 接続できない

- Web Bluetooth対応ブラウザか確認
- デバイスが広告中か確認
- 切断後は再度 `Connect Device` を実行

### OTAが失敗する

- `.bin` 以外のファイルを選んでいないか確認
- 実質サイズが `2,000,000 bytes` を超えていないか確認
- BLE距離を近づけ、干渉源を減らす

### Provisioning Serviceが見つからない

- デバイスが既にAPPモードの場合、Provisioning Serviceが広告されない実装です

## 関連

- マイコン側: `../MiconSide/`
- ルート仕様: `../README.md`
