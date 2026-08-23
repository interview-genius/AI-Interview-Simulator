import { apiPost } from './client';
import type { CodingStartResponse, CodingTurn } from '../types/interview';

export function startCodingSession(level?: string, role?: string): Promise<CodingStartResponse> {
  return apiPost<CodingStartResponse>('/interview/coding/start', { level, role });
}

export function sendCodingTurn(
  sessionId: string,
  candidateMessage: string,
  currentCode?: string
): Promise<CodingTurn> {
  return apiPost<CodingTurn>('/interview/coding/turn', {
    session_id: sessionId,
    candidate_message: candidateMessage,
    current_code: currentCode,
  });
}
