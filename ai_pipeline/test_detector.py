from detector import Detector
import asyncio

print("Testing Detector...")
detector = Detector(model_path="yolov8n.pt", device="cpu", confidence=0.4)
print("Detector initialized!")
