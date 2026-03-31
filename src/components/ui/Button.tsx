import Link from "next/link";
import { ReactNode, ButtonHTMLAttributes } from "react";

/**
 * Button variant types
 */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Button size types
 */
type ButtonSize = "sm" | "md" | "lg";

/**
 * Base props for Button component
 */
interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

/**
 * Props for Button as a button element
 */
interface ButtonAsButton
  extends BaseButtonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  href?: never;
}

/**
 * Props for Button as a link
 */
interface ButtonAsLink extends BaseButtonProps {
  href: string;
  external?: boolean;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Get variant-specific classes
 */
function getVariantClasses(variant: ButtonVariant): string {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-lava hover:bg-lava-light text-cream font-medium",
    secondary:
      "border border-white/20 hover:bg-white/5 text-cream",
    ghost:
      "glass-panel hover:bg-white/10 text-cream",
    danger:
      "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
  };
  return variants[variant];
}

/**
 * Get size-specific classes
 */
function getSizeClasses(size: ButtonSize): string {
  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };
  return sizes[size];
}

/**
 * Reusable Button component with multiple variants and sizes
 * Can render as a button element or a Next.js Link
 *
 * @param variant - Visual style variant (primary, secondary, ghost, danger)
 * @param size - Size variant (sm, md, lg)
 * @param children - Button content
 * @param icon - Optional icon to display before children
 * @param href - If provided, renders as a Link
 * @param external - If true and href provided, opens in new tab
 * @param className - Additional CSS classes
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    children,
    className = "",
    icon,
  } = props;

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lava focus:ring-offset-2 focus:ring-offset-obsidian";

  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;

  const content = (
    <>
      {icon}
      {children}
    </>
  );

  // Render as Link if href is provided
  if ("href" in props && props.href) {
    const { href, external } = props;

    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  // Render as button
  const { type = "button", disabled, onClick, ...rest } = props as ButtonAsButton;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${combinedClasses} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...rest}
    >
      {content}
    </button>
  );
}

export default Button;
