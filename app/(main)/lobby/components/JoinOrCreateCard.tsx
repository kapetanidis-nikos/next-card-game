import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface JoinOrCreateCardProps {
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  onJoin: () => void;
  onCreate: () => void;
  loading: boolean;
  error: string;
}

export default function JoinOrCreateCard({
  joinCode,
  onJoinCodeChange,
  onJoin,
  onCreate,
  loading,
  error,
}: JoinOrCreateCardProps) {
  return (
    <Card className="w-full max-w-sm border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <CardContent className="flex flex-col gap-6 pt-6">
        <Button
          onClick={onCreate}
          disabled={loading}
          className="h-12 w-full cursor-pointer rounded-xl text-sm font-semibold tracking-widest text-[#0a0a0f] uppercase"
          style={{
            background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
          }}
        >
          {loading ? "Creating..." : "Create Game"}
        </Button>

        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs tracking-widest text-white/30 uppercase">
            or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Enter room code"
            value={joinCode}
            onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onJoin()}
            className="h-12 rounded-xl border-white/10 bg-white/5 text-center tracking-widest text-white uppercase placeholder:text-white/30"
          />
          <Button
            onClick={onJoin}
            disabled={loading || !joinCode.trim()}
            className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 text-sm font-semibold tracking-widest text-white/70 uppercase hover:bg-white/10"
          >
            {loading ? "Joining..." : "Join Game"}
          </Button>
        </div>

        {error && (
          <p className="text-center text-xs tracking-wide text-red-400">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
