import { PhotonRoom, PhotonMeshStatus } from '../types';
import { GlidroviaQuantum } from './quantum';

export { GlidroviaQuantum };

/**
 * PhotonMeshManager — wraps GlidroviaQuantum for room-listing UI.
 * Real-time stats come from the live quantum instance when in play mode.
 */
class PhotonMeshManager {
  private static instance: PhotonMeshManager;
  private connectivityStatus: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' = 'DISCONNECTED';
  private currentRegion: string = 'LATAM-1';
  private rooms: PhotonRoom[] = [];
  private _quantum: GlidroviaQuantum | null = null;

  private constructor() {
    this._seedRooms();
  }

  static getInstance(): PhotonMeshManager {
    if (!PhotonMeshManager.instance) {
      PhotonMeshManager.instance = new PhotonMeshManager();
    }
    return PhotonMeshManager.instance;
  }

  private _seedRooms() {
    for (let i = 1; i <= 10; i++) {
      this.rooms.push({
        id: `room-${i}`,
        name: `Glidrovia #${i}`,
        playerCount: Math.floor(Math.random() * 20),
        maxPlayers: 20,
        region: 'LATAM-1',
        type: 'Public',
        isQuantumEnabled: true
      });
    }
  }

  async connect(): Promise<boolean> {
    this.connectivityStatus = 'RECONNECTING';
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connectivityStatus = 'CONNECTED';
        console.log('[PHOTON QUANTUM] Master Server connected (LATAM-1)');
        resolve(true);
      }, 600);
    });
  }

  /** Attach a live GlidroviaQuantum instance for real stats */
  attachQuantum(q: GlidroviaQuantum) {
    this._quantum = q;
  }

  getStatus(): PhotonMeshStatus & { quantum?: ReturnType<GlidroviaQuantum['getStats']> } {
    return {
      activeRooms: 540 + Math.floor(Math.random() * 50),
      totalConcurrence: 8500 + Math.floor(Math.random() * 500),
      relayNodes: 42,
      photonCloudStatus: 'OPTIMAL',
      quantum: this._quantum?.getStats()
    };
  }

  listRooms(): PhotonRoom[] { return this.rooms; }

  joinRoom(roomId: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`[PHOTON] Joining ${roomId} — syncing Quantum ticks`);
      setTimeout(() => {
        console.log(`[PHOTON] ${roomId} joined. Quantum 30Hz active.`);
        resolve(true);
      }, 400);
    });
  }
}

export const photonMesh = PhotonMeshManager.getInstance();

/**
 * LocalProfileManager — offline-first user data
 */
export const LocalProfileManager = {
  SAVE_KEY: 'glidrovia_local_profile',

  saveProfile(profile: any) {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify({
        ...profile,
        isHistorical: true,
        localUpdatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.error('[LOCAL STORAGE] Error saving profile:', e);
    }
  },

  getProfile() {
    const data = localStorage.getItem(this.SAVE_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearProfile() {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
