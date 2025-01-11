#!/bin/bash
# Check if http-server is installed
if ! command -v http-server &> /dev/null; then
    echo "http-server is not installed. Installing now..."
    npm install -g http-server
fi

# Start server with caching disabled and CORS enabled
echo "Starting server with caching disabled..."
cd http_root || exit
http-server -c-1 --cors --silent &

# Wait for the port to become available
while ! nc -z localhost 8080; do
    sleep 0.1
done

# Find out local IP of server
ETHIP=$(ip -f inet addr show wlp59s0 | grep -Po 'inet \K[\d.]+')
WIFIIP=$(ip -f inet addr show enx98e743c408b2 | grep -Po 'inet \K[\d.]+')
echo "Point your browser to http://$ETHIP:8080  (ethernet)"
echo "Point your browser to http://$WIFIIP:8080 (wifi)"

wait
#EOF
