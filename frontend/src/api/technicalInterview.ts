import { apiPost } from './client';
import type { ConversationTurn } from '../types/interview';

export interface TechnicalStartRequest {
  company: string;
  role: string;
  level: string;
  resume_id?: number;
}

export interface TechnicalStartResponse {
  session_id: string;
  opening_question: string;
  phase: string;
}

export function startTechnicalSession(req: TechnicalStartRequest): Promise<TechnicalStartResponse> {
  return apiPost<TechnicalStartResponse>('/interview/technical/start', req);
}

export function sendTechnicalTurn(
  sessionId: string,
  candidateAnswer: string,
  endInterview: boolean = false
): Promise<ConversationTurn> {
  return apiPost<ConversationTurn>('/interview/technical/turn', {
    session_id: sessionId,
    candidate_answer: candidateAnswer,
    end_interview: endInterview,
  });
}
