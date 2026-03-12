import { GlowOrb } from "@/components/GlowOrb";
import { StarField } from "@/components/StarField";
import { NavBar } from "@/app/components/NavBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0a0f]">
      <NavBar />
      <GlowOrb top="25%" left="25%" />
      <GlowOrb bottom="25%" right="25%" className="h-80 w-80 bg-indigo-900/20" />
      <StarField />
      {children}
    </div>
  );
}
