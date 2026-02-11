import { useContext } from "react";
import { KeycloakContext } from "../provider/keycloak-context";
import { KeycloakUserInfo } from "keycloak-js";

export function useKeycloakUser<UserInfo = KeycloakUserInfo>() {
  const ctx = useContext(KeycloakContext);

  return {
    user: ctx?.userInfo as UserInfo | null,
    loading: ctx?.isLoading,
  };
}
