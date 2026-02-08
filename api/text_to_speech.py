from gtts import gTTS
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
import io

app = FastAPI(root_path='/api/text_to_speech')

@app.get('')
async def text_to_speech(text: str = Query(..., min_length=1, max_length=200), lang: str = 'en') -> StreamingResponse:
    fp: io.BytesIO = io.BytesIO()
    tts: gTTS = gTTS(text, lang=lang)
    tts.write_to_fp(fp)
    fp.seek(0)

    return StreamingResponse(fp, media_type='audio/mpeg', headers={ # type: ignore
        'Content-Disposition': 'inline; filename="tts.mp3"'
    })