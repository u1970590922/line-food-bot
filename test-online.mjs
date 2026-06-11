import https from 'node:https';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opt = {
      hostname: 'line-food-bot-production.up.railway.app',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(opt, (res) => {
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
  const tests = [
    { label: '1. 開始點餐', body: { text: '開始點餐' } },
    { label: '2. 多行輸入（全形冒號）', body: { text: '成：測試餐點\n貝沐：測試餐點2', sender: '蔡文成' } },
    { label: '3. 自己傳餐點', body: { text: '測試餐點5', sender: '蔡文成' } },
    { label: '4. 明細', body: { text: '明細' } },
  ];

  for (const t of tests) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`▶ ${t.label}`);
    try {
      const res = await post('/test/message', t.body);
      console.log(`   回應：${res}`);
    } catch (e) {
      console.log(`   錯誤：${e.message}`);
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log('✅ 線上測試完成');
}

run().catch((e) => {
  console.error('執行失敗：', e.message);
  process.exit(1);
});
