import { promises as fs } from "fs";
import path from "path";

export interface AdminDocument {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  relativePath: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "admin_uploads");
const DOCS_PATH = path.join(DATA_DIR, "admin-documents.json");

const sanitizeBaseName = (name: string) =>
  name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "document";

const ensureStore = async () => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(DOCS_PATH);
  } catch {
    await fs.writeFile(DOCS_PATH, "[]", "utf8");
  }
};

export const listAdminDocuments = async (): Promise<AdminDocument[]> => {
  await ensureStore();
  const content = await fs.readFile(DOCS_PATH, "utf8");
  const docs = JSON.parse(content) as AdminDocument[];
  return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const writeAdminDocuments = async (docs: AdminDocument[]) => {
  await ensureStore();
  await fs.writeFile(DOCS_PATH, JSON.stringify(docs, null, 2), "utf8");
};

export const saveAdminDocuments = async (
  files: Array<{
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
  }>
): Promise<AdminDocument[]> => {
  await ensureStore();
  const currentDocs = await listAdminDocuments();
  const savedDocs: AdminDocument[] = [];

  for (const file of files) {
    const ext = path.extname(file.name) || ".txt";
    const storedName = `${sanitizeBaseName(file.name)}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2, 8)}${ext}`;
    const relativePath = path.join("data", "admin_uploads", storedName);
    const absolutePath = path.join(process.cwd(), relativePath);

    await fs.writeFile(absolutePath, file.buffer);

    savedDocs.push({
      id: `doc_${Date.now().toString(36)}_${Math.random()
        .toString(16)
        .slice(2, 8)}`,
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdAt: new Date().toISOString(),
      relativePath,
    });
  }

  await writeAdminDocuments([...savedDocs, ...currentDocs]);
  return savedDocs;
};

export const deleteAdminDocument = async (id: string) => {
  const docs = await listAdminDocuments();
  const target = docs.find((doc) => doc.id === id);

  if (!target) {
    return false;
  }

  try {
    await fs.unlink(path.join(process.cwd(), target.relativePath));
  } catch {
    // Ignore missing file and continue removing metadata.
  }

  await writeAdminDocuments(docs.filter((doc) => doc.id !== id));
  return true;
};
