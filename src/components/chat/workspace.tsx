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
  isDemo?: boolean;
}

const DEMO_MESSAGES: ChatMessageData[] = [
  {
    role: "user",
    content: "I have a Stripe backend engineer interview coming up. What should I focus on to prepare?",
  },
  {
    role: "assistant",
    content: `Great that you're thinking ahead for the Stripe interview. Based on your profile as a backend engineer with strong systems experience, here's what I'd prioritize:

**1. API Design & System Thinking**
Stripe cares deeply about clean, developer-friendly APIs. Review RESTful design principles, versioning strategies, and idempotency — they love asking about how you'd design an API that other developers consume. Think about error handling, pagination, and backward compatibility.

**2. Concurrency & Distributed Systems**
Expect questions about race conditions, idempotency keys, and handling failures in distributed systems. Your experience with platform migration is a great talking point — be ready to discuss how you handled data consistency during the transition.

**3. Coding Proficiency**
The 45-minute coding session will likely involve a practical problem, not just algorithmic puzzles. Practice implementing things like a rate limiter, a simple payment processing system, or a webhook delivery service. Focus on clean, readable code with good error handling.

**Concrete action items:**
- Review Stripe's engineering blog for design philosophy insights
- Practice 2-3 system design problems involving payment or financial systems
- Brush up on database transactions and isolation levels
- Prepare a 2-minute walkthrough of your most relevant project that demonstrates API design or systems thinking`,
  },
  {
    role: "user",
    content: "I also have a Shopee backend intern offer. Should I prioritize that over my pending applications?",
  },
  {
    role: "assistant",
    content: `This is a good problem to have. Here's a framework for thinking through it:

**In favor of accepting Shopee now:**
- A confirmed offer is worth more than a potential one — bird in hand
- Shopee's backend team in Singapore works on high-scale e-commerce systems, which builds strong foundational experience
- An internship on your resume strengthens your full-time applications (Stripe, Meta, Databricks all value prior industry experience)

**Reasons to keep your options open:**
- The deadline is April 18, so you have a few days to push for updates from Stripe and Meta
- If any of your interview-stage applications convert to offers, those may align better with your target roles (full-time backend engineer vs. internship)

**My recommendation:**
1. **Accept the Shopee offer but don't stop interviewing.** An internship isn't a lifelong commitment, and having one doesn't prevent you from pursuing full-time roles
2. **Email your Stripe and Meta recruiters today** — let them know you have a competing offer with an April 18 deadline. This often accelerates their timeline
3. **If Stripe or Meta comes through with a full-time offer** before your Shopee start date, you can politely decline or negotiate with Shopee

The key insight: having an offer gives you leverage, not obligation. Use it to create urgency with your other prospects.`,
  },
];

export function ChatWorkspace({ profileReady, analyses, isDemo = false }: ChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>(isDemo ? DEMO_MESSAGES : []);
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
        {isDemo ? (
          <div className="chat-demo-notice rounded-lg bg-surface-raised border border-border px-4 py-3 text-sm text-text-secondary text-center">
            Chat is view-only in demo mode. Sign in to send messages.
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
