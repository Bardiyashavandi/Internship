# ruff: noqa
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

from functools import cached_property
from typing import Optional, Any

from dotenv import load_dotenv

load_dotenv()

from google.adk.agents import LlmAgent
from google.adk.apps import App
from google.adk.models import Gemini
from google.adk.workflow import Workflow, START
from google.genai import types
from google.genai import Client
from pydantic import BaseModel, Field

import os

# Setup GCP Project Environment Variables from ADC if not already set and using Vertex AI
if os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "True").lower() == "true":
    try:
        import google.auth

        _, project_id = google.auth.default()
        if project_id and project_id != "your_gcp_project_id_here":
            os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
    except Exception:
        pass

    os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")
else:
    # Explicitly using Gemini Developer API (Google AI Studio)
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"


# In-memory store for single-use discount codes
# WELCOME50 and SUMMER20 are single-use codes (can only be redeemed once globally)
DISCOUNT_CODES = {
    "WELCOME50": {"discount": 50, "redeemed_by": set()},
    "SUMMER20": {"discount": 20, "redeemed_by": set()},
}

# Registered User IDs allowed to redeem codes
REGISTERED_USERS = {"user123", "alice", "bob", "student"}

# Loyalty point balances
LOYALTY_POINTS = {
    "user123": 150,
    "alice": 300,
    "bob": 50,
    "student": 0,
}

# Product Catalog
PRODUCTS = {
    "laptop": {"price": 999.99, "description": "High-performance developer laptop"},
    "headphones": {
        "price": 149.99,
        "description": "Noise-cancelling wireless headphones",
    },
    "keyboard": {
        "price": 89.99,
        "description": "Mechanical keyboard with RGB backlight",
    },
}


def get_product_info(product_name: str) -> str:
    """Gets description and price for a product in the retail store.

    Args:
        product_name: The name of the product to look up (e.g., laptop, headphones, keyboard).

    Returns:
        A string with the price and description of the product.
    """
    prod = product_name.lower().strip()
    if prod in PRODUCTS:
        p = PRODUCTS[prod]
        return f"Product: {product_name.capitalize()} | Price: ${p['price']} | Description: {p['description']}"
    return f"Product '{product_name}' not found. We currently stock: {', '.join(PRODUCTS.keys())}."


def redeem_discount_code(code: str, user_id: str) -> str:
    """Redeems a single-use discount code for a registered user.

    Args:
        code: The discount code to redeem (e.g., WELCOME50, SUMMER20).
        user_id: The ID of the registered user redeeming the code (e.g., user123, alice, bob, student).

    Returns:
        A success or error message explaining the outcome of the redemption.
    """
    c = code.strip().upper()
    u = user_id.strip()

    if u not in REGISTERED_USERS:
        return f"Error: User ID '{user_id}' is not registered. Registration is required to redeem codes."

    if c not in DISCOUNT_CODES:
        return f"Error: Discount code '{code}' is invalid."

    code_info = DISCOUNT_CODES[c]
    redeemed_by: set[str] = code_info["redeemed_by"]

    # Check if this code has already been redeemed by anyone (globally single-use)
    if len(redeemed_by) > 0:
        redeemed_user = next(iter(redeemed_by))
        return f"Error: Discount code '{code}' has already been redeemed by user '{redeemed_user}' and is no longer valid."

    # Mark as redeemed by this user
    redeemed_by.add(u)
    return f"Success: Discount code '{code}' successfully redeemed for user '{user_id}'. A {code_info['discount']}% discount has been applied to your session!"


class AwardLoyaltyPointsInput(BaseModel):
    user_id: str = Field(..., description="The registered user ID of the customer.")
    purchase_amount: float = Field(
        ..., description="The total cost of the purchase in dollars (must be > 0)."
    )


def award_loyalty_points(input_data: AwardLoyaltyPointsInput) -> str:
    """Awards loyalty points to a registered user's account based on a purchase.

    Args:
        input_data: Pydantic model containing the registered user ID and purchase amount.

    Returns:
        A success string containing the updated balance or an error message if invalid.
    """
    user_id = input_data.user_id.strip()
    amount = input_data.purchase_amount

    # Security Assertions
    if user_id not in REGISTERED_USERS:
        return f"Error: User '{user_id}' is not registered. Only registered users can receive loyalty points."

    if amount <= 0:
        return "Error: Purchase amount must be greater than zero."

    # Cap maximum purchase amount per transaction to prevent runaway points exploits
    MAX_SINGLE_PURCHASE = 10000.00
    if amount > MAX_SINGLE_PURCHASE:
        return f"Error: Purchase amount exceeds the maximum limit of ${MAX_SINGLE_PURCHASE:.2f} per transaction."

    # Calculate points: 10 points per dollar, rounded to nearest integer
    points_to_award = int(round(amount * 10))

    # Update balance
    current_points = LOYALTY_POINTS.get(user_id, 0)
    new_points = current_points + points_to_award
    LOYALTY_POINTS[user_id] = new_points

    return f"Success: Awarded {points_to_award} points to user '{user_id}'. New total balance: {new_points} points."


# Custom Gemini model wrapper to explicitly initialize with a hardcoded mock API key
class CustomGemini(Gemini):
    api_key: str = "AIzaSyD-mock-key-value-12345"

    @cached_property
    def api_client(self) -> Client:
        # Initializing the model client with the hardcoded mock key to demonstrate security scanning
        # Fallback to env key if present to allow integration tests to pass locally
        env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if env_key:
            return Client(http_options={"headers": self._tracking_headers()})
        return Client(
            api_key=self.api_key, http_options={"headers": self._tracking_headers()}
        )


# Define the LlmAgent node representing the shopping assistant agent
shopping_assistant_agent = LlmAgent(
    name="shopping_assistant_agent",
    model=CustomGemini(
        model="gemini-2.5-flash",
        api_key="AIzaSyD-mock-key-value-12345",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=(
        "You are an AI shopping assistant for our online retail store. Help customers find products, "
        "check prices, redeem discount codes, and award loyalty points after a successful purchase. "
        "Always ask for the customer's registered user ID when they want to redeem a discount code "
        "or receive loyalty points."
    ),
    tools=[get_product_info, redeem_discount_code, award_loyalty_points],
)

# Connect the START trigger directly to the LlmAgent node in the Workflow
root_agent = Workflow(
    name="shopping_assistant_workflow",
    edges=[(START, shopping_assistant_agent)],
)

app = App(
    root_agent=root_agent,
    name="app",
)
