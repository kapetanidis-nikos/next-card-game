"use client";

interface NavBarProps {
  username?: string;
}

export function NavBar({ username }: NavBarProps) {
  return (
    <aside className="border-border bg-card fixed top-0 right-0 left-0 z-20 flex flex-row items-center border-b px-6 py-6 backdrop-blur-md">
      <span className="text-accent text-lg font-bold tracking-widest uppercase">
        Next Card Game
      </span>
      <span className="text-yellow-500/70">{username}</span>
    </aside>
  );
}
