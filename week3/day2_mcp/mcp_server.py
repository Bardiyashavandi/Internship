from mcp.server import Server
from mcp.server.stdio import stdio_server
import mcp.types as types
import asyncio
import os

app = Server("file-tools")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="list_files",
            description="List all files in a given directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory": {
                        "type": "string",
                        "description": "Path to the directory to list, e.g. ./knowledge_base"
                    }
                },
                "required": ["directory"]
            }
        ),
        types.Tool(
            name="read_file",
            description="Read the full text contents of a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the file to read, e.g. ./knowledge_base/listing1.txt"
                    }
                },
                "required": ["path"]
            }
        )
    ]
    
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "list_files":
        directory = arguments["directory"]
        files = os.listdir(directory)
        result = "\n".join(files)
        return [types.TextContent(type="text", text=result)]

    if name == "read_file":
        path = arguments["path"]
        with open(path) as f:
            content = f.read()
        return [types.TextContent(type="text", text=content)]

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())