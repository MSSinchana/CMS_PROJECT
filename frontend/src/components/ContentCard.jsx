export default function ContentCard({ title, value, description }) {
  return (
    <div className="glass-panel p-5">
      <p className="panel-heading">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}