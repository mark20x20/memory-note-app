# Additional Screen Backlog

## Purpose

This file lists the strongest remaining screens after the current completed set.

## High Priority Remaining Screens

### 1. Full Photo Viewer

Why:
- already implied by detail / preview / flows
- needed for immersive swipe-first browsing

Likely route:
- `app/(app)/notes/[noteId]/photos/viewer.tsx`

### 2. Place Detail / Candidate Confirmation

Why:
- directly connected to current place intelligence work
- important for location trust and correction

Likely route:
- `app/(app)/notes/[noteId]/places/[placeGroupId].tsx`

### 3. Collaboration / Members

Why:
- shared memory editing is core product value

Likely route:
- `app/(app)/notes/[noteId]/members.tsx`

### 4. Flow Detail

Why:
- useful bridge between preview and deep edit

Likely route:
- `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx`

### 5. Onboarding / First Create Guidance

Why:
- first-use understanding matters for this product concept

## Medium Priority Remaining Screens

### 6. Settings

- account
- privacy
- route display preference
- share preference

### 7. Empty States Package

- no memories
- no map history
- no calendar entries
- no members

### 8. Share Entry Screen

- choose share format
- preview blur / privacy choices

## Recommended Next Order

1. Full Photo Viewer
2. Place Detail / Candidate Confirmation
3. Collaboration / Members
4. Flow Detail
5. Onboarding
