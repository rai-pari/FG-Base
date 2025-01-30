from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
 
 
app = FastAPI()
 
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can restrict this later)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
 
class RectangleCoords(BaseModel):
    p1: list[float]  # [x1, y1]
    p2: list[float]  # [x2, y2]
    p3: list[float]  # [x3, y3]
    p4: list[float]  # [x4, y4]
 
@app.post("/process_rectangle/")
async def process_rectangle(coords: RectangleCoords):
    x1, y1 = coords.p1
    x2, y2 = coords.p2
    x3, y3 = coords.p3
    x4, y4 = coords.p4
    print(coords);
    return {
        "message": "Rectangle coordinates received",
        "p1": coords.p1,
        "p2":coords.p2,
        "p3":coords.p3,
        "p4":coords.p4
    }