"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import pusherClient from "@/lib/pusher-client";

// ---- Types ----

interface CardInPlay {
  cardId: string;
  type: "regular" | "wizard" | "jester";
  color: "red" | "blue" | "green" | "yellow" | null;
  value: number | null;
}

interface TrickCard {
  playerId: string;
  username: string;
  card: CardInPlay;
}

interface Player {
  userId: string;
  username: string;
  hand: CardInPlay[];
  bid: number | null;
  score: number;
  tricksWon: number;
}

interface Game {
  _id: string;
  code: string;
  status: "waiting" | "in_progress" | "selecting_trump" | "finished";
  hostId: string;
  players: Player[];
  round: number;
  totalRounds: number;
  trumpCard: CardInPlay | null;
  trumpColor: "red" | "blue" | "green" | "yellow" | null;
  currentPlayerIndex: number;
  currentTrick: TrickCard[];
}

interface User {
  _id: string;
  username: string;
}

// ---- Color helpers ----

const colorMap: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
};

const colorLabel: Record<string, string> = {
  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
};

// ---- Card component ----

const CardComponent = ({
  card,
  onClick,
  disabled,
  selected,
}: {
  card: CardInPlay;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
}) => {
  const getCardLabel = () => {
    if (card.type === "wizard") return "W";
    if (card.type === "jester") return "J";
    return card.value?.toString() ?? "";
  };

  const getCardColor = () => {
    if (card.type === "wizard") return "bg-purple-600 border-purple-400";
    if (card.type === "jester") return "bg-gray-600 border-gray-400";
    const colors: Record<string, string> = {
      red: "bg-red-900 border-red-500",
      blue: "bg-blue-900 border-blue-500",
      green: "bg-green-900 border-green-500",
      yellow: "bg-yellow-900 border-yellow-500",
    };
    return colors[card.color ?? ""] ?? "bg-gray-800 border-gray-600";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-16 h-24 rounded-xl border-2 flex flex-col items-center justify-center
        font-bold text-white text-xl transition-all duration-200
        ${getCardColor()}
        ${selected ? "scale-110 -translate-y-2 ring-2 ring-yellow-400" : ""}
        ${!disabled && onClick ? "hover:scale-105 hover:-translate-y-1 cursor-pointer" : "cursor-default"}
        ${disabled ? "opacity-50" : ""}
      `}
    >
      <span className="text-xs absolute top-1 left-2 opacity-70">
        {card.color ? card.color[0].toUpperCase() : card.type === "wizard" ? "W" : "J"}
      </span>
      <span>{getCardLabel()}</span>
    </button>
  );
};

// ---- Main page ----

export default function WizardGamePage() {
  const [game, setGame] = useState<Game | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardInPlay | null>(null);
  const [bid, setBid] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const roomCode = params.roomCode as string;

  // Load current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    setCurrentUser(JSON.parse(savedUser));
  }, [router]);

  // Fetch game state on load
  useEffect(() => {
    if (!roomCode) return;

    const fetchGame = async () => {
      const res = await fetch(`/api/game/${roomCode}`);
      const data = await res.json();
      if (res.ok) setGame(data.game);
    };

    fetchGame();
  }, [roomCode]);

  // Subscribe to Pusher events
  useEffect(() => {
    if (!game) return;

    const channel = pusherClient.subscribe(`game-channel-${game._id}`);

    // Trump color selected by host
    channel.bind("trump-selected", (data: { trumpColor: string }) => {
      setGame((prev) =>
        prev
          ? { ...prev, trumpColor: data.trumpColor as Game["trumpColor"], status: "in_progress" }
          : prev
      );
    });

    // Game state updated (after a bid or card play)
    channel.bind("game-updated", (data: { game: Game }) => {
      setGame(data.game);
    });

    channel.bind("game-deleted", (data: { reason: string }) => {
    alert(data.reason);
    router.push("/");
   });

    // Game finished
    channel.bind("game-finished", (data: { game: Game }) => {
      setGame(data.game);
    });

    return () => {
      pusherClient.unsubscribe(`game-channel-${game._id}`);
    };
  }, [game?._id]);

  // ---- Handlers ----

    const handleLeave = async () => {
    if (!currentUser || !game) return;
    setLoading(true);

    try {
      await fetch("/api/game/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game._id,
          userId: currentUser._id,
        }),
      });

      router.push("/");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrump = async (color: string) => {
    if (!currentUser || !game) return;
    setLoading(true);

    try {
      const res = await fetch("/api/game/select-trump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game._id,
          userId: currentUser._id,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (amount: number) => {
    if (!currentUser || !game) return;
    setLoading(true);
    setBid(amount);

    try {
      const res = await fetch("/api/game/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game._id,
          userId: currentUser._id,
          bid: amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayCard = async () => {
    if (!currentUser || !game || !selectedCard) return;
    setLoading(true);

    try {
      const res = await fetch("/api/game/play-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game._id,
          userId: currentUser._id,
          card: selectedCard,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSelectedCard(null);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---- Derived state ----

  if (!game || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <p className="text-white/30 tracking-widest uppercase text-sm animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  const me = game.players.find((p) => p.userId === currentUser._id);
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isMyTurn = currentPlayer?.userId === currentUser._id;
  const isHost = game.hostId === currentUser._id;
  const allBidsPlaced = game.players.every((p) => p.bid !== null);
  const isBiddingPhase = game.status === "in_progress" && !allBidsPlaced;
  const isHost2 = game.hostId === currentUser._id;
  const myBidPlaced = me?.bid !== null;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#0a0a0f] overflow-hidden">

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧙</span>
          <div>
            <p className="text-white/70 text-sm font-semibold tracking-widest uppercase">
              Round {game.round} / {game.totalRounds}
            </p>
            <p className="text-white/30 text-xs tracking-widest">
              Room: {game.code}
            </p>
          </div>
        </div>

        {/* Trump card info */}
        <div className="flex items-center gap-3">
          <p className="text-white/30 text-xs tracking-widest uppercase">Trump</p>
          {game.trumpCard && (
            <CardComponent card={game.trumpCard} />
          )}
          {game.trumpColor && (
            <div className={`w-4 h-4 rounded-full ${colorMap[game.trumpColor]}`} />
          )}
          {!game.trumpColor && game.status !== "selecting_trump" && (
            <p className="text-white/30 text-xs">No trump</p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 gap-4 p-4">

        {/* Left sidebar — scoreboard */}
        <aside className="w-48 flex flex-col gap-2">
          <p className="text-white/30 text-xs tracking-widest uppercase mb-2">Scoreboard</p>
          {game.players.map((player) => (
            <div
              key={player.userId}
              className={`flex flex-col gap-1 px-3 py-2 rounded-lg border ${
                currentPlayer?.userId === player.userId
                  ? "border-yellow-500/40 bg-yellow-500/5"
                  : "border-white/5 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs truncate">{player.username}</span>
                {currentPlayer?.userId === player.userId && (
                  <span className="text-yellow-500/70 text-xs">▶</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs">Score: {player.score}</span>
                <span className="text-white/30 text-xs">
                  Bid: {player.bid ?? "—"} | Won: {player.tricksWon}
                </span>
              </div>
            </div>
          ))}
        <Button
          onClick={handleLeave}
          disabled={loading}
          className="w-full h-12 rounded-xl font-semibold tracking-widest uppercase text-sm text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
        >
          Leave Game
        </Button>
        </aside>

        {/* Main area */}
        <main className="flex flex-1 flex-col items-center gap-6">

          {/* Trump selection — host picks color when Wizard is flipped */}
          {game.status === "selecting_trump" && (
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
              {isHost ? (
                <>
                  <p
                    className="text-lg font-bold tracking-widest uppercase text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
                  >
                    A Wizard was flipped! Pick the trump color
                  </p>
                  <div className="flex gap-3">
                    {["red", "blue", "green", "yellow"].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleSelectTrump(color)}
                        disabled={loading}
                        className={`w-12 h-12 rounded-full ${colorMap[color]} hover:scale-110 transition-transform cursor-pointer border-2 border-white/20`}
                        title={colorLabel[color]}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-white/40 tracking-widest uppercase text-sm animate-pulse">
                  Waiting for host to pick trump color...
                </p>
              )}
            </div>
          )}

          {/* Bidding phase */}
          {isBiddingPhase && !myBidPlaced && (
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md w-full max-w-md">
              <p
                className="text-lg font-bold tracking-widest uppercase text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
              >
                Place your bid
              </p>
              <p className="text-white/30 text-xs tracking-wide">
                How many tricks will you win this round?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: game.round + 1 }, (_, i) => i).map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleBid(amount)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-lg border text-white/70 text-sm font-bold transition-all cursor-pointer
                      ${bid === amount ? "border-yellow-500 bg-yellow-500/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isBiddingPhase && myBidPlaced && (
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse">
                Waiting for other players to bid...
              </p>
            </div>
          )}

          {/* Current trick */}
          {allBidsPlaced && game.status === "in_progress" && (
            <div className="flex flex-col items-center gap-3 w-full">
              <p className="text-white/30 text-xs tracking-widest uppercase">Current Trick</p>
              <div className="flex gap-4 flex-wrap justify-center">
                {game.currentTrick.length === 0 ? (
                  <p className="text-white/20 text-xs tracking-wide">No cards played yet</p>
                ) : (
                  game.currentTrick.map((trickCard, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <CardComponent card={trickCard.card} />
                      <span className="text-white/40 text-xs">{trickCard.username}</span>
                    </div>
                  ))
                )}
              </div>

              {isMyTurn && (
                <p className="text-yellow-500/70 text-sm tracking-widest uppercase animate-pulse">
                  Your turn!
                </p>
              )}
            </div>
          )}

          {/* Game finished */}
          {game.status === "finished" && (
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <p
                className="text-2xl font-bold tracking-widest uppercase text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
              >
                Game Over!
              </p>
              <div className="flex flex-col gap-2 w-full">
                {[...game.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.userId} className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-white/70 text-sm">
                        {index + 1}. {player.username}
                      </span>
                      <span className="text-yellow-500/70 text-sm font-bold">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
              </div>
              <Button
                onClick={() => router.push("/")}
                className="mt-2 h-10 px-8 rounded-xl font-semibold tracking-widest uppercase text-sm text-[#0a0a0f] cursor-pointer"
                style={{ background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
              >
                Back to Home
              </Button>
            </div>
          )}

        </main>
      </div>

      {/* My hand — fixed at the bottom */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md px-6 py-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/30 text-xs tracking-widest uppercase">Your Hand</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {me?.hand.map((card, i) => (
              <CardComponent
                key={i}
                card={card}
                onClick={allBidsPlaced && isMyTurn && game.status === "in_progress"
                  ? () => setSelectedCard(card)
                  : undefined}
                selected={selectedCard?.cardId === card.cardId}
                disabled={!allBidsPlaced || !isMyTurn || game.status !== "in_progress"}
              />
            ))}
          </div>

          {selectedCard && isMyTurn && (
            <Button
              onClick={handlePlayCard}
              disabled={loading}
              className="h-10 px-8 rounded-xl font-semibold tracking-widest uppercase text-sm text-[#0a0a0f] cursor-pointer"
              style={{ background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
            >
              Play Card
            </Button>
          )}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border border-red-500/30 bg-red-950/80 backdrop-blur-md shadow-2xl">
          <span>❌</span>
          <p className="text-sm tracking-wide text-red-300">{error}</p>
        </div>
      )}

    </div>
  );
}