'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Photo {
  id: string;
  image_url: string;
  created_at: string;
}

interface CollageModalProps {
  photos: Photo[];
  onClose: () => void;
}

export default function CollageModal({ photos, onClose }: CollageModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const generateCollage = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズ (高解像度 2400x1800 4:3比例)
    const width = 2400;
    const height = 1800;
    canvas.width = width;
    canvas.height = height;

    // 背景描画（温かみのあるややオフホワイトの背景）
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, width, height);

    // 背景にさりげないグリッド/ノイズ感をプラス（デザインの質感向上）
    ctx.strokeStyle = '#e2ded5';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 画像の読み込み処理
    const loadedImages = await Promise.all(
      photos.map(
        (photo) =>
          new Promise<HTMLImageElement | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = photo.image_url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
          })
      )
    );

    const validImages = loadedImages.filter((img): img is HTMLImageElement => img !== null);

    if (validImages.length === 0) {
      setIsGenerating(false);
      return;
    }

    // 写真の配置計算（画面全体にばら撒く設定）
    validImages.forEach((img, index) => {
      ctx.save();

      // ランダムな配置位置（キャンバス中央付近〜全体に分散）
      const padding = 200;
      const x = padding + Math.random() * (width - padding * 2);
      const y = padding + Math.random() * (height - padding * 2);

      // ランダムな回転角度（-25度 〜 +25度）
      const angle = ((Math.random() - 0.5) * 50 * Math.PI) / 180;

      // ランダムなサイズ（ベースサイズ 350px 〜 550px）
      const baseWidth = 350 + Math.random() * 200;
      const aspectRatio = img.height / img.width;
      const imgWidth = baseWidth;
      const imgHeight = baseWidth * aspectRatio;

      // ポラロイド風フレームの余白
      const framePadding = 20;
      const bottomPadding = 60; // 下部のメッセージ用余白

      ctx.translate(x, y);
      ctx.rotate(angle);

      // 影の描画（立体感のあるランダムドロップシャドウ）
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 12;

      // 白い台紙（フォトフレーム）
      ctx.fillStyle = '#ffffff';
      const frameWidth = imgWidth + framePadding * 2;
      const frameHeight = imgHeight + framePadding + bottomPadding;
      ctx.fillRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);

      // 影の設定をリセットして写真本体を描画
      ctx.shadowColor = 'transparent';
      ctx.drawImage(
        img,
        -imgWidth / 2,
        -frameHeight / 2 + framePadding,
        imgWidth,
        imgHeight
      );

      // 写真のフチに微細なボーダー
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        -imgWidth / 2,
        -frameHeight / 2 + framePadding,
        imgWidth,
        imgHeight
      );

      ctx.restore();
    });

    // タイトルロゴ/スタンプを右下に描画
    ctx.save();
    ctx.translate(width - 400, height - 150);
    ctx.rotate((-5 * Math.PI) / 180);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)'; // 赤いスタンプ風
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('MEMORY SNAP', 0, 0);

    ctx.fillStyle = '#64748b';
    ctx.font = '24px sans-serif';
    ctx.fillText(new Date().toLocaleDateString('ja-JP'), 0, 35);

    ctx.restore();

    setIsGenerating(false);
  };

  useEffect(() => {
    generateCollage();
  }, [photos]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `event-collage-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl bg-slate-900 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">📸 イベントランダムコラージュ</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            ✕ 閉じる
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-2">
          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-sm text-slate-300">コラージュ画像を生成中...</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="max-h-[65vh] w-auto rounded-lg object-contain shadow-md"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={generateCollage}
            disabled={isGenerating}
            className="rounded-xl bg-slate-800 px-5 py-3 font-semibold hover:bg-slate-700 disabled:opacity-50"
          >
            🔄 再配置する（ランダム切り替え）
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-slate-950 hover:brightness-110 disabled:opacity-50"
          >
            ⬇️ コラージュ画像をダウンロード
          </button>
        </div>
      </div>
    </div>
  );
}