import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const prompt = "你現在是 E.V.，一個極度理智、冷靜的 AI 助理。請去網路上隨機搜尋一則今天最新的科技新聞、太空探索進度或有趣的科學冷知識。請用繁體中文在 50 個字以內總結重點。開頭請固定說：『報告 Sir，我趁您休息時發現了一筆資料...』";

    // 🚀 關鍵修正：直接把這把 AQ 金鑰寫死在網址的最後面，不用變數替換了！
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6Lv9CXYkk88nvPhCuXf0fYS5kBkQSHJXSaIXQXLSWnvRA", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // 測謊機機制
    if (!data.candidates) {
        return res.status(500).send(`Gemini 還是拒絕回答，原因是：${JSON.stringify(data)}`);
    }

    const learningText = data.candidates[0].content.parts[0].text;
    
    // 寫入 Vercel KV 記憶體
    await kv.set('ev_daily_memory', learningText);

    res.status(200).send(`✅ E.V. 學習完畢並已存檔：${learningText}`);
    
  } catch (error) {
    res.status(500).send("伺服器嚴重錯誤: " + error.message);
  }
}
