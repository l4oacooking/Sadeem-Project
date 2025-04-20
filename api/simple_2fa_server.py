from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import pyotp
import base64
import urllib.parse

class ValidationHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/validate-2fa':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data)
            
            # Extract secret and code from request
            secret = request_data.get('secret', '')
            code = request_data.get('code', '')
            
            # Normalize the secret
            try:
                # Remove any spaces and convert to uppercase
                secret = secret.replace(" ", "").upper()
                # Try to decode it to validate it's proper base32
                base64.b32decode(secret)
            except Exception:
                # If it's not valid base32, encode it
                secret = base64.b32encode(secret.encode('utf-8')).decode('utf-8')
            
            # Create TOTP object
            totp = pyotp.TOTP(secret)
            
            # Verify the code
            is_valid = totp.verify(code)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'valid': is_valid,
                'message': 'Code validated successfully' if is_valid else 'Invalid code'
            }
            
            self.wfile.write(json.dumps(response).encode())
            return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_GET(self):
        if self.path.startswith('/api/generate-2fa-code/'):
            secret = self.path.replace('/api/generate-2fa-code/', '')
            secret = urllib.parse.unquote(secret)
            
            # Normalize the secret
            try:
                # Remove any spaces and convert to uppercase
                secret = secret.replace(" ", "").upper()
                # Try to decode it to validate it's proper base32
                base64.b32decode(secret)
            except Exception:
                # If it's not valid base32, encode it
                secret = base64.b32encode(secret.encode('utf-8')).decode('utf-8')
            
            # Create TOTP object
            totp = pyotp.TOTP(secret)
            
            # Get current code
            current_code = totp.now()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'code': current_code,
                'normalized_secret': secret
            }
            
            self.wfile.write(json.dumps(response).encode())
            return
        
        self.send_response(404)
        self.end_headers()

def run(server_class=HTTPServer, handler_class=ValidationHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting 2FA server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run() 