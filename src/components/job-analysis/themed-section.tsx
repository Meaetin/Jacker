import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

interface ThemedSectionProps {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
  bg: string;
  titleColor: string;
}

/** Render inline `**bold**` spans within a line of text. */
function renderInline(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return segments.map((segment, index) => {
    const match = segment.match(/^\*\*([^*]+)\*\*$/);
    if (match) {
      return (
        <strong key={index} className="font-semibold text-text-primary">
          {match[1]}
        </strong>
      );
    }
    return <Fragment key={index}>{segment}</Fragment>;
  });
}

/** Split body into list items (lines starting with `- `) and paragraphs. */
function renderBody(body: string) {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={key} className="themed-section-list space-y-1.5 list-disc pl-5">
        {listItems.map((item, index) => (
          <li key={index} className="themed-section-list-item">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }
    flushList(`list-${index}`);
    blocks.push(
      <p key={`p-${index}`} className="themed-section-paragraph">
        {renderInline(line)}
      </p>,
    );
  });
  flushList("list-end");

  return blocks;
}

export function ThemedSection({ icon: Icon, title, body, accent, bg, titleColor }: ThemedSectionProps) {
  return (
    <div
      className="themed-section rounded-lg border-l-4 p-4"
      style={{ borderColor: accent, backgroundColor: bg }}
    >
      <div className="themed-section-header flex items-center gap-2 mb-2">
        <Icon className="themed-section-icon h-4 w-4 flex-shrink-0" style={{ color: titleColor }} />
        <h3 className="themed-section-title text-sm font-semibold" style={{ color: titleColor }}>
          {title}
        </h3>
      </div>
      <div className="themed-section-body space-y-2 text-sm text-text-secondary">
        {renderBody(body)}
      </div>
    </div>
  );
}
