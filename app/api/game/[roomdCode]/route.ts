import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession from "@/lib/models/GameSession";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    // Ensure database connection is established before querying
    await connectToDatabase();

    const game = await GameSession.findOne({ code: params.roomCode });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}