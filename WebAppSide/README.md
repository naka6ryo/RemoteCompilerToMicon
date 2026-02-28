# ESP32-S3 Remote Control WebApp

ESP32-S3 Super Mini 用の BLE Wi-Fi プロビジョニング + BLE OTA + BLE デバッグモニタ WebApp です。

iPad上の Bluefy ブラウザで実行することを想定しています。

**注意: ファームウェア更新（OTA）は完全にBLE経由で実行されます。Wi-FiはHTTP OTAには使用しません。**

## 機能

1. **BLE デバイス接続** - Web Bluetooth API を使用した BLE 接続
2. **Wi-Fi 設定** - BLE 経由で WiFi SSID/パスワードを ESP32 へ送信（プロビジョニング確認用）
3. **ファームウェア更新 (OTA)** - 完全にBLE経由でファームウェア更新（180バイトチャンク、最大2MB）
4. **BLE デバッグモニタ** - ESP32 のシリアルログを BLE で受信・表示

## 対応ブラウザ

- **Bluefy** (iPad) - Web Bluetooth API 対応
- Chrome/Edge (Web Bluetooth API サポート環境)

## ファイル構成

```
WenAppSide/
├── index.html          # メイン HTML
├── styles.css          # スタイルシート
├── constants.js        # 定数・設定値
├── ble-client.js       # BLE 通信ロジック
├── ota-client.js       # BLE OTA クライアント（HTTP OTAは未実装）
├── firmware-client.js  # BLE経由ファームウェアクライアント
├── ui.js               # UI 更新管理
├── app.js              # メインアプリロジック
├── package.json        # npm パッケージ設定
├── netlify.toml        # Netlify デプロイ設定
└── README.md           # このファイル
```

## ローカル実行

### 方法1: Live Server (VS Code)

1. VS Code で Live Server 拡張をインストール
2. `index.html` を右クリック → "Open with Live Server"

### 方法2: Python HTTP Server

```bash
# Python 3
python -m http.server 8000

# または Python 2
python -m SimpleHTTPServer 8000
```

ブラウザで `http://localhost:8000` にアクセス

### 方法3: Node.js HTTP Server

```bash
npx http-server -p 8080
```

## Netlify へのデプロイ

### 方法1: Netlify CLI を使用

```bash
# Netlify CLI をインストール
npm install -g netlify-cli

# WenAppSide ディレクトリへ移動
cd WenAppSide

# デプロイ
netlify deploy --prod --dir=.
```

### 方法2: GitHub 連携

1. このリポジトリを GitHub にプッシュ
2. Netlify にログイン (https://app.netlify.com)
3. "New site from Git" を選択
4. リポジトリを選択
5. ビルド設定：
   - Build command: (空白)
   - Publish directory: `WenAppSide/`
6. "Deploy site" をクリック

### 方法3: ドラッグ&ドロップ

1. Netlify にログイン
2. WenAppSide フォルダをドラッグ&ドロップしてアップロード

## 使用方法

### 1. デバイス接続

1. "Connect Device" をクリック
2. BLE デバイス選択ダイアログで ESP32-S3 を検索・選択
3. 接続が確立されると "Connected" と表示される

### 2. Wi-Fi 設定

1. SSID とパスワードを入力
2. "Send Configuration" をクリック
3. ESP32 が Wi-Fi に接続すると IP アドレスが表示される

### 3. ファームウェア更新 (OTA) - BLE経由

1. BLE 接続が確立していることを確認
2. `.bin` ファイルを選択（最大2MB）
3. "Upload Firmware" をクリック
4. BLE経由でOTA_MODEコマンド送信
5. ファームウェアデータをBLE経由で送信（180バイトチャンク）
6. 進捗が表示され、完了後デバイスが再起動される

### 4. デバッグモニタ

1. "Subscribe to Logs" をクリック
2. ESP32 からのログが表示される
3. 必要に応じてデバッグコマンドを送信可能
   - `LVL:0` - ログレベルをエラーのみに変更
   - `LVL:1` - ログレベルをワーニング以上に変更
   - `LVL:2` - ログレベルをイントが以上に変更
   - `CLR` - ログバッファをクリア
   - `PING` - デバイスへの ping

## 技術スタック

- HTML5
- CSS3 (Flexbox, Grid)
- Vanilla JavaScript (フレームワーク不使用)
- Web Bluetooth API
- Fetch API

## トラブルシューティング

### BLE が接続できない

- Safari では Web Bluetooth API がサポートされていません → Bluefy を使用してください
- デバイスが BLE 接続可能な状態か確認してください
- ブラウザのコンソール (開発者ツール) でエラーを確認できます

### OTA が実行できない

- BLE 接続が確立していることを確認してください
- ファイルサイズが2MB以下であることを確認してください
- デバイスとiPadの距離が近いことを確認（BLE範囲内）
- 他のBLEデバイスとの干渉がないか確認

### BLE OTA 転送が途中で止まる

- デバイスとの距離を縮めてください（BLEの通信範囲は約10m）
- 他のBluetooth機器を切断してください
- デバイスメモリ不足の可能性 - デバイスを再起動してください

## カスタマイズ

### BLE UUID の変更

`constants.js` の `BLE_UUIDS` オブジェクトを編集：

```javascript
const BLE_UUIDS = {
  DEBUG_SERVICE_UUID: "your-service-uuid",
  // ...
};
```

### BLE OTA 設定の変更

`constants.js` の `BLE_UUIDS` でOTA Service UUIDsを確認・編集：

```javascript
const BLE_UUIDS = {
  // ...
  OTA_SERVICE_UUID: "9f5f0001-8d9e-6f4e-bd0c-3c4d5e6f7180",
  OTA_CONTROL_UUID: "9f5f0002-8d9e-6f4e-bd0c-3c4d5e6f7180",
  OTA_DATA_UUID: "9f5f0003-8d9e-6f4e-bd0c-3c4d5e6f7180",
  OTA_STATUS_UUID: "9f5f0004-8d9e-6f4e-bd0c-3c4d5e6f7180",
};
```

### UI カラーの変更

`styles.css` の CSS 変数を編集：

```css
:root {
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  /* ... */
}
```

## セキュリティに関する注意

- **WiFi パスワードは暗号化されません**（BLE経由で平文送信）
- **BLE通信範囲内で通信可能**（約10m範囲内）
- 本番環境では、BLEペアリングの使用を推奨します
- WebAppはHTTPSで配信することを推奨します（Netlify等）

## ライセンス

MIT License

## 仕様書参照

詳細な仕様については以下を参照してください：

- [CreatePlan.md](../CreatePlan.md) - 実装詳細設計書
- [SpecifcationDoc.md](../SpecifcationDoc.md) - 仕様書

## 関連プロジェクト

- ESP32-S3 マイコン側ファームウェア: [MiconSide/MiconSide.ino](../MiconSide/MiconSide.ino)
