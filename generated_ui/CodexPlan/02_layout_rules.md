# Layout Rules

## App Shell

## Global Page Structure

Standard page order:
1. safe top area
2. page header
3. hero or primary content
4. supporting cards
5. bottom navigation or bottom actions

Rules:
- every screen needs one obvious focal area
- the top 35 percent of the page should usually communicate the page purpose fast
- avoid pages where all sections have equal visual weight

## Header Rules

### Standard Header

Used for most pages:
- title
- optional subtitle
- optional right action

Spacing:
- top padding should feel generous
- title aligned with page content edge

### Immersive Header

Used for memory detail or share preview:
- image first
- title overlays image or sits immediately beneath
- metadata comes after title

## Image Layout Rules

### Hero Image

Use for:
- memory detail
- share card preview
- featured memory on home

Rules:
- width should dominate the content area
- radius should be large and soft
- never place too many UI controls over the hero image

### Photo Display Pattern A: Multi-Photo Overview

Use when the user should understand the memory as a set.

Best for:
- home previews
- create flow review
- calendar result cards
- map-linked place previews
- note detail sections where sequence matters less than overview

Rules:
- show one dominant image plus supporting images where possible
- avoid uniform backup-gallery feeling
- prefer asymmetrical but balanced composition
- use this pattern when users benefit from comparing moments quickly

Strengths:
- gives instant overview
- supports travel grouping and memory clustering
- feels scrapbook-like

Risks:
- can feel visually busy if too many photos are same weight
- individual photos may lose emotional focus

### Photo Display Pattern B: Swipe-First Carousel

Use when the user should emotionally enter one photo at a time.

Best for:
- memory detail hero gallery
- full photo viewing
- immersive review moments
- share-preparation flows

Rules:
- make one photo dominant at a time
- use horizontal swipe with clear page position feedback
- surrounding metadata should support the current image, not compete with it
- keep gesture targets simple and calm

Strengths:
- stronger emotional immersion
- better for appreciating each photo
- premium, cinematic feeling

Risks:
- slower for understanding the whole memory set
- harder to compare multiple moments quickly

### Pattern Selection Rule

Choose pattern by user intent:
- if the user wants overview, grouping, or selection -> use Multi-Photo Overview
- if the user wants immersion, reflection, or detailed viewing -> use Swipe-First Carousel

Recommended product usage:
- Home: overview
- Create: overview
- Calendar: overview
- Map supporting cards: overview
- Memory Detail top area: swipe-first or hybrid
- Full photo view: swipe-first

### Hybrid Pattern

In some important screens, both patterns should coexist.

Recommended hybrid:
- top: one large swipeable hero photo
- below: small overview strip or grouped thumbnails

Use hybrid when:
- users need emotional immersion first
- but still need quick access to the larger set

### Photo Cluster

Use for:
- create flow
- upload review
- gallery previews

Rules:
- one dominant photo plus smaller supporting photos is preferred
- if grid is used, preserve calm spacing and soft rounding

## Card Composition

Preferred card structure:
1. image or icon anchor
2. title
3. supporting metadata
4. optional action or disclosure

Rules:
- cards should not exceed 2 main ideas
- if a card has many rows, split into multiple cards

## List Rules

- use vertically stacked cards
- maintain a consistent image ratio for repeated items
- use larger gaps between groups than between items

## Map Screen Rules

Map screens must feel memory-led.

Rules:
- map should not be a bare full-screen utility map by default
- combine map with photo preview cards or a memory route summary
- pins should be easy to understand and visually calm
- route lines should be subtle and elegant
- teal should be the main map accent

Recommended composition:
- map at top or upper-middle
- horizontally scrollable memory spot cards below
- selected place card should sync emotionally with the map

## Calendar Screen Rules

Calendar should feel like memory access, not scheduling.

Rules:
- keep the calendar clean and quiet
- selected day should reveal memory cards with thumbnails
- dates with memories should have a gentle visual marker
- below-calendar content must be more emotional and photo-led

## Home Screen Rules

Home is the emotional entrance.

Rules:
- first visible block should contain a strong photo memory
- recent memories should be easy to resume
- use one featured memory block and supporting stacked cards
- create action must remain obvious but not aggressive

## Create Flow Rules

Create flow begins with photography.

Rules:
- photo selection must appear before heavy text entry
- auto-grouping by time/place should feel helpful, not robotic
- progress and processing states must reassure users

## Detail Screen Rules

Detail should feel like opening a memory page.

Rules:
- large top image
- diary and places separated into elegant sections
- timeline and place information should be clearly secondary to the main photo and memory story
- detail screen may use either overview or swipe-first photo pattern depending on the variant
- if both are supported, make one variant the emotional default and the other the quick-browse alternative

## Bottom Navigation

Primary nav items:
- Home
- Map
- Create
- Calendar
- Settings

Rules:
- create can be slightly emphasized
- nav labels should stay short
- active state should use coral, map-related screens may include subtle teal accents in content, not nav
