from google import genai
import os

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

with open("SKILL.md", "r") as f:
    skill = f.read()

def classify_query(query):
    keywords = ["track","tracking","delivery","ship","shipping","rate","rates","return","refund","package","lost"]
    for keyword in keywords:
        if keyword in query.lower():
            return "shipping"
    return "unrelated"

def handle_shipping(query):
    prompt = f"{skill}\n\nAnswer this shipping query helpfully.\n\nUser: {query}"
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text

def handle_unrelated(query):
    return "I'm only able to help with shipping related questions."

def run_agent(query):
    print(f"\nUser: {query}")
    category = classify_query(query)
    print(f"Classification: {category}")
    if category == "shipping":
        response = handle_shipping(query)
    else:
        response = handle_unrelated(query)
    print(f"Agent: {response}")
    return response

if __name__ == "__main__":
    queries = [
        "Where is my package? Tracking number 12345",
        "What are your shipping rates to Istanbul?",
        "What's the weather like today?",
        "How do I return a damaged item?",
        "Can you recommend a good restaurant?"
    ]
    for query in queries:
        run_agent(query)
        print("-" * 50)
