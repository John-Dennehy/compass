import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DynamicMap } from "@/components/DynamicMap";
import { ResourceFilters } from "@/components/ResourceFilters";
import { ResourceList } from "@/components/ResourceList";
import { getResources } from "@/data/resources";
import type { Audience, DayOfWeek } from "@/data/resources/types";

const resourceSearchSchema = z.object({
  audience: z.string().optional().catch("all"),
  day: z.string().optional().catch("all"),
  location: z.string().optional().catch(""),
});

type ResourceSearch = z.infer<typeof resourceSearchSchema>;

export const Route = createFileRoute("/")({
  validateSearch: (search) => resourceSearchSchema.parse(search),
  loader: () => getResources(),
  component: App,
});

export function App() {
  const resources = Route.useLoaderData() ?? [];
  const { audience: audienceFilter = 'all', day: dayFilter = 'all', location: locationFilter = '' } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Local state for the location input to ensure it's responsive
  const [localLocation, setLocalLocation] = useState(locationFilter);

  // Sync local location with URL if URL changes (e.g. back button)
  useEffect(() => {
    setLocalLocation(locationFilter);
  }, [locationFilter]);

  // Debounce the URL update for location
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localLocation !== locationFilter) {
        navigate({
          search: (prev) => ({ 
            ...prev, 
            location: localLocation || undefined 
          }),
          replace: true,
        });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localLocation, navigate, locationFilter]);

  const handleAudienceChange = (value: string) => {
    navigate({
      search: (prev) => ({ 
        ...prev, 
        audience: value === "all" ? undefined : value 
      }),
      replace: true,
    });
  };

  const handleDayChange = (value: string) => {
    navigate({
      search: (prev) => ({ 
        ...prev, 
        day: value === "all" ? undefined : value 
      }),
      replace: true,
    });
  };

  const audiences = useMemo(() => {
    const allAudiences = resources.flatMap((r) => r.audiences || []);
    return [...new Set(allAudiences)].filter((a) => a !== "all-ages");
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
        resource.audiences?.includes(audienceFilter as Audience) ||
        resource.audiences?.includes("all-ages");
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
        currentAudience={audienceFilter}
        currentDay={dayFilter}
        currentLocation={localLocation}
        onAudienceChange={handleAudienceChange}
        onDayChange={handleDayChange}
        onLocationChange={setLocalLocation}
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
