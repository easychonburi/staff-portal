// netlify/functions/telegram.js
// ส่งข้อความเข้า Telegram แบบแยกห้องตามที่ตั้งค่าไว้
// *** ข้อความทุกแบบไม่มีบรรทัด "ความคืบหน้า:" แล้ว ***

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    return { statusCode: 500, body: 'Missing TELEGRAM_TOKEN' };
  }

  const {
    branch = '-',
    mode = 'open', // 'open' | 'close'
    date = '',
    time = '',
    stocks = [],  // [{name, value, unit}]
    orders = [],  // [string]
  } = JSON.parse(event.body || '{}');

  const CHAT_OPEN   = process.env.TELEGRAM_CHAT_ID_OPEN   || process.env.TELEGRAM_CHAT_ID;
  const CHAT_ORDERS = process.env.TELEGRAM_CHAT_ID_ORDERS || process.env.TELEGRAM_CHAT_ID;
  const CHAT_STOCKS = process.env.TELEGRAM_CHAT_ID_STOCKS || process.env.TELEGRAM_CHAT_ID;

  const api = (method) => `https://api.telegram.org/bot${token}/${method}`;

  const escape = (s='') =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const headerLine = (title) =>
  `📦 ${title}\nสาขา: ${escape(branch)}\nวันที่: ${escape(date)}\nเวลา: ${escape(time)}`;

  const formatStocks = () => {
    const head = headerLine(mode === 'open' ? 'เช็คสต๊อก (เปิดร้าน)' : 'เช็คสต๊อก (ปิดร้าน)');
    if (!stocks || stocks.length === 0) {
      return `${head}\n\n— ไม่มีรายการกรอกจำนวน —`;
    }
    const lines = stocks.map(
      (x) => `• ${escape(x.name)}: ${escape(x.value)} ${escape(x.unit || '')}`.trim()
    );
    return `${head}\n\n${lines.join('\n')}`;
  };

  const formatOrders = () => {
    const head = headerLine('สรุปรายการสั่งเพิ่ม');
    if (!orders || orders.length === 0) {
      return `${head}\n\n— ไม่มีรายการสั่งเพิ่ม —`;
    }
    const lines = orders.map((n) => `• ${escape(n)}`);
    return `${head}\n\n${lines.join('\n')}`;
  };

  async function send(chatId, text) {
    if (!chatId) return;
    await fetch(api('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  }

  try {
    if (mode === 'open') {
      // เปิดร้าน: ส่งเฉพาะ "เช็คสต๊อก (เปิดร้าน)"
      await send(CHAT_OPEN, formatStocks());
    } else {
      // ปิดร้าน: แยกสองข้อความ
      await send(CHAT_STOCKS, formatStocks()); // รายการคงเหลือ
      await send(CHAT_ORDERS, formatOrders()); // รายการสั่งเพิ่ม
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: `Telegram error: ${e.message}` };
  }
}
