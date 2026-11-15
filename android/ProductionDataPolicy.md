# Android Production Data Policy

The Android app receives normalized data from the backend.

It should not:
- scrape exchanges
- contain provider credentials
- calculate a separate price stream
- bypass Firebase authentication
- request thousands of individual symbols sequentially

For a screener:
Android sends filter criteria -> backend scans cached/derived analysis ->
backend returns ranked results.

For stock detail:
Android requests one normalized stock snapshot plus chart data.

For live updates:
Android subscribes to the backend's approved live-update mechanism.
