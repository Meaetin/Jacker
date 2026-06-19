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
  initialTotal: number;
  profileReady: boolean;
}

type InputMode = "paste" | "url";

type WorkspaceView = "empty" | "input" | "result";

const HISTORY_PAGE_SIZE = 9;

export function JobAnalysisWorkspace({
  initialAnalyses,
  initialTotal,
  profileReady,
}: JobAnalysisWorkspaceProps) {
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillActive, setPrefillActive] = useState(false);
  const prefillCounter = useRef(0);

  // Sidebar shows one page at a time; the selected analysis is tracked separately
  // so it stays visible in the detail pane even when the user pages away from it.
  const [pageItems, setPageItems] = useState<JobFitAnalysis[]>(initialAnalyses);
  const [total, setTotal] = useState(initialTotal);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedAnalysis, setSelectedAnalysis] = useState<JobFitAnalysis | null>(
    initialAnalyses[0] ?? null,
  );

  const [view, setView] = useState<WorkspaceView>(
    initialAnalyses.length === 0 ? "empty" : "result",
  );

  const effectiveLoading = loading && view === "input";

  async function fetchHistoryPage(page: number) {
    try {
      const res = await fetch(
        `/api/job-analysis?page=${page}&limit=${HISTORY_PAGE_SIZE}`,
      );
      const data = await res.json();
      if (!res.ok) return;
      setPageItems(data.analyses);
      setTotal(data.total);
      setHistoryPage(page);
    } catch {
      // Keep the current page on a fetch failure
    }
  }

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
      setView(total === 0 ? "empty" : "input");
    }
    window.addEventListener("job-tracker:prefill", handlePrefill);
    return () => window.removeEventListener("job-tracker:prefill", handlePrefill);
  }, [total]);

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
      setSelectedAnalysis(data.analysis);
      setJobDescription("");
      setJobUrl("");
      setCompanyName("");
      setJobTitle("");
      setView("result");
      // Refresh page 1 so the new analysis appears at the top with an updated count
      await fetchHistoryPage(1);
    } catch {
      setError("Analysis failed due to a network error.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewAnalysis() {
    setView("input");
    setError(null);
  }

  function handleCloseInput() {
    if (total > 0 || selectedAnalysis) {
      if (!selectedAnalysis && pageItems.length > 0) {
        setSelectedAnalysis(pageItems[0]);
      }
      setView("result");
    } else {
      setView("empty");
    }
  }

  function handleSelectAnalysis(id: string) {
    setSelectedAnalysis(pageItems.find((a) => a.id === id) ?? null);
    setView("result");
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
        {view === "empty" && (
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
        {view === "input" && total > 0 && (
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
        {view === "result" && (
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
                analyses={pageItems}
                selectedId={selectedAnalysis?.id ?? null}
                total={total}
                page={historyPage}
                pageSize={HISTORY_PAGE_SIZE}
                onPageChange={fetchHistoryPage}
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
