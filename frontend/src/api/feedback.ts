import { apiPost } from './client';

export interface DimensionFeedback {
  score: number;
  tip: string;
}

export interface ComprehensiveFeedbackResponse {
  mode: string;
  overall_recommendation: string;
  summary_verdict: string;
  technical_ability?: DimensionFeedback;
  communication?: DimensionFeedback;
  problem_solving?: DimensionFeedback;
  optimisation?: DimensionFeedback;
  debugging?: DimensionFeedback;
  confidence?: DimensionFeedback;
  resume_discussion?: DimensionFeedback;
  behavioural?: DimensionFeedback;
  star?: DimensionFeedback;
  depth?: DimensionFeedback;
  clarity?: DimensionFeedback;
  presence?: DimensionFeedback;
  [key: string]: any;
}

export interface RecordInterviewPayload {
  company: string;
  role: string;
  round_type: string;
  session_transcript?: any;
  feedback_result?: any;
}

export function getSessionFeedback(payload: {
  session_id?: string;
  round_type?: string;
  company?: string;
  role?: string;
  level?: string;
  transcript?: any;
  code?: string;
}): Promise<ComprehensiveFeedbackResponse> {
  return apiPost<ComprehensiveFeedbackResponse>('/interview/feedback', payload);
}

export function recordInterviewHistory(
  payload: RecordInterviewPayload
): Promise<{ message: string; interview_history_id: number; user_id?: number }> {
  return apiPost<{ message: string; interview_history_id: number; user_id?: number }>(
    '/interview-history',
    payload
  );
}
