# Secret Policy

Never put market-data credentials, Firebase service-account private keys, database passwords, Redis credentials, or release keystores in the Android application or Git repository.

Production secrets belong in the server-side secret-management system and are injected into Cloud Run at deployment/runtime. Cloud Run supports configuring secrets and environment variables on services. See the official deployment documentation before production deployment.

Required separation:

- Android: Firebase client configuration only; no provider secret.
- Backend: provider credentials and server credentials.
- CI: short-lived deployment identity where possible.
- Release signing: local secure keystore or protected CI secret store.

Rotate credentials if they are ever committed to source control.
