import { useState } from "react";
import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import { trackFaqOpen } from "@/lib/reelsLandingAnalytics";

type Item = { q: string; a: string };

type Props = {
  items: Item[];
  offer: ReelsOfferId;
  topic: ReelsTopicId;
};

const ReelsFaqAccordion = ({ items, offer, topic }: Props) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q} className="bg-bg3">
            <button
              type="button"
              className="w-full text-left px-5 py-4 flex justify-between gap-4 items-start min-h-12"
              aria-expanded={open}
              onClick={() => {
                setOpenIndex(open ? null : index);
                if (!open) trackFaqOpen({ offer, topic });
              }}
            >
              <span className="font-semibold text-[15px] leading-snug">{item.q}</span>
              <span className="text-muted-foreground shrink-0" aria-hidden>{open ? "−" : "+"}</span>
            </button>
            {open ? (
              <div className="px-5 pb-4 text-[15px] text-muted-foreground leading-relaxed">{item.a}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default ReelsFaqAccordion;
