# Network Access Configuration

This guide explains how to access your Math Worksheet Platform from other devices on your local network.

## Quick Setup

### 1. Find Your Computer's IP Address

**On macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

**On Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

Look for an IP address like `192.168.1.100` or `10.0.0.50`.

### 2. Update Your Environment Configuration

Edit your `.env` file and update these values with your computer's IP address:

```env
# Replace YOUR_IP with your actual IP address
REACT_APP_API_URL=http://YOUR_IP:5001/api
CLIENT_URL=http://YOUR_IP,http://localhost
```
For example, if your IP is `192.168.1.100`:
```env
REACT_APP_API_URL=http://192.168.1.100:5001/api
CLIENT_URL=http://192.168.1.100,http://localhost
```

### 3. Rebuild and Restart Docker Containers

```bash
# Stop current containers
docker-compose down

# Rebuild with new configuration
docker-compose up -d --build
```

### 4. Access from Other Devices

Now you can access the application from any device on your network:

- **From your computer:** http://localhost or http://YOUR_IP
- **From other devices:** http://YOUR_IP (e.g., http://192.168.1.100)

## Firewall Configuration

If you can't access the application from other devices, you may need to allow the ports through your firewall.

### macOS
1. Go to System Preferences > Security & Privacy > Firewall
2. Click "Firewall Options"
3. Allow incoming connections for Docker

### Windows
```bash
# Run as Administrator
netsh advfirewall firewall add rule name="Math Platform Frontend" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Math Platform Backend" dir=in action=allow protocol=TCP localport=5001
```
### Linux (Ubuntu/Debian)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 5001/tcp
```
## Advanced Configuration

### Using a Custom Domain

You can set up a local domain name instead of using IP addresses:

1. Edit `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows)
2. Add: `YOUR_IP mathplatform.local`
3. Update `.env`:
```env
   REACT_APP_API_URL=http://mathplatform.local:5001/api
   CLIENT_URL=http://mathplatform.local,http://localhost
   ```

### Multiple Network Interfaces

If your computer has multiple network interfaces (e.g., WiFi and Ethernet), make sure to use the IP address of the interface connected to the same network as your other devices.

## Troubleshooting

### Can't connect from other devices?

1. **Check IP address:** Make sure you're using the correct IP address
2. **Check firewall:** Ensure ports 80 and 5001 are open
3. **Check Docker:** Verify containers are running: `docker-compose ps`
4. **Check same network:** Ensure all devices are on the same network
5. **Try ping:** From another device, try: `ping YOUR_IP`

### API connection errors?

1. Check the browser console for errors
2. Verify `REACT_APP_API_URL` is set correctly
3. Try accessing the API directly: `http://YOUR_IP:5001/health`

### CORS errors?

Make sure `CLIENT_URL` in `.env` includes all the URLs you're accessing from:
```env
CLIENT_URL=http://192.168.1.100,http://localhost,http://mathplatform.local
```

## Security Considerations

- This configuration is for **local network access only**
- Do not expose these ports to the internet without proper security measures
- For production deployment, use HTTPS and proper authentication
- Consider using a VPN for remote access instead of exposing ports

## Mobile Device Access

The application is responsive and works well on mobile devices. Just open your mobile browser and navigate to `http://YOUR_IP`.

For the best experience on mobile:
- Use landscape mode for worksheets
- The print view works well for saving as PDF on mobile devices