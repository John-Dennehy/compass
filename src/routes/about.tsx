import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <h1
            className="text-4xl font-black tracking-tighter md:text-5xl"
            style={{ color: 'var(--compass-text)' }}
          >
            About Compass
          </h1>
          <p className="text-xl leading-relaxed text-[var(--compass-text)]/70">
            Compass is a community-driven resource directory designed to help local residents find playgroups, libraries, and support services. Our goal is to connect people and make local information easily accessible in a friendly, well-organized format.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: 'var(--compass-border)' }}>
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--compass-text)' }}>Our Mission</h2>
          <p className="leading-relaxed text-[var(--compass-text)]/80">
            We believe that strong communities are built on shared resources and mutual support. Compass aims to be your digital north star, guiding you to the best local events and services, whether they are official council programs or grassroots crowd-sourced initiatives.
          </p>
        </div>
      </div>
    </div>
  );
}
