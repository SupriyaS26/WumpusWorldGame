from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

class Percept(BaseModel):
    stench: bool
    breeze: bool
    glitter: bool
    bump: bool
    scream: bool

@app.post("/next-move")
def next_move(p: Percept):
    if p.glitter:
        return {"action": "grab_gold"}
    elif p.breeze:
        return {"action": "turn_left"}
    else:
        return {"action": "move_forward"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)