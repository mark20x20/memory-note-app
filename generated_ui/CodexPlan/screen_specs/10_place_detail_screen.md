# Screen Spec: Place Detail / Candidate Confirmation

## Screen ID

`SCR-PLACE-001`

## Purpose

This screen helps users trust or correct one detected place group.

It should feel:
- clear
- calm
- trustworthy
- correction-friendly

## UX Role

This screen supports:
- viewing one selected place group
- comparing place candidates
- seeing a small map context
- confirming or manually adjusting the result

## Primary Design Principle

Clarity before density.

Users should immediately understand:
- which place is currently selected
- what the alternatives are
- how to correct it if needed

## Information Priority

1. selected place
2. supporting map context
3. candidate list
4. related photos
5. correction actions

## Layout Structure

### Header

Contents:
- back
- screen title
- optional `編集` or `保存`

### Section 1: Selected Place Card

Contents:
- place name
- category
- confidence / status badge
- optional distance-style helper

### Section 2: Mini Map

Contents:
- calm map preview
- numbered pin
- route context if useful

### Section 3: Candidate List

Contents:
- stacked candidate rows
- selected state
- distance / category / confidence helper

### Section 4: Related Photos

Contents:
- photo strip from this place group

### Section 5: Action Area

Actions:
- `この場所にする`
- `地図で確認`
- `手動で修正`

## Interaction States

### High Confidence
- selected place feels stable

### Low Confidence
- candidate list becomes visually more important

### Manual Correction
- entry point should be obvious but secondary

## Components

- selected place card
- place status badge
- mini map
- candidate picker list
- related photo strip
- action footer

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- selected card: `#FFFFFF`
- map accent: `#4FA8A1`
- map accent soft: `#DFF3F1`
- primary accent: `#F26B5B`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`
- success: `#4CAF50`
- warning: `#FF9500`

### Typography

- screen title: `24 / 30 / 600 / Noto Sans JP`
- place title: `18 / 24 / 600 / Noto Sans JP`
- category text: `13 / 20 / 500 / Noto Sans JP`
- candidate meta: `12 / 18 / 400 / Noto Sans JP`
- status badge: `11 / 16 / 600 / Inter`

### Measurements

- page padding: `20`
- card radius: `20`
- map height: `180`
- candidate row min height: `68`
- photo thumbnail size: `64`
- primary CTA height: `52`

## Related Screens

- `04_map_screen.md`
- `08_memory_edit_screen.md`
- `12_flow_detail_screen.md`
