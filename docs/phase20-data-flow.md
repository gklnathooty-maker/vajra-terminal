# Phase 20 Data Flow

Licensed NSE/BSE provider
        |
        v
Provider Transport Adapter
        |
        v
LiveMarketGateway
        |
        +--> Symbol Master / ISIN mapping
        |
        +--> Timestamp normalization
        |
        +--> Duplicate detection
        |
        +--> Quality Gate
        |
        +--> Freshness check
        |
        +--> NSE/BSE reconciliation
        |
        v
Redis live cache
        |
        +--> WebSocket
        +--> Scanner
        +--> Alerts
        +--> Android
        |
        v
PostgreSQL
        |
        +--> Historical candles
        +--> Quotes/trades
        +--> Analysis snapshots
        +--> Audit records
