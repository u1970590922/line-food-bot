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
  
  console.log('B:', await post({ text: '餐點1,餐點2,餐點3', sender: 'B' }));
  console.log('E:', await post({ text: '餐點A + 餐點B、餐點C 餐點D', sender: 'E' }));
  
  const s = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/test/summary', (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => resolve(Buffer.concat(c).toString())); }).on('error', reject);
  });
  console.log('\nSummary:', s);
}
run();
