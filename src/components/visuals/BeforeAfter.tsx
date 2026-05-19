/**
 * BeforeAfter — side-by-side visual contrast block.
 * Used on landing pages instead of long "before vs after" paragraphs.
 */
type Item = { label: string };

export default function BeforeAfter({
  beforeTitle,
  before,
  afterTitle,
  after,
}: {
  beforeTitle: string;
  before: Item[];
  afterTitle: string;
  after: Item[];
}) {
  return (
    <div className="before-after">
      <div className="before-after__col before-after__col--before">
        <span className="before-after__tag">{beforeTitle}</span>
        <ul className="before-after__list">
          {before.map((b, i) => (
            <li key={i}>
              <span className="before-after__icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </span>
              {b.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="before-after__arrow" aria-hidden>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 16h20m0 0-7-7m7 7-7 7" />
        </svg>
      </div>
      <div className="before-after__col before-after__col--after">
        <span className="before-after__tag before-after__tag--after">{afterTitle}</span>
        <ul className="before-after__list">
          {after.map((a, i) => (
            <li key={i}>
              <span className="before-after__icon before-after__icon--good">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </span>
              {a.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
