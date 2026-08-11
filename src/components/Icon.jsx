export default function Icon({ src, size = 28, alt = "" }) {
  if (!src) {
    return <div className="icon-fallback" style={{ width: size, height: size }} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className="icon"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
}
