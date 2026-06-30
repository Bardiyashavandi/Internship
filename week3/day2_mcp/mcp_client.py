from dotenv import load_dotenv
load_dotenv()

import asyncio
import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="python",
    args=["mcp_server.py"]
)

claude = anthropic.Anthropic()

server_params = StdioServerParameters(
    command="python",
    args=["mcp_server.py"]
)

claude = anthropic.Anthropic()

async def run_agent(user_query: str):
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Ask the server what tools it has
            mcp_tools = await session.list_tools()

            # Convert MCP's tool format into Anthropic's tool format
            anthropic_tools = []
            for tool in mcp_tools.tools:
                anthropic_tools.append({
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema
                })

            print("Tools discovered from server:")
            for t in anthropic_tools:
                print(f"  - {t['name']}: {t['description']}")
                
            messages = [{"role": "user", "content": user_query}]
            turn = 0

            while True:
                turn += 1
                print(f"\n=== Turn {turn} ===")

                response = claude.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=1024,
                    tools=anthropic_tools,
                    messages=messages
                )

                print(f"stop_reason: {response.stop_reason}")

                if response.stop_reason == "end_turn":
                    print("\n=== FINAL ANSWER ===")
                    for block in response.content:
                        if block.type == "text":
                            print(block.text)
                    break

                messages.append({"role": "assistant", "content": response.content})

                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        print(f"\n--- Calling MCP tool: {block.name}({block.input}) ---")

                        result = await session.call_tool(block.name, block.input)
                        result_text = result.content[0].text

                        print(f"Result: {result_text}")

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result_text
                        })

                messages.append({"role": "user", "content": tool_results})

if __name__ == "__main__":
    asyncio.run(run_agent("List the files in the current directory, then read the contents of mcp_server.py and tell me what tools it defines"))