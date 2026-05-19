/**
 * HighlightGrid — reusable icon-led grid for landing pages.
 * Replaces bullet-heavy <ul> blocks with scannable visual cards.
 */
import type { ReactNode } from "react";

export type Highlight = {
  icon: ReactNode;
  title: string;
  body: string;
};

export default function HighlightGrid({
  items,
  columns = 3,
}: {
  items: Highlight[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div className={`highlight-grid highlight-grid--${columns}`}>
      {items.map((h, i) => (
        <div key={i} className="highlight">
          <div className="highlight__icon">{h.icon}</div>
          <h3 className="highlight__title">{h.title}</h3>
          <p className="highlight__body">{h.body}</p>
        </div>
      ))}
    </div>
  );
}
