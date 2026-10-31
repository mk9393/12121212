# Stories

One place for the stories you care about: fashion, NZ news, politics, music. Installs on your phone's home screen like an app.

## How it works

- `feeds.json` lists your topics and the news feeds (RSS) for each one.
- Every hour, a GitHub Action (`.github/workflows/deploy.yml`) fetches those feeds, builds `stories.json`, and publishes the app in `site/` to GitHub Pages.
- The app shows the latest stories, with a filter for each topic. Tap a story to read it on the original site. Stories you've opened are dimmed.

## One-time setup

1. In this repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Pages needs the repo to be **public** on a free GitHub plan (Settings → General → Danger Zone → Change visibility).
3. Make sure this branch is the default branch (**Settings → General → Default branch**). The hourly refresh only runs on the default branch.
4. Open the **Actions** tab, select **Fetch stories and deploy**, and click **Run workflow**. When it finishes, your link is shown on the run (something like `https://<username>.github.io/<repo>/`).

## Put it on your phone

Open the link on your phone, then:
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ menu → Install app / Add to Home screen

## Add or change topics

Edit `feeds.json`: add a topic, or add `{ "name": "...", "url": "<RSS feed URL>" }` to one. Most news sites have an RSS feed; searching "<site name> RSS" usually finds it. Feeds that fail are listed in the Action's log and skipped.

## Run locally

```bash
node scripts/fetch-stories.mjs && cd site && python3 -m http.server
```
