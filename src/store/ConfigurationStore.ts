type ConfigurationTokens = {
  idToken?: string;
  token?: string;
  refreshToken?: string;
};

function getConfigurationKey(name: string, realm: string) {
  return ["keycloak", realm, name].join(".");
}

export default class ConfigurationStore {
  public static setConfiguration(
    name: string,
    realm: string,
    config: ConfigurationTokens,
  ): void {
    sessionStorage.setItem(
      getConfigurationKey(name, realm),
      JSON.stringify(config),
    );
  }

  public static getConfiguration(
    name: string,
    realm: string,
  ): ConfigurationTokens | object {
    const config = sessionStorage.getItem(getConfigurationKey(name, realm));
    return config ? (JSON.parse(config) as ConfigurationTokens) : {};
  }

  public static clearConfiguration(name: string, realm: string): void {
    sessionStorage.removeItem(getConfigurationKey(name, realm));
  }
}
