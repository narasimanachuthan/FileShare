import redis
from fastapi import HTTPException, Request, status
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class RateLimiter:
    def __init__(self, times: int, seconds: int):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}:upload"
        current_count = redis_client.get(key)

        if current_count and int(current_count) >= self.times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {self.seconds // 60} minutes"
            )

        pipe = redis_client.pipeline()
        pipe.incr(key)

        if not current_count:
            pipe.expire(key, self.seconds)

        pipe.execute()