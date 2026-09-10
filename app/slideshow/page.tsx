'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

interface Photo {
  id: string;
  image_url: string;
  created_at: string;
}

const ANIMATION_CLASSES = [
  'animate-zoom-in',
  'animate-zoom-out',
  'animate-pan-right-left',
  'animate-pan-left-right',
  'animate-pan-top-bottom',
  'animate-pan-bottom-top',
];

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // ブラウザ側でQRコード画像（DataURL）を直接生成
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uploadUrl = window.location.origin;
      QRCode.toDataURL(uploadUrl, { margin: 1, width: 200 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR生成エラー:', err));
    }
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setPhotos(data);
        getRandomAnimation();
      }
    };

    fetchPhotos();

    const channel = supabase
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos' },
        (payload) => {
          setPhotos((prev) => [payload.new as Photo, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRandomAnimation = () => {
    const randomIndex = Math.floor(Math.random() * ANIMATION_CLASSES.length);
    setCurrentAnimation(ANIMATION_CLASSES[randomIndex]);
  };

  useEffect(() => {
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
      getRandomAnimation();
    }, 6000);

    return () => clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-2xl text-slate-400 font-light tracking-widest animate-pulse">
          📷 写真を待っています...
        </p>
        {qrDataUrl && (
          <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center gap-2">
            <img src={qrDataUrl} alt="Upload QR Code" className="w-36 h-36" />
            <span className="text-xs text-slate-800 font-bold">QRコードを読み込んで投稿</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center relative overflow-hidden select-none">
      <img
        src={photos[currentIndex]?.image_url}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-125 transition-all duration-1000"
      />

      <div className="relative z-10 w-full h-full p-4 sm:p-8 flex items-center justify-center overflow-hidden">
        <img
          key={`${photos[currentIndex]?.id}-${currentIndex}`}
          src={photos[currentIndex]?.image_url}
          alt="Slideshow"
          className={`w-full h-full object-contain rounded-2xl shadow-2xl ${currentAnimation}`}
        />
      </div>

      {qrDataUrl && (
        <div className="absolute bottom-6 left-6 z-20 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl">
          <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 bg-white p-1 rounded-xl" />
          <div className="text-white text-xs pr-2">
            <p className="font-bold text-sm mb-1 text-emerald-400">📱 写真を投稿しよう！</p>
            <p className="text-slate-300">カメラで読み取って</p>
            <p className="text-slate-300">写真をスクリーンに送信</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white text-sm px-5 py-2.5 rounded-full border border-white/20 z-20 shadow-lg font-mono">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}