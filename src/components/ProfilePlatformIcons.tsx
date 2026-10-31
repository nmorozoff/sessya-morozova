import { getActiveProfilePlatforms, type ProfileIconId } from "@/lib/profiles";
import { trackProfileClick } from "@/lib/profileAnalytics";

const iconButtonBase =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/[0.04] text-muted-foreground hover:text-foreground hover:border-primary/35 hover:bg-primary/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 w-10 h-10";

function ProfileIcon({ id }: { id: ProfileIconId }) {
  const cls = "w-[18px] h-[18px]";
  switch (id) {
    case "b17":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
            B17
          </text>
        </svg>
      );
    case "dzen":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M4 6h16v3H4V6zm0 4.5h10v3H4v-3zm0 4.5h14v3H4v-3z" />
        </svg>
      );
    case "yandex-maps":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      );
    case "google-maps":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 4h2v5h-2V6zm0 6h2v2h-2v-2z" />
        </svg>
      );
    case "profi":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M12 3l7 4v10l-7 4-7-4V7l7-4zm0 2.2L7 8.5v7L12 18.8l5-3.3v-7L12 5.2z" />
        </svg>
      );
    case "yandex-uslugi":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M6 4h12v2H6V4zm0 4h12v2H6V8zm0 4h8v2H6v-2zm0 4h10v2H6v-2z" />
        </svg>
      );
    case "vc":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">
            VC
          </text>
        </svg>
      );
    case "tenchat":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M4 5h16v10H8l-4 4V5zm2 2v8.17L9.83 15H18V7H6z" />
        </svg>
      );
    case "2gis":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif">
            2GIS
          </text>
        </svg>
      );
    case "telegram-channel":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case "max-channel":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M6 6h12v12H6V6zm2 2v8h8V8H8zm2 2h4v4h-4v-4z" />
        </svg>
      );
    default:
      return null;
  }
}

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
            <ProfileIcon id={platform.icon} />
          </a>
        ))}
      </div>
    </div>
  );
}
