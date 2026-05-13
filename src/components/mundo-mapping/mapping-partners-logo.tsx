type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "stacked";
  subtitle?: string;
  onDark?: boolean;
};

function MIcon({ px }: { px: number }) {
  return (
    <svg fill="none" height={px} viewBox="0 0 40 40" width={px} xmlns="http://www.w3.org/2000/svg">
      <rect fill="#B91C1C" height="40" rx="10" width="40" />
      <path
        d="M8 30V11l12 12 12-12v19"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
    </svg>
  );
}

export function MappingPartnersLogo({
  size = "md",
  variant = "horizontal",
  subtitle,
  onDark = false,
}: Props) {
  const iconPx = size === "sm" ? 28 : size === "lg" ? 52 : 36;

  const nameClass =
    size === "sm"
      ? "text-xs font-bold tracking-tight"
      : size === "lg"
        ? "text-lg font-bold tracking-tight"
        : "text-[15px] font-bold tracking-tight";

  const subClass =
    size === "sm"
      ? "text-[9px] font-semibold uppercase tracking-[0.18em]"
      : "text-[10px] font-semibold uppercase tracking-[0.18em]";

  const nameColor = onDark ? "text-white" : "text-[#B91C1C]";
  const subColor = onDark ? "text-red-400" : "text-zinc-400";

  if (variant === "stacked") {
    return (
      <div className="flex flex-col items-center gap-3">
        <MIcon px={iconPx} />
        <div className="text-center">
          <p className={`${nameClass} ${nameColor}`}>Mapping Partners</p>
          {subtitle && <p className={`mt-0.5 ${subClass} ${subColor}`}>{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <MIcon px={iconPx} />
      <div className="leading-tight">
        <p className={`${nameClass} ${nameColor}`}>Mapping Partners</p>
        {subtitle && <p className={`mt-0.5 ${subClass} ${subColor}`}>{subtitle}</p>}
      </div>
    </div>
  );
}
