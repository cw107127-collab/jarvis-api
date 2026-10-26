export default async function handler(req, res) {
  // 把 ESP32 傳來的 '+' 號還原回真正的空格
  const rawText = req.query.text || "Hello Sir";
  const text = rawText.replace(/\+/g, " ");

  try {
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text
    )}&tl=zh-TW&client=tw-ob`;

    const gRes = await fetch(googleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!gRes.ok) {
      throw new Error(`Google HTTP Status: ${gRes.status}`);
    }

    const arrayBuffer = await gRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✅ 成功產生語音: "${text}" (${buffer.length} bytes)`);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("❌ TTS 失敗:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
