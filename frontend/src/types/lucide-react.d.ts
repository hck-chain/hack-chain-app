import * as React from 'react';

// Augment lucide-react types so LucideProps accept standard SVG props
// This prevents TypeScript errors when passing className/style/other SVG props to icons
declare module 'lucide-react' {
  interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }
}
