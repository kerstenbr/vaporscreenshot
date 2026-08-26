# VaporScreenshot

A small self-hosted web app that prepares screenshots sitting on your
computer so Steam Screenshot Uploader picks them up as if they belonged to a game, 
without needing Steam's in-game overlay. Pick an account, pick a game, 
drop in some screenshots, and it writes properly-formatted JPEGs + thumbnails 
into your Steam `userdata` folder and registers them in that game's
`screenshots.vdf`.

Runs entirely locally in Docker.

## Quick start (with Docker)

1. Clone this repository.
2. **Quit Steam.** This tool edits `screenshots.vdf` directly; Steam
   should not have it open at the same time.
3. Copy `.env.example` to `.env` and set `STEAM_DIR` to your Steam
   install folder (see the path table below).
4. ```bash
   docker compose up --build
   ```
5. Open **http://localhost:8010**.
6. Pick your account → pick a game → drag in screenshots → hit Prepare.
7. Start Steam again. It'll pick up the new entries, just select the game and go to screenshots.

## Local development (without Docker)

I strongly suggest that you use Docker, but if you don't want to use it, you can try:

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
STEAM_USERDATA_DIR=/path/to/Steam/userdata \
STEAM_STEAMAPPS_DIR=/path/to/Steam/steamapps \
STEAM_CONFIG_DIR=/path/to/Steam/config \
uvicorn app.main:app --reload --port 8010
```

Frontend (proxies `/api` to the backend above - see `vite.config.ts`):
```bash
cd frontend
npm install
npm run dev
```

## Where's my Steam folder?

The folder needs to directly contain `userdata`, `steamapps`, and
`config` subfolders.

| OS | Typical path |
|---|---|
| Windows | `C:/Program Files (x86)/Steam` |
| macOS | `~/Library/Application Support/Steam` |
| Linux | `~/.local/share/Steam` (or `~/.steam/steam`) |

## What actually happens to your files

For each screenshot you queue, VaporScreenshot:

1. Reads it, respecting EXIF rotation.
2. If it's over Steam Cloud's published limits (16000px on a side, or
   ~26.2 megapixels total), resizes/skips/forces it per your setting.
3. Converts it to JPEG at your chosen quality if it wasn't one already.
4. Names it `YYYYMMDDHHMMSS_n.jpg` (Steam's own overlay naming
   convention) and writes it, plus a thumbnail, into
   `userdata/<account>/760/remote/<appid>/screenshots/`.
5. Adds a matching entry to that account's
   `userdata/<account>/760/screenshots.vdf`.

**Before the very first write of each session**, if a
`screenshots.vdf` already exists, it's copied to
`screenshots.vdf.bak-<timestamp>` right next to the original. If
anything looks wrong afterward, you can always restore that backup by
hand.

Note: You have to manually delete the backups later.

`steamapps/` and `config/` are only ever mounted **read-only**.

## Credits

Inspired by [SteaScree](https://github.com/awthwathje/SteaScree)
by awthwathje (GPL-3.0).
