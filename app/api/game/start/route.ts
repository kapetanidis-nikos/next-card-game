import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession from "@/lib/models/GameSession";
import Card from "@/lib/models/Card";
import pusher from "@/lib/pusher";
import { ICardInPlay, IPlayer } from "@/lib/models/GameSession";

// Shuffles an array using Fisher-Yates algorithm
const shuffleDeck = (deck: ICardInPlay[]): ICardInPlay[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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

    // Only the host can start the game
    if (game.hostId.toString() !== userId) {
      return NextResponse.json(
        { error: "Only the host can start the game" },
        { status: 403 }
      );
    }

    if (game.status !== "waiting") {
      return NextResponse.json(
        { error: "Game has already started" },
        { status: 400 }
      );
    }

    if (game.players.length < 3) {
      return NextResponse.json(
        { error: "Need at least 3 players to start" },
        { status: 400 }
      );
    }

    // Fetch all cards from the database and build the deck
    const cards = await Card.find({});
    const deck: ICardInPlay[] = cards.map((card) => ({
      cardId: card._id,
      type: card.type,
      color: card.color,
      value: card.value,
    }));

    // Shuffle the deck
    const shuffledDeck = shuffleDeck(deck);

    // Calculate total rounds based on player count
    const totalRounds = Math.floor(60 / game.players.length);

    // Deal 1 card to each player for round 1
    const updatedPlayers = game.players.map((player: IPlayer, index: number) => ({
    userId: player.userId,
    username: player.username,
    hand: [shuffledDeck[index]],
    bid: player.bid,
    score: player.score,
    tricksWon: player.tricksWon,
    }));

    // The trump card is the next card after the dealt cards
    const trumpCard = shuffledDeck[game.players.length];

    // Remaining deck after dealing and flipping trump card
    const remainingDeck = shuffledDeck.slice(game.players.length + 1);

    // Determine trump color based on trump card type
    let trumpColor = null;
    let newStatus: "in_progress" | "selecting_trump" = "in_progress";

    if (trumpCard.type === "regular") {
      // Regular card — trump color is the card's color
      trumpColor = trumpCard.color;
    } else if (trumpCard.type === "jester") {
      // Jester — no trump color
      trumpColor = null;
    } else if (trumpCard.type === "wizard") {
      // Wizard — host must pick the trump color
      newStatus = "selecting_trump";
    }

    // Update the game session
    game.status = newStatus;
    game.totalRounds = totalRounds;
    game.players = updatedPlayers;
    game.deck = remainingDeck;
    game.trumpCard = trumpCard;
    game.trumpColor = trumpColor;
    game.round = 1;
    game.currentPlayerIndex = 0;
    await game.save();

    // Notify all players the game has started
    await pusher.trigger(`game-channel-${gameId}`, "game-started", {
      roomCode: game.code,
      status: newStatus,
    });

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}