"use client";

import { KB_FOLDERS } from "@/config/demoData";
import { Copy, Database, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

interface AdminDocument {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  relativePath: string;
}

interface KBFile {
  type: string;
  filename: string;
  filepath: string;
}

interface VectorStoreManagerProps {
  variant?: "standalone" | "panel";
}

export default function VectorStoreManager({
  variant = "panel",
}: VectorStoreManagerProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [activeVectorStoreId, setActiveVectorStoreId] = useState<string | null>(
    null
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [builtInFileCount, setBuiltInFileCount] = useState(0);

  const isStandalone = variant === "standalone";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadDocuments = async () => {
    const data = await fetch("/api/admin_documents", {
      cache: "no-store",
    }).then((res) => res.json());
    setDocuments(data.documents ?? []);
  };

  const loadActiveVectorStoreId = async () => {
    const data = await fetch("/api/vector_stores/active", {
      cache: "no-store",
    }).then((res) => res.json());
    setActiveVectorStoreId(data.activeVectorStoreId ?? null);
  };

  const loadBuiltInFileCount = async () => {
    let count = 0;

    for (const folder of KB_FOLDERS) {
      const folderFiles = await fetch(`/api/list_files?folder=${folder}`).then(
        (res) => res.json()
      );
      count += folderFiles.length;
    }

    setBuiltInFileCount(count);
  };

  useEffect(() => {
    loadDocuments();
    loadBuiltInFileCount();
    loadActiveVectorStoreId();
  }, []);

  const handleUploadDocuments = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin_documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload documents");
      }

      await loadDocuments();
      await loadBuiltInFileCount();
    } catch (uploadError) {
      console.error(uploadError);
      setError("Failed to upload documents");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setError(null);
    const response = await fetch(`/api/admin_documents?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Failed to delete document");
      return;
    }

    await loadDocuments();
  };

  const handleInitialize = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setStatus("Creating a fresh vector store...");

    const response = await fetch("/api/vector_stores/create_store", {
      method: "POST",
      body: JSON.stringify({ name: "CS Knowledge Base Rebuild" }),
    });

    if (response.status !== 200) {
      setError("Failed to create vector store");
      setLoading(false);
      return;
    }

    const vs = await response.json();
    setVectorStoreId(vs.id);
    setStatus("Fetching files...");

    const filesList: KBFile[] = [];

    for (const folder of KB_FOLDERS) {
      const folderFiles = await fetch(`/api/list_files?folder=${folder}`).then(
        (res) => res.json()
      );

      filesList.push(
        ...folderFiles.map((file: string) => ({
          type: folder,
          filename: file.split(".")[0],
          filepath: `public/${folder}/${file}`,
        }))
      );
    }

    filesList.push(
      ...documents.map((file) => ({
        type: "uploaded_document",
        filename: file.originalName.replace(/\.[^/.]+$/, ""),
        filepath: file.relativePath,
      }))
    );

    setStatus(`Uploading ${filesList.length} files to vector store...`);

    for (const file of filesList) {
      const uploadResponse = await fetch("/api/vector_stores/upload_file", {
        method: "POST",
        body: JSON.stringify({ filePath: file.filepath }),
      });

      if (uploadResponse.status !== 200) {
        setError(`Failed to upload file ${file.filename} to vector store`);
        setLoading(false);
        return;
      }

      const fileData = await uploadResponse.json();
      const addFileResponse = await fetch("/api/vector_stores/add_file", {
        method: "POST",
        body: JSON.stringify({
          vectorStoreId: vs.id,
          fileId: fileData.id,
          attributes: {
            type: file.type,
            filename: file.filename,
            filepath: file.filepath,
          },
        }),
      });

      if (addFileResponse.status !== 200) {
        setError(`Failed to add file ${file.filename} to vector store`);
        setLoading(false);
        return;
      }

      setStatus(`Uploaded ${file.type}/${file.filename}`);
    }

    setStatus("Uploaded all files to vector store.");
    const activateResponse = await fetch("/api/vector_stores/active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vectorStoreId: vs.id }),
    });

    if (!activateResponse.ok) {
      setError("Vector store was created, but failed to activate it");
      setLoading(false);
      return;
    }

    setActiveVectorStoreId(vs.id);
    setStatus("Uploaded all files and activated the vector store.");
    setSuccess(true);
    setLoading(false);
  };

  return (
    <section
      className={
        isStandalone
          ? "flex w-full max-w-lg flex-col gap-4"
          : "rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            <Database className="h-4 w-4" />
            Vector Store
          </div>
          <h2 className="text-xl font-semibold text-stone-900">
            Knowledge Base Index
          </h2>
          <p className="text-sm leading-6 text-stone-600">
            Upload internal materials here, then rebuild the vector store from
            both the built-in KB and your uploaded documents.
          </p>
        </div>
        {!isStandalone ? (
          <Link
            href="/init_vs"
            className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            Full page
          </Link>
        ) : null}
      </div>

      <div className="space-y-3 text-sm text-stone-600">
        <p>
          Built-in sources: {builtInFileCount} files from
          `public/knowledge_base` and `public/faq`.
        </p>
        <p>Uploaded sources: {documents.length} files stored in this admin UI.</p>
        <p>
          Rebuild successful stores are activated automatically. `config/constants.ts`
          now only acts as a fallback value.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
        <span className="font-medium text-stone-900">Active vector store:</span>{" "}
        <span className="font-mono text-xs">
          {activeVectorStoreId ?? "Not configured"}
        </span>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-stone-900">
              Uploaded documents
            </div>
            <div className="text-xs text-stone-500">
              Add markdown, text, PDF, or office docs for the next rebuild.
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload files"}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUploadDocuments}
              accept=".md,.txt,.pdf,.doc,.docx,.csv,.json"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
              No uploaded documents yet.
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-sm shadow-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-stone-900">
                    {document.originalName}
                  </div>
                  <div className="text-xs text-stone-500">
                    {new Date(document.createdAt).toLocaleString("ja-JP")} ・{" "}
                    {Math.max(1, Math.round(document.size / 1024))} KB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(document.id)}
                  className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  aria-label={`Delete ${document.originalName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleInitialize}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {loading ? "Rebuilding..." : "Rebuild vector store"}
        </button>
        <div className="text-sm text-stone-500">{status}</div>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {success && !error ? (
        <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
          <div className="font-medium text-stone-900">
            Vector store rebuilt successfully.
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="text-stone-500">Vector Store ID:</div>
            <div className="rounded-md bg-white px-2 py-1 font-mono text-xs text-stone-900 shadow-sm">
              {vectorStoreId ?? ""}
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(vectorStoreId ?? "")}
              className="text-stone-400 transition-colors hover:text-stone-700"
              aria-label="Copy vector store ID"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            This store is already active. No manual config edit is required.
          </div>
        </div>
      ) : null}
    </section>
  );
}
