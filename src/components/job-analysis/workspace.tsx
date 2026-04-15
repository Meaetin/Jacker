"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EmptyState } from "./empty-state";
import { InputPanel } from "./input-panel";
import { ResultDetail } from "./result-detail";
import { HistorySidebar } from "./history-sidebar";
import type { JobFitAnalysis } from "@/types/profile";

interface JobAnalysisWorkspaceProps {
  initialAnalyses: JobFitAnalysis[];
  profileReady: boolean;
}

type InputMode = "paste" | "url";

type WorkspaceView =
  | { mode: "empty" }
  | { mode: "input"; returnTo?: string }
  | { mode: "result"; selectedId: string };

export function JobAnalysisWorkspace({ initialAnalyses, profileReady }: JobAnalysisWorkspaceProps) {
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<JobFitAnalysis[]>(initialAnalyses);
  const [prefillActive, setPrefillActive] = useState(false);
  const prefillCounter = useRef(0);

  // Derive view from state
  const [view, setView] = useState<WorkspaceView>(() => {
    if (initialAnalyses.length === 0) return { mode: "empty" };
    return { mode: "result", selectedId: initialAnalyses[0].id };
  });

  const selectedAnalysis =
    view.mode === "result"
      ? analyses.find((a) => a.id === view.selectedId) ?? analyses[0] ?? null
      : view.mode === "input" && view.returnTo
        ? analyses.find((a) => a.id === view.returnTo) ?? null
        : null;

  const effectiveLoading = loading && view.mode === "input" ? true : false;

  // Listen for prefill events from Chrome extension
  useEffect(() => {
    function handlePrefill(e: Event) {
      const { text, url } = (e as CustomEvent<{ text: string; url: string }>).detail;
      setJobDescription(text.slice(0, 60000));
      setJobUrl(url);
      setInputMode("paste");
      setError(null);
      setPrefillActive(true);
      prefillCounter.current += 1;
      // Switch to input mode
      if (analyses.length === 0) {
        setView({ mode: "empty" });
      } else {
        const currentId =
          view.mode === "result" ? view.selectedId : undefined;
        setView({ mode: "input", returnTo: currentId });
      }
    }
    window.addEventListener("job-tracker:prefill", handlePrefill);
    return () => window.removeEventListener("job-tracker:prefill", handlePrefill);
  }, [analyses.length, view]);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(inputMode === "paste"
            ? { job_description: jobDescription }
            : { source_url: jobUrl }),
          company_name: companyName || undefined,
          job_title: jobTitle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }
      const newAnalyses = [data.analysis, ...analyses];
      setAnalyses(newAnalyses);
      setJobDescription("");
      setJobUrl("");
      setCompanyName("");
      setJobTitle("");
      setView({ mode: "result", selectedId: data.analysis.id });
    } catch {
      setError("Analysis failed due to a network error.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewAnalysis() {
    const currentId =
      view.mode === "result" ? view.selectedId : undefined;
    setView({ mode: "input", returnTo: currentId });
    setError(null);
  }

  function handleCloseInput() {
    if (analyses.length > 0) {
      const targetId =
        view.mode === "input" && view.returnTo
          ? view.returnTo
          : analyses[0].id;
      setView({ mode: "result", selectedId: targetId });
    } else {
      setView({ mode: "empty" });
    }
  }

  function handleSelectAnalysis(id: string) {
    setView({ mode: "result", selectedId: id });
  }

  const canSubmit =
    profileReady &&
    !loading &&
    (inputMode === "paste"
      ? jobDescription.trim().length >= 50
      : jobUrl.trim().length > 0);

  return (
    <div className="job-analysis-page max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Mode A: Empty state */}
        {view.mode === "empty" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              jobUrl={jobUrl}
              onJobUrlChange={setJobUrl}
              companyName={companyName}
              onCompanyNameChange={setCompanyName}
              jobTitle={jobTitle}
              onJobTitleChange={setJobTitle}
              loading={loading}
              error={error}
              canSubmit={canSubmit}
              onSubmit={runAnalysis}
              profileReady={profileReady}
            />
          </motion.div>
        )}

        {/* Mode B: Input-focused */}
        {view.mode === "input" && analyses.length > 0 && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="input-mode-layout flex gap-6"
          >
            <div className="input-mode-left w-[420px] min-w-[380px] flex-shrink-0">
              <InputPanel
                inputMode={inputMode}
                onInputModeChange={setInputMode}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                jobUrl={jobUrl}
                onJobUrlChange={setJobUrl}
                companyName={companyName}
                onCompanyNameChange={setCompanyName}
                jobTitle={jobTitle}
                onJobTitleChange={setJobTitle}
                loading={loading}
                error={error}
                canSubmit={canSubmit}
                onSubmit={runAnalysis}
                onClose={handleCloseInput}
                profileReady={profileReady}
                prefillActive={prefillActive}
              />
            </div>
            <div className="input-mode-right flex-1 min-w-0">
              <ResultDetail analysis={selectedAnalysis} loading={effectiveLoading} />
            </div>
          </motion.div>
        )}

        {/* Mode C: Results-focused */}
        {view.mode === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="result-mode-layout flex gap-6"
          >
            <div className="result-mode-left w-[320px] flex-shrink-0">
              <HistorySidebar
                analyses={analyses}
                selectedId={view.selectedId}
                onSelect={handleSelectAnalysis}
                onNewAnalysis={handleNewAnalysis}
              />
            </div>
            <div className="result-mode-right flex-1 min-w-0">
              <ResultDetail analysis={selectedAnalysis} loading={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
