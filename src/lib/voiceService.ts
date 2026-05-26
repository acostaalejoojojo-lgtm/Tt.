import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';

interface PeerConnection {
  peer: Peer.Instance;
  stream: MediaStream;
  gainNode: GainNode;
  audioElement: HTMLAudioElement;
}

export class VoiceService {
  private socket: Socket;
  private localStream: MediaStream | null = null;
  private peers: Record<string, PeerConnection> = {};
  private audioContext: AudioContext;
  private destination: MediaStreamAudioDestinationNode;
  
  constructor(socket: Socket) {
    this.socket = socket;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.destination = this.audioContext.createMediaStreamDestination();
    
    this.setupSignaling();
  }

  private setupSignaling() {
    this.socket.on('p2p-signal', (fromId, signal) => {
      if (this.peers[fromId]) {
        this.peers[fromId].peer.signal(signal);
      } else {
        // Only accept if we initiated or it's a new offer
        // In simple-peer, if we receive an offer, we create an answerer peer
        this.createPeer(fromId, false, signal);
      }
    });
  }

  async startLocalStream(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      console.error("[VOICE] Could not access microphone:", err);
      return false;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    // Clean up all peers
    Object.keys(this.peers).forEach(id => this.removePeer(id));
  }

  createPeer(targetId: string, initiator: boolean, incomingSignal?: any) {
    if (this.peers[targetId]) return;
    if (!this.localStream) return;

    console.log(`[VOICE] Creating peer ${initiator ? 'initiator' : 'receiver'} for:`, targetId);

    const peer = new Peer({
      initiator,
      trickle: false,
      stream: this.localStream
    });

    peer.on('signal', signal => {
      this.socket.emit('p2p-signal', targetId, signal);
    });

    peer.on('stream', stream => {
      console.log(`[VOICE] Received stream from:`, targetId);
      this.setupAudioProcessing(targetId, stream);
    });

    peer.on('close', () => this.removePeer(targetId));
    peer.on('error', (err) => {
      console.error(`[VOICE] Peer error (${targetId}):`, err);
      this.removePeer(targetId);
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    // placeholder connections until stream is ready
    this.peers[targetId] = { 
      peer, 
      stream: new MediaStream(), 
      gainNode: this.audioContext.createGain(),
      audioElement: new Audio()
    };
  }

  private setupAudioProcessing(targetId: string, stream: MediaStream) {
    if (!this.peers[targetId]) return;

    const source = this.audioContext.createMediaStreamSource(stream);
    const gainNode = this.audioContext.createGain();
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const audio = new Audio();
    audio.srcObject = stream;
    audio.play().catch(e => console.warn("Audio autoplay blocked", e));

    this.peers[targetId].stream = stream;
    this.peers[targetId].gainNode = gainNode;
    this.peers[targetId].audioElement = audio;
  }

  updateProximity(targetId: string, distance: number) {
    const peer = this.peers[targetId];
    if (!peer || !peer.gainNode) return;

    // Proximity logic: max volume at < 2 units, silent at > 15 units
    const maxDist = 20;
    const minDist = 3;
    let volume = 0;

    if (distance < minDist) {
      volume = 1.0;
    } else if (distance < maxDist) {
      volume = 1 - (distance - minDist) / (maxDist - minDist);
    } else {
      volume = 0;
    }

    // Smooth transition
    peer.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    
    // If silent and we were the initiator, we might consider closing (optional optimization)
  }

  removePeer(targetId: string) {
    if (this.peers[targetId]) {
      this.peers[targetId].peer.destroy();
      this.peers[targetId].audioElement.pause();
      this.peers[targetId].audioElement.srcObject = null;
      delete this.peers[targetId];
    }
  }
}
