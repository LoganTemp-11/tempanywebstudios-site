# Jennifer Ellis Yoga as the first work card

**Do not merge this until Jennifer has said yes.** Portfolio use is opt-in under
your own terms, and the email asking her ("A favour, if you have a minute") is
drafted in Gmail and unsent. Send it AFTER the TWS-003 balance has cleared.

## State as at 2 Sep 2026

Everything is built on the local branch **`jennifer-card`** (not pushed):

- `images/work/jennifer-ellis-yoga.jpg` (900x563) and `-640.jpg`, real
  screenshot of her live homepage, same progressive-JPEG q80 as the other four.
- The card sits FIRST in the proof grid and spans both columns as a featured
  "live client site" item, so the grid stays an even 2x2 underneath.
- Proof clause copy now reads "Five examples... The first is a paying client's
  live site, shown with her permission."
- `style.css` bumped to `?v=14` in the same change (cache lesson from 1 Sep).
- An HTML comment under her card marks where her testimonial goes.
- Verified locally at 1280px (featured card 634px wide, four below at 307px)
  and 375px (single column, no horizontal overflow).

## When she says yes

1. `git checkout main && git merge jennifer-card && git push`
2. If her domain is live by then, change the card's `href` from
   `https://jenniferellisyoga.pages.dev/` to `https://yogawithjenniferellis.co.uk/`.
3. Drop her sentence into the `attachment-quote` comment and uncomment it.
4. Purge the Cloudflare cache for the homepage if the old copy lingers.

If she says no, `git branch -D jennifer-card` and leave the live site as it is.
