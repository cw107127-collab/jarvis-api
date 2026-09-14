import { experimental_generateSpeech as generateSpeech } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    const result = await generateSpeech({
      model: gateway.speechModel('fish-audio/s1-free'),
      text: text,
      voice: '933563129e564b19a115bedd57b7406a', 
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(result.audio));

  } catch (error) {
    console.error("Vercel AI 語音失敗:", error);
    res.status(500).send("語音生成失敗: " + error.message);
  }
}
