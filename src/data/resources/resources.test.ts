import { describe, expect, it } from "vitest";
import { fetchResources } from "./";

describe("fetchResources", () => {
  it("returns a list of community resources", async () => {
    const resources = await fetchResources();

    expect(Array.isArray(resources)).toBe(true);
    expect(resources.length).toBe(25);

    // Check the shape of the data
    const firstResource = resources[0];
    expect(firstResource).toHaveProperty("id");
    expect(firstResource).toHaveProperty("name"); // Changed from title
    expect(firstResource).toHaveProperty("category");
    expect(firstResource).toHaveProperty("schedule"); // Add check for new property
  });
});
