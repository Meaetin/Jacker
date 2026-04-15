export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface via-surface-raised to-surface-overlay">
      <div className="card text-center shadow-soft-md max-w-md w-full mx-4">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Job Application Tracker
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          Track your job applications with AI-powered email parsing.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/login" className="btn-primary">
            Sign In
          </a>
          <a href="/demo-login" className="btn-secondary">
            Try Demo
          </a>
        </div>
      </div>
    </main>
  );
}
