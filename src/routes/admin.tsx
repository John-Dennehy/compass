import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getPendingResources, updateResourceStatus } from "@/data/resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, X, MapPin, Calendar, Clock } from "lucide-react";
import type { Resource } from "@/data/resources/types";

export const Route = createFileRoute("/admin")({
  loader: () => getPendingResources(),
  component: AdminPage,
});

function AdminPage() {
  const pendingResources = Route.useLoaderData() as Resource[];
  const router = useRouter();

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    const result = await updateResourceStatus({ data: { id, status } });
    if (result.success) {
      router.invalidate();
    } else {
      alert("Failed to update status: " + result.error);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 md:px-8" style={{ backgroundColor: 'var(--compass-surface)' }}>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--compass-text)' }}>
            Admin Dashboard
          </h1>
          <p className="text-xl text-[var(--compass-text)]/70">
            {pendingResources.length} pending resources awaiting review.
          </p>
        </div>

        {pendingResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-20 text-center text-gray-500">
            No pending submissions. Great job!
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">{resource.name}</CardTitle>
                    <CardDescription className="capitalize">{resource.category}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleStatusUpdate(resource.id, 'rejected')}
                    >
                      <X className="mr-2 size-4" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[var(--compass-success)] text-white hover:opacity-90"
                      style={{ backgroundColor: 'var(--compass-success)' }}
                      onClick={() => handleStatusUpdate(resource.id, 'approved')}
                    >
                      <Check className="mr-2 size-4" /> Approve
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 text-sm text-[var(--compass-text)]/80">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--compass-primary)]" />
                      <div>
                        <p className="font-bold">{resource.location.name}</p>
                        <p>{resource.location.address}</p>
                        {resource.location.postcode && <p>{resource.location.postcode}</p>}
                      </div>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-[var(--compass-text)]/70 italic">
                        "{resource.description}"
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--compass-primary)]">
                      <Calendar className="size-4" /> Schedule
                    </div>
                    {resource.schedule.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-md bg-gray-50 p-2 text-sm">
                        <span className="w-20 font-bold">{s.day}</span>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="size-3" />
                          {s.times[0].startTime} - {s.times[0].endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
