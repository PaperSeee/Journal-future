export function WinLossBar({
  wins,
  losses,
  breakevens,
}: {
  wins: number;
  losses: number;
  breakevens: number;
}) {
  const total = wins + losses + breakevens;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-soft">
        {wins > 0 && (
          <div className="bg-win transition-all" style={{ width: `${pct(wins)}%` }} title={`${wins} wins`} />
        )}
        {breakevens > 0 && (
          <div className="bg-be transition-all" style={{ width: `${pct(breakevens)}%` }} title={`${breakevens} BE`} />
        )}
        {losses > 0 && (
          <div className="bg-loss transition-all" style={{ width: `${pct(losses)}%` }} title={`${losses} losses`} />
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Legend dot="bg-win" label="Wins" value={wins} color="text-win" />
        <Legend dot="bg-be" label="BE" value={breakevens} color="text-ink-soft" />
        <Legend dot="bg-loss" label="Losses" value={losses} color="text-loss" />
      </div>
    </div>
  );
}

function Legend({
  dot,
  label,
  value,
  color,
}: {
  dot: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-xs text-ink-dim">{label}</span>
      </div>
      <span className={`font-mono text-lg font-semibold tabular ${color}`}>{value}</span>
    </div>
  );
}
