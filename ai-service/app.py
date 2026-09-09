from fastapi import FastAPI
from dotenv import load_dotenv

from routes import classify, duplicate

load_dotenv()

app = FastAPI(title="Problem2Impact AI Service")

app.include_router(classify.router)
app.include_router(duplicate.router)


@app.get("/")
def health():
    return {"status": "ok", "service": "Problem2Impact AI Service"}
