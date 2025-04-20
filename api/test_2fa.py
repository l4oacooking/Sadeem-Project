import pyotp
import requests
import base64

# Function to generate a test secret
def generate_test_secret():
    # Generate a random secret
    return pyotp.random_base32()

# Generate a secret
test_secret = generate_test_secret()
print(f"Generated secret: {test_secret}")

# Create a TOTP object
totp = pyotp.TOTP(test_secret)

# Get the current code
current_code = totp.now()
print(f"Current code for testing: {current_code}")

# Test API endpoint
try:
    response = requests.get(f"http://localhost:8000/api/generate-2fa-code/{test_secret}")
    print("API response:", response.json())
    
    # Test validation
    validate_response = requests.post(
        "http://localhost:8000/api/validate-2fa",
        json={"secret": test_secret, "code": current_code}
    )
    print("Validation response:", validate_response.json())
except Exception as e:
    print(f"Error testing API: {e}") 