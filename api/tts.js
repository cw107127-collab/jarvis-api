export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("請提供 text 參數");
  }

  try {
    // 呼叫 Puter 的免授權黑科技端點
    const response = await fetch('https://api.puter.com/v1/txt2speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        language: 'zh-TW'
      })
    });

    if (!response.ok) {
      throw new Error(`Puter 伺服器拒絕連線，錯誤碼: ${response.status}`);
    }

    // 成功攔截音檔！將音訊資料轉成 Buffer 一口氣傳回去
    const arrayBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error("語音生成錯誤:", error);
    res.status(500).send("黑科技啟動失敗: " + error.message);
  }
}
