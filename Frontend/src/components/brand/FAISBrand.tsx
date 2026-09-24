import FAISMark from "./FAISMark";

type FAISBrandProps = {
  compact?: boolean;
  inverted?: boolean;
  size?: "default" | "large";
  showTitle?: boolean;
};

export default function FAISBrand({
  compact = false,
  inverted = false,
  size = "default",
  showTitle = true,
}: FAISBrandProps) {
  const isLarge = size === "large" && !compact;
  const markSize = compact ? "h-10 w-24" : isLarge ? "h-24 w-64" : "h-16 w-44";
  const gapSize = isLarge ? "gap-5" : "gap-3";
  const titleSize = compact ? "text-sm" : isLarge ? "text-xl" : "text-base";
  const subtitleSize = isLarge ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-center ${gapSize}`}>
      <div className={`flex shrink-0 items-center justify-center ${markSize}`}>
        <FAISMark className="h-full w-full object-contain" />
      </div>
      {showTitle ? (
        <div className="min-w-0">
          <p className={`font-extrabold leading-tight ${inverted ? "text-white" : "text-brand-600"} ${titleSize}`}>
            Fire Alarm
            <br />
            Integration System
          </p>
          <p className={`font-medium ${inverted ? "text-white/75" : "text-slate-500"} ${subtitleSize}`}>
            RSCM
          </p>
        </div>
      ) : null}
    </div>
  );
}
