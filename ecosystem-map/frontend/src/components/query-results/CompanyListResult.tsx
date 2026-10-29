import { Building2 } from 'lucide-react';
import { RankBadge } from '../RankBadge';
import { CompanyLogo } from '../CompanyLogo';
import { Row } from '../DataTableRow';
import { MetricCard, MetricGrid } from '../MetricCard';
import { formatNumber, isInactiveStatus } from '../../lib/format';
import { CaveatsBanner } from './QueryResultShared';
import type { CompanyListResult as CompanyListResultData, QueryCompany } from '../../types/query';

function CompanyRow({ company }: { company: QueryCompany }) {
  const inactive = isInactiveStatus(company.status);
  const cells = (
    <>
      <td><div className="data-table-name">
        <RankBadge rank={company.rank} />
        <CompanyLogo name={company.name} size={24} />
        <span style={inactive ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>
          {company.name}
        </span>
      </div></td>
      <td>
        <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {company.vertical && <span className="chip chip-neutral">{company.vertical}</span>}
          {company.status && (
            <span className={`chip ${inactive ? 'chip-cross-ecosystem' : 'chip-upstream'}`}>{company.status}</span>
          )}
        </span>
      </td>
      <td className="muted" style={{ fontSize: 'var(--text-sm)' }}>{company.note || ''}</td>
      <td className="data-table-num-cell">
        <span style={{ fontWeight: 700, color: company.fundingRaised ? 'var(--ink)' : 'var(--muted)' }}>
          {company.fundingRaised || '—'}
        </span>
      </td>
    </>
  );

  return company.id ? (
    <Row to={`/company/${company.id}`}>{cells}</Row>
  ) : (
    <tr>{cells}</tr>
  );
}

// Renders a "company_list" answer. parseQueryResult() has already checked
// its shape (types/query.ts), so this stays a pure renderer with no
// defensive fallbacks.
export function CompanyListResult({ result }: { result: CompanyListResultData }) {
  const { summary, totalCount, groups, caveats } = result;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <p style={{ marginBottom: 12 }}>{summary}</p>
        <MetricGrid>
          <MetricCard label="Companies found" value={formatNumber(totalCount)} icon={Building2} accent="plum" />
        </MetricGrid>
      </div>

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="section-title">{group.label}</h2>
          {group.companies.length === 0 ? (
            <p className="muted">No companies in this group.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <tbody>
                  {group.companies.map((company) => (
                    <CompanyRow key={company.id || company.name} company={company} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <CaveatsBanner caveats={caveats} />
    </div>
  );
}
