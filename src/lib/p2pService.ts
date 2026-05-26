import { Socket } from 'socket.io-client';
import Gun from 'gun';
import Peer from 'simple-peer';
import { RemotePlayer } from '../types';

// Use Gun for decentralized state (Gun nodes can be added here)
const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun'
  ]
});

export interface MultiUpdate {
  type: 'movement' | 'chat' | 'voice_status' | 'voice_data';
  payload: any;
}

class MultiplayerService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;
  private peers: Map<string, Peer.Instance> = new Map();
  private onMessage: (msg: any) => void = () => {};
  private onPlayerUpdate: (player: Partial<RemotePlayer>) => void = () => {};
  private isMicEnabled: boolean = false;
  private localStream: MediaStream | null = null;
  private gunPlayers = gun.get('glidrovia-players');

  init(socket: Socket) {
    this.socket = socket;
    
    // Signaling via Socket.io
    this.socket.on("p2p-signal", (senderId: string, signal: any) => {
      let peer = this.peers.get(senderId);
      if (!peer) {
        peer = this.createPeer(senderId, false);
      }
      peer.signal(signal);
    });

    this.socket.on("room-state", (state: any) => {
      Object.keys(state.players).forEach((id) => {
        if (id !== this.socket?.id) {
          this.createPeer(id, true); // We initiate connection
        }
      });
    });

    this.socket.on("player-left", (id: string) => {
      const peer = this.peers.get(id);
      if (peer) {
        peer.destroy();
        this.peers.delete(id);
      }
      this.onPlayerUpdate({ id, disconnected: true } as any);
    });

    // GunDB Listener for decentralized profile updates
    this.gunPlayers.map().on((data: any, id: string) => {
       if (data) {
          this.onPlayerUpdate(data);
       }
    });
  }

  private createPeer(peerId: string, initiator: boolean): Peer.Instance {
    const peer = new Peer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      },
      stream: this.localStream || undefined
    });

    peer.on('signal', (signal) => {
      this.socket?.emit('p2p-signal', peerId, signal);
    });

    peer.on('data', (data) => {
      const update = JSON.parse(data.toString());
      if (update.type === 'movement') {
        this.onPlayerUpdate(update.payload);
      } else if (update.type === 'chat') {
        this.onMessage(update.payload);
      }
    });

    peer.on('stream', (stream) => {
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play().catch(e => console.warn("P2P Audio start failed:", e));
    });

    peer.on('error', (err) => console.error('P2P Error:', err));
    peer.on('close', () => this.peers.delete(peerId));

    this.peers.set(peerId, peer);
    return peer;
  }

  joinRoom(roomId: string, userData: any) {
    if (!this.socket) return;
    this.currentRoom = roomId;
    this.socket.emit("join-room", roomId, userData);
    
    // Also store in Gun for decentralized discovery
    if (userData.username) {
      this.gunPlayers.get(userData.username).put(userData);
    }
  }

  updatePresence(data: any) {
    // Broadcast to peers directly for ultra-low latency
    const payload = JSON.stringify({ type: 'movement', payload: data });
    this.peers.forEach(peer => {
      if (peer.connected) peer.send(payload);
    });

    // Fallback to signaling for new joins
    this.socket?.emit("update-player", this.currentRoom, data);
  }

  sendChat(text: string, username: string) {
    const payload = JSON.stringify({ type: 'chat', payload: { user: username, text } });
    this.peers.forEach(peer => {
      if (peer.connected) peer.send(payload);
    });
    this.socket?.emit("chat-message", this.currentRoom, { user: username, text });
  }

  async toggleMic(enabled: boolean): Promise<boolean> {
    this.isMicEnabled = enabled;
    if (enabled) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Update all existing peers with the new stream
        this.peers.forEach(peer => {
           if (this.localStream) peer.addStream(this.localStream);
        });
        return true;
      } catch (err) {
        console.error("Mic error:", err);
        return false;
      }
    } else {
      if (this.localStream) {
        this.localStream.getTracks().forEach(t => t.stop());
        this.peers.forEach(peer => {
           if (this.localStream) peer.removeStream(this.localStream);
        });
        this.localStream = null;
      }
      return true;
    }
  }

  setHandlers(onMessage: (msg: any) => void, onPlayerUpdate: (p: any) => void) {
    this.onMessage = onMessage;
    this.onPlayerUpdate = onPlayerUpdate;
  }
}

export const p2pService = new MultiplayerService();
