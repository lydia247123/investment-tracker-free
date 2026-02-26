import { useState, useEffect } from 'react';
import type { TutorialStep } from '../types';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  x: number;
  y: number;
  toJSON?: () => any;
}

export const useSpotlightPosition = (
  target: TutorialStep['target'],
  stepIndex: number
) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [cardPosition, setCardPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  useEffect(() => {
    const updatePosition = () => {
      let element: HTMLElement | null = null;

      // Try selector first
      if (target.selector) {
        element = document.querySelector(target.selector);
      }

      // Fallback to custom finder
      if (!element && target.findElement) {
        element = target.findElement();
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition(rect as Position);

        // Auto-detect best card position based on available space
        if (target.cardPosition === 'auto' || !target.cardPosition) {
          const spaceAbove = rect.top;
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceLeft = rect.left;
          const spaceRight = window.innerWidth - rect.right;

          const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);

          if (maxSpace === spaceBelow) setCardPosition('bottom');
          else if (maxSpace === spaceAbove) setCardPosition('top');
          else if (maxSpace === spaceRight) setCardPosition('right');
          else setCardPosition('left');
        } else {
          setCardPosition(target.cardPosition);
        }
      } else if (target.fallbackPosition) {
        // Use fallback position
        setPosition({
          top: target.fallbackPosition.y,
          left: target.fallbackPosition.x,
          bottom: target.fallbackPosition.y,
          right: target.fallbackPosition.x,
          width: 0,
          height: 0,
          x: target.fallbackPosition.x,
          y: target.fallbackPosition.y,
          toJSON: () => ({})
        });
        setCardPosition('bottom');
      }
    };

    // Initial position
    updatePosition();

    // Re-calculate on resize and scroll
    const resizeObserver = new ResizeObserver(updatePosition);
    const targetElement = target.selector ?
      document.querySelector(target.selector) : null;

    if (targetElement) {
      resizeObserver.observe(targetElement);
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [target, stepIndex]);

  return { position, cardPosition };
};
