# 🧠 What I Learned – Day 7 (Advanced Queries & Search)

## 1. req.query Usage

- Query parameters come from the URL, e.g. `/api/search/pharmacy?city=Lahore&urgency=high`.
- Use `req.query` to read dynamic filters sent by the frontend.

## 2. Conditional Query Construction

- Build the Mongo query object only with the filters that exist.
- Example pattern: if `city` is present then set `query.city = city`; otherwise skip it.

## 3. Mongo operators: $gte / $lte

- Use `$gte` (greater or equal) and `$lte` (less or equal) for date ranges.
- For start/end dates set `query.startTime = { $gte: new Date(start) }` and `query.endTime = { $lte: new Date(end) }`.

## 4. Case-insensitive text matching

- For flexible text filters (like city) use regex with case-insensitive option.
- Concept: set `query.city` to a regex condition so "lahore" and "Lahore" both match.

## 5. Role-specific filtering

- Pharmacies: restrict results to their own shifts by adding `pharmacyId = req.user.id` to the query.
- Pharmacists: show only available shifts by adding `status = "open"` to the query.

## 6. Combining .map() and .includes() to compute flags

- To mark which shifts a pharmacist already applied to:
  - Fetch the pharmacist’s applications and extract `shiftId`s into an array.
  - For each shift in the search results, set `isApplied = appliedShiftIds.includes(shift._id.toString())`.
- This avoids expensive per-shift DB lookups and is done in memory.

## 7. Spread operator to extend documents

- Convert Mongoose document to a plain object (`shift._doc` or `shift.toObject()`), then use the spread operator to add fields: e.g., `{ ...shift._doc, isApplied: true }`.
- This keeps the original document untouched while preparing the exact payload for the frontend.

## 8. Defensive design: handle empty results gracefully

- An empty result is not an error. Return a successful response with an empty array and a friendly message.
- Example behavior: if no matches, return status 200 with an empty data array and message "No shifts found for given filters".

## 9. Incremental debugging and learning approach

- Build the feature step-by-step: extract query params → build query object → fetch DB results → post-process results → return response.
- Testing small pieces as you go (logging lengths, inspecting arrays) reduces mistakes and cements understanding.

---

## Quick memory cheatsheet (one-line reminders)

- Read query params → `req.query`.
- Use conditional assignments to build `query` object.
- Date range → `$gte` for start, `$lte` for end.
- Text match → regex + case-insensitive.
- Pharmacies: add `pharmacyId`; Pharmacists: add `status = "open"`.
- Mark applied shifts: fetch apps → `appliedShiftIds` → `isApplied = appliedShiftIds.includes(shift._id.toString())`.
- Use `...shift._doc` (or `shift.toObject()`) to add `isApplied` before sending.
