from app.data.exchange_contracts import Quote, Instrument

class BSEProvider:
    """
    Production adapter boundary for licensed BSE data.
    Do not scrape BSE webpages.
    """

    name="BSE"

    def quote(self, instrument: Instrument) -> Quote:
        raise NotImplementedError("Configure licensed BSE feed before live use")

    def candles(self, instrument: Instrument, timeframe: str, start, end):
        raise NotImplementedError("Configure licensed BSE historical feed")

    def stream(self, instruments):
        raise NotImplementedError("Configure licensed BSE realtime stream")
