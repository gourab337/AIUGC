export function ClaudeLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Claude logo mark — stylised radiating wedge shapes */}
      <path
        d="M28 4 L32 20 L28 18 L24 20 Z"
        fill="#e8920a"
        opacity="0.95"
      />
      <path
        d="M48 10 L38 22 L35 18 L40 13 Z"
        fill="#e8920a"
        opacity="0.85"
      />
      <path
        d="M52 28 L36 30 L36 26 L52 28 Z"
        fill="#e8920a"
        opacity="0.75"
      />
      <path
        d="M48 46 L36 36 L39 32 L46 40 Z"
        fill="#e8920a"
        opacity="0.65"
      />
      <path
        d="M28 52 L24 36 L28 38 L32 36 Z"
        fill="#e8920a"
        opacity="0.55"
      />
      <path
        d="M8 46 L18 34 L21 38 L14 44 Z"
        fill="#e8920a"
        opacity="0.65"
      />
      <path
        d="M4 28 L20 26 L20 30 L4 28 Z"
        fill="#e8920a"
        opacity="0.75"
      />
      <path
        d="M8 10 L20 22 L17 26 L10 18 Z"
        fill="#e8920a"
        opacity="0.85"
      />
    </svg>
  );
}
