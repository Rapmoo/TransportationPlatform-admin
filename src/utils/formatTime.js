// The backend stores timestamps as naive UTC (no "Z"). Treat them as UTC and
// show them in the viewer's local time as 'YYYY-MM-DD HH:MM:SS'.
export function formatUtc(value) {
  if (!value) return '';
  const text = String(value);
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
  const d = new Date(hasZone ? text : `${text}Z`);
  if (Number.isNaN(d.getTime())) return text;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}