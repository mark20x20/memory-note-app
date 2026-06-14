# Screen Spec: Home

## Screen ID

`SCR-HOME-001`

## Purpose

The Home screen is the emotional entrance to the app.
It helps users quickly return to recent memories, revisit favorite moments, and start a new memory note.

## UX Role

The page should answer these questions within the first few seconds:
- what kind of memory is here
- which note should I reopen
- how do I create a new one

## Primary Design Principle

Home should feel like the emotional front door of the app.

It should prioritize:
- warmth over density
- photo recall over utility menus
- immediate re-entry into memories over abstract navigation

## Information Priority

1. featured recent memory
2. recent memory list
3. quick access to calendar and map context
4. create action

## Layout Structure

### Header Area

Contents:
- greeting or simple title such as `思い出`
- small subtitle such as current date or emotional helper text
- optional profile/avatar action

Typography:
- title: `24`, semibold
- subtitle: `12` to `14`, regular

### Section 1: Featured Memory

This is the hero block.

Contents:
- large photo
- memory title
- date
- location summary
- small diary excerpt

Layout:
- full-width rounded photo card
- text layered below image, not too dense
- optional tiny map chip or place chip

Sizes:
- image height: roughly `240` to `300`
- title: `20`
- meta row: `12` to `13`
- excerpt: `14`

### Section 2: Recent Memories

Stacked vertical cards.

Each card contains:
- left or top thumbnail
- title
- date
- place summary
- optional member avatars

Rules:
- 3 to 5 visible cards before scrolling deeper
- cards should feel calm and collectible

Suggested item layout:
- image on top for premium look
- compact horizontal variant allowed for lower sections

### Section 3: Quick Access

Two smaller cards:
- `地図で見る`
- `カレンダーで見る`

Purpose:
- support exploration by place and date

Tone:
- these are support cards, not the visual hero

### Floating Create Action

Use one clearly visible create action.

Options:
- bottom nav center create button
- or floating coral circular button

Preferred:
- center-emphasized bottom navigation create action

## Components

- page header
- featured memory card
- recent memory card
- place chip
- date chip
- member avatar group
- quick access cards
- bottom navigation

## Font Sizes

- page title: `24`
- featured title: `20`
- card title: `18`
- body: `15`
- meta: `12`

## Spacing Rules

- page horizontal padding: `20`
- gap from header to hero: `20`
- gap between major sections: `28`
- recent card list gap: `16`

## Emotional Notes

- this page should feel like opening a beautiful memory album
- the first photo should immediately create warmth
- avoid making the page look like file management

## Empty State

If there are no memory notes yet:
- show one large welcoming illustration-free photo area or soft placeholder frame
- message: encourage first memory creation
- primary coral action: `思い出を作る`

## Loading State

- skeleton image block for featured memory
- 2 to 3 skeleton cards below
- keep structure stable to avoid layout jump

## Next Related Screens

- `02_create_memory_screen.md`
- `03_memory_detail_screen.md`
- future calendar and map entry cards should visually inherit from this screen

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- hero card: `#FFFFFF`
- primary accent: `#F26B5B`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`

### Typography

- screen title: `24 / 30 / 600 / Noto Sans JP`
- hero title: `24 / 30 / 600 / Noto Sans JP`
- card title: `18 / 24 / 600 / Noto Sans JP`
- body: `14 / 22 / 400 / Noto Sans JP`
- caption: `12 / 18 / 400 / Noto Sans JP`

### Measurements

- page padding: `20`
- hero radius: `28`
- hero height: `300`
- card radius: `20`
- card padding: `16`
- create CTA height: `52`
