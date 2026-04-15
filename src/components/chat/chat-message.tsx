"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="chat-message-user flex justify-end">
        <div className="chat-message-bubble max-w-[80%] rounded-2xl rounded-br-sm bg-brand-light border border-brand/30 px-4 py-2.5 text-sm text-text-primary">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message-assistant flex justify-start">
      <div className="chat-message-bubble max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-raised border border-border px-4 py-2.5">
        <pre className="whitespace-pre-wrap text-sm text-text-primary font-sans font-normal">
          {content}
        </pre>
      </div>
    </div>
  );
}
