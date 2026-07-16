interface SpinnerProps {
  label: string;
}

export function Spinner({ label }: SpinnerProps) {
  // <output> carries an implicit "status" role, so screen readers announce it.
  return (
    <output className="spinner">
      <span className="spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </output>
  );
}
