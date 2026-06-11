/**
 * 本地測試：多餐點分隔解析
 */
import http from 'node:http';

const BASE = 'http://localhost:3000';

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

async function waitForServer() {
  for (let i = 0; i < 20; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(`${BASE}/health`, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks).toString()));
        }).on('error', reject);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function run() {
  const ok = await waitForServer();
  if (!ok) {
    console.log('❌ Server 未啟動，請先執行：node src/server.js');
    process.exit(1);
  }
  console.log('✅ Server 正常\n');

  // 先開始點餐
  await post('/test/message', { text: '開始點餐' });

  const cases = [
    { label: '空白分隔', text: '餐點1 餐點2 餐點3', sender: 'A' },
    { label: '多個空白', text: '餐點1  餐點2  餐點3', sender: 'A' },
    { label: '全形頓號', text: '餐點1、餐點2、餐點3', sender: 'B' },
    { label: '半形逗號', text: '餐點1,餐點2,餐點3', sender: 'B' },
    { label: '加號', text: '餐點1+餐點2+餐點3', sender: 'C' },
    { label: '加號有空白', text: '餐點1 + 餐點2 + 餐點3', sender: 'C' },
    { label: '混合：空白+加號+頓號', text: '餐點1 餐點2 + 餐點3、餐點4', sender: 'D' },
    { label: '混合：加號+空白+頓號', text: '餐點A + 餐點B、餐點C 餐點D', sender: 'E' },
  ];

  for (const c of cases) {
    await post('/test/message', { text: c.text, sender: c.sender });
    console.log(`▶ ${c.label}`);
    console.log(`   輸入：${c.text}`);
    // 不顯示回應（靜默）
  }

  // 查詢明細
  console.log(`\n${'─'.repeat(50)}`);
  console.log('▶ 最終匯總');
  const summary = await new Promise((resolve, reject) => {
    http.get(`${BASE}/test/summary`, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    }).on('error', reject);
  });
  console.log(`   ${summary}`);
  console.log(`\n✅ 測試完成`);
}

run().catch((e) => {
  console.error('失敗：', e.message);
  process.exit(1);
});
