// /api/tts.js
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export default async function handler(req, res) {
  const text = req.query.text;

  // 基本防呆檢查
  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    // 呼叫 Vercel 原生的 Fish Audio 免費模型
    const result = await generateSpeech({
      model: gateway.speechModel('fish-audio/s1-free'),
      text: text,
      // 這是 Fish Audio 預設的女聲 ID，聲音自然且帶有情緒
      voice: '933563129e564b19a115bedd57b7406a', 
    });

    // 成功拿到音檔資料後，設定正確的標頭，並回傳二進位資料給手機/ESP32
    res.setHeader('Content-Type', 'audio/mpeg');
    // 注意：舊版的 Buffer 寫法在最新 Vercel API 中可能會報錯，我們改用最穩定的方式
    res.status(200).send(Buffer.from(result.audio));

  } catch (error) {
    // 依然保留除錯機制，萬一失敗才知道死因
    console.error("Vercel AI 語音失敗:", error);
    res.status(500).send("語音生成失敗: " + error.message);
  }
}
