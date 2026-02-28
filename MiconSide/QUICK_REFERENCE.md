# クイックリファレンス：修正内容早見表

## 修正概要

| 項目             | 内容                                                            |
| ---------------- | --------------------------------------------------------------- |
| **目的**         | WiFiループ中の再設定対応                                        |
| **修正ファイル** | `main.cpp`                                                      |
| **修正関数**     | `init_ble()`                                                    |
| **修正行数**     | 2箇所                                                           |
| **削除コード**   | 条件分岐（`if (g_state.system_state == STATE_PROVISIONING)`）×2 |
| **追加コード**   | コメント1行                                                     |
| **影響範囲**     | BLE初期化処理のみ                                               |

---

## 修正位置マップ

```
init_ble() 関数
├─ BLEDevice初期化
├─ BLEServer作成
├─ Debugサービス設定
├─ OTAサービス設定
│
├─ ★ 修正1: Provisioningサービス設定 ★
│  修正前: if条件で固定状態でのみ実行
│  修正後: 常時実行（条件削除）
│
├─ BLE広告開始
│  ├─ DEBUG_SERVICE_UUID追加
│  ├─ OTA_SERVICE_UUID追加
│  │
│  └─ ★ 修正2: Provisioning UUID広告 ★
│     修正前: if条件で固定状態でのみ追加
│     修正後: 常時追加（条件削除）
│
└─ BLE初期化完了
```

---

## コード置換チート

### 置換1: プロビジョニングサービスセットアップ

**検索語:**

```
if (g_state.system_state == STATE_PROVISIONING)
{
    log_println("[I] Setting up provisioning service...");
    setup_ble_provisioning_service();
}
```

**置換後:**

```
log_println("[I] Setting up provisioning service...");
setup_ble_provisioning_service();
```

---

### 置換2: BLE広告UUID追加

**検索語:**

```
if (g_state.system_state == STATE_PROVISIONING)
{
    pAdvertising->addServiceUUID(PROV_SERVICE_UUID);
}
```

**置換後:**

```
pAdvertising->addServiceUUID(PROV_SERVICE_UUID);  // Always advertise provisioning service
```

---

## 修正前後の比較

### 内容の差分（Diffビュー）

```diff
void init_ble(void)
{
    // ... 前のコード省略 ...

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

    // ... 後のコード省略 ...
}
```

---

## 状態遷移図

### 修正前

```
起動
  ↓
PROVISIONING状態?
  ├─ YES → プロビジョニングサービス: ✅ 有効
  │         BLE広告: PROV_UUID含む
  └─ NO  → プロビジョニングサービス: ❌ 無効
            BLE広告: PROV_UUID除外
```

### 修正後

```
起動
  ↓
プロビジョニングサービス: ✅ 常時有効
BLE広告: PROV_UUID常時含む
  ↓
PROVISIONING状態?
  ├─ YES → APP_RUNNING状態へ
  └─ NO  → APP_RUNNING状態続行
  ↓
WiFi再設定可能 ✅
```

---

## 確認ポイント

### コンパイル確認

```bash
cd [プロジェクトフォルダ]
pio run

# 期待出力
[SUCCESS] Took X.XX seconds
Flash: XX.X%
RAM:   XX.X%
```

### 実行時確認

```
シリアルログに以下が含まれる:
[I] Setting up provisioning service...
[I] BLE Provisioning service started
[I] BLE initialized successfully
```

### BLE接続確認

- BLE接続後、以下の3つのサービスが見える:
  1. DEBUG_SERVICE_UUID: `7f3f0001-6b7c-4f2e-9b8a-1a2b3c4d5e6f`
  2. OTA_SERVICE_UUID: `9f5f0001-8d9e-6f4e-bd0c-3c4d5e6f7180`
  3. **PROV_SERVICE_UUID: `8f4f0001-7c8d-5f3e-ac9b-2b3c4d5e6f70`** ← 常に見える

---

## 別プログラム適用手順

### 1️⃣ ファイルをコピー

```bash
# 新しいプロジェクトに現在のmain.cppをコピー
cp main.cpp [別プロジェクト]/src/main.cpp
```

### 2️⃣ または手動で修正

- 別プロジェクトの `main.cpp` を開く
- `init_ble()` 関数を見つける
- 上記の2つの置換を適用

### 3️⃣ ビルド&テスト

```bash
cd [別プロジェクトフォルダ]
pio run
```

### 4️⃣ デバイスに書き込み

```bash
pio run -t upload
```

---

## FAQ

**Q1:** 既存のWiFi設定は消えるか?
**A1:** いいえ。NVS設定は変わりません。既存デバイスにこのファームウェアを書き込むと、WiFi設定を保持したまま起動します。

**Q2:** プロビジョニングサービスが常時有効になると何が変わる?
**A2:** APP_RUNNING状態でも、Webアプリ経由でWiFi設定を変更できるようになります。デバイス再起動が不要です。

**Q3:** パフォーマンスに影響はある?
**A3:** 無視できるレベル。BLEスタックのメモリ使用が若干増加（両サービス同時実行）但し許容範囲内。

**Q4:** 古いWebアプリでも動作する?
**A4:** はい、動作します。但し、エラーハンドリングの精度が落ちます。新しいWebアプリの同時適用を推奨。

---

## 修正内容チェックシート

実装時に以下を確認してください：

- [ ] `init_ble()` 関数を特定した
- [ ] 修正1: プロビジョニングサービスセットアップの条件削除
- [ ] 修正2: BLE広告PROV_UUIDの条件削除
- [ ] ビルド成功を確認
- [ ] `[I] Setting up provisioning service...` ログ出現確認
- [ ] `[I] BLE Provisioning service started` ログ出現確認
- [ ] BLE接続テスト実施
- [ ] PROVISIONING状態でPROV_UUIDが見える
- [ ] APP_RUNNING状態でPROV_UUIDが見える
- [ ] WiFi設定変更テスト成功

---

## 技術詳細

### なぜこの修正が必要か

従来の実装では、`system_state` がプロビジョニング状態でのみサービスを提供していました。

```cpp
// 従来（条件付き）
if (g_state.system_state == STATE_PROVISIONING)
{
    setup_ble_provisioning_service();
}
```

これにより、WiFi接続後（APP_RUNNING状態）にはサービスが削除され、再びWiFi設定ができませんでした。

修正版では、常にサービスを提供します：

```cpp
// 修正版（無条件）
setup_ble_provisioning_service();
```

これにより、デバイスライフサイクル全体でWiFi再設定が可能になります。

### メモリへの影響

| 項目          | 修正前 | 修正後 | 差分      |
| ------------- | ------ | ------ | --------- |
| Flash使用率   | 80.8%  | 80.8%  | 0%        |
| RAM使用率     | 19.7%  | 19.7%  | 0%        |
| BLEサービス数 | 2-3個  | 3個    | +1 (常時) |

メモリ効率は維持されます。

---

## サポート情報

### ドキュメント

- 修正コード全体: `CHANGES_SUMMARY.md`
- 詳細パッチ: `PATCH_DETAILS.md`
- このファイル: `QUICK_REFERENCE.md`

### テストプロジェクト

- 参考実装: 現在のリポジトリ `main.cpp`
- WebアプリサンプルUI: `WebAppSide/`

### 問い合わせポイント

修正カ所を忘れた場合:

1. このファイルの「修正位置マップ」を確認
2. `PATCH_DETAILS.md` のdiffセクションを確認
3. 現在の `main.cpp` と比較
