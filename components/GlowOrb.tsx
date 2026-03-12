interface Props {
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  className?: string;
}

export function GlowOrb({ top, left, bottom, right, className }: Props) {
  return (
    <div
      className={`pointer-events-none absolute h-96 w-96 rounded-full bg-purple-900/20 blur-3xl ${className ?? ""}`}
      style={{ top, left, bottom, right }}
    />
  );
}
