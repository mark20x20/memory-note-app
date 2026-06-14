# Screen Spec: Flow Detail

## Screen ID

`SCR-FLOW-001`

## Purpose

The Flow Detail screen shows one grouped part of a day as a small story.

It should feel:
- focused
- emotional
- photo-led
- structurally clear

## UX Role

This screen supports:
- viewing one time/place flow
- understanding what happened in that segment
- opening related photos
- jumping into edit or place correction

## Primary Design Principle

One flow should feel like one chapter.

## Information Priority

1. hero photo or swipeable flow photos
2. time range
3. place label
4. route / movement context
5. short memo or flow summary
6. edit actions

## Layout Structure

### Header
- back
- title such as `Flow 2`
- optional edit action

### Section 1: Hero Photo Area
- one strong photo
- supporting thumbnails or swipe viewer entry

### Section 2: Flow Meta
- time range
- selected place
- category / chip

### Section 3: Route Preview
- mini route map
- pin markers

### Section 4: Related Photos
- grid or strip

### Section 5: Flow Memo
- one short narrative block

### Section 6: Actions
- `編集する`
- `場所を確認`

## Components

- flow hero section
- flow meta card
- route preview card
- related photo strip
- flow memo card
- action row

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- card background: `#FFFFFF`
- route accent: `#4FA8A1`
- primary accent: `#F26B5B`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`

### Typography

- screen title: `22 / 28 / 600 / Noto Sans JP`
- flow label: `18 / 24 / 600 / Noto Sans JP`
- meta text: `13 / 20 / 500 / Noto Sans JP`
- memo body: `14 / 22 / 400 / Noto Sans JP`

### Measurements

- page padding: `20`
- hero radius: `24`
- hero height: `280`
- route card height: `160`
- photo thumbnail: `64`
- CTA height: `52`

## Related Screens

- `07_memory_preview_screen.md`
- `08_memory_edit_screen.md`
- `10_place_detail_screen.md`
