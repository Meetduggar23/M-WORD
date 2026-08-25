"""
Quill AI Service - FastAPI Server
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from .ai_service import (
    get_ai_service,
    RewriteRequest,
    RewriteResponse,
    GrammarCheckRequest,
    GrammarCheckResponse,
)

app = FastAPI(
    title="Quill AI Service",
    description="AI-powered writing assistance for Quill Document Editor",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialize AI service on startup"""
    ai = get_ai_service()
    ai.initialize()


@app.get("/")
async def root():
    """Health check"""
    return {"status": "ok", "service": "quill-ai"}


@app.post("/ai/rewrite", response_model=RewriteResponse)
async def rewrite_text(request: RewriteRequest):
    """Rewrite text based on style"""
    ai = get_ai_service()
    return ai.rewrite_text(request)


@app.post("/ai/grammar", response_model=GrammarCheckResponse)
async def check_grammar(request: GrammarCheckRequest):
    """Check grammar in text"""
    ai = get_ai_service()
    return ai.check_grammar(request)


@app.post("/ai/summarize")
async def summarize_document(text: str):
    """Summarize document content"""
    ai = get_ai_service()
    summary = ai.summarize_document(text)
    return {"summary": summary}


@app.post("/ai/outline")
async def generate_outline(topic: str):
    """Generate document outline"""
    ai = get_ai_service()
    outline = ai.generate_outline(topic)
    return {"outline": outline}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
