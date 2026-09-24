import { apiGet, apiRequest } from "@/lib/api";

export type MqttSensorCode = "SD1" | "SD2" | "HD1" | "HD2" | "MCP1" | "MCP2" | "MOD1" | "SIR1";

export type MqttSensorTopic = {
  code: MqttSensorCode;
  name: string;
  topic: string;
  qos: "0" | "1" | "2";
  enabled: boolean;
};

export type MqttConfiguration = {
  brokerHost: string;
  brokerPort: string;
  clientId: string;
  topics: MqttSensorTopic[];
};

export const MQTT_CONFIGURATION_STORAGE_KEY = "shms-mqtt-configuration";

type ApiMqttSensorTopic = {
  code: MqttSensorCode;
  name: string;
  topic: string;
  qos: number | string;
  enabled: boolean;
};

type ApiMqttConfiguration = {
  broker_host?: string;
  broker_port?: string;
  client_id?: string;
  topics?: ApiMqttSensorTopic[];
};

export const defaultMqttConfiguration: MqttConfiguration = {
  brokerHost: "localhost",
  brokerPort: "1883",
  clientId: "RSCMFAISClient",
  topics: [
    { code: "SD1", enabled: true, name: "Smoke Detector F2", qos: "1", topic: "fais/fire/zona-f/f2/smoke-detector-01" },
    { code: "SD2", enabled: true, name: "Smoke Detector A1", qos: "1", topic: "fais/fire/zona-a/a1/smoke-detector-02" },
    { code: "HD1", enabled: true, name: "Heat Detector D2", qos: "1", topic: "fais/fire/zona-d/d2/heat-detector-01" },
    { code: "HD2", enabled: true, name: "Heat Detector H1", qos: "1", topic: "fais/fire/zona-h/h1/heat-detector-02" },
    { code: "MCP1", enabled: true, name: "Manual Call Point A1", qos: "1", topic: "fais/fire/zona-a/a1/manual-call-point-01" },
    { code: "MCP2", enabled: true, name: "Manual Call Point F2", qos: "1", topic: "fais/fire/zona-f/f2/manual-call-point-02" },
    { code: "MOD1", enabled: true, name: "Input Module G3", qos: "1", topic: "fais/fire/zona-g/g3/input-module-01" },
    { code: "SIR1", enabled: true, name: "Sounder Strobe B", qos: "1", topic: "fais/fire/zona-b/sounder-strobe-01" },
  ],
};

function normalizeConfiguration(value: Partial<MqttConfiguration> | null): MqttConfiguration {
  const configuredTopics = Array.isArray(value?.topics) ? value.topics : [];

  return {
    brokerHost: value?.brokerHost ?? defaultMqttConfiguration.brokerHost,
    brokerPort: value?.brokerPort ?? defaultMqttConfiguration.brokerPort,
    clientId: value?.clientId ?? defaultMqttConfiguration.clientId,
    topics: defaultMqttConfiguration.topics.map((topic) => ({
      ...topic,
      ...configuredTopics.find((item) => item.code === topic.code),
    })),
  };
}

function normalizeQos(value: number | string | undefined): MqttSensorTopic["qos"] {
  const normalized = String(value ?? "1");
  return normalized === "0" || normalized === "2" ? normalized : "1";
}

function fromApiConfiguration(value: ApiMqttConfiguration): MqttConfiguration {
  return normalizeConfiguration({
    brokerHost: value.broker_host,
    brokerPort: value.broker_port,
    clientId: value.client_id,
    topics: value.topics?.map((topic) => ({
      code: topic.code,
      enabled: topic.enabled,
      name: topic.name,
      qos: normalizeQos(topic.qos),
      topic: topic.topic,
    })),
  });
}

function toApiConfiguration(configuration: MqttConfiguration): ApiMqttConfiguration {
  return {
    broker_host: configuration.brokerHost,
    broker_port: configuration.brokerPort,
    client_id: configuration.clientId,
    topics: configuration.topics.map((topic) => ({
      code: topic.code,
      enabled: topic.enabled,
      name: topic.name,
      qos: Number(topic.qos),
      topic: topic.topic,
    })),
  };
}

export function readMqttConfiguration(): MqttConfiguration {
  if (typeof window === "undefined") {
    return defaultMqttConfiguration;
  }

  try {
    const stored = window.localStorage.getItem(MQTT_CONFIGURATION_STORAGE_KEY);
    return stored ? normalizeConfiguration(JSON.parse(stored) as Partial<MqttConfiguration>) : defaultMqttConfiguration;
  } catch {
    return defaultMqttConfiguration;
  }
}

export function saveMqttConfiguration(configuration: MqttConfiguration) {
  window.localStorage.setItem(MQTT_CONFIGURATION_STORAGE_KEY, JSON.stringify(configuration));
}

export async function fetchMqttConfiguration() {
  try {
    const configuration = fromApiConfiguration(await apiGet<ApiMqttConfiguration>("/api/rscm-fais/mqtt-configuration"));
    saveMqttConfiguration(configuration);
    return configuration;
  } catch {
    return readMqttConfiguration();
  }
}

export async function updateMqttConfiguration(configuration: MqttConfiguration) {
  const updated = fromApiConfiguration(await apiRequest<ApiMqttConfiguration>("/api/rscm-fais/mqtt-configuration", {
    body: JSON.stringify(toApiConfiguration(configuration)),
    method: "PUT",
  }));
  saveMqttConfiguration(updated);
  return updated;
}
