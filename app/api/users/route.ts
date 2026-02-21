import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "🛜 Connected to MongoDB" });
  } catch (error) {
    return NextResponse.json({ status: "⛔ Connection failed", error }, { status: 500 });
  }
}
