#!/bin/bash
# Start DynamoDB Local in a Docker container
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
echo "DynamoDB Local started at http://localhost:8000"
