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
      className={`relative flex h-24 w-16 flex-col items-center justify-center rounded-xl border-2 text-xl font-bold text-white transition-all duration-200 ${getCardColor()} ${selected ? "-translate-y-2 scale-110 ring-2 ring-yellow-400" : ""} ${!disabled && onClick ? "cursor-pointer hover:-translate-y-1 hover:scale-105" : "cursor-default"} ${disabled ? "opacity-50" : ""} `}
    >
      <span className="absolute top-1 left-2 text-xs opacity-70">
        {card.color
          ? card.color[0].toUpperCase()
          : card.type === "wizard"
            ? "W"
            : "J"}
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
          ? {
              ...prev,
              trumpColor: data.trumpColor as Game["trumpColor"],
              status: "in_progress",
            }
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <p className="animate-pulse text-sm tracking-widest text-white/30 uppercase">
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-900/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-indigo-900/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧙</span>
          <div>
            <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
              Round {game.round} / {game.totalRounds}
            </p>
            <p className="text-xs tracking-widest text-white/30">
              Room: {game.code}
            </p>
          </div>
        </div>

        {/* Trump card info */}
        <div className="flex items-center gap-3">
          <p className="text-xs tracking-widest text-white/30 uppercase">
            Trump
          </p>
          {game.trumpCard && <CardComponent card={game.trumpCard} />}
          {game.trumpColor && (
            <div
              className={`h-4 w-4 rounded-full ${colorMap[game.trumpColor]}`}
            />
          )}
          {!game.trumpColor && game.status !== "selecting_trump" && (
            <p className="text-xs text-white/30">No trump</p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 gap-4 p-4">
        {/* Left sidebar — scoreboard */}
        <aside className="flex w-48 flex-col gap-2">
          <p className="mb-2 text-xs tracking-widest text-white/30 uppercase">
            Scoreboard
          </p>
          {game.players.map((player) => (
            <div
              key={player.userId}
              className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${
                currentPlayer?.userId === player.userId
                  ? "border-yellow-500/40 bg-yellow-500/5"
                  : "border-white/5 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-xs text-white/70">
                  {player.username}
                </span>
                {currentPlayer?.userId === player.userId && (
                  <span className="text-xs text-yellow-500/70">▶</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30">
                  Score: {player.score}
                </span>
                <span className="text-xs text-white/30">
                  Bid: {player.bid ?? "—"} | Won: {player.tricksWon}
                </span>
              </div>
            </div>
          ))}
          <Button
            onClick={handleLeave}
            disabled={loading}
            className="h-12 w-full cursor-pointer rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-semibold tracking-widest text-red-400 uppercase hover:bg-red-500/10"
          >
            Leave Game
          </Button>
        </aside>

        {/* Main area */}
        <main className="flex flex-1 flex-col items-center gap-6">
          {/* Trump selection — host picks color when Wizard is flipped */}
          {game.status === "selecting_trump" && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              {isHost ? (
                <>
                  <p
                    className="bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                    }}
                  >
                    A Wizard was flipped! Pick the trump color
                  </p>
                  <div className="flex gap-3">
                    {["red", "blue", "green", "yellow"].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleSelectTrump(color)}
                        disabled={loading}
                        className={`h-12 w-12 rounded-full ${colorMap[color]} cursor-pointer border-2 border-white/20 transition-transform hover:scale-110`}
                        title={colorLabel[color]}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="animate-pulse text-sm tracking-widest text-white/40 uppercase">
                  Waiting for host to pick trump color...
                </p>
              )}
            </div>
          )}

          {/* Bidding phase */}
          {isBiddingPhase && !myBidPlaced && (
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <p
                className="bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                }}
              >
                Place your bid
              </p>
              <p className="text-xs tracking-wide text-white/30">
                How many tricks will you win this round?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: game.round + 1 }, (_, i) => i).map(
                  (amount) => (
                    <button
                      key={amount}
                      onClick={() => handleBid(amount)}
                      disabled={loading}
                      className={`h-10 w-10 cursor-pointer rounded-lg border text-sm font-bold text-white/70 transition-all ${bid === amount ? "border-yellow-500 bg-yellow-500/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      {amount}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {isBiddingPhase && myBidPlaced && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="animate-pulse text-sm tracking-widest text-white/40 uppercase">
                Waiting for other players to bid...
              </p>
            </div>
          )}

          {/* Current trick */}
          {allBidsPlaced && game.status === "in_progress" && (
            <div className="flex w-full flex-col items-center gap-3">
              <p className="text-xs tracking-widest text-white/30 uppercase">
                Current Trick
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {game.currentTrick.length === 0 ? (
                  <p className="text-xs tracking-wide text-white/20">
                    No cards played yet
                  </p>
                ) : (
                  game.currentTrick.map((trickCard, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <CardComponent card={trickCard.card} />
                      <span className="text-xs text-white/40">
                        {trickCard.username}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {isMyTurn && (
                <p className="animate-pulse text-sm tracking-widest text-yellow-500/70 uppercase">
                  Your turn!
                </p>
              )}
            </div>
          )}

          {/* Game finished */}
          {game.status === "finished" && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <p
                className="bg-clip-text text-2xl font-bold tracking-widest text-transparent uppercase"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                }}
              >
                Game Over!
              </p>
              <div className="flex w-full flex-col gap-2">
                {[...game.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2"
                    >
                      <span className="text-sm text-white/70">
                        {index + 1}. {player.username}
                      </span>
                      <span className="text-sm font-bold text-yellow-500/70">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
              </div>
              <Button
                onClick={() => router.push("/")}
                className="mt-2 h-10 cursor-pointer rounded-xl px-8 text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase"
                style={{
                  background:
                    "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                }}
              >
                Back to Home
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* My hand — fixed at the bottom */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs tracking-widest text-white/30 uppercase">
            Your Hand
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {me?.hand.map((card, i) => (
              <CardComponent
                key={i}
                card={card}
                onClick={
                  allBidsPlaced && isMyTurn && game.status === "in_progress"
                    ? () => setSelectedCard(card)
                    : undefined
                }
                selected={selectedCard?.cardId === card.cardId}
                disabled={
                  !allBidsPlaced || !isMyTurn || game.status !== "in_progress"
                }
              />
            ))}
          </div>

          {selectedCard && isMyTurn && (
            <Button
              onClick={handlePlayCard}
              disabled={loading}
              className="h-10 cursor-pointer rounded-xl px-8 text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase"
              style={{
                background:
                  "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
              }}
            >
              Play Card
            </Button>
          )}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/80 px-5 py-4 shadow-2xl backdrop-blur-md">
          <span>❌</span>
          <p className="text-sm tracking-wide text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
