"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BoardgameCard } from "@/components/BoardgameCard";
import { User } from "@/types";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleEnter = () => {
    router.push("/lobby");
  };

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center pt-24">
      <div className="mt-8 grid grid-cols-1 gap-4 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        <BoardgameCard
          title="Wizard"
          description="Bid on tricks and outwit your opponents in this classic card game."
          players="3–6"
          duration="45–75 min"
          emoji="🧙"
          disabled={!currentUser}
          onEnterLobby={handleEnter}
        />
        {PLACEHOLDER_BOARDGAMES.map((game) => (
          <BoardgameCard key={game.title} {...game} underConstruction />
        ))}
      </div>
    </main>
  );
}

const PLACEHOLDER_BOARDGAMES = [
  {
    title: "Catan",
    description: "Trade, build, and settle the island of Catan.",
    players: "3–4",
    duration: "60–120 min",
    emoji: "🏝️",
  },
  {
    title: "Ticket to Ride",
    description: "Claim railway routes across the map.",
    players: "2–5",
    duration: "30–90 min",
    emoji: "🚂",
  },
  {
    title: "Pandemic",
    description: "Work together to stop four deadly diseases.",
    players: "2–4",
    duration: "45–60 min",
    emoji: "🦠",
  },
  {
    title: "Carcassonne",
    description: "Build the medieval landscape tile by tile.",
    players: "2–5",
    duration: "30–45 min",
    emoji: "🏰",
  },
  {
    title: "Codenames",
    description: "Give one-word clues to identify secret agents.",
    players: "2–8",
    duration: "15–30 min",
    emoji: "🕵️",
  },
  {
    title: "Dominion",
    description: "Build the most powerful deck to dominate.",
    players: "2–4",
    duration: "30 min",
    emoji: "👑",
  },
  {
    title: "7 Wonders",
    description: "Lead an ancient civilization to glory.",
    players: "2–7",
    duration: "30 min",
    emoji: "🏛️",
  },
  {
    title: "Azul",
    description: "Draft tiles to decorate the royal palace.",
    players: "2–4",
    duration: "30–45 min",
    emoji: "🔷",
  },
  {
    title: "Wingspan",
    description: "Attract birds to your wildlife preserve.",
    players: "1–5",
    duration: "40–70 min",
    emoji: "🦜",
  },
];
