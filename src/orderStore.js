/**
 * 訂單儲存模組
 * 以 JSON 檔案持久化，restart-safe。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const STATUS = Object.freeze({
  IDLE: 'idle',
  OPEN: 'open',
  CLOSED: 'closed',
});

function emptyOrders() {
  return {
    status: STATUS.IDLE,
    orders: {},
    updatedAt: new Date().toISOString(),
  };
}

async function readFileSafe() {
  try {
    const raw = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return emptyOrders();
  }
}

async function writeFileSafe(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const updated = { ...data, updatedAt: new Date().toISOString() };
  await fs.writeFile(ORDERS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

// 公開 API
export async function startOrder() {
  const data = emptyOrders();
  data.status = STATUS.OPEN;
  await writeFileSafe(data);
  return data;
}

export async function addItem(customerName, items) {
  const data = await readFileSafe();
  if (data.status !== STATUS.OPEN) return null;

  const existing = data.orders[customerName] || [];
  // 合併，去重
  const merged = [...existing];
  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed && !merged.includes(trimmed)) {
      merged.push(trimmed);
    }
  }
  data.orders[customerName] = merged;
  await writeFileSafe(data);
  return data;
}

export async function closeOrder() {
  const data = await readFileSafe();
  data.status = STATUS.CLOSED;
  await writeFileSafe(data);
  return data;
}

export async function clear() {
  const data = emptyOrders();
  await writeFileSafe(data);
  return data;
}

export async function getState() {
  return readFileSafe();
}

export { STATUS };
