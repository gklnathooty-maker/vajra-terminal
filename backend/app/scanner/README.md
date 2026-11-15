# Professional Scanner Engine

This module implements a provider-neutral, Chartink-style rule language.

It does NOT scrape Chartink.

Supported concepts:
- multiple timeframes
- indicator comparisons
- offsets
- ALL/ANY/NONE groups
- saved presets
- quality/momentum/risk filters
- closed-candle anti-repaint boundary

The production evaluator must map each condition to point-in-time market data.
