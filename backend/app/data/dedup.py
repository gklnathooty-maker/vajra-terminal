def quote_key(quote):
    return (
        quote.exchange,
        quote.symbol,
        quote.timestamp.replace(microsecond=0)
    )

def deduplicate_quotes(quotes):
    result={}
    for q in quotes:
        result[quote_key(q)]=q
    return list(result.values())
