export default function StatCard({ label, value, sublabel, accent, icon: Icon }) {
  return (
    <div className="metric-float" style={{ '--metric-accent': accent }}>
      <div className="metric-float-topline" />
      <div className="metric-float-head">
        <div className="metric-float-label">{label}</div>
        {Icon && (
          <div className="metric-float-icon">
            <Icon size={16} color={accent} />
          </div>
        )}
      </div>
      <div className="metric-float-value">{value}</div>
      {sublabel && <div className="metric-float-sub">{sublabel}</div>}
    </div>
  );
}