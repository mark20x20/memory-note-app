# Screen Spec: Memory Detail

## Screen ID

`SCR-NOTE-001`

## Purpose

The Memory Detail screen is the heart of the product.
It is where a memory becomes something the user can revisit, feel, browse, and share.

This screen should feel like opening a refined scrapbook page built from real moments.

## UX Role

The page should help users:
- re-experience the memory emotionally
- browse photos naturally
- understand time and place
- read or edit the diary
- move to sharing or collaboration

## Primary Design Principle

Memory Detail should feel like opening a refined scrapbook page.

It should prioritize:
- emotional recall first
- clear story structure second
- utility actions third

## Two Photo Variants

This screen supports two valid photo presentation patterns.

### Variant A: Multi-Photo Overview

Best when:
- users want to scan the whole trip or event quickly
- a memory note contains many photos
- the product emphasizes grouped moments and overview

### Variant B: Swipe-First Carousel

Best when:
- users want to immerse themselves in one photo at a time
- the note is emotionally rich
- premium storytelling is the goal

## Information Priority

Shared across both variants:

1. photos
2. memory title and date
3. short diary or AI memory text
4. place and route information
5. supporting metadata and collaboration

## Layout Structure

Shared page sections for both variants:

All variants should contain these sections:
- top photo area
- title and date block
- diary block
- visited places block
- map block or map card
- member / collaboration block
- actions for edit and share

## Variant A: Multi-Photo Overview

### Visual Goal

Show the note as a cluster of moments.

### Top Area

Use:
- one large hero photo
- 3 to 5 supporting photos arranged beneath or beside it

Preferred layout:
- one large top image
- below it, a rounded collage row or 2-column grid

Rules:
- one image must clearly dominate
- supporting images should feel curated, not mechanical
- if there are many photos, show a `+N` indicator in the last tile

### Title Block

Contents:
- memory title
- date range
- location summary

Typography:
- title: `24`
- date/location: `13` to `14`

### Diary Card

Contents:
- short diary excerpt or full diary preview
- optional `続きを読む`

Style:
- white rounded card
- generous line height
- warm, calm text hierarchy

### Photo Access

Below the collage:
- tap any photo to open full-screen swipe viewer

This keeps overview first, immersion second.

### Best Use

Recommended when:
- the note has 6+ photos
- travel flow matters
- the user is revisiting an entire outing

## Variant B: Swipe-First Carousel

### Visual Goal

Let the user emotionally enter the memory one frame at a time.

### Top Area

Use:
- one large swipeable photo carousel
- page indicator or soft index counter

Preferred layout:
- large immersive photo frame near the top
- horizontal swipe
- subtle thumbnail strip or compact dot indicator below

Rules:
- the current photo should feel cinematic and quiet
- controls must be minimal
- page indicator should never overpower the image

### Title Block

Place directly under the carousel:
- memory title
- date range
- location summary

Typography:
- title: `24`
- date/location: `13` to `14`

### Optional Thumbnail Strip

Add only if the note has many photos.

Rules:
- small rounded thumbnails
- horizontal strip
- selected photo clearly highlighted
- strip must remain secondary to the hero image

### Diary Card

Same general rules as Variant A, but it should sit slightly lower so the user experiences the photo first.

### Best Use

Recommended when:
- the note has fewer but stronger photos
- emotional storytelling is the priority
- the app wants a more premium, immersive feeling

## Shared Supporting Sections

### Visited Places Section

Contents:
- place chips or place cards
- link to detailed places screen
- confirmation status if useful

Style:
- soft teal accents
- calm supporting role

### Map Card

Contents:
- mini route or place summary map
- link to full map screen

Rules:
- map must not dominate the page
- use it as orientation support

### Member Section

Contents:
- owner/editor/viewer avatars
- shared note context

Rules:
- compact
- visually quiet

### Action Row

Primary actions:
- `共有`
- `編集`

Secondary actions:
- `地図で見る`
- `写真を見る`

## Components

- immersive image area
- collage or carousel
- title block
- date/location chips
- diary card
- place section
- map card
- member avatar group
- action buttons

## Font Sizes

- title: `24`
- section title: `20`
- diary body: `15`
- meta text: `13`
- chip text: `12`

## Spacing Rules

- page horizontal padding: `20`
- hero to title gap: `16`
- major section gap: `24` to `32`
- collage inner gap: `8`
- thumbnail strip gap: `8`

## Recommendation

If only one default is chosen for the app, prefer:
- `Swipe-First Carousel` for the top hero area
- with optional smaller overview access below

Reason:
- it better matches the emotional goal of Memory Note
- it makes photos feel more valuable
- it creates a stronger premium identity

If fast browsing is more important than immersion, use Multi-Photo Overview as the primary mode.

## Edge States

### Few Photos

If only 1 to 2 photos exist:
- do not force collage
- use larger hero presentation

### Many Photos

If many photos exist:
- keep top area selective
- send the full set to a dedicated viewer

### Missing Place Data

- keep places section visible but calm
- allow manual or absent state gracefully

## Related Future Screen

A dedicated full photo viewer can extend Variant B with:
- full-screen swipe
- zoom
- date and place overlay

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- section card: `#FFFFFF`
- map accent: `#4FA8A1`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`

### Typography

- title: `24 / 30 / 600 / Noto Sans JP`
- section title: `20 / 26 / 600 / Noto Sans JP`
- diary body: `15 / 24 / 400 / Noto Sans JP`
- meta text: `13 / 20 / 500 / Noto Sans JP`
- chip text: `12 / 18 / 500`

### Measurements

- page padding: `20`
- hero radius: `28`
- hero height: `380`
- thumbnail size: `64`
- section card radius: `20`
- button height: `48` to `52`
