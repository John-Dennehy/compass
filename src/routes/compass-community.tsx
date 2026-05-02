import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compass-community")({
  component: CompassCommunityPage,
});

function CompassCommunityPage() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="space-y-4">
          <h1
            className="text-4xl font-black tracking-tighter md:text-5xl"
            style={{ color: 'var(--compass-text)' }}
          >
            Compass Community
          </h1>
          <p className="max-w-2xl text-xl text-[var(--compass-text)]/70">
            A space for crowd-sourced entries, unofficial meetups, and parent-led groups. Discover hidden gems shared by locals.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: 'var(--compass-border)' }}>
            <div className="mb-4 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
              Community Submission
            </div>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--compass-text)' }}>Weekend Park Meetup</h3>
            <p className="mt-2 text-[var(--compass-text)]/70">
              Just a group of parents meeting at the central park playground every Saturday morning. Everyone welcome!
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: 'var(--compass-border)' }}>
             <div className="mb-4 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
              Community Submission
            </div>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--compass-text)' }}>Book Exchange Cafe</h3>
            <p className="mt-2 text-[var(--compass-text)]/70">
              Informal book swap at the local coffee shop. Bring a book, take a book. Great way to meet neighbors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
