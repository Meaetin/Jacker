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
    <div className="edit-page max-w-lg">
      <div className="mb-6">
        <Link
          href={`/dashboard/${id}`}
          className="text-sm text-text-secondary hover:text-brand"
        >
          Back to Application
        </Link>
      </div>

      <div className="card">
        <h1 className="text-lg font-bold text-text-primary mb-6">
          Edit Application
        </h1>
        <ApplicationForm application={application} />
      </div>
    </div>
  );
}
