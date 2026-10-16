import { Search, SlidersHorizontal } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export default function FiltersBar({
  query, onQuery, busFilter, onBusFilter, buses, orgFilter, onOrgFilter, organizations,
}) {
  const { t } = useLocale();
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--white)', border: '1px solid var(--slate-200)',
          borderRadius: 5, padding: '8px 12px', minWidth: 260, flex: '1 1 260px',
        }}
      >
        <Search size={14} color="var(--slate-500)" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t('submissions.search_placeholder')}
          style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent' }}
        />
      </div>

      <FilterSelect
        value={busFilter}
        onChange={onBusFilter}
        options={[
          { value: 'all', label: t('submissions.filter.all_buses') },
          ...buses.map((bus) => ({ value: bus, label: t('submissions.filter.bus', { bus }) })),
        ]}
      />

      <FilterSelect
        value={orgFilter}
        onChange={onOrgFilter}
        options={[
          { value: 'all', label: t('submissions.filter.all_orgs') },
          ...organizations.map((o) => ({ value: o, label: o })),
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-500)', fontSize: 12.5, marginLeft: 'auto' }}>
        <SlidersHorizontal size={13} />
        {t('submissions.filter_note')}
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: '1px solid var(--slate-200)', borderRadius: 5, padding: '8px 10px',
        fontSize: 13, background: 'var(--white)', color: 'var(--slate-700)',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}