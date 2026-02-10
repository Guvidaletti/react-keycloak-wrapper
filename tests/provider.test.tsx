import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { KeycloakProvider } from "../src/provider/KeycloakProvider";

vi.mock("keycloak-js", () => {
  return {
    default: function () {
      return {
        init: vi.fn().mockResolvedValue(true),
        loadUserProfile: vi.fn().mockResolvedValue({
          username: "test-user",
        }),
        login: vi.fn(),
        logout: vi.fn(),
        updateToken: vi.fn().mockResolvedValue(true),
        token: "mock-token",
        idToken: "mock-id-token",
        onTokenExpired: vi.fn(),
      };
    },
  };
});

describe("KeycloakProvider", () => {
  it("renders children", async () => {
    const { findByText } = render(
      <KeycloakProvider
        config={{
          url: "http://localhost",
          realm: "test",
          clientId: "test",
        }}
      >
        <div>App</div>
      </KeycloakProvider>,
    );

    expect(await findByText("App")).toBeTruthy();
  });
});
