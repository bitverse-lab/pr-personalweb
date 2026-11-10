# Backups

`.github/workflows/backup.yml` runs every day at 02:30 Jakarta time (and on demand from the
Actions tab → **Backup** → **Run workflow**). Each run stores one encrypted file,
`personal-os-backup-YYYY-MM-DD.tar.gz.gpg`, as a workflow artifact kept for **90 days**.

Inside, once decrypted:

| File | What it is |
| --- | --- |
| `database.dump` | `pg_dump --format=custom` of the `public` schema: every table, all rows |
| `row-counts.txt` | Rows per table at backup time, to check a restore against |
| `storage/<bucket>/…` | Every Storage object (photos, covers, documents) |
| `storage/buckets.json` | Bucket settings and the object list |
| `created-at.txt` | When the backup was taken (UTC) |

The daily connection also counts as activity, which helps keep a free-tier Supabase project from
being paused. It is not a guarantee: open the site now and then too.

## Setup (once)

1. Repository → **Settings → Secrets and variables → Actions → New repository secret**, four times:

   | Secret | Value |
   | --- | --- |
   | `BACKUP_DATABASE_URL` | The **Session pooler** connection string (port 5432), i.e. `DIRECT_URL` |
   | `BACKUP_SUPABASE_URL` | `SUPABASE_URL` |
   | `BACKUP_SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
   | `BACKUP_PASSPHRASE` | A long passphrase **kept outside this repo** (password manager). Without it the backups cannot be opened. |

2. The workflow must be on `main` for the schedule to run. After merging, run it once by hand and
   check that the artifact appears.

## Restore

You need the PostgreSQL 17 client tools (`pg_restore`, `psql`) and `gpg`.

```bash
# 1. Download the artifact from the Actions run, unzip it, then decrypt and unpack
gpg --decrypt personal-os-backup-2026-11-10.tar.gz.gpg | tar -xzf - -C restore/

# 2. Database: into an EMPTY project (create the tables first with `pnpm db:push`, or let
#    pg_restore create them). --clean drops and recreates what the dump contains.
pg_restore --dbname "$DIRECT_URL" --no-owner --no-privileges --clean --if-exists restore/database.dump

# 3. Compare row counts with restore/row-counts.txt

# 4. Storage: upload restore/storage/<bucket>/… back into buckets with the settings in
#    restore/storage/buckets.json (the app recreates its two buckets on first upload).
```

Restoring over a live database replaces its rows with the backup's. Restore into a new project
first if you only need to look something up.

Between automatic backups, **Settings → Data → Export** in the workspace downloads everything as
JSON at any time.
