export default function handler(req, res) {
  const text = req.query.text || "目前沒有收到文字喔";
  res.status(200).send(`賈維斯雲端大腦已上線！你傳進來的文字是：${text}`);
}
