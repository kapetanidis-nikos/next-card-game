import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession from "@/lib/models/GameSession";
import pusher from "@/lib/pusher";

const validColors = ["red", "blue", "green", "yellow"];

export async function POST(req: NextRequest) {
  try {
    const { gameId, userId, color } = await req.json();

    if (!gameId || !userId || !color) {
      return NextResponse.json(
        { error: "gameId, userId and color are required" },
        { status: 400 }
      );
    }

    if (!validColors.includes(color)) {
      return NextResponse.json(
        { error: "Invalid color. Must be red, blue, green or yellow" },
        { status: 400 }
      );
    }

    // Ensure database connection is established before querying
    await connectToDatabase();

    const game = await GameSession.findById(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Only the host can select the trump color
    if (game.hostId.toString() !== userId) {
      return NextResponse.json(
        { error: "Only the host can select the trump color" },
        { status: 403 }
      );
    }

    if (game.status !== "selecting_trump") {
      return NextResponse.json(
        { error: "Game is not in trump selection phase" },
        { status: 400 }
      );
    }

    // Set the trump color and move to in_progress
    game.trumpColor = color;
    game.status = "in_progress";
    await game.save();

    // Notify all players of the selected trump color
    await pusher.trigger(`game-channel-${gameId}`, "trump-selected", {
      trumpColor: color,
    });

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}