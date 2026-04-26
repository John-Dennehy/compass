import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeTree } from "../routeTree.gen";

// Create a router for testing
const router = createRouter({
  routeTree,
  history: createMemoryHistory(),
  // We need to override the default suspense behavior for tests
  defaultPreload: "intent",
});

describe("Home Page", () => {
  it("renders the project name", async () => {
    // Pass the router to the provider
    render(<RouterProvider router={router} />);
    // Wait for the loader to resolve and the component to render
    await waitFor(() => {
      expect(screen.getByText(/compass/i)).toBeInTheDocument();
    });
  });

  it("renders the core mission", async () => {
    // Pass the router to the provider
    render(<RouterProvider router={router} />);
    // Wait for the loader to resolve and the component to render
    await waitFor(() => {
      // We expect the app to describe itself as a "Community Resource" directory
      expect(screen.getByText(/community resource/i)).toBeInTheDocument();
    });
  });
});
