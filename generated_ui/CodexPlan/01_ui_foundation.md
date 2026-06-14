# UI Foundation

## Product Feel

Memory Note should feel like a private scrapbook made into a polished mobile app.

Keywords:
- photo-first
- warm cream surfaces
- soft depth
- memory scrapbook
- editorial calm
- modern Japanese mobile app
- elegant but approachable

## Visual Principles

### 1. Photos Lead

Photos are the emotional anchor of the app.
Text, maps, and metadata support the photos instead of competing with them.

Rules:
- large imagery should appear early in the page
- image cards should have breathing room
- avoid dense grids unless the screen is explicitly a photo gallery
- hero photos should feel immersive, not thumbnail-like

### 2. Calm Information Density

The app contains many kinds of information:
- photos
- date/time
- places
- AI diary
- collaboration
- share actions

This must be layered gently.

Rules:
- show primary content first
- collapse secondary metadata into chips, rows, or cards
- never let maps or metadata visually overpower photography

### 3. Memory Before Utility

Even functional screens like map and calendar should feel like memory surfaces.

Rules:
- integrate photo previews into map and calendar screens
- avoid harsh dashboard-style layouts
- use soft grouping and narrative ordering

## Color System

### Base

- App background: `#FAF7F2`
- Secondary background: `#FFF9F4`
- Card background: `#FFFFFF`
- Soft section background: `#F4EEE6`

### Accent

- Primary coral: `#F26B5B`
- Coral strong: `#FF7A6B`
- Map teal: `#4FA8A1`
- Map teal soft: `#5BAE9B`

### Text

- Primary text: `#2E2A27`
- Secondary text: `#7A746D`
- Divider: `#E8DED4`
- Disabled: `#D9CDBF`

## Typography

Use a clean, natural, modern sans serif with soft personality.
Avoid overly geometric or harsh UI typography.

Recommended implementation direction:
- headings: semibold
- body: regular or medium
- captions: regular

### Type Scale

- Display / hero title: `28`
- Screen title: `24`
- Section title: `20`
- Card title: `18`
- Body: `15`
- Secondary body: `14`
- Caption: `12`
- Small meta label: `11`

### Typography Rules

- line height should feel airy, not cramped
- diary text should be highly readable and slightly relaxed
- metadata should be visually quieter than titles
- Japanese text should never feel too tightly packed

## Spacing

Use soft spacing with a premium mobile rhythm.

Spacing scale:
- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`

Rules:
- page horizontal padding: `20`
- section gap: `24` to `32`
- card inner padding: `16`
- chip gap: `8`
- tight metadata row gap: `6` to `8`

## Shape

- primary card radius: `24`
- secondary card radius: `20`
- small chip radius: `999`
- image radius: `20` to `28`
- buttons: rounded, soft, never sharp

## Shadows

Shadows should be subtle.

Rules:
- low blur soft shadow
- avoid heavy floating card feel
- use depth to separate content, not to dramatize it

## Icon Tone

- simple line or softly filled icons
- rounded icon containers where helpful
- map/location icons can use teal
- primary actions can use coral

## Component Tone

### Buttons

- primary: coral fill with white text
- secondary: white or cream fill with coral or dark text
- tertiary: text-only or light outline

### Chips

- place chips: teal-tinted
- date/time chips: sand/cream
- collaboration chips: neutral with gentle accent

### Cards

- cards should read like memory blocks
- a card should usually contain either one strong photo or one clear information theme

## What To Avoid

- crowded dashboards
- heavy dark themes as default
- neon accents
- sharp corners
- tiny text
- gray wireframe look
- overly social-feed-like UI
- travel booking visual language
