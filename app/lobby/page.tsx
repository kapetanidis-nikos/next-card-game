"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import pusherClient from "@/lib/pusher-client";

interface Player {
  userId: string;
  username: string;
}

interface Game {
  _id: string;
  code: string;
  players: Player[];
  hostId: string;
}

interface User {
  _id: string;
  username: string;
}

export default function LobbyPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect to login if not logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    setCurrentUser(JSON.parse(savedUser));
  }, [router]);

  // Subscribe to game room updates once we have a game
  useEffect(() => {
    if (!game) return;

    const channel = pusherClient.subscribe(`game-channel-${game._id}`);

    // Another player joined
    channel.bind("player-joined", (data: { players: Player[] }) => {
      setGame((prev) => (prev ? { ...prev, players: data.players } : prev));
    });

    // A player left the lobby
    channel.bind("player-left", (data: { players: Player[] }) => {
      setGame((prev) => (prev ? { ...prev, players: data.players } : prev));
    });

    // Game was deleted because host left
    channel.bind("game-deleted", (data: { reason: string }) => {
      setGame(null);
      setError(data.reason);
    });

    // Host started the game — redirect all players
    channel.bind("game-started", (data: { roomCode: string }) => {
      router.push(`/wizard/${data.roomCode}`);
    });

    return () => {
      pusherClient.unsubscribe(`game-channel-${game._id}`);
    };
  }, [game?._id, router]);

  const handleCreate = async () => {
    if (!currentUser) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
          username: currentUser.username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setGame(data.game);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUser) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
          username: currentUser.username,
          code: joinCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setGame(data.game);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!currentUser || !game) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game._id,
          userId: currentUser._id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push(`/wizard/${game.code}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

      setGame(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isHost = game?.hostId === currentUser?._id;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-900/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-indigo-900/20 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-8 px-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🧙</span>
          <h1
            className="bg-clip-text text-3xl font-bold tracking-widest text-transparent uppercase"
            style={{
              backgroundImage:
                "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
            }}
          >
            Game Lobby
          </h1>
        </div>

        {!game ? (
          // Pre-game — create or join
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-12 w-full cursor-pointer rounded-xl text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase"
              style={{
                background:
                  "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
              }}
            >
              {loading ? "Creating..." : "Create Game"}
            </Button>

            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs tracking-widest text-white/30 uppercase">
                or
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex w-full flex-col gap-3">
              <Input
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-center tracking-widest text-white uppercase placeholder:text-white/30"
              />
              <Button
                onClick={handleJoin}
                disabled={loading || !joinCode.trim()}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 text-sm font-semibold tracking-widest text-white/70 uppercase hover:bg-white/10"
              >
                {loading ? "Joining..." : "Join Game"}
              </Button>
            </div>

            {error && (
              <p className="text-center text-xs tracking-wide text-red-400">
                {error}
              </p>
            )}
          </div>
        ) : (
          // In room — waiting for players
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            {/* Room code */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs tracking-widest text-white/30 uppercase">
                Room Code
              </p>
              <p
                className="bg-clip-text text-4xl font-bold tracking-widest text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                }}
              >
                {game.code}
              </p>
              <p className="text-xs tracking-wide text-white/20">
                Share this code with your friends
              </p>
            </div>

            {/* Players list */}
            <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-xs tracking-widest text-white/40 uppercase">
                  Players — {game.players.length} / 6
                </p>
              </div>
              <div className="flex flex-col divide-y divide-white/5">
                {game.players.map((player) => (
                  <div
                    key={player.userId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60 uppercase">
                      {player.username[0]}
                    </div>
                    <span className="text-sm tracking-wide text-white/70">
                      {player.username}
                    </span>
                    {player.userId === game.hostId && (
                      <span className="ml-auto text-xs tracking-widest text-yellow-500/70 uppercase">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Start game button — only for host, min 3 players */}
            {isHost ? (
              <Button
                onClick={handleStart}
                disabled={game.players.length < 3 || loading}
                className="h-12 w-full cursor-pointer rounded-xl text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                }}
              >
                {game.players.length < 3
                  ? `Need ${3 - game.players.length} more player${3 - game.players.length > 1 ? "s" : ""}`
                  : loading
                    ? "Starting..."
                    : "Start Game"}
              </Button>
            ) : (
              <p className="text-xs tracking-widest text-white/30 uppercase">
                Waiting for host to start the game...
              </p>
            )}

            {/* Leave game button */}
            <Button
              onClick={handleLeave}
              disabled={loading}
              className="h-12 w-full cursor-pointer rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-semibold tracking-widest text-red-400 uppercase hover:bg-red-500/10"
            >
              Leave Game
            </Button>

            {error && (
              <p className="text-center text-xs tracking-wide text-red-400">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
