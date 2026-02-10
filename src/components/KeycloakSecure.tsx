import React from "react";
import { useKeycloak } from "../hooks/useKeycloak";

export const KeycloakSecure: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { isAuthenticated, login, loading } = useKeycloak();

  if (loading) return null;

  if (!isAuthenticated) {
    // Salva a URL atual antes de redirecionar
    sessionStorage.setItem(
      "keycloak_return_url",
      window.location.pathname + window.location.search,
    );

    // Redireciona para o Keycloak com callback fixo
    login(); // Usa o redirectUri configurado (ex: /authorization)
    return null;
  }

  return <>{children}</>;
};
