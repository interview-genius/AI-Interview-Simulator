import { apiPost } from './client';
import type { ConversationTurn } from '../types/interview';

export interface HRStartRequest {
  company: string;
  role: string;
  level: string;
  resume_id?: number;
}

export interface HRStartResponse {
  session_id: string;
  opening_question: string;
  phase: string;
}

export function startHRSession(req: HRStartRequest): Promise<HRStartResponse> {
  return apiPost<HRStartResponse>('/interview/hr/start', req);
}

export function sendHRTurn(
  sessionId: string,
  candidateAnswer: string,
  endInterview: boolean = false
): Promise<ConversationTurn> {
  return apiPost<ConversationTurn>('/interview/hr/turn', {
    session_id: sessionId,
    candidate_answer: candidateAnswer,
    end_interview: endInterview,
  });
}
