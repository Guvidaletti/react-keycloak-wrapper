import React from "react";
import { useKeycloak } from "../hooks/useKeycloak";
import { getSessionStoragePrefixCN } from "../utils/constants";

export const KeycloakSecure: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { isAuthenticated, login, isLoading, configurationName } =
    useKeycloak();

  if (isLoading) return null;

  if (!isAuthenticated) {
    // Salva a URL atual antes de redirecionar
    sessionStorage.setItem(
      getSessionStoragePrefixCN(configurationName, "return_url"),
      window.location.pathname + window.location.search,
    );

    // Redireciona para o Keycloak com callback fixo
    login(); // Usa o redirectUri configurado (ex: /authorization)
    return null;
  }

  return children;
};
