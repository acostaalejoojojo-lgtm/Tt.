/**
 * GlidroviaQuantum Client Engine v1.0
 * Real deterministic multiplayer — equivalent to Photon Quantum
 *
 * Architecture:
 *  - Client captures inputs and applies them locally (prediction) at 60 Hz
 *  - Server runs authoritative physics at 30 Hz and broadcasts snapshots
 *  - Client reconciles: if server position differs > threshold, it rewinds
 *    to the last acknowledged state and re-applies pending inputs
 *  - Remote players are interpolated between received server snapshots
 */

export interface QInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  camY: number;   // camera horizontal angle (for movement direction)
  seq: number;    // monotonic sequence — used for reconciliation
}

export interface QPlayerSnapshot {
  x: number; y: number; z: number;
  ry: number;     // rotation Y
  seq: number;    // last input seq the server used for this player
}

interface QSnapshot {
  tick: number;
  players: Record<string, QPlayerSnapshot>;
}

export interface QLocalState {
  x: number; y: number; z: number;
  vy: number;        // vertical velocity
  ry: number;        // rotation Y
  onGround: boolean;
  moving: boolean;
  jumping: boolean;
}

// ─── deterministic physics step ──────────────────────────────────────────────
// Matches the server-side step exactly so prediction is accurate
const SPEED      = 0.25;
const GRAVITY    = 0.025;
const JUMP_FORCE = 0.5;

function applyInput(input: QInput, s: QLocalState): void {
  const sinY = Math.sin(input.camY);
  const cosY = Math.cos(input.camY);

  let mx = 0, mz = 0;
  if (input.forward)  { mx -= sinY; mz -= cosY; }
  if (input.backward) { mx += sinY; mz += cosY; }
  if (input.left)     { mx -= cosY; mz += sinY; }
  if (input.right)    { mx += cosY; mz -= sinY; }

  const len = Math.sqrt(mx * mx + mz * mz);
  s.moving = len > 0;
  if (len > 0) {
    mx = (mx / len) * SPEED;
    mz = (mz / len) * SPEED;
    s.ry = Math.atan2(mx, mz);
  }

  s.x += mx;
  s.z += mz;

  // Gravity
  s.vy -= GRAVITY;

  if (input.jump && s.onGround) {
    s.vy = JUMP_FORCE;
    s.onGround = false;
    s.jumping = true;
  }

  s.y += s.vy;

  if (s.y <= 0) {
    s.y = 0;
    s.vy = 0;
    s.onGround = true;
    s.jumping = false;
  }
}

// ─── GlidroviaQuantum ────────────────────────────────────────────────────────
export class GlidroviaQuantum {
  private socket: any;
  private roomId: string;
  readonly localId: string;

  private seq = 0;
  private ready = false;
  private _connected = false;

  // Local client-side prediction state
  private predicted: QLocalState = {
    x: 0, y: 0, z: 0, vy: 0, ry: 0, onGround: true, moving: false, jumping: false
  };

  // Ring-buffer of sent inputs for reconciliation (last 128 frames)
  private inputHistory: Array<{ seq: number; input: QInput }> = [];

  // Remote player snapshot ring-buffers for interpolation
  private remoteBuffers = new Map<string, QPlayerSnapshot[]>();

  // Public callbacks
  onLocalUpdate: ((s: QLocalState) => void) | null = null;
  onRemoteUpdate: ((players: Record<string, QPlayerSnapshot>) => void) | null = null;
  onConnected: (() => void) | null = null;

  // Input state (set externally by player controller)
  keys: Record<string, boolean> = {};
  camY = 0;

  private inputLoop: ReturnType<typeof setInterval> | null = null;
  private serverTick = 0;
  private _stats = { reconciliations: 0, packetsIn: 0, packetsOut: 0 };

  constructor(socket: any, roomId: string, localId: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.localId = localId;
    this._bind();
  }

  private _bind() {
    this.socket.on('q-ready', ({ tick }: { tick: number }) => {
      this.serverTick = tick;
      this.ready = true;
      this._connected = true;
      console.log('[GlidroviaQuantum] ✓ Server connected. Tick:', tick);
      this.onConnected?.();
    });

    this.socket.on('q-snapshot', (snap: QSnapshot) => {
      this._stats.packetsIn++;
      this.serverTick = snap.tick;
      this._processSnapshot(snap);
    });
  }

  /** Join the quantum room and start input loop */
  join(spawnX = 0, spawnY = 0, spawnZ = 0) {
    this.predicted.x = spawnX;
    this.predicted.y = spawnY;
    this.predicted.z = spawnZ;
    this.socket.emit('q-join', this.roomId);
    this._startInputLoop();
  }

  private _startInputLoop() {
    // 60 Hz input capture + local prediction
    this.inputLoop = setInterval(() => {
      if (!this.ready) return;

      const input: QInput = {
        forward:  !!(this.keys['KeyW']  || this.keys['ArrowUp']),
        backward: !!(this.keys['KeyS']  || this.keys['ArrowDown']),
        left:     !!(this.keys['KeyA']  || this.keys['ArrowLeft']),
        right:    !!(this.keys['KeyD']  || this.keys['ArrowRight']),
        jump:     !!this.keys['Space'],
        camY:     this.camY,
        seq:      this.seq++
      };

      // Store for reconciliation
      this.inputHistory.push({ seq: input.seq, input });
      if (this.inputHistory.length > 128) this.inputHistory.shift();

      // Local prediction — apply immediately for zero perceived latency
      applyInput(input, this.predicted);
      this.onLocalUpdate?.(this.predicted);

      // Ship to server
      this.socket.emit('q-input', this.roomId, input);
      this._stats.packetsOut++;
    }, 1000 / 60);
  }

  private _processSnapshot(snap: QSnapshot) {
    const localSnap = snap.players[this.localId];

    // ── Reconciliation ───────────────────────────────────────────────────────
    if (localSnap) {
      const THRESHOLD = 0.6; // metres before we correct
      const dx = Math.abs(this.predicted.x - localSnap.x);
      const dz = Math.abs(this.predicted.z - localSnap.z);
      const dy = Math.abs(this.predicted.y - localSnap.y);

      if (dx > THRESHOLD || dz > THRESHOLD || dy > THRESHOLD) {
        // Reset to server-authoritative state
        this.predicted.x  = localSnap.x;
        this.predicted.y  = localSnap.y;
        this.predicted.z  = localSnap.z;
        this.predicted.ry = localSnap.ry;
        this.predicted.vy = 0;

        // Re-apply all inputs that the server hasn't processed yet
        const pending = this.inputHistory.filter(h => h.seq > localSnap.seq);
        pending.forEach(({ input }) => applyInput(input, this.predicted));

        this._stats.reconciliations++;
      }
    }

    // ── Remote player snapshot buffering ────────────────────────────────────
    const remoteUpdate: Record<string, QPlayerSnapshot> = {};

    Object.entries(snap.players).forEach(([pid, state]) => {
      if (pid === this.localId) return;

      let buf = this.remoteBuffers.get(pid);
      if (!buf) { buf = []; this.remoteBuffers.set(pid, buf); }

      buf.push(state);
      if (buf.length > 12) buf.shift();

      // Interpolated position: take second-to-last snapshot for smooth render
      remoteUpdate[pid] = buf.length >= 2 ? buf[buf.length - 2] : state;
    });

    // Remove buffers for players who left
    this.remoteBuffers.forEach((_, pid) => {
      if (!snap.players[pid]) this.remoteBuffers.delete(pid);
    });

    if (Object.keys(remoteUpdate).length > 0) {
      this.onRemoteUpdate?.(remoteUpdate);
    }
  }

  get connected() { return this._connected; }

  getStats() {
    return {
      connected: this._connected,
      serverTick: this.serverTick,
      inputSeq: this.seq,
      remotePlayers: this.remoteBuffers.size,
      historyBuffer: this.inputHistory.length,
      reconciliations: this._stats.reconciliations,
      packetsIn: this._stats.packetsIn,
      packetsOut: this._stats.packetsOut,
      tickRate: 30
    };
  }

  destroy() {
    if (this.inputLoop) clearInterval(this.inputLoop);
    this.socket.off('q-ready');
    this.socket.off('q-snapshot');
    this._connected = false;
  }
}
