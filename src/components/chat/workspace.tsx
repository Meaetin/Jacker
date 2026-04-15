"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Send, Square } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { ChatEmptyState } from "./chat-empty-state";
import { AnalysisSelector } from "./analysis-selector";
import type { JobFitAnalysis } from "@/types/profile";

interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
}

interface ChatWorkspaceProps {
  profileReady: boolean;
  analyses: JobFitAnalysis[];
}

export function ChatWorkspace({ profileReady, analyses }: ChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
  }, [input]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const newMessages: ChatMessageData[] = [
      ...messages,
      { role: "user", content: content.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Abort any existing stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          analysis_id: selectedAnalysisId || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error || "Request failed"}` },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message for streaming
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Stream was cancelled — partial response remains visible
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: Network error. Please try again." },
        ]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleSuggestionClick(prompt: string) {
    sendMessage(prompt);
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  return (
    <div className="chat-workspace max-w-4xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="chat-header flex items-center justify-between py-3 border-b border-border">
        <h1 className="chat-header-title font-display text-lg font-semibold text-text-primary">
          Talk to AI
        </h1>
        <AnalysisSelector
          analyses={analyses}
          selectedId={selectedAnalysisId}
          onSelect={setSelectedAnalysisId}
        />
      </div>

      {/* Profile warning */}
      {!profileReady && (
        <div className="chat-profile-warning rounded-lg border border-amber-200 bg-amber-50 p-3 mx-2 mt-2 text-sm text-amber-700">
          Set up your CV and profile first on the CV &amp; Profile page to get personalized responses.
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages flex-1 overflow-y-auto px-2 py-4 space-y-3">
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar border-t border-border p-3">
        <div className="chat-input-wrapper flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? "Waiting for response..." : "Type a message... (Enter to send, Shift+Enter for new line)"}
            disabled={loading || !profileReady}
            rows={1}
            className="chat-input-textarea flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary resize-none min-h-[2.5rem] max-h-32 transition-colors focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {loading ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="chat-stop-button flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-status-rejected text-white transition-colors hover:opacity-90 cursor-pointer"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || !profileReady}
              className="chat-send-button flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
