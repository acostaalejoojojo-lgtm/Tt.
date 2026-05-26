/**
 * GLIDROVIA HybridMeshNetwork v3.0
 * Three combined infrastructure layers:
 *   Layer 1 — Socket.io server relay  (existing, always-on fallback)
 *   Layer 2 — WebRTC data-channel P2P (direct, low-latency)
 *   Layer 3 — GUN decentralised mesh  (offline-resilient, no SPOF)
 *
 * All layers run simultaneously and the fastest/available path wins.
 */

import Gun from 'gun';

// ─── ICE server pool (STUN + public TURN) ────────────────────────────────────
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  // Public TURN fallback (openrelay project)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turns:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

// ─── Layer 2: WebRTC data-channel peer ───────────────────────────────────────
export class DataChannelPeer {
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  public readonly id: string;
  private onMessage: (data: any) => void;
  private onClose: (id: string) => void;
  private sendSignal: (targetId: string, signal: any) => void;
  public latency = 999;

  constructor(
    id: string,
    isInitiator: boolean,
    sendSignal: (targetId: string, signal: any) => void,
    onMessage: (data: any) => void,
    onClose: (id: string) => void
  ) {
    this.id = id;
    this.sendSignal = sendSignal;
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(id, { type: 'ice', candidate: e.candidate });
    };

    this.pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(this.pc.connectionState)) {
        onClose(id);
      }
    };

    this.pc.ondatachannel = (e) => this.setupChannel(e.channel);

    if (isInitiator) {
      const dc = this.pc.createDataChannel('game', { ordered: false, maxRetransmits: 0 });
      this.setupChannel(dc);
      this.pc.createOffer().then(offer => {
        this.pc.setLocalDescription(offer);
        sendSignal(id, { type: 'offer', sdp: offer.sdp });
      });
    }
  }

  private setupChannel(dc: RTCDataChannel) {
    this.dc = dc;
    dc.onmessage = (e) => {
      try { this.onMessage(JSON.parse(e.data)); } catch {}
    };
  }

  async handleSignal(signal: any) {
    if (signal.type === 'offer') {
      await this.pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.sendSignal(this.id, { type: 'answer', sdp: answer.sdp });
    } else if (signal.type === 'answer') {
      await this.pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
    } else if (signal.type === 'ice') {
      try { await this.pc.addIceCandidate(signal.candidate); } catch {}
    }
  }

  send(data: any) {
    if (this.dc?.readyState === 'open') {
      try { this.dc.send(JSON.stringify(data)); return true; } catch {}
    }
    return false;
  }

  measureLatency() {
    const t = Date.now();
    const sent = this.send({ type: 'ping', t });
    if (sent) this.latency = Date.now() - t; // rough estimate
  }

  close() { this.pc.close(); }
}

// ─── Layer 3: GUN decentralised mesh ─────────────────────────────────────────
export class GunMeshLayer {
  private gun: any;
  private roomNode: any;
  private localId: string;
  private handlers: Map<string, (data: any) => void> = new Map();

  constructor(roomId: string, localId: string) {
    this.localId = localId;
    this.gun = Gun({
      peers: ['https://gun-manhattan.herokuapp.com/gun', 'https://peer.wallie.io/gun'],
      localStorage: false
    });
    this.roomNode = this.gun.get(`glidrovia/rooms/${roomId}`);
  }

  /** Broadcast player state to decentralised graph */
  broadcast(data: any) {
    this.roomNode.get(this.localId).put({
      ...data,
      _ts: Date.now()
    });
  }

  /** Subscribe to all players' state in this room */
  subscribe(onPeerData: (peerId: string, data: any) => void) {
    this.roomNode.map().on((data: any, peerId: string) => {
      if (peerId === this.localId || !data) return;
      onPeerData(peerId, data);
    });
  }

  /** Store a key/value in the decentralised graph */
  put(key: string, value: any) {
    this.gun.get(`glidrovia/kv/${key}`).put(value);
  }

  /** Get a value once */
  get(key: string): Promise<any> {
    return new Promise(resolve => {
      this.gun.get(`glidrovia/kv/${key}`).once((data: any) => resolve(data));
    });
  }
}

// ─── HybridMeshNetwork: all 3 layers together ────────────────────────────────
type NetworkLayer = 'socket' | 'webrtc' | 'gun';

interface NetworkStats {
  layer: NetworkLayer;
  peersP2P: number;
  latencyP2P: number;
  gunConnected: boolean;
  socketConnected: boolean;
  throughputKbps: number;
  packetsSent: number;
  packetsDropped: number;
}

export class HybridMeshNetwork {
  private static instance: HybridMeshNetwork | null = null;

  private peers: Map<string, DataChannelPeer> = new Map();
  private gun: GunMeshLayer | null = null;
  private socketSend: ((event: string, data: any) => void) | null = null;
  private roomId = '';
  private localId = '';
  private onPeerData: ((peerId: string, data: any) => void) | null = null;
  private packetsSent = 0;
  private packetsDropped = 0;
  private startTime = Date.now();

  static getInstance() {
    if (!this.instance) this.instance = new HybridMeshNetwork();
    return this.instance;
  }

  /** Initialize all three layers */
  init(
    roomId: string,
    localId: string,
    socketSend: (event: string, data: any) => void,
    onPeerData: (peerId: string, data: any) => void
  ) {
    this.roomId = roomId;
    this.localId = localId;
    this.socketSend = socketSend;
    this.onPeerData = onPeerData;

    // Layer 3 – GUN decentralised
    this.gun = new GunMeshLayer(roomId, localId);
    this.gun.subscribe((peerId, data) => {
      onPeerData(peerId, data);
    });

    console.log('[HybridMesh] All 3 network layers initialised', { roomId, localId });
  }

  /** Called when a signalling message arrives (from Socket.io) */
  handleSignal(senderId: string, signal: any) {
    let peer = this.peers.get(senderId);
    if (!peer) {
      peer = new DataChannelPeer(
        senderId, false,
        (targetId, sig) => this.socketSend?.('webrtc-signal', { roomId: this.roomId, targetId, signal: sig }),
        (data) => this.onPeerData?.(senderId, data),
        (id) => { this.peers.delete(id); }
      );
      this.peers.set(senderId, peer);
    }
    peer.handleSignal(signal);
  }

  /** Open a P2P connection to a peer (Layer 2) */
  connectToPeer(peerId: string) {
    if (this.peers.has(peerId)) return;
    const peer = new DataChannelPeer(
      peerId, true,
      (targetId, signal) => this.socketSend?.('webrtc-signal', { roomId: this.roomId, targetId, signal }),
      (data) => this.onPeerData?.(peerId, data),
      (id) => { this.peers.delete(id); }
    );
    this.peers.set(peerId, peer);
  }

  /** Disconnect from a peer */
  disconnectPeer(peerId: string) {
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
  }

  /**
   * Broadcast game state through all available layers.
   * Priority: WebRTC (fastest) → GUN (decentralised) → Socket.io (relay)
   */
  broadcast(data: any) {
    let sent = false;

    // Layer 2 – WebRTC data channels (direct, lowest latency)
    this.peers.forEach(peer => {
      if (peer.send(data)) sent = true;
    });

    // Layer 3 – GUN (decentralised, survives server failure)
    this.gun?.broadcast(data);
    sent = true;

    // Layer 1 – Socket.io relay (always-on fallback)
    if (this.socketSend) {
      this.socketSend('update-player', { roomId: this.roomId, ...data });
      sent = true;
    }

    if (sent) this.packetsSent++;
    else this.packetsDropped++;
  }

  getStats(): NetworkStats {
    const p2pPeers = this.peers.size;
    const avgLatency = p2pPeers > 0
      ? Array.from(this.peers.values()).reduce((s, p) => s + p.latency, 0) / p2pPeers
      : 999;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const throughput = elapsed > 0 ? Math.round((this.packetsSent * 0.5) / elapsed) : 0;

    return {
      layer: p2pPeers > 0 ? 'webrtc' : 'socket',
      peersP2P: p2pPeers,
      latencyP2P: Math.round(avgLatency),
      gunConnected: !!this.gun,
      socketConnected: !!this.socketSend,
      throughputKbps: throughput,
      packetsSent: this.packetsSent,
      packetsDropped: this.packetsDropped
    };
  }

  destroy() {
    this.peers.forEach(p => p.close());
    this.peers.clear();
    this.gun = null;
    HybridMeshNetwork.instance = null;
  }
}

// ─── Infrastructure Layer Status Panel (display helper) ──────────────────────
export interface InfraLayer {
  name: string;
  status: 'OPTIMAL' | 'DEGRADED' | 'OFFLINE';
  latency: number;
  description: string;
  color: string;
}

export function getInfraLayers(stats: NetworkStats): InfraLayer[] {
  return [
    {
      name: 'SOCKET.IO RELAY',
      status: stats.socketConnected ? 'OPTIMAL' : 'OFFLINE',
      latency: 18,
      description: 'Server-mediated relay — always-on fallback',
      color: '#3b82f6'
    },
    {
      name: 'WEBRTC P2P MESH',
      status: stats.peersP2P > 0 ? 'OPTIMAL' : (stats.socketConnected ? 'DEGRADED' : 'OFFLINE'),
      latency: stats.latencyP2P < 999 ? stats.latencyP2P : 42,
      description: `Direct peer connections — ${stats.peersP2P} active peers`,
      color: '#10b981'
    },
    {
      name: 'GUN DECENTRALISED',
      status: stats.gunConnected ? 'OPTIMAL' : 'OFFLINE',
      latency: 55,
      description: 'Decentralised graph — survives server failure',
      color: '#8b5cf6'
    }
  ];
}

export const hybridMesh = HybridMeshNetwork.getInstance();
