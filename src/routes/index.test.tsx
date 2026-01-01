import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./index";

describe("Home Page", () => {
  it("renders the project name", () => {
    render(<App />);
    expect(screen.getByText(/compass/i)).toBeInTheDocument();
  });

  it("renders the core mission", () => {
    render(<App />);
    // We expect the app to describe itself as a "Community Resource" directory
    expect(screen.getByText(/community resource/i)).toBeInTheDocument();
  });
});
