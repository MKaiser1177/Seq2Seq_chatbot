from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from typing import Literal

import torch
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


MODEL_NAME = "facebook/blenderbot-400M-distill"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = PROJECT_ROOT / "web" / "dist"
model = None
tokenizer = None
inference_lock = Lock()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


def load_model():
    global model, tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model.eval()


def generate_reply(request: ChatRequest) -> str:
    if model is None or tokenizer is None:
        raise RuntimeError("The chatbot model has not been loaded.")

    conversation = request.history[-12:]
    history = "\n".join(
        f"{'User' if item.role == 'user' else 'Bot'}: {item.content.strip()}"
        for item in conversation
        if item.content.strip()
    )
    prompt = f"{history}\nUser: {request.message.strip()}\nBot:"

    with inference_lock, torch.inference_mode():
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = model.generate(
            **inputs,
            max_new_tokens=60,
            no_repeat_ngram_size=3,
            repetition_penalty=1.3,
            do_sample=True,
            temperature=0.6,
            top_p=0.85,
        )

    return tokenizer.decode(outputs[0], skip_special_tokens=True).strip()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await run_in_threadpool(load_model)
    yield


app = FastAPI(title="Seq2Seq Chatbot", lifespan=lifespan)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="Message cannot be blank.")
    if len(request.history) > 12:
        raise HTTPException(status_code=422, detail="History cannot contain more than 12 messages.")
    reply = await run_in_threadpool(generate_reply, request)
    return ChatResponse(reply=reply)


@app.get("/", include_in_schema=False)
async def frontend():
    return FileResponse(FRONTEND_DIST / "index.html")


app.mount("/", StaticFiles(directory=FRONTEND_DIST), name="frontend")
