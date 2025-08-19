#!/bin/sh

# This script allows runtime configuration of the API URL
# It replaces the placeholder in the built files with the actual API URL

if [ -n "$REACT_APP_API_URL" ]; then
    echo "Setting API URL to: $REACT_APP_API_URL"
    # Find and replace localhost URLs in the built files
    find /usr/share/nginx/html -type f -name '*.js' -exec sed -i "s|http://localhost:5054|$REACT_APP_API_URL|g" {} +
    find /usr/share/nginx/html -type f -name '*.js' -exec sed -i "s|http://localhost:5000|$REACT_APP_API_URL|g" {} +
fi

# Execute the CMD
exec "$@"