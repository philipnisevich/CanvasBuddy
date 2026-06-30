import type { ReactNode } from "react";

export default function PageToolbar({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="cb-page-header">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="cb-page-actions">{actions}</div>}
    </div>
  );
}
