import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Map } from "@/components/Map";
import { ResourceFilters } from "@/components/ResourceFilters";
import { ResourceList } from "@/components/ResourceList";
import { getResources } from "@/data/resources";
import type { Audience } from "@/data/resources/types";

const toArray = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

const resourceSearchSchema = z.object({
  audience: z.union([z.string(), z.array(z.string())]).optional(),
  day: z.union([z.string(), z.array(z.string())]).optional(),
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
  const searchParams = Route.useSearch();
  const { 
    location: locationFilter = '',
    category: categoryFilter = 'all',
    cost: costFilter = 'all'
  } = searchParams;
  
  const audienceFilters = toArray(searchParams.audience);
  const dayFilters = toArray(searchParams.day);

  const navigate = useNavigate({ from: Route.fullPath });

  // Local state for the location input to ensure it's responsive
  const [localLocation, setLocalLocation] = useState(locationFilter);
  const [hoveredResourceId, setHoveredResourceId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

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
    if (value === "all") {
      navigate({
        search: (prev) => ({ ...prev, audience: undefined }),
        replace: true,
      });
      return;
    }
    const newFilters = audienceFilters.includes(value)
      ? audienceFilters.filter((v) => v !== value)
      : [...audienceFilters, value];
      
    navigate({
      search: (prev) => ({
        ...prev,
        audience: newFilters.length === 0 ? undefined : newFilters,
      }),
      replace: true,
    });
  };

  const handleDayChange = (value: string) => {
    if (value === "all") {
      navigate({
        search: (prev) => ({ ...prev, day: undefined }),
        replace: true,
      });
      return;
    }
    const newFilters = dayFilters.includes(value)
      ? dayFilters.filter((v) => v !== value)
      : [...dayFilters, value];

    navigate({
      search: (prev) => ({
        ...prev,
        day: newFilters.length === 0 ? undefined : newFilters,
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
        audienceFilters.length === 0 ||
        audienceFilters.some((filter) =>
          resource.audiences?.includes(filter as Audience) ||
          resource.audiences?.includes("all-ages")
        );
      const dayMatch =
        dayFilters.length === 0 ||
        dayFilters.some((filter) =>
          resource.schedule?.some((s) => s.day === filter)
        );
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
  }, [resources, audienceFilters, dayFilters, locationFilter, categoryFilter, costFilter]);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[300px_1fr]">
        
        {/* Sidebar */}
        <div className="space-y-8 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-4">
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
            currentAudience={audienceFilters}
            currentDay={dayFilters}
            currentLocation={localLocation}
            currentCategory={categoryFilter}
            currentCost={costFilter}
            onAudienceChange={handleAudienceChange}
            onDayChange={handleDayChange}
            onLocationChange={setLocalLocation}
            onCategoryChange={handleCategoryChange}
            onCostChange={handleCostChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          <div className="h-[400px] shrink-0 overflow-hidden rounded-lg border lg:h-[500px]" style={{ borderColor: 'var(--compass-border)' }}>
            <Map 
              resources={filteredResources} 
              activeResourceId={hoveredResourceId || selectedResourceId}
              onResourceClick={setSelectedResourceId}
            />
          </div>
          <div>
            <ResourceList 
              resources={selectedResourceId ? filteredResources.filter(r => r.id === selectedResourceId) : filteredResources} 
              activeResourceId={hoveredResourceId || selectedResourceId}
              onResourceHover={setHoveredResourceId}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

