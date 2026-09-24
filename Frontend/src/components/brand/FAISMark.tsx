import Image from "next/image";

type FAISMarkProps = {
  className?: string;
  variant?: "auto" | "dark" | "light";
};

export default function FAISMark({ className = "" }: FAISMarkProps) {
  return (
    <div
      aria-label="RSCM Fire Alarm Integration System"
      className={`flex flex-col items-center justify-center leading-none ${className}`}
      role="img"
    >
      <Image
        alt=""
        className="h-full w-full object-contain"
        height={160}
        priority
        src="/images/logo/rscm-fais-login-logo.png"
        width={416}
      />
    </div>
  );
}
