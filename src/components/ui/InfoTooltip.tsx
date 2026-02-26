import React from 'react';

interface InfoTooltipProps {
  content: string | string[];
  className?: string;
}

/**
 * 信息提示组件 - 在鼠标悬停时显示tooltip说明
 * 使用纯Tailwind CSS实现，无需额外依赖
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = '' }) => {
  // 将内容转换为数组（支持多行显示）
  const contentLines = Array.isArray(content) ? content : [content];

  return (
    <span className={`relative inline-block group ml-2 ${className}`}>
      {/* iOS风格圆形问号图标 */}
      <span
        className={`
          inline-flex items-center justify-center
          w-4 h-4 rounded-full
          border border-gray-400 bg-gray-50
          hover:border-gray-500 hover:bg-gray-100
          cursor-help
          transition-all duration-200
        `}
        role="button"
        aria-label="显示说明"
      >
        <span className="text-gray-500 text-xs font-medium select-none leading-none">?</span>
      </span>

      {/* Tooltip内容 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-4 py-2.5
                        shadow-xl break-words min-w-max max-w-sm">
          {contentLines.map((line, index) => (
            <div key={index} className={index > 0 ? 'mt-1 pt-1 border-t border-gray-700' : ''}>
              {line}
            </div>
          ))}
        </div>
        {/* 小三角箭头 */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1
                        border-4 border-transparent border-t-gray-900" />
      </div>
    </span>
  );
};
