import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // ⛅️ 1. 自動獲取真實天氣
    let weatherInfo = "天氣晴朗";
    try {
      const wRes = await fetch("https://wttr.in/Chiayi?format=%C+%t");
      if (wRes.ok) {
        weatherInfo = await wRes.text(); 
      }
    } catch (e) {
      console.log("天氣讀取失敗，使用預設值");
    }

    // 🎲 2. 隨機主題扭蛋機
    const topics = ["最新科技新聞", "太空探索進度", "有趣的科學冷知識", "最新 AI 發展", "深海與自然奧秘", "未來的醫學突破"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const now = new Date().getTime();

    // 🧠 3. 動態組合提示詞
    const prompt = `你現在是 E.V.，一個極度理智、冷靜的 AI 助理。(學習代碼：${now})
    目前的嘉義天氣狀況為：「${weatherInfo}」。
    請先用一句話報告今天的天氣概況與溫度，接著再分享一則關於「${randomTopic}」的最新資訊。
    請用繁體中文在 80 個字以內總結重點。開頭請固定說：『報告 Sir，今天嘉義天氣...』接著說『另外，我趁您休息時發現...』`;

    // 🚀 4. 這是截圖裡唯一存活的有效鑰匙！請原封不動使用它！
    const apiKey = "AQ.Ab8RN6LDFyhxw_9ry_3IY8eY5AHfZloUIMTB9hdjFhy7oNzPkQ";
    
    // 使用最標準的 ?key= 寫法，並呼叫 3.5 模型
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1.2
        }
      })
    });

    const data = await response.json();

    if (!data.candidates) {
        return res.status(500).send(`Gemini 拒絕回答，原因是：${JSON.stringify(data)}`);
    }

    const learningText = data.candidates[0].content.parts[0].text;
    await kv.set('ev_daily_memory', learningText);

    res.status(200).send(`✅ E.V. 學習完畢並已存檔：${learningText}`);
    
  } catch (error) {
    res.status(500).send("伺服器嚴重錯誤: " + error.message);
  }
}
