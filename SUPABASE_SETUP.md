# Shared Supabase setup

Project: Analyst Pool Tracker

The tracker uses Supabase Postgres so every team member and the Manager see the same entries.

## Database

Run `supabase-schema.sql` in the Supabase SQL Editor for this project. It creates `task_entries`, enables RLS, and allows public reads/inserts for the public team link.

## App connection

The project URL and browser-safe anon key are configured in `script.js`. Never use the service_role key in browser code.

## Public site

After uploading `index.html`, `script.js`, `style.css`, and this SQL file to GitHub, GitHub Pages will redeploy the shared tracker.

For sensitive internal use, add Supabase Auth and change the RLS policies to require authenticated users.
