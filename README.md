# thr - Tutor Hub Relay

Custom Nostr relay for Tutor Hub decentralized tutoring platform.

## Overview

This is a specialized Nostr relay designed to support the Tutor Hub ecosystem, handling custom event kinds for tutor profiles, bookings, lessons, and encrypted communications.

**📦 Development Status:** Active development in isolated repository with submodule integration.

## Quick Start

```bash
# Install dependencies
cd relay
npm install

# Start development server (runs on port 8080)
npm run dev

# WebSocket endpoint: ws://localhost:8080
```

For detailed submodule update instructions, see [docs/SUBMODULE_UPDATE_GUIDE.md](docs/SUBMODULE_UPDATE_GUIDE.md).

## Current State

- ✅ WebSocket server implementing NIP-01 protocol
- ✅ SQLite storage backend with indexing for efficient queries
- ✅ Support for custom Tutor Hub event kinds (30000-30006)
- ✅ Rate limiting and moderation capabilities
- ✅ TypeScript + Node.js/Bun runtime
- ✅ Integrated as submodule in [Tutorstr](https://github.com/chuckis/tutorstr)

## Features

### Core Relay Functionality
- WebSocket server implementing NIP-01 protocol
- Event storage and retrieval with SQLite
- Subscription filtering and real-time event broadcasting
- Custom event kind optimization for tutoring use cases

### Tutor Hub Specific Events
| Kind | Type | Description | Encryption |
|------|------|-------------|------------|
| `30000` | Replaceable | Tutor Profile | Public |
| `30001` | Replaceable | Tutor Schedule | Public |
| `30002` | Ephemeral | Booking Request | Public |
| `30003` | Ephemeral | Booking Status | Public |
| `30004` | Ephemeral | Student Progress Log | 🔒 NIP-04 |
| `30005` | Reserved | Tutor Blog Post | Public |
| `30006` | Addressable | Lesson Agreement | Public |
| `4` | Ephemeral | Direct Message | 🔒 NIP-04 |

### Security & Performance
- Rate limiting per connection and IP
- Event validation and signature verification
- Configurable storage limits and retention policies
- Optimized queries for tutor discovery and booking workflows

## Project Structure

```
thr/
├── relay/              # Relay server implementation
│   ├── src/           # Source code (index.ts, etc.)
│   ├── package.json   # Dependencies and scripts
│   └── tsconfig.json  # TypeScript configuration
├── data/              # SQLite database storage
│   └── relay.db       # Database file (gitignored in production)
├── docs/              # Documentation
│   └── SUBMODULE_UPDATE_GUIDE.md  # Submodule management guide
├── package.json       # Root package config
├── tsconfig.json      # Root TypeScript config
└── README.md          # This file
```

## Configuration

Create a `.env` file in the `relay/` directory:

```env
# Server Configuration
PORT=8080
RELAY_NAME="Tutor Hub Relay"
RELAY_DESCRIPTION="Decentralized tutoring platform relay"
RELAY_PUBKEY=<your-pubkey>  # Optional: relay identity

# Database
DATABASE_PATH=./data/relay.db

# Rate Limiting
RATE_LIMIT_EVENTS_PER_MINUTE=60
RATE_LIMIT_CONNECTIONS_PER_IP=10

# Storage Limits
MAX_EVENTS_PER_USER=10000
MAX_EVENT_SIZE_BYTES=100000

# Advanced
LOG_LEVEL=info
ENABLE_CORS=true
```

## Development Workflow

### 1. Develop in This Repository (thr)

```bash
# Clone and setup
git clone https://github.com/tutor-hub-2030/thr.git
cd thr/relay
npm install

# Make changes to src/
# Test locally
npm run dev

# Commit and push
git add .
git commit -m "feat: your feature"
git push origin main
```

### 2. Update Submodule in Tutorstr

```bash
# In tutorstr repository
cd /path/to/tutorstr
git submodule update --remote relay
git add relay
git commit -m "chore: update relay submodule"
git push origin main
```

See [docs/SUBMODULE_UPDATE_GUIDE.md](docs/SUBMODULE_UPDATE_GUIDE.md) for detailed instructions.

## API Reference

### WebSocket Endpoint

**Development:** `ws://localhost:8080`  
**Production:** `wss://your-domain.com`

Implements [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md):

```typescript
// Client -> Relay
["EVENT", <event>]
["REQ", <subscription_id>, <filters>...]
["CLOSE", <subscription_id>]

// Relay -> Client
["OK", <event_id>, <true|false>, <message>]
["EOSE", <subscription_id>]
["EVENT", <subscription_id>, <event>]
["NOTICE", <message>]
```

### HTTP Endpoints

- `GET /health` - Health check
- `GET /stats` - Relay statistics
- `GET /metrics` - Prometheus metrics (if enabled)

## Deployment

### Docker (Recommended)

```bash
# Build image
docker build -t tutor-hub-relay .

# Run container
docker run -d \
  -p 8080:8080 \
  -v ./data:/app/relay/data \
  --env-file .env \
  --name tutor-relay \
  tutor-hub-relay
```

### Manual Deployment

```bash
# Build for production
cd relay
npm run build

# Run with PM2
pm2 start dist/index.js --name tutor-relay

# Or with systemd (create service file)
```

### Environment Variables for Production

```env
PORT=8080
NODE_ENV=production
DATABASE_PATH=/var/lib/tutor-relay/relay.db
RATE_LIMIT_EVENTS_PER_MINUTE=100
MAX_EVENTS_PER_USER=50000
```

## Monitoring

Check relay health and statistics:

```bash
# Health check
curl http://localhost:8080/health

# View statistics
curl http://localhost:8080/stats

# Real-time logs
tail -f logs/relay.log
```

## Contributing

1. Fork this repository (`tutor-hub-2030/thr`)
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes in the `relay/` directory
4. Test thoroughly with `npm run dev`
5. Submit a pull request to `main` branch

After merging, update the submodule in [Tutorstr](https://github.com/chuckis/tutorstr).

## Testing

```bash
# Run tests (when implemented)
npm test

# Test with nostr-cli
nostr-cli relay ws://localhost:8080

# Or use a Nostr client library
```

## License

MIT License - see LICENSE file for details

## Resources

- [Nostr Protocol Specification](https://github.com/nostr-protocol/nostr)
- [NIP-01: Basic protocol flow](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-04: Encrypted Direct Messages](https://github.com/nostr-protocol/nips/blob/master/04.md)
- [NIP-65: Relay List Metadata](https://github.com/nostr-protocol/nips/blob/master/65.md)
- [Tutorstr Frontend](https://github.com/chuckis/tutorstr)
- [Submodule Update Guide](docs/SUBMODULE_UPDATE_GUIDE.md)

## Support

For issues or questions:
- Relay-specific issues: Open in this repository
- Frontend integration issues: Open in [Tutorstr](https://github.com/chuckis/tutorstr)
- General discussion: GitHub Discussions
