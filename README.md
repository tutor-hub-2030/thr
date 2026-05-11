# thr - Tutor Hub Relay

Custom Nostr relay for Tutor Hub decentralized tutoring platform.

## Overview

This is a specialized Nostr relay designed to support the Tutor Hub ecosystem, handling custom event kinds for tutor profiles, bookings, lessons, and encrypted communications.

## Current State

- Initial relay server setup with TypeScript and Bun/Node.js runtime
- SQLite storage backend with indexing for efficient queries
- Support for custom Tutor Hub event kinds (30000-30006)
- NIP-01 compliant WebSocket interface
- Rate limiting and moderation capabilities

## Features

### Core Relay Functionality
- WebSocket server implementing NIP-01 protocol
- Event storage and retrieval with SQLite
- Subscription filtering and real-time event broadcasting
- Custom event kind optimization for tutoring use cases

### Tutor Hub Specific Events
- `30000` - Tutor Profile (replaceable)
- `30001` - Tutor Schedule (replaceable)
- `30002` - Booking Request
- `30003` - Booking Status
- `30004` - Student Progress Log (encrypted, NIP-04)
- `30005` - Tutor Blog Post (reserved)
- `30006` - Lesson Agreement (addressable)
- `4` - Private Direct Message (encrypted, NIP-04)

### Security & Performance
- Rate limiting per connection and IP
- Event validation and signature verification
- Configurable storage limits and retention policies
- Optimized queries for tutor discovery and booking workflows

## Project Structure

```
thr/
├── relay/              # Relay server implementation
│   ├── src/           # Source code
│   ├── package.json   # Dependencies
│   └── tsconfig.json  # TypeScript config
├── frontend/          # Reference to Tutorstr frontend (submodule context)
├── docs/              # Documentation and specs
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```bash
cd relay
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Configuration

Create a `.env` file in the `relay/` directory:

```env
# Relay configuration
PORT=8080
RELAY_NAME="Tutor Hub Relay"
RELAY_DESCRIPTION="Decentralized tutoring platform relay"

# Database
DATABASE_PATH=./data/relay.db

# Rate limiting
RATE_LIMIT_EVENTS_PER_MINUTE=60
RATE_LIMIT_CONNECTIONS_PER_IP=10

# Storage limits
MAX_EVENTS_PER_USER=10000
MAX_EVENT_SIZE_BYTES=100000
```

## Architecture

The relay follows a layered architecture:

1. **Transport Layer**: WebSocket server handling NIP-01 protocol
2. **Storage Layer**: SQLite database with optimized indexes
3. **Business Logic**: Event validation, filtering, and routing
4. **API Layer**: Admin endpoints for monitoring and management

## Integration with Tutorstr Frontend

The relay is designed to work seamlessly with the [Tutorstr frontend](https://github.com/chuckis/tutorstr):

```typescript
// Frontend configuration example
const RELAY_URL = "wss://your-relay-domain.com";
```

## Deployment

### Docker (Recommended)

```bash
docker build -t tutor-hub-relay .
docker run -p 8080:8080 -v ./data:/app/data tutor-hub-relay
```

### Manual Deployment

1. Build the project: `npm run build`
2. Set up environment variables
3. Run with a process manager (PM2, systemd, etc.)

## Monitoring

The relay exposes metrics and health endpoints:

- `GET /health` - Health check
- `GET /metrics` - Prometheus-compatible metrics
- `GET /stats` - Relay statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Resources

- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [NIP-01: Basic protocol flow](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-04: Encrypted Direct Messages](https://github.com/nostr-protocol/nips/blob/master/04.md)
- [Tutorstr Frontend](https://github.com/chuckis/tutorstr)
