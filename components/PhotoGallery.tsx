"use client";

import { useState } from "react";

export interface GalleryPhoto {
  id: number;
  legende: string;
}

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(photos[0]?.id ?? null);
  const selected = photos.find((p) => p.id === selectedId) ?? photos[0];

  if (!selected) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-400">
        Aucune photographie pour cette variété.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/photos/${selected.id}`}
          alt={selected.legende || "Photographie de la variété"}
          className="w-full h-72 object-contain"
        />
      </div>
      {selected.legende && (
        <p className="mt-2 text-sm text-stone-500 italic">{selected.legende}</p>
      )}
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition ${
                p.id === selected.id ? "border-mil-600" : "border-transparent hover:border-mil-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${p.id}`}
                alt={p.legende || ""}
                className="h-16 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
