#!/bin/bash

# Setup script for GitHub deployment on the server

echo "🔧 Setting up GitHub deployment..."

# Clone the repository if not exists
if [ ! -d ~/math-worksheet-platform ]; then
    echo "📥 Cloning repository..."
    cd ~
    git clone https://github.com/asikmydeen/math-worksheet-platform.git
    cd math-worksheet-platform
else
    echo "✅ Repository already exists"
    cd ~/math-worksheet-platform
fi

# Make deployment script executable
chmod +x deploy-from-github.sh

# Set up Git to pull without issues
git config pull.rebase false

# Create a systemd service for webhook deployment (optional)
echo "📝 Creating webhook service..."
sudo tee /etc/systemd/system/github-webhook.service > /dev/null <<EOF
[Unit]
Description=GitHub Webhook Deployment Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/math-worksheet-platform
ExecStart=/usr/bin/python3 -m http.server 9000
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Create a simple webhook receiver (optional)
cat > ~/webhook-receiver.py <<'EOF'
#!/usr/bin/env python3
import http.server
import subprocess
import json
import hmac
import hashlib

SECRET = "your-webhook-secret"  # Change this!

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Verify GitHub signature (optional)
            # signature = self.headers.get('X-Hub-Signature-256')
            
            # Parse payload
            payload = json.loads(post_data)
            
            # Check if it's a push to main branch
            if payload.get('ref') == 'refs/heads/main':
                print("Deploying from webhook...")
                subprocess.run(['/home/ubuntu/math-worksheet-platform/deploy-from-github.sh'])
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'Deployment started')
            else:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'Ignored - not main branch')
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', 9000), WebhookHandler)
    print('Webhook server listening on port 9000...')
    server.serve_forever()
EOF

chmod +x ~/webhook-receiver.py

echo "✅ GitHub deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add these secrets to your GitHub repository:"
echo "   - AWS_HOST: 54.227.108.229"
echo "   - AWS_SSH_KEY: (contents of math-worksheet-key.pem)"
echo ""
echo "2. The deployment will run automatically when you push to main branch"
echo ""
echo "3. (Optional) Set up webhook for instant deployment:"
echo "   - Add webhook in GitHub: http://54.227.108.229:9000/webhook"
echo "   - Start webhook service: sudo systemctl start github-webhook"