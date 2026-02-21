import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession, { IPlayer } from "@/lib/models/GameSession";
import pusher from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { userId, username, code } = await req.json();

    if (!userId || !username || !code) {
      return NextResponse.json(
        { error: "userId, username and code are required" },
        { status: 400 }
      );
    }

    // Ensure database connection is established before querying
    await connectToDatabase();

    const game = await GameSession.findOne({ code: code.toUpperCase() });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    if (game.status !== "waiting") {
      return NextResponse.json(
        { error: "Game has already started" },
        { status: 400 }
      );
    }

    if (game.players.length >= 6) {
      return NextResponse.json(
        { error: "Game is full" },
        { status: 400 }
      );
    }

    // Check if player is already in the game
    const alreadyJoined = game.players.find(
        (p: IPlayer) => p.userId.toString() === userId
    );

    if (alreadyJoined) {
      return NextResponse.json(
        { error: "You are already in this game" },
        { status: 400 }
      );
    }

    game.players.push({ userId, username, hand: [], bid: null, score: 0, tricksWon: 0 });
    await game.save();

    // Notify all players in this game room that someone joined
    await pusher.trigger(`game-channel-${game._id}`, "player-joined", {
      players: game.players,
    });

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}