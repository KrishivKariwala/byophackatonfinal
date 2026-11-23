// Tiny dependency-free SVG charts (the repo has no chart library). Colours come from the brand tokens.
export function BarChart({ data, label, format = (n: number) => String(n), height = 140 }: { data: { key: string; value: number }[]; label: string; format?: (n: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / Math.max(1, data.length);
  return (
    <figure className="flex flex-col gap-1">
      <svg role="img" aria-label={label} viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 4 - 2);
          return <rect key={d.key} x={i * w + w * 0.12} y={height / 4 - h} width={w * 0.76} height={h} rx="0.6" className="fill-tomato"><title>{`${d.key}: ${format(d.value)}`}</title></rect>;
        })}
      </svg>
      <figcaption className="flex justify-between text-[10px] text-muted"><span>{data[0]?.key}</span><span>{data[data.length - 1]?.key}</span></figcaption>
      <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.key}><th>{d.key}</th><td>{format(d.value)}</td></tr>)}</tbody></table>
    </figure>
  );
}
