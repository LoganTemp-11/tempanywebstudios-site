# Site upgrade: sell the capability, show the real client

Written 3 Sep 2026 (Cowork). Three changes to `index.html`, ordered by what
actually moves money. Change 1 is the one that matters. Nothing here touches the
layout, the palette or the letterhead voice, and nothing here needs the `rehaul`
branch to land first.

Baseline: `main` at `82d289d`, `style.css?v=15`, `script.js?v=12`.

---

## The problem, in one line

The site sells a five-page brochure for £399 and explicitly rules out the single
most impressive thing already built and running in production. Clause 02 says:

> Not included: domain registration, hosting, e-commerce, **booking systems,
> custom databases**, professional photography and full brand design, unless
> they're written into the quote.

Jennifer Ellis Yoga has a live, D1-backed booking system with atomic writes that
stop double-booking, real per-class capacities, and an admin panel. A prospect
reading tempanywebstudios.co.uk has no way to know that exists, so nobody ever
asks for it, so every job is £399. The "unless they're written into the quote"
escape hatch is doing no work, because nobody asks for a thing they've been told
isn't included.

Note on the demos, to be fair to the current site: it never pretends they are
clients. "Built as demonstrations so you can judge the craft" is honest and
should stay. The issue isn't dishonesty, it's that four demos carry less weight
than one real business whose owner will say the work was good.

---

## Change 1 — New clause 07: what else gets built

**Replaces clause 07 entirely.** "The next three clients" gets deleted (see
Change 2), and this takes its number, so **no renumbering is needed anywhere**.
The clause count stays at nine and `id="price"` stays on 03.

### Why it sits at 07 rather than next to clause 02

By 07 the reader has the whole standard deal: what it is, what it costs, how
long, what they own, what changes cost. That's the point to say "and if you need
more than that, here's the ladder." Putting it at 02 makes the £399 look like a
starting price with extras bolted on, which breaks the one-number-up-front
promise the whole page is built on. If it reads wrong in place, move it, but
move it knowing that's the trade.

### The copy

```html
    <section class="clause">
      <div class="clause-num">07</div>
      <div class="clause-body">
        <h2>When five pages isn't the job</h2>
        <p>Some businesses need the site to do something, not just say something. Taking bookings and holding the slot so two people can't take it at once. Charging a card at the point of booking. A timetable the owner updates themselves without phoning me. I build those, properly, on the same hand-coded stack as everything else, and they're quoted as their own line rather than hidden inside the price above.</p>
        <div class="price-line">
          <span class="price-line-label">Booking system, live availability and an admin panel you control</span>
          <strong class="price-line-figure">from &pound;250</strong>
        </div>
        <div class="price-line">
          <span class="price-line-label">Card payment taken at the point of booking</span>
          <strong class="price-line-figure">from &pound;120</strong>
        </div>
        <div class="price-line">
          <span class="price-line-label">Each page beyond the first five</span>
          <strong class="price-line-figure">&pound;45</strong>
        </div>
        <p class="price-note">Quoted before anything starts, the same as the rest of this. If your job doesn't need any of it, don't buy any of it.</p>
      </div>
    </section>
```

### The proof link is the important half

Prose about a booking system is worth very little. A working one a stranger can
click is worth a lot. Once Jennifer's card is live (Change 3), add one sentence
at the end of the clause body pointing at it, so the claim and the evidence sit
one click apart:

> The yoga studio in the attachments below runs on exactly this. Book a class on
> it and watch the slot count drop.

Hold that sentence until her card is live and consented. Until then the clause
stands on its own without naming her.

### On the numbers

They are yours to set, but here's the reasoning behind the ones above, so you
can argue with it rather than just accept it:

- **£250 booking.** Jennifer's build was well over ten hours of real work. At the
  £25/hr in clause 06, ten hours is £250, so this is the floor your own published
  rate already implies. Anything under it means clause 06 is quietly overcharging
  for small changes, or this is undercharging for large ones. Pick one.
- **£120 payment.** Matches the Stripe Checkout scope already specced for
  Jennifer (£75-125 at her agreement's rate), rounded to a number that survives
  a webhook going wrong once.
- **£45 a page.** Cheap enough that adding one is an easy yes, dear enough that
  a seven-page job stops being a five-page job you did for free.
- **Worth saying plainly:** £399 for five hand-coded pages and £25/hr afterwards
  are both low. Raising them is a bigger decision with your whole positioning
  attached, so leave them for now. This ladder raises the average job without
  touching the headline number, which is the reversible version of the same move.

### Schema

Add to the `"offers"` array around line 58 so the add-ons are machine-readable
alongside the two that are already there:

```json
{ "@type": "Offer", "name": "Booking system with admin panel", "price": "250", "priceCurrency": "GBP" },
{ "@type": "Offer", "name": "Card payment at point of booking", "price": "120", "priceCurrency": "GBP" }
```

### Clause 02 has to stop closing the door

Same change, same commit. Current exclusions line ends the conversation. Replace
with:

```html
        <p class="exclusions">Not included: domain registration, hosting, e-commerce, professional photography and full brand design, unless they're written into the quote. Booking systems, card payment and extra pages are built too, and priced separately in clause 07 rather than buried in the number above.</p>
```

---

## Change 2 — Delete "The next three clients"

The current clause 07 tells every visitor you have no clients. That was true in
July. It isn't now, and the moment Jennifer's card goes live at the top of the
proof grid, the page contradicts itself: a live paying client above, a beginner's
launch offer below.

Delete the section. The free-extra-page-for-a-review trade still works, it just
belongs in a reply to an enquiry, offered to a specific person, not printed on
the page where it prices your inexperience for everyone.

Keep the honesty of the voice. Nothing else in clause 07's replacement claims
more experience than you have.

---

## Change 3 — Land the real client card

Fully specced already in `JENNIFER-WORK-CARD.md`, built on branch
`jennifer-card`, blocked only on her consent. Two things to add to that plan:

1. **The consent email should also ask for one sentence.** There is no
   testimonial anywhere on the site. One line from a real customer outranks a
   fifth demo, and asking for permission and a quote in the same message costs
   nothing extra. The card already has an `attachment-quote` comment waiting for
   it.
2. **Puddle Lane is the second card**, once Liza's money conversation has
   happened. Two real businesses plus four demos is a different page from four
   demos, and it's the only credible answer to "how do I know you're not just a
   kid with a laptop."

The proof clause opening line will need rewriting when the first real card lands,
because "Four complete sites... built as demonstrations" stops describing what's
in the grid. Suggested:

> One live client site, and four complete demonstrations showing what £399 buys
> across four trades, so you can judge the craft before you commit anything.

---

## Housekeeping, do not skip

- **Bump `style.css?v=15` to `?v=16` in the same commit as any CSS change.**
  The 1 Sep cache bug came from exactly this being forgotten. If clause 07 needs
  no new CSS (it reuses `.price-line`, `.price-line-label`, `.price-line-figure`
  and `.price-note` from clause 03), no bump is needed. Check before assuming.
- **Do not break the URLs listed in `REHAUL-CARRY-OVER.md`**, especially
  `/work/dollars-deli/`, which is linked from a cold email about to go out.
- **`functions/_middleware.js` stays.** It is the only thing stopping the
  Search Console duplicate-content flag coming back.
- **Check the sticky CTA and any in-page anchors** still land correctly after a
  section is removed.
- **Verify at 375px and 1280px** before pushing, per the existing habit. Three
  `.price-line` rows stacked is more vertical weight than clause 03's single
  row, so check clause 07 doesn't dominate the phone view.

---

## Order of work

1. Change 1 and Change 2 in one commit. They don't depend on anyone else and
   they're the ones that change what the site sells.
2. Send Jennifer's consent-and-quote email.
3. Merge `jennifer-card` when she says yes, add the proof-link sentence to
   clause 07, rewrite the proof clause opening.
4. Puddle Lane card after Liza's payment conversation.
