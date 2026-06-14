# Screen Spec: Memory Edit

## Screen ID

`SCR-EDIT-001`

## Purpose

The Memory Edit screen is a structured refinement space reached from preview.

This screen should make users feel:
- editing is available when needed, not forced too early
- they can focus on one kind of change at a time
- the screen is clearer than a single long deep-edit page
- the memory still feels warm while being editable

## Relation To Preview V2

This screen exists so that preview can remain emotionally pure.

It should therefore:
- gather all refinement actions here
- reduce overload by dividing deep settings into tabs
- keep a quick route back to preview

## UX Role

This screen supports:
- correcting title and cover
- adjusting photo order or selection
- refining the story flow
- confirming or replacing place labels
- editing the memory note text

## Primary Design Principle

Edit is structured craftsmanship.

Unlike preview, this screen may show more controls, but it must still feel:
- guided
- calm
- organized by concern
- photo-first

## Information Priority

1. current active edit tab
2. editable content inside that tab
3. save state and primary actions
4. quick route back to preview

## Layout Structure

This screen should use a tabbed edit shell.

Recommended order:

### Header Area

Contents:
- back action
- page title such as `編集`
- current tab label
- save status such as `未保存の変更`
- top-right save action

Typography:
- title: `22` to `24`
- status: `12`

### Section 1: Edit Tabs

Use a segmented horizontal tab bar.

Tabs:
- `概要`
- `写真`
- `流れ`
- `場所`
- `メモ`

Rules:
- active tab is clearly highlighted
- inactive tabs stay light and compact
- keep the tab bar sticky if the page is long

### Section 2: Active Tab Content

Only one deep edit area should be visually expanded at a time.

#### Tab A: Overview

Purpose:
- quick overall polish

Contents:
- large cover image
- `カバーを変更`
- title field
- date row
- summary location row

Rules:
- should feel like the lightest edit tab
- good default landing tab

#### Tab B: Photos

Purpose:
- manage visual selection and order

Contents:
- draggable thumbnail strip
- add photo action
- remove photo action
- set cover action
- viewer launch

Rules:
- visual and tactile
- destructive actions remain secondary

#### Tab C: Flows

Purpose:
- refine the structure of the day

Contents:
- flow cards
- reorder handle
- split flow action
- merge flow action
- move photos between flows

Rules:
- this is the structural editing tab
- it may be denser than other tabs

#### Tab D: Places

Purpose:
- correct location information

Contents:
- current chosen place
- nearby candidate list
- `地図で確認`
- manual correction input

Rules:
- place editing should be centralized here
- avoid spreading location controls across the whole edit screen

#### Tab E: Memo

Purpose:
- refine the written memory itself

Contents:
- multiline memory note editor
- optional rewrite / regenerate action
- writing-focused layout

Rules:
- notebook-like feel
- minimal chrome

### Section 3: Bottom Save Area

Primary action:
- `変更を保存`

Secondary action:
- `プレビューを見る`

Danger text action:
- `この編集を破棄`

Rules:
- save CTA should stay available
- preview CTA should be easy because preview/edit are paired
- discard must never overpower save

## Editing Modes

### Mode A: Quick Edit

For users making only small fixes.

Show:
- default to `概要` tab
- keep deep actions hidden until the user enters another tab

### Mode B: Deep Edit

For users reorganizing the story.

Show:
- user opens `写真`, `流れ`, `場所`, or `メモ`
- only the selected domain becomes detailed

## Interaction States

### State A: Clean Draft

No changes yet.

Show:
- save button inactive or subdued
- `プレビューを見る` easy to access

### State B: Unsaved Changes

Show:
- top status label
- active save CTA
- navigation-away warning if needed

### State C: Place Needs Attention

Show:
- `場所` tab can carry a subtle attention badge
- candidate suggestions appear inside that tab

### State D: Save Complete

Show:
- small success toast
- status changes to `保存済み`
- return to preview or detail naturally

## Components

- edit header with save state
- tab bar
- overview editor
- photo management panel
- flow editing panel
- place correction panel
- memo editor
- bottom save bar

## Font Sizes

- page title: `24`
- tab label: `13` to `14`
- section title: `20`
- field label: `12`
- body: `14`
- caption: `12`
- status text: `11` to `12`

## Spacing Rules

- page horizontal padding: `20`
- section gap: `24`
- card inner padding: `16`
- field gap: `12`
- tab gap: `8`
- bottom CTA top gap: `24`

## Visual Notes

- keep edit mode cleaner and more structured than preview
- use borders a little more, but stay soft
- photos must still anchor the page emotionally
- do not let editable controls make the screen feel admin-like
- show depth progressively through tabs instead of all at once

## Preview Pairing Rule

Because preview and edit are intentionally separated:
- preview should emphasize memory immersion
- edit should emphasize clarity

The visual bridge between them should be:
- same cover image treatment
- same color system
- same flow card family
- same photo language with more controls added inside each tab
