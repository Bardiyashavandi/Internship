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

import ast
import base64
import json
import os
import re
from typing import Any

from dotenv import load_dotenv
# Load environment variables from .env first
load_dotenv()

import google.auth
from google.adk.agents import LlmAgent
from google.adk.apps import App, ResumabilityConfig
from google.adk.agents.context import Context
from google.adk.events.event import Event
from google.adk.events.request_input import RequestInput
from google.adk.workflow import Workflow, node, START
from google.genai import types as genai_types
from pydantic import BaseModel, Field

from . import config

# Setup GCP Project Environment Variables from ADC if not already set and using Vertex AI
if os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "True").lower() == "true":
    try:
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


# Define Schemas for structured I/O
class ExpenseReport(BaseModel):
    amount: float
    submitter: str
    category: str
    description: str
    date: str


class RiskAssessment(BaseModel):
    risk_score: int = Field(description="Risk score from 1 (low) to 10 (high)")
    risk_factors: list[str] = Field(description="List of identified risk factors or compliance issues")
    summary: str = Field(description="Brief summary of the risk assessment")


# Node 1: Parse and route the input payload
@node
def parse_and_route(ctx: Context, node_input: Any):
    """Parses JSON or base64 Pub/Sub expense report payloads and decides the workflow path."""
    text = ""
    payload = {}

    if isinstance(node_input, genai_types.Content):
        if node_input.parts:
            text = "".join([part.text for part in node_input.parts if part.text is not None])
    elif isinstance(node_input, str):
        text = node_input
    elif isinstance(node_input, dict):
        payload = node_input

    if text:
        # Clean up markdown code blocks if present (often pasted in UI)
        cleaned_text = text.strip()
        if cleaned_text.startswith("```"):
            cleaned_text = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned_text)
            cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
            cleaned_text = cleaned_text.strip()
        try:
            payload = json.loads(cleaned_text)
        except Exception:
            try:
                # ast.literal_eval handles single quotes
                payload = ast.literal_eval(cleaned_text)
            except Exception:
                # Fallback if input is not JSON string
                payload = {"description": text}

    # Extract the payload value sitting under "data"
    data_val = None
    if isinstance(payload, dict):
        if "message" in payload and isinstance(payload["message"], dict) and "data" in payload["message"]:
            data_val = payload["message"]["data"]
        elif "data" in payload:
            data_val = payload["data"]
        else:
            data_val = payload

    # Decode base64 if it is a base64 encoded string
    if isinstance(data_val, str):
        try:
            decoded = base64.b64decode(data_val).decode("utf-8")
            data_val = json.loads(decoded)
        except Exception:
            try:
                data_val = json.loads(data_val)
            except Exception:
                try:
                    data_val = ast.literal_eval(data_val)
                except Exception:
                    pass

    # Build typed ExpenseReport
    if isinstance(data_val, dict):
        expense = ExpenseReport(
            amount=float(data_val.get("amount", 0.0)),
            submitter=data_val.get("submitter", "Unknown"),
            category=data_val.get("category", "General"),
            description=data_val.get("description", "No description provided"),
            date=data_val.get("date", "Unknown")
        )
    else:
        expense = ExpenseReport(
            amount=0.0,
            submitter="Unknown",
            category="General",
            description=str(data_val),
            date="Unknown"
        )

    expense_dict = expense.model_dump()

    # Route dynamically in Python code based on threshold
    if expense.amount < config.APPROVAL_THRESHOLD:
        return Event(
            output=expense_dict,
            route="auto_approve",
            state={"expense": expense_dict}
        )
    else:
        return Event(
            output=expense_dict,
            route="llm_review",
            state={"expense": expense_dict}
        )


# Node 2: Auto-approve branch
@node
def auto_approve(ctx: Context, node_input: dict):
    """Automatically approves expenses under the threshold."""
    outcome = {
        "status": "APPROVED",
        "reason": f"Auto-approved (amount ${node_input['amount']:.2f} is under the ${config.APPROVAL_THRESHOLD:.2f} threshold)",
        "expense": node_input
    }

    message = (
        f"✅ **Expense Auto-Approved**\n\n"
        f"* **Submitter:** {node_input['submitter']}\n"
        f"* **Amount:** ${node_input['amount']:.2f}\n"
        f"* **Category:** {node_input['category']}\n"
        f"* **Description:** {node_input['description']}\n"
        f"* **Date:** {node_input['date']}\n\n"
        f"*Reason:* {outcome['reason']}"
    )

    yield Event(content=genai_types.Content(role="model", parts=[genai_types.Part.from_text(text=message)]))
    yield Event(output=outcome, state={"outcome": outcome})


# Security Checkpoint Helper Functions
def scrub_sensitive_data(text: str) -> tuple[str, bool]:
    """Scrubs personal data (SSN and credit card numbers) from descriptions."""
    # SSN pattern: XXX-XX-XXXX
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    # Credit Card pattern: 13-16 digits with optional spaces or dashes
    cc_pattern = r'\b(?:\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|\d{13,16})\b'

    scrubbed = text
    redacted = False

    if re.search(ssn_pattern, scrubbed):
        scrubbed = re.sub(ssn_pattern, '[REDACTED_SSN]', scrubbed)
        redacted = True

    if re.search(cc_pattern, scrubbed):
        scrubbed = re.sub(cc_pattern, '[REDACTED_CARD]', scrubbed)
        redacted = True

    return scrubbed, redacted


def detect_prompt_injection(text: str) -> bool:
    """Detects instruction-stuffing or jailbreak phrases trying to bypass rules."""
    injection_keywords = [
        "ignore previous instructions",
        "ignore instruction",
        "bypass rules",
        "override",
        "system prompt",
        "system instruction",
        "force auto-approve",
        "force approval",
        "ignore rules",
        "you must approve",
        "approve this request",
        "you are now",
        "do not analyze"
    ]
    lower_text = text.lower()
    for keyword in injection_keywords:
        if keyword in lower_text:
            return True
    return False


# Node 2.5: Security Checkpoint
@node
def security_checkpoint(ctx: Context, node_input: dict):
    """Scrubs sensitive data and routes around the LLM if prompt injection is detected."""
    expense = node_input.copy()
    description = expense.get("description", "")

    # 1. Personal Data Scrubbing
    scrubbed_desc, redacted = scrub_sensitive_data(description)
    if redacted:
        expense["description"] = scrubbed_desc
        # Track redacted categories in context state
        redacted_categories = ctx.state.get("redacted_categories", [])
        if expense["category"] not in redacted_categories:
            redacted_categories.append(expense["category"])
        ctx.state["redacted_categories"] = redacted_categories

    ctx.state["expense"] = expense

    # 2. Defend against prompt injection
    if detect_prompt_injection(scrubbed_desc):
        ctx.state["security_event"] = True
        return Event(
            output=expense,
            route="bypass_llm",
            state={"expense": expense, "security_event": True}
        )

    return Event(
        output=expense,
        route="clean",
        state={"expense": expense, "security_event": False}
    )


# Node 3: Prepare text input for the LLM reviewer
@node
def prepare_llm_input(ctx: Context, node_input: dict) -> str:
    """Formats the expense report details into a readable string prompt for the LLM."""
    return (
        f"Please review this expense report:\n"
        f"Submitter: {node_input['submitter']}\n"
        f"Amount: ${node_input['amount']:.2f}\n"
        f"Category: {node_input['category']}\n"
        f"Description: {node_input['description']}\n"
        f"Date: {node_input['date']}"
    )


# Node 4: LLM Agent Reviewer
llm_reviewer = LlmAgent(
    name="llm_reviewer",
    model=config.MODEL,
    instruction=(
        "You are an expense compliance reviewer. Analyze the provided expense details for risk factors. "
        "Highlight mismatches between category and description, excessive amounts, or compliance risks. "
        "Output your assessment conforming to the RiskAssessment schema."
    ),
    output_schema=RiskAssessment,
    output_key="risk_assessment"
)


# Node 5: Pause and wait for human decision (HITL)
@node
async def human_review(ctx: Context, node_input: Any):
    """Pauses the workflow for human approval if there's no decision in resume_inputs."""
    if not ctx.resume_inputs:
        expense = ctx.state["expense"]
        is_security_event = ctx.state.get("security_event", False)

        if is_security_event:
            # Format custom prompt injection warning
            message = (
                f"🚨 **SECURITY ALERT: SUSPECTED PROMPT INJECTION** 🚨\n\n"
                f"A security checkpoint flagged this description for prompt injection. "
                f"It was blocked from reaching the LLM and routed directly for review.\n\n"
                f"**Expense Report Details:**\n"
                f"* **Submitter:** {expense['submitter']}\n"
                f"* **Amount:** ${expense['amount']:.2f}\n"
                f"* **Category:** {expense['category']}\n"
                f"* **Description:** {expense['description']}\n"
                f"* **Date:** {expense['date']}\n\n"
                f"Please reply with 'approve' or 'reject' to decide."
            )
        else:
            # Normal high-value flow - node_input is the RiskAssessment dict from llm_reviewer
            risk_data = node_input if isinstance(node_input, dict) else ctx.state.get("risk_assessment", {})
            risk_score = risk_data.get("risk_score", 1)
            risk_factors = risk_data.get("risk_factors", [])
            summary = risk_data.get("summary", "No summary provided")

            message = (
                f"🚨 **Alert: High-Value Expense Approval Required** 🚨\n\n"
                f"**Expense Report Details:**\n"
                f"* **Submitter:** {expense['submitter']}\n"
                f"* **Amount:** ${expense['amount']:.2f}\n"
                f"* **Category:** {expense['category']}\n"
                f"* **Description:** {expense['description']}\n"
                f"* **Date:** {expense['date']}\n\n"
                f"**LLM Risk Review (Risk Score: {risk_score}/10):**\n"
                f"* **Summary:** {summary}\n"
                f"* **Factors:** {', '.join(risk_factors) if risk_factors else 'None'}\n\n"
                f"Please reply with 'approve' or 'reject' to decide."
            )

        yield RequestInput(interrupt_id="decision", message=message)
        return

    # User resumed - extract their decision response
    decision = ctx.resume_inputs.get("decision", "")
    if not decision and ctx.resume_inputs:
        decision = next(iter(ctx.resume_inputs.values()), "")

    # Unpack decision if it is a dictionary
    if isinstance(decision, dict):
        decision = decision.get("response") or decision.get("decision") or next(iter(decision.values()), "")

    yield Event(output=str(decision))



# Node 6: Record final outcome from the human review
@node
def record_outcome(ctx: Context, node_input: Any):
    """Records the final decision outcome of the human review."""
    expense = ctx.state["expense"]
    risk = ctx.state.get("risk_assessment")

    decision_val = node_input
    if isinstance(decision_val, dict):
        decision_val = decision_val.get("response") or decision_val.get("decision") or next(iter(decision_val.values()), "")

    decision_str = str(decision_val).strip().lower()
    if "approve" in decision_str:
        status = "APPROVED"
    else:
        status = "REJECTED"

    outcome = {
        "status": status,
        "reason": f"Reviewed by human. Decision: {status}",
        "expense": expense,
    }
    if risk:
        outcome["risk_assessment"] = risk
    else:
        outcome["security_event"] = True
        outcome["reason"] = f"Bypassed LLM due to security event. Reviewed by human. Decision: {status}"

    outcome_message = (
        f"✍️ **Expense Review Finalized**\n\n"
        f"Outcome: **{status}**\n"
        f"Submitter: {expense['submitter']}\n"
        f"Amount: ${expense['amount']:.2f}\n"
        f"Reason: {outcome['reason']}"
    )

    yield Event(content=genai_types.Content(role="model", parts=[genai_types.Part.from_text(text=outcome_message)]))
    yield Event(output=outcome, state={"outcome": outcome})


# Configure Graph Workflows edges using RoutingMaps
edges = [
    (START, parse_and_route),
    (parse_and_route, {
        "auto_approve": auto_approve,
        "llm_review": security_checkpoint
    }),
    (security_checkpoint, {
        "clean": prepare_llm_input,
        "bypass_llm": human_review
    }),
    (prepare_llm_input, llm_reviewer),
    (llm_reviewer, human_review),
    (human_review, record_outcome),
]

root_agent = Workflow(
    name="expense_approval_workflow",
    edges=edges,
)

app = App(
    name="expense_agent",
    root_agent=root_agent,
    resumability_config=ResumabilityConfig(is_resumable=True)
)
