"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import pusherClient from "@/lib/pusher-client";

interface User {
  _id: string;
  username: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Read toast from localStorage set by login page
  useEffect(() => {
    const raw = localStorage.getItem("toast");
    if (raw) {
      const saved = JSON.parse(raw);
      showToast(saved.message, saved.type);
      localStorage.removeItem("toast");
    }

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleEnter = () => {
    if (currentUser) {
      router.push("/lobby");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-900/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-indigo-900/20 blur-3xl" />

      {/* Star dots */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-px rounded-full bg-white opacity-40"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="border-border bg-card fixed top-0 right-0 left-0 z-10 flex flex-row items-center border-b px-6 py-3 backdrop-blur-md">
        <span className="text-accent text-lg font-bold tracking-widest uppercase">
          Next Card Game
        </span>
        <span className="text-yellow-500/70">{currentUser?.username}</span>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
        <span className="text-7xl">🧙</span>
        <h1
          className="bg-clip-text text-5xl font-bold tracking-widest text-transparent uppercase"
          style={{
            backgroundImage:
              "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
          }}
        >
          Wizard
        </h1>
        <p className="text-sm tracking-widest text-white/30 uppercase">
          The card game
        </p>

        <Button
          onClick={handleEnter}
          className="mt-4 h-12 cursor-pointer rounded-xl px-10 text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase transition-all duration-200"
          style={{
            background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
          }}
        >
          {currentUser ? "Enter Lobby" : "Login to Play"}
        </Button>
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-950/80 text-green-300"
              : "border-red-500/30 bg-red-950/80 text-red-300"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <p className="text-sm tracking-wide">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
