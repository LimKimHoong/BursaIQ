import truststore

# Use the Windows certificate store for HTTPS connections
truststore.inject_into_ssl()

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM


# ============================================================
# Configuration
# ============================================================
MODEL_ID = "deepseek-ai/DeepSeek-V4-Flash"

MAX_INPUT_LENGTH = 1024
MAX_NEW_TOKENS = 300

SYSTEM_PROMPT = (
    "You are a helpful assistant. "
    "Answer the user's question clearly and concisely. "
    "Use correct grammar, punctuation, and spacing between words. "
    "Do not repeat the answer."
)

# ============================================================
# Load tokenizer and model once
# ============================================================
print("Loading tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_ID
)

print("Loading model...")

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype="auto",
    device_map="cpu"
)

model.eval()

print("Model loaded successfully.")
print("Type 'exit', 'quit', or 'q' to stop.")
print("=" * 60)

print(f"I am your chatbot assistance with model {MODEL_ID}. Ask me anything !")


# ============================================================
# Continuous question-and-answer loop
# ============================================================
while True:

    try:
        # ----------------------------------------------------
        # Get question from user
        # ----------------------------------------------------
        
        user_question = input("\nYou: ").strip()

        # Ignore empty input
        if not user_question:
            print("Please enter a question.")
            continue

        # Exit commands
        if user_question.lower() in {"exit", "quit", "q"}:
            print("\nExiting the assistant. Goodbye!")
            break

        # ----------------------------------------------------
        # Prepare a new conversation for this question
        # ----------------------------------------------------
        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_question
            }
        ]

        formatted_prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        # Tokenize the formatted conversation
        inputs = tokenizer(
            formatted_prompt,
            return_tensors="pt",
            truncation=True
        )

        # Move input tensors to the model's device
        inputs = {
            key: value.to(model.device)
            for key, value in inputs.items()
        }

        # ----------------------------------------------------
        # Generate model response
        # ----------------------------------------------------
        with torch.inference_mode():
            generation_output = model.generate(
                **inputs,

                max_new_tokens=MAX_NEW_TOKENS,
                
                do_sample=False,

                repetition_penalty=1.05,

                eos_token_id=tokenizer.eos_token_id,
                pad_token_id=tokenizer.eos_token_id,

                use_cache=True
            )

        # ----------------------------------------------------
        # Extract only newly generated tokens
        # ----------------------------------------------------
        input_length = inputs["input_ids"].shape[-1]

        generated_tokens = generation_output[
            0,
            input_length:
        ]

        output_text = tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True
        ).strip()

        # ----------------------------------------------------
        # Display response
        # ----------------------------------------------------
        if output_text:
            print(f"\n {MODEL_ID}: {output_text}")
        else:
            print(
                "\n {MODEL_ID}: I could not generate a response. "
                "Please try rephrasing your question."
            )

    except KeyboardInterrupt:
        # Handles Ctrl+C
        print("\n\nAssistant stopped by user. Goodbye!")
        break

    except EOFError:
        # Handles Ctrl+Z followed by Enter on Windows
        print("\n\nInput stream closed. Goodbye!")
        break

    except Exception as error:
        # Prevent one failed question from closing the program
        print(f"\nAn error occurred: {error}")
        print("You can enter another question.")