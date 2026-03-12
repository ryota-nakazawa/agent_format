import { NextResponse } from "next/server";
import { readInquiries, upsertInquiry } from "@/lib/inquiries-store";

export async function GET() {
  try {
    const inquiries = await readInquiries();
    return NextResponse.json(
      { inquiries },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error reading inquiries:", error);
    return NextResponse.json(
      { error: "Failed to read inquiries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inquiry = await upsertInquiry(body);
    return NextResponse.json(inquiry, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error upserting inquiry:", error);
    return NextResponse.json(
      { error: "Failed to save inquiry" },
      { status: 500 }
    );
  }
}
