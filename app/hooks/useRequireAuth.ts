import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { User } from "@/types";

export function useRequireAuth() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.replace("/not-authenticated");
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  return user;
}
