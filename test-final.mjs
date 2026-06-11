import http from 'node:http';

function post(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opt = { hostname: 'localhost', port: 3000, path: '/test/message', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = http.request(opt, (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => resolve(Buffer.concat(c).toString())); });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function run() {
  await post({ text: '開始點餐' });
  
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
    await post({ text: c.text, sender: c.sender });
    console.log(`▶ ${c.label}`);
    console.log(`   輸入：${c.text}`);
  }

  const s = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/test/summary', (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => resolve(Buffer.concat(c).toString())); }).on('error', reject);
  });
  console.log(`\n${'─'.repeat(50)}`);
  console.log('最終匯總：', s);
}
run();
