import pkg from 'msedge-tts';
const { MsEdgeTTS, OUTPUT_FORMAT } = pkg;

export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("zh-CN-XiaoxiaoNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // 🚀 關鍵修復：加上大括號，從回傳的物件中把 audioStream 解構出來
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
