import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DynamicMap } from "@/components/DynamicMap";
import { ResourceFilters } from "@/components/ResourceFilters";
import { ResourceList } from "@/components/ResourceList";
import { getResources } from "@/data/resources";
import type { Audience } from "@/data/resources/types";

const resourceSearchSchema = z.object({
  audience: z.string().optional().catch("all"),
  day: z.string().optional().catch("all"),
  location: z.string().optional().catch(""),
  category: z.string().optional().catch("all"),
  cost: z.string().optional().catch("all"),
});


export const Route = createFileRoute("/")({
  validateSearch: (search) => resourceSearchSchema.parse(search),
  loader: () => getResources(),
  component: App,
});

export function App() {
  const resources = Route.useLoaderData() ?? [];
  const { 
    audience: audienceFilter = 'all', 
    day: dayFilter = 'all', 
    location: locationFilter = '',
    category: categoryFilter = 'all',
    cost: costFilter = 'all'
  } = Route.useSearch();
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

  const handleCategoryChange = (value: string) => {
    navigate({
      search: (prev) => ({ 
        ...prev, 
        category: value === "all" ? undefined : value 
      }),
      replace: true,
    });
  };

  const handleCostChange = (value: string) => {
    navigate({
      search: (prev) => ({ 
        ...prev, 
        cost: value === "all" ? undefined : value 
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

  const categories = useMemo(() => {
    const allCategories = resources.map((r) => r.category);
    return [...new Set(allCategories)];
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
      const categoryMatch =
        categoryFilter === "all" || resource.category === categoryFilter;
      const costMatch =
        costFilter === "all" || resource.cost?.type === costFilter;

      return audienceMatch && dayMatch && locationMatch && categoryMatch && costMatch;
    });
  }, [resources, audienceFilter, dayFilter, locationFilter, categoryFilter, costFilter]);

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
        categories={categories}
        currentAudience={audienceFilter}
        currentDay={dayFilter}
        currentLocation={localLocation}
        currentCategory={categoryFilter}
        currentCost={costFilter}
        onAudienceChange={handleAudienceChange}
        onDayChange={handleDayChange}
        onLocationChange={setLocalLocation}
        onCategoryChange={handleCategoryChange}
        onCostChange={handleCostChange}
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

