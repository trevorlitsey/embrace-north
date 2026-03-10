#!/bin/bash
set -e

echo "=== Embrace North Deploy ==="

# Build SAM
echo "> Building SAM application..."
sam build

# Deploy SAM
echo "> Deploying SAM application..."
sam deploy

# Get stack outputs
echo "> Fetching stack outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ClientBucketName`].OutputValue' --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ClientDistributionId`].OutputValue' --output text)

echo "> API URL: $API_URL"
echo "> Client Bucket: $BUCKET_NAME"

# Build client
echo "> Building client..."
cd client
REACT_APP_API_URL=$API_URL npm run build

# Sync to S3
echo "> Syncing client to S3..."
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
echo "> Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "=== Deploy complete ==="
echo "> API: $API_URL"
echo "> Client: https://$(aws cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ClientDistributionUrl`].OutputValue' --output text | sed 's|https://||')"
