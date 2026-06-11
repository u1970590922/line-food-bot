import http from 'node:http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opt = {
      hostname: 'localhost',
      port: 3000,
      path,
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
  const tests = [
    { label: '1. 開始點餐', body: { text: '開始點餐' } },
    { label: '2. 貝沐 輸入餐點（自動帶入）', body: { text: '彩虹水餃 皮蛋豆腐', sender: '貝沐' } },
    { label: '3. 娜 幫成點（半形冒號）', body: { text: '成: 彩虹煎餃 + 豬排', sender: '娜' } },
    { label: '4. 和 幫鈞點（全形冒號）', body: { text: '鈞：單點豬排、燙青菜、貢丸湯', sender: '和' } },
    { label: '5. 麥緋 補點玉米濃湯', body: { text: '玉米濃湯', sender: '麥緋' } },
    { label: '6. 明細', body: { text: '明細' } },
    { label: '7. 結單', body: { text: '結單' } },
    { label: '8. 清除', body: { text: '清除' } },
  ];

  for (const t of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`▶ ${t.label}`);
    console.log(`   輸入：${JSON.stringify(t.body)}`);
    try {
      const res = await post('/test/message', t.body);
      console.log(`   回應：${res}`);
    } catch (e) {
      console.log(`   錯誤：${e.message}`);
    }
  }

  // 查詢 /test/summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('▶ GET /test/summary（最後狀態）');
  try {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/test/summary', (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      }).on('error', reject);
    });
    console.log(`   ${res}`);
  } catch (e) {
    console.log(`   錯誤：${e.message}`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('✅ 測試完成');
}

run().catch((e) => {
  console.error('執行失敗：', e.message);
  process.exit(1);
});
