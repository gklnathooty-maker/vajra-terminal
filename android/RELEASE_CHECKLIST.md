# Android Production Release

- Configure release application ID.
- Configure Firebase production project.
- Configure HTTPS production API URL.
- Never embed NSE/vendor credentials.
- Enable R8/ProGuard as appropriate.
- Test offline/error states.
- Test stale-market-data banner.
- Test authentication expiry.
- Build signed AAB for Play distribution.
- Build signed APK for controlled sideload/testing.
- Perform final security review.

AAB is the Google Play publishing format; APK is the installable package.
