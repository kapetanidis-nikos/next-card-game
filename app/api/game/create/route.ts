import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession from "@/lib/models/GameSession";
import pusher from "@/lib/pusher";

// Generates a random 6 character room code
const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export async function POST(req: NextRequest) {
  try {
    const { userId, username } = await req.json();

    if (!userId || !username) {
      return NextResponse.json(
        { error: "userId and username are required" },
        { status: 400 }
      );
    }

    // Ensure database connection is established before querying
    await connectToDatabase();

    // Generate a unique code
    let code = generateCode();
    let exists = await GameSession.findOne({ code });
    while (exists) {
      code = generateCode();
      exists = await GameSession.findOne({ code });
    }

    const game = await GameSession.create({
      code,
      status: "waiting",
      hostId: userId,
      totalRounds: 0, // will be calculated when game starts based on player count
      players: [{ userId, username, hand: [], bid: null, score: 0, tricksWon: 0 }],
    });

    // Notify all connected clients that a new game is available
    await pusher.trigger("lobby-channel", "game-created", {
      game: { _id: game._id, code: game.code, players: game.players, hostId: game.hostId },
    });

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}