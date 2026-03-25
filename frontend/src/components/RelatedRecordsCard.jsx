import { useState } from 'react';
import { Link } from 'react-router';
import PaginationButton from './PaginationButton.jsx';
const truncate = (str, n) => str && str.length > n ? `${str.slice(0, n)}…` : (str ?? "—");

const TYPE_LABEL = { PRIMARY: "Primary", SECONDARY: "Secondary", OTHER: "Other" };

const PAGE_SIZE = 10;

const PaginatedList = ({ items, page, onPageChange, renderItem }) => {
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const slice = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <>
      <ul className="flex flex-col gap-1">{slice.map(renderItem)}</ul>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <PaginationButton
            totalPages={totalPages}
            currentPage={page}
            onPageChange={onPageChange}
            size="sm"
          />
        </div>
      )}
    </>
  );
};

/**
 * Displays a collapsible "Related Records" card linking to entities associated
 * with the current record.
 *
 * Supports three usage patterns:
 *
 * 1. Single-item mode (InboxItemDetail) — pass `opportunity` and/or `award`
 *    as plain objects with { id, title/description }. Used when an inbox item
 *    is directly linked to one opportunity or one award.
 *
 * 2. Multi-item list mode (ContactDetail) — pass `opportunityLinks`,
 *    `industryDayLinks`, and/or `buyingOrgLinks` as arrays of
 *    { id, to, label } objects. Used when a Contact is linked to multiple
 *    entities via the ContactLink join table. ContactLink can produce
 *    duplicate rows for the same entity (one per contact role — PRIMARY,
 *    SECONDARY, etc.), so callers must deduplicate by entity id before
 *    passing in.
 *
 * 3. Contact button mode (OpportunityDetail) — pass `contactLinks` as an
 *    array of { id, to, type } objects where `type` is a ContactType enum
 *    value (PRIMARY, SECONDARY, OTHER). Renders one button per contact link
 *    labeled by role rather than name, linking to the contact detail page.
 */
const RelatedRecordsCard = ({
  // Single-item mode
  opportunity,
  award,
  // Multi-item list mode
  // opportunityLinks: { id, to, label, meta? }   — meta shown as secondary text (e.g. a date)
  opportunityLinks = [],
  industryDayLinks = [],
  // buyingOrgLinks: { id, to, label, badge? }     — badge shown as a small chip (e.g. org level)
  buyingOrgLinks = [],
  // Award list mode: { id, to, description, obligatedAmount?, startDate? }
  awardLinks = [],
  // Contact button mode
  contactLinks = [],
}) => {
  const [pages, setPages] = useState({ opportunities: 1, industryDays: 1, buyingOrgs: 1, awards: 1 });

  const setPage = (section, page) => setPages((prev) => ({ ...prev, [section]: page }));

  const hasSingleItems = opportunity || award;
  const hasListItems = opportunityLinks.length > 0 || industryDayLinks.length > 0 || buyingOrgLinks.length > 0 || awardLinks.length > 0;
  const hasContactButtons = contactLinks.length > 0;

  if (!hasSingleItems && !hasListItems && !hasContactButtons) return null;

  return (
    <div className="card bg-base-100 text-accent-content shadow-sm mt-4">
      <div className="card-body flex flex-col gap-4">
        <h2 className="card-title text-base">Related Records</h2>

        {/* Single-item mode: one opportunity */}
        {opportunity && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Opportunity</span>
            <span className="text-sm">{truncate(opportunity.title, 80)}</span>
            <Link to={`/opportunities/${opportunity.id}`} className="btn btn-sm btn-outline btn-primary w-fit mt-1">View</Link>
          </div>
        )}

        {/* Single-item mode: one award */}
        {award && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Award</span>
            <span className="text-sm">{truncate(award.description, 80)}</span>
            <Link to={`/awards/${award.id}`} className="btn btn-sm btn-outline btn-primary w-fit mt-1">View</Link>
          </div>
        )}

        {/* Multi-item list mode: opportunities */}
        {opportunityLinks.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Opportunities ({opportunityLinks.length})
            </span>
            <PaginatedList
              items={opportunityLinks}
              page={pages.opportunities}
              onPageChange={(p) => setPage("opportunities", p)}
              renderItem={(link) => (
                <li key={link.id}>
                  <Link to={link.to} className="link link-primary-content text-sm">
                    {link.label}
                  </Link>
                  {link.meta && <span className="block text-xs text-base-content/50">{link.meta}</span>}
                </li>
              )}
            />
          </div>
        )}

        {/* Multi-item list mode: industry days */}
        {industryDayLinks.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Industry Days ({industryDayLinks.length})
            </span>
            <PaginatedList
              items={industryDayLinks}
              page={pages.industryDays}
              onPageChange={(p) => setPage("industryDays", p)}
              renderItem={(link) => (
                <li key={link.id}>
                  <Link to={link.to} className="link link-primary-content text-sm">
                    {link.label}
                  </Link>
                </li>
              )}
            />
          </div>
        )}

        {/* Multi-item list mode: buying organizations */}
        {buyingOrgLinks.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Buying Organizations ({buyingOrgLinks.length})
            </span>
            <PaginatedList
              items={buyingOrgLinks}
              page={pages.buyingOrgs}
              onPageChange={(p) => setPage("buyingOrgs", p)}
              renderItem={(link) => (
                <li key={link.id} className="flex items-center gap-2">
                  <Link to={link.to} className="link link-primary-content text-sm">
                    {link.label}
                  </Link>
                  {link.badge && <span className="badge badge-xs badge-outline">{link.badge}</span>}
                </li>
              )}
            />
          </div>
        )}

        {/* Award list mode: rich award items with amount and date */}
        {awardLinks.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Awards ({awardLinks.length})
            </span>
            <PaginatedList
              items={awardLinks}
              page={pages.awards}
              onPageChange={(p) => setPage("awards", p)}
              renderItem={(link) => (
                <li key={link.id} className="flex flex-col gap-1 border-b border-base-300 pb-2 last:border-0">
                  <span className="text-sm">{truncate(link.description, 60)}</span>
                  <div className="flex gap-4 text-xs text-base-content/50">
                    {link.obligatedAmount != null && (
                      <span>${Number(link.obligatedAmount).toLocaleString()}</span>
                    )}
                    {link.startDate && (
                      <span>{new Date(link.startDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  <Link to={link.to} className="btn btn-xs btn-outline btn-primary w-fit mt-1">View Award</Link>
                </li>
              )}
            />
          </div>
        )}

        {/* Contact button mode: role-labeled buttons */}
        {contactLinks.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Contacts</span>
            <div className="flex flex-wrap gap-2">
              {contactLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.to}
                  className={`btn btn-sm ${
                    link.type === "PRIMARY" ? "btn-primary" :
                    link.type === "SECONDARY" ? "btn-secondary" :
                    "btn-outline"
                  }`}
                >
                  {TYPE_LABEL[link.type] ?? link.type}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RelatedRecordsCard;

