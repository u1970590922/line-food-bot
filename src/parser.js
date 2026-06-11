/**
 * 訊息解析模組
 */
export function parseOrder(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 偵測冒號（全形 or 半形）
  // 格式：人名：餐點 或 人名:餐點
  const colonMatch = trimmed.match(
    /^(.+?)[\uff1a\:](.+)$/
  );

  if (colonMatch) {
    const customerName = colonMatch[1].trim();
    const itemsText = colonMatch[2].trim();
    if (!customerName || !itemsText) return null;
    const items = splitItems(itemsText);
    return { customerName, items };
  }

  // 無冒號 → 餐點內容，不含人名
  // 要過濾掉純指令
  const commands = ['開始點餐', '結單', '明細', '查詢', '清除', '清空', 'reset', 'start', 'close', 'clear'];
  const lower = trimmed.toLowerCase();
  if (commands.includes(lower)) return null;

  const items = splitItems(trimmed);
  if (items.length === 0) return null;

  // 無人名，表示由 webhook handler 傳入 senderName 填入
  return { customerName: null, items };
}

function splitItems(text) {
  // 以空白、逗號（全形/半形）、頓號（全形）、+ 分隔
  const raw = text
    .replace(/[,，、]/g, ' ')
    .replace(/\+/g, ' ')
    .trim();

  if (!raw) return [];

  // 保留 "+" 前後可能有的空白，之後再 trim
  return raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
