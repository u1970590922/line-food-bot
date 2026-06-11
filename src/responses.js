/**
 * 回應格式模組
 */
export function formatSummary(orders) {
  const entries = Object.entries(orders);
  if (entries.length === 0) {
    return '🍱 點餐匯總\n─────────────────\n尚無點餐資料\n─────────────────';
  }

  const lines = entries.map(([name, items]) => {
    const itemStr = items.join('、');
    return `${name}：${itemStr}`;
  });

  const body = lines.join('\n');
  const count = entries.length;
  return `🍱 點餐匯總\n─────────────────\n${body}\n─────────────────\n共 ${count} 人點餐`;
}

export function formatHelp() {
  return `📋 點餐 Bot 指令說明

• 開始點餐 — 開啟新一輪點餐
• 結單 — 輸出匯總並結束
• 明細 / 查詢 — 查看目前匯總
• 清除 / 清空 — 清除所有資料

💡 點餐方式：
• 直接輸入餐點 → 自動記錄為你的名字
• 人名：餐點 → 手動指定記錄給某人
• 支援全形/半形冒號，多項用空白/逗號/+ 分隔`;
}
