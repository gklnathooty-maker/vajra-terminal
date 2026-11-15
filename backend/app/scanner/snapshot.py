from datetime import datetime, timezone

def build_snapshot(symbol, analysis):
    return {
        "symbol":symbol,
        "as_of":datetime.now(timezone.utc).isoformat(),
        "close":analysis.get("price"),
        "ema20":analysis.get("ema20"),
        "ema50":analysis.get("ema50"),
        "ema200":analysis.get("ema200"),
        "rsi14":analysis.get("rsi"),
        "macd":analysis.get("macd"),
        "adx14":analysis.get("adx"),
        "vwap":analysis.get("vwap"),
        "volume_ratio":analysis.get("volume_ratio"),
        "rr":analysis.get("risk_reward"),
        "momentum":analysis.get("momentum"),
        "technical_score":analysis.get("technical_score"),
        "quality_rank":analysis.get("quality_rank"),
        "analysis": {
            "signal":analysis.get("signal","WATCH"),
            "quality_rank":analysis.get("quality_rank","C"),
            "momentum":analysis.get("momentum",0),
            "risk_reward":analysis.get("risk_reward",0),
            "mtf_alignment":analysis.get("mtf_alignment","NEUTRAL"),
        }
    }
