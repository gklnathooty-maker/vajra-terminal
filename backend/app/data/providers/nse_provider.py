from app.data.exchange_contracts import Quote, Instrument

class NSEProvider:
    """
    Production adapter boundary for licensed NSE data.
    Do not scrape NSE webpages.

    Configure this adapter with an approved direct NSE Data subscription
    or an authorized data vendor according to the applicable agreement.
    """

    name="NSE"

    def quote(self, instrument: Instrument) -> Quote:
        raise NotImplementedError("Configure licensed NSE feed before live use")

    def candles(self, instrument: Instrument, timeframe: str, start, end):
        raise NotImplementedError("Configure licensed NSE historical feed")

    def stream(self, instruments):
        raise NotImplementedError("Configure licensed NSE realtime stream")
