# BLE COMPILER - WebApp

ESP32-S3 Super Mini向けの、**BLE経由でファームウェアを書き込めるWebアプリケーション**です。

🌐 **デプロイ済みURL:** https://ble-compiler.netlify.app/

---

## 🚀 使い方

### 1️⃣ WebAppを開く

以下のURLにアクセス：

**https://ble-compiler.netlify.app/**

### 2️⃣ 対応ブラウザ

| ブラウザ   | 対応状況 | 備考                            |
| ---------- | -------- | ------------------------------- |
| **Bluefy** | ✅ 推奨  | iPad/iPhone用（App Storeから）  |
| **Chrome** | ✅       | Android/PC（Web Bluetooth対応） |
| **Edge**   | ✅       | PC（Web Bluetooth対応）         |
| **Safari** | ❌       | Web Bluetooth API非対応         |

### 3️⃣ 基本操作

#### Step 1: BLE接続

1. **[Connect Device]** ボタンをクリック
2. デバイスリストから **ESP32-S3-MICON** を選択
3. 接続完了を確認（ステータスが「Connected」に変わる）

#### Step 2: ファームウェアアップロード

1. **[Choose File]** で `.bin` ファイルを選択
2. **[Upload Firmware]** をクリック
3. 進捗バーで進行状況を確認
4. 完了後、デバイスが自動的に再起動

#### Step 3: デバッグモニタ

1. **[Subscribe]** をクリック
2. ESP32からのログがリアルタイムで表示されます
3. デフォルトで「Hello World via BLE」が1秒ごとに送信されます

#### Step 4: Wi-Fi設定（オプション）

Wi-Fi機能を使う場合のみ設定：

1. SSIDとパスワードを入力
2. **[Send]** をクリック
3. デバイスがWi-Fiに接続（IPアドレスが表示される）

---

## 📋 現行機能

| 機能                      | 説明                                           |
| ------------------------- | ---------------------------------------------- |
| **BLE Device Connection** | ESP32-S3とのBLE接続                            |
| **Firmware Upload**       | BLE経由で.binファイルをアップロード（max 2MB） |
| **Debug Monitor**         | BLE経由でリアルタイムログ表示                  |
| **Wi-Fi Provisioning**    | BLE経由でWi-Fi設定を送信                       |

**注意: ファームウェア更新はBLE経由のみで実行します。HTTP OTAは実装していません。**

---

## 📂 ディレクトリ構成

```
WebAppSide/
├── index.html              # メインHTML
├── styles.css              # スタイルシート
├── constants.js            # BLE UUIDs・定数
├── ble-client.js           # BLE通信ロジック
├── ota-client.js           # BLE OTAクライアント
├── firmware-client.js      # BLE経由ファームウェアクライアント
├── ui.js                   # UI更新管理
├── app.js                  # メインアプリロジック
├── package.json            # npm パッケージ設定
├── netlify.toml            # Netlify デプロイ設定
├── icon.png                # ファビコン
├── samnail.png             # OGP画像（リンクプレビュー用）
└── README.md               # このファイル
```

---

## 🛠 開発者向け情報

### ローカル開発環境のセットアップ

#### 方法1: Python HTTP サーバ

```bash
cd WebAppSide
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開く

#### 方法2: VSCode Live Server

1. VSCode で `index.html` を右クリック
2. "Open with Live Server" を選択
3. ブラウザが自動的に開く

### Netlifyへのデプロイ

#### 自動デプロイ（推奨）

GitHubリポジトリと連携している場合、`main`ブランチへのpushで自動デプロイされます。

#### 手動デプロイ

```bash
cd WebAppSide
npm install -g netlify-cli
netlify deploy --prod
```

### ファイル役割

| ファイル             | 役割                                         |
| -------------------- | -------------------------------------------- |
| `app.js`             | アプリケーション全体の制御・イベント管理     |
| `ble-client.js`      | BLE接続・通信ロジック                        |
| `ota-client.js`      | BLE OTA制御ロジック                          |
| `firmware-client.js` | ファームウェアファイル読み込み・チャンク分割 |
| `ui.js`              | UI更新・ステータス表示                       |
| `constants.js`       | BLE UUID・定数定義                           |

---

## 🔧 カスタマイズ

### BLE UUIDの変更

`constants.js` で定義されています：

```javascript
// Debug Service
const DEBUG_SERVICE_UUID = "7f3f0001-6b7c-4f2e-9b8a-1a2b3c4d5e6f";
const DEBUG_LOG_TX_UUID = "7f3f0002-6b7c-4f2e-9b8a-1a2b3c4d5e6f";
// ...
```

ESP32側のUUIDと一致させる必要があります。

### チャンクサイズの変更

`firmware-client.js` で定義：

```javascript
const CHUNK_SIZE = 180; // iOS/Bluefy向けに最適化
```

BLEのMTUサイズに応じて調整してください。

### UIテーマの変更

`styles.css` および `index.html` の `<style>` タグ内で定義されています。

---

## 🐛 トラブルシューティング

### ❌ デバイスが見つからない

1. ESP32が起動しているか確認
2. ブラウザでBluetoothのアクセス許可を確認
3. Bluetoothが有効か確認（デバイス設定）

### ❌ ファームウェアアップロードが途中で止まる

1. デバイスとの距離を近づける（BLE範囲内）
2. 他のBluetooth機器を切断
3. ファイルサイズを確認（2MB以下）

### ❌ デバッグログが表示されない

1. [Subscribe] ボタンを押したか確認
2. BLE接続が確立しているか確認
3. ブラウザのコンソールでエラーを確認（F12キー）

---

## 📚 関連ドキュメント

- [ルートREADME.md](../README.md) - システム全体の説明
- [MiconSide/README.md](../MiconSide/README.md) - ESP32ファームウェアの説明
- [SpecifcationDoc.md](../SpecifcationDoc.md) - システム仕様書

---

## 📄 ライセンス

このプロジェクトはオープンソースです。自由に利用・改変・配布できます。

---

**最終更新**: 2026-03-06  
**デプロイURL**: https://ble-compiler.netlify.app/
└── README.md

````

## ローカル起動

### Node.js（推奨）

```bash
cd c:\Users\naka6\Projects\RemoteCompilerToMicon\WebAppSide
npm run dev
````

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
