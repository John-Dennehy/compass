import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/events")({
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="space-y-4">
          <h1
            className="text-4xl font-black tracking-tighter md:text-5xl"
            style={{ color: 'var(--compass-text)' }}
          >
            Upcoming Events
          </h1>
          <p className="max-w-2xl text-xl text-[var(--compass-text)]/70">
            Discover what's happening around you. Join local gatherings, workshops, and community events.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder Events */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: 'var(--compass-border)' }}>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--compass-text)' }}>Downtown Farmers Market</h3>
            <p className="text-sm font-medium" style={{ color: 'var(--compass-primary)' }}>This Saturday, 9:00 AM</p>
            <p className="mt-4 text-[var(--compass-text)]/70">
              Fresh local produce, artisanal crafts, and live music in the town square.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: 'var(--compass-border)' }}>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--compass-text)' }}>Jazz in the Park</h3>
            <p className="text-sm font-medium" style={{ color: 'var(--compass-primary)' }}>Next Sunday, 4:00 PM</p>
            <p className="mt-4 text-[var(--compass-text)]/70">
              Bring a picnic blanket and enjoy an evening of smooth jazz under the open sky.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: 'var(--compass-border)' }}>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--compass-text)' }}>Beginner's Pottery Class</h3>
            <p className="text-sm font-medium" style={{ color: 'var(--compass-primary)' }}>Wednesday, 6:30 PM</p>
            <p className="mt-4 text-[var(--compass-text)]/70">
              Learn the basics of wheel throwing and hand-building. All materials provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
