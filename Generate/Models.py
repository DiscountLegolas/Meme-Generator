from pydantic import BaseModel
from typing import List, Optional

class CaptionPoint(BaseModel):
    id: int
    x: float
    y: float
    width: float
    height: float
    label: str

class MemeCaption1(BaseModel):
    caption1: str

class MemeCaption2(BaseModel):
    caption1: str
    caption2: str

class MemeCaption3(BaseModel):
    caption1: str
    caption2: str
    caption3: str

class MemeCaption4(BaseModel):
    caption1: str
    caption2: str
    caption3: str
    caption4: str

class MemeCaption5(BaseModel):
    caption1: str
    caption2: str
    caption3: str
    caption4: str
    caption5: str

class TemplateUpload(BaseModel):
    name: str
    description: Optional[str] = ""
    captionPoints: Optional[List[CaptionPoint]] = []