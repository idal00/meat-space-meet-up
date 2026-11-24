# meat space meet up

Find the date that works for everyone. The organizer picks candidate dates and shares one invite link; respondents enter their name and answer Yes / If needed / No per date; everyone sees the results and the best date.

## How it works

- `/` — create a poll (title, organizer name, note, dates).
- `/p/<slug>/share` — the invite link to send out.
- `/p/<slug>` — the invite link: respond. Returning visitors who already responded on this device go straight to results.
- `/p/<slug>/results` — everyone's answers and the best date.
- `/p/<slug>/edit` — edit or remove your own response.
- `/p/<slug>/r/<token>` — personal edit link; opens your response on another device.

No accounts. When someone responds, an unguessable edit token is stored in an httpOnly cookie for that poll, and the same token forms their personal edit link. The organizer gets an admin cookie at creation so their response is marked "Organizer".

## Data

Supabase (Postgres). Schema and functions: `supabase/migrations/`. Tables have RLS on and no grants to `anon`; the app only calls the RPC functions `create_poll`, `get_poll`, `submit_response`, `update_response`, `delete_response`, which check tokens and never return them.

## Setup

```bash
cp .env.example .env.local   # fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

On Vercel, set the same two environment variables in the project settings.

## Theme

Colors live as CSS variables under `[data-theme="christmas"]` in `src/app/globals.css`; the `<html>` element sets `data-theme`. A theme picker would add another block with the same variables.
