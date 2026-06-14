# Screen Spec: Calendar

## Screen ID

`SCR-MAP-002`

## Purpose

The Calendar screen lets users revisit memories by date.

This is not a productivity calendar.
It is a memory access screen where dates become emotional entry points.

## UX Role

The Calendar screen should help users:
- find memories from a specific day
- notice days that contain meaningful moments
- jump from a date to a memory note quickly
- rediscover recent or older moments in a calm way

## Core Experience

The emotional goal is:
- to make time feel browsable
- to turn dates into memory anchors
- to keep the experience warm and reflective instead of administrative

## Information Priority

1. current month calendar
2. selected date state
3. memory cards for the selected day
4. month context and small summary
5. optional related access such as On This Day

## Layout Structure

### Header Area

Contents:
- title such as `カレンダー`
- subtitle such as `日付から思い出を見る`
- optional month jump or filter action

Typography:
- title: `24`
- subtitle: `13` to `14`

### Section 1: Month Calendar

This is the main structure block at the top.

Contents:
- month label
- left and right month navigation
- clean calendar grid
- selected date highlight
- dates containing memories marked softly

Rules:
- keep the calendar visually calm
- do not overload with color
- memory dates should use gentle indicators, not harsh badges

Preferred indicators:
- soft coral dot
- small filled cream/coral pill
- subtle image-tinted marker if elegant

Selected date state:
- slightly stronger coral or warm tinted highlight
- clear but soft

### Section 2: Selected Date Summary

Immediately below the calendar, show a short date summary.

Contents:
- selected date label
- memory count such as `この日に3件の思い出`
- optional soft helper text

Style:
- light, secondary, compact

### Section 3: Memory Cards For The Day

This is the emotional content area.

Recommended layout:
- vertical stack of rounded cards

Each card contains:
- photo thumbnail or image-led top area
- memory title
- place summary
- short diary excerpt
- optional member avatars or shared badge

Rules:
- cards should feel richer than the calendar itself
- image should lead the card
- date does not need to dominate because the user already selected it

### Section 4: Optional Month Reflection Block

Optional secondary area below daily cards.

Contents:
- small month summary such as `今月の思い出`
- favorite or highlighted memory

Use only if the screen feels balanced.

### Section 5: Bottom Navigation

Primary nav:
- Home
- Map
- Create
- Calendar
- Settings

Calendar should be active.

## Interaction Model

### Tap Date With Memories

Result:
- selected date updates
- daily memory cards update below

### Tap Date Without Memories

Result:
- selected date updates
- calm empty state appears

### Swipe Month Or Tap Arrows

Result:
- move to next or previous month
- maintain the gentle tone

### Tap Memory Card

Result:
- open Memory Detail

## Components

- page header
- month switch row
- calendar grid
- selected day highlight
- memory date marker
- selected date summary
- memory cards
- bottom navigation

## Font Sizes

- page title: `24`
- month label: `18`
- day number: `13`
- card title: `18`
- body: `14`
- caption/meta: `12`

## Spacing Rules

- page horizontal padding: `20`
- header to calendar gap: `20`
- calendar to date summary gap: `16`
- date summary to cards gap: `16`
- card list gap: `16`
- major section gap: `24`

## Visual Notes

- the calendar itself should be calm and lightly structured
- the real emotional weight should sit in the memory cards below
- avoid making this look like a scheduling app
- avoid hard red/blue calendar styling

## Empty State

If the selected date has no memories:
- show a soft empty state card
- optionally suggest creating a memory or browsing another date

Suggested tone:
- `この日にはまだ思い出がありません`
- `別の日を選ぶか、新しい思い出を作れます`

## Loading State

Show:
- stable calendar shell
- placeholder memory cards below
- keep month navigation visible

## Recommended Default

Use:
- calm full month calendar at top
- selected date summary in the middle
- image-led memory cards below

This keeps time browsing clear while ensuring the screen still feels like a memory product.

## Related Screens

- Home
- Memory Detail
- On This Day
- Search
