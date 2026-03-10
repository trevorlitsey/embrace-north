#!/bin/bash
set -e

PROFILE="fun"
AWS="aws --profile $PROFILE"

echo "=== Embrace North Deploy (profile: $PROFILE) ==="

# Load secrets
if [ ! -f .env.secrets ]; then
  echo "Error: .env.secrets not found. Create it from the template."
  exit 1
fi
source .env.secrets

# Build SAM
echo "> Building SAM application..."
sam build

# Deploy SAM
echo "> Deploying SAM application..."
sam deploy --config-env $PROFILE \
  --parameter-overrides \
    "JwtSecret=$JWT_SECRET" \
    "EncryptionKey=$ENCRYPTION_KEY" \
    "TwilioAccountSid=$TWILIO_ACCOUNT_SID" \
    "TwilioAuthToken=$TWILIO_AUTH_TOKEN" \
    "TwilioPhoneNumber=$TWILIO_PHONE_NUMBER" \
    "CorsAllowedOrigins=https://embrace.trevor.fail"

# Get stack outputs
echo "> Fetching stack outputs..."
API_URL=$($AWS cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
BUCKET_NAME=$($AWS cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ClientBucketName`].OutputValue' --output text)
DISTRIBUTION_ID=$($AWS cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`ClientDistributionId`].OutputValue' --output text)
CF_DOMAIN=$($AWS cloudformation describe-stacks --stack-name embrace-north --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomain`].OutputValue' --output text)

echo "> API URL: $API_URL"
echo "> Client Bucket: $BUCKET_NAME"
echo "> CloudFront domain: $CF_DOMAIN"

# Build client
echo "> Building client..."
cd client
REACT_APP_API_URL=$API_URL npm run build

# Sync to S3
echo "> Syncing client to S3..."
$AWS s3 sync build/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
echo "> Invalidating CloudFront cache..."
$AWS cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo ""
echo "=== Deploy complete ==="
echo "> API:    $API_URL"
echo "> Client: https://embrace.trevor.fail"
echo ""
echo "If DNS isn't set up yet, run: ./setup-dns.sh $CF_DOMAIN"
