type ExternalLinkGlyphProps = {
  className?: string;
};

export default function ExternalLinkGlyph({ className = '' }: ExternalLinkGlyphProps) {
  return (
    <span className={`external-link-icon link-arrow ${className}`.trim()} aria-hidden="true">↗</span>
  );
}
