# Screen Spec: Memory Preview

## Screen ID

`SCR-PREVIEW-001`

## Purpose

The Memory Preview screen is the emotional checkpoint between automatic generation and manual editing.

This screen should make users feel:
- the app understood their day
- the photos, time, and places have already become a story
- they can review safely before editing anything
- continuing to edit will polish the memory, not rebuild it

## Relation To Phase 12.5G-4

This screen matches the decision to separate:
- preview = a calm review surface
- edit = an intentional correction surface

The preview screen should therefore:
- prioritize reading and browsing
- reduce accidental edits
- make the generated result feel trustworthy

## UX Role

This page supports the transition:
- photo upload completed
- automatic grouping finished
- place candidates and flow generated
- user reviews the output
- user chooses to publish or edit

## Primary Design Principle

Preview is for confidence, not for work.

Users should first see:
1. what kind of memory was created
2. how the day was grouped
3. whether the title, time, and places feel right

Only after that should they choose to edit.

## Information Priority

1. memory hero photos
2. title + date + place summary
3. event flow blocks by time
4. route / map preview
5. AI diary preview
6. publish or edit actions

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

### Section 2: Generation Confidence Card

This reassures the user before they inspect details.

Contents:
- `写真 18枚から思い出を作成しました`
- `3つの流れに整理`
- `2つの場所を推定`
- optional note if some metadata is partial

Style:
- soft cream or white card
- supportive icons
- calm success tone, not technical

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

### Section 5: AI Diary Preview

Contents:
- section title such as `思い出メモ下書き`
- 3 to 6 lines of AI-generated diary text
- optional “続きを読む”

Style:
- elegant editorial card
- readable line-height
- slightly warmer paper feel than normal cards

### Section 6: Review Checklist

This is a compact confirmation zone.

Items:
- title looks right
- time flow looks right
- place names mostly correct
- selected cover feels right

Pattern:
- check rows with optional warning emphasis
- not interactive toggles, just visual review cues

### Section 7: Bottom Action Area

Primary action:
- `この内容で作成`

Secondary action:
- `編集して整える`

Tertiary action:
- `写真を見直す`

Rules:
- primary CTA stays warm and confident
- edit is clearly available but secondary
- if sticky footer is used, keep it soft and not too tall

## Interaction States

### State A: Fully Ready

Show:
- full preview sections
- strong create CTA
- edit CTA below

### State B: Partial Place Confidence

Show:
- soft amber badge on affected flow cards
- clear edit invitation
- do not block note creation

### State C: Long Trip / Many Photos

Show:
- vertically stacked flow cards
- cap visible thumbnails per flow
- use `+N` badge for overflow

### State D: Viewer Only

If permissions are limited in shared notes:
- hide edit CTA
- keep create/publish wording adjusted if needed

## Components

- preview header
- hero image block
- thumbnail strip
- generation confidence card
- event flow timeline cards
- route preview card
- diary preview card
- review checklist card
- dual bottom CTA area

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
- it must feel more emotional than technical
- the timeline should feel scrapbook-like, not enterprise-like
- let photos and whitespace do most of the work

## Handoff To Edit Screen

The transition to edit should feel like:
- `内容を壊す` ではなく `整える`
- `やり直し` ではなく `気になるところだけ直す`

The edit button should therefore feel:
- accessible
- safe
- intentional
