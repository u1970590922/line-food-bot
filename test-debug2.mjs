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
  
  // 多行格式：模擬 LINE 一次傳多筆
  const multiLine = '成：測試餐點\n貝沐：測試餐點2';
  console.log('多行輸入：', JSON.stringify(multiLine));
  const res = await post({ text: multiLine, sender: '蔡文成' });
  console.log('回應：', res);
  
  const s = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/test/summary', (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => resolve(Buffer.concat(c).toString())); }).on('error', reject);
  });
  console.log('\nSummary:', s);
}
run();
