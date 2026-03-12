import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface Player {
  userId: string;
  username: string;
}

interface GameRoomCardProps {
  code: string;
  players: Player[];
  hostId: string;
  isHost: boolean;
  loading: boolean;
  error: string;
  onStart: () => void;
  onLeave: () => void;
}

export default function GameRoomCard({
  code,
  players,
  hostId,
  isHost,
  loading,
  error,
  onStart,
  onLeave,
}: GameRoomCardProps) {
  return (
    <Card className="w-full max-w-sm border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <CardHeader className="items-center text-center">
        <p className="text-xs tracking-widest text-white/30 uppercase">
          Room Code
        </p>
        <CardTitle
          className="bg-clip-text text-4xl font-bold tracking-widest text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
          }}
        >
          {code}
        </CardTitle>
        <p className="text-xs tracking-wide text-white/20">
          Share this code with your friends
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs tracking-widest text-white/40 uppercase">
              Players — {players.length} / 6
            </p>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {players.map((player) => (
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
                {player.userId === hostId && (
                  <span className="ml-auto text-xs tracking-widest text-yellow-500/70 uppercase">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-center text-xs tracking-wide text-red-400">
            {error}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {isHost ? (
          <Button
            onClick={onStart}
            disabled={players.length < 3 || loading}
            className="h-12 w-full cursor-pointer rounded-xl text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase disabled:opacity-40"
            style={{
              background:
                "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
            }}
          >
            {players.length < 3
              ? `Need ${3 - players.length} more player${3 - players.length > 1 ? "s" : ""}`
              : loading
                ? "Starting..."
                : "Start Game"}
          </Button>
        ) : (
          <p className="text-xs tracking-widest text-white/30 uppercase">
            Waiting for host to start the game...
          </p>
        )}

        <Button
          onClick={onLeave}
          disabled={loading}
          className="h-12 w-full cursor-pointer rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-semibold tracking-widest text-red-400 uppercase hover:bg-red-500/10"
        >
          Leave Game
        </Button>
      </CardFooter>
    </Card>
  );
}
