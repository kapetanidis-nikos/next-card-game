"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JoinOrCreateCard from "./components/JoinOrCreateCard";
import GameRoomCard from "./components/GameRoomCard";
import LobbyHeader from "./components/LobbyHeader";
import pusherClient from "@/lib/pusher-client";
import { User } from "@/types";
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

export default function LobbyPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    setCurrentUser(JSON.parse(savedUser));
  }, [router]);

  useEffect(() => {
    if (!game) return;

    const channel = pusherClient.subscribe(`game-channel-${game._id}`);

    channel.bind("player-joined", (data: { players: Player[] }) => {
      setGame((prev) => (prev ? { ...prev, players: data.players } : prev));
    });

    channel.bind("player-left", (data: { players: Player[] }) => {
      setGame((prev) => (prev ? { ...prev, players: data.players } : prev));
    });

    channel.bind("game-deleted", (data: { reason: string }) => {
      setGame(null);
      setError(data.reason);
    });

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
    <div className="relative z-10 flex w-full flex-col items-center justify-center gap-8 px-4 pt-20">
      <LobbyHeader />

      {!game ? (
        <JoinOrCreateCard
          joinCode={joinCode}
          onJoinCodeChange={setJoinCode}
          onJoin={handleJoin}
          onCreate={handleCreate}
          loading={loading}
          error={error}
        />
      ) : (
        <GameRoomCard
          code={game.code}
          players={game.players}
          hostId={game.hostId}
          isHost={isHost}
          loading={loading}
          error={error}
          onStart={handleStart}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
