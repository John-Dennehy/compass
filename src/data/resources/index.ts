import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Resource } from "./types";

export async function fetchResources(): Promise<Resource[]> {
  const data = await db.query.resources.findMany({
    where: eq(resources.status, 'approved'),
    orderBy: (resources, { desc }) => [desc(resources.createdAt)],
  });

  // Map DB record to Resource type
  return data.map((r) => ({
    ...r,
    id: r.id,
    category: r.category as Resource['category'],
    audiences: r.audiences as Resource['audiences'],
    location: r.location as Resource['location'],
    schedule: r.schedule as Resource['schedule'],
    contacts: r.contacts as Resource['contacts'],
    links: r.links as Resource['links'],
    cost: r.cost as Resource['cost'],
    images: r.images as Resource['images'],
    isOrganiserVerified: r.isOrganiserVerified,
  })) as Resource[];
}

export const getResources = createServerFn({
  method: "GET",
}).handler(fetchResources);

export async function fetchPendingResources(): Promise<Resource[]> {
  const data = await db.query.resources.findMany({
    where: eq(resources.status, 'pending'),
    orderBy: (resources, { desc }) => [desc(resources.createdAt)],
  });

  return data.map((r) => ({
    ...r,
    id: r.id,
    category: r.category as Resource['category'],
    audiences: r.audiences as Resource['audiences'],
    location: r.location as Resource['location'],
    schedule: r.schedule as Resource['schedule'],
    contacts: r.contacts as Resource['contacts'],
    links: r.links as Resource['links'],
    cost: r.cost as Resource['cost'],
    images: r.images as Resource['images'],
    isOrganiserVerified: r.isOrganiserVerified,
  })) as Resource[];
}

export const getPendingResources = createServerFn({
  method: "GET",
}).handler(fetchPendingResources);

export const updateResourceStatus = createServerFn({
  method: "POST",
})
  .inputValidator((d: { id: string; status: 'approved' | 'rejected' }) => d)
  .handler(async ({ data }) => {
    try {
      await db.update(resources)
        .set({ status: data.status, updatedAt: new Date() })
        .where(eq(resources.id, data.id));
      return { success: true };
    } catch (error) {
      console.error("Error updating resource status:", error);
      return { success: false, error: "Failed to update status" };
    }
  });

export const submitResource = createServerFn({
  method: "POST",
})
  .inputValidator((d: Omit<Resource, 'id'>) => d)
  .handler(async ({ data }) => {
    try {
      await db.insert(resources).values({
        name: data.name,
        description: data.description,
        category: data.category,
        audiences: data.audiences,
        tags: data.tags,
        location: data.location,
        schedule: data.schedule,
        contacts: data.contacts,
        links: data.links,
        cost: data.cost,
        images: data.images,
        isOrganiserVerified: data.isOrganiserVerified,
        notes: data.notes,
        status: 'pending',
      });
      return { success: true };
    } catch (error) {
      console.error("Error submitting resource:", error);
      return { success: false, error: "Failed to submit resource" };
    }
  });


