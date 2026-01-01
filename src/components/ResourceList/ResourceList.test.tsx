import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResourceList } from "./index";

describe("ResourceList", () => {
  it("renders a list container", () => {
    // We must provide items, otherwise the list correctly doesn't render
    render(<ResourceList items={["test"]} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("renders provided resources", () => {
    const testResources = ["Apples", "Bananas", "Cherries"];
    render(<ResourceList items={testResources} />);

    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Bananas")).toBeInTheDocument();
    expect(screen.getByText("Cherries")).toBeInTheDocument();
  });

  it("renders a message when the list is empty", () => {
    render(<ResourceList items={[]} />);
    expect(screen.getByText(/no resources found/i)).toBeInTheDocument();
  });
});
