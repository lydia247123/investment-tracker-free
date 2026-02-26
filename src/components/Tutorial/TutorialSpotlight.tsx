import { useMemo } from 'react';
import { useSpotlightPosition } from './hooks/useSpotlightPosition';
import type { TutorialStep } from './types';
import './TutorialSpotlight.css';

interface TutorialSpotlightProps {
  target: TutorialStep['target'];
  disableSpotlight?: boolean;
  padding?: number;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  target,
  disableSpotlight = false,
  padding = 8
}) => {
  const { position } = useSpotlightPosition(target, 0);

  const spotlightStyle = useMemo(() => {
    if (!position || disableSpotlight) {
      return null;
    }

    return {
      top: position.top - padding,
      left: position.left - padding,
      width: position.width + padding * 2,
      height: position.height + padding * 2,
    };
  }, [position, disableSpotlight, padding]);

  // 禁用聚光灯时只显示背景层
  if (disableSpotlight) {
    return <div className="tutorial-spotlight-overlay" />;
  }

  return (
    <>
      {/* 半透明背景层 */}
      <div className="tutorial-spotlight-overlay" />

      {/* 聚光灯挖空效果（带绿色边框） */}
      {spotlightStyle && (
        <div
          className="tutorial-spotlight-cutout tutorial-spotlight-pulse"
          style={spotlightStyle}
        />
      )}
    </>
  );
};
