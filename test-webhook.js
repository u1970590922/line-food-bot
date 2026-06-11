/**
 * 模擬 LINE Webhook 測試
 * 模擬 LINE 送來的 events 格式
 */
import http from 'node:http';

const BOT_URL = 'http://localhost:3000';

function postWebhook(events) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ events });
    const opt = {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(opt, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('🧪 模擬 LINE Webhook 測試\n');

  // 檢查 server 是否啟動
  try {
    const health = await new Promise((resolve, reject) => {
      http.get(`${BOT_URL}/health`, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      }).on('error', reject);
    });
    console.log('✅ Server 正常：', health);
  } catch (e) {
    console.log('❌ Server 未啟動，請先執行：node src/server.js');
    process.exit(1);
  }

  const tests = [
    { label: '1. 開始點餐', events: [
      { type: 'message', replyToken: 'token001', source: { userId: 'user_A' }, message: { text: '開始點餐' } }
    ]},
    { label: '2. 貝沐 輸入餐點（無冒號）', events: [
      { type: 'message', replyToken: 'token002', source: { userId: 'user_B' }, message: { text: '彩虹水餃 皮蛋豆腐' } }
    ]},
    { label: '3. 娜 幫成點（半形冒號）', events: [
      { type: 'message', replyToken: 'token003', source: { userId: 'user_C' }, message: { text: '成: 彩虹煎餃 + 豬排' } }
    ]},
    { label: '4. 和 幫鈞點（全形冒號）', events: [
      { type: 'message', replyToken: 'token004', source: { userId: 'user_D' }, message: { text: '鈞：單點豬排、燙青菜、貢丸湯' } }
    ]},
    { label: '5. 麥緋 補點玉米濃湯', events: [
      { type: 'message', replyToken: 'token005', source: { userId: 'user_E' }, message: { text: '玉米濃湯' } }
    ]},
    { label: '6. 明細查詢', events: [
      { type: 'message', replyToken: 'token006', source: { userId: 'user_A' }, message: { text: '明細' } }
    ]},
    { label: '7. 結單', events: [
      { type: 'message', replyToken: 'token007', source: { userId: 'user_A' }, message: { text: '結單' } }
    ]},
  ];

  for (const t of tests) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`▶ ${t.label}`);
    for (const evt of t.events) {
      console.log(`   輸入：${evt.message.text}`);
    }
    try {
      const res = await postWebhook(t.events);
      console.log(`   回應：${res}`);
    } catch (e) {
      console.log(`   錯誤：${e.message}`);
    }
  }

  // 最後查詢狀態
  console.log(`\n${'─'.repeat(50)}`);
  const summary = await new Promise((resolve, reject) => {
    http.get(`${BOT_URL}/test/summary`, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    }).on('error', reject);
  });
  console.log('▶ 最後狀態：', summary);

  console.log(`\n${'─'.repeat(50)}`);
  console.log('✅ 模擬測試完成');
}

run().catch((e) => {
  console.error('執行失敗：', e.message);
  process.exit(1);
});
