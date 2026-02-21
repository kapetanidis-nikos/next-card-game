"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        showToast(data.error || "Something went wrong", "error");
        return;
      }

      // Store the user in localStorage for now
      localStorage.setItem("user", JSON.stringify(data.user));
      showToast(`Welcome, ${data.user.username}!`, "success");
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setError("Something went wrong");
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] overflow-hidden">

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

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-8 py-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">

        {/* Wizard hat icon */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🧙</span>
          <h1
            className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
          >
            Wizard
          </h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">Enter your name, traveller</p>
        </div>

        {/* Input + button */}
        <div className="flex flex-col gap-3 w-full">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-yellow-500/50 focus:ring-yellow-500/20 rounded-xl h-12 text-center tracking-widest"
          />

          {error && (
            <p className="text-red-400 text-xs text-center tracking-wide">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !username.trim()}
            className="w-full h-12 rounded-xl font-semibold tracking-widest uppercase text-sm text-[#0a0a0f] disabled:opacity-40 transition-all duration-200 cursor-pointer"
            style={{ background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)" }}
          >
            {loading ? "Entering..." : "Enter the Game"}
          </Button>
        </div>

      </div>

      {/* Toast notification */}
      {/* ΤODO - How can toast be persistent after redirecting to other page*/}
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