export default function LobbyHeader() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-5xl">🧙</span>
      <h1
        className="bg-clip-text text-3xl font-bold tracking-widest text-transparent uppercase"
        style={{
          backgroundImage:
            "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
        }}
      >
        Game Lobby
      </h1>
    </div>
  );
}
