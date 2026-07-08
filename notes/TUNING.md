# Balance & tuning notes (not part of the game)

All knobs live in the `<script>` block of `index.html`.

## Core knobs
| Knob | Where | Current | Effect |
|---|---|---|---|
| `FIRE_MULT` | top of script | 18 | Freedom bar target = 18 × annual lifestyle burn. Lower = faster wins. |
| `TAX` | top of script | 0.62 | Take-home fraction of comp. |
| market return | `finance()` | mean +2.1%/qtr, σ 6% | Portfolio drift. |
| lifestyle burn | `burnRt()` | $68k + level×$14k | The satire knob: promotions raise your escape number. |
| layoff odds | `maybeEvent()` | 2%/qtr + chaos/400 | `chaos` rises with bad company events, decays 2/qtr. |
| event rate | `maybeEvent()` | 62% of quarters | Chaos-per-tap dial. |
| promo odds | `review()` | `(perf−55)/60`, cap 85% | Rolled yearly. |
| YC accept | `doYC()` | 30% + traction/250 | Founder path entry. |

## Measured balance (400 auto-play runs each, via notes/smoke.js)
- **Greedy bot** (grind, touch grass at 62 burnout, retire when able):
  97% escape, avg **13.7 years** (~55 taps ≈ 3 min session).
- **Random bot**: 43% permanent underclass, 35% burnout, 15% escape,
  6% founder exit, 1% grinds to age 60. Losing is the content.

## Re-run the harness after any tuning
```bash
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' ../index.html > game.js
node smoke.js                 # random play
POLICY=greedy node smoke.js   # skilled play
```
Watch for: crashes > 0, greedy escape < 80% (too hard), greedy avg years > 16
(sessions too long), random escape > 30% (too easy to be funny).

## Virality ideas not yet built
- OG/meta tags + real hosting (artifact link works for playtesting; a custom
  domain like `escapetheratrace.lol` screenshots better in the tweet card).
- Seeded daily run (same RNG for everyone, Wordle-style "Day 37" in share text).
- A visible "AGI ETA: 2 years (still)" counter is in; could tick *up* over time.
- Sound: a single Slack "knock brush" on bad events would be evil and great.
