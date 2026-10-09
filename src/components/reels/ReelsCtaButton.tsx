import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import { trackCtaClick } from "@/lib/reelsLandingAnalytics";

type Props = {
  offer: ReelsOfferId;
  topic: ReelsTopicId;
  label: string;
  formId: string;
  className?: string;
};

const ReelsCtaButton = ({ offer, topic, label, formId, className = "" }: Props) => {
  const scrollToForm = () => {
    trackCtaClick({ offer, topic });
    const el = document.getElementById(formId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToForm}
      className={`min-h-12 w-full sm:w-auto bg-primary text-primary-foreground px-8 py-3.5 rounded-[10px] text-[15px] font-bold hover:bg-accent transition-all ${className}`}
    >
      {label}
    </button>
  );
};

export default ReelsCtaButton;
