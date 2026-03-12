import { NextResponse } from "next/server";
import {
  deleteAdminDocument,
  listAdminDocuments,
  saveAdminDocuments,
} from "@/lib/admin-documents-store";

export async function GET() {
  try {
    const documents = await listAdminDocuments();
    return NextResponse.json(
      { documents },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error listing admin documents:", error);
    return NextResponse.json(
      { error: "Failed to list uploaded documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files were uploaded" },
        { status: 400 }
      );
    }

    const serializedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        buffer: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const documents = await saveAdminDocuments(serializedFiles);
    return NextResponse.json(documents, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error saving admin documents:", error);
    return NextResponse.json(
      { error: "Failed to save uploaded documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing document id" },
        { status: 400 }
      );
    }

    const deleted = await deleteAdminDocument(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting admin document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
