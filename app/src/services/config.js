import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

function resolveBackendUrl() {
  const configured = extra.backendUrl;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    // If app.json still has the default router IP 192.168.1.1, auto-use the Expo dev server IP
    if (
      hostIp &&
      (!configured || configured.includes("192.168.1.1:"))
    ) {
      return `http://${hostIp}:5002`;
    }
  }
  return configured || "http://192.168.1.81:5002";
}

export const BACKEND_URL = resolveBackendUrl();
export const MQTT_BROKER_URL = extra.mqtt?.brokerUrl;
export const MQTT_TOPIC = extra.mqtt?.topic;

export function assertConfig() {
  if (!BACKEND_URL) {
    console.warn("Backend URL missing from Expo config.");
  }
  if (!MQTT_BROKER_URL || !MQTT_TOPIC) {
    console.warn("MQTT broker URL or topic missing from Expo config.");
  }
}
