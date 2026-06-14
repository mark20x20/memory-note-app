# Screen Spec: Create Memory

## Screen ID

`SCR-CREATE-001`
`SCR-CREATE-002`

## Purpose

The Create Memory screen is the entry point for building a memory note from multiple photos.

This screen should make users feel:
- it is easy to begin
- photos are the main material
- time and place grouping will help them
- they are creating a memory page, not filling out a form

## UX Role

This screen must support the transition from:
- selecting photos
- understanding what was selected
- trusting auto-processing
- moving into note creation naturally

## Primary Design Principle

Photos must come before form fields.

Users should first feel:
- what photos they chose
- what kind of trip or moment those photos represent

Only after that should the app ask for edits or confirmations.

## Information Priority

1. selected photos
2. memory grouping hint by time and place
3. progress or readiness state
4. note draft continuation action
5. secondary controls

## Layout Structure

### Header Area

Contents:
- page title such as `思い出を作る`
- small helper text such as `写真を選ぶと、時間と場所でまとめます`
- optional close or cancel action

Typography:
- title: `24`, semibold
- helper: `13` to `14`, regular

### Section 1: Photo Selection Hero

This is the main entry card.

Contents:
- large rounded upload/photo area
- soft prompt text
- selected count if photos exist
- primary action button

No-photo state:
- large warm placeholder frame
- icon or subtle image symbol
- text: `写真を選択`
- helper: `複数枚まとめて追加できます`

Selected state:
- dominant first photo large
- smaller supporting photos in a cluster or grid
- count label like `12枚選択中`

Sizes:
- hero area height: `260` to `320`
- main prompt: `18`
- helper: `13`

### Section 2: Auto Grouping Preview

This is the intelligence reassurance block.

Contents:
- section title such as `自動で整理されます`
- 2 or 3 small cards previewing grouping concepts

Example preview cards:
- `時間ごとに流れを整理`
- `場所ごとに思い出を整理`
- `AIで下書きを作成`

Tone:
- informative, calm, supportive
- should reduce anxiety and effort

Layout:
- stacked or horizontal mini cards
- icon + short label + one line explanation

### Section 3: Selected Photo Review

If photos are selected, show a curated review area.

Preferred layout:
- one featured large photo
- below it, a soft 2-column grid of supporting photos

Alternative for many photos:
- horizontally scrollable row with one highlighted card

Rules:
- avoid uniform technical grid feeling
- preserve warmth and storytelling
- keep corners rounded and spacing soft

### Section 4: Metadata Confidence Hint

This area quietly explains what the app detected.

Contents:
- date range
- number of place candidates or place-ready status
- GPS available / partially available / unavailable

This must be secondary.

Use:
- chips
- small rows
- muted labels

Typography:
- label: `11` to `12`
- value: `13` to `14`

### Section 5: Bottom Action Area

Primary action:
- `下書きを作成`
- or `この写真で始める`

Secondary actions:
- `写真を追加`
- `並び替え`
- `選び直す`

Rules:
- primary action must be visually obvious
- action area should feel stable and confident
- avoid too many equal-weight buttons

## Interaction States

### State A: Empty

The user has not selected any photo yet.

Show:
- large warm placeholder
- one strong coral primary button
- very little extra information

### State B: Selecting

The user is choosing photos or has just returned from the picker.

Show:
- selection animation or soft transition
- selected count
- clear next step

### State C: Processing

The app is checking:
- EXIF
- date/time
- GPS
- upload readiness

Show:
- progress card
- reassuring language
- no technical jargon

Preferred text style:
- `撮影日時や場所を整理しています`
- `思い出をまとめる準備中です`

### State D: Ready

The app has enough information to continue.

Show:
- selected photos
- grouping hints
- strong continue button

### State E: Partial Metadata

Some photos are missing GPS or date information.

Show:
- calm warning card
- do not block if not necessary
- explain fallback simply

Example direction:
- `一部の写真で場所情報が見つかりませんでした`
- `あとから手動で調整できます`

## Components

- page header
- hero upload card
- selected photo cluster
- grouping preview mini cards
- metadata chips
- progress status card
- primary CTA button
- secondary text actions

## Font Sizes

- page title: `24`
- hero prompt: `18`
- section title: `20`
- card label: `15`
- body: `14`
- caption: `12`
- micro label: `11`

## Spacing Rules

- page horizontal padding: `20`
- header to hero gap: `20`
- major section gap: `24` to `28`
- photo cluster gap: `8` to `12`
- action button spacing: `12`

## Visual Notes

- this screen should feel hopeful and light
- users should feel invited to begin, not pressured to configure
- the screen should celebrate the chosen photos immediately
- visual energy should come from imagery, not heavy controls

## Empty State Copy Direction

Suggested copy tone:
- `写真から思い出ノートを作りましょう`
- `旅の流れや訪れた場所も、あとで見返しやすく整理します`

## Error / Fallback Notes

If photo permission is denied:
- show one permission help card
- keep the page visually gentle

If picker fails:
- show retry action inside the hero area

If metadata is unavailable:
- continue flow should still feel possible

## Relation To Next Screens

This screen should hand off visually and emotionally to:
- AI preview
- Memory detail draft
- upload / processing states

The photo styling here should match the detail screen so the experience feels continuous.

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- upload card: `#FFFFFF`
- helper card: `#F8F1E8`
- primary button: `#F26B5B`
- primary text: `#2E2A27`
- secondary text: `#7A746D`
- border: `#E8DED4`

### Typography

- page title: `24 / 30 / 600 / Noto Sans JP`
- hero prompt: `18 / 24 / 600 / Noto Sans JP`
- section title: `20 / 26 / 600 / Noto Sans JP`
- body: `14 / 22 / 400 / Noto Sans JP`
- caption: `12 / 18 / 400 / Noto Sans JP`

### Measurements

- page padding: `20`
- upload hero radius: `24`
- upload hero height: `280`
- CTA height: `52`
- preview thumbnail size: `72`
- card padding: `16`
