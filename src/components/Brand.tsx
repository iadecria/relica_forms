interface BrandProps {
  compact?: boolean;
}

export default function Brand({ compact = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/relica-logo-full.svg"
        alt="Relica"
        className={`${compact ? "h-8" : "h-10"} w-auto dark:invert`}
      />
    </div>
  );
}