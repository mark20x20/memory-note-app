# Memory Note App UI Codex Plan

## Purpose

This folder stores Codex-authored UI planning documents for the Memory Note app.

The goals are:
- define a consistent visual and layout system
- translate product requirements into screen-by-screen UI specs
- make implementation easier for Claude/Codex/Figma workflows
- keep photo-first memory UX consistent across all pages

## Core Direction

Memory Note is not a utility-first map app and not a social feed.
It is a photo-led memory notebook where users revisit places, time, and feelings.

The UI should feel:
- warm
- soft
- elegant
- memory-centered
- photo-first
- calm and premium
- friendly rather than corporate

## Deliverables In This Folder

- `01_ui_foundation.md`
  - overall design principles
  - color direction
  - typography rules
  - spacing and radius rules
  - component tone

- `02_layout_rules.md`
  - page shell
  - header structure
  - card structure
  - image layout rules
  - map and calendar composition rules

- `03_preview_edit_flow_v2.md`
  - preview v2 direction
  - preview/edit responsibility split
  - tabbed edit structure

- `screen_specs/`
  - one markdown file per major screen
  - screen purpose
  - information hierarchy
  - layout breakdown
  - component list
  - typography sizes
  - user actions
  - edge states

## Major Screens To Design

Priority order:
1. Home
2. Create Memory
3. Memory Detail
4. Map
5. Calendar
6. Share Card
7. Collaboration
8. Settings

## Working Rule

Do not design all screens at once.
Proceed in batches so the visual language stays coherent.

Recommended batch flow:
1. foundation rules
2. home and navigation
3. creation flow
4. memory detail
5. map and calendar
6. share and collaboration
7. settings and edge states

## Current Progress

- shared UI foundation: completed
- global layout rules: completed
- home screen spec: completed
- create memory screen spec: completed
- memory detail screen spec with two photo variants: completed
- map screen spec: completed
- calendar screen spec: completed
- share card screen spec: completed
- memory preview screen spec: completed
- memory edit screen spec: completed
- preview v2 flow document: completed

## Screen Specs Available

- [Home](./screen_specs/01_home_screen.md)
- [Create Memory](./screen_specs/02_create_memory_screen.md)
- [Memory Detail](./screen_specs/03_memory_detail_screen.md)
- [Map](./screen_specs/04_map_screen.md)
- [Calendar](./screen_specs/05_calendar_screen.md)
- [Share Card](./screen_specs/06_share_card_screen.md)
- [Memory Preview](./screen_specs/07_memory_preview_screen.md)
- [Memory Edit](./screen_specs/08_memory_edit_screen.md)
- [Preview / Edit V2 Flow](./03_preview_edit_flow_v2.md)
