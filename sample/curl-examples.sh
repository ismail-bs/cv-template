#!/bin/bash

# CV to PDF API - cURL Examples
# Set your API URL and API key here
API_URL="http://localhost:8080"
API_KEY="your-secret-api-key-change-this"

echo "=== CV to PDF API - cURL Test Examples ==="
echo ""

# 1. Health Check
echo "1. Health Check"
curl -X GET "${API_URL}/health"
echo -e "\n"

# 2. Generate PDF (Binary) - Valid
echo "2. Generate PDF (Binary) - Valid CV Data"
curl -X POST "${API_URL}/cv/generate" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data @cv.json \
  --output cv-output.pdf
echo "PDF saved to cv-output.pdf"
echo -e "\n"

# 3. Generate PDF (Base64) - Valid
echo "3. Generate PDF (Base64) - Valid CV Data"
curl -X POST "${API_URL}/cv/generate/base64" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data @cv.json
echo -e "\n"

# 4. Generate PDF - No Email (Phone Centered)
echo "4. Generate PDF - No Email (Phone Centered)"
curl -X POST "${API_URL}/cv/generate/base64" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data @cv-no-email.json
echo -e "\n"

# 5. Invalid Phone Format (400)
echo "5. Invalid Phone Format (Should return 400)"
curl -X POST "${API_URL}/cv/generate" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data @cv-invalid.json
echo -e "\n"

# 6. Missing API Key (401)
echo "6. Missing API Key (Should return 401)"
curl -X POST "${API_URL}/cv/generate" \
  -H "Content-Type: application/json" \
  --data @cv.json
echo -e "\n"

# 7. Invalid API Key (401)
echo "7. Invalid API Key (Should return 401)"
curl -X POST "${API_URL}/cv/generate" \
  -H "X-API-Key: invalid-key-123" \
  -H "Content-Type: application/json" \
  --data @cv.json
echo -e "\n"

# 8. Invalid JSON (400)
echo "8. Invalid JSON (Should return 400)"
curl -X POST "${API_URL}/cv/generate" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{invalid json}'
echo -e "\n"

echo "=== All tests completed ==="

