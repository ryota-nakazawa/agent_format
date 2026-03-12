import { promises as fs } from "fs";
import path from "path";
import { VECTOR_STORE_ID } from "@/config/constants";

interface VectorStoreConfig {
  activeVectorStoreId: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "vector-store-config.json");

const defaultConfig = (): VectorStoreConfig => ({
  activeVectorStoreId:
    String(VECTOR_STORE_ID).trim() &&
    String(VECTOR_STORE_ID).trim() !== "<vector_store_id>"
      ? String(VECTOR_STORE_ID).trim()
      : "",
  updatedAt: new Date().toISOString(),
});

const ensureConfigFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await fs.writeFile(
      CONFIG_PATH,
      JSON.stringify(defaultConfig(), null, 2),
      "utf8"
    );
  }
};

export const readVectorStoreConfig = async (): Promise<VectorStoreConfig> => {
  await ensureConfigFile();
  const content = await fs.readFile(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(content) as Partial<VectorStoreConfig>;
  return {
    activeVectorStoreId:
      parsed.activeVectorStoreId ?? defaultConfig().activeVectorStoreId,
    updatedAt: parsed.updatedAt ?? defaultConfig().updatedAt,
  };
};

export const writeActiveVectorStoreId = async (vectorStoreId: string) => {
  await ensureConfigFile();
  const nextConfig: VectorStoreConfig = {
    activeVectorStoreId: vectorStoreId,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(nextConfig, null, 2), "utf8");
  return nextConfig;
};

export const getActiveVectorStoreId = async () => {
  const config = await readVectorStoreConfig();
  return config.activeVectorStoreId?.trim() || "";
};
