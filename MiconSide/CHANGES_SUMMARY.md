# ESP32-S3 マイコンファームウェア 修正内容

## 概要

WiFiループ中の再設定対応により、プロビジョニングサービスを常時利用可能にしました。

---

## 修正内容

### 1. **プロビジョニングサービスの常時セットアップ化**

**ファイル:** `MiconSide/src/main.cpp`

**関数:** `void init_ble(void)`

**行番号:** 約740-750行目

#### 修正前：

```cpp
// Setup OTA service (always available)
log_println("[I] Setting up OTA service...");
setup_ble_ota_service();

// Setup provisioning service if in PROVISIONING mode
if (g_state.system_state == STATE_PROVISIONING)
{
    log_println("[I] Setting up provisioning service...");
    setup_ble_provisioning_service();
}

log_println("[I] Starting advertising...");
```

#### 修正後：

```cpp
// Setup OTA service (always available)
log_println("[I] Setting up OTA service...");
setup_ble_ota_service();

// Setup provisioning service (always available for WiFi re-provisioning during operation)
log_println("[I] Setting up provisioning service...");
setup_ble_provisioning_service();

log_println("[I] Starting advertising...");
```

**変更点:**

- ❌ `if (g_state.system_state == STATE_PROVISIONING)` 条件分岐を削除
- ✅ プロビジョニングサービスを常時セットアップ
- ✅ コメントを「常時利用可能」に更新

---

### 2. **BLE広告にプロビジョニングサービスを常時追加**

**ファイル:** `MiconSide/src/main.cpp`

**関数:** `void init_ble(void)`

**行番号:** 約751-763行目

#### 修正前：

```cpp
log_println("[I] Starting advertising...");
BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
pAdvertising->addServiceUUID(DEBUG_SERVICE_UUID);
pAdvertising->addServiceUUID(OTA_SERVICE_UUID);
if (g_state.system_state == STATE_PROVISIONING)
{
    pAdvertising->addServiceUUID(PROV_SERVICE_UUID);
}
pAdvertising->setScanResponse(true);
pAdvertising->setMinPreferred(0x06);
pAdvertising->setMaxPreferred(0x12);
BLEDevice::startAdvertising();
```

#### 修正後：

```cpp
log_println("[I] Starting advertising...");
BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
pAdvertising->addServiceUUID(DEBUG_SERVICE_UUID);
pAdvertising->addServiceUUID(OTA_SERVICE_UUID);
pAdvertising->addServiceUUID(PROV_SERVICE_UUID);  // Always advertise provisioning service
pAdvertising->setScanResponse(true);
pAdvertising->setMinPreferred(0x06);
pAdvertising->setMaxPreferred(0x12);
BLEDevice::startAdvertising();
```

**変更点:**

- ❌ `if (g_state.system_state == STATE_PROVISIONING) { ... }` 条件分岐を削除
- ✅ `pAdvertising->addServiceUUID(PROV_SERVICE_UUID);` を条件なく追加
- ✅ インラインコメント追加

---

## 影響範囲

| 項目               | 詳細                   |
| ------------------ | ---------------------- |
| **変更ファイル数** | 1ファイル (main.cpp)   |
| **変更箇所**       | 2箇所                  |
| **削除行**         | 条件分岐2つ（計6-8行） |
| **追加行**         | コメント1行            |
| **API変更**        | なし                   |
| **オプション機能** | なし                   |

---

## 動作変化

### 修正前の動作

```
デバイス起動
  ├─ PROVISIONING状態
  │   └─ プロビジョニングサービス: ✅ 利用可能
  └─ APP_RUNNING状態
      └─ プロビジョニングサービス: ❌ 利用不可 ← 問題！
```

### 修正後の動作

```
デバイス起動
  ├─ PROVISIONING状態
  │   └─ プロビジョニングサービス: ✅ 利用可能
  └─ APP_RUNNING状態
      └─ プロビジョニングサービス: ✅ 利用可能 ← 改善！
```

---

## メリット

✅ **ループ中のWiFi再設定が可能**

- デバイスの再起動やリセットが不要
- WiFi接続中でも設定変更可能

✅ **Webアプリの工場リセット機能が不要**

- エラーハンドリングをシンプル化
- ユーザー体験向上

✅ **開発効率向上**

- テスト時の再設定が簡単
- プロビジョニング機能の再利用性向上

---

## 別プログラムへの適用方法

### 手順

1. プログラムの `init_ble()` 関数を探す
2. 上記の2つの修正箇所を見つける
3. 条件分岐を削除し、常時実行するよう変更

### チェックポイント

- [ ] `setup_ble_provisioning_service()` が無条件で呼ばれている
- [ ] `pAdvertising->addServiceUUID(PROV_SERVICE_UUID)` が無条件で実行されている
- [ ] ビルドが成功している
- [ ] BLE接続テストで両方のサービスが見える

---

## 検証コマンド

```bash
# ビルド確認
pushd "C:\Users\naka6\Projects\RemoteCompilerToMicon\MiconSide"
pio run

# 期待結果
# [SUCCESS] Took X.XX seconds
# Flash: 80.8% used
# RAM:   19.7% used
```

---

## 注意事項

⚠️ **古いファームウェアとの互換性**

- この変更は本質的には後方互換
- Webアプリ側も同時に更新推奨
- 既存デバイスはファームウェア書き込み必須

⚠️ **NVS（不揮発性ストレージ）設定**

- WiFi認証情報は既存の仕様通り保持
- 初期状態でプロビジョニング可能

---

## 関連ファイル

- **マイコン側:** `MiconSide/src/main.cpp`
- **Webアプリ側:** `WebAppSide/ble-client.js`, `WebAppSide/app.js`
- **スタイル:** `WebAppSide/styles.css`
- **UI制御:** `WebAppSide/ui.js`
