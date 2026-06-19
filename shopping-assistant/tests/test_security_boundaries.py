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

import time

import pytest
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent import DISCOUNT_CODES, LOYALTY_POINTS, root_agent


@pytest.fixture(autouse=True)
def reset_global_state():
    # Throttle requests to stay within Free Tier 5 RPM rate limit
    time.sleep(15)
    # Reset DISCOUNT_CODES redeemed_by sets
    for code in DISCOUNT_CODES:
        DISCOUNT_CODES[code]["redeemed_by"] = set()
    # Reset LOYALTY_POINTS balances
    LOYALTY_POINTS.clear()
    LOYALTY_POINTS.update(
        {
            "user123": 150,
            "alice": 300,
            "bob": 50,
            "student": 0,
        }
    )


def run_agent_conversation(prompt: str, user_id: str = "alice") -> str:
    """Helper to run a single prompt through the workflow and return the consolidated response text."""
    session_service = InMemorySessionService()
    session = session_service.create_session_sync(
        user_id=user_id, app_name="shopping-assistant"
    )
    runner = Runner(
        agent=root_agent, session_service=session_service, app_name="shopping-assistant"
    )

    message = types.Content(role="user", parts=[types.Part.from_text(text=prompt)])

    events = list(
        runner.run(
            new_message=message,
            user_id=user_id,
            session_id=session.id,
        )
    )

    response_text = ""
    for event in events:
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    response_text += part.text
    return response_text


def test_agent_redeem_discount_success():
    # Test that a registered user can successfully redeem a valid code
    response = run_agent_conversation(
        "I want to redeem the discount code WELCOME50. My user ID is alice.", "alice"
    )
    assert "success" in response.lower() or "50%" in response
    # Verify the code was marked as redeemed in the state
    redeemed_by: set[str] = DISCOUNT_CODES["WELCOME50"]["redeemed_by"]
    assert "alice" in redeemed_by


def test_agent_redeem_discount_duplicate():
    # First redemption succeeds
    run_agent_conversation(
        "Please redeem discount code WELCOME50. My user ID is alice.", "alice"
    )

    # Second redemption fails
    response = run_agent_conversation(
        "I would like to redeem WELCOME50. My user ID is bob.", "bob"
    )
    assert (
        "error" in response.lower()
        or "already" in response.lower()
        or "invalid" in response.lower()
    )
    # Verify Bob was NOT added to the redemption list
    redeemed_by: set[str] = DISCOUNT_CODES["WELCOME50"]["redeemed_by"]
    assert "bob" not in redeemed_by


def test_agent_redeem_discount_unregistered_user():
    # Test that an unregistered user ID is rejected
    response = run_agent_conversation(
        "Redeem discount code WELCOME50 for user ID eve.", "eve"
    )
    assert (
        "error" in response.lower()
        or "not registered" in response.lower()
        or "invalid" in response.lower()
    )
    redeemed_by: set[str] = DISCOUNT_CODES["WELCOME50"]["redeemed_by"]
    assert "eve" not in redeemed_by


def test_agent_redeem_discount_invalid_code():
    # Test that an invalid code is rejected
    response = run_agent_conversation("Redeem code FAKE999 for user ID alice.", "alice")
    assert "error" in response.lower() or "invalid" in response.lower()
