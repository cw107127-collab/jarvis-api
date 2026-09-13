// /api/tts.js
export default async function handler(req, res) {
  // 1. 取得 ESP32 傳來的文字
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    // 2. 設定我們要用的聲音 (這裡用台灣微軟曉臻的聲音，比 Google 自然)
    const voice = 'zh-TW-HsiaoChenNeural'; 
    
    // 3. 呼叫一個免費的 Edge TTS API 服務 (將文字轉成語音)
    // 備註：這是網路上開源的代理服務，方便我們測試
    const apiUrl = `https://api.tts.quest/v3/voicemaker/create`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voiceId: voice,
        audioFormat: 'mp3'
      })
    });

    const data = await response.json();

    if (data.audioUrl) {
      // 4. 成功拿到 MP3 網址！我們不把檔案下載下來，而是告訴 ESP32「去這個網址抓音檔」
      // 這個動作叫做 HTTP 302 重新導向 (Redirect)
      res.redirect(302, data.audioUrl);
    } else {
      res.status(500).send("無法生成語音檔");
    }

  } catch (error) {
    console.error(error);
    res.status(500).send("伺服器錯誤");
  }
}
