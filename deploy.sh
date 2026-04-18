#!/bin/bash
# Ghost IGL — Deploy everything to AWS
# Usage: ./deploy.sh

set -e

echo "=== Ghost IGL AWS Deploy ==="
echo ""

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "Error: AWS CLI not installed. Run: pip install awscli"; exit 1; }
command -v sam >/dev/null 2>&1 || { echo "Error: SAM CLI not installed. Run: pip install aws-sam-cli"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm not installed."; exit 1; }

# ─── Step 1: Deploy AWS infrastructure ───
echo "[1/4] Deploying AWS infrastructure (Cognito, DynamoDB, Lambda, S3, CloudFront)..."
cd aws
sam build
sam deploy --guided --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
cd ..

# ─── Step 2: Get outputs ───
echo ""
echo "[2/4] Fetching stack outputs..."
STACK_NAME="ghost-igl"  # default SAM stack name

API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\`ApiUrl\`].OutputValue' --output text)
POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\`UserPoolId\`].OutputValue' --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\`UserPoolClientId\`].OutputValue' --output text)
BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\`SiteBucketName\`].OutputValue' --output text)
CF_DIST=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\`CloudFrontDistributionId\`].OutputValue' --output text)
WEBHOOK_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\`WebhookUrl\`].OutputValue' --output text)

echo "  API URL:       $API_URL"
echo "  User Pool ID:  $POOL_ID"
echo "  Client ID:     $CLIENT_ID"
echo "  S3 Bucket:     $BUCKET"
echo "  CloudFront:    $CF_DIST"
echo "  Webhook URL:   $WEBHOOK_URL"

# ─── Step 3: Build the website ───
echo ""
echo "[3/4] Building website with environment variables..."

cat > .env.production <<EOF
VITE_COGNITO_USER_POOL_ID=$POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
VITE_API_BASE_URL=$API_URL
EOF

npm install
npm run build

# ─── Step 4: Deploy to S3 + invalidate CloudFront ───
echo ""
echo "[4/4] Uploading to S3 and invalidating CloudFront cache..."
aws s3 sync dist/ s3://$BUCKET --delete
aws cloudfront create-invalidation --distribution-id $CF_DIST --paths "/*"

echo ""
echo "=== DEPLOY COMPLETE ==="
echo ""
echo "Your site is live at https://r6coaching.com"
echo ""
echo "NEXT STEP: Configure Stripe webhook at dashboard.stripe.com/webhooks"
echo "  Endpoint URL: $WEBHOOK_URL"
echo "  Events: checkout.session.completed, customer.subscription.created,"
echo "          customer.subscription.updated, customer.subscription.deleted,"
echo "          invoice.payment_failed"
echo ""
