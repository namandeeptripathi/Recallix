export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  lecture_id: string;
  lecture_title: string;
  powered_by: string;
}
