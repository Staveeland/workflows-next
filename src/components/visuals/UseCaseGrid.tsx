/**
 * UseCaseGrid — visual grid for use case lists.
 * Each card has an icon + short title + 1 sentence.
 */
import type { ReactNode } from "react";

export type UseCase = {
  icon: ReactNode;
  title: string;
  body: string;
};

export default function UseCaseGrid({ items }: { items: UseCase[] }) {
  return (
    <div className="usecase-grid">
      {items.map((u, i) => (
        <div key={i} className="usecase">
          <div className="usecase__icon">{u.icon}</div>
          <div className="usecase__content">
            <h3>{u.title}</h3>
            <p>{u.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
