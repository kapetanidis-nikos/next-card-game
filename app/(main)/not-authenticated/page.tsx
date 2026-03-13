import Link from "next/link";

export default function NotAuthenticatedPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-lg font-semibold tracking-widest text-white/70 uppercase">
        You must be logged in
      </p>
      <Link
        href="/login"
        className="text-sm tracking-widest text-yellow-500/70 underline"
      >
        Go to Login
      </Link>
    </div>
  );
}
