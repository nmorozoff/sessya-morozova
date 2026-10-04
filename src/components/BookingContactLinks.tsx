import { BOOKING_CHANNELS } from "@/lib/bookingChannels";

export { BOOKING_CHANNELS };

type BookingContactLinksProps = {
  className?: string;
  linkClassName?: string;
};

/** Список каналов записи для юридических страниц и текста согласий. */
export function BookingContactLinks({ className, linkClassName = "text-foreground underline" }: BookingContactLinksProps) {
  return (
    <span className={className}>
      {BOOKING_CHANNELS.map((channel, index) => (
        <span key={channel.href}>
          {index > 0 ? (index === BOOKING_CHANNELS.length - 1 ? " и " : ", ") : ""}
          <a href={channel.href} className={linkClassName} target="_blank" rel="noopener noreferrer">
            {channel.name}
          </a>
        </span>
      ))}
    </span>
  );
}
