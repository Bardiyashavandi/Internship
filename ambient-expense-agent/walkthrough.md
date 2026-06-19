# Walkthrough: Restructured Expense-Approval Workflow Agent with Security Controls & Ambient Pub/Sub Serving

We have restructured the project to place the agent in the `expense_agent` package, implemented the new ADK 2.0 Graph Workflow API, integrated automated security controls, and wrapped it as an event-driven ambient service triggered by Pub/Sub messages.

## Changes Made

### 1. Scaffolding & Configuration
* Configured the model (`gemini-3.1-flash-lite`) and threshold (`$100.0`) in [config.py](file:///Users/bardiyashavandi/.gemini/antigravity/scratch/ambient-expense-agent/expense_agent/config.py).
* Configured `pyproject.toml` Hatch package build targets to `["expense_agent", "frontend"]`, and explicitly added `fastapi` and `uvicorn` dependencies.
* Updated `agents-cli-manifest.yaml` `agent_directory` to `"expense_agent"`.
* Deleted the deprecated `app/` directory.

### 2. Core Security & Workflow Logic
Implemented a graph workflow in [agent.py](file:///Users/bardiyashavandi/.gemini/antigravity/scratch/ambient-expense-agent/expense_agent/agent.py) featuring:
* `parse_and_route`: Standardizes input, handles base64 Pub/Sub values, and routes based on `$100.0` threshold.
* `security_checkpoint` node: Scrubbing PII (SSNs and credit cards) and checking for prompt injection before LLM review.
* `human_review` (HITL): Pauses execution via `RequestInput` if no resume decision is present.
* `record_outcome`: Records the final status (`APPROVED`/`REJECTED`) from the human review.

### 3. Ambient serving via FastAPI
Created [fast_api_app.py](file:///Users/bardiyashavandi/.gemini/antigravity/scratch/ambient-expense-agent/expense_agent/fast_api_app.py) which serves the agent as a local trigger endpoint:
* **Endpoint**: `POST /trigger/pubsub` or `POST /apps/expense_agent/trigger/pubsub`.
* **Gotcha Handling**: Automatically parses fully-qualified subscription paths (e.g. `projects/my-project/subscriptions/my-expense-subscription`) and normalizes them down to a short name (`my-expense-subscription`) for the session user records.
* **Telemetry**: Set `os.environ["GOOGLE_CLOUD_ENGINE_ENABLE_TELEMETRY"] = "false"` to completely disable cloud telemetry forwarding (`otel_to_cloud=False`).
* **Logging**: Standard Python console logging configured and used throughout.

### 4. Makefile
Updated the [Makefile](file:///Users/bardiyashavandi/.gemini/antigravity/scratch/ambient-expense-agent/Makefile):
* Added a `start` target to launch the FastAPI server locally on port 8080:
  ```makefile
  start:
      uv run uvicorn expense_agent.fast_api_app:app --host 127.0.0.1 --port 8080
  ```

---

## Verification Results

### 1. Integration Tests
Ran `uv run pytest` in the workspace. All 4 tests passed successfully:
```bash
collected 4 items
tests/integration/test_agent.py .                                        [ 25%]
tests/integration/test_agent_runtime_app.py ..                           [ 75%]
tests/unit/test_dummy.py .                                               [100%]
======================== 4 passed, 16 warnings in 9.30s ========================
```

### 2. Ambient Service Trigger Test
Started the server via `make start` in the background and sent the base64-encoded test expense payload:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"message": {"data": "eyJhbW91bnQiOiAxNTAuMCwgInN1Ym1pdHRlciI6ICJhbGljZUBjb21wYW55LmNvbSIsICJjYXRlZ29yeSI6ICJzb2Z0d2FyZSIsICJkZXNjcmlwdGlvbiI6ICJJREUgTGljZW5zZSIsICJkYXRlIjogIjIwMjYtMDYtMDYifQ==", "messageId": "msg-56789"}, "subscription": "projects/my-project/subscriptions/my-expense-subscription"}' \
  http://127.0.0.1:8080/trigger/pubsub
```
**Trigger Server Console Logs:**
```
2026-06-19 17:31:26,183 [INFO] ambient_expense_agent: Received Pub/Sub message from subscription: projects/my-project/subscriptions/my-expense-subscription (normalized: my-expense-subscription)
2026-06-19 17:31:26,183 [INFO] ambient_expense_agent: Decoded data payload: {"amount": 150.0, "submitter": "alice@company.com", "category": "software", "description": "IDE License", "date": "2026-06-06"}
2026-06-19 17:31:26,184 [INFO] ambient_expense_agent: Running workflow for session msg-56789 and user my-expense-subscription...
2026-06-19 17:31:43,793 [INFO] google_adk.google.adk.models.google_llm: Sending out request, model: gemini-3.1-flash-lite, backend: GoogleLLMVariant.GEMINI_API, stream: False
2026-06-19 17:31:46,538 [INFO] google_adk.google.adk.models.google_llm: Response received from the model.
2026-06-19 17:31:46,540 [INFO] ambient_expense_agent: [Workflow Output]: {
  "risk_score": 1,
  "risk_factors": [],
  "summary": "The expense is for an IDE license categorized as software, which is a standard and compliant business expense with no unusual indicators."
}
```
**HTTP Response:**
```json
{"status":"success","session_id":"msg-56789","processed_events":6}
```
The session was normalized, decoded, ran the workflow, and successfully paused on the HITL node.
