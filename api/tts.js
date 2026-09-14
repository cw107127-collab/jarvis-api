import pkg from 'msedge-tts';
const { MsEdgeTTS, OUTPUT_FORMAT } = pkg;

export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  // 1. 消毒：把 Gemini 回傳內容裡可能會破壞語法的危險符號清掉
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '').replace(/>/g, '');

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("zh-CN-YunxiNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // 🚀 2. 標籤注入：只穿插 <prosody> 變聲標籤，不破壞原有的外殼！
    // rate="-20%": 降速 20%
    // pitch="-25%": 音調大幅壓低，製造無機質的厚重電子感
    const injectedText = `<prosody rate="-20%" pitch="-25%">${safeText}</prosody>`;

    // 把注入變聲標籤的文字送進引擎
    const { audioStream } = tts.toStream(injectedText);
    const chunks = []; 

    await new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const audioBuffer = Buffer.concat(chunks);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.status(200).send(audioBuffer);
    
  } catch (error) {
    console.error("微軟引擎發生錯誤:", error);
    res.status(500).send("引擎啟動失敗: " + error.message);
  }
}
