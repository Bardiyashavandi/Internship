# STRIDE Threat Modeling Assessment: Shopping Assistant Agent

This document details the threat modeling assessment for the `shopping-assistant` agent. It identifies security boundaries, evaluates potential threats across the six STRIDE pillars, and proposes mitigations.

---

## 1. System Boundaries & Data Flows

The shopping assistant agent operates within the following boundaries:

*   **Entry Point**: User input is ingested via the FastAPI web endpoint or the ADK interactive runner. The incoming messages trigger the `shopping_assistant_workflow` workflow graph.
*   **Routing**: The `START` state routes inputs directly to the `shopping_assistant_agent` LLM node.
*   **Model Connection**: The workflow communicates with the Gemini model using `CustomGemini` (which holds a hardcoded mock API key).
*   **Tool Executions**: The LLM agent has access to two functional tools:
    1. `get_product_info(product_name)`: Looks up products in the catalog.
    2. `redeem_discount_code(code, user_id)`: Applies discount codes.
*   **Data Storage**: In-memory global data structures (`PRODUCTS`, `DISCOUNT_CODES`, `REGISTERED_USERS`) track inventory and discount redemptions.

```
+-------------+      User Input      +-----------------------------+
|    User     | -------------------> | shopping_assistant_workflow |
+-------------+                      +-----------------------------+
       ^                                            |
       |                                            v
       |                               +---------------------------+
       |       Tool Calls / Output     | shopping_assistant_agent  |
       +------------------------------ |       (LlmAgent Node)     |
                                       +---------------------------+
                                            |               |
                       [Product Lookup]     v               v     [Discount Lookup]
                             +-------------------+    +--------------------+
                             | get_product_info  |    | redeem_discount    |
                             +-------------------+    +--------------------+
                                      |                         |
                                      v                         v
                             +-------------------------------------+
                             |  In-Memory Database / Global State  |
                             +-------------------------------------+
```

---

## 2. STRIDE Evaluation

### 1. Spoofing
*   **Threat**: A user can easily spoof another user's identity. The `redeem_discount_code` tool expects `user_id` as a parameter. Because there is no cryptographic signature, session verification, or backend token check, a user named `alice` can pass `user_id="bob"` to redeem a discount on Bob's behalf.
*   **Impact**: High. Unauthorized redemption of single-use discount codes by exploiting others' user IDs.
*   **Mitigation**: Do not let the LLM or user supply `user_id` as an arbitrary text parameter to the tool. Instead, bind the `user_id` directly to the authenticated session context (e.g., retrieving it from the secure FastAPI request session or JWT header).

### 2. Tampering
*   **Threat**:
    1. Users can attempt to brute-force code combinations by typing different inputs.
    2. Since the state of redeemed codes is kept in an in-memory global Python dictionary (`DISCOUNT_CODES`), restarts of the Uvicorn/FastAPI process completely wipe the redemption history. Users can reuse codes after a server restart.
*   **Impact**: Medium-High. Financial loss due to reuse of single-use discount codes.
*   **Mitigation**: Persist discount codes and redemption logs in a secure, transaction-safe relational database or key-value store (e.g., Cloud SQL or Firestore) rather than in-memory volatile variables.

### 3. Repudiation
*   **Threat**: There are no structured transaction logs or non-repudiation records indicating which session ID, client IP, or timestamp actually performed a code redemption. Transactions cannot be verified if disputed.
*   **Impact**: Low-Medium. Inability to trace fraudulent transactions or perform security audits.
*   **Mitigation**: Implement transaction logging that registers the session UUID, timestamp, hashed user ID, and applied discount code in a secure audit log.

### 4. Information Disclosure
*   **Threat**:
    1. **Leaked Secrets**: The mock API key `AIzaSyD-mock-key-value-12345` is hardcoded in cleartext within `app/agent.py`. It would be exposed if pushed to source control (GitHub/GitLab).
    2. **Stack Trace Leaks**: Raw runtime exceptions in tools could be returned to the LLM agent, which might relay internal paths, variable names, or database structures to the end-user.
*   **Impact**: Critical (for secret leak); Medium (for error disclosure).
*   **Mitigation**:
    - Strip the hardcoded key and read the API key from safe environment variables (`.env`).
    - Wrap tool functions in `try-except` blocks to handle exceptions gracefully, returning a generic error message to the LLM while logging the detailed trace internally.

### 5. Denial of Service (DoS)
*   **Threat**: A client could spam the server with discount code redemption attempts. This drives up CPU utilization, database queries, and LLM input/output token usage (leading to billing spikes).
*   **Impact**: Medium. Resource exhaustion and billing issues.
*   **Mitigation**: Apply rate-limiting (e.g., using `slowapi` or Cloud Armor) at the FastAPI endpoint layer to throttle clients sending excessive requests.

### 6. Elevation of Privilege
*   **Threat**: Currently, all registered users have the same privileges. If administrative tools (e.g., to create discount codes or modify catalog prices) are added in the future, any user could potentially invoke them if the LLM has access to those tools and fails to check the user's role.
*   **Impact**: High (for future expansion).
*   **Mitigation**: Restrict the tools exposed to the agent based on the verified role of the user (Role-Based Access Control). Use separate agent workflows or runtime validation for user vs. admin actions.
