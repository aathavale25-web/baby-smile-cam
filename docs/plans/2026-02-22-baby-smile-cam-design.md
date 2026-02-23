# Baby Smile Cam — Design Document
**Date:** 2026-02-22

## Overview

A web app that uses the device's front-facing camera and MediaPipe FaceLandmarker to detect a baby's face, display fun static overlays (hats, glasses, animal ears), and automatically capture a photo when a smile is detected. Captured photos are stored in an in-session gallery.

## Stack

- React + Vite
- Tailwind CSS v4
- `@mediapipe/tasks-vision` (FaceLandmarker)
- Canvas API (overlay drawing + photo capture)
- No backend, no persistence across sessions

## Core Loop

1. `getUserMedia` grabs the front-facing camera → feeds into a hidden `<video>` element
2. A `requestAnimationFrame` loop passes each frame to MediaPipe FaceLandmarker
3. MediaPipe returns 478 face landmarks + blendshape scores (including `mouthSmile`)
4. Overlays are drawn on a `<canvas>` layered over the video using landmark coordinates
5. When `mouthSmile` score > 0.65 for 3 consecutive frames, capture is triggered
6. Canvas is captured via `toDataURL('image/jpeg', 0.9)` and stored in React state
7. 3-second cooldown prevents burst captures

## Layout

```
┌─────────────────────────────────────┐
│           Baby Smile Cam            │  ← header
├─────────────────────────────────────┤
│                                     │
│         [ CAMERA + CANVAS ]         │  ← full-width, 16:9, mirrored
│         (overlays drawn here)       │
│                                     │
├─────────────────────────────────────┤
│  🎩  👓  🐰  🐸  🦋  🤠           │  ← overlay selector strip
├─────────────────────────────────────┤
│  Smile Gallery (scrollable row)     │
│  [📷][📷][📷][📷]                  │  ← captured photos + download
└─────────────────────────────────────┘
```

Responsive: stacked on mobile/tablet, camera centered on desktop.

## Components

| Component | Responsibility |
|---|---|
| `CameraCanvas` | Video stream, draws video + overlays on canvas each frame |
| `OverlaySelector` | Horizontal strip to pick active overlay |
| `SmileDetector` | MediaPipe loop, fires callback on smile detection |
| `Gallery` | Scrollable strip of captured images with download + clear |
| `CaptureFlash` | Single-frame white flash on capture |

## Overlays

6 pre-bundled PNG overlays, positioned using MediaPipe face landmarks:

| Overlay | Anchor Landmarks |
|---|---|
| 🎩 Top hat | Above forehead |
| 👓 Glasses | Nose bridge + ear tips |
| 🐰 Bunny ears | Top of head |
| 🐸 Frog head | Full head bounds |
| 🦋 Butterfly | Nose bridge |
| 🤠 Cowboy hat | Above forehead |

## Smile Detection Parameters

| Parameter | Value |
|---|---|
| `mouthSmile` blendshape threshold | `0.65` |
| Consecutive frames required | `3` |
| Capture cooldown | `3 seconds` |

## Gallery

- Horizontal scrollable strip
- Each photo: image (overlay baked in), timestamp, download button
- "Clear All" button
- Empty state message
- Max 20 photos per session (oldest dropped)

## Camera UX

- Mirrored horizontally (selfie-style)
- Toggle button for front/back camera
- Graceful permission denied error state

## Explicitly Out of Scope

- No sound effects
- No persistence across sessions
- No social sharing
- No user accounts
- No settings screen
