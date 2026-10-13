# Tusk of Wrath

A 2D side-scroller demo: a baby elephant witnesses poachers kill his parents for ivory, grows up in exile, and raids the village that hunted them — unlocking trunk weapons as he goes.

## Play

```bash
# from this folder
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) on a computer.

### iPhone / iPad (Safari)

The game has on-screen touch controls (move, jump, attack, weapon).

1. On your computer, start the server as above.
2. Find your computer’s local IP (e.g. `192.168.1.20`).
3. On the iPhone (same Wi‑Fi), open `http://YOUR_IP:8080` in Safari.
4. Tip: landscape mode gives more play space. You can also **Share → Add to Home Screen** for a fuller feel.

If the game is only running in a cloud agent, your phone can’t reach that machine — host the folder on GitHub Pages, Netlify, or your own PC first.

## Controls

| Desktop | Phone | Action |
|---------|-------|--------|
| A / D or ← / → | ◀ ▶ | Move |
| W / Space / ↑ | Jump | Jump |
| J or Z | Atk | Attack |
| 1–4 | Wpn | Switch weapon |

## Demo content

1. **The Clearing** — calf escapes hunters; find Trunk Knives  
2. **The Growing Years** — juvenile training; unlock Machine Gun Trunk  
3. **Ivory Village** — adult raid; unlock Fire Breath; beat the chief hunter  

Reach the golden flag at the end of each stage to continue.

## Stack

Plain HTML / CSS / Canvas ES modules — no build step. Easy to open, tweak, and expand later (more stages, art, sound).

## Scope note

This is a **linear side-scroller prototype**, not a full open world. That keeps the story and combat fantasy playable now; a larger map can come after the core loop feels good.
