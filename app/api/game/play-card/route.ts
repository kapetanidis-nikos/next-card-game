import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GameSession, { IPlayer, ICardInPlay } from "@/lib/models/GameSession";
import Card from "@/lib/models/Card";
import pusher from "@/lib/pusher";

// ---- Trick winner logic ----

const determineTrickWinner = (
  trick: { playerId: string; username: string; card: ICardInPlay }[],
  trumpColor: string | null
): { winnerId: string; winnerUsername: string } => {
  let winnerIndex = 0;

  for (let i = 0; i < trick.length; i++) {
    const card = trick[i].card;
    const currentWinner = trick[winnerIndex].card;

    // Wizard always wins — first wizard played wins
    if (card.type === "wizard" && currentWinner.type !== "wizard") {
      winnerIndex = i;
      continue;
    }

    // Jester never wins
    if (card.type === "jester") continue;

    // Current winner is a wizard — they keep winning
    if (currentWinner.type === "wizard") continue;

    // Trump card beats non-trump
    if (card.color === trumpColor && currentWinner.color !== trumpColor) {
      winnerIndex = i;
      continue;
    }

    // Same color — higher value wins
    if (card.color === currentWinner.color && (card.value ?? 0) > (currentWinner.value ?? 0)) {
      winnerIndex = i;
    }
  }

  return {
    winnerId: trick[winnerIndex].playerId,
    winnerUsername: trick[winnerIndex].username,
  };
};

// ---- Calculate scores at end of round ----

const calculateScore = (bid: number, tricksWon: number): number => {
  if (tricksWon === bid) {
    return 20 + bid * 10;
  }
  return -10 * Math.abs(bid - tricksWon);
};

// ---- Shuffle ----

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
    const { gameId, userId, card } = await req.json();

    if (!gameId || !userId || !card) {
      return NextResponse.json(
        { error: "gameId, userId and card are required" },
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

    // Validate it is the player's turn
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "It is not your turn" },
        { status: 400 }
      );
    }

    // Validate all bids have been placed
    const allBidsPlaced = game.players.every((p: IPlayer) => p.bid !== null);
    if (!allBidsPlaced) {
      return NextResponse.json(
        { error: "All players must bid before playing" },
        { status: 400 }
      );
    }

    // Validate the player has the card in their hand
    const playerIndex = game.players.findIndex(
      (p: IPlayer) => p.userId.toString() === userId
    );
    const player = game.players[playerIndex];
    const cardIndex = player.hand.findIndex(
      (c: ICardInPlay) => c.cardId.toString() === card.cardId
    );

    if (cardIndex === -1) {
      return NextResponse.json(
        { error: "You do not have this card" },
        { status: 400 }
      );
    }

    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);

    // Add card to current trick
    game.currentTrick.push({
      playerId: userId,
      username: player.username,
      card,
    });

    // Check if all players have played a card
    const trickComplete = game.currentTrick.length === game.players.length;

    if (trickComplete) {
      // Determine trick winner
      const { winnerId, winnerUsername } = determineTrickWinner(
        game.currentTrick.map((tc) => ({
          playerId: tc.playerId.toString(),
          username: tc.username,
          card: tc.card,
        })),
        game.trumpColor
      );

      // Update tricks won for the winner
      const winnerIndex = game.players.findIndex(
        (p: IPlayer) => p.userId.toString() === winnerId
      );
      game.players[winnerIndex].tricksWon += 1;

      // Save completed trick and reset current trick
      game.completedTricks.push({
        cards: game.currentTrick,
        winnerId,
        winnerUsername,
      });
      game.currentTrick = [];

      // Winner leads the next trick
      game.currentPlayerIndex = winnerIndex;

      // Check if the round is over (all hands empty)
      const roundOver = game.players.every(
        (p: IPlayer) => p.hand.length === 0
      );

      if (roundOver) {
        // Calculate scores for this round
        game.players.forEach((p: IPlayer) => {
          p.score += calculateScore(p.bid ?? 0, p.tricksWon);
        });

        // Check if the game is over
        if (game.round >= game.totalRounds) {
          game.status = "finished";

          await game.save();

          await pusher.trigger(`game-channel-${gameId}`, "game-finished", {
            game: game.toObject(),
          });

          return NextResponse.json({ game }, { status: 200 });
        }

        // Start next round — deal more cards
        game.round += 1;

        // Reset bids and tricks won
        game.players.forEach((p: IPlayer) => {
          p.bid = null;
          p.tricksWon = 0;
        });

        // Fetch and reshuffle deck
        const cards = await Card.find({});
        const freshDeck: ICardInPlay[] = cards.map((c) => ({
          cardId: c._id,
          type: c.type,
          color: c.color,
          value: c.value,
        }));
        const shuffled = shuffleDeck(freshDeck);

        // Deal cards for the new round
        game.players.forEach((p: IPlayer, index: number) => {
          p.hand = shuffled.slice(
            index * game.round,
            (index + 1) * game.round
          );
        });

        // Flip new trump card
        const trumpCard = shuffled[game.players.length * game.round];
        const remainingDeck = shuffled.slice(game.players.length * game.round + 1);

        game.deck = remainingDeck;
        game.trumpCard = trumpCard;
        game.completedTricks = [];

        if (trumpCard.type === "regular") {
          game.trumpColor = trumpCard.color;
          game.status = "in_progress";
        } else if (trumpCard.type === "jester") {
          game.trumpColor = null;
          game.status = "in_progress";
        } else if (trumpCard.type === "wizard") {
          game.trumpColor = null;
          game.status = "selecting_trump";
        }
      } else {
        // Round continues — next player leads
        game.currentPlayerIndex = winnerIndex;
      }
    } else {
      // Trick not complete — move to next player
      game.currentPlayerIndex =
        (game.currentPlayerIndex + 1) % game.players.length;
    }

    await game.save();

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