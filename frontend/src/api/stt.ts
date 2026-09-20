import { ApiError } from './client';

export interface STTResponse {
  transcript: string;
}

export async function transcribeAudioBlob(blob: Blob, prompt?: string): Promise<string> {
  const formData = new FormData();
  const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('mp4') ? 'm4a' : 'webm';
  formData.append('file', blob, `candidate_answer.${ext}`);
  if (prompt) {
    formData.append('prompt', prompt);
  }

  const res = await fetch('/api/stt', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail || 'STT transcription failed');
  }

  const data = (await res.json()) as STTResponse;
  return data.transcript || '';
}

export async function transcribeAudioBase64(base64Data: string, mimeType = 'audio/webm', prompt?: string): Promise<string> {
  const res = await fetch('/api/stt/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_base64: base64Data,
      mime_type: mimeType,
      prompt,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail || 'STT base64 transcription failed');
  }

  const data = (await res.json()) as STTResponse;
  return data.transcript || '';
}
