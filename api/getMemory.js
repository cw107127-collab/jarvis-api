import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // 從 KV 記憶體中拿出 E.V. 存好的新聞
    const memory = await kv.get('ev_daily_memory');
    
    if (memory) {
      // 如果有記憶，就直接回傳文字
      res.status(200).send(memory);
    } else {
      // 如果還沒學習過，給個預設台詞
      res.status(200).send("報告 Sir，今天還沒有新的發現。");
    }
  } catch (error) {
    res.status(500).send("讀取記憶失敗");
  }
}
