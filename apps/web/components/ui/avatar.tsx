import * as React from 'react';
import { cn } from '../../lib/utils';

export function Avatar({
  src,
  alt = 'User Avatar',
  fallback,
  className,
}: {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted/50 items-center justify-center font-semibold text-xs text-foreground',
        className
      )}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span>{fallback || alt?.substring(0, 2).toUpperCase() || 'U'}</span>
      )}
    </div>
  );
}
