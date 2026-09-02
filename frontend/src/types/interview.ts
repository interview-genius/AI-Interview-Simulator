// Mirrors interview_engine/conversation_schema.py and coding.py's pydantic models.

export interface MLStartRequest {
  company: string;
  role: string;
  level: string;
  resume_id?: number;
}

export interface MLStartResponse {
  session_id: string;
  opening_question: string;
  phase: string;
}

export interface ConversationTurn {
  interviewer_response: string;
  cited_report_ids: number[];
  grounded: boolean;
  advance_phase: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: string;
  statement: string;
  starter_code: string;
  language: string;
}

export interface CodingStartResponse {
  session_id: string;
  problem: CodingProblem;
  opening_line: string;
}

export interface CodingTurn {
  interviewer_response: string;
}

// Shared conversation-log entry used by TranscriptLog, independent of
// which mode/API produced it.
export interface TranscriptEntry {
  speaker: 'candidate' | 'interviewer';
  text: string;
}
