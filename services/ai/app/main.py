from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="SwasthyaSetu AI Service",
    description="Identity reconciliation and clinical document intelligence service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "SwasthyaSetu AI Microservice",
        "demo_mode": os.getenv("DEMO_MODE", "true").lower() == "true"
    }

@app.get("/")
def root():
    return {
        "message": "SwasthyaSetu AI Microservice Running",
        "modules": ["identity-scoring", "ocr-extraction", "confidence-engine"]
    }
