import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { KeycloakProvider } from "../src/provider/KeycloakProvider";
import { keycloakReducer, initialKeycloakContextValue } from "../src/provider/keycloak-reducer";

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

    await waitFor(() => {
      expect(findByText("App")).toBeTruthy();
    });
  });

  it("decodes the access token payload when SET_TOKEN is dispatched", () => {
    const payload = btoa(
      JSON.stringify({ sub: "123", preferred_username: "test-user" }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `eyJhbGciOiJub25lIn0.${payload}.signature`;

    const state = keycloakReducer(initialKeycloakContextValue, {
      type: "SET_TOKEN",
      payload: {
        accessToken: token,
        isAuthenticated: true,
      },
    });

    expect(state.accessTokenPayload).toEqual({
      sub: "123",
      preferred_username: "test-user",
    });
  });

  it("returns no payload for an invalid token", () => {
    const state = keycloakReducer(initialKeycloakContextValue, {
      type: "SET_TOKEN",
      payload: {
        accessToken: "not-a-jwt",
      },
    });

    expect(state.accessTokenPayload).toBeNull();
  });
});
