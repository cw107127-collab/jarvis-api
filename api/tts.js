const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

module.exports = async function(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("zh-TW-HsiaoChenNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    const stream = tts.toStream(text);
    const chunks = []; // 準備一個水桶來收集聲音碎片

    // 🏆 強迫 Vercel 耐心等待：直到語音完全生成完畢
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk); // 把每一滴聲音裝進水桶
      });
      stream.on('end', () => {
        resolve(); // 宣告裝水完成！
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });

    // 將所有碎片組合成一個完整的 MP3 檔案
    const audioBuffer = Buffer.concat(chunks);
    
    // 加上完整長度標籤，一口氣回傳給手機
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.status(200).send(audioBuffer);
    
  } catch (error) {
    console.error("TTS 發生錯誤:", error);
    res.status(500).send("語音引擎啟動失敗");
  }
};
