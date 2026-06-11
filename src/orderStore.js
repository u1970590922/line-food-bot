/**
 * PostgreSQL 訂單儲存模組
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const STATUS = Object.freeze({
  IDLE: 'idle',
  OPEN: 'open',
  CLOSED: 'closed',
});

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'idle',
      orders JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rowCount } = await pool.query('SELECT COUNT(*) AS count FROM orders');
  if (Number(rowCount[0].count) === 0) {
    await pool.query(
      `INSERT INTO orders (status, orders, updated_at) VALUES ($1, $2::jsonb, now())`,
      [STATUS.IDLE, JSON.stringify({})]
    );
  }
}

export async function init() {
  await ensureTables();
}

export async function startOrder() {
  const data = { status: STATUS.OPEN, orders: {} };
  await pool.query(
    `UPDATE orders SET status = $1, orders = $2::jsonb, updated_at = now() WHERE id = 1`,
    [data.status, JSON.stringify(data.orders)]
  );
  return data;
}

export async function addItem(customerName, items) {
  const current = await getState();
  if (current.status !== STATUS.OPEN) return null;

  const existing = current.orders[customerName] || [];
  const merged = [...existing];
  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed && !merged.includes(trimmed)) {
      merged.push(trimmed);
    }
  }

  const orders = { ...current.orders, [customerName]: merged };
  await pool.query(
    `UPDATE orders SET orders = $1::jsonb, updated_at = now() WHERE id = 1`,
    [JSON.stringify(orders)]
  );
  return { status: STATUS.OPEN, orders };
}

export async function closeOrder() {
  const current = await getState();
  current.status = STATUS.CLOSED;
  await pool.query(
    `UPDATE orders SET status = $1, updated_at = now() WHERE id = 1`,
    [current.status]
  );
  return current;
}

export async function clear() {
  const data = { status: STATUS.IDLE, orders: {} };
  await pool.query(
    `UPDATE orders SET status = $1, orders = $2::jsonb, updated_at = now() WHERE id = 1`,
    [data.status, JSON.stringify(data.orders)]
  );
  return data;
}

export async function getState() {
  const { rows } = await pool.query('SELECT status, orders FROM orders WHERE id = 1');
  const row = rows[0];
  return {
    status: row.status,
    orders: row.orders || {},
    updatedAt: new Date().toISOString(),
  };
}

export { STATUS };
