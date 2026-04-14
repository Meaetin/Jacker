import { Button } from "@/components/ui/button";
import { signInAsDemo } from "./actions";

export default function DemoLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="card text-center max-w-sm w-full">
        <h1 className="text-xl font-bold text-text-primary">
          Try the Demo
        </h1>
        <p className="mt-2 text-text-secondary text-sm">
          Explore the dashboard with pre-seeded sample data. No account needed.
        </p>
        <form className="mt-6">
          <Button className="w-full" formAction={signInAsDemo}>
            Launch Demo Dashboard
          </Button>
        </form>
        <p className="mt-4 text-sm text-text-muted">
          <a href="/login" className="text-brand hover:underline">
            Sign in
          </a>{" "}
          with your own account instead
        </p>
      </div>
    </main>
  );
}
