# Cloud Run Deployment Outline

Authenticate Google Cloud:

gcloud auth login

Set project:

gcloud config set project YOUR_PROJECT_ID

Build container:

gcloud builds submit backend \
  --tag REGION-docker.pkg.dev/YOUR_PROJECT_ID/stock-intelligence/api:latest

Deploy:

gcloud run deploy stock-intelligence-api \
  --image REGION-docker.pkg.dev/YOUR_PROJECT_ID/stock-intelligence/api:latest \
  --region REGION \
  --platform managed

Do not place provider API keys in these commands.

Use Secret Manager and Cloud Run secret bindings for production credentials.
