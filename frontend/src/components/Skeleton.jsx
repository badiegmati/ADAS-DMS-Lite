/**
 * Bloc de chargement "squelette" (liste/carte en cours de chargement).
 * variant: 'text' | 'circle' | 'rect'
 */
export default function Skeleton({ variant = 'text', width, height, count = 1, className = '' }) {
  const shapeClass =
    variant === 'circle' ? 'rounded-full' : variant === 'rect' ? 'rounded-xl' : 'rounded-md';

  const defaultSize =
    variant === 'circle'
      ? { width: width ?? 40, height: height ?? 40 }
      : variant === 'rect'
      ? { width: width ?? '100%', height: height ?? 120 }
      : { width: width ?? '100%', height: height ?? 14 };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-bg-card2 animate-pulse ${shapeClass}`}
          style={{ width: defaultSize.width, height: defaultSize.height }}
        />
      ))}
    </div>
  );
}