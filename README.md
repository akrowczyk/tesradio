# 📡 TESRADIO

A slick, dark-themed custom internet radio web app built for the Tesla browser. Static site — zero build step, zero dependencies, deploys instantly to Vercel (or any static host).

> Designed for landscape touchscreens, big enough to use while parked, simple enough to add your own streaming stations in seconds.

---

## ✨ Features

- **Dark, glassy UI** tuned for Tesla's landscape touchscreen
- **Big touch targets** — 84px play button, 56px prev/next, 44px controls
- **Add, edit, delete favorite stations** — name, stream URL, genre, emoji, accent color
- **Per-station ambient gradient** — the whole UI shifts color to match the active station
- **Live equalizer animation** while a station is playing
- **Search/filter** across station name and genre
- **Stations + last-played persist** in `localStorage` — no backend, no account, no tracking
- **Keyboard shortcuts**: `space` play/pause · `←` `→` prev/next · `↑` `↓` volume · `M` mute · `Esc` close dialog
- **Media Session API** — Tesla's steering-wheel buttons (and lock screens elsewhere) can control playback
- **Fullscreen toggle** for an edge-to-edge in-car experience
- **Pre-seeded** with two local NE Florida stations (easily replaced — see below)

## 🚗 Default stations

Out of the box the app seeds two St. Augustine, FL stations:

| Station | Frequency | Format |
|---|---|---|
| **Beach 105.5** (WBHU) | 105.5 FM | Adult hits |
| **WSOS 103.9** (W280EY / WSOS-AM 1170) | 103.9 FM | Classic hits 60s/70s/80s + local news |

Both stream over HTTPS so they work inside the Tesla browser. Edit `DEFAULT_STATIONS` in [`app.js`](./app.js) to seed your own.

## 🚀 Deploy to Vercel

```bash
# from this directory
npx vercel --prod
```

Or push to GitHub and import at [vercel.com/new](https://vercel.com/new) — Vercel auto-detects it as a static site.

## 🧑‍💻 Run locally

It's just HTML/CSS/JS — open `index.html` directly, or serve it:

```bash
python3 -m http.server 5173
# then visit http://localhost:5173
```

## ➕ Adding stations

Click **Add Station** in the top bar and provide:

- **Name** — what shows on the now-playing card
- **Stream URL** — must be `https://`. Direct MP3 or AAC streams work best. Mixed-content (`http://`) URLs are blocked by Tesla.
- **Genre / description** — free text, optional
- **Emoji** — shows on the station thumbnail
- **Color** — accent used for the ambient gradient when the station is active

Hover or tap a station to reveal the edit (pencil) button. Delete from inside the edit dialog.

### Finding stream URLs

Most internet radio stations expose their stream URL through one of:

- **Triton Digital / StreamTheWorld** — `https://playerservices.streamtheworld.com/api/livestream-redirect/{CALLSIGN}.mp3`
- **Surfer Network** — `https://stream.surfernetwork.com/{stream-id}`
- **SoundStack / StreamGuys** — varies, often `https://*.streamguys1.com/...`
- **SomaFM** — `https://ice1.somafm.com/{name}-128-mp3`

If the official site doesn't publish a direct link, open the station's web player, view source / network tab, and look for an `.mp3` / `.aac` URL.

## 📱 Tesla-specific notes

- Tesla browsers block autoplay until you tap something — first play always requires a tap.
- Use **`https://` streams only**. Tesla refuses mixed content.
- Tap the fullscreen button (top right) for edge-to-edge.
- Streams that work great in-car: anything from [SomaFM](https://somafm.com/), [KEXP](https://kexp.org/), [Radio Paradise](https://radioparadise.com/), and most modern commercial stations served via Triton/StreamTheWorld.

## 🎨 Customizing

Three files, no build step:

- **[`index.html`](./index.html)** — markup
- **[`styles.css`](./styles.css)** — visual design (CSS custom properties at the top of `:root` control palette)
- **[`app.js`](./app.js)** — playback logic and station storage. Edit `DEFAULT_STATIONS` to change seeded stations.

## 📦 Storage

Everything lives under the `tesradio.v2` prefix in `localStorage`:

| Key | Purpose |
|---|---|
| `tesradio.v2.stations` | Your full station list (defaults + custom) |
| `tesradio.v2.current` | ID of the last-played station |
| `tesradio.v2.volume` | Volume between 0 and 1 |
| `tesradio.v2.dismissedDefaults` | Default stations you've deleted (so they don't get re-seeded on reload) |

Clearing site data resets the app to factory defaults.

## ⚖️ License

Personal-use. Do whatever you want with it.
