import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="hsl(var(--primary))" stroke="none" />
    <path d="M12,12 A10,10 0 0 1 2,12" stroke="hsl(var(--search-ring))" />
    <circle cx={16} cy={8} r={1} fill="hsl(var(--search-ring))" stroke="none" />
  </svg>
);
export default Logo;
