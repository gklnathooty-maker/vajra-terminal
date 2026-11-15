class ProviderStream:
    """
    Provider-neutral streaming boundary.

    The selected licensed market-data vendor should implement:
      subscribe(symbols)
      unsubscribe(symbols)
      receive()

    No vendor-specific credentials belong in Android or source control.
    """

    async def subscribe(self,symbols):
        raise NotImplementedError

    async def unsubscribe(self,symbols):
        raise NotImplementedError

    async def receive(self):
        raise NotImplementedError
