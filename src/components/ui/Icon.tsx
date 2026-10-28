type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function Icon({ name, className = "", filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`ms ${filled ? "fill" : ""} ${className}`}
    >
      {name}
    </span>
  );
}
