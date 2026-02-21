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
  const [users, setUsers] = useState<User[]>([]);
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

  useEffect(() => {
  // Fetch the initial users list on mount
  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users);
  };
  fetchUsers();

  // Subscribe to the users channel
  const channel = pusherClient.subscribe("users-channel");

  // When a new user logs in, add them to the list if not already there
  channel.bind("user-logged-in", (data: { user: User }) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u._id === data.user._id);
      if (exists) return prev;
      return [...prev, data.user];
    });
  });

  // Unsubscribe when the component unmounts
  return () => {
    pusherClient.unsubscribe("users-channel");
  };
}, []);

  const handleEnter = () => {
    if (currentUser) {
      router.push("/lobby");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#0a0a0f] overflow-hidden">

      {/* Ambient background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Star dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full opacity-40"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 min-h-screen border-r border-white/10 bg-white/5 backdrop-blur-md flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <h2
            className="text-sm font-bold tracking-widest uppercase text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
          >
            Travellers
          </h2>
        </div>

        <div className="flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {users.length === 0 && (
            <p className="text-white/20 text-xs text-center tracking-widest uppercase mt-4">
              No travellers yet
            </p>
          )}
          {users.map((user) => (
            <div
              key={user._id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                currentUser?._id === user._id ? "bg-white/10" : "hover:bg-white/5"
              } transition-colors duration-150`}
            >
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 uppercase font-bold flex-shrink-0">
                {user.username[0]}
              </div>
              <span className="text-white/70 text-sm tracking-wide truncate">
                {user.username}
                {currentUser?._id === user._id && (
                  <span className="ml-2 text-yellow-500/70 text-xs">(you)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
        <span className="text-7xl">🧙</span>
        <h1
          className="text-5xl font-bold tracking-widest uppercase text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
        >
          Wizard
        </h1>
        <p className="text-white/30 text-sm tracking-widest uppercase">
          The card game
        </p>

        <Button
          onClick={handleEnter}
          className="mt-4 h-12 px-10 rounded-xl font-semibold tracking-widest uppercase text-sm text-[#0a0a0f] transition-all duration-200 cursor-pointer"
          style={{ background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
        >
          {currentUser ? "Enter Lobby" : "Login to Play"}
        </Button>

        {currentUser && (
          <p className="text-white/30 text-xs tracking-widest">
            Logged in as <span className="text-yellow-500/70">{currentUser.username}</span>
          </p>
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-950/80 border-green-500/30 text-green-300"
              : "bg-red-950/80 border-red-500/30 text-red-300"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <p className="text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

    </div>
  );
}