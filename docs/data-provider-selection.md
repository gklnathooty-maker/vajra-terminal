# Data Provider Selection

For the first live deployment, prioritize:

1. NSE Capital Market real-time/intraday data
2. NSE historical/EOD data
3. NSE corporate/reference data
4. BSE equity data
5. BSE historical/corporate data

If an authorized vendor can provide the required NSE/BSE datasets through a
clean API, the vendor adapter can be used instead of implementing the exchange
transport directly.

Evaluate vendors on:
- latency
- 1m/5m historical depth
- websocket/stream support
- corporate actions
- symbol master quality
- rate limits
- reliability
- redistribution/display rights
- cost
- support
