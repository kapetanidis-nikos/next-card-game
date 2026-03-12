"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BoardgameCardProps {
  title: string;
  description: string;
  players: string;
  duration: string;
  emoji: string;
  underConstruction?: boolean;
  onEnterLobby?: () => void;
}

export function BoardgameCard({
  title,
  description,
  players,
  duration,
  emoji,
  underConstruction = false,
  onEnterLobby,
}: BoardgameCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border bg-card hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/30">
      <CardHeader className="pb-2">
        <div className="text-3xl">{emoji}</div>
        <CardTitle className="text-accent text-sm font-bold tracking-widest uppercase">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-white/40">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>👥 {players}</span>
          <span>⏱ {duration}</span>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-auto cursor-pointer font-semibold tracking-widest transition-colors duration-150 uppercase"
            style={{ color: expanded ? "#f0d080" : "#c9a84c" }}
          >
            {expanded ? "▲ Less" : "▼ More"}
          </button>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {underConstruction ? (
            <div className="flex flex-col gap-2">
              <span className="self-start rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-yellow-400 uppercase">
                Under Construction
              </span>
              <Button
                disabled
                className="h-9 w-full cursor-not-allowed rounded-xl text-xs font-semibold tracking-widest uppercase opacity-40"
                style={{
                  background:
                    "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
                  color: "#0a0a0f",
                }}
              >
                Enter Lobby
              </Button>
            </div>
          ) : (
            <Button
              onClick={onEnterLobby}
              className="h-9 w-full cursor-pointer rounded-xl text-xs font-semibold tracking-widest text-[#0a0a0f] uppercase transition-all duration-200"
              style={{
                background:
                  "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
              }}
            >
              Enter Lobby
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
