from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from routes import profiles, redemptions, vendor, admin

load_dotenv()

app = FastAPI(title="Lunch Break Buddy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router)
app.include_router(redemptions.router)
app.include_router(vendor.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Lunch Break Buddy API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
