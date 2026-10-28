const bars = [
  [0, 3], [5, 2], [9, 4], [15, 2], [19, 5], [26, 2], [30, 4], [36, 3], [42, 2], [46, 6],
  [54, 3], [59, 2], [63, 5], [70, 2], [74, 4], [80, 2], [84, 5], [91, 3], [96, 4],
];

export function Barcode({ code }: { code?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 pt-space-sm opacity-40 lg:opacity-80">
      <svg className="h-6 w-36 text-on-surface lg:h-8 lg:w-44" preserveAspectRatio="none" viewBox="0 0 100 20" aria-hidden="true">
        {bars.map(([x, width]) => (
          <rect key={x} x={x} y={0} width={width} height={20} fill="currentColor" />
        ))}
      </svg>
      {code && (
        <span className="hidden font-mono text-label-caps tracking-widest text-outline lg:block">{code}</span>
      )}
    </div>
  );
}
