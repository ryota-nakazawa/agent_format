import { NextResponse } from "next/server";
import {
  readVectorStoreConfig,
  writeActiveVectorStoreId,
} from "@/lib/vector-store-config";

export async function GET() {
  try {
    const config = await readVectorStoreConfig();
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error reading vector store config:", error);
    return NextResponse.json(
      { error: "Failed to read vector store config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { vectorStoreId } = await request.json();

    if (!vectorStoreId || typeof vectorStoreId !== "string") {
      return NextResponse.json(
        { error: "Missing vectorStoreId" },
        { status: 400 }
      );
    }

    const config = await writeActiveVectorStoreId(vectorStoreId);
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error updating vector store config:", error);
    return NextResponse.json(
      { error: "Failed to update vector store config" },
      { status: 500 }
    );
  }
}
