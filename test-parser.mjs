import { parseOrder } from './src/parser.js';

const text = '成：測試餐點\n貝沐：測試餐點2';
console.log('输入:', JSON.stringify(text));
console.log('parseOrder 结果:', JSON.stringify(parseOrder(text)));
