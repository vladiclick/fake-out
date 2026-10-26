interface LogoProps {
  size?: number;
}

/**
 * Brand wordmark "Fake Out" with a floating yellow dot separator.
 */
export function Logo({ size = 56 }: LogoProps) {
  return (
    <span className="brand" style={{ fontSize: size }} aria-label="Fake Out">
      Fake
      <span className="brand-dot" aria-hidden="true">
        •
      </span>
      Out
    </span>
  );
}
