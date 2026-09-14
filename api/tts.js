import pkg from 'msedge-tts';
const { MsEdgeTTS, OUTPUT_FORMAT } = pkg;

export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    const tts = new MsEdgeTTS();
    
    // 🚀 為未來的 E.V 換上「曉雨 (HsiaoYu)」自然台灣女聲
    // 若未來想要更活潑的聲音，可改為 "zh-CN-XiaoxiaoNeural"
    await tts.setMetadata("zh-TW-HsiaoYuNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    const { audioStream } = tts.toStream(text);
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
