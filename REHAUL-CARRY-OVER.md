# Rehaul: what must survive the swap

Written 1 Sep 2026, before the new site replaces this one. These are things that
are load-bearing today and will break quietly if the new build does not carry
them across.

## 1. URLs that are already out in the world

**`/work/dollars-deli/`** — this is the single most important one. The cold email
to Dollar's Deli, drafted and about to go, links directly to
`https://tempanywebstudios.co.uk/work/dollars-deli/`. If the rehaul drops that
path, the first thing they do is click a dead link from a web designer. Either
keep the path or 301 it to wherever the concept lives on the new site.

Also currently live and indexed:

- `/demos/trades/` (Whinstone Joinery)
- `/demos/clinic/` (Rowanbank Physiotherapy)
- `/demos/professional/` (Ochil Ledger)
- `/demos/yoga/`

Any of these can be retired, but retire them deliberately with a redirect rather
than a 404. They are linked from the current homepage and may be indexed.

## 2. The pages.dev redirect

`functions/_middleware.js` 301s any `*.pages.dev` hostname to the real domain.
This exists because Search Console flagged "Duplicate without user-selected
canonical" when both served identical content, and a rel=canonical tag is a hint
Google can ignore rather than a directive.

If the new build is not a Cloudflare Pages Functions project, this file will not
run and the duplicate-content flag comes straight back. Reimplement the redirect
in whatever the new stack uses before launch, not after.

## 3. The enquiry form

The current form posts to `https://api.web3forms.com/submit` with an access key.
End-to-end delivery was verified 10 Aug 2026. The free allowance is 250
submissions a month.

Carry the access key over and **send a test submission from the new site before
you point the domain at it**. A rehaul that silently breaks the enquiry form
while twenty cold emails are landing is the worst possible outcome of this week.

## 4. Sitemap and robots

`sitemap.xml` currently lists only the homepage, which is thin. The rehaul is the
moment to list every real page. `robots.txt` should keep pointing at it.

Google Search Console has the domain property verified since 11 Aug. Resubmit the
sitemap after launch.

## 5. Commercial wording to fix while you are in there

These are known inconsistencies between the live site and the master client pack,
carried over from the August notes and still unresolved:

- Brand name: some material still says Tempany Web Studio, singular. It is
  Tempany Web Studios.
- Payment: the site says 50/50 in places; the agreement says £200 up front and
  £199 on approval before launch.
- Price: "FROM £399" in places, fixed £399 in the pack. Pick one. Every cold
  email currently says a flat £399, so the site should too.
- Timing: 7-day draft in one place, 10 to 14 calendar days in the pack.
- Copywriting scope: the boundary is fuzzy. The pack excludes extensive
  copywriting; the site does not say so.

## 6. The thing the rehaul should actually fix

Proof. The current work section is four invented demos and one uninvited concept.
No real client appears anywhere on the site.

Jennifer Ellis Yoga is live, paid and finished. The permission email is drafted.
`JENNIFER-WORK-CARD.md` in this repo has the card ready to drop in.

If the new design does one thing better than the old one, make it this: a real
named client, a link to their live site, and a sentence in their own words, above
the fold or close to it. Everything else on the page is decoration by comparison.
