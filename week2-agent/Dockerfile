FROM python:3.12-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --only main

COPY . .

CMD ["poetry", "run", "python", "agent_loop.py"]