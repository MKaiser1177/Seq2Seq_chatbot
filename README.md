# Seq2Seq Chatbot

A conversational chatbot with a responsive React interface and a FastAPI backend. The backend serves the built web app and uses Hugging Face Transformers with Facebook's BlenderBot model to generate replies.

## Architecture

```text
Browser
  React + Vite single-page app
       │ same-origin JSON requests
       ▼
  FastAPI application (Uvicorn)
       ├── /api/chat       validates messages and runs model inference
       ├── /api/health     reports application availability
       └── /               serves the built React app
       │
       ▼
  BlenderBot 400M Distill
  Hugging Face Transformers + PyTorch CPU
```

The frontend sends the latest message and up to 12 previous chat messages to the API. Chat history stays in the browser and is not persisted on the server. FastAPI loads the model at startup, then runs inference in a worker thread. A lock prevents overlapping generation on the shared model.

## Tools and technology

- **Frontend:** React 18, Vite 5, JavaScript, CSS
- **Backend:** Python 3.11, FastAPI, Uvicorn
- **Language model:** `facebook/blenderbot-400M-distill`
- **Model runtime:** Hugging Face Transformers, CPU-only PyTorch
- **Container:** Docker, with a Node.js frontend build stage and Python runtime stage

## Run locally

### Requirements

- Python 3.11
- Node.js 20.19 or newer (or 22.12 or newer) and npm
- Internet access the first time the model is downloaded
- Enough memory to load BlenderBot 400M (allow several gigabytes)

### Install dependencies

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
cd web
npm install
```

### Build the frontend and start the application

The backend serves the production frontend from `web/dist`, so build it before starting FastAPI:

```powershell
npm run build
cd ..
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000). The first application start downloads and loads the model, which can take several minutes. The API health endpoint is [http://localhost:8000/api/health](http://localhost:8000/api/health).

For frontend development with Vite's hot reload, keep the backend running on port 8000 and start a separate terminal:

```powershell
cd web
npm run dev -- --host 0.0.0.0
```

Open the Vite URL printed in the terminal. The Vite development server proxies `/api` requests to `http://localhost:8000`.

## API

### `POST /api/chat`

Request:

```json
{
  "message": "What makes a good day?",
  "history": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hi there. How are you?" }
  ]
}
```

Response:

```json
{
  "reply": "A good day can start with something small that makes you smile."
}
```

Messages are limited to 2,000 characters, and each request accepts at most 12 history messages. Blank or invalid messages receive a validation error.

### `GET /api/health`

Returns `{"status":"ok"}` when the application is serving requests.

## Docker deployment

Build and run the full-stack application from the repository root:

```powershell
docker build -t seq2seq-chatbot .
docker run --rm -p 8000:8000 seq2seq-chatbot
```

Visit [http://localhost:8000](http://localhost:8000). Model files are downloaded when the container starts. To reuse the model cache between container runs, create and mount a Docker volume at `/app/.cache/huggingface`:

```powershell
docker volume create chatbot-model-cache
docker run --rm -p 8000:8000 -v chatbot-model-cache:/app/.cache/huggingface seq2seq-chatbot
```

The container uses CPU inference. Allow enough memory for the model and expect the initial startup to take longer while the model is downloaded.

## Command-line chatbot

The original terminal interface remains available in `chatbot.py`. Run it in an environment with Transformers and PyTorch installed:

```powershell
python chatbot.py
```

Type `exit` to end the conversation.
