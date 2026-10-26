import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export default async function handler(req, res) {
  // 使用現代網址解析，不觸發 url.parse() 警告
  const text = (req.query?.text || "").trim();
  if (!text) {
    return res.status(400).send("Missing text");
  }

  // 自動判斷這句話有沒有中文字（配合你的國二英文雙語設定）
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);

  // ==========================================
  // 引擎 1：優先嘗試微軟 Edge 擬真語音
  // ==========================================
  try {
    const tts = new MsEdgeTTS();
    const voice = hasChinese ? "zh-TW-YunJheNeural" : "en-GB-RyanNeural"; // 英國男管家音 + 台灣男聲
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);
    const chunks = [];

    await new Promise((resolve, reject) => {
      audioStream.on("data", (chunk) => chunks.push(chunk));
      audioStream.on("end", resolve);
      audioStream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) throw new Error("Empty audio buffer");

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.status(200).send(buffer);

  } catch (edgeErr) {
    console.warn("⚠️ 微軟 403 被擋，秒切 Google TTS 備援:", edgeErr.message);
  }

  // ==========================================
  // 引擎 2：Google TTS 不死鳥備援（微軟掛掉時自動接手）
  // ==========================================
  try {
    const lang = hasChinese ? "zh-TW" : "en-GB";
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

    const gRes = await fetch(googleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!gRes.ok) {
      throw new Error(`Google TTS HTTP ${gRes.status}`);
    }

    const arrayBuffer = await gRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.status(200).send(buffer);

  } catch (googleErr) {
    console.error("❌ 雙引擎皆失敗:", googleErr.message);
    return res.status(500).json({ error: "TTS failed" });
  }
}
