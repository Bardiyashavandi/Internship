# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import base64
import json
import logging
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.adk.runners import InMemoryRunner
from google.genai import types as genai_types

from expense_agent.agent import app as adk_app

# --- Developer Checklist Configurations ---
# Telemetry: Disable exporting OpenTelemetry traces to Google Cloud
import os
os.environ["GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY"] = "false"

# Logging: Configure standard Python logging for console logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ambient_expense_agent")

app = FastAPI(title="Ambient Expense Approval Agent Trigger Server")

# Initialize ADK Runner (using InMemoryRunner for local testing)
runner = InMemoryRunner(app=adk_app)


class PubSubMessage(BaseModel):
    attributes: dict[str, str] | None = None
    data: str | None = None
    messageId: str | None = None


class PubSubPayload(BaseModel):
    message: PubSubMessage
    subscription: str | None = None


@app.post("/trigger/pubsub")
@app.post("/apps/expense_agent/trigger/pubsub")
async def trigger_pubsub(payload: PubSubPayload):
    # Gotcha: Pub/Sub sends fully-qualified subscription path, normalize it to a short name
    sub_path = payload.subscription or "pubsub-subscription"
    short_sub_name = sub_path.split("/")[-1]
    
    logger.info("Received Pub/Sub message from subscription: %s (normalized: %s)", sub_path, short_sub_name)

    # Decode base64 data payload
    if not payload.message.data:
        logger.warning("Pub/Sub message contains no data payload.")
        raise HTTPException(status_code=400, detail="Message data is required")
        
    try:
        decoded_bytes = base64.b64decode(payload.message.data)
        raw_data = decoded_bytes.decode("utf-8")
    except Exception as e:
        logger.error("Failed to decode base64 message data: %s", e)
        raise HTTPException(status_code=400, detail="Invalid base64 encoding in message.data")
        
    logger.info("Decoded data payload: %s", raw_data)

    # Generate session ID and user ID
    session_id = payload.message.messageId or str(uuid.uuid4())
    user_id = short_sub_name

    # Create session
    await runner.session_service.create_session(
        app_name="expense_agent",
        user_id=user_id,
        session_id=session_id
    )

    # Wrap the decoded data payload as the content message for the START node
    message = genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=raw_data)]
    )

    logger.info("Running workflow for session %s and user %s...", session_id, user_id)

    events = []
    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=message
        ):
            events.append(event)
            # Log output if any node outputs user-facing content
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        logger.info("[Workflow Output]: %s", part.text.strip())
    except Exception as e:
        logger.error("Error executing workflow: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {e}")

    return {
        "status": "success",
        "session_id": session_id,
        "processed_events": len(events)
    }
