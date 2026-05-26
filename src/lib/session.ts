import { dataService } from './dataService';
import { playFab } from './playfab';

/**
 * Glidrovia Session Resilience Engine
 * Handles persistent login into "Glidrovia Oficial" 
 * and ensures states are recovered on mobile devices.
 */
class SessionManager {
    private static instance: SessionManager;
    private currentUser: any = null;
    private isInitialized: boolean = false;

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    public async initialize(): Promise<any> {
        if (this.isInitialized) return this.currentUser;

        console.log('[SESSION] Initializing Resilience Engine...');
        const storedUser = localStorage.getItem('glidrovia_session');
        
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                console.log(`[SESSION] Restoring account: ${parsed.username}`);
                
                // Attempt to re-verify with PlayFab or Backend
                const refreshedUser = await dataService.login(parsed.username, 'PERSISTED');
                this.currentUser = refreshedUser;
                this.isInitialized = true;
                return refreshedUser;
            } catch (err) {
                console.error('[SESSION] Failed to restore session:', err);
                localStorage.removeItem('glidrovia_session');
            }
        }
        
        this.isInitialized = true;
        return null;
    }

    public async login(username: string, password?: string): Promise<any> {
        try {
            const user = await dataService.login(username, password);
            this.currentUser = user;
            
            // Save for "saved in phone" persistence
            localStorage.setItem('glidrovia_session', JSON.stringify({
                username: user.username,
                uid: user.uid,
                lastLogin: Date.now()
            }));

            // Sync with PlayFab infrastructure
            try {
                await playFab.login(username);
            } catch (pfErr) {
                console.warn('[SESSION] PlayFab sync failed, but core login succeeded:', pfErr);
            }

            return user;
        } catch (err) {
            console.error('[SESSION] Login error:', err);
            throw err;
        }
    }

    public logout() {
        this.currentUser = null;
        localStorage.removeItem('glidrovia_session');
        window.location.reload();
    }

    public getCurrentUser() {
        return this.currentUser;
    }
}

export const sessionManager = SessionManager.getInstance();
