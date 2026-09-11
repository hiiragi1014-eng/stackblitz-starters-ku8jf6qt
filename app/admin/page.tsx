'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CollageModal from './CollageModal';

interface Photo {
  id: string;
  image_url: string;
  created_at: string;
}

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollage, setShowCollage] = useState(false);

  // 写真の取得
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhotos(data);
    }
    setLoading(false);
  };

  // 写真の削除
  const handleDelete = async (id: string) => {
    if (!confirm('この写真を削除してもよろしいですか？')) return;

    const { error } = await supabase.from('photos').delete().eq('id', id);

    if (error) {
      alert('削除に失敗しました');
    } else {
      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛠️ 写真管理ダッシュボード</h1>
            <p className="text-sm text-slate-400">
              投稿された写真の削除管理やコラージュ画像の生成ができます。
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchPhotos}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
            >
              🔄 最新情報に更新
            </button>
            <button
              onClick={() => setShowCollage(true)}
              disabled={photos.length === 0}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-slate-950 hover:brightness-110 disabled:opacity-50"
            >
              🎨 ランダムコラージュ生成 ({photos.length}枚)
            </button>
          </div>
        </div>

        {/* 写真一覧 */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">読み込み中...</div>
        ) : photos.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            まだ写真が投稿されていません。
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-md"
              >
                <img
                  src={photo.image_url}
                  alt="投稿写真"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 rounded-lg bg-red-600/90 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700"
                  title="削除する"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* コラージュ用モーダル */}
      {showCollage && (
        <CollageModal
          photos={photos}
          onClose={() => setShowCollage(false)}
        />
      )}
    </div>
  );
}