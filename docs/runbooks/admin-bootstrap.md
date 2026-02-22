# Admin Bootstrap Runbook

Use this to grant admin dashboard access to an existing auth user by email.

## Prerequisites
- `VITE_SUPABASE_URL` set in `.env`
- `SUPABASE_SERVICE_ROLE_KEY` set in `.env`
- User already exists in `auth.users`

Optional:
- `DEFAULT_ORG_ID` in `.env` if the profile has no organization and you want one assigned.

## Command
```bash
npm run admin:grant -- nxjaime@gmail.com
```

## What it does
- Finds the auth user by email
- Upserts `profiles.role = 'admin'`
- If profile does not exist, creates one with role `admin`
- If profile exists but has no `organization_id` and `DEFAULT_ORG_ID` is provided, assigns it

## Notes
- No credentials are hardcoded in source.
- Keep `SUPABASE_SERVICE_ROLE_KEY` private.
