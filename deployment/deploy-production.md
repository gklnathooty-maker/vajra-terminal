# Phase 16 Production Deployment

Cloud Run supports deploying container images from Artifact Registry and creating immutable revisions. Use a private service where appropriate and expose only the required application endpoints.

## Recommended sequence

1. Create/configure Google Cloud project and billing.
2. Create Artifact Registry repository.
3. Configure PostgreSQL.
4. Configure Redis/Memorystore.
5. Configure Firebase Authentication and FCM.
6. Store provider/database secrets in the server-side secret system.
7. Build and push the backend image.
8. Deploy the API service to Cloud Run.
9. Configure environment variables/secrets.
10. Run `/health` and authenticated API smoke tests.
11. Configure the Android API base URL and WebSocket URL.
12. Build a release AAB.
13. Run closed testing.
14. Enable production market-data access only after validation.

Use the Google Cloud documentation for the current deployment commands and required IAM roles.
