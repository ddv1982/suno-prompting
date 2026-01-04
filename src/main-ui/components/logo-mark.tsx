type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 32, className }: LogoMarkProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="bg" x1="220" y1="140" x2="804" y2="884" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F111A" />
          <stop offset="1" stopColor="#05060A" />
        </linearGradient>
        <radialGradient id="bgGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 420) rotate(90) scale(520 520)">
          <stop stopColor="#242B3D" stopOpacity="0.9" />
          <stop offset="1" stopColor="#05060A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stroke" x1="280" y1="240" x2="780" y2="780" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFFF" />
          <stop offset="1" stopColor="#FF00CC" />
        </linearGradient>
        <linearGradient id="strokeHighlight" x1="300" y1="200" x2="720" y2="720" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B2FFFF" />
          <stop offset="0.5" stopColor="#00FFFF" stopOpacity="0.3" />
          <stop offset="1" stopColor="#FFB2EE" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="orb" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 500) rotate(90) scale(180 180)">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.2" stopColor="#70FFFF" />
          <stop offset="0.6" stopColor="#00D9FF" />
          <stop offset="1" stopColor="#FF00AA" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="1024" height="1024" rx="212" fill="url(#bg)" />
      <rect x="0" y="0" width="1024" height="1024" rx="212" fill="url(#bgGlow)" />
      <circle cx="512" cy="520" r="240" fill="#000000" opacity="0.4" />

      <path
        d="M236 660C236 394 374 236 512 236C650 236 788 394 788 660C788 780 712 844 628 844C544 844 512 778 512 736C512 778 480 844 396 844C312 844 236 780 236 660Z"
        fill="none"
        stroke="url(#stroke)"
        strokeWidth="72"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M236 660C236 394 374 236 512 236C650 236 788 394 788 660C788 780 712 844 628 844"
        fill="none"
        stroke="url(#strokeHighlight)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />

      <circle cx="512" cy="504" r="146" fill="url(#orb)" />
      <circle cx="452" cy="452" r="48" fill="white" fillOpacity="0.4" />
      <circle cx="574" cy="420" r="24" fill="white" fillOpacity="0.3" />
    </svg>
  );
}

