import json

class RedisQuoteBus:
    """
    Shared event bus for multiple Cloud Run instances.

    Production wiring:
      provider stream -> publish(symbol channel)
      each WebSocket instance -> subscribe(channel)
      subscriber -> connected Android clients

    A shared Redis/Memorystore layer is important because Cloud Run instances
    are stateless and WebSocket connections can land on different instances.
    """

    def __init__(self, redis_client=None):
        self.redis=redis_client

    async def publish(self, channel, event):
        if not self.redis:
            return False
        await self.redis.publish(channel, json.dumps(event))
        return True
