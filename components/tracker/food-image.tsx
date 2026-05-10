"use client";

import { useEffect, useState } from "react";

import { type FoodItemSummary } from "@/lib/domain";
import { getFoodImageUrlCandidates, getFoodVisualMeta } from "@/lib/food-images";
import { cn } from "@/lib/utils";

export function FoodImage({
  food,
  className,
  imageClassName
}: {
  food: Pick<FoodItemSummary, "name" | "nameZh" | "category" | "imageUrl">;
  className?: string;
  imageClassName?: string;
}) {
  const imageCandidates = getFoodImageUrlCandidates(food);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
  const imageUrl = imageCandidates.find((candidate) => !failedImageUrls.includes(candidate)) ?? null;
  const visual = getFoodVisualMeta(food);

  useEffect(() => {
    setFailedImageUrls([]);
  }, [food.imageUrl, food.name, food.nameZh]);

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={food.nameZh}
          loading="lazy"
          decoding="async"
          onError={() => setFailedImageUrls((current) => (current.includes(imageUrl) ? current : [...current, imageUrl]))}
          className={cn("h-full w-full object-cover transition-transform duration-500", imageClassName)}
        />
      ) : (
        <div className={cn("relative flex h-full w-full items-center justify-center bg-gradient-to-br", visual.toneClassName)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.65),transparent_30%),radial-gradient(circle_at_80%_82%,rgba(255,255,255,0.45),transparent_26%)]" />
          <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-full bg-white/35" />
          <div className="absolute -left-4 top-2 h-10 w-10 rounded-full bg-white/25" />
          <span className="relative text-lg font-semibold leading-none tracking-normal sm:text-xl">{visual.symbol}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-white/8" />
    </div>
  );
}
