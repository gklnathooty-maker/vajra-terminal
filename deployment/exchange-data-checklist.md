# NSE/BSE Production Data Checklist

## NSE primary

1. Choose direct NSE Data & Analytics subscription or an authorized vendor.
2. Confirm Capital Market coverage.
3. Confirm historical/EOD coverage required by the product.
4. Confirm intraday/realtime level required:
   - Level 1
   - Level 2
   - Level 3
   - tick-by-tick
5. Confirm redistribution/display rights for the intended app.
6. Obtain technical specifications and credentials.
7. Store secrets only in Secret Manager.
8. Configure NSEProvider.
9. Run timestamp/price/volume reconciliation.
10. Enable live data only after quality checks.

## BSE secondary

1. Select BSE equity/API/historical products required.
2. Confirm pricing and usage rights.
3. Obtain API/data-feed documentation and credentials.
4. Configure BSEProvider.
5. Populate BSE security codes and ISIN mapping.
6. Reconcile prices where the same security trades on both exchanges.

## Application policy

NSE = primary for the main scanner and live analysis.

BSE = secondary/coverage and cross-validation.

Both remain behind the same MarketDataProvider contract.
