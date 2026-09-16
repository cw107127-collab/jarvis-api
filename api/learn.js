import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // ⛅️ 1. 換成絕對不會被擋的 Open-Meteo 氣象局 (精準鎖定嘉義市經緯度)
    let weatherInfo = "無法取得即時天氣";
    try {
      const wRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=23.477&longitude=120.441&current_weather=true");
      if (wRes.ok) {
        const wData = await wRes.json();
        const temp = wData.current_weather.temperature;
        // 把生硬的數字包裝成自然的口語
        weatherInfo = `目前氣溫大約 ${temp} 度`;
      }
    } catch (e) {
      console.log("天氣讀取失敗");
    }

    // 🎲 2. 防空泛主題扭蛋機 (專注於真實知識)
    const topics = ["令人驚訝的動物冷知識", "人類歷史上的重大今天", "宇宙中真實存在的奇特星體", "改變世界的一項真實發明", "深海生物的奇特生存法則"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const now = new Date().getTime();

    // 🧠 3. 嚴謹版提示詞：強迫 AI 給出具體細節，禁止幻想！
    const prompt = `你現在是 E.V.，一個極度理智、冷靜的 AI 助理。(代碼：${now})
    目前的嘉義天氣為：「${weatherInfo}」。
    請先報告今天的天氣概況，接著分享一則關於「${randomTopic}」的知識。
    
    【嚴格要求】：
    1. 知識必須是「真實發生過」或「真實存在」的具體事實。
    2. 必須包含具體細節（例如：人名、年份、數字、或精確地點）。
    3. 絕對不要講「未來將會突破」這種空泛的預測。
    
    請用繁體中文在 80 個字以內總結重點。開頭請固定說：『報告 Sir，今天嘉義天氣...』接著說『另外，為您準備了今天的知識補充...』`;

    // 🔐 從保險箱拿出金鑰
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).send("找不到金鑰，請確認 Vercel 設定");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9 // 降溫！讓 E.V. 變得更理智嚴謹
        }
      })
    });

    const data = await response.json();

    if (!data.candidates) {
        return res.status(500).send(`錯誤：${JSON.stringify(data)}`);
    }

    const learningText = data.candidates[0].content.parts[0].text;
    await kv.set('ev_daily_memory', learningText);

    res.status(200).send(`✅ E.V. 學習完畢並已存檔：${learningText}`);
    
  } catch (error) {
    res.status(500).send("伺服器嚴重錯誤: " + error.message);
  }
}
