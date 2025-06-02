from pydantic import BaseModel
import pyotp
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # أو ["http://localhost:8080"] فقط
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    secret: str
    code: str
def decrypt(ciphertext, key):
    # توقع الـ secret base64، غيّر حسب شيفرتك
    ciphertext = base64.b64decode(ciphertext)
    key = key.encode("utf-8")
    cipher = AES.new(key, AES.MODE_ECB)
    decrypted = cipher.decrypt(ciphertext)
    return decrypted.rstrip(b"\0").decode("utf-8")

@app.post("/verify")
async def validate_2fa(request: CodeRequest):
    try:
        totp = pyotp.TOTP(request.secret)
        print("secret:", request.secret)
        print("code:", request.code)
        if totp.verify(request.code):
            return {"success": True, "message": "2FA code is valid"}
        else:
            return {"success": False, "message": "Invalid 2FA code"}
    except Exception as e:
        return {"success": False, "message": f"Error validating code: {e}"}
