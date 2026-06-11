# 🍱 LINE 點餐 Bot

## 本地執行

```bash
npm start
```

Server 會跑在 `http://localhost:3000`

## 測試端點

```bash
# 健康檢查
curl http://localhost:3000/health

# 發送測試訊息
curl -X POST http://localhost:3000/test/message \
  -H "Content-Type: application/json" \
  -d '{"text": "開始點餐"}'

# 查詢匯總
curl http://localhost:3000/test/summary
```

## 部署到 Render

1. 把專案推到 GitHub（公開或 private repo 都可以）
2. 在 [Render Dashboard](https://dashboard.render.com/) 建立 **New Web Service**
3. 選擇你的 repo，設定：
   - **Runtime**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free
4. 新增 **Environment Variables**：
   - `LINE_CHANNEL_ACCESS_TOKEN` — 你的 LINE Channel Access Token
   - `DATABASE_URL` — Render PostgreSQL 的連線字串（建立 PostgreSQL 服務後自動產生）
5. 部署完成後，在 LINE Console 設定 Webhook：
   ```
   https://你的render網址.onrender.com/webhook
   ```

### 使用 render.yaml 快速部署

本專案已內建 `render.yaml`，在 Render 建立 Web Service 時可以直接匯入，減少手動設定。

## 環境變數

| 變數 | 說明 | 必填 |
|------|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token | 是（接 LINE 時） |
| `DATABASE_URL` | PostgreSQL 連線字串 | 是（部署到 Render 時） |
| `PORT` | Server port | 否（預設 3000） |
| `HOST` | Server host | 否（預設 0.0.0.0） |

## 指令

| 指令 | 說明 |
|------|------|
| `開始點餐` | 開啟新一輪 |
| `結單` | 輸出匯總 |
| `明細` / `查詢` | 查看目前匯總 |
| `清除` / `清空` | 清除所有資料 |
| `help` / `說明` | 顯示指令說明 |

## 點餐格式

- `彩虹水餃 皮蛋豆腐` → 自動記錄為你的名字
- `成: 彩虹煎餃 + 豬排` → 記錄給「成」
- `娜：醬鹵肉燥拌飯` → 記錄給「娜」（全形冒號也支援）
- 一次可點多項，用空白、逗號、頓號或加號分隔

## 注意事項

- LINE Messaging API 免費額度約 200 則回覆/月
- 點餐時 bot 安靜記錄（不回覆），只在指令時回應，以節省額度
- Render Free 方案 15 分鐘無請求會休眠，首次請求會延遲約 50 秒
