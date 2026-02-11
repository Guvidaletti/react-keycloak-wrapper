export default class Logger {
  enabled: boolean = false;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(...data: any[]) {
    if (this.enabled) {
      console.log("[react-keycloak-wrapper]", ...data);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}
