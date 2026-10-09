import { BOOKING_CHANNELS } from "@/lib/bookingChannels";
import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import { trackMessengerClick } from "@/lib/reelsLandingAnalytics";

type Props = {
  offer: ReelsOfferId;
  topic: ReelsTopicId;
};

const ReelsMessengerRow = ({ offer, topic }: Props) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
      {BOOKING_CHANNELS.map((channel) => (
        <a
          key={channel.id}
          href={channel.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackMessengerClick({ offer, topic, channel: channel.id })}
          className="min-h-12 inline-flex items-center justify-center px-5 py-2.5 rounded-[10px] border border-border bg-background text-[14px] font-semibold hover:border-primary/40 transition-colors"
        >
          {channel.name}
        </a>
      ))}
    </div>
  );
};

export default ReelsMessengerRow;
