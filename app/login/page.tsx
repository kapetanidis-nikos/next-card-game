"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { GlowOrb } from "@/components/GlowOrb";
import { StarField } from "@/components/StarField";
import { NavBar } from "@/app/components/NavBar";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f]">
      <NavBar />

      <GlowOrb top="25%" left="25%" />
      <GlowOrb
        bottom="25%"
        right="25%"
        className="h-80 w-80 bg-indigo-900/20"
      />

      <StarField />

      <Card className="relative z-10 w-full max-w-sm border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
        <CardHeader className="items-center text-center">
          <span className="text-5xl">🧙</span>
          <CardTitle
            className="bg-clip-text text-3xl font-bold tracking-widest text-transparent uppercase"
            style={{
              backgroundImage:
                "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
            }}
          >
            NEXT CARD GAME
          </CardTitle>
          <CardDescription className="tracking-widest text-white/40 uppercase">
            Enter your name, traveller
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
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
        </CardContent>

        <CardFooter>
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
        </CardFooter>
      </Card>
    </div>
  );
}
