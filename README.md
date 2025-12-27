## Authentication flow

UI → Google OAuth URL redirect to Google login page

Google → redirects user back to: http://localhost:5173/auth/callback?code=XYZ

UI → sends the code to your backend securely: POST /auth/google/callback  { code }

Backend → exchanges code with Google:
    POST https://oauth2.googleapis.com/token
    (client_secret required, so must be backend)

Google → returns:
    - id_token  (signed identity assertion)
    - access_token (Google API)
    - expiry

Backend → verifies id_token signature & audience

Backend → creates/updates user in DB

Backend → issues YOUR JWT with:
    - user_id
    - permissions
    - expires_in: 24h

UI → stores YOUR JWT (never stores Google tokens)

UI → now authenticated
