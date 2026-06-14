# Screen Spec: Collaboration / Members

## Screen ID

`SCR-MEMBER-001`

## Purpose

This screen manages who can view and edit a memory note.

It should feel:
- warm
- safe
- clear
- human, not administrative

## UX Role

This screen supports:
- viewing current members
- understanding roles
- inviting new people
- adjusting access if allowed

## Primary Design Principle

Relationship clarity without admin heaviness.

## Information Priority

1. note sharing summary
2. current members
3. role explanation
4. invite action
5. owner-only management actions

## Layout Structure

### Header
- back
- title
- optional invite action

### Section 1: Share Summary Card
- note title
- total members
- owner label
- sharing tone / short helper

### Section 2: Member List

Each row contains:
- avatar
- name
- role chip
- optional subtitle
- optional menu trigger

### Section 3: Invite Card
- invite CTA
- share link / email / app invite direction

### Section 4: Role Guide
- owner
- editor
- viewer

## Interaction States

### Owner
- full management controls visible

### Editor
- mostly view-only role summary

### Viewer
- simple member list and invite hidden if restricted

## Components

- share summary card
- member row
- role chip
- invite card
- role explanation card

## Detailed Style Tokens

### Colors

- page background: `#FAF7F2`
- card background: `#FFFFFF`
- primary accent: `#F26B5B`
- neutral accent: `#F8F1E8`
- text primary: `#2E2A27`
- text secondary: `#7A746D`
- border: `#E8DED4`

### Typography

- screen title: `24 / 30 / 600 / Noto Sans JP`
- member name: `15 / 22 / 600 / Noto Sans JP`
- role chip: `11 / 16 / 600 / Inter`
- helper text: `13 / 20 / 400 / Noto Sans JP`

### Measurements

- page padding: `20`
- summary card radius: `20`
- member row min height: `68`
- avatar size: `40`
- role chip height: `24`
- invite CTA height: `52`

## Related Screens

- `03_memory_detail_screen.md`
- `06_share_card_screen.md`
