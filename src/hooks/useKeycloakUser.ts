import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";
import { KeycloakUser } from "../types";

export function useKeycloakUser<UserInfo = KeycloakUser>() {
  const ctx = useContext(KeycloakContext);

  return {
    user: ctx?.userInfo as UserInfo | null,
    loading: ctx?.isLoading,
  };
}
