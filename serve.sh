#!/bin/bash

# Check if http-server is installed
if ! command -v http-server &> /dev/null; then
    echo "http-server is not installed. Installing now..."
    npm install -g http-server
fi

# Setup variables for platform independence and host specificity
OS=$(uname -s)
export OS

# Start server with caching disabled and CORS enabled
echo "Starting server with caching disabled..."
cd http_root
http-server -c-1 --cors --silent &

  # Wait for the port to become available
  while ! nc -z localhost 8080; do
    sleep 0.1
  done

# Linux/GNU specific: Open the URL in Chrome
case $OS in
"Linux")
  open -a "Google Chrome" --args --incognito "http://localhost:8080/"
  wait
  ;;
esac

# MacOS specific: Open the URL in Chrome
case $OS in
"Darwin")
  open -a "Google Chrome" --args --incognito "http://localhost:8080/"
  wait
  ;;
esac

#EOF
