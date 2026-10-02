'use client'
import React, { useRef, useState, useEffect } from 'react'

interface TileBase {
   id: number
   // Correct region of the source image that belongs in this slot
   sx: number
   sy: number
   sWidth: number
   sHeight: number
   // Fixed slot on the canvas — tiles rotate in place here (no translation)
   dx: number
   dy: number
   // Scrambled front face: another tile's content, randomly rotated
   scramble: HTMLCanvasElement
   // Self-contained flip animation state (NOT driven by the progress value)
   rot: number
   animFrom: number
   animTo: number
   animStart: number // -1 = idle
   animDuration: number
}

// Clamp value between min and max
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

// Full flip amount for a tile (degrees)
const FLIP_DEGREES = 180

// How long a tile takes to complete its flip, in ms. The flip runs on its own
// clock — progress only decides WHEN it starts (via thresholds).
const FLIP_DURATION = 450

// Smooth easing for the flip
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function buildTiles(img: HTMLImageElement, size: number): TileBase[] {
   const w = img.width / size
   const h = img.height / size

   // Random derangement: every tile shows a DIFFERENT tile's content and never
   // its own position, so the board reads as a shuffled puzzle.
   const count = size * size
   const perm = Array.from({ length: count }, (_, i) => i)
   do {
      for (let i = count - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1))
         const tmp = perm[i]
         perm[i] = perm[j]
         perm[j] = tmp
      }
   } while (perm.some((v, i) => v === i))

   // A scrambled face = another tile's content, rotated by a random 90° step.
   const makeScramble = (srcIndex: number): HTMLCanvasElement => {
      const c = document.createElement('canvas')
      c.width = Math.ceil(w)
      c.height = Math.ceil(h)
      const g = c.getContext('2d')
      if (g) {
         const rc = srcIndex % size
         const rr = Math.floor(srcIndex / size)
         const angle = (Math.floor(Math.random() * 4) * Math.PI) / 2
         g.save()
         g.translate(c.width / 2, c.height / 2)
         g.rotate(angle)
         g.drawImage(img, rc * w, rr * h, w, h, -w / 2, -h / 2, w, h)
         g.restore()
      }
      return c
   }

   const tiles: TileBase[] = []
   for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
         const x = c * w
         const y = r * h
         const index = r * size + c
         tiles.push({
            id: index,
            sx: x,
            sy: y,
            sWidth: w,
            sHeight: h,
            dx: x,
            dy: y,
            scramble: makeScramble(perm[index]),
            rot: 0,
            animFrom: 0,
            animTo: 0,
            animStart: -1,
            animDuration: FLIP_DURATION,
         })
      }
   }
   return tiles
}

// Called when progress crosses a tile's threshold: start a self-contained flip.
function setTileTarget(tile: TileBase, target: number, now: number) {
   if (target === tile.animTo) return
   tile.animFrom = tile.rot
   tile.animTo = target
   tile.animStart = now
   tile.animDuration = FLIP_DURATION
}

// Map the external progress to per-tile thresholds. The rotation angle itself
// is never derived from progress — only the trigger point is.
function applyProgress(tiles: TileBase[], value: number, maxProgress: number) {
   if (!tiles.length) return
   const now = performance.now()
   const step = maxProgress > 0 ? maxProgress / tiles.length : 0
   tiles.forEach((tile, index) => {
      const reached = maxProgress > 0 && value >= (index + 1) * step
      setTileTarget(tile, reached ? FLIP_DEGREES : 0, now)
   })
}

function drawTiles(canvas: HTMLCanvasElement | null, img: HTMLImageElement, tiles: TileBase[]) {
   if (!canvas || !tiles.length) return
   const ctx = canvas.getContext('2d')
   if (!ctx) return
   if (canvas.width !== img.width) canvas.width = img.width
   if (canvas.height !== img.height) canvas.height = img.height
   ctx.clearRect(0, 0, canvas.width, canvas.height)
   for (const tile of tiles) {
      renderTile3D(ctx, img, tile, tile.dx, tile.dy, tile.rot)
   }
}

export default function ProgressAsAnImage({
   img,
   val,
   max,
   imgSize = 4,
   size,
}: {
   img: HTMLImageElement | null
   val: number
   max: number
   imgSize?: number
   size?: number
}) {
   const canvasRef = useRef<HTMLCanvasElement | null>(null)
   const tilesRef = useRef<TileBase[]>([])
   const progressRef = useRef(val)
   const maxProgressRef = useRef(max)

   // React to externally controlled progress / maxProgress
   useEffect(() => {
      progressRef.current = val
      maxProgressRef.current = max
      applyProgress(tilesRef.current, val, max)
   }, [val, max])

   // Build the grid, then run the self-contained flip animation loop.
   useEffect(() => {
      if (!img) return

      const tiles = buildTiles(img, imgSize)
      tilesRef.current = tiles
      applyProgress(tiles, progressRef.current, maxProgressRef.current)
      drawTiles(canvasRef.current, img, tiles)

      let raf = 0
      const loop = (now: number) => {
         let changed = false
         for (const tile of tiles) {
            if (tile.animStart < 0) continue
            const p = clamp((now - tile.animStart) / tile.animDuration, 0, 1)
            const eased = easeInOutCubic(p)
            tile.rot = tile.animFrom + (tile.animTo - tile.animFrom) * eased
            if (p >= 1) {
               tile.rot = tile.animTo
               tile.animStart = -1
            }
            changed = true
         }
         if (changed) drawTiles(canvasRef.current, img, tiles)
         raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)

      return () => cancelAnimationFrame(raf)
   }, [img])

   // canvas resolution stays at the image's native size; `size` only scales the CSS box (height follows the aspect ratio).
   // the aspect ratio is set up front so the box doesn't jump when the draw effect runs
   return (
      <canvas
         ref={canvasRef}
         style={{ width: size, aspectRatio: img ? `${img.width} / ${img.height}` : undefined }}
         className="border-2 border-main-border rounded-sm bg-main-darker"
      />
   )
}

// Project a point on the tile's local horizontal axis (x measured from the
// tile center) through a simple perspective camera.
function projectX(xLocal: number, cos: number, sin: number, focal: number) {
   const depth = -xLocal * sin
   const scale = focal / (focal + depth)
   return { x: xLocal * cos * scale, scale }
}

// Helper rendering function with 3D Y-axis projection
function renderTile3D(
   ctx: CanvasRenderingContext2D,
   img: HTMLImageElement,
   tile: TileBase,
   dx: number,
   dy: number,
   rotY: number,
   focalLength = 400,
) {
   const rad = (rotY * Math.PI) / 180
   const cos = Math.cos(rad)
   const sin = Math.sin(rad)

   // Before 90° we see the scrambled face; past 90° we see the back, which is
   // the correct tile. Negating the source axis keeps the correct tile
   // readable (not mirrored) once it has landed.
   const showCorrect = cos < 0
   const axisDir = showCorrect ? -1 : 1
   const srcImg = showCorrect ? img : tile.scramble
   const srcX = showCorrect ? tile.sx : 0
   const srcY = showCorrect ? tile.sy : 0

   const slices = 24
   const sliceSrcW = tile.sWidth / slices
   const sliceDstW = tile.sWidth / slices
   const halfW = tile.sWidth / 2

   // Keep the whole tile centered in its slot so it rotates in place instead
   // of sliding sideways while the perspective stretches one edge.
   const edgeA = projectX(-halfW * axisDir, cos, sin, focalLength)
   const edgeB = projectX(halfW * axisDir, cos, sin, focalLength)
   const offsetX = -(edgeA.x + edgeB.x) / 2

   ctx.save()
   ctx.translate(dx + halfW, dy + tile.sHeight / 2)

   for (let i = 0; i < slices; i++) {
      const x0 = i * sliceDstW - halfW
      const x1 = x0 + sliceDstW

      // Exact contiguous slice edges — no padding, so slices never drift or
      // leave seams as the tile turns.
      const left = projectX(x0 * axisDir, cos, sin, focalLength)
      const right = projectX(x1 * axisDir, cos, sin, focalLength)
      const mid = projectX(((x0 + x1) / 2) * axisDir, cos, sin, focalLength)

      const screenX = left.x + offsetX
      const renderedWidth = right.x - left.x
      const screenH = tile.sHeight * mid.scale

      ctx.drawImage(
         srcImg,
         srcX + i * sliceSrcW,
         srcY,
         sliceSrcW,
         tile.sHeight,
         screenX,
         -screenH / 2,
         renderedWidth,
         screenH,
      )
   }

   ctx.restore()
}
