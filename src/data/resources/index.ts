import { createServerFn } from "@tanstack/react-start";
import resources from "./community-resources.json";
import type { Resource } from "./types";

export async function fetchResources(): Promise<Resource[]> {
  return resources as Resource[];
}

export const getResources = createServerFn({
  method: "GET",
}).handler(fetchResources);
