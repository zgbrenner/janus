import type { ComponentPropsWithoutRef } from "react";

type JanusMarkProps = ComponentPropsWithoutRef<"span"> & {
  readonly showWordmark?: boolean;
};

/** A two-faced doorway that remains distinct at small navigation sizes. */
export function JanusMark({
  className,
  showWordmark = false,
  ...props
}: JanusMarkProps): React.JSX.Element {
  return (
    <span className={className} {...props}>
      <svg
        aria-hidden="true"
        className="size-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 19V6.5L10.25 3v16L4 21v-2Z" fill="currentColor" />
        <path d="m20 19-6.25 2V5L20 7.5V19Z" fill="currentColor" opacity=".68" />
        <path d="M10.25 3 13.75 5v16l-3.5-2V3Z" fill="currentColor" opacity=".32" />
      </svg>
      {showWordmark ? <span className="font-semibold tracking-[-0.02em]">Janus</span> : null}
    </span>
  );
}
