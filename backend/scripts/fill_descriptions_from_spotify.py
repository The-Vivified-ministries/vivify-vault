"""
One-time / occasional data-prep utility — NOT part of the live backend.

Reads a spreadsheet with Title, Category, Link (and optionally an empty
Description column), fetches each Spotify episode's description via the
Spotify Web API, and fills in Description only where it's currently
blank — so re-running this after you've manually edited some
descriptions won't overwrite your edits.

Usage:
    python scripts/fill_descriptions_from_spotify.py \
        --input data/sermons.xlsx \
        --output data/sermons_with_descriptions.xlsx

Then review the output before renaming it to sermons.xlsx and syncing.
"""

import argparse
import os
import re
import time
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
# Episode availability/metadata can be market-dependent. Set this to
# wherever your audience actually is — "NG" for Nigeria, "US" as a
# broad fallback if NG returns gaps.
SPOTIFY_MARKET = os.getenv("SPOTIFY_MARKET", "NG")

EPISODE_ID_PATTERN = re.compile(r"episode[/:]([a-zA-Z0-9]+)")


def get_access_token() -> str:
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def extract_episode_id(url: str) -> str | None:
    match = EPISODE_ID_PATTERN.search(url or "")
    return match.group(1) if match else None


def fetch_episodes_batch(ids: list[str], token: str) -> dict[str, dict]:
    """ids: up to 50 Spotify episode IDs. Returns {id: episode_data}."""
    resp = requests.get(
        "https://api.spotify.com/v1/episodes",
        params={"ids": ",".join(ids), "market": SPOTIFY_MARKET},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    resp.raise_for_status()
    episodes = resp.json().get("episodes", [])
    return {ep["id"]: ep for ep in episodes if ep}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise SystemExit(
            "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in your .env — "
            "see the setup instructions before running this."
        )

    df = pd.read_excel(args.input)
    if "Description" not in df.columns:
        df["Description"] = ""
    df["Description"] = df["Description"].fillna("")

    token = get_access_token()

    # Only rows with a Spotify link AND a currently-blank description
    # need fetching at all.
    needs_fetch = df[
        df["Spotify Link"].astype(str).str.contains("spotify", case=False, na=False)
        & (df["Description"].astype(str).str.strip() == "")
    ]

    id_to_row = {}
    for idx, row in needs_fetch.iterrows():
        ep_id = extract_episode_id(str(row["Spotify Link"]))
        if ep_id:
            id_to_row[ep_id] = idx
        else:
            print(f"  ! Couldn't parse episode ID from: {row['Link']}")

    all_ids = list(id_to_row.keys())
    filled, not_found = 0, 0

    for i in range(0, len(all_ids), 50):
        batch = all_ids[i : i + 50]
        try:
            episodes = fetch_episodes_batch(batch, token)
        except requests.HTTPError as e:
            print(f"  ! Batch request failed: {e}")
            continue

        for ep_id in batch:
            row_idx = id_to_row[ep_id]
            episode = episodes.get(ep_id)
            if episode and episode.get("description"):
                df.at[row_idx, "Description"] = episode["description"].strip()
                filled += 1
            else:
                not_found += 1
                print(f"  ! No description found for episode {ep_id} "
                      f"(row: \"{df.at[row_idx, 'Title']}\")")

        time.sleep(0.2)  # polite pacing, well within Spotify's rate limits

    skipped_non_spotify = len(df) - len(needs_fetch) - (
        df["Description"].astype(str).str.strip().ne("").sum() - filled
    )

    df.to_excel(args.output, index=False)

    print("\n--- Summary ---")
    print(f"Total rows:              {len(df)}")
    print(f"Descriptions filled:     {filled}")
    print(f"Spotify episodes not found: {not_found}")
    print(f"Rows already had a description or non-Spotify link: "
          f"{len(df) - len(needs_fetch)}")
    print(f"\nWrote: {args.output}")
    print("Review this before renaming it over your real sermons.xlsx — "
          "Spotify descriptions vary in quality; some may need editing.")


if __name__ == "__main__":
    main()
