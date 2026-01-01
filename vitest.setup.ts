import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Clean up the DOM after each test
afterEach(() => {
  cleanup();
});
