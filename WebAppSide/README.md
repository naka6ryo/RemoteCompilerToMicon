# ESP32-S3 Remote Control WebApp

ESP32-S3 Super Mini 用の BLE Wi-Fi プロビジョニング + 条件付き Web OTA + BLE デバッグモニタ WebApp です。

iPad上の Bluefy ブラウザで実行することを想定しています。

## 機能

1. **BLE デバイス接続** - Web Bluetooth API を使用した BLE 接続
2. **Wi-Fi 設定** - BLE 経由で WiFi SSID/パスワードを ESP32 へ送信
3. **ファームウェア更新 (OTA)** - BLE プロビジョニング後、HTTP 経由でファームウェア更新
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
├── ota-client.js       # OTA HTTP クライアント
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

### 3. ファームウェア更新 (OTA)

1. Wi-Fi 接続直後に "OTA Status" が "Allowed" になる
2. `.bin` ファイルを選択
3. "Upload Firmware" をクリック
4. 進捗が表示され、完了後デバイスが再起動される

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

- BLE プロビジョニング直後のみ OTA が可能です
- OTA セッション TTL (デフォルト 300秒 / 5分) が切れていないか確認してください
- デバイスと同じ Wi-Fi ネットワークに接続していることを確認してください

### HTTP 通信がタイムアウトする

- デバイスの IP アドレスが正しいか確認
- デバイスとブラウザが同じネットワーク上にあるか確認
- ファイアウォール設定を確認

## カスタマイズ

### BLE UUID の変更

`constants.js` の `BLE_UUIDS` オブジェクトを編集：

```javascript
const BLE_UUIDS = {
    DEBUG_SERVICE_UUID: 'your-service-uuid',
    // ...
};
```

### OTA 設定の変更

`constants.js` の `OTA_CONFIG` オブジェクトを編集：

```javascript
const OTA_CONFIG = {
    TIMEOUT_MS: 120000,     // HTTP タイムアウト (ミリ秒)
    SESSION_TTL_SEC: 300,   // OTA セッション有効期限 (秒)
    MAX_USES: 1,            // 1セッション内の使用回数
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

- **本番環境では Basic 認証の使用を避けてください** (平文送信)
- **WiFi パスワードは暗号化されません**（初期実装）
- HTTPS を使用することを推奨します
- ローカルネットワーク内でのみ使用を推奨します

## ライセンス

MIT License

## 仕様書参照

詳細な仕様については以下を参照してください：

- [CreatePlan.md](../CreatePlan.md) - 実装詳細設計書
- [SpecifcationDoc.md](../SpecifcationDoc.md) - 仕様書

## 関連プロジェクト

- ESP32-S3 マイコン側ファームウェア: [MiconSide/MiconSide.ino](../MiconSide/MiconSide.ino)
