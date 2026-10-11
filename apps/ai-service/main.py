from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router as ai_router

app = FastAPI(
    title="PushPost AI Service",
    description="Microservice powering platform-specific social content generation & image generation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "pushpost-ai-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
