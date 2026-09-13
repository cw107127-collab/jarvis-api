const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

module.exports = async function(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    // 1. 啟動微軟 Edge 語音引擎
    const tts = new MsEdgeTTS();
    
    // 2. 設定聲音為台灣微軟曉臻 (高音質 MP3 格式)
    await tts.setMetadata("zh-TW-HsiaoChenNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // 3. 告訴瀏覽器 (或 ESP32)：接下來傳過去的是 MP3 音樂檔喔！
    res.setHeader('Content-Type', 'audio/mpeg');
    
    // 4. 開始將文字轉成語音，並直接「像水管一樣」串流灌給 ESP32
    const stream = tts.toStream(text);
    stream.pipe(res);
    
  } catch (error) {
    console.error("TTS 發生錯誤:", error);
    res.status(500).send("語音引擎啟動失敗");
  }
};
