# Screen Spec: Memory Edit

## Screen ID

`SCR-EDIT-001`

## Purpose

The Memory Edit screen is where users refine the generated note with control and confidence.

This screen should make users feel:
- they can fix small mismatches quickly
- photos, title, flow, and place edits are all understandable
- editing is structured and not overwhelming
- the memory still feels warm while being editable

## Relation To Phase 12.5G-4

This screen represents the separated edit surface after preview.

It should therefore:
- expose editable fields clearly
- support place correction and flow adjustment
- remain distinct from the calmer preview screen

## UX Role

This screen supports:
- correcting title and cover
- adjusting photo order or selection
- editing diary text
- confirming or replacing place labels
- refining the memory before save

## Primary Design Principle

Edit is structured craftsmanship.

Unlike preview, this screen may show more controls, but it must still feel:
- guided
- calm
- photo-first

## Information Priority

1. editable title and cover
2. flow blocks and photo groups
3. place labels and route context
4. diary text editing
5. save status and primary actions

## Layout Structure

This screen may be tall and vertically scrollable.

Recommended order:

### Header Area

Contents:
- back action
- page title such as `編集`
- save status like `未保存の変更`
- top-right action: `保存`

Typography:
- title: `22` to `24`
- status: `12`

### Section 1: Cover And Title Editor

Contents:
- large cover image
- small `カバーを変更` button
- title text field
- date field row
- area summary row

Rules:
- cover remains visual and generous
- input fields are rounded and lightly bordered
- avoid dense form styling

Sizes:
- cover height: `240` to `320`
- title field text: `22`
- meta field text: `14`

### Section 2: Quick Edit Chips

This area helps users jump to common edits.

Chips:
- `タイトル`
- `写真`
- `場所`
- `時間の流れ`
- `メモ`

Rules:
- horizontally scrollable
- active chip highlighted in coral
- useful as a sticky shortcut when the page is long

### Section 3: Flow Edit Blocks

This is the main body.

Each editable flow block includes:
- flow label and reorder handle
- time range row
- place label row
- photo strip or mini collage
- summary line
- edit actions

Editable actions inside each flow:
- `写真を追加`
- `写真の順番`
- `この流れを分ける`
- `この流れを結合`
- `場所を修正`

Recommended structure:
- one strong card per flow
- card header for metadata
- middle for photos
- bottom for small actions

### Section 4: Photo Arrangement Area

This may appear inline or as an expanded card.

Contents:
- draggable thumbnail strip
- remove photo action
- set cover action
- swipe viewer launch

Rules:
- thumbnails should be large enough to compare visually
- reordering affordance should be obvious
- keep destructive actions secondary

### Section 5: Place Edit Card

This is especially important for the current product flow.

Contents:
- current chosen place
- confidence state
- nearby candidates list
- manual correction entry
- `地図で確認` action

Recommended UI:
- chosen place displayed first in a prominent soft card
- candidate list below in stacked selectable rows
- manual input separated visually as a fallback area

### Section 6: Diary / Memo Editor

Contents:
- section title
- multiline text editor
- regenerate hint if AI exists
- character count only if needed

Style:
- soft notebook-like area
- large line-height
- editing should feel like writing, not data entry

### Section 7: Change Summary Card

This helps the user feel oriented before saving.

Example rows:
- `タイトルを変更`
- `Flow 2 の場所を修正`
- `写真を3枚追加`

Rules:
- secondary visual weight
- useful near the bottom before save

### Section 8: Bottom Save Area

Primary action:
- `変更を保存`

Secondary action:
- `プレビューを見る`

Danger zone text action:
- `この編集を破棄`

Rules:
- save CTA should stay available
- preview CTA should be easy because preview/edit are paired
- discard must never overpower save

## Editing Modes

### Mode A: Light Edit

For users making only small fixes.

Show:
- short edit page with a few sections expanded
- place edit and title edit prominent

### Mode B: Deep Edit

For users reorganizing the story.

Show:
- flow cards with reorder and split tools
- photo arrangement controls
- more visible action rows

## Interaction States

### State A: Clean Draft

No changes yet.

Show:
- save button inactive or subdued
- `プレビューに戻る` easy to access

### State B: Unsaved Changes

Show:
- top status label
- active save CTA
- navigation away warning pattern if needed

### State C: Place Needs Attention

Show:
- amber highlight around place card
- candidate suggestions
- direct route to manual correction

### State D: Save Complete

Show:
- small success toast
- status changes to `保存済み`
- return to preview or detail naturally

## Components

- edit header with save state
- cover editor
- title input
- quick edit chips
- flow edit cards
- photo reorder strip
- place confirmation card
- place candidate list
- memo text editor
- change summary card
- bottom save bar

## Font Sizes

- page title: `24`
- title input: `22`
- section title: `20`
- flow card title: `17` to `18`
- body: `14`
- caption: `12`
- status text: `11` to `12`

## Spacing Rules

- page horizontal padding: `20`
- section gap: `24`
- card inner padding: `16`
- field gap: `12`
- chip gap: `8`
- bottom CTA top gap: `24`

## Visual Notes

- keep edit mode slightly cleaner and more structured than preview
- use borders a little more, but stay soft
- photos must still anchor the page emotionally
- do not let editable controls make the screen feel admin-like

## Preview Pairing Rule

Because preview and edit are intentionally separated:
- preview should emphasize reassurance
- edit should emphasize clarity

The visual bridge between them should be:
- same cover image treatment
- same color system
- same flow card family
- same photo language with more controls added in edit
