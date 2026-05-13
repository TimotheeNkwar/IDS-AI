import asyncio
import logging
from typing import Any, Callable, Coroutine

log = logging.getLogger(__name__)


class LLMQueue:
    def __init__(self, max_concurrent: int = 1):
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None

    async def start(self):
        self._worker_task = asyncio.create_task(self._worker())
        log.info("LLM queue worker started")

    async def stop(self):
        if self._worker_task:
            self._worker_task.cancel()

    async def _worker(self):
        while True:
            coro, future = await self._queue.get()
            try:
                async with self._semaphore:
                    result = await coro
                    future.set_result(result)
            except Exception as e:
                future.set_exception(e)
            finally:
                self._queue.task_done()

    async def submit(self, coro: Coroutine) -> Any:
        future = asyncio.get_event_loop().create_future()
        await self._queue.put((coro, future))
        log.info("LLM queue size: %d", self._queue.qsize())
        return await future


llm_queue = LLMQueue(max_concurrent=1)
