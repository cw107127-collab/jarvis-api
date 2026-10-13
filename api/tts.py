from flask import Flask, request, Response
import edge_tts
import asyncio

app = Flask(__name__)

async def generate_audio(text, voice="zh-TW-YunJheNeural"):
    # 呼叫已經修復 403 問題的最強邊緣運算語音 (台灣男聲雲哲)
    communicate = edge_tts.Communicate(text, voice)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data

@app.route('/api/tts')
def tts():
    text = request.args.get('text')
    if not text:
        return "請提供 text 參數", 400
    
    try:
        # 建立新的事件迴圈，避免 Vercel 伺服器衝突
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio = loop.run_until_complete(generate_audio(text))
        
        # 將高音質 MP3 回傳給 ESP32
        return Response(audio, mimetype="audio/mpeg")
    except Exception as e:
        return str(e), 500
