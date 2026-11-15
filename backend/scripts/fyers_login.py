#!/usr/bin/env python3
"""
One-time interactive helper to mint a Fyers API access token.

Fyers uses an OAuth-style login that requires a human to log in through a
browser, so this can't happen inside the API server — run it by hand
whenever you need a fresh token (Fyers access tokens are short-lived, about
one trading day).

Usage:
    FYERS_CLIENT_ID=XC1234-100 \\
    FYERS_SECRET_KEY=your-secret \\
    FYERS_REDIRECT_URI=https://your-redirect-uri \\
    python backend/scripts/fyers_login.py

It will:
  1. Print a login URL (and try to open it in your browser).
  2. Ask you to log in to Fyers there and paste back the redirected URL
     (or just the "auth_code" query parameter from it).
  3. Exchange that auth code for an access token and print it.

Then put the printed token in your environment / secret manager as
FYERS_ACCESS_TOKEN (see docs/fyers-setup.md), alongside the same
FYERS_CLIENT_ID.

Never commit FYERS_SECRET_KEY, the auth code, or the access token to source
control or put them in the Android app.
"""

import os
import sys
import webbrowser
from urllib.parse import urlparse, parse_qs

try:
    from fyers_apiv3 import fyersModel
except ImportError:
    print("fyers-apiv3 is not installed. Run: pip install fyers-apiv3", file=sys.stderr)
    sys.exit(1)


def main():
    client_id = os.getenv("FYERS_CLIENT_ID")
    secret_key = os.getenv("FYERS_SECRET_KEY")
    redirect_uri = os.getenv("FYERS_REDIRECT_URI")

    missing = [
        name
        for name, value in [
            ("FYERS_CLIENT_ID", client_id),
            ("FYERS_SECRET_KEY", secret_key),
            ("FYERS_REDIRECT_URI", redirect_uri),
        ]
        if not value
    ]
    if missing:
        print(f"Missing required environment variable(s): {', '.join(missing)}", file=sys.stderr)
        print("See the module docstring (or docs/fyers-setup.md) for how to obtain these.", file=sys.stderr)
        sys.exit(1)

    session = fyersModel.SessionModel(
        client_id=client_id,
        redirect_uri=redirect_uri,
        response_type="code",
        state="stock-intelligence-login",
        secret_key=secret_key,
        grant_type="authorization_code",
    )

    login_url = session.generate_authcode()
    print("\n1. Open this URL and log in to your Fyers account:\n")
    print(f"   {login_url}\n")
    try:
        webbrowser.open(login_url, new=1)
    except Exception:
        pass  # headless environment — the user can still copy the URL above

    print("2. After logging in, Fyers redirects you to your redirect URI with")
    print("   an 'auth_code' query parameter (the page itself may fail to load —")
    print("   that's fine, you only need the URL from the address bar).\n")
    pasted = input("   Paste that full redirect URL (or just the auth_code): ").strip()

    auth_code = pasted
    parsed = urlparse(pasted)
    if parsed.query:
        auth_code = parse_qs(parsed.query).get("auth_code", [pasted])[0]

    session.set_token(auth_code)
    response = session.generate_token()

    access_token = response.get("access_token")
    if not access_token:
        print(f"\nToken exchange failed: {response}", file=sys.stderr)
        sys.exit(1)

    print("\nSuccess. Set these (e.g. in your secret manager / .env — never commit them):\n")
    print(f"  FYERS_CLIENT_ID={client_id}")
    print(f"  FYERS_ACCESS_TOKEN={access_token}")
    print("\nThis access token expires around end-of-trading-day; re-run this script to refresh it.")


if __name__ == "__main__":
    main()
