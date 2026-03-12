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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f]">
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

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-md">
        {/* Wizard hat icon */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🧙</span>
          <h1
            className="bg-clip-text text-3xl font-bold tracking-widest text-transparent uppercase"
            style={{
              backgroundImage:
                "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
            }}
          >
            Wizard
          </h1>
          <p className="text-sm tracking-widest text-white/40 uppercase">
            Enter your name, traveller
          </p>
        </div>

        {/* Input + button */}
        <div className="flex w-full flex-col gap-3">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="h-12 rounded-xl border-white/10 bg-white/5 text-center tracking-widest text-white placeholder:text-white/30 focus:border-yellow-500/50 focus:ring-yellow-500/20"
          />

          {error && (
            <p className="text-center text-xs tracking-wide text-red-400">
              {error}
            </p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !username.trim()}
            className="h-12 w-full cursor-pointer rounded-xl text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase transition-all duration-200 disabled:opacity-40"
            style={{
              background:
                "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
            }}
          >
            {loading ? "Entering..." : "Enter the Game"}
          </Button>
        </div>
      </div>

      {/* Toast notification */}
      {/* ΤODO - How can toast be persistent after redirecting to other page*/}
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
