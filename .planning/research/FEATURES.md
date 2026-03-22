# Feature Landscape

**Domain:** Dog care tracking + co-guardian coordination + breeding directory
**Project:** Dogly
**Researched:** 2026-03-22
**Confidence note:** Web search tools were unavailable. All findings draw from training knowledge (cutoff August 2025) of the pet tech competitive landscape: apps including Dogo, PetDesk, BarkHappy, Woofz, PetNote, Pupford, Pawtrack, and breeding platforms including PuppyFind, Greenfield Puppies, AKC Marketplace, Good Dog, and Pawrade.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

### Dog Profile Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dog name, breed, date of birth | Every pet app has this as entry point | Low | Breed as freetext OR enum — enum enables filtering in v2 |
| Avatar photo upload | Visual identity; users abandon apps that feel impersonal | Low | Supabase Storage handles this directly |
| Multiple dogs per account | ~30% of dog owners have 2+ dogs; absence forces workarounds | Low | Design data model for this from day one |
| Edit and delete dog | Standard CRUD; absence signals unfinished product | Low | Soft delete is safer — health records become orphaned on hard delete |
| Gender and neutered/spayed status | Vet context and breeding relevance | Low | Required for health record completeness |

### Daily Care Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Feeding log (time, food type, amount) | Core parity with PetNote and similar; first thing users test | Low | Food type should support freetext and common presets |
| Weight log over time | Weight trend is the #1 metric vets ask for | Low | Show as a chart; even a simple sparkline has high perceived value |
| Activity/walk log | Users expect at minimum a note field for exercise | Low | Full GPS tracking is out of scope; a simple duration+notes entry is enough |
| Diary/notes | Catch-all for anything not covered by structured logs | Low | Rich text is overkill; plain text with timestamp is fine |
| Chronological activity feed | The shared feed is the core differentiator's surface area | Medium | Must show WHO logged an entry — this is the co-guardian hook |

### Health Records

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Vaccination records (name, date given, next due) | Every credible pet health app has this | Low | Users need PDF/print export eventually — flag for v2 |
| Medication tracking (name, dose, frequency, dates) | Multi-guardian households need medication coordination urgently | Medium | Missed medication is the primary anxiety this app solves |
| Vet visit log (date, vet name, reason, notes) | Users want a complete medical history in one place | Low | Even a simple notes field per visit satisfies this |
| Allergy / dietary restrictions | Frequently asked by vets and groomers | Low | Simple freetext field on the dog profile |
| Parasite prevention log (flea, tick, heartworm) | Treated as a medication variant by most apps | Low | Can be modeled as medication with type=preventative |

### Reminders & Notifications

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Vaccination due-date reminder | Users set it once and forget — absence means they find another app | Medium | Push notifications are native-app territory; email or in-app banner is v1 |
| Medication reminder (recurring) | The highest-anxiety coordination problem for co-guardians | Medium | Recurring schedules need careful UX; "Mark as given" acknowledgment is key |
| Reminder acknowledgment ("Mark as done") | Without this, reminder is just noise; co-guardians need shared state | Medium | The acknowledged-by-who context is crucial for multi-guardian coordination |

### Co-Guardian Coordination

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Invite co-guardian by email | Explicit consent model; expected given the shared-care premise | Medium | Email invite via Supabase edge function or similar |
| Co-guardian sees the same feed | Shared visibility is the core value prop — absence is a fatal gap | Low | RLS policy on Supabase enforces access |
| Who-did-what attribution on every entry | Users explicitly request this in reviews of competitor apps | Low | Every log entry needs created_by user reference |
| Owner can remove co-guardian | Required for trust — without it, separation scenarios (divorce, breakup) become blocking | Low | Must revoke Supabase RLS access immediately on removal |
| Co-guardian permission levels | Read-only vs. full access vs. admin | Medium | V1 can ship with flat permissions (all co-guardians equal) — flag for v2 |

### Authentication

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Social login (Google) | Reduces friction; users resist creating yet another password | Low | Supabase Auth supports this natively |
| Persistent session | Logging back in every visit kills retention | Low | Supabase handles this |
| Account deletion / data export | GDPR and user trust; absence signals data hostage | Medium | Required before EU market; good practice regardless |

---

## Differentiators

Features that set this product apart. Not expected, but valued when present.

### Co-Guardian UX (Core Differentiator)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time feed updates | Co-guardian sees an entry appear without refreshing | Medium | Supabase Realtime makes this achievable in v1 without polling |
| "Acknowledged" state on reminders | Co-guardians can see that someone else handled the medication | Medium | This is the exact anxiety the product claims to solve — this feature IS the product |
| Guardian activity summary | "What did [person] log this week?" | Medium | Builds accountability in multi-carer households |
| Handoff notes | "I fed the dog at 2pm, she seemed slow on the walk" | Low | Freetext note with timestamp on the feed — very low cost, high emotional resonance |

### Health & Wellness Intelligence

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Weight trend chart | Visual weight history is surprisingly absent in many apps | Low-Medium | Chart.js or similar; data already being captured |
| Feeding consistency indicator | "Fed 3 of 3 times today" badge on the dog's card | Low | Derivable from existing log data; high perceived value |
| Vet-share health summary | Generate a printable or shareable summary of all health records | Medium | High value for actual vet visits; builds trust in product quality |
| Breed-specific health reminders | Alert: "Labrador Retrievers are prone to hip dysplasia — schedule a screening at age 2" | High | Requires a breed health knowledge base; high value if correct, high risk if wrong |

### Breeding Directory (v2)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Verified breeder badge | Distinguishes reputable breeders from puppy mills | High | Requires a verification workflow; massive trust signal |
| Puppy reservation with deposit | Buyers can hold a puppy with a real financial commitment | High | Requires Stripe integration; reduces ghosting for breeders |
| Health certificate upload per puppy | Breeders who attach vet certifications convert at higher rates | Medium | File upload against puppy profile |
| Litter waitlist | "I want the next litter from this breeder" | Low | Simple email capture with breeder notification |
| Map-first breed search | Visual geographic search beats filter-list UX for discovery | Medium | PostGIS is already in the stack |
| Parent dog pedigree view | Serious buyers care about lineage | High | Requires pedigree data model; table stakes for AKC/show breeders |
| Contact breeder messaging | In-platform communication; avoids phone/email until trust established | High | Requires messaging infrastructure; not v2 MVP |

---

## Anti-Features

Features that look good on a roadmap but reliably cause problems.

### Anti-Feature 1: Social Dog Profiles / Public Feed

**What it is:** Letting users share dog profiles publicly, follow other dogs, like photos, etc.
**Why it looks appealing:** Increases engagement, virality, user-generated content.
**Why it causes problems:**

- Dramatically increases moderation burden (spam, animal abuse content, trolling)
- Bifurcates the product identity — is this a care coordination tool or a social network? Users pick one.
- Instagram/TikTok already own this space. Competing is a losing strategy.
- Slows v1 severely — auth, privacy controls, and notification architecture all become more complex.

**Instead:** Focus on the private, high-trust co-guardian network. That is an uncontested space.

---

### Anti-Feature 2: GPS / Activity Tracking Device Integration

**What it is:** Integrating with Whistle, Fi collar, Tractive, or similar GPS/activity trackers.
**Why it looks appealing:** Completes the health picture; users with trackers want unified data.
**Why it causes problems:**

- Each integration has a different API, OAuth flow, and rate limit. Each is a maintenance burden.
- Users without trackers feel the feature isn't for them — dilutes focus.
- Activity data from trackers is noisy and requires interpretation logic to be useful.
- Distraction from core co-guardian coordination MVP.

**Instead:** Allow manual walk/activity log. Revisit tracker integrations only after co-guardian feature set is validated.

---

### Anti-Feature 3: Vet Booking / Appointment Integration

**What it is:** Book vet appointments directly from the app via Calendly-style integrations or vet practice APIs.
**Why it looks appealing:** Logical extension of health records; keeps users in-app.
**Why it causes problems:**

- Vet practices have extremely fragmented software (AVImark, Cornerstone, ezyVet, etc.) — no standard API.
- Integration partnerships require sales, legal, and ongoing maintenance.
- Creates a dependency on third-party reliability for a core user action.
- The vet visit log captures the high-value data (what happened) without the integration complexity.

**Instead:** Record vet visits manually. Export health records so users can bring their own summary to any vet.

---

### Anti-Feature 4: Community Forum / Q&A

**What it is:** Dog owners asking each other questions in-app ("Is this rash normal?").
**Why it looks appealing:** Increases session time, builds community, differentiation from pure-utility apps.
**Why it causes problems:**

- Veterinary questions require moderation and liability awareness (wrong advice = sick/dead dog).
- Community requires critical mass to be useful — a ghost town forum damages credibility.
- Reddit, Facebook Groups, and Nextdoor already own this use case.

**Instead:** Link out to reputable external resources. When a breed-specific health tip is surfaced, link to an AKC or VCA article.

---

### Anti-Feature 5: Breeding Directory Without Verification

**What it is:** Allowing any user to list themselves as a breeder without screening.
**Why it looks appealing:** Grows the breeder directory quickly; lowers barrier to entry.
**Why it causes problems:**

- Puppy mills and backyard breeders will flood an unverified directory.
- One bad actor getting press coverage destroys the platform's reputation permanently.
- Buyers who find a sick puppy via the platform will associate the harm with the product.
- Good breeders will not list on a platform associated with disreputable sellers.

**Instead:** Start with a curated, invite-only or application-based breeder onboarding. Quality over quantity at launch.

---

### Anti-Feature 6: Overly Granular Care Logging Schemas

**What it is:** Forcing users to fill in 8+ fields per feeding entry (brand, flavor, protein %, kibble size, bowl type...).
**Why it looks appealing:** Richer data enables better insights.
**Why it causes problems:**

- Users abandon logging after 3 days if it feels like a chore.
- Co-guardians who aren't the primary owner log even less when friction is high.
- Most of the collected data never gets surfaced in insights anyway.

**Instead:** Keep every log entry to 3 fields maximum. Let free-text notes absorb the outliers. Optimize for completion rate, not data richness.

---

## Competitive Landscape

### What Competitors Do Well

| App / Platform | Strength | Lesson for Dogly |
|----------------|----------|-----------------|
| **PetDesk** | Reminder system; vet appointment sync | Reminder acknowledgment UX is mature — study their "mark as done" flow |
| **Woofz** | Clean onboarding; breed-aware content surfacing | Breed selection at profile creation enables personalization without extra effort |
| **PetNote** | Simple shared access for couples/households | Proves the co-guardian concept has user demand — but their sharing UX is basic |
| **Good Dog** (breeding) | Breeder verification and buyer education | Verification badge + "Endorsed Breeder" program creates a two-sided trust signal |
| **AKC Marketplace** | Pedigree and health testing data per puppy | Serious buyers want lineage data — health tests and OFA certifications matter |
| **Pawrade** | Puppy reservation with escrow | Financial commitment (even partial) dramatically reduces no-show buyers |
| **BarkHappy** | Location-based dog community + place discovery | Dogly already has place discovery; avoid duplicating BarkHappy's social layer |

### What Competitors Do Poorly

| Weakness | Common Pattern | Dogly Opportunity |
|----------|---------------|-------------------|
| Co-guardian attribution | Most apps treat the account as singular — no "who fed the dog?" | This is Dogly's primary differentiator — execute it better than everyone |
| Multi-dog household UX | Switching between dogs is clunky; feeds get conflated | Dog-switcher should be a persistent nav element, not buried in settings |
| Reminder fatigue | Apps blast notifications without "acknowledged" state — users mute everything | Shared acknowledgment state is the feature that makes reminders useful again |
| Breeding + care in same product | No product successfully bridges daily care and breeding directory | Dogly can own this space if the UX treats them as separate modules, not merged |
| Offline resilience | Most web-based pet apps fail with poor connectivity | Progressive Web App with optimistic UI makes a material difference for rural users |

---

## Feature Dependencies

```
Google OAuth → Dog Profile → Co-Guardian Invite
Dog Profile → Any care log entry
Co-Guardian → Shared feed with attribution
Feeding log → Feeding consistency indicator
Weight log → Weight trend chart
Medication record → Medication reminder → Reminder acknowledgment
Vaccination record → Vaccination reminder
Dog Profile (breed field) → Breed-specific health tips (v2)

[v2 Breeding Directory]
Breeder subscription → Kennel profile → Litter listing → Puppy profiles
Puppy profiles → Map search → Puppy reservation
Puppy reservation → Stripe payment integration
Breeder verification workflow → Verified badge
```

---

## MVP Recommendation

### V1: Shared Dog Care Platform

Prioritize in this order:

1. **Dog profile with multi-dog support** — foundation for everything; get the data model right
2. **Co-guardian invite + shared feed with attribution** — this IS the product's reason to exist
3. **Feeding and weight log** — simplest care tracking; validates core loop
4. **Medication tracking + shared reminder acknowledgment** — highest-anxiety problem for multi-guardian households
5. **Vaccination records + due-date reminders** — completes the health records module
6. **Vet visit log** — lightweight; diary entry with date is enough for v1

**Defer to v2:**
- Breed-specific health tips — needs a curated knowledge base; high effort, high risk
- Health record export / vet-share summary — valuable but not blocking adoption
- Co-guardian permission tiers (read-only vs. admin) — ship with flat permissions first, add tiers when user feedback identifies the need
- Activity/walk tracking beyond a free-text note — GPS integrations are out of scope
- Real-time feed updates via Supabase Realtime — nice-to-have; polling on page load is acceptable for v1

### V2: Breeding Directory

Entry criteria before starting v2:
- V1 co-guardian core is stable
- Stripe integration scoped
- Breeder verification workflow designed

Prioritize in this order:

1. **Breeder subscription + kennel profile** — monetization gate
2. **Litter and puppy listings** — the directory content
3. **Public breed search + map view** — buyer-facing discovery
4. **Puppy reservation (hold without payment)** — low-friction first step; add deposit payment in a follow-up
5. **Breeder verification badge** — reputation infrastructure

---

## Sources

- Training knowledge (cutoff August 2025) covering: PetDesk, Woofz, PetNote, Dogo, BarkHappy, Pupford, Good Dog, AKC Marketplace, Pawrade, PuppyFind, Greenfield Puppies
- Web search and web fetch were unavailable during this research session — all findings are from training data
- Confidence: MEDIUM overall. The competitive landscape for consumer pet apps is stable and well-covered in training data. V2 breeding directory features reflect patterns from established platforms (Good Dog, AKC Marketplace) which are unlikely to have changed substantially.
- Gaps: App Store review sentiment analysis (would confirm which features cause churn), current pricing structures for breeder subscriptions, and any new entrants post-August 2025 were not verifiable.
