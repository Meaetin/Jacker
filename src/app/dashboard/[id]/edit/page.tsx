import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getApplicationById } from "@/lib/db/applications";
import { ApplicationForm } from "@/components/application-form";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const application = await getApplicationById(id, user!.id);
  if (!application) notFound();

  return (
    <div className="edit-page max-w-2xl mx-auto">
      <nav className="edit-breadcrumbs mb-6 flex items-center gap-1.5 text-sm">
        <Link
          href="/dashboard"
          className="breadcrumb-link text-text-secondary hover:text-brand transition-colors"
        >
          Dashboard
        </Link>
        <span className="breadcrumb-separator text-text-muted">/</span>
        <Link
          href={`/dashboard/${id}`}
          className="breadcrumb-link text-text-secondary hover:text-brand transition-colors"
        >
          {application.company ?? "Application"}
        </Link>
        <span className="breadcrumb-separator text-text-muted">/</span>
        <span className="breadcrumb-current text-text-primary font-medium">Edit</span>
      </nav>

      <div className="card">
        <h1 className="font-display text-lg font-bold text-text-primary mb-6">
          Edit Application
        </h1>
        <ApplicationForm application={application} />
      </div>
    </div>
  );
}
