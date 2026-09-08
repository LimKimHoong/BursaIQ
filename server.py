import truststore
truststore.inject_into_ssl()

from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

BASE_DIR = Path(__file__).resolve().parent
HTML_FILE = "BursaIQ_Prototype_local_model.html"
MODEL_ID = "Qwen/Qwen3-4B-Instruct-2507-FP8"
MAX_INPUT_LENGTH = 1024
MAX_NEW_TOKENS = 600

SYSTEM_PROMPT = (
    "You are BursaIQ, a helpful assistant for Bursa Malaysia staff. "
    "Answer clearly and concisely using correct grammar, punctuation, and spacing. "
    "Do not repeat the answer. If a question requires live or internal Bursa market data "
    "that was not provided, state that you do not have access to that data. "
    "Never invent market figures, sources, or calculations."
)

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype="auto",
    device_map="cpu",
)
model.eval()
print(f"Model loaded successfully: {MODEL_ID}")

app = Flask(__name__)


def generate_answer(question: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]

    formatted_prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=False
    )

    inputs = tokenizer(
        formatted_prompt,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_INPUT_LENGTH,
    )
    inputs = {key: value.to(model.device) for key, value in inputs.items()}

    with torch.inference_mode():
        output = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=False,
            repetition_penalty=1.05,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id,
            use_cache=True,
        )

    input_length = inputs["input_ids"].shape[-1]
    generated_tokens = output[0, input_length:]
    return tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    ).strip()


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, HTML_FILE)


@app.post("/api/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    question = str(payload.get("question", "")).strip()

    if not question:
        return jsonify({"error": "Question is required."}), 400
    if len(question) > 2000:
        return jsonify({"error": "Question is too long."}), 400

    try:
        answer = generate_answer(question)
        if not answer:
            answer = "I could not generate a response. Please try rephrasing your question."
        return jsonify({"answer": answer, "model": MODEL_ID})
    except Exception as exc:
        app.logger.exception("Generation failed")
        return jsonify({"error": f"Generation failed: {exc}"}), 500


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_ID})


if __name__ == "__main__":
    print("Open http://127.0.0.1:5000 in your browser")
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
