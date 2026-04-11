import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ScoreboardFilters from "@/components/ScoreboardFilters";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("year=2025&week=1&group=80"),
  usePathname: () => "/cfb",
}));

describe("ScoreboardFilters", () => {
  beforeEach(() => mockReplace.mockClear());

  it("renders year, week, and group selects", () => {
    render(<ScoreboardFilters sport="cfb" />);
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByLabelText("Group")).toBeInTheDocument();
  });

  it("shows current year as selected", () => {
    render(<ScoreboardFilters sport="cfb" />);
    const yearSelect = screen.getByLabelText("Year") as HTMLSelectElement;
    expect(yearSelect.value).toBe("2025");
  });

  it("calls router.replace on year change", () => {
    render(<ScoreboardFilters sport="cfb" />);
    const yearSelect = screen.getByLabelText("Year");
    fireEvent.change(yearSelect, { target: { value: "2024" } });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("year=2024")
    );
  });
});
