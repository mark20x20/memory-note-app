# Screen Spec: Share Card

## Screen ID

`SCR-CARD-001`
`SCR-CARD-002`
`SCR-CARD-003`
`SCR-CARD-004`

## Purpose

The Share Card screen turns a memory note into a beautiful visual card for social sharing.

This screen should make the user feel:
- this memory looks worth sharing
- the card represents the feeling of the memory
- the app makes memories look polished and special

## UX Role

The Share Card screen should help users:
- preview a memory in share-ready form
- choose the best aspect ratio
- confirm what information appears
- save or share with confidence

## Primary Design Principle

Share Card should feel like guided curation, not graphic editing.

It should prioritize:
- emotional share-worthiness
- readability
- elegance over customization overload

## Core Experience

This is not a graphic editor.
It is a guided, elegant presentation surface that transforms memory notes into emotionally resonant share visuals.

## Information Priority

1. hero image
2. card composition preview
3. format selection
4. title / date / place / diary excerpt
5. save and share actions

## Layout Structure

### Header Area

Contents:
- title such as `共有カード`
- subtitle such as `思い出をきれいにまとめる`
- optional close action

Typography:
- title: `24`
- subtitle: `13` to `14`

### Section 1: Format Selector

This appears near the top.

Contents:
- 3 format chips or segmented controls
  - `1:1`
  - `4:5`
  - `9:16`

Rules:
- selected format should be clearly highlighted
- selector should feel elegant, not technical
- coral is the primary active accent

### Section 2: Share Card Preview

This is the visual hero of the page.

Contents:
- large live preview card
- hero image
- title
- date
- place summary
- short diary excerpt
- mini map
- subtle brand mark such as `Memory Note`

Rules:
- the photo must lead the composition
- text should support the image, not cover too much of it
- the mini map should feel tasteful and compact
- avoid cluttered social-poster energy

### Composition Rules

The card should feel:
- editorial
- warm
- elegant
- easy to read at small social sizes

Use:
- one main photo
- one compact text block
- one mini map or location cue

Avoid:
- too many photos in the main share layout
- too much diary text
- heavy decorative frames

### Section 3: Card Information Controls

Optional controls for what to show:
- title on/off
- date on/off
- place on/off
- diary excerpt on/off
- map on/off

Rules:
- controls should stay secondary
- the screen should still feel preview-first

### Section 4: Save / Share Actions

Primary actions:
- `画像を保存`
- `共有する`

Secondary actions:
- `形式を変える`
- `内容を調整`

Rules:
- saving and sharing must feel final and reassuring
- avoid too many equal-priority controls

## Format Behavior

### Format A: 1:1

Best for:
- square post previews
- compact balanced composition

Layout:
- centered hero image
- shorter text block
- mini map in corner or lower strip

### Format B: 4:5

Best for:
- feed-first social sharing
- strong portrait photo presentation

Layout:
- larger photo dominance
- text block under or over lower area
- map compact and secondary

### Format C: 9:16

Best for:
- story-style sharing
- immersive vertical memory expression

Layout:
- tall image-first composition
- elegant bottom overlay or lower stacked information block
- stronger cinematic feeling

## Components

- page header
- format selector
- large preview card
- info toggle rows
- primary action buttons
- secondary control links

## Font Sizes

- page title: `24`
- preview card title: `20`
- diary excerpt: `14`
- date/place meta: `12`
- brand mark: `11`

## Spacing Rules

- page horizontal padding: `20`
- format selector to preview gap: `16`
- preview to controls gap: `20`
- action button gap: `12`
- section gap: `24`

## Visual Notes

- this page should feel especially polished
- photos should look premium and emotionally rich
- map and metadata should add meaning, not clutter
- the overall card should be beautiful enough that users want to share it immediately

## Empty / Fallback Notes

If no usable hero image is available:
- choose best available photo automatically
- keep the preview intact

If map data is unavailable:
- remove or mute map block gracefully

If diary text is unavailable:
- use title, date, and place only

## Recommended Default

If one format is emphasized first:
- default to `4:5`

Reason:
- strongest balance between photo impact and readability
- works well for many modern social contexts

## Related Screens

- Memory Detail
- Full Photo View
- OS Share Sheet

## Detailed Style Tokens

### Colors

- base background: `#FAF7F2`
- card background: `#FFFFFF`
- primary accent: `#F26B5B`
- map accent: `#4FA8A1`
- text primary: `#2E2A27`
- text secondary: `#7A746D`

### Typography

- title: `22 / 28 / 600 / Noto Sans JP`
- date/location: `13 / 20 / 500`
- diary line: `14 / 22 / 400 / Noto Sans JP`
- chip text: `12 / 18 / 600`

### Measurements

- square export: `1080 x 1080`
- portrait export: `1080 x 1350`
- story export: `1080 x 1920`
- card radius: `32`
- hero image radius: `24`
- chip height: `28`
