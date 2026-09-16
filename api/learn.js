import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // ⛅️ 1. 取得嘉義市詳細氣象預報 (包含每小時與單日最高最低溫)
    let weatherContext = "無法取得詳細氣象，請播報天氣穩定。";
    try {
      const wRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=23.477&longitude=120.441&hourly=temperature_2m,precipitation_probability,windspeed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTaipei&forecast_days=1");
      if (wRes.ok) {
        const wData = await wRes.json();
        const maxT = wData.daily.temperature_2m_max[0];
        const minT = wData.daily.temperature_2m_min[0];
        
        // 抓取關鍵時段的數據 (早上8點、中午12點、下午4點、晚上8點)
        let hourlyStr = "";
        const hoursToCheck = [8, 12, 16, 20];
        hoursToCheck.forEach(h => {
          const temp = wData.hourly.temperature_2m[h];
          const rain = wData.hourly.precipitation_probability[h];
          const wind = wData.hourly.windspeed_10m[h];
          hourlyStr += `${h}點:氣溫${temp}度,降雨機率${rain}%,風速${wind}km/h。`;
        });
        
        weatherContext = `今日最高溫${maxT}度，最低溫${minT}度。各時段變化：${hourlyStr}`;
      }
    } catch (e) {
      console.log("詳細天氣讀取失敗");
    }

    // 🎲 2. 隨機主題扭蛋機 (專注於 2026 前沿科技)
    const topics = ["2026年的最新AI突破", "2026年的太空探索進展", "最近一年的重大醫學突破", "最新的機器人或自動化技術", "2026年新能源與電池技術"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const now = new Date().getTime();
    // 📅 自動取得當下的台灣日期 (格式：YYYY/MM/DD)
    const todayDate = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });

    // 🧠 3. 升級版提示詞：注入時間錨點與氣象數據陣列
    const prompt = `你現在是 E.V.，一個極度理智、冷靜的 AI 助理。
    【時間錨點】：今天是 ${todayDate}。(代碼：${now})
    
    【天氣數據】：
    嘉義今日氣象：「${weatherContext}」。
    
    【你的任務】：
    1. 氣象播報：請根據上述數據，以口語化的方式報告今天最高及最低溫大約落在哪裡、什麼時段可能會下雨或風勢較大。
    2. 知識補充：分享一則關於「${randomTopic}」的知識。
    
    【嚴格要求】：
    - 氣象報告請務必精簡像專業氣象主播。
    - 知識補充必須是「2026 年近一年內」最新發表的科技突破或科學新知，絕對不能使用 2026 年以前的舊資訊！
    - 必須包含具體細節（如最新研究機構、數字）。
    - 請用繁體中文，總字數嚴格控制在 120 字以內，適合直接用語音唸出。
    - 開頭請固定說：『報告 Sir，今日嘉義天氣...』接著說『另外，為您準備了最新的知識補充...』`;

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
          temperature: 0.8 // 稍微降溫，確保它拿出來的是真實新聞，不會腦補太多科幻情節
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
