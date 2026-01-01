// Mock authentication service for demo purposes
export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
}

class MockAuthService {
  private currentUser: MockUser | null = null;
  private listeners: ((user: MockUser | null) => void)[] = [];

  constructor() {
    // Load saved user from localStorage
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.notifyListeners();
    }
  }

  // Simulate login
  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    // Accept any email/password for demo
    const user: MockUser = {
      uid: 'demo-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0]
    };
    
    this.currentUser = user;
    localStorage.setItem('mockUser', JSON.stringify(user));
    this.notifyListeners();
    
    return { user };
  }

  // Simulate registration
  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    const user: MockUser = {
      uid: 'demo-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0]
    };
    
    this.currentUser = user;
    this.notifyListeners();
    
    return { user };
  }

  // Simulate logout
  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('mockUser');
    this.notifyListeners();
  }

  // Get current user
  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: MockUser | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const mockAuth = new MockAuthService();
