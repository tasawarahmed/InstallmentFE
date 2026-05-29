import { Injectable } from '@angular/core';

const USERNAME = 'TariqBucha';
const PASSWORD = '@Dm1N01';
const SESSION_KEY = 'awims_logged_in';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = false;

  constructor() {
    this.loggedIn = sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  login(username: string, password: string): boolean {
    if (username === USERNAME && password === PASSWORD) {
      this.loggedIn = true;
      sessionStorage.setItem(SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    this.loggedIn = false;
    sessionStorage.removeItem(SESSION_KEY);
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }
}
