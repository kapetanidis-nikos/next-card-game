"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavBar() {
  const [username, setUsername] = useState<string | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUsername(JSON.parse(saved).username);
    else setUsername(undefined);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUsername(undefined);
    router.push("/login");
  };

  return (
    <aside className="border-border bg-card fixed top-0 right-0 left-0 z-20 flex flex-row items-center border-b px-6 py-4 backdrop-blur-md">
      <Link href="/" className="text-accent hover:bg-accent hover:text-accent-foreground rounded-lg px-2 py-1 text-lg font-bold tracking-widest uppercase transition-colors">
        Next Card Game
      </Link>
      <div className="ml-auto">
        {username ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex min-w-25 cursor-pointer items-center justify-between gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold tracking-widest text-yellow-500/70 uppercase transition-colors hover:bg-yellow-500/10 hover:text-yellow-400 focus:outline-none">
                {username}
                <span className="text-[10px]">▼</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-25 border-[#c9a84c]/20 bg-[#0f0e0a] text-white"
            >
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-xs tracking-widest text-red-400 uppercase focus:bg-red-500/10 focus:text-red-300"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => router.push("/login")}
            className="h-8 cursor-pointer rounded-lg px-5 text-xs font-semibold tracking-widest text-[#0a0a0f] uppercase"
            style={{
              background: "linear-gradient(to right, #c9a84c, #f0d080, #c9a84c)",
            }}
          >
            Login
          </Button>
        )}
      </div>
    </aside>
  );
}
