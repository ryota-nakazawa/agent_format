"use client";

import { KB_FOLDERS } from "@/config/demoData";
import { Copy, Database } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isStandalone = variant === "standalone";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleInitialize = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setStatus("Creating vector store...");

    const response = await fetch("/api/vector_stores/create_store", {
      method: "POST",
      body: JSON.stringify({ name: "CS Knowledge Base" }),
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
          filepath: `/public/${folder}/${file}`,
        }))
      );
    }

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
            Upload content from `public/knowledge_base` and `public/faq` into
            an OpenAI vector store for File Search.
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
        <p>Use this after updating your FAQ or knowledge base markdown files.</p>
        <p>
          After creation, copy the ID and set it in `config/constants.ts` as
          `VECTOR_STORE_ID`.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleInitialize}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {loading ? "Indexing..." : "Initialize vector store"}
        </button>
        <div className="text-sm text-stone-500">{status}</div>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {success && !error ? (
        <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
          <div className="font-medium text-stone-900">
            Knowledge base updated successfully.
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
        </div>
      ) : null}
    </section>
  );
}
