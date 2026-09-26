# Seq2Seq Chatbot

A simple conversational chatbot built with Hugging Face Transformers and a pretrained sequence-to-sequence model. The project uses Facebook's BlenderBot model to generate responses based on recent conversation history, making it suitable for lightweight local experimentation and learning.

## Project Overview

This project loads a pretrained conversational model from Hugging Face and runs an interactive chat loop in the terminal. It keeps a short history window of the most recent conversation turns so the bot can respond in a context-aware way.

The current implementation is intentionally minimal and easy to understand:

- loads a Seq2Seq model and tokenizer
- keeps the last 6 conversation turns in memory
- sends a formatted prompt to the model
- generates a response using sampling parameters
- prints the reply to the terminal

## Files

- `chatbot.py` — the main chatbot script
- `my_env/` — a local Python virtual environment with dependencies installed

## Model Used

The script uses:

- `facebook/blenderbot-400M-distill`

This is a compact conversational model that works well for local experiments without needing a large server setup. On first run, it will download the model files from Hugging Face if they are not already available locally.

## Requirements

The project expects a Python environment with the following packages installed:

- Python 3.10+
- `transformers`
- `torch`
- `sentencepiece` (sometimes required depending on the model/tokenizer packaging)

The workspace includes a local virtual environment at `my_env`, which is already set up for this project.

## Setup

### Option 1: Use the included virtual environment

From the project root, run:

```powershell
my_env\Scripts\python.exe chatbot.py
```

### Option 2: Create your own virtual environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install transformers torch
python chatbot.py
```

## Running the Chatbot

Once the script starts, you will see a prompt like this:

```text
> 
```

Type a message and press Enter. The bot will respond using the current conversation context.

Example:

```text
> Hello there
Bot: Hi! How are you doing today?
> What is your favorite color?
Bot: Blue is a nice color. What about you?
```

To exit the chat, type:

```text
exit
```

## How It Works

The script does the following in each loop:

1. Trims the conversation history to the last 6 turns.
2. Builds a prompt that combines the chat history and the latest user message.
3. Tokenizes the prompt for the model.
4. Calls `model.generate(...)` to generate a response.
5. Decodes the model output back into a readable string.
6. Prints the bot reply and stores it in the history for future context.

## Key Behavior

The generation settings used in this project are tuned for a conversational feel:

- `max_new_tokens=60` — limits response length
- `no_repeat_ngram_size=3` — helps reduce repeated phrases
- `repetition_penalty=1.3` — discourages excessive repetition
- `do_sample=True` — enables sampling instead of greedy decoding
- `temperature=0.6` — adds variety while keeping responses coherent
- `top_p=0.85` — nucleus sampling for smoother output

## Notes

- The first run may take a while because the model is downloaded and loaded into memory.
- A GPU is not required, but it can make inference faster if available.
- The model may occasionally produce generic or repetitive responses, especially with short prompts or limited context.
- This is a simple demo project intended for learning and experimentation, not a production chatbot service.

## Troubleshooting

### Model download fails

Check your internet connection and ensure Hugging Face is reachable. If needed, verify you have access to the model and that your environment can download files.

### Import errors

If Python cannot find `transformers` or `torch`, activate your virtual environment and install the required packages:

```powershell
pip install transformers torch
```

### Slow startup

The model is relatively large and may take time to download and load on first run. Subsequent runs will be faster.

## Future Improvements

Possible enhancements for this project include:

- saving chat history to a file
- adding a web UI with Flask or Gradio
- improving prompt formatting for better conversations
- supporting different models or fine-tuned chatbots
- adding a memory management system

## License

This project does not currently include a formal license file. If you plan to share or extend it publicly, consider adding an appropriate license such as MIT.

## Summary

This is a small, beginner-friendly Seq2Seq chatbot that demonstrates how to use a pretrained conversational model in Python. It is easy to run locally, useful for learning, and a solid base for building more advanced chatbot features.
