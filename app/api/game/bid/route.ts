import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession, { IPlayer } from "@/lib/models/GameSession";
import pusher from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { gameId, userId, bid } = await req.json();

    if (!gameId || !userId || bid === undefined) {
      return NextResponse.json(
        { error: "gameId, userId and bid are required" },
        { status: 400 }
      );
    }

    // Ensure database connection is established before querying
    await connectToDatabase();

    const game = await GameSession.findById(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "in_progress") {
      return NextResponse.json(
        { error: "Game is not in progress" },
        { status: 400 }
      );
    }

    // Check all bids are not already placed
    const allBidsPlaced = game.players.every((p: IPlayer) => p.bid !== null);
    if (allBidsPlaced) {
      return NextResponse.json(
        { error: "All bids have already been placed" },
        { status: 400 }
      );
    }

    // Find the player and update their bid
    const playerIndex = game.players.findIndex(
      (p: IPlayer) => p.userId.toString() === userId
    );

    if (playerIndex === -1) {
      return NextResponse.json(
        { error: "Player not found in this game" },
        { status: 404 }
      );
    }

    if (game.players[playerIndex].bid !== null) {
      return NextResponse.json(
        { error: "You have already placed a bid" },
        { status: 400 }
      );
    }

    if (bid < 0 || bid > game.round) {
      return NextResponse.json(
        { error: `Bid must be between 0 and ${game.round}` },
        { status: 400 }
      );
    }

    game.players[playerIndex].bid = bid;
    await game.save();

    // Notify all players of the updated game state
    await pusher.trigger(`game-channel-${gameId}`, "game-updated", {
      game: game.toObject(),
    });

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}