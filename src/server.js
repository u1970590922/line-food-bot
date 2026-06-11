/**
 * LINE 點餐 Bot — Fastify Server
 */
import Fastify from 'fastify';
import { startOrder, addItem, closeOrder, clear, getState, STATUS } from './orderStore.js';
import { parseOrder } from './parser.js';
import { formatSummary, formatHelp } from './responses.js';

const fastify = Fastify({ logger: false });

// 健康檢查
fastify.get('/health', async () => ({
  status: 'ok',
  time: new Date().toISOString(),
}));

// 測試用：查詢目前匯總
fastify.get('/test/summary', async () => {
  const state = await getState();
  if (state.status === STATUS.IDLE) {
    return { status: 'idle', message: '尚未開始點餐，請傳送「開始點餐」' };
  }
  const summary = formatSummary(state.orders);
  return { status: state.status, summary, orders: state.orders };
});

// 測試用：發送模擬訊息
fastify.post('/test/message', async (req, reply) => {
  const { text, sender } = req.body || {};
  const senderName = sender || '測試使用者';
  const result = await handleMessage(text, senderName, false);
  return result;
});

// LINE 設定
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const LINE_REPLY_API = 'https://api.line.me/v2/bot/message/reply';
const LINE_PROFILE_API = 'https://api.line.me/v2/bot/profile/';

// 顯示名稱快取（userId → displayName）
const displayNameCache = new Map();

// 從 LINE API 取得顯示名稱
async function getDisplayName(userId) {
  if (displayNameCache.has(userId)) {
    return displayNameCache.get(userId);
  }
  try {
    const res = await fetch(`${LINE_PROFILE_API}${encodeURIComponent(userId)}`, {
      headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (res.ok) {
      const data = await res.json();
      const name = data.displayName || userId;
      displayNameCache.set(userId, name);
      return name;
    }
  } catch (e) {
    console.error('取得顯示名稱失敗:', e.message);
  }
  // fallback：用 userId 前 8 碼
  const fallback = `用戶_${userId.slice(0, 8)}`;
  displayNameCache.set(userId, fallback);
  return fallback;
}

// 回覆 LINE 訊息
async function replyLine(replyToken, text) {
  if (!replyToken || !LINE_CHANNEL_ACCESS_TOKEN) return;
  try {
    const res = await fetch(LINE_REPLY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
        notificationDisabled: false,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('LINE reply failed:', res.status, err);
    }
  } catch (e) {
    console.error('LINE reply error:', e.message);
  }
}

// LINE Webhook
fastify.post('/webhook', async (req, reply) => {
  const body = req.body || {};
  const events = body.events || [];

  for (const event of events) {
    if (event.type !== 'message' || !event.message?.text) continue;

    // 優先用顯示名稱（從 LINE API 取得，有快取）
    const senderUserId = event.source?.userId;
    const senderName = senderUserId ? await getDisplayName(senderUserId) : '群組成員';
    const text = event.message.text;
    const replyToken = event.replyToken;

    const result = await handleMessage(text, senderName, true);

    if (result && result.reply) {
      await replyLine(replyToken, result.reply);
    }
  }

  // 快速回傳 200 給 LINE
  return { status: 'ok' };
});

/**
 * 處理單一訊息，回傳是否需回覆
 */
async function handleMessage(text, senderName, isLineWebhook) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  const state = await getState();
  const command = detectCommand(trimmed);

  // 指令處理
  if (command === 'start') {
    await startOrder();
    return { reply: '✅ 開始點餐！請輸入餐點，輸入「明細」查看目前匯總' };
  }

  if (command === 'close') {
    const closed = await closeOrder();
    if (closed.status !== STATUS.CLOSED) {
      return { reply: '⚠️ 目前沒有進行中的點餐，請先輸入「開始點餐」' };
    }
    const summary = formatSummary(closed.orders);
    return { reply: summary };
  }

  if (command === 'query') {
    if (state.status !== STATUS.OPEN && state.status !== STATUS.CLOSED) {
      return { reply: '⚠️ 目前沒有點餐資料，請先輸入「開始點餐」' };
    }
    const summary = formatSummary(state.orders);
    return { reply: summary };
  }

  if (command === 'clear') {
    await clear();
    return { reply: '🗑️ 已清除所有資料' };
  }

  if (command === 'help') {
    return { reply: formatHelp() };
  }

  // 點餐處理（只有在 OPEN 狀態）
  if (state.status !== STATUS.OPEN) {
    // 不在點餐中，無視（或低頻率提示）
    return null;
  }

  const parsed = parseOrder(trimmed);
  if (!parsed || !parsed.items || parsed.items.length === 0) {
    // 無法解析的訊息，靜默忽略
    return null;
  }

  const customerName = parsed.customerName || senderName;
  const before = await getState();
  const after = await addItem(customerName, parsed.items);

  if (!after) return null;

  // 檢查是否為新項目（用於 debug，正式版不回覆）
  const beforeItems = before.orders[customerName] || [];
  const newItems = parsed.items.filter((item) => !beforeItems.includes(item));
  // 靜默記錄，不回覆（節省 LINE 免費額度）
  return null;
}

function detectCommand(text) {
  const lower = text.toLowerCase();
  const commands = {
    '開始點餐': 'start',
    '結單': 'close',
    '明細': 'query',
    '查詢': 'query',
    '清除': 'clear',
    '清空': 'clear',
    'reset': 'clear',
    'help': 'help',
    '說明': 'help',
    '指令': 'help',
  };

  // 完全匹配指令
  if (commands[lower]) return commands[lower];

  // 只包含指令文字的也算（例如「請開始點餐」→ 不算，避免誤觸）
  // 這裡採用完全匹配，安全第一
  return null;
}

// 啟動
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

fastify.listen({ port: Number(PORT), host: HOST }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🍱 LINE 點餐 Bot 已啟動`);
  console.log(`   本地：http://localhost:${PORT}`);
  console.log(`   健康檢查：http://localhost:${PORT}/health`);
  console.log(`   測試端點：http://localhost:${PORT}/test/summary`);
  console.log(`   發送測試：POST http://localhost:${PORT}/test/message`);
});
