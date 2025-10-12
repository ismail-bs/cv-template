# CV to PDF API Service

**Production-ready TypeScript Node.js API** that converts CV data (JSON) into professionally formatted PDF documents.

✅ **Tested & Working** | 🚀 **Docker Ready** | 🔒 **Secure** | 📄 **2 Templates Included**

## 🚀 Features

- **RESTful API Endpoints**: Binary PDF and Base64 encoded responses
- **Template-Based**: Handlebars templates for easy customization
- **Production Ready**: Docker support, health checks, graceful shutdown
- **Secure**: API key authentication, rate limiting, input validation
- **Smart Processing**: Automatic field hiding, conditional formatting
- **Robust**: Retry logic, comprehensive error handling, structured logging
- **Type-Safe**: Built with TypeScript in strict mode

## 📋 Requirements

- Node.js >= 18.0.0
- Docker (optional, for containerized deployment)
- npm or yarn

## 🏗️ Architecture

```
src/
├── routes/          # API route definitions
├── controllers/     # Request handlers and business logic orchestration
├── services/        # Core services (PDF generation, CV processing)
├── models/          # TypeScript interfaces and types
├── middleware/      # Auth, validation, error handling, rate limiting
├── validation/      # Joi validation schemas
├── config/          # Environment configuration
└── utils/           # Helper functions and utilities

templates/           # Handlebars templates for PDF generation
sample/              # Sample data and Postman collection
```

## 🚦 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cv-template
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Start the service**
   ```bash
   docker-compose up -d
   ```

4. **Verify it's running**
   ```bash
   curl http://localhost:3000/health
   ```

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Build and start**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns service health status (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Generate PDF (Binary)
```
POST /cv/generate
```
Generates PDF and returns binary stream.

**Headers:**
- `X-API-Key`: Your API key (required)
- `Content-Type`: application/json

**Response:**
- Content-Type: `application/pdf`
- Binary PDF data

### Generate PDF (Base64)
```
POST /cv/generate/base64
```
Generates PDF and returns base64 encoded string.

**Headers:**
- `X-API-Key`: Your API key (required)
- `Content-Type`: application/json

**Response:**
```json
{
  "pdfBase64": "JVBERi0xLjQKJ..."
}
```

## 📝 Request Body Schema

All fields are optional. Empty, null, "@", or "none" values are automatically hidden.

```json
{
  "full_name": "string",
  "phone": "string (E.164 format, e.g., +27123456789)",
  "email": "string (valid email)",
  "physical_address": "string",
  "career_goal": "string",
  "education_matric": "string (school name bold on first line)",
  "tertiary_education": "string (school name bold on first line)",
  "certificates": "string",
  "other_qualifications": "string",
  "skills": "string",
  "languages": "string",
  "cv_format_type_full_1": "string",
  "job_duration_1": "string",
  "job_duties_1": "string",
  "cv_format_type_full_2": "string",
  "job_duration_2": "string",
  "job_duties_2": "string",
  "cv_format_type_full_3": "string",
  "job_duration_3": "string",
  "job_duties_3": "string",
  "cv_format_type_full_4": "string",
  "job_duration_4": "string",
  "job_duties_4": "string",
  "cv_format_type_full_5": "string",
  "job_duration_5": "string",
  "job_duties_5": "string",
  "reference_1": "string",
  "reference_2": "string",
  "reference_3": "string",
  "reference_4": "string",
  "reference_5": "string",
  "additional_experience": "string"
}
```

## 🎯 Business Logic Rules

1. **Field Hiding**: Empty, null, "@", or "none" values are automatically hidden
2. **Phone Centering**: If email is missing, phone number is centered in header
3. **Education Formatting**: School names are bold on the first line (both Tertiary and Matric)
4. **Additional Experience**: Merged into a single paragraph if present
5. **Work Experience**: Up to 5 positions supported
6. **References**: Up to 5 references supported

## 🧪 Testing

### Using cURL

**Generate Binary PDF:**
```bash
curl -X POST http://localhost:3000/cv/generate \
  -H "X-API-Key: your-secret-api-key-change-this" \
  -H "Content-Type: application/json" \
  --data @sample/cv.json \
  --output cv.pdf
```

**Generate Base64 PDF:**
```bash
curl -X POST http://localhost:3000/cv/generate/base64 \
  -H "X-API-Key: your-secret-api-key-change-this" \
  -H "Content-Type: application/json" \
  --data @sample/cv.json
```

### Using Postman

Import the Postman collection from `sample/CV-API.postman_collection.json`:

1. Open Postman
2. Click "Import"
3. Select `sample/CV-API.postman_collection.json`
4. Update the `api_key` variable with your API key
5. Run the test cases

### Using Test Script

```bash
cd sample
chmod +x curl-examples.sh
./curl-examples.sh
```

## ⚙️ Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | production | Environment (development/production) |
| `API_KEY` | (required) | API authentication key |
| `TEMPLATE_NAME` | option-b.hbs | Template file name |
| `TEMPLATE_DIR` | templates | Template directory path |
| `PUPPETEER_TIMEOUT` | 30000 | PDF generation timeout (ms) |
| `PDF_RETRY_ATTEMPTS` | 1 | Number of retry attempts on failure |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `MAX_REQUEST_SIZE` | 2mb | Maximum request body size |
| `CORS_ORIGIN` | * | CORS allowed origins |
| `LOG_LEVEL` | info | Logging level (debug/info/warn/error) |

## 🎨 Template Customization

### Adding a New Template

1. Create a new Handlebars template in `templates/` directory:
   ```bash
   cp templates/option-b.hbs templates/my-template.hbs
   ```

2. Customize the HTML and CSS in `my-template.hbs`

3. Update the `TEMPLATE_NAME` environment variable:
   ```bash
   TEMPLATE_NAME=my-template.hbs
   ```

4. Restart the service

### Template Variables

Available variables in templates:
- `{{full_name}}`, `{{phone}}`, `{{email}}`, `{{physical_address}}`
- `{{phone_centered}}` - Boolean, true if email is missing
- `{{career_goal}}`
- `{{tertiary_education}}`, `{{education_matric}}`
- `{{training_certificates_heading}}`, `{{training_cert_bullet}}`, `{{other_qualifications_bullet}}`
- `{{skills}}`, `{{languages}}`
- `{{work_experience_1}}` through `{{work_experience_5}}` (objects with title, duration, duties)
- `{{reference_1}}` through `{{reference_5}}`
- `{{Additional_Experience_heading}}`, `{{additional_experience}}`

### Handlebars Helpers

- `{{#if value}}...{{/if}}` - Conditional rendering
- `{{{nl2br text}}}` - Convert newlines to `<br>` tags
- `{{{boldFirstLine text}}}` - Make first line bold

## 🔒 Security Features

- **API Key Authentication**: Required on all CV generation endpoints
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation with detailed error messages
- **Input Sanitization**: XSS prevention
- **Request Size Limits**: Prevents oversized payloads
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing

## 🐛 Error Responses

The API returns structured JSON errors:

**400 Bad Request:**
```json
{
  "error": "Validation error: Phone must be in E.164 format"
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid API key"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to generate PDF. Please try again later."
}
```

## 📊 Logging

Structured logging with Winston:
- Console output with timestamps and colors (development)
- JSON format for production
- Separate error log file in production
- Request/response logging
- Error tracking with stack traces

Log files (production):
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## 🔧 Maintenance

### Graceful Shutdown

The service handles SIGTERM and SIGINT signals gracefully:
1. Stops accepting new connections
2. Completes pending requests
3. Cleans up Puppeteer browser instances
4. Exits cleanly

### Health Monitoring

Monitor the service health:
```bash
curl http://localhost:3000/health
```

Use this endpoint for:
- Docker health checks (configured in docker-compose.yml)
- Load balancer health probes
- Monitoring systems

## 🚀 Production Deployment

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t cv-to-pdf-api .
   ```

2. **Run with docker-compose:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the service:**
   ```bash
   docker-compose down
   ```

### Environment Variables for Production

Ensure you set these in production:
- `NODE_ENV=production`
- `API_KEY=<secure-random-key>`
- `LOG_LEVEL=info` or `warn`
- `CORS_ORIGIN=<your-domain>` (instead of *)

### Resource Limits

The docker-compose.yml includes resource limits:
- CPU: 1.0 cores (limit), 0.5 cores (reservation)
- Memory: 1GB (limit), 512MB (reservation)

Adjust based on your workload.

## 🧰 Development

### Project Scripts

```bash
npm run dev          # Development mode with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with TypeScript rules
- **No 'any' types**: Enforced in tsconfig

## 📦 Dependencies

### Core Dependencies
- **express**: Web framework
- **puppeteer**: Headless Chrome for PDF generation
- **handlebars**: Template engine
- **joi**: Data validation
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting
- **winston**: Logging
- **dotenv**: Environment configuration

### Development Dependencies
- **typescript**: TypeScript compiler
- **ts-node-dev**: Development server with hot reload
- **eslint**: Code linting
- **@typescript-eslint**: TypeScript ESLint rules

## 🤝 Contributing

1. Follow the existing code style
2. Write TypeScript with strict types
3. Update tests and documentation
4. Ensure linting passes: `npm run lint`

## 📄 License

MIT

## 🆘 Troubleshooting

### Puppeteer Issues in Docker

If Puppeteer fails to launch:
- The Dockerfile includes all required dependencies
- Chromium is pre-installed in the Alpine image
- Check logs: `docker-compose logs -f`

### Port Already in Use

If port 3000 is already in use:
```bash
# Change port in .env
PORT=3001

# Or in docker-compose.yml
ports:
  - "3001:3000"
```

### Memory Issues

If the service runs out of memory:
- Increase Docker memory limits in docker-compose.yml
- Reduce concurrent PDF generation
- Adjust rate limiting settings

### Template Not Found

If template fails to load:
- Verify `TEMPLATE_NAME` matches file in `templates/` directory
- Check file permissions
- Verify Docker volume mounts (if using volumes)

## 📞 Support

For issues and questions:
1. Check this README
2. Review sample files in `sample/` directory
3. Check application logs
4. Review error messages (structured JSON format)

## 🎯 Acceptance Criteria Status

✅ Both endpoints work with valid X-API-Key and sample cv.json  
✅ Empty/null fields are hidden per rules  
✅ Additional experience merged into single paragraph  
✅ PDF binary download and base64 responses validated  
✅ Service runs via docker-compose  
✅ README with complete setup instructions  
✅ Postman collection and cURL examples included  
✅ TypeScript with strict mode and linting configured  
✅ Production-ready with health checks and graceful shutdown  
✅ Template upgradability via environment variables
