import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock";

// Clean up the DOM after each test
afterEach(() => {
  cleanup();
});
