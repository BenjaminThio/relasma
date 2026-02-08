import base64
from typing import Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yt_dlp
import os

app = FastAPI(root_path='/api/music')

class PlayRequest(BaseModel):
    url: str

@app.get('')
@app.get('/')
async def test() -> dict[str, Any]:
    return {'ok': True, 'message': 'I am working and healthy.'}

@app.post('')
@app.post('/')
async def yt_audio(req: PlayRequest) -> dict[str, Any]:
    try:
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'noplaylist': True,
            'no_warnings': True,
            'format': 'bestaudio/best',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'ios']
                }
            },
            'cache_dir': '/tmp/yt_dlp_cache'
        }

        b64_cookies = os.getenv('YT_COOKIES')

        if b64_cookies:
            cookie_file_path = '/tmp/cookies.txt'

            with open(cookie_file_path, 'wb') as f:
                f.write(base64.b64decode(b64_cookies)) # type: ignore

                ydl_opts['cookiefile'] = cookie_file_path # type: ignore

        with yt_dlp.YoutubeDL(ydl_opts) as ydl: # type: ignore
            info = ydl.extract_info(req.url, download=False)

        formats = info.get('formats') or []

        audio_formats = [
            f for f in formats
            if f.get('acodec') not in (None, 'none')
            and f.get('vcodec') in (None, 'none')
            and f.get('url')
        ]
        if not audio_formats:
            audio_formats = [
                f for f in formats
                if f.get('acodec') not in (None, 'none') and f.get('url')
            ]

        if not audio_formats:
            raise RuntimeError('No audio format found!')

        best = max(audio_formats, key=lambda f: (f.get('abr') or 0, f.get('tbr') or 0))

        return {
            'ok': True,
            'title': info.get('title'),
            'duration': info.get('duration'),
            'url': best['url'],
            'ext': best.get('ext'),
            'abr': best.get('abr'),
            'mimeType': best.get('mime_type')
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) # type: ignore