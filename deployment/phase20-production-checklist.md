# Phase 20 Production Checklist

## Before enabling live data

- [ ] Confirm the NSE/BSE data agreement and permitted application/display use.
- [ ] Select direct exchange feed or authorized vendor.
- [ ] Obtain the vendor's current technical specification.
- [ ] Confirm Capital Market coverage.
- [ ] Confirm intraday/historical coverage.
- [ ] Confirm symbol master/reference-data delivery.
- [ ] Confirm corporate actions if required.
- [ ] Confirm redistribution/display rights for Android users.
- [ ] Store credentials in Secret Manager.
- [ ] Never ship feed credentials in APK/AAB.
- [ ] Test timestamps and timezone normalization.
- [ ] Test duplicate-event handling.
- [ ] Test stale quote rejection.
- [ ] Test exchange conflict detection.
- [ ] Run scanner only on accepted data.
- [ ] Keep paper trading separate from live order execution.

## Activation

Set:

NSE_LIVE_ENABLED=true

only after the provider transport has been implemented and tested.

BSE can be enabled independently.

No undocumented URL or unofficial scraping endpoint is assumed.
