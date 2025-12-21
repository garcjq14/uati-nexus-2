import 'framer-motion';
import type { HTMLAttributes } from 'react';

declare module 'framer-motion' {
  export interface MotionProps extends HTMLAttributes<HTMLElement> {
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
  }
}

