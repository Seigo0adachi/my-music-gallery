import React from 'react';

export default function TagSVG({ emoji, text, onDelete, style = {}, darkMode, selected, hovered }) {
  const width = 125;
  const height = 32;
  
  // 背景色を動的に決定
  const getBackgroundColor = () => {
    if (hovered || selected) {
      // ホバー時と選択中は白に近いグレー
      return darkMode ? "#444" : "#e8e8e8";
    }
    return selected ? "#fff" : "#000";
  };
  
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ ...style, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* 白い縁取り（strokeWidthを4にして少し太く） */}
      <polygon
        points="4,16 24,2 121,2 121,30 24,30"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* 矢印本体（ホバー・選択時は白に近いグレー、それ以外は従来通り） */}
      <polygon
        points="3,16 23,1 122,1 122,31 23,31"
        fill={getBackgroundColor()}
        stroke="none"
      />
      {/* 絵文字の丸（選択中は黒、通常は白） */}
      <circle cx="32" cy="16" r="11" fill={selected ? "#000" : "#fff"} />
      {/* 絵文字（2px上げる） */}
      <text x="32" y="18" textAnchor="middle" fontSize="18" dominantBaseline="middle">
        {emoji}
      </text>
      {/* テキスト（色も切り替え） */}
      <text x="46" y="18" fontSize="15" fill={selected ? "#000" : "#fff"} fontWeight="bold" dominantBaseline="middle">
        {text}
      </text>
      {/* ×ボタン（ライトモードでは常に黒、ダークモードでは白） */}
      <text
        x={width - 24}
        y="20"
        fontSize="16"
        fill={darkMode ? "#fff" : "#000"}
        fontWeight="bold"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={onDelete}
      >×</text>
    </svg>
  );
} 