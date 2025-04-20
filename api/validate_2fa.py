from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pyotp
import base64

app = FastAPI()

# Add CORS middleware to allow requests from frontend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ValidationRequest(BaseModel):
    secret: str
    code: str

def normalize_secret(secret: str) -> str:
    """Normalize the secret by ensuring it's base32 encoded."""
    try:
        # Remove any spaces and convert to uppercase
        secret = secret.replace(" ", "").upper()
        # Try to decode it to validate it's proper base32
        base64.b32decode(secret)
        return secret
    except Exception:
        # If it's not valid base32, encode it
        return base64.b32encode(secret.encode('utf-8')).decode('utf-8')

@app.post("/api/validate-2fa")
async def validate_2fa(request: ValidationRequest):
    try:
        # Normalize the secret
        normalized_secret = normalize_secret(request.secret)
        
        # Create a TOTP object with the normalized secret
        totp = pyotp.TOTP(normalized_secret)
        
        # Verify the code
        is_valid = totp.verify(request.code)
        
        if is_valid:
            return {
                "valid": True,
                "normalized_secret": normalized_secret,
                "message": "2FA code validated successfully"
            }
        else:
            return {
                "valid": False,
                "message": "Invalid 2FA code"
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/generate-2fa-code/{secret}")
async def generate_2fa_code(secret: str):
    try:
        # Normalize the secret
        normalized_secret = normalize_secret(secret)
        
        # Create a TOTP object
        totp = pyotp.TOTP(normalized_secret)
        
        # Get the current code
        current_code = totp.now()
        
        return {
            "code": current_code,
            "normalized_secret": normalized_secret
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Requirements for requirements.txt:
# fastapi==0.68.0
# pyotp==2.6.0
# uvicorn==0.15.0 