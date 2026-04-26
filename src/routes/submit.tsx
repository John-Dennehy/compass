import { createFileRoute, Link } from "@tanstack/react-router";
import { SubmissionForm } from "@/components/SubmissionForm";
import { submitResource } from "@/data/resources";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/submit")({
  component: SubmitPage,
});

function SubmitPage() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--compass-primary)' }}
        >
          <ArrowLeft className="size-4" />
          Back to Directory
        </Link>

        <div className="space-y-2">
          <h1
            className="text-4xl font-black tracking-tighter md:text-5xl"
            style={{ color: 'var(--compass-text)' }}
          >
            Submit a Resource
          </h1>
          <p className="text-xl text-[var(--compass-text)]/70">
            Help us grow our directory by adding a playgroup, library event, or community service.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-xl md:p-10" style={{ borderColor: 'var(--compass-border)' }}>
          <SubmissionForm
            onSubmit={async (data) => {
              const result = await submitResource({ data });
              return result;
            }}
          />
        </div>
      </div>
    </div>
  );
}
