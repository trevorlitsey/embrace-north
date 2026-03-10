#!/bin/bash
# Adds DNS records to trevor.fail (main profile) needed for embrace.trevor.fail:
#   1. ACM certificate validation CNAME (unblocks the waiting CloudFormation deploy)
#   2. embrace.trevor.fail CNAME -> CloudFront
#
# Run this while `sam deploy` is paused waiting for cert validation.
# Usage: ./setup-dns.sh
set -e

FUN_AWS="aws --profile fun"
MAIN_AWS="aws --profile default"

echo "=== Embrace North DNS Setup ==="

# Get hosted zone ID for trevor.fail from main account
HOSTED_ZONE_ID=$($MAIN_AWS route53 list-hosted-zones-by-name \
  --dns-name trevor.fail \
  --query 'HostedZones[0].Id' \
  --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" = "None" ]; then
  echo "Error: Could not find hosted zone for trevor.fail in the default profile."
  exit 1
fi
echo "> Hosted zone: $HOSTED_ZONE_ID"

# Get the cert ARN from the fun account stack
CERT_ARN=$($FUN_AWS cloudformation describe-stacks \
  --stack-name embrace-north \
  --query 'Stacks[0].Outputs[?OutputKey==`CertificateArn`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
  # Stack might not have outputs yet if cert is still creating — look it up directly
  CERT_ARN=$($FUN_AWS acm list-certificates \
    --query "CertificateSummaryList[?DomainName=='embrace.trevor.fail'].CertificateArn" \
    --output text | head -1)
fi

if [ -z "$CERT_ARN" ]; then
  echo "Error: Could not find ACM certificate for embrace.trevor.fail in the fun account."
  echo "Make sure the CloudFormation deploy has started and the Certificate resource exists."
  exit 1
fi
echo "> Certificate ARN: $CERT_ARN"

# Get the DNS validation record for the cert
CERT_RECORD=$($FUN_AWS acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord')

VALIDATION_NAME=$(echo $CERT_RECORD | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['Name'])")
VALIDATION_VALUE=$(echo $CERT_RECORD | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['Value'])")

if [ -z "$VALIDATION_NAME" ] || [ "$VALIDATION_NAME" = "None" ]; then
  echo "Error: Certificate validation record not ready yet. Wait a moment and retry."
  exit 1
fi
echo "> Cert validation CNAME: $VALIDATION_NAME -> $VALIDATION_VALUE"

# Get CloudFront domain
CF_DOMAIN=$($FUN_AWS cloudformation describe-stacks \
  --stack-name embrace-north \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomain`].OutputValue' \
  --output text 2>/dev/null || echo "")

echo "> CloudFront domain: ${CF_DOMAIN:-'(not deployed yet — will add embrace.trevor.fail CNAME after deploy)'}"

# Build the change batch
CHANGES="[
  {
    \"Action\": \"UPSERT\",
    \"ResourceRecordSet\": {
      \"Name\": \"$VALIDATION_NAME\",
      \"Type\": \"CNAME\",
      \"TTL\": 300,
      \"ResourceRecords\": [{\"Value\": \"$VALIDATION_VALUE\"}]
    }
  }"

if [ -n "$CF_DOMAIN" ] && [ "$CF_DOMAIN" != "None" ]; then
  CHANGES="$CHANGES,
  {
    \"Action\": \"UPSERT\",
    \"ResourceRecordSet\": {
      \"Name\": \"embrace.trevor.fail\",
      \"Type\": \"CNAME\",
      \"TTL\": 300,
      \"ResourceRecords\": [{\"Value\": \"$CF_DOMAIN\"}]
    }
  }"
fi

CHANGES="$CHANGES]"

$MAIN_AWS route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch "{\"Changes\": $CHANGES}"

echo ""
echo "> DNS records submitted. Cert validation takes 1-5 minutes."
echo "> CloudFormation will resume automatically once the cert is validated."

if [ -z "$CF_DOMAIN" ] || [ "$CF_DOMAIN" = "None" ]; then
  echo ""
  echo "> After the deploy finishes, run this script again to add the embrace.trevor.fail CNAME."
fi
