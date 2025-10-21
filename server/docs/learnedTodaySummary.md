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

# 🧠 What I Learned – Day 8 (Redis & BullMQ Infrastructure)

## 1. Redis Fundamentals

- Redis is **not just a cache**; it can act as a **database, cache, message broker, and streaming engine**.
- Works entirely **in-memory (RAM)** for speed, but can persist data using:
  - **RDB** → periodic snapshots (faster, less durable)
  - **AOF** → logs every write (slower, more durable)
- Our project uses Redis mainly as a **message broker** for background jobs.

---

## 2. Why Redis is Perfect for Queues

- Redis data structures (Lists, Hashes) make it ideal for **queue systems**.
- Queues need **fast push/pop** and **atomic operations**, both handled efficiently by Redis.
- Used for temporary, non-critical data like background tasks — so losing them isn’t fatal.

---

## 3. BullMQ Core Architecture

| Component  | Role                                         |
| ---------- | -------------------------------------------- |
| **Queue**  | Adds jobs into Redis (Producer side)         |
| **Job**    | The unit of work (contains data and options) |
| **Worker** | Picks and processes jobs (Consumer side)     |

- Queue and Worker **don’t talk directly**; both use Redis as the shared middleman.
- This allows **async, distributed communication** — API stays fast, workers handle heavy lifting later.

---

## 4. Why Queue & Worker Are Separate

- Keeps Express routes fast and responsive.
- Worker can run in another process or even another machine.
- Crash in worker won’t affect main API.
- Allows scaling each part independently (horizontal scaling).

---

## 5. Redis + BullMQ Workflow

1. **Queue adds a job** → Redis stores it.
2. **Worker picks it up** → Executes the task.
3. **Worker marks job status** (completed/failed) → Redis updates.
4. **BullMQ emits events** → Used for logging and monitoring.

---

## 6. WSL2’s Role in Running Redis on Windows

- Redis doesn’t support Windows natively (since v3).
- WSL2 provides a **real Linux kernel inside Windows**, allowing Redis to run as if on Linux.
- Redis inside WSL2 communicates with Windows Node.js via `127.0.0.1:6379` (TCP).
- WSL2 performance is near-native; WSL1 was slower (syscall translation).

| Version  | How It Works                         | Redis Compatibility |
| -------- | ------------------------------------ | ------------------- |
| **WSL1** | Translates Linux syscalls to Windows | Partial             |
| **WSL2** | Runs actual Linux kernel (Hyper-V)   | ✅ Full             |

---

## 7. Redis Hello World Experience

- Verified installation: `redis-cli ping → PONG`.
- Ran first queue + worker script (BullMQ Hello World).
- Fixed `maxRetriesPerRequest must be null` error by adjusting Redis client options.
- Observed live flow: **Job added → Worker processed → Job completed**.
- Redis proved stable and fast even inside WSL2.

---

## 8. Conceptual Realization

- Redis acts as a **mailbox/message board** — Queue drops a job, Worker picks it up.
- Redis → middleman connecting isolated services asynchronously.
- Worker processes stay **always on**, waiting for new jobs.
- You can have multiple workers for parallel processing.

---

## 9. Core Takeaways

✅ Redis isn’t just a cache — it’s the foundation for distributed systems.  
✅ BullMQ simplifies async job management with clean APIs.  
✅ WSL2 allows Windows to run Linux tools natively and efficiently.  
✅ Running Redis + BullMQ end-to-end solidified the async architecture understanding.  
✅ Worker processes are background daemons — independent yet connected through Redis.

---

### 🧩 Quick Memory Cheatsheet

- Redis roles → database | cache | message broker
- Queue adds job → Worker processes → Redis tracks state
- RDB vs AOF → snapshots vs logs
- Queue = Producer | Worker = Consumer
- Use Redis via TCP (`127.0.0.1:6379`)
- WSL2 required for modern Redis on Windows
- Workers are long-running processes waiting for jobs
- Async flow = fast API + reliable background processing
