export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="card text-center">
        <h1 className="text-2xl font-bold text-text-primary">
          Job Application Tracker
        </h1>
        <p className="mt-2 text-text-secondary">
          Track your job applications with AI-powered email parsing.
        </p>
        <div className="mt-6 flex gap-4 justify-center">
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
