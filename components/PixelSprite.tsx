"use client";

import { useEffect, useRef } from "react";
import { getAnimationFrame, type AnimationState } from "@/lib/animationSystem";
import { drawPixelSprite, type SpriteKey } from "@/lib/spriteSystem";

type PixelSpriteProps = {
  sprite: SpriteKey;
  state?: AnimationState;
  flip?: boolean;
  scale?: number;
  width?: number;
  height?: number;
  className?: string;
};

export default function PixelSprite({
  sprite,
  state = "idle",
  flip = false,
  scale = 2,
  width = 84,
  height = 84,
  className
}: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = false;
      drawPixelSprite(context, sprite, {
        x: width / 2,
        y: height - 12,
        scale,
        frame: getAnimationFrame(elapsed, 1, state),
        state,
        flip
      });
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [flip, height, scale, sprite, state, width]);

  return (
    <canvas
      aria-hidden="true"
      className={className ?? "block [image-rendering:pixelated]"}
      height={height}
      ref={canvasRef}
      width={width}
    />
  );
}
