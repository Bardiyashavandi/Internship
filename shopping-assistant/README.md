# 🛒 Secure AI Shopping Assistant

An intelligent, secure ReAct agent built on **ADK 2.0** and powered by **Gemini 2.5 Flash** (`gemini-2.5-flash`). This agent serves as a retail store shopping assistant, helping customers locate products, look up prices, redeem single-use discount codes, and credit loyalty points after successful purchases.

---

## 💡 The Problem & Why It Matters

Implementing conversational AI agents in retail environments presents critical security boundaries:
1. **Discount Abuse**: Single-use coupons (e.g., `WELCOME50` or `SUMMER20`) must never be redeemed multiple times, either by the same customer or across different customer accounts.
2. **Identity Spoofing**: Users should not be able to arbitrarily claim point credits or discounts on behalf of other registered customer accounts.
3. **Runaway Points Exploitation**: Point conversion logic must be calculated securely on the backend, and inputs must be validated to prevent negative purchases (points subtraction) or float-overflow inputs (points generation).
4. **Secret Leaks in Source Control**: Hardcoded API keys or credentials must be detected static-analysis side before they are committed.

Our platform addresses these concerns by combining **Pydantic tool schema validation**, **systematic STRIDE threat modeling**, **pre-commit security gates**, and **runtime agent hooks**.

---

## 🏗️ Architecture Overview

The agent is designed using the **ADK 2.0 Workflow API** as a single-node graph mapping user input directly to a tool-enabled LLM.

```
+------------------+     User Message     +------------------------------+
|    User / CLI    | -------------------> | shopping_assistant_workflow  |
+------------------+                      +------------------------------+
         ^                                               |
         |                                               v
         |        Output / Tool Call            (START Trigger)
         |                                               |
         |                                               v
         |                                +------------------------------+
         |                                |   shopping_assistant_agent   |
         | <----------------------------- |        (LlmAgent Node)       |
                                          +------------------------------+
                                            /            |             \
                                           /             |              \
                                  [Product Info]    [Redeem Code]   [Loyalty Points]
                                        v                v               v
                                  +----------+     +-----------+    +----------+
                                  | product  |     |  redeem_  |    |  award_  |
                                  |  lookup  |     |  discount |    |  loyalty |
                                  +----------+     +-----------+    +----------+
```

*   **Workflow Graph**: Connects the entry point (`START`) to the LLM Node.
*   **LlmAgent (`shopping_assistant_agent`)**: Executes tasks using natural language, dynamically calling appropriate tools depending on user requests.
*   **State Management**: Tracks discount code redemptions and point balances using in-memory global state stores (`DISCOUNT_CODES`, `LOYALTY_POINTS`).

---

## 🛡️ Security Features & Guardrails

This project serves as a lab environment demonstrating shifting security left during AI agent development:

1. **STRIDE Threat Model**: A detailed STRIDE analysis is maintained in [threat_model.md](file:///Users/bardiyashavandi/secure-agent-lab/shopping-assistant/threat_model.md) to systematically catalog security boundaries, spoofing, tampering, repudiation, information disclosure, denial of service, and elevation of privilege.
2. **Semgrep Scanning**: Custom Semgrep rules defined in [.semgrep/rules.yaml](file:///Users/bardiyashavandi/secure-agent-lab/shopping-assistant/.semgrep/rules.yaml) scan for hardcoded credentials (such as Google API keys matching the prefix `AIzaSy`).
3. **Pre-Commit Security Gating**: Integrated via [.pre-commit-config.yaml](file:///Users/bardiyashavandi/secure-agent-lab/shopping-assistant/.pre-commit-config.yaml). On every `git commit`, git hooks automatically trigger:
    *   End-of-file formatting validation.
    *   Trailing whitespace trimming.
    *   A local Semgrep security scan that blocks commits if hardcoded secrets are found.
4. **Agent Lifecycle Hooks**: Defined in [.agents/hooks.json](file:///Users/bardiyashavandi/secure-agent-lab/shopping-assistant/.agents/hooks.json). A `PreToolUse` hook intercepts `run_command` invocations, executing a local validation script (`python3 .agents/scripts/validate_tool_call.py`) with a strict 10-second timeout to gate unsafe shell command execution.
5. **Pydantic Tool Input Validation**: To prevent prompt injection payload tampering, tool parameters (e.g. `AwardLoyaltyPointsInput`) are strictly typed and verified by Pydantic before any backend function code executes.

---

## 🛠️ Technology Stack

*   **Framework**: ADK 2.0 (google-adk)
*   **Model Core**: Gemini 2.5 Flash (`gemini-2.5-flash` via `google-genai` SDK)
*   **Security Static Analysis**: Semgrep + pre-commit
*   **Testing**: pytest (unit + integration)

---

## 🚀 Running Locally

### 1. Environment Setup
Configure your Google AI Studio Gemini API credentials in a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_GENAI_USE_VERTEXAI=False
```

### 2. Install Dependencies
Synchronize dependencies and compile the workspace into your virtual environment:
```bash
# Sync dependencies via uv
uv pip install -e .
```

### 3. Open the Interactive Playground
Launch the local web-based playground interface:
```bash
agents-cli playground
```
Navigate to [http://127.0.0.1:8080](http://127.0.0.1:8080) to chat with the agent and inspect tool invocations.

---

## 🧪 Verification & Test Suite

The project includes two complementary test suites under `tests/`:

### A. Unit Tests (`tests/unit/test_tools.py`)
These tests execute the backend python functions directly in isolation from the LLM, verifying all edge cases and security assertions:
*   Redemption of valid discount codes.
*   Blocking duplicate redemptions (globally single-use).
*   Rejection of unregistered user IDs.
*   Points calculations (10 points / dollar spent) and cap limit enforcement (`$10,000.00`).
*   Rejection of negative or zero purchase values.

### B. Outcome-Based Security Test Suite (`tests/test_security_boundaries.py`)
Integration-level tests that run conversational prompts through the agent workflow runner to confirm the agent correctly handles success, duplicate redemption rejections, invalid codes, and unregistered users under live model execution.

*Note: Since the integration tests call the live model, they are throttled in the test fixture to stay within Gemini API Free Tier rate limits.*

To run all tests:
```bash
uv run pytest
```
