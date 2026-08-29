import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import Login from "./pages/Login";

describe("Frontend tests", () => {
  test("Login page renders correctly", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

   expect(
  screen.getByRole("button", { name: /sign in/i })
).toBeInTheDocument();
});
});