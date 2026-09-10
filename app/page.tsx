'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 画像の選択＆圧縮処理（Canvas使用）
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 最大長辺を 600px に縮小
          const MAX_SIZE = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // JPEG画質 0.5（50%）に圧縮して軽量化
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          setSelectedImage(compressedDataUrl);
          setIsSuccess(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Supabase への送信処理
  const handleUpload = async () => {
    if (!selectedImage) return;
    setIsUploading(true);

    try {
      const { error } = await supabase.from('photos').insert([
        {
          image_url: selectedImage,
          is_visible: true,
        },
      ]);

      if (error) throw error;

      setIsSuccess(true);
      setSelectedImage(null);
    } catch (err) {
      console.error('送信エラー:', err);
      alert('投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6">
      <header className="w-full max-w-md text-center py-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <span>📷</span> イベント写真共有
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          撮影した写真を投稿して、スクリーンのスライドショーに映そう！
        </p>
      </header>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-lg font-bold text-slate-800">送信完了！</h2>
            <p className="text-sm text-slate-500 mt-1">
              写真がスクリーンへ送信されました 🎉
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-6 px-6 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition"
            >
              続けて別の写真を送る
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div className="relative w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center">
                  <span className="text-4xl mb-2">🖼️</span>
                  <span className="text-sm font-medium text-slate-600">
                    タップして写真を選択
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    カメラ起動またはライブラリから選択
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment" // 
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {selectedImage && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-200 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isUploading ? '送信中...' : '📤 送信する'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="w-full max-w-md text-center py-4">
        <p className="text-xs text-slate-400">Powered by Event Photo App</p>
      </footer>
    </main>
  );
}