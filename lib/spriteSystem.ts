import type { AnimationState } from "./animationSystem";
import {
  generatePixelEffect,
  generatePixelSprite,
  generatePixelTile,
  type PixelEffectKey,
  type PixelMatrix,
  type PixelSpriteAsset,
  type PixelSpriteKey,
  type PixelTileKey
} from "./pixelArtGenerator";

export type SpriteKey = PixelSpriteKey;
export type EffectSpriteKey = PixelEffectKey;

export type SpriteDrawOptions = {
  x: number;
  y: number;
  scale?: number;
  frame?: number;
  state?: AnimationState;
  flip?: boolean;
  flash?: number;
  alpha?: number;
};

export type EffectDrawOptions = {
  x: number;
  y: number;
  scale?: number;
  progress?: number;
  alpha?: number;
};

type SpriteCanvas = HTMLCanvasElement | OffscreenCanvas;

type BattlefieldOptions = {
  width: number;
  height: number;
  time: number;
};

const generatedSpriteCache = new Map<string, SpriteCanvas>();
const generatedTileCache = new Map<PixelTileKey, SpriteCanvas>();
const imageCache = new Map<SpriteKey, HTMLImageElement | null>();

const OPTIONAL_IMAGE_FILES: Partial<Record<SpriteKey, string>> = {
  basicWizard: "wizard.png",
  fireWizard: "wizard.png",
  iceWizard: "wizard.png",
  lightningWizard: "wizard.png",
  strongWizard: "wizard.png",
  archer: "archer.png",
  knightUnit: "knight.png",
  basicKnight: "knight.png",
  shieldKnight: "knight.png",
  fastScout: "knight.png",
  catapult: "catapult.png",
  giantKnight: "boss.png"
};

const PROJECTILE_KEYS = new Set<SpriteKey>([
  "arcaneProjectile",
  "arrowProjectile",
  "slashProjectile",
  "stoneProjectile",
  "strongMagicProjectile",
  "fireball",
  "iceProjectile",
  "lightningBolt",
  "catapultOrb",
  "coin",
  "xp"
]);

export function drawPixelSprite(
  context: CanvasRenderingContext2D,
  sprite: SpriteKey,
  options: SpriteDrawOptions
) {
  const scale = options.scale ?? 3;
  const frame = options.frame ?? 0;
  const state = options.state ?? "idle";
  const asset = getSpriteCanvas(sprite, state, frame);
  const optionalImage = getOptionalImage(sprite);
  const source = optionalImage?.complete && optionalImage.naturalWidth > 0
    ? optionalImage
    : asset;
  const sourceWidth = "naturalWidth" in source ? source.naturalWidth : source.width;
  const sourceHeight = "naturalHeight" in source ? source.naturalHeight : source.height;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const centered = PROJECTILE_KEYS.has(sprite);
  const x = centered ? options.x - width / 2 : options.x - width / 2;
  const y = centered ? options.y - height / 2 : options.y - height;

  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = options.alpha ?? 1;

  if (options.flip) {
    context.translate(Math.round(options.x), 0);
    context.scale(-1, 1);
    context.drawImage(source, Math.round(-width / 2), Math.round(y), Math.round(width), Math.round(height));
  } else {
    context.drawImage(source, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  if ((options.flash ?? 0) > 0 && sprite !== "wizardCastle") {
    drawPixelFlash(context, options.x, centered ? options.y : options.y - height / 2, width, height, options.flash ?? 0);
  }

  context.restore();
}

export function drawPixelEffect(
  context: CanvasRenderingContext2D,
  effect: EffectSpriteKey,
  options: EffectDrawOptions
) {
  const scale = options.scale ?? 3;
  const progress = Math.max(0, Math.min(1, options.progress ?? 0));
  const frame = Math.min(3, Math.floor(progress * 4));
  const asset = getEffectCanvas(effect, frame);
  const width = asset.width * scale;
  const height = asset.height * scale;

  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = (options.alpha ?? 1) * Math.max(0, 1 - progress * 0.15);
  context.drawImage(
    asset,
    Math.round(options.x - width / 2),
    Math.round(options.y - height / 2),
    Math.round(width),
    Math.round(height)
  );
  context.restore();
}

export function drawPixelBattlefield(
  context: CanvasRenderingContext2D,
  options: BattlefieldOptions
) {
  tile(context, "skyTile", 0, 0, options.width, 252, 2);

  for (let x = 0; x < options.width; x += 96) {
    drawTileSprite(context, "distantTower", x + ((Math.floor(x / 96) % 2) * 18), 112, 2);
  }

  for (let x = 200; x < options.width; x += 78) {
    drawTileSprite(context, "villageHut", x, 224, 1.9);
  }

  drawTileSprite(context, "moon", 760, 28, 2.2);
  drawTileSprite(context, "magicCircle", 122, 292, 2.55);
  drawTileSprite(context, "spawnGate", options.width - 106, 276, 2.15);
  tile(context, "dirtPathTile", 0, 270, options.width, 118, 2);
  tile(context, "stoneRoadTile", 0, 388, options.width, 72, 2);
}

export function drawPixelBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  ratio: number,
  color: string
) {
  const cleanRatio = Math.max(0, Math.min(1, ratio));

  context.save();
  context.imageSmoothingEnabled = false;
  pixelRect(context, x, y, width, 9, "#050712");
  pixelRect(context, x + 1, y + 1, width - 2, 7, "#f7e8bd");
  pixelRect(context, x + 2, y + 2, width - 4, 5, "#111827");
  pixelRect(context, x + 2, y + 2, (width - 4) * cleanRatio, 5, color);
  context.restore();
}

export function drawPixelPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = "rgba(3,5,12,0.78)"
) {
  context.save();
  pixelRect(context, x, y, width, height, fill);
  pixelRect(context, x, y, width, 4, "rgba(247,232,189,0.72)");
  pixelRect(context, x, y + height - 4, width, 4, "rgba(0,0,0,0.55)");
  pixelRect(context, x, y, 4, height, "rgba(247,232,189,0.44)");
  pixelRect(context, x + width - 4, y, 4, height, "rgba(0,0,0,0.55)");
  context.restore();
}

function getSpriteCanvas(
  sprite: SpriteKey,
  state: AnimationState,
  frame: number
) {
  const asset = generatePixelSprite(sprite, state);
  const cleanFrame = Math.abs(frame) % asset.frames.length;
  const cacheKey = `${sprite}:${state}:${cleanFrame}`;

  return cachedMatrix(cacheKey, asset, cleanFrame, generatedSpriteCache);
}

function getEffectCanvas(effect: EffectSpriteKey, frame: number) {
  const asset = generatePixelEffect(effect);
  const cleanFrame = Math.abs(frame) % asset.frames.length;
  const cacheKey = `effect:${effect}:${cleanFrame}`;

  return cachedMatrix(cacheKey, asset, cleanFrame, generatedSpriteCache);
}

function getTileCanvas(tileKey: PixelTileKey) {
  const cached = generatedTileCache.get(tileKey);
  if (cached) {
    return cached;
  }

  const asset = generatePixelTile(tileKey);
  const canvas = matrixToCanvas(asset.frames[0]);
  generatedTileCache.set(tileKey, canvas);
  return canvas;
}

function cachedMatrix(
  key: string,
  asset: PixelSpriteAsset,
  frame: number,
  cache: Map<string, SpriteCanvas>
) {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = matrixToCanvas(asset.frames[frame]);
  cache.set(key, canvas);
  return canvas;
}

function matrixToCanvas(matrix: PixelMatrix): SpriteCanvas {
  const canvas = createCanvas(matrix[0].length, matrix.length);
  const context = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;

  if (!context) {
    return canvas;
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, matrix[0].length, matrix.length);

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      const color = matrix[y][x];
      if (color) {
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas;
}

function createCanvas(width: number, height: number): SpriteCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getOptionalImage(sprite: SpriteKey) {
  if (!usesExternalImageAssets()) {
    return undefined;
  }

  const file = OPTIONAL_IMAGE_FILES[sprite];

  if (!file || typeof Image === "undefined") {
    return undefined;
  }

  if (imageCache.has(sprite)) {
    return imageCache.get(sprite) ?? undefined;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = `/assets/sprites/${file}`;
  image.onerror = () => imageCache.set(sprite, null);
  image.onload = () => imageCache.set(sprite, image);
  imageCache.set(sprite, image);
  return image;
}

function usesExternalImageAssets() {
  if (process.env.NEXT_PUBLIC_MICRO_DEFENSE_ASSET_MODE === "image") {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem("micro-defense-asset-mode") === "image";
}

function tile(
  context: CanvasRenderingContext2D,
  tileKey: PixelTileKey,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  const tileCanvas = getTileCanvas(tileKey);
  const tileWidth = tileCanvas.width * scale;
  const tileHeight = tileCanvas.height * scale;

  for (let ty = y; ty < y + height; ty += tileHeight) {
    for (let tx = x; tx < x + width; tx += tileWidth) {
      context.drawImage(
        tileCanvas,
        Math.round(tx),
        Math.round(ty),
        Math.round(tileWidth),
        Math.round(tileHeight)
      );
    }
  }
}

function drawTileSprite(
  context: CanvasRenderingContext2D,
  tileKey: PixelTileKey,
  x: number,
  y: number,
  scale: number
) {
  const tileCanvas = getTileCanvas(tileKey);
  context.drawImage(
    tileCanvas,
    Math.round(x),
    Math.round(y),
    Math.round(tileCanvas.width * scale),
    Math.round(tileCanvas.height * scale)
  );
}

function drawPixelFlash(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  flash: number
) {
  context.save();
  context.globalAlpha = 0.28 * flash;
  pixelRect(context, x - width / 2, y - height / 2, width, height, "#ffffff");
  context.restore();
}

function pixelRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) {
  context.fillStyle = color;
  context.fillRect(
    Math.round(x),
    Math.round(y),
    Math.round(width),
    Math.round(height)
  );
}
