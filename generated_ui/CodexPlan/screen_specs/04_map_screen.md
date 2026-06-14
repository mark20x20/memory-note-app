# Screen Spec: Map

## Screen ID

`SCR-MAP-001`

## Purpose

The Map screen helps users revisit memories through place and movement.

This is not a navigation screen.
It is a memory exploration screen where users feel:
- where they went
- how moments were connected
- which photos belong to each place

## UX Role

The Map screen should answer:
- where have I been in this memory
- what happened at each place
- how did the outing or trip flow
- which memory note or place group should I open next

## Primary Design Principle

Map should feel memory-led, not utility-led.

It should prioritize:
- place recall
- photo association
- route atmosphere

## Core Experience

The emotional goal is:
- to relive a route
- to connect photos to place
- to make the map feel soft and reflective, not technical

## Information Priority

1. map with place pins and route
2. currently selected place summary
3. linked memory photos
4. route/order context
5. secondary filters or navigation

## Layout Structure

### Header Area

Contents:
- title such as `地図`
- small subtitle like `訪れた場所をたどる`
- optional filter or note selector action

Typography:
- title: `24`
- subtitle: `13` to `14`

### Section 1: Map Canvas

This is the hero area.

Contents:
- soft styled map
- numbered pins
- subtle route line
- selected pin state

Rules:
- the map should occupy a strong top portion of the screen
- do not let controls clutter the map
- teal is the main place/map accent
- route line should be elegant and calm

Recommended height:
- `300` to `380`

### Pin Rules

Use numbered pins for clarity.

Visual states:
- default pin: soft teal
- selected pin: stronger teal with slightly elevated emphasis
- confirmed or important place can have a filled state

Rules:
- pins must be readable at a glance
- pin numbers should correspond to the story order
- avoid overly bright or aggressive map markers

### Route Rules

The route line should:
- connect major memory places
- suggest journey flow
- remain visually secondary to photos

Style:
- teal line
- soft width
- subtle curves if possible

### Section 2: Selected Place Card

Immediately below the map, show a place-focused card.

Contents:
- place name
- order in trip such as `2番目の場所`
- short date/time or time block
- short excerpt or memory note context

Optional:
- confidence or user-confirmed state if relevant

Style:
- rounded white card
- strong photo preview if available

### Section 3: Place Photo Preview

This is the emotional anchor under the map.

Recommended layout:
- horizontal photo card row
- or one selected place photo card with swipeable mini previews

Contents per card:
- photo
- place name
- date/time
- one-line diary or memory cue

Rules:
- photos should feel more important than coordinates
- cards should clearly correspond to the selected pin

### Section 4: Route Timeline Summary

This section gives story context.

Contents:
- ordered place cards or compact timeline row
- place 1 -> place 2 -> place 3

Purpose:
- show how the outing flowed
- reinforce that this is a memory route, not turn-by-turn navigation

Visual direction:
- compact, elegant, secondary to map and photo cards

### Section 5: Bottom Navigation

Primary nav:
- Home
- Map
- Create
- Calendar
- Settings

Map should be active.

## Interaction Model

### Tap a Pin

Result:
- selected place card updates
- photo preview updates
- route context remains visible

### Swipe Photo Cards

Result:
- user can browse memory moments at the selected place
- pin selection stays stable unless card group changes

### Tap Place Card

Result:
- open detailed place view or note detail

### Tap Route Summary Item

Result:
- center map on that place
- update selected state

## Components

- page header
- map canvas
- numbered marker
- route line
- selected place card
- photo preview cards
- route summary row
- bottom navigation

## Font Sizes

- page title: `24`
- selected place title: `18`
- section title: `20`
- body: `14`
- caption/meta: `12`

## Spacing Rules

- page horizontal padding outside map: `20`
- map to selected card gap: `16`
- major section gap: `24`
- card inner padding: `16`
- horizontal card gap: `12`

## Visual Notes

- avoid making this look like a taxi or delivery map
- avoid dense filter-heavy interfaces
- map should feel like a memory surface
- photo cards should soften the technical feeling of geography

## Empty State

If no place information exists:
- show a calm empty map state card
- explain that photos without location can still become memories
- offer access to manual place adjustment if available

Suggested tone:
- `場所情報がまだありません`
- `あとから手動で整えることもできます`

## Loading State

Show:
- map skeleton or soft blurred placeholder
- 1 selected place skeleton card
- 2 preview card skeletons

## Recommended Default

Use:
- map at top
- selected place card below
- horizontal photo preview row

This is the best balance between:
- overview
- emotional recall
- place exploration

## Relation To Other Screens

- connects naturally from Note Detail
- feeds into Place Detail / User Confirmation screens
- should visually share card language with Home and Calendar

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- map accent: `#4FA8A1`
- map accent soft: `#DFF3F1`
- card background: `#FFFFFF`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`

### Typography

- screen title: `24 / 30 / 600 / Noto Sans JP`
- place title: `16 / 22 / 600 / Noto Sans JP`
- section title: `20 / 26 / 600 / Noto Sans JP`
- meta text: `12 / 18 / 500 / Noto Sans JP`

### Measurements

- page padding: `20`
- map block height: `320`
- map radius: `24`
- preview card radius: `20`
- preview image height: `120`
