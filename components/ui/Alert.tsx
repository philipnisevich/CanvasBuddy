import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type AlertVariant = "error" | "success" | "warning" | "info";

const styles: Record<AlertVariant, string> = {
  error: "border-[var(--danger)] bg-[var(--danger-soft)] text-[#991b1b]",
  success: "border-[var(--color-cta-hover)] bg-[var(--success-soft)] text-[#166534]",
  warning: "border-[var(--warning)] bg-[var(--warning-soft)] text-[#854d0e]",
  info: "border-[var(--color-canvas-red)] bg-[var(--accent-soft)] text-[var(--color-text)]",
};

const icons: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

export default function Alert({
  children,
  variant = "error",
  className = "",
}: {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
}) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-[var(--radius-lg)] border-[3px] px-4 py-3 text-sm font-medium ${styles[variant]} ${className}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
