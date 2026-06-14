# Screen Spec: Full Photo Viewer

## Screen ID

`SCR-PHOTO-001`

## Purpose

The Full Photo Viewer is the most immersive photo surface in the app.

It should feel:
- cinematic
- quiet
- emotional
- uncluttered

## UX Role

This screen supports:
- one-photo-at-a-time viewing
- smooth swipe browsing
- optional date and place context
- return to note, flow, or preview naturally

## Primary Design Principle

The photo is the main content.

Everything else must stay secondary.

## Information Priority

1. current photo
2. swipe position
3. optional date / place overlay
4. close action
5. optional thumbnail strip

## Layout Structure

### Header Overlay

Contents:
- close button
- index such as `3 / 18`
- optional overflow menu

Rules:
- overlay only
- no heavy top bar

### Main Photo Stage

Contents:
- full-screen photo
- swipe horizontally
- pinch zoom is future-friendly but not required in the first pass

### Info Overlay

Optional lower overlay:
- date
- place name
- short memo excerpt

Rules:
- gradient-backed if needed
- keep very compact

### Optional Thumbnail Rail

Use only when needed:
- bottom horizontal strip
- current photo highlighted

## Interaction States

### Standard
- immersive photo
- light overlays only

### Many Photos
- show thumbnail rail

### Missing Metadata
- omit date / place calmly

## Components

- viewer overlay header
- paged photo carousel
- metadata overlay
- optional thumbnail rail

## Detailed Style Tokens

### Colors

- background: `#0F0E0D`
- overlay gradient start: `rgba(15,14,13,0.00)`
- overlay gradient end: `rgba(15,14,13,0.60)`
- text primary: `#FFFFFF`
- text secondary: `rgba(255,255,255,0.78)`
- accent: `#F26B5B`

### Typography

- index: `13 / 18 / 600 / Inter`
- place label: `14 / 20 / 600 / Noto Sans JP`
- date label: `12 / 18 / 500 / Inter`
- memo excerpt: `13 / 20 / 400 / Noto Sans JP`

### Measurements

- close tap area: `44 x 44`
- overlay horizontal padding: `20`
- thumbnail size: `56`
- selected thumbnail border: `2`

## Related Screens

- `03_memory_detail_screen.md`
- `07_memory_preview_screen.md`
- `12_flow_detail_screen.md`
