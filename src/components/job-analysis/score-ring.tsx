"use client";

import { motion } from "motion/react";
import type { FitBand } from "@/types/profile";

interface ScoreRingProps {
  score: number;
  band: FitBand;
  size?: "lg" | "sm";
}

const BAND_COLORS: Record<FitBand, string> = {
  strong_fit: "#6b9f6b",
  moderate_fit: "#d49b3a",
  weak_fit: "#c47070",
};

const BAND_LABELS: Record<FitBand, string> = {
  strong_fit: "Strong Fit",
  moderate_fit: "Moderate Fit",
  weak_fit: "Weak Fit",
};

export function ScoreRing({ score, band, size = "lg" }: ScoreRingProps) {
  const isLarge = size === "lg";
  const diameter = isLarge ? 120 : 44;
  const strokeWidth = isLarge ? 8 : 4;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillOffset = circumference - (score / 100) * circumference;
  const color = BAND_COLORS[band];

  return (
    <div
      className={`score-ring score-ring-${size} flex flex-col items-center ${isLarge ? "gap-2" : ""}`}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="score-ring-svg"
      >
        {/* Track */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-overlay)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <motion.circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: fillOffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        />
        {/* Center text */}
        {isLarge && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-text-primary font-display font-bold"
            style={{ fontSize: isLarge ? 28 : 14 }}
          >
            {score}
          </text>
        )}
        {!isLarge && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-text-primary font-semibold"
            style={{ fontSize: 13 }}
          >
            {score}
          </text>
        )}
      </svg>
      {isLarge && (
        <span
          className="score-ring-label text-sm font-medium"
          style={{ color }}
        >
          {BAND_LABELS[band]}
        </span>
      )}
    </div>
  );
}
