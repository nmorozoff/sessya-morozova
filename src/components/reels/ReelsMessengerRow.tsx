import { BOOKING_CHANNELS } from "@/lib/bookingChannels";
import { REELS_MESSENGER_INTRO } from "@/data/reelsLandingTopics";
import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import { trackMessengerClick } from "@/lib/reelsLandingAnalytics";

const MESSENGER_LABELS: Record<string, string> = {
  whatsapp: "Написать в WhatsApp",
  telegram: "Написать в Telegram",
  max: "Написать в MAX",
};

type Props = {
  offer: ReelsOfferId;
  topic: ReelsTopicId;
};

const ReelsMessengerRow = ({ offer, topic }: Props) => {
  return (
    <div className="flex flex-col gap-2.5 pt-2">
      <p className="text-[12px] text-center text-muted-foreground">{REELS_MESSENGER_INTRO}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {BOOKING_CHANNELS.map((channel) => (
          <a
            key={channel.id}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackMessengerClick({ offer, topic, channel: channel.id })}
            className="min-h-10 inline-flex items-center justify-center px-3.5 py-2 rounded-[10px] border border-border bg-background text-[12px] font-medium hover:border-primary/40 transition-colors"
          >
            {MESSENGER_LABELS[channel.id] ?? channel.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ReelsMessengerRow;
