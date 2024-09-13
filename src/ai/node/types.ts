interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  }
}

interface Message {
  role: string;
  content: any;
  tool_calls: ToolCall[];
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason?: string;
}

export interface ChunkChoice {
  index: number;
  delta: Message;
  finish_reason?: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: string;
  model: string;
  system_fingerprint: string;
  choices: Choice[];
  usage?: Usage;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: string;
  model: string;
  system_fingerprint: string;
  choices: ChunkChoice[];
}

export interface CompletionChoice {
  finish_reason: string;
  index: number;
  text: string;
}

export interface Completion {
  id: string;
  choices: Array<CompletionChoice>;
  created: number;
  model: string;
  object: 'text_completion';
  system_fingerprint?: string;
  usage?: Usage;
}
