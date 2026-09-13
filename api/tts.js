// /api/tts.js
export default function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  // 將文字進行 URL 編碼，避免中文字造成網址錯誤
  const encodedText = encodeURIComponent(text);
  
  // 組合出一個 100% 穩定的 Google TTS 網址
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-TW&client=tw-ob`;

  // 告訴瀏覽器 (或 ESP32)：請直接去播放這個網址！
  res.redirect(302, audioUrl);
}
