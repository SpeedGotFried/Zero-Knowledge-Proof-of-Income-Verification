#!/bin/bash
# Create the IncomeVerificationTable locally

TABLE_NAME="IncomeVerificationTable"
ENDPOINT="http://localhost:8000"

aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url $ENDPOINT

echo "Table '$TABLE_NAME' created successfully."
