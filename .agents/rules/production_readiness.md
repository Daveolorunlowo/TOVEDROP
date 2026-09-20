---
name: Production-readiness checklist
description: Standing instruction for handling production readiness when building or modifying a feature.
---

Whenever you build or modify a feature, don't just make it work for the happy path — proactively handle the following unless I explicitly say not to. If something below is out of scope for a quick prototype, flag it rather than silently skipping it.

### Security

- Validate and sanitize all inputs server-side, not just client-side
- Check authorization (does this user own this resource?), not just authentication (is someone logged in?)
- Never hardcode secrets/API keys — use environment variables
- Parameterize queries (no string-concatenated SQL) and escape output to prevent XSS
- Scope CORS to actual allowed origins, not *
- Add rate limiting on auth endpoints and public APIs
- Hash passwords properly (bcrypt/argon2), never store plaintext
- Add CSRF protection on state-changing requests

### Error handling & edge cases

- Wrap network/async calls in try/catch with user-facing error messages (no silent failures, no leaked stack traces)
- Add loading states and disable buttons to prevent duplicate submissions
- Add empty states for lists/pages with no data
- Validate edge-case inputs: empty strings, huge strings, negative numbers, special characters

### Data integrity

- Use proper DB constraints (unique, not-null, foreign keys)
- Use versioned migrations, not manual schema edits
- Add indexes for anything queried frequently
- Consider backup strategy for production data

### Auth completeness

- Password reset, email verification, session expiry, and real logout — don't assume these are "later" items if auth is in scope

### Performance

- Paginate anything that could grow large; avoid N+1 queries; cache what doesn't need to be fetched fresh every time

### Deployment

- Keep secrets out of git; assume a staging/prod split matters; mention if logging/monitoring is missing

### UX polish

- Form validation feedback, confirmation on destructive actions, mobile responsiveness, basic accessibility (alt text, keyboard nav), real 404/500 pages

When you finish a feature, briefly note which of these you handled and which you deliberately left out (and why), so I can decide if anything needs to be added back in.
