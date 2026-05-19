/**
 * IntegrationCloud — visual pill cloud of systems we integrate with.
 * Replaces long comma-separated sentences.
 */
const DEFAULT_ITEMS = [
  "Tripletex",
  "Visma",
  "Microsoft 365",
  "Google Workspace",
  "Slack",
  "Teams",
  "HubSpot",
  "Salesforce",
  "Shopify",
  "WooCommerce",
  "Airtable",
  "Notion",
  "Monday.com",
  "Stripe",
  "Mailchimp",
  "Webhook",
];

export default function IntegrationCloud({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  return (
    <div className="int-cloud">
      {items.map((name) => (
        <span key={name} className="int-cloud__pill">
          <span className="int-cloud__dot" aria-hidden />
          {name}
        </span>
      ))}
    </div>
  );
}
