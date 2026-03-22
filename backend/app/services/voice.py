"""Voice service stub — interface for STT/TTS integration.

TODO (for developer):
  1. Install whisper: pip install openai-whisper  (or use OpenAI Whisper API)
  2. Install TTS: pip install gTTS  (or use OpenAI TTS / ElevenLabs)
  3. Implement speech_to_text() with real Whisper model
  4. Implement text_to_speech() with real TTS engine
  5. Wire into the voice route for end-to-end audio processing

Current behaviour: passes text through to the RAG assistant, no actual audio processing.
"""

from __future__ import annotations


def speech_to_text(audio_bytes: bytes, format: str = "wav") -> str:
    """Convert audio bytes to text transcript.

    TODO: Replace with real Whisper STT implementation.
    Example with openai-whisper:
        import whisper
        model = whisper.load_model("base")
        # Save audio_bytes to temp file, then:
        result = model.transcribe(temp_path)
        return result["text"]

    Example with OpenAI API:
        from openai import OpenAI
        client = OpenAI()
        transcript = client.audio.transcriptions.create(
            model="whisper-1", file=audio_file
        )
        return transcript.text
    """
    raise NotImplementedError(
        "STT not implemented. Pass text directly or implement Whisper integration."
    )


def text_to_speech(text: str, voice: str = "default") -> bytes:
    """Convert text to audio bytes.

    TODO: Replace with real TTS implementation.
    Example with gTTS:
        from gtts import gTTS
        import io
        tts = gTTS(text=text, lang='en')
        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        return buffer.getvalue()

    Example with OpenAI API:
        from openai import OpenAI
        client = OpenAI()
        response = client.audio.speech.create(
            model="tts-1", voice="alloy", input=text
        )
        return response.content
    """
    raise NotImplementedError(
        "TTS not implemented. Return text response or implement TTS integration."
    )
