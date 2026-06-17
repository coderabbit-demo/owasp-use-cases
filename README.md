# OWASP Security Education Web Application

An interactive educational platform demonstrating 12 security vulnerabilities including OWASP Top 10 and AI security issues.

## Features

- **10 OWASP Top 10 (2021) Vulnerabilities**
- **2 AI Security Vulnerabilities** (Prompt Injection & Improper Output Handling)
- Side-by-side vulnerable vs secure implementations
- Interactive demonstrations
- Real-world attack scenarios
- Test cases and remediation steps
- Postman API collection

## Technology Stack

- **Frontend**: HTML, Tailwind CSS (CDN), Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite (via sql.js)
- **AI Integration**: Mock simulator (default) + Optional real LLM (Google Gemini/Anthropic Claude)

## Quick Start

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd owasp-use-cases
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional for AI integration):
```bash
cp .env.example .env
# Edit .env to enable real LLM (optional)
```

4. Initialize database:
```bash
npm run init-db
npm run seed-db
```

5. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

6. Open your browser:
```
http://localhost:3000
```

## AI Integration Options

### Option 1: Mock Simulator (Default)
No setup required! The app uses a pattern-based simulator out of the box.

### Option 2: Real LLM Integration
Enable real AI demonstrations with Google Gemini or Anthropic Claude:

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey) or [Anthropic](https://console.anthropic.com/)
2. Add to `.env`:
```env
USE_REAL_LLM=true
AI_PROVIDER=gemini
GOOGLE_API_KEY=AIza...
# OR for Anthropic Claude
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

## Vulnerability Examples

### OWASP Top 10 (2021)
1. **A01** - Broken Access Control
2. **A02** - Cryptographic Failures
3. **A03** - Injection (SQL)
4. **A04** - Insecure Design
5. **A05** - Security Misconfiguration
6. **A06** - Vulnerable Components
7. **A07** - Authentication Failures
8. **A08** - Data Integrity Failures
9. **A09** - Logging Failures
10. **A10** - SSRF

### AI Security
11. **LLM01** - Prompt Injection
12. **LLM02** - Improper Output Handling

## API Documentation

See [API.md](./API.md) for complete endpoint documentation.

## Testing with Postman

Import the collection from `postman/owasp-collection.json`

## Project Structure

```
owasp-use-cases/
├── backend/          # Express server and APIs
├── frontend/         # HTML, CSS, JavaScript
├── postman/          # API testing collection
├── serverless/       # Serverless deployment configs
└── README.md
```

## Security Notice

⚠️ **WARNING**: This application intentionally contains security vulnerabilities for educational purposes.

**DO NOT** deploy to production or expose to the internet without proper isolation.

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](./LICENSE) file.

## Acknowledgments

- OWASP Foundation for security guidelines
- OWASP Top 10 for LLM Applications
- Security research community
