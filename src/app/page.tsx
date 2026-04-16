import {
  Mail,
  Columns3,
  Target,
  MessageSquare,
  FileText,
  LayoutDashboard,
} from "lucide-react";

const FEATURES = [
  { icon: Mail, title: "AI Email Parsing", description: "Connect Gmail and let AI automatically detect, parse, and categorize your job application emails." },
  { icon: Columns3, title: "Kanban & Table Views", description: "Switch between a drag-and-drop kanban board and a sortable table — whichever fits your workflow." },
  { icon: Target, title: "Job Fit Analysis", description: "Paste a job posting and get a scored breakdown of how well it matches your skills and experience." },
  { icon: MessageSquare, title: "Smart Chat Assistant", description: "Ask career questions and get grounded advice that references your actual profile and active applications." },
  { icon: FileText, title: "Document Generation", description: "Auto-generate cover letters and application emails tailored to each role you apply for." },
  { icon: LayoutDashboard, title: "CV Profile Builder", description: "Upload your CV and let AI extract a structured candidate profile you can edit and refine." },
];

const KANBAN_COLUMNS = [
  { status: "Applied", accent: "var(--color-status-applied)", count: 4, cards: [{ company: "Google", role: "Software Engineer" }, { company: "Figma", role: "Full Stack Engineer" }, { company: "Amazon", role: "SDE Intern" }] },
  { status: "Assessment", accent: "var(--color-status-assessment)", count: 2, cards: [{ company: "Grab", role: "Software Engineer" }, { company: "Infineon", role: "Software Engineer" }] },
  { status: "Interview", accent: "var(--color-status-interview)", count: 3, cards: [{ company: "Stripe", role: "Backend Engineer" }, { company: "Databricks", role: "Software Engineer" }, { company: "Meta", role: "Frontend Engineer" }] },
  { status: "Offer", accent: "var(--color-status-offer)", count: 1, cards: [{ company: "Shopee", role: "Backend Intern" }] },
  { status: "Rejected", accent: "var(--color-status-rejected)", count: 2, cards: [{ company: "Shopify", role: "Frontend Developer" }, { company: "Microsoft", role: "Software Engineer" }] },
];

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen">
      {/* Hero */}
      <section className="landing-hero relative overflow-hidden bg-gradient-to-br from-surface via-surface-raised to-surface-overlay">
        <div
          className="landing-hero-logo absolute right-65 -top-35 w-[700px] h-[700px] opacity-[0.5] pointer-events-none select-none rotate-33"
          style={{ backgroundImage: "url('logo.png')", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
        />
        <div className="landing-hero-content relative max-w-3xl mx-auto px-6 pt-28 pb-20">
          <h1 className="landing-hero-headline font-display text-5xl font-bold leading-[1.1] text-text-primary">
            Stop losing track of your job applications with Jacker
          </h1>
          <p className="landing-hero-subtitle mt-5 text-lg text-text-secondary leading-relaxed max-w-xl">
            AI-powered email parsing, kanban boards, job fit scoring, and a
            career chat assistant — all in one place.
          </p>
          <div className="landing-hero-actions mt-8 flex items-center gap-4">
            <a href="/demo-login" className="btn-primary text-base px-6 py-3">
              Try Demo
            </a>
            <a href="/login" className="btn-secondary text-base px-6 py-3">
              Sign In
            </a>
          </div>
          <p className="landing-hero-hint mt-4 text-sm text-text-muted">
            No account needed for the demo
          </p>
        </div>
      </section>

      {/* Kanban Preview */}
      <section className="landing-preview bg-surface-raised border-y border-border">
        <div className="landing-preview-inner max-w-6xl mx-auto px-6 py-16">
          <p className="landing-preview-label text-sm font-medium text-brand tracking-wide uppercase mb-2">
            Live Preview
          </p>
          <h2 className="landing-preview-title font-display text-2xl font-bold text-text-primary mb-8">
            Your applications at a glance
          </h2>
          <div className="kanban-preview-board flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.status} className="kanban-preview-column flex-shrink-0 w-56 flex flex-col rounded-lg border border-border bg-surface" style={{ borderTopColor: col.accent, borderTopWidth: "3px" }}>
                <div className="kanban-preview-column-header flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <span className="kanban-preview-column-title text-sm font-semibold text-text-primary">{col.status}</span>
                  <span className="kanban-preview-column-count text-xs font-medium text-text-muted bg-surface-raised rounded-full px-2 py-0.5">{col.count}</span>
                </div>
                <div className="kanban-preview-cards flex flex-col gap-2 p-2">
                  {col.cards.map((card) => (
                    <div key={card.company} className="kanban-preview-card rounded-lg border border-border bg-surface p-3 shadow-soft">
                      <p className="kanban-preview-card-company text-sm font-medium text-text-primary leading-snug">{card.company}</p>
                      <p className="kanban-preview-card-role text-xs text-text-secondary mt-0.5">{card.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features max-w-5xl mx-auto px-6 py-20">
        <div className="landing-features-header mb-12">
          <h2 className="landing-features-title font-display text-2xl font-bold text-text-primary">Everything you need for your job search</h2>
          <p className="landing-features-subtitle mt-2 text-text-secondary max-w-lg">From parsing application emails to generating cover letters, each feature is designed to save you time and keep you organized.</p>
        </div>
        <div className="landing-features-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="landing-feature-card card flex flex-col gap-3">
              <div className="landing-feature-icon flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="landing-feature-title text-sm font-semibold text-text-primary">{feature.title}</h3>
              <p className="landing-feature-description text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta border-t border-border">
        <div className="landing-cta-inner max-w-xl mx-auto px-6 py-20 text-center">
          <h2 className="landing-cta-title font-display text-2xl font-bold text-text-primary">See it in action</h2>
          <p className="landing-cta-subtitle mt-3 text-text-secondary">Explore the full dashboard with realistic sample data. No signup required.</p>
          <a href="/demo-login" className="landing-cta-button btn-primary mt-8 inline-flex text-base px-8 py-3">Launch Demo Dashboard</a>
          <p className="landing-cta-signin mt-4 text-sm text-text-muted">Have your own account? <a href="/login" className="landing-cta-signin-link text-brand hover:underline">Sign in</a></p>
        </div>
      </section>
    </main>
  );
}
