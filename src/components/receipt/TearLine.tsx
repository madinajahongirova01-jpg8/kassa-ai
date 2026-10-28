export function TearLine({ label = "хатти буриш" }: { label?: string }) {
  return (
    <div className="flex items-center gap-1.5 pt-space-sm pb-1 lg:my-space-sm lg:pt-space-xs lg:pb-0">
      <div className="flex-1 border-t-2 border-dashed border-outline-variant opacity-60 lg:border-t" />
      <span className="font-label-caps text-[9px] tracking-widest text-outline uppercase opacity-60 lg:text-label-caps lg:tracking-normal lg:normal-case lg:opacity-100">
        {label}
      </span>
      <div className="flex-1 border-t-2 border-dashed border-outline-variant opacity-60 lg:border-t" />
    </div>
  );
}
