import { WebSocketServer, WebSocket } from 'ws';
import { validateEvent, verifyEvent } from 'nostr-tools';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, '../data/relay.db');

// Nostr Event Kinds for Tutorstr
const TUTORSTR_KINDS = {
  TUTOR_PROFILE: 30000,
  AVAILABILITY: 30001,
  LESSON_REQUEST: 30002,
  BOOKING_CONFIRMATION: 30003,
  LESSON_COMPLETION: 30004,
  REVIEW_RATING: 30005,
  PAYMENT_INVOICE: 30006,
};

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface Client {
  ws: WebSocket;
  subscriptions: Map<string, Filter>;
}

interface Filter {
  ids?: string[];
  kinds?: number[];
  authors?: string[];
  since?: number;
  until?: number;
  limit?: number;
  '#e'?: string[];
  '#p'?: string[];
  '#t'?: string[];
}

class RelayServer {
  private wss: WebSocketServer;
  private db: Database;
  private clients: Map<WebSocket, Client> = new Map();

  constructor() {
    this.initDatabase();
    this.wss = new WebSocketServer({ port: PORT });
    this.setupWebSocketHandlers();
    console.log(`🚀 Tutorstr Relay running on ws://localhost:${PORT}`);
  }

  private initDatabase(): void {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new Database(DB_PATH);
    
    // Create events table with indexing for Tutorstr kinds
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        pubkey TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        kind INTEGER NOT NULL,
        tags TEXT NOT NULL,
        content TEXT NOT NULL,
        sig TEXT NOT NULL,
        received_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_kind ON events(kind);
      CREATE INDEX IF NOT EXISTS idx_pubkey ON events(pubkey);
      CREATE INDEX IF NOT EXISTS idx_created_at ON events(created_at);
      CREATE INDEX IF NOT EXISTS idx_kind_created_at ON events(kind, created_at DESC);
      
      -- Index for tag queries (e.g., #e, #p)
      CREATE INDEX IF NOT EXISTS idx_tags ON events(tags);
    `);
    
    console.log('✅ Database initialized at', DB_PATH);
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const client: Client = { ws, subscriptions: new Map() };
      this.clients.set(ws, client);
      console.log(`🔌 Client connected. Total clients: ${this.clients.size}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`🔌 Client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('Client error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(client: Client, message: any[]): void {
    const [type, ...args] = message;

    switch (type) {
      case 'EVENT':
        this.handleEvent(client, args[0]);
        break;
      case 'REQ':
        this.handleRequest(client, args[0], ...args.slice(1));
        break;
      case 'CLOSE':
        this.handleClose(client, args[0]);
        break;
      default:
        this.sendError(client.ws, `Unknown message type: ${type}`);
    }
  }

  private handleEvent(client: Client, event: NostrEvent): void {
    // Validate event structure
    if (!validateEvent(event)) {
      this.sendOK(client.ws, event.id, false, 'Invalid event format');
      return;
    }

    // Verify signature
    if (!verifyEvent(event)) {
      this.sendOK(client.ws, event.id, false, 'Invalid signature');
      return;
    }

    // Check for duplicate event
    const existing = this.db.prepare('SELECT id FROM events WHERE id = ?').get(event.id);
    if (existing) {
      this.sendOK(client.ws, event.id, true, 'duplicate');
      return;
    }

    // Store event in database
    try {
      const stmt = this.db.prepare(`
        INSERT INTO events (id, pubkey, created_at, kind, tags, content, sig)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.pubkey,
        event.created_at,
        event.kind,
        JSON.stringify(event.tags),
        event.content,
        event.sig
      );

      console.log(`📝 Event stored: kind=${event.kind}, pubkey=${event.pubkey.substring(0, 8)}...`);
      
      // Notify subscribers
      this.notifySubscribers(event);
      
      this.sendOK(client.ws, event.id, true);
    } catch (error: any) {
      console.error('Database error:', error);
      this.sendOK(client.ws, event.id, false, error.message);
    }
  }

  private handleRequest(client: Client, subscriptionId: string, ...filters: Filter[]): void {
    client.subscriptions.set(subscriptionId, filters[0]); // Support single filter for now

    const results = this.queryEvents(filters);
    
    // Send stored events
    results.forEach(event => {
      this.sendEvent(client.ws, subscriptionId, event);
    });

    // Send EOSE (End of Stored Events)
    this.sendEOSE(client.ws, subscriptionId);
  }

  private handleClose(client: Client, subscriptionId: string): void {
    client.subscriptions.delete(subscriptionId);
  }

  private queryEvents(filters: Filter[]): NostrEvent[] {
    const filter = filters[0];
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (filter.ids && filter.ids.length > 0) {
      query += ` AND id IN (${filter.ids.map(() => '?').join(',')})`;
      params.push(...filter.ids);
    }

    if (filter.kinds && filter.kinds.length > 0) {
      query += ` AND kind IN (${filter.kinds.map(() => '?').join(',')})`;
      params.push(...filter.kinds);
    }

    if (filter.authors && filter.authors.length > 0) {
      query += ` AND pubkey IN (${filter.authors.map(() => '?').join(',')})`;
      params.push(...filter.authors);
    }

    if (filter.since) {
      query += ' AND created_at >= ?';
      params.push(filter.since);
    }

    if (filter.until) {
      query += ' AND created_at <= ?';
      params.push(filter.until);
    }

    // Handle tag filters (#e, #p, #t)
    if (filter['#e'] && filter['#e'].length > 0) {
      query += ` AND tags LIKE ?`;
      params.push(`%"${filter['#e'][0]}"%`);
    }

    if (filter['#p'] && filter['#p'].length > 0) {
      query += ` AND tags LIKE ?`;
      params.push(`%"${filter['#p'][0]}"%`);
    }

    query += ' ORDER BY created_at DESC';
    
    if (filter.limit) {
      query += ` LIMIT ?`;
      params.push(filter.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      pubkey: row.pubkey,
      created_at: row.created_at,
      kind: row.kind,
      tags: JSON.parse(row.tags),
      content: row.content,
      sig: row.sig,
    }));
  }

  private notifySubscribers(event: NostrEvent): void {
    this.clients.forEach((client) => {
      client.subscriptions.forEach((filter, subId) => {
        if (this.eventMatchesFilter(event, filter)) {
          this.sendEvent(client.ws, subId, event);
        }
      });
    });
  }

  private eventMatchesFilter(event: NostrEvent, filter: Filter): boolean {
    if (filter.ids && !filter.ids.includes(event.id)) return false;
    if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
    if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
    if (filter.since && event.created_at < filter.since) return false;
    if (filter.until && event.created_at > filter.until) return false;

    // Check tag filters
    if (filter['#e']) {
      const eTags = event.tags.filter(t => t[0] === 'e').map(t => t[1]);
      if (!filter['#e'].some(tag => eTags.includes(tag))) return false;
    }

    if (filter['#p']) {
      const pTags = event.tags.filter(t => t[0] === 'p').map(t => t[1]);
      if (!filter['#p'].some(tag => pTags.includes(tag))) return false;
    }

    return true;
  }

  // NIP-01 Response Methods
  private sendEvent(ws: WebSocket, subscriptionId: string, event: NostrEvent): void {
    ws.send(JSON.stringify(['EVENT', subscriptionId, event]));
  }

  private sendOK(ws: WebSocket, eventId: string, success: boolean, message: string = ''): void {
    ws.send(JSON.stringify(['OK', eventId, success, message]));
  }

  private sendEOSE(ws: WebSocket, subscriptionId: string): void {
    ws.send(JSON.stringify(['EOSE', subscriptionId]));
  }

  private sendError(ws: WebSocket, message: string): void {
    ws.send(JSON.stringify(['ERROR', message]));
  }
}

// Start the relay server
new RelayServer();
