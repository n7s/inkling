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
IP=$(ip -f inet addr show wlp59s0 | grep -Po 'inet \K[\d.]+')
echo "Point your browser to $IP:8080"

wait
#EOF
