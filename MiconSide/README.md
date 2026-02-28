# ESP32-S3 Super Mini - Micon Side (PlatformIO)

BLE Wi-Fi プロビジョニング + 条件付き Web OTA + BLE デバッグモニタ機能を備えた ESP32-S3 Super Mini用のファームウェアです。

## 機能

- ✅ BLE Wi-Fi プロビジョニング
- ✅ Wi-Fi 遅延起動（通常アプリ起動後に必要時のみ接続）
- ✅ 条件付き Web OTA（BLEプロビジョニング直後のみ有効）
- ✅ BLE デバッグシリアルモニタ
- ✅ シリアル通信でHello World出力（30秒ごと）

## 必要なもの

### ハードウェア

- ESP32-S3 Super Mini
- USB ケーブル（プログラム書き込み用）

### ソフトウェア

- Python 3.x
- PlatformIO CLI または VSCode + PlatformIO Extension

## インストール

### 1. PlatformIO CLI のインストール（初回のみ）

```bash
pip install platformio
```

### 2. VSCode + PlatformIO Extension（推奨）

1. VSCode をインストール
2. Extension で "PlatformIO" を検索・インストール
3. VSCode を再起動

## ビルド・実行手順

### 方法1: PlatformIO CLI（ターミナル）

```bash
# プロジェクトディレクトリに移動
cd c:\Users\naka6\Projects\RemoteCompilerToMicon\MiconSide

# ビルド
platformio run

# デバイスに書き込み
platformio run --target upload

# シリアルモニタを開く
platformio device monitor
```

### 方法2: VSCode + PlatformIO GUI（推奨）

1. VSCode でプロジェクトフォルダを開く
2. 左下の PlatformIO アイコンをクリック
3. **Build** でコンパイル
4. **Upload** でデバイスに書き込み
5. **Open Serial Monitor** でシリアル出力を確認

## 最初の実行時の設定

### COM ポートの確認

**Windows:**

```bash
# デバイスマネージャーで "COM3" などを確認
# または
platformio device list
```

**platformio.ini の修正**

```ini
upload_port = COM3  ; 自分のポートに変更
```

## 動作確認

シリアルモニタで以下のようなログが表示されれば成功：

```
[System] ESP32-S3 Starting...
[Version] FW v1.0.0
[I] Wi-Fi config found, entering APP mode
[I] BLE initialized
[Setup] Initialization complete
[Info] Waiting for BLE provisioning or app commands...

[App Core] ======================================
[App Core] Hello World via Serial (UART)
[App Core] This is the embedded application running on ESP32-S3
[App Core] Current system state: 2
[App Core] Wi-Fi state: 0
[App Core] OTA session state: 0
[App Core] ======================================
```

## トラブルシューティング

### Port が見つからない

```bash
# デバイスリスト表示
platformio device list

# または Windows のデバイスマネージャーで COM ポートを確認
```

### コンパイルエラー

```bash
# キャッシュクリア
platformio run --target clean

# 再度ビルド
platformio run
```

### シリアルモニタが開かない

- USB ドライバをインストール（[CH340 ドライバ](https://sparks.gogo.co.nz/ch340.html)など）
- ボーレート: 115200

## ファイル構成

```
MiconSide/
├── MiconSide.ino        # メインプログラム
├── platformio.ini       # PlatformIO 設定
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## BLE デバッグサービス UUID

仕様書より：

- Debug Service: `7f3f0001-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
- DebugLogTx (Notify): `7f3f0002-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
- DebugCmdRx (Write): `7f3f0003-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
- DebugStat (Read/Notify): `7f3f0005-6b7c-4f2e-9b8a-1a2b3c4d5e6f`

## オプション設定

### ビルドオプション（platformio.ini）

**デバッグレベルの変更**

```ini
build_flags =
  -DCORE_DEBUG_LEVEL=5    ; 0=None, 5=Verbose
```

**フラッシュメモリの最適化**

```ini
build_flags =
  -Os                     ; サイズ最適化
```

## 仕様書参照

- [CreatePlan.md](../../CreatePlan.md) - 実装詳細設計書
- [SpecifcationDoc.md](../../SpecifcationDoc.md) - 仕様書

## 関連プロジェクト

- Web App Side: [WenAppSide/](../../WenAppSide/)
