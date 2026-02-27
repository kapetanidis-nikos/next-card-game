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
    <div className="relative flex min-h-screen bg-[#0a0a0f] overflow-hidden">

      {/* Ambient background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full gap-8 px-4">

        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🧙</span>
          <h1
            className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
          >
            Game Lobby
          </h1>
        </div>

        {!game ? (
          // Pre-game — create or join
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">

            <Button
              onClick={handleCreate}
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold tracking-widest uppercase text-sm text-[#0a0a0f] cursor-pointer"
              style={{ background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
            >
              {loading ? "Creating..." : "Create Game"}
            </Button>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs tracking-widest uppercase">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Input
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12 text-center tracking-widest uppercase"
              />
              <Button
                onClick={handleJoin}
                disabled={loading || !joinCode.trim()}
                className="w-full h-12 rounded-xl font-semibold tracking-widest uppercase text-sm text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                {loading ? "Joining..." : "Join Game"}
              </Button>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center tracking-wide">{error}</p>
            )}

          </div>

        ) : (
          // In room — waiting for players
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">

            {/* Room code */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/30 text-xs tracking-widest uppercase">Room Code</p>
              <p
                className="text-4xl font-bold tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
              >
                {game.code}
              </p>
              <p className="text-white/20 text-xs tracking-wide">
                Share this code with your friends
              </p>
            </div>

            {/* Players list */}
            <div className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-white/40 text-xs tracking-widest uppercase">
                  Players — {game.players.length} / 6
                </p>
              </div>
              <div className="flex flex-col divide-y divide-white/5">
                {game.players.map((player) => (
                  <div key={player.userId} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 uppercase font-bold">
                      {player.username[0]}
                    </div>
                    <span className="text-white/70 text-sm tracking-wide">
                      {player.username}
                    </span>
                    {player.userId === game.hostId && (
                      <span className="ml-auto text-yellow-500/70 text-xs tracking-widest uppercase">
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
                className="w-full h-12 rounded-xl font-semibold tracking-widest uppercase text-sm text-[#0a0a0f] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
              >
                {game.players.length < 3
                  ? `Need ${3 - game.players.length} more player${3 - game.players.length > 1 ? "s" : ""}`
                  : loading ? "Starting..." : "Start Game"}
              </Button>
            ) : (
              <p className="text-white/30 text-xs tracking-widest uppercase">
                Waiting for host to start the game...
              </p>
            )}

            {/* Leave game button */}
            <Button
              onClick={handleLeave}
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold tracking-widest uppercase text-sm text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
            >
              Leave Game
            </Button>

            {error && (
              <p className="text-red-400 text-xs text-center tracking-wide">{error}</p>
            )}

          </div>
        )}

      </div>
    </div>
  );
}