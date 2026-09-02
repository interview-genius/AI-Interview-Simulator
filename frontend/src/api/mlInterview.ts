import { apiPost } from './client';
import type { ConversationTurn, MLStartRequest, MLStartResponse } from '../types/interview';

export function startMLSession(req: MLStartRequest): Promise<MLStartResponse> {
  return apiPost<MLStartResponse>('/interview/ml/start', req);
}

export function sendMLTurn(sessionId: string, candidateAnswer: string): Promise<ConversationTurn> {
  return apiPost<ConversationTurn>('/interview/ml/turn', {
    session_id: sessionId,
    candidate_answer: candidateAnswer,
  });
}
