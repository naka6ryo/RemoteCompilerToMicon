# コード修正パッチ

## 適用対象

ESP32-S3 SmartMicon ファームウェア（Arduino互換）

## パッチ内容

### パッチ1: init_ble()関数内 - プロビジョニングサービスのセットアップ

**適用位置:** `init_ble()` 関数内、OTA service setup後、advertising開始前

```diff
    // Setup OTA service (always available)
    log_println("[I] Setting up OTA service...");
    setup_ble_ota_service();

-   // Setup provisioning service if in PROVISIONING mode
-   if (g_state.system_state == STATE_PROVISIONING)
-   {
-       log_println("[I] Setting up provisioning service...");
-       setup_ble_provisioning_service();
-   }
+   // Setup provisioning service (always available for WiFi re-provisioning during operation)
+   log_println("[I] Setting up provisioning service...");
+   setup_ble_provisioning_service();

    log_println("[I] Starting advertising...");
```

### パッチ2: init_ble()関数内 - BLE広告設定

**適用位置:** `init_ble()` 関数内、BLEAdvertising設定部分

```diff
    log_println("[I] Starting advertising...");
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(DEBUG_SERVICE_UUID);
    pAdvertising->addServiceUUID(OTA_SERVICE_UUID);
-   if (g_state.system_state == STATE_PROVISIONING)
-   {
-       pAdvertising->addServiceUUID(PROV_SERVICE_UUID);
-   }
+   pAdvertising->addServiceUUID(PROV_SERVICE_UUID);  // Always advertise provisioning service
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMaxPreferred(0x12);
    BLEDevice::startAdvertising();
```

---

## 削除される条件分岐

### 削除1：グローバル変数を使う条件

```cpp
if (g_state.system_state == STATE_PROVISIONING)
```

このフラグチェックを完全に削除します。

- 理由: APP_RUNNING状態でもプロビジョニングサービスが必要

### 削除2：BLE広告条件

```cpp
if (g_state.system_state == STATE_PROVISIONING)
```

このフラグチェックを完全に削除します。

- 理由: APP_RUNNING状態でもクライアントにサービスをアナウンス必要

---

## 修正前後の完全なinit_ble()関数比較

### 修正前

```cpp
void init_ble(void)
{
    log_println("[I] Starting BLE device init...");
    BLEDevice::init("ESP32-S3-MICON");
    BLEDevice::setMTU(517);
    log_println("[I] BLE device initialized");
    delay(100);

    log_println("[I] Creating BLE server...");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    log_println("[I] BLE server created");

    log_println("[I] Setting up debug service...");
    setup_ble_debug_service();
    log_println("[I] Debug service ready");

    log_println("[I] Setting up OTA service...");
    setup_ble_ota_service();

    // Setup provisioning service if in PROVISIONING mode
    if (g_state.system_state == STATE_PROVISIONING)
    {
        log_println("[I] Setting up provisioning service...");
        setup_ble_provisioning_service();
    }

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

    log_println("[I] BLE initialized successfully");
}
```

### 修正後

```cpp
void init_ble(void)
{
    log_println("[I] Starting BLE device init...");
    BLEDevice::init("ESP32-S3-MICON");
    BLEDevice::setMTU(517);
    log_println("[I] BLE device initialized");
    delay(100);

    log_println("[I] Creating BLE server...");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    log_println("[I] BLE server created");

    log_println("[I] Setting up debug service...");
    setup_ble_debug_service();
    log_println("[I] Debug service ready");

    log_println("[I] Setting up OTA service...");
    setup_ble_ota_service();

    // Setup provisioning service (always available for WiFi re-provisioning during operation)
    log_println("[I] Setting up provisioning service...");
    setup_ble_provisioning_service();

    log_println("[I] Starting advertising...");
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(DEBUG_SERVICE_UUID);
    pAdvertising->addServiceUUID(OTA_SERVICE_UUID);
    pAdvertising->addServiceUUID(PROV_SERVICE_UUID);  // Always advertise provisioning service
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMaxPreferred(0x12);
    BLEDevice::startAdvertising();

    log_println("[I] BLE initialized successfully");
}
```

---

## 手動適用ステップ

### ステップ1: ファイルを開く

別プログラムの main.cpp（またはBLE初期化ファイル）を開く

### ステップ2: init_ble()関数を探す

`void init_ble(void)` 関数を検索

### ステップ3: パッチ1を適用

プロビジョニングサービスのセットアップ部分を修正

```cpp
// 修正前
if (g_state.system_state == STATE_PROVISIONING)
{
    log_println("[I] Setting up provisioning service...");
    setup_ble_provisioning_service();
}

// 修正後
log_println("[I] Setting up provisioning service...");
setup_ble_provisioning_service();
```

### ステップ4: パッチ2を適用

BLE広告設定部分を修正

```cpp
// 修正前
if (g_state.system_state == STATE_PROVISIONING)
{
    pAdvertising->addServiceUUID(PROV_SERVICE_UUID);
}

// 修正後
pAdvertising->addServiceUUID(PROV_SERVICE_UUID);  // Always advertise provisioning service
```

### ステップ5: ビルドテスト

```bash
pio run
```

### ステップ6: 動作確認

- デバイスをリセット
- BLEで接続
- PROVISIONING状態と APP_RUNNING状態の両方でプロビジョニングサービスが見えることを確認

---

## トラブルシューティング

### Q: コンパイルエラーが出る

**A:**

- `setup_ble_provisioning_service()` 関数が定義されているか確認
- `pAdvertising->addServiceUUID()` の第1引数が正しいか確認
- コンパイルメッセージを全て読んで、未定義の関数がないか確認

### Q: デバイスが応答しなくなった

**A:**

- デバイスを再起動
- USB接続をやり直す
- シリアルモニターで起動ログを確認

### Q: BLEでプロビジョニングサービスが見えない

**A:**

- `pAdvertising->addServiceUUID(PROV_SERVICE_UUID)` が実際に実行されているか確認
- BLE接続後に `server.getPrimaryService(PROV_SERVICE_UUID)` でサービスが取得できるか確認
- Webアプリのコンソールログをチェック

---

## 検証チェックリスト

- [ ] ビルド成功 (`[SUCCESS]` メッセージ)
- [ ] デバイス起動ログに「BLE Provisioning service started」が出ている
- [ ] PROVISIONING状態でプロビジョニングサービスが見える
- [ ] APP_RUNNING状態でもプロビジョニングサービスが見える
- [ ] WiFi接続後にWiFi再設定可能
- [ ] OTAアップデート機能が正常に動作
- [ ] BLEデバッグログが送受信される

---

## 関連Webアプリ修正

このマイコン修正と併せて、以下のWebアプリ修正も適用してください：

- **ble-client.js**: エラーコード `PROVISION_SERVICE_NOT_AVAILABLE` 追加
- **app.js**: ファクトリリセット処理追加
- **index.html**: リセットボタンUI追加
- **styles.css**: ボタンスタイル追加
- **ui.js**: UI制御メソッド追加

詳細は `WebAppSide/` ディレクトリのファイルを参照

---

## ビルドサイズ参考値

```
修正前後で変化なし

Flash: 80.8% (1271485 bytes / 1572864 bytes)
RAM:   19.7% (64616 bytes / 327680 bytes)
```

コードサイズは増減なし（条件削除→無条件実行で相殺）
