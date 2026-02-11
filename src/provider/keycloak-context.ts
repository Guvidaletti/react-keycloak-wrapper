import { createContext } from "react";
import { KeycloakContextValue } from "../types";
import { initialKeycloakContextValue } from "./keycloak-reducer";

export const KeycloakContext = createContext<KeycloakContextValue>(
  initialKeycloakContextValue,
);
