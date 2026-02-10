import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { KeycloakProvider } from "../src/provider/KeycloakProvider";

vi.mock("keycloak-js", async (load) => {
  const actual: object = await load();
  return {
    default: function () {
      return {
        ...actual,
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
        configurationName="test"
        config={{
          url: "http://localhost",
          realm: "test",
          clientId: "test",
          redirectUri: "http://localhost:3000/",
        }}
      >
        <div>App</div>
      </KeycloakProvider>,
    );

    expect(await findByText("App")).toBeTruthy();
  });
});
