# Preview / Edit Flow V2

## Purpose

This document reorganizes the Memory Note creation handoff around `preview v2`.

The goal is:
- keep preview emotionally pure
- move all correction behavior into edit
- simplify edit by grouping deep controls into tabs

## Core Rule

Preview should not feel like:
- a generated result check screen
- a metadata verification screen
- a task completion step

Preview should feel like:
- opening a memory page
- browsing a scrapbook-like story
- quietly deciding whether any part needs adjustment

## Responsibility Split

### Preview Does

- show the memory visually
- show the day flow
- show photos, date, place, and note text
- provide a simple route to edit

### Preview Does Not

- explain generation status
- explain grouping logic
- show confidence or estimation language by default
- show checklist or validation UI
- ask the user to approve system output

### Edit Does

- contain all correction and refinement tools
- expose deeper controls only when the user enters the relevant tab
- support title, photos, flows, places, and note text changes

## Recommended User Flow

1. user selects photos
2. app prepares note draft
3. user enters `preview v2`
4. user experiences the memory page
5. if needed, user taps `編集する`
6. user lands in `tabbed edit`
7. user saves and returns to preview or detail

## Preview V2 Screen Character

Preview V2 should include only:
- hero photo area
- thumbnail support row
- title, date, location
- event flow timeline
- route preview
- memory note
- quiet edit CTA

Preview V2 should avoid:
- processing cards
- confidence cards
- generated-by-system language
- technical warnings unless the page would otherwise be misleading

## Tabbed Edit Principle

The edit screen should no longer try to expose every detailed action in one long page.

Instead:
- the first layer should feel simple
- each tab should own one editing concern
- deeper actions should appear only inside the active tab

## Edit Tab Structure

### Tab 1: Overview

Purpose:
- adjust the overall note identity

Contains:
- cover image change
- title edit
- date range edit
- summary location edit

### Tab 2: Photos

Purpose:
- manage image selection and visual order

Contains:
- reorder thumbnails
- set cover photo
- remove photo
- add photo
- open swipe viewer

### Tab 3: Flows

Purpose:
- refine the timeline structure of the day

Contains:
- reorder flow cards
- split a flow
- merge adjacent flows
- move photos between flows
- adjust flow labels

### Tab 4: Places

Purpose:
- fix or confirm place information

Contains:
- chosen place card
- nearby candidate list
- map confirmation route
- manual place correction

### Tab 5: Memo

Purpose:
- refine the written memory itself

Contains:
- multiline memory note editor
- optional AI rewrite / regenerate actions
- tone polish

## Save Behavior

Recommended pattern:
- shared save button in header or sticky bottom area
- local unsaved-change state per tab
- user can move across tabs without losing edits

## UX Benefits

- preview stays beautiful
- edit feels less overwhelming
- information density becomes manageable
- users can focus on one kind of correction at a time

## Relation To Existing Specs

- `screen_specs/07_memory_preview_screen.md`
  - defines the emotional preview surface
- `screen_specs/08_memory_edit_screen.md`
  - should follow this tabbed edit model
