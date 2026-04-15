"use client";

import { MessageSquare } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "What are my strongest selling points for a software engineering role?",
  "How should I frame my career transition in interviews?",
  "Help me prepare talking points for an upcoming interview.",
];

interface ChatEmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="chat-empty-state flex flex-col items-center justify-center h-full text-center px-4 py-12">
      <div className="chat-empty-state-icon mb-4">
        <MessageSquare className="h-10 w-10 text-brand/30" />
      </div>
      <h2 className="chat-empty-state-title font-display text-xl font-semibold text-text-primary mb-2">
        Ask me anything about your career
      </h2>
      <p className="chat-empty-state-desc text-sm text-text-secondary mb-6 max-w-sm">
        I know your CV and profile. Pick a job analysis above to get tailored
        advice about a specific role, or ask general career questions.
      </p>
      <div className="chat-empty-state-suggestions space-y-2 w-full max-w-md">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSuggestionClick(prompt)}
            className="chat-suggestion-button w-full text-left rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>
      <p className="chat-empty-state-notice mt-8 text-xs text-text-muted">
        Conversations are not saved — they reset when you leave this page.
      </p>
    </div>
  );
}
