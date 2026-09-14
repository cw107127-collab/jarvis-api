import pkg from 'msedge-tts';
const { MsEdgeTTS, OUTPUT_FORMAT } = pkg;

export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  // 🛡️ 防呆機制：將 Gemini 回傳的特殊符號轉換，避免破壞變聲器的 XML 結構
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    const tts = new MsEdgeTTS();
    // 這裡我們以雲希男聲為基底 (你也可以換成你喜歡的配音員)
    await tts.setMetadata("zh-TW-HsiaoChenNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // 🎛️ 變聲調音台 (SSML)
    // rate="-20%": 語速放慢 20%
    // pitch="-15%": 音調壓低 15%，製造出厚重、無情緒的機器電子感
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
                    <voice name="zh-CN-YunxiNeural">
                      <prosody rate="-20%" pitch="-15%">
                        ${safeText}
                      </prosody>
                    </voice>
                  </speak>`;

    // 將改裝過的 SSML 送進引擎
    const { audioStream } = tts.toStream(ssml);
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
