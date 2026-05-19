/**
 * Timeline — vertical step timeline used on landing pages.
 * Replaces ordered lists with a stronger visual sequence.
 */
import type { ReactNode } from "react";

export type Step = {
  icon?: ReactNode;
  title: string;
  body: string;
  meta?: string;
};

export default function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="timeline">
      {steps.map((s, i) => (
        <li key={i} className="timeline__item">
          <div className="timeline__marker">
            {s.icon ? <span className="timeline__icon">{s.icon}</span> : <span className="timeline__num">{String(i + 1).padStart(2, "0")}</span>}
          </div>
          <div className="timeline__content">
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            {s.meta && <span className="timeline__meta">{s.meta}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
