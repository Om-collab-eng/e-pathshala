import requests
import base64
import json

# create a 1x1 black pixel jpeg in base64
base64_image = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCgABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAbEAACAwEBAQAAAAAAAAAAAAABAgMEBRET/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AD//Z"

prompt = "Analyze this invoice image and extract the details. Return ONLY a valid JSON object"
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}"
                }
            }
        ]
    }
]

try:
    response = requests.post(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        json={
            "model": "minimaxai/minimax-m3",
            "messages": messages,
            "temperature": 1.0,
            "top_p": 0.95,
            "max_tokens": 4096,
            "stream": False
        },
        headers={
            "Authorization": "Bearer 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",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        timeout=60
    )
    print("Status:", response.status_code)
    print("Body:", response.text)
except Exception as e:
    print("Error:", e)
