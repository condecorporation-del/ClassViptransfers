import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

function CrashingChild() {
  throw new Error("Boom");
}

describe("ErrorBoundary", () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <div>Healthy child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Healthy child")).toBeInTheDocument();
  });

  it("renders fallback when a child throws", () => {
    render(
      <ErrorBoundary fallback={<div>Fallback UI</div>}>
        <CrashingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("Fallback UI")).toBeInTheDocument();
  });
});
