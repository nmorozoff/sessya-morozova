import { getActiveProfilePlatforms } from "@/lib/profiles";
import { trackProfileClick } from "@/lib/profileAnalytics";

const iconButtonBase =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background/80 p-1.5 hover:border-primary/35 hover:bg-primary/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 w-10 h-10";

type ProfilePlatformIconsProps = {
  className?: string;
};

/** Кликабельные профили на площадках (футер). */
export function ProfilePlatformIcons({ className }: ProfilePlatformIconsProps) {
  const platforms = getActiveProfilePlatforms();

  return (
    <div className={className}>
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block mb-2">
        Профили на площадках
      </span>
      <div className="flex flex-wrap gap-1.5 max-w-full justify-center md:justify-start">
        {platforms.map((platform) => (
          <a
            key={platform.id}
            href={platform.url}
            target="_blank"
            rel="noopener"
            className={iconButtonBase}
            aria-label={`Профиль на ${platform.name}`}
            title={platform.name}
            onClick={() => trackProfileClick(platform.id)}
          >
            <img
              src={platform.logoSrc}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
              loading="lazy"
              decoding="async"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
