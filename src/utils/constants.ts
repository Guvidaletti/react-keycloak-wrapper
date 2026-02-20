export function getSessionStoragePrefixCN(
  configurationName?: string,
  suffix = "",
) {
  return ["keycloak", configurationName ?? "default", suffix]
    .filter(Boolean)
    .join("_");
}
