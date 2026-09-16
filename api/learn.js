import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // ⛅️ 1. 取得詳細氣象 (保留早、中、下午、晚上的關鍵數據)
    let weatherContext = "無法取得詳細氣象";
    try {
      const wRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=23.477&longitude=120.441&hourly=temperature_2m,precipitation_probability,windspeed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTaipei&forecast_days=1");
      if (wRes.ok) {
        const wData = await wRes.json();
        const maxT = wData.daily.temperature_2m_max[0];
        const minT = wData.daily.temperature_2m_min[0];
        
        let hourlyStr = "";
        const hours = [8, 12, 16, 20];
        hours.forEach(h => {
          hourlyStr += `${h}點:氣溫${wData.hourly.temperature_2m[h]}度,降雨機率${wData.hourly.precipitation_probability[h]}%,風速${wData.hourly.windspeed_10m[h]}km/h。`;
        });
        
        weatherContext = `今日最高溫${maxT}度，最低溫${minT}度。各時段變化：${hourlyStr}`;
      }
    } catch (e) {
      console.log("詳細天氣讀取失敗");
    }

    // 📅 2. 自動抓取當下的台灣日期 (月/日)
    const now = new Date();
    // 確保時區正確，只抓取數字的月和日
    const month = now.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric' }).replace('月', '');
    const day = now.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', day: 'numeric' }).replace('日', '');
    const todayDate = `${month}月${day}日`;
    const timestamp = now.getTime();

    // 🎲 3. 隨機主題扭蛋機 (換成有趣、實用的科技主題)
    const topics = ["2026年最新實用的AI應用", "最近一年與生活相關的機器人發明", "2026年最酷的硬體或物聯網新玩具", "與虛擬實境或遊戲相關的最新科技", "未來日常通勤的新突破"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // 🧠 4. 終極版提示詞：加入日期，要求白話文與全面天氣
    const prompt = `你現在是 E.V.，一個極度理智、冷靜的 AI 助理。
    【時間錨點】：今天是 2026 年 ${todayDate}。(代碼：${timestamp})
    
    【天氣數據】：
    嘉義今日氣象：「${weatherContext}」。
    
    【你的任務】：
    1. 氣象播報：請根據數據，給出「全面但順暢」的報告。包含高低溫、早中晚的變化，並提醒哪個時段會下雨或風大、該如何防範。
    2. 知識補充：分享一則關於「${randomTopic}」的最新知識 (限 2026 年近一年內)。
    
    【嚴格要求】：
    - 知識補充必須「非常白話、生活化」，想像你在跟喜歡寫程式與做硬體的年輕人對話，絕對不能用艱澀的材料學或學術名詞，請用日常比喻讓他一聽就懂。
    - 總字數控制在 150 字以內，適合用語音順暢唸出。
    - 開頭請固定說：『報告 Sir，今天是 ${todayDate}，嘉義今日天氣...』接著說『另外，為您準備了最新的知識補充...』`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).send("找不到金鑰，請確認 Vercel 設定");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8
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
