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

## 部署到 Railway

1. 安裝 Railway CLI：
```bash
npm install -g @railway/cli
railway login
```

2. 初始化專案：
```bash
railway init
railway link
```

3. 設定環境變數：
```bash
railway variables set LINE_CHANNEL_ACCESS_TOKEN=你的token
```

4. 部署：
```bash
railway up
```

5. 拿到 URL 後，在 LINE Console 設定 Webhook：
```
https://你的railway網址.up.railway.app/webhook
```

## 環境變數

| 變數 | 說明 | 必填 |
|------|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token | 是（接 LINE 時） |
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
