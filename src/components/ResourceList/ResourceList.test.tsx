import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Resource } from "../../data/resources/types";
import { ResourceList } from "./index";

// 1. Define the complex data shape we expect, conforming to our Resource type
const sampleResources: Resource[] = [
  {
    id: "playgroup-1",
    name: "NCT Bumps & Babes",
    category: "playgroup",
    audiences: ["expectant-parents", "babies"],
    location: {
      name: "Staines Congregational Church Hall",
      address: "Stainash Crescent, Staines TW18 1AY",
    },
    schedule: [
      {
        day: "Monday",
        times: [{ startTime: "10:30", endTime: "11:45" }],
      },
    ],
    links: [{ type: "facebook", url: "https://www.facebook.com/NCTSAE" }],
  },
  {
    id: "playgroup-5",
    name: "Stanwell Messy Play",
    category: "playgroup",
    audiences: ["babies", "toddlers"],
    location: {
      name: "Stanwell Village Hall",
      address: "High St, Stanwell, Staines TW19 7JR",
    },
    schedule: [
      {
        day: "Tuesday",
        times: [{ startTime: "09:30", endTime: "11:30" }],
      },
    ],
    contacts: [
      { method: "text", value: "07739 358186", description: "Text Victoria" },
    ],
    links: [
      {
        type: "facebook",
        url: "https://www.facebook.com/groups/270980883516118",
      },
    ],
  },
];

describe("ResourceList", () => {
  it("renders a list of resource cards with complex details", () => {
    render(<ResourceList resources={sampleResources} />);

    // Check First Item
    const firstHeading = screen.getByRole("heading", {
      name: "NCT Bumps & Babes",
    });
    const firstItem = firstHeading.closest("div.flex.flex-col"); // The Card element

    // Explicit Guard: If null, fail the test immediately
    if (!firstItem)
      throw new Error("List item not found for NCT Bumps & Babes");

    expect(
      within(firstItem).getByText(/Expectant parents, Babies/i),
    ).toBeInTheDocument();
    expect(
      within(firstItem).getByText("Monday: 10:30 - 11:45"), // Updated format
    ).toBeInTheDocument();

    // Check Second Item (Multiple contacts)
    const secondHeading = screen.getByRole("heading", {
      name: "Stanwell Messy Play",
    });
    const secondItem = secondHeading.closest("div.flex.flex-col"); // The Card element

    // Explicit Guard
    if (!secondItem)
      throw new Error("List item not found for Stanwell Messy Play");

    expect(
      within(secondItem).getByText("Text Victoria"), // The link now just contains the description
    ).toBeInTheDocument();
  });

  it("renders an empty state message", () => {
    render(<ResourceList resources={[]} />);
    expect(
      screen.getByText(/no resources found that match your criteria./i),
    ).toBeInTheDocument();
  });
});
