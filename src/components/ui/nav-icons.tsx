import type { SVGProps } from "react";

export interface NavIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** The four primary-tab glyphs, drawn exactly as the reference design draws them
 * (lucide's nearest equivalents differ in shape: a door-style house, a calculator,
 * a different sliders glyph). Same props as a lucide icon so they drop in anywhere. */
function Svg({ size = 22, strokeWidth = 2, className, children }: NavIconProps & { children: SVGProps<SVGSVGElement>["children"] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: NavIconProps) {
  return (
    <Svg {...props}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </Svg>
  );
}

export function BudgetsIcon(props: NavIconProps) {
  return (
    <Svg {...props}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </Svg>
  );
}

export function GoalsIcon(props: NavIconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </Svg>
  );
}

export function SettingsIcon(props: NavIconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </Svg>
  );
}
