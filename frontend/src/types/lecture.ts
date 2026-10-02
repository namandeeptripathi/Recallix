export interface TaskItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  raw_notes: string;
  summary?: string;
  key_concepts: string[];
  action_items: TaskItem[];
  status: "processed" | "processing" | "pending" | "ai_failed";
  created_at: string;
  updated_at: string;
}

export interface CreateLectureInput {
  title: string;
  subject: string;
  raw_notes: string;
}
