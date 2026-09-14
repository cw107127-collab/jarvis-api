import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // ⚠️ 記得替換成你的 Gemini API 金鑰
    const apiKey = "AQ.Ab8RN6Lv9CXYkk88nvPhCuXf0fYS5kBkQSHJXSaIXQXLSWnvRA";
    
    // 給 E.V. 的自主學習指令
    const prompt = "你現在是 E.V.，一個極度理智、冷靜的 AI 助理。請去網路上隨機搜尋一則今天最新的科技新聞、太空探索進度或有趣的科學冷知識。請用繁體中文在 50 個字以內總結重點。開頭請固定說：『報告 Sir，我趁您休息時發現了一筆資料...』";

    // 呼叫 Gemini 進行自主學習
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const learningText = data.candidates[0].content.parts[0].text;

    // 將學習成果寫入 Vercel KV 記憶體區
    await kv.set('ev_daily_memory', learningText);

    res.status(200).send(`✅ E.V. 學習完畢並已存檔：${learningText}`);
    
  } catch (error) {
    console.error("學習失敗:", error);
    res.status(500).send("學習失敗: " + error.message);
  }
}
