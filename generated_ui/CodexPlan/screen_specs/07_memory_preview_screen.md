# Screen Spec: Memory Preview

## Screen ID

`SCR-PREVIEW-001`

## Purpose

The Memory Preview screen is a quiet, emotional reading surface for the memory itself.

This screen should make users feel:
- they are opening a memory page, not checking system output
- the day has already become a story
- photos, time, and place are enough to relive the moment
- if something needs adjustment, edit is available without breaking immersion

## Relation To Phase 12.5G-4

This screen matches the separation of:
- preview = experience the note
- edit = adjust and correct the note

The preview screen should therefore:
- focus on the memory only
- hide process language and system explanations
- keep a simple route to the edit screen

## UX Role

This page supports the transition:
- the note draft exists
- the user experiences it as a memory page
- the user either keeps reading or opens edit

## Primary Design Principle

Preview is for feeling, not for checking.

Users should first see:
1. the emotional tone of the day
2. the photos and the flow of time
3. the places as part of the story

If something feels off, edit should be available quietly.

## Information Priority

1. memory hero photos
2. title + date + place summary
3. event flow blocks by time
4. route / map preview
5. memory note text
6. edit route

## Layout Structure

This screen may be long and vertically scrollable.

Recommended order:

### Header Area

Contents:
- back action
- page label such as `プレビュー`
- subtle save state like `自動作成済み`

Typography:
- title: `22` to `24`, semibold
- helper: `12` to `13`

### Section 1: Preview Hero

This is the emotional first view.

Contents:
- one large hero photo
- 2 to 4 supporting thumbnails
- memory title
- date range
- area summary

Recommended layout:
- tall featured image at top
- rounded thumbnail strip below
- title block directly underneath

Sizes:
- hero height: `320` to `420`
- thumbnail size: `64` to `76`
- title: `24`
- date/location: `13` to `14`

### Section 3: Event Flow Timeline

This is the core of the screen.

The day should be shown as grouped memory blocks.

Each flow card contains:
- flow number chip like `Flow 1`
- time range
- place label
- 1 featured photo
- 2 to 6 supporting photos
- one short summary line

Recommended flow card layout:
- left: vertical timeline connector
- right: large rounded content card

Flow card order:
1. time range row
2. place name / confidence badge
3. photo collage
4. one-line memory summary
5. secondary action like `詳細を見る`

Card sizes:
- flow card image block height: `160` to `220`
- flow title: `18`
- body: `14`
- caption: `12`

### Section 4: Route Preview Card

This shows the movement gently.

Contents:
- mini map or stylized route strip
- numbered pins
- start to end location labels
- short movement summary

Rules:
- route is supportive, not the hero
- use teal accent and thin line
- no dense map controls

### Section 5: Memory Note

Contents:
- section title such as `思い出メモ`
- 3 to 6 lines of memory text
- optional `続きを読む`

Style:
- elegant editorial card
- readable line-height
- slightly warmer paper feel than normal cards

### Section 6: Bottom Action Area

Primary visible action:
- `編集する`

Optional secondary action:
- `共有を見る`

Rules:
- keep actions minimal
- do not present system confirmation language
- edit should be available but should not dominate the page
- if sticky footer is used, keep it visually light

## Interaction States

### State A: Standard

Show:
- full preview sections
- light edit CTA

### State B: Partial Place Confidence

Show:
- soft ambiguity in place label only if needed
- no technical warning block on preview
- edit route available for correction

### State C: Long Trip / Many Photos

Show:
- vertically stacked flow cards
- cap visible thumbnails per flow
- use `+N` badge for overflow

### State D: Viewer Only

If permissions are limited in shared notes:
- hide edit CTA
- keep the screen purely view-focused

## Components

- preview header
- hero image block
- thumbnail strip
- event flow timeline cards
- route preview card
- memory note card
- minimal bottom action area

## Font Sizes

- page title: `24`
- memory title: `24`
- section title: `20`
- flow title: `18`
- body: `14`
- caption: `12`
- micro label: `11`

## Spacing Rules

- page horizontal padding: `20`
- hero bottom gap: `20`
- major section gap: `24` to `32`
- flow card inner padding: `16`
- thumbnail gap: `8`
- CTA top gap: `28`

## Visual Notes

- this screen should feel like opening a polished first draft
- it must feel fully emotional and non-technical
- the timeline should feel scrapbook-like, not enterprise-like
- let photos and whitespace do most of the work
- remove all unnecessary system explanation language

## Handoff To Edit Screen

The transition to edit should feel like:
- `修正作業に入る`
- not `確認作業を続ける`

The edit button should therefore feel:
- quiet
- safe
- always available when needed

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- flow card background: `#FFFFFF`
- memory note card: `#F8F1E8`
- route accent: `#4FA8A1`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`

### Typography

- screen title: `24 / 30 / 600 / Noto Sans JP`
- memory title: `24 / 30 / 600 / Noto Sans JP`
- flow title: `18 / 24 / 600 / Noto Sans JP`
- body: `15 / 24 / 400 / Noto Sans JP`
- meta text: `13 / 20 / 500 / Noto Sans JP`
- micro label: `11 / 16 / 500 / Inter`

### Measurements

- page padding: `20`
- hero radius: `28`
- hero height: `360`
- thumbnail size: `68`
- flow card radius: `20`
- route preview height: `160`
- edit CTA height: `52`
