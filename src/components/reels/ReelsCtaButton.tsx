import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import { REELS_FORM_ANCHOR_ID } from "@/data/reelsLandingTopics";
import { trackCtaClick } from "@/lib/reelsLandingAnalytics";

type Props = {
  offer: ReelsOfferId;
  topic: ReelsTopicId;
  label: string;
  block: number;
  className?: string;
};

const ReelsCtaButton = ({ offer, topic, label, block, className = "" }: Props) => {
  const scrollToForm = () => {
    trackCtaClick({ offer, topic, block });
    document.getElementById(REELS_FORM_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToForm}
      className={`min-h-12 w-full bg-primary text-primary-foreground px-8 py-3.5 rounded-[10px] text-[16px] font-bold hover:bg-accent transition-all ${className}`}
    >
      {label}
    </button>
  );
};

export default ReelsCtaButton;
