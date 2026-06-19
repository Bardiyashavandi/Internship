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

import asyncio
import json
import os
import uuid
from typing import Any

from google.adk.runners import InMemoryRunner
from google.genai import types as genai_types

# Import the expense agent app
from expense_agent.agent import app as adk_app


async def run_evaluation_traces():
    print("Initializing ADK InMemoryRunner...")
    runner = InMemoryRunner(app=adk_app)

    # Load dataset
    dataset_path = "tests/eval/datasets/basic-dataset.json"
    print(f"Loading evaluation dataset from {dataset_path}...")
    with open(dataset_path, "r") as f:
        dataset = json.load(f)

    generated_cases = []

    for case in dataset["eval_cases"]:
        case_id = case["eval_case_id"]
        prompt_text = case["prompt"]["parts"][0]["text"]
        print(f"\n--- Running Case: {case_id} ---")
        print(f"Prompt: {prompt_text}")

        # Unique session for this evaluation case
        session_id = f"eval-session-{uuid.uuid4().hex[:8]}"
        user_id = "eval-user"

        # Create session in runner
        await runner.session_service.create_session(
            app_name="expense_agent",
            user_id=user_id,
            session_id=session_id
        )

        turns = []
        current_turn_events = []

        # Turn 0: User sends the initial expense payload
        current_turn_events.append({
            "author": "user",
            "content": {
                "role": "user",
                "parts": [{"text": prompt_text}]
            }
        })

        message = genai_types.Content(
            role="user",
            parts=[genai_types.Part.from_text(text=prompt_text)]
        )

        paused = False
        interrupt_id = None
        interrupt_message = ""
        final_text_response = ""

        # Run Turn 0
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=message
        ):
            # Capture model output text
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text_response = part.text

            # Record event in the current turn
            if event.content and event.content.parts:
                parts_list = []
                for part in event.content.parts:
                    if part.text:
                        parts_list.append({"text": part.text})
                    elif part.function_call:
                        parts_list.append({
                            "function_call": {
                                "name": part.function_call.name,
                                "id": part.function_call.id,
                                "args": part.function_call.args
                            }
                        })
                    elif part.function_response:
                        parts_list.append({
                            "function_response": {
                                "name": part.function_response.name,
                                "id": part.function_response.id,
                                "response": part.function_response.response
                            }
                        })
                current_turn_events.append({
                    "author": event.author or "expense_approval_workflow",
                    "content": {
                        "role": event.content.role or "model",
                        "parts": parts_list
                    }
                })

            # Check if this is an adk_request_input interrupt
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.function_call and part.function_call.name == "adk_request_input":
                        args = part.function_call.args or {}
                        interrupt_id = args.get("interruptId") or part.function_call.id
                        interrupt_message = args.get("message") or ""
                        print(f"[PAUSED] Detected adk_request_input interrupt. ID: {interrupt_id}")
                        paused = True
                        break
            
            if paused:
                break

        # Save Turn 0
        turns.append({
            "turn_index": len(turns),
            "events": current_turn_events
        })

        # Process human-in-the-loop if workflow was paused
        if paused:
            # Automate decision: Reject if it's prompt injection, approve otherwise
            decision = "reject" if "case_5" in case_id else "approve"
            print(f"[HITL AUTOMATION] Simulated human decision: {decision}")

            # Turn 1: User sends the decision as a function response to resume
            current_turn_events = [{
                "author": "user",
                "content": {
                    "role": "user",
                    "parts": [
                        {
                            "function_response": {
                                "name": "decision",
                                "id": interrupt_id,
                                "response": {"response": decision}
                            }
                        }
                    ]
                }
            }]

            # Resume using function response matching the interrupt
            resume_message = genai_types.Content(
                role="user",
                parts=[
                    genai_types.Part(
                        function_response=genai_types.FunctionResponse(
                            name="decision",
                            id=interrupt_id,
                            response={"response": decision}
                        )
                    )
                ]
            )

            # Run Turn 1 (resume)
            async for event in runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=resume_message
            ):
                # Capture final model output text
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.text:
                            final_text_response = part.text

                # Record event in Turn 1
                if event.content and event.content.parts:
                    parts_list = []
                    for part in event.content.parts:
                        if part.text:
                            parts_list.append({"text": part.text})
                        elif part.function_call:
                            parts_list.append({
                                "function_call": {
                                    "name": part.function_call.name,
                                    "id": part.function_call.id,
                                    "args": part.function_call.args
                                }
                            })
                        elif part.function_response:
                            parts_list.append({
                                "function_response": {
                                    "name": part.function_response.name,
                                    "id": part.function_response.id,
                                    "response": part.function_response.response
                                }
                            })
                    current_turn_events.append({
                        "author": event.author or "expense_approval_workflow",
                        "content": {
                            "role": event.content.role or "model",
                            "parts": parts_list
                        }
                    })

            # Save Turn 1
            turns.append({
                "turn_index": len(turns),
                "events": current_turn_events
            })

        print(f"Finished workflow execution for {case_id}.")
        print(f"Final response: {final_text_response.strip()}")

        # Construct trace case
        generated_case = {
            "eval_case_id": case_id,
            "prompt": {
                "role": "user",
                "parts": [{"text": prompt_text}]
            },
            "responses": [
                {
                    "response": {
                        "role": "model",
                        "parts": [{"text": final_text_response}]
                    }
                }
            ],
            "agent_data": {
                "agents": {
                    "expense_approval_workflow": {
                        "agent_id": "expense_approval_workflow",
                        "instruction": "Expense approval workflow agent."
                    }
                },
                "turns": turns
            }
        }
        generated_cases.append(generated_case)

    # Save to artifacts/traces/generated_traces.json
    output_dir = "artifacts/traces"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "generated_traces.json")

    output_dataset = {
        "eval_cases": generated_cases
    }

    with open(output_path, "w") as f:
        json.dump(output_dataset, f, indent=2)

    print(f"\nSuccessfully generated traces and saved to {output_path}!")


if __name__ == "__main__":
    asyncio.run(run_evaluation_traces())
