import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession, { IPlayer } from "@/lib/models/GameSession";
import pusher from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { gameId, userId } = await req.json();

    if (!gameId || !userId) {
      return NextResponse.json(
        { error: "gameId and userId are required" },
        { status: 400 }
      );
    }

    // Ensure database connection is established before querying
    await connectToDatabase();

    const game = await GameSession.findById(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const isHost = game.hostId.toString() === userId;

    // If host leaves or player leaves mid-game — delete the game entirely
    if (isHost || game.status === "in_progress" || game.status === "selecting_trump") {
      await GameSession.findByIdAndDelete(gameId);

      // Notify all players the game was deleted
      await pusher.trigger(`game-channel-${gameId}`, "game-deleted", {
        reason: isHost ? "Host left the game" : "A player left the game",
      });

      return NextResponse.json({ message: "Game deleted" }, { status: 200 });
    }

    // Player leaves while waiting in lobby — just remove them
    game.players = game.players.filter(
      (p: IPlayer) => p.userId.toString() !== userId
    );
    await game.save();

    // Notify remaining players
    await pusher.trigger(`game-channel-${gameId}`, "player-left", {
      players: game.players,
      userId,
    });

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}