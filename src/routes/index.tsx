import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DynamicMap } from "@/components/DynamicMap";
import { ResourceFilters } from "@/components/ResourceFilters";
import { ResourceList } from "@/components/ResourceList";
import { getResources } from "@/data/resources";
import type { Audience } from "@/data/resources/types";

export const Route = createFileRoute("/")({
  loader: () => getResources(),
  component: App,
});

export function App() {
  const resources = Route.useLoaderData() ?? [];
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  const audiences = useMemo(() => {
    const allAudiences = resources.flatMap((r) => r.audiences || []);
    return [...new Set(allAudiences)];
  }, [resources]);

  const days = useMemo(() => {
    const allDays = resources.flatMap(
      (r) => r.schedule?.map((s) => s.day) || [],
    );
    return [...new Set(allDays)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const audienceMatch =
        audienceFilter === "all" ||
        resource.audiences?.includes(audienceFilter as Audience);
      const dayMatch =
        dayFilter === "all" ||
        resource.schedule?.some((s) => s.day === dayFilter);
      const locationMatch =
        !locationFilter ||
        resource.location.address
          .toLowerCase()
          .includes(locationFilter.toLowerCase()) ||
        resource.location.name
          .toLowerCase()
          .includes(locationFilter.toLowerCase());

      return audienceMatch && dayMatch && locationMatch;
    });
  }, [resources, audienceFilter, dayFilter, locationFilter]);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1
          className="text-4xl font-black tracking-tighter md:text-5xl"
          style={{ color: 'var(--compass-text)' }}
        >
          Compass
        </h1>
        <h2
          className="mt-2 text-xl font-medium md:text-2xl"
          style={{ color: 'var(--compass-primary)' }}
        >
          A Community Resource Directory
        </h2>
      </div>

      <ResourceFilters
        audiences={audiences}
        days={days}
        onAudienceChange={setAudienceFilter}
        onDayChange={setDayFilter}
        onLocationChange={setLocationFilter}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="max-h-[80vh] overflow-y-auto">
          <ResourceList resources={filteredResources} />
        </div>
        <div className="h-[500px] rounded-lg border lg:h-auto" style={{ borderColor: 'var(--compass-border)' }}>
          <DynamicMap resources={filteredResources} />
        </div>
      </div>
      </div>
    </div>
  );
}
