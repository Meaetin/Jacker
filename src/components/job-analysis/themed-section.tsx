import type { LucideIcon } from "lucide-react";

interface ThemedSectionProps {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
  bg: string;
  titleColor: string;
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
      <pre className="themed-section-body whitespace-pre-wrap text-sm text-text-secondary font-sans">
        {body}
      </pre>
    </div>
  );
}
