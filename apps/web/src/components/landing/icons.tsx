import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function LogoIcon(props: IconProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path
        d="M6 9.5 L10.5 19.5 L14 13 L17.5 19.5 L22 9.5"
        transform="rotate(90 14 14)"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoIconSmall(props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="22" height="22" rx="6" fill="#6366f1" />
      <path
        d="M4 7 L7.5 15 L11 9.5 L14.5 15 L18 7"
        transform="rotate(90 11 11)"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M9 1v11M4.5 8L9 13l4.5-5M1 15h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIconSmall(props: IconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M7 1v8M3.5 6l3.5 4 3.5-4M1 11h12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M8 1a7 7 0 0 0-2.21 13.64c.35.06.48-.15.48-.34v-1.17C4.08 13.5 3.67 12.1 3.67 12.1c-.32-.81-.78-1.02-.78-1.02-.64-.43.05-.42.05-.42.7.05 1.07.72 1.07.72.63 1.07 1.64.76 2.04.58.06-.45.24-.76.44-.93C5.04 10.87 3.5 10.3 3.5 7.65c0-.75.27-1.36.72-1.84-.07-.18-.31-.87.07-1.81 0 0 .59-.19 1.92.72a6.67 6.67 0 0 1 3.5 0c1.33-.91 1.92-.72 1.92-.72.38.94.14 1.63.07 1.81.45.48.72 1.09.72 1.84 0 2.65-1.54 3.23-3.01 3.4.24.2.45.6.45 1.21v1.79c0 .19.13.41.48.34A7 7 0 0 0 8 1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M6.5 1L8 5h4L9 7.5l1 4-3.5-2.5L3 11.5l1-4L1 5h4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo(props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="22" height="22" rx="6" fill="url(#grad)"/>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="22" y2="22">
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
      <path d="M4 7 L7.5 15 L11 9.5 L14.5 15 L18 7"
            transform="rotate(90 11 11)"
            stroke="white" strokeWidth="2.2" strokeLinecap="round"
            strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
