type ExternalLinkGlyphProps = {
  className?: string;
};

export default function ExternalLinkGlyph({ className = '' }: ExternalLinkGlyphProps) {
  return (
    <span className={`external-link-icon link-arrow ${className}`.trim()} aria-hidden="true">
      <svg className="external-link-icon-svg" viewBox="0 0 10 10" focusable="false">
        <path d="M2 1.5h6.5V8" />
        <path d="M8.5 1.5 1.5 8.5" />
      </svg>
    </span>
  );
}
