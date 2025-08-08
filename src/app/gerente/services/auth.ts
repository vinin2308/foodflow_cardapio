import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest, ForgotPasswordRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Mock users data
  private mockUsers: User[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@foodflow.com',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date()
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@foodflow.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      createdAt: new Date('2024-01-10'),
      lastLogin: new Date()
    }
  ];

  constructor() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('foodflow_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(loginData: LoginRequest): Observable<User> {
    // Simulate API call delay
    return of(null).pipe(
      delay(1500),
      map(() => {
        // Mock authentication logic
        const user = this.mockUsers.find(u => u.email === loginData.email);
        
        if (!user) {
          throw new Error('Usuário não encontrado');
        }
        
        // In a real app, you would verify the password hash
        if (loginData.password !== '123456') {
          throw new Error('Senha incorreta');
        }
        
        // Update last login
        user.lastLogin = new Date();
        
        // Save to localStorage
        localStorage.setItem('foodflow_user', JSON.stringify(user));
        
        // Update subjects
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        
        return user;
      })
    );
  }

  register(registerData: RegisterRequest): Observable<User> {
    return of(null).pipe(
      delay(2000),
      map(() => {
        // Check if user already exists
        const existingUser = this.mockUsers.find(u => u.email === registerData.email);
        if (existingUser) {
          throw new Error('Usuário já existe com este email');
        }
        
        // Check if passwords match
        if (registerData.password !== registerData.confirmPassword) {
          throw new Error('Senhas não coincidem');
        }
        
        // Create new user
        const newUser: User = {
          id: (this.mockUsers.length + 1).toString(),
          name: registerData.name,
          email: registerData.email,
          role: 'manager',
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        // Add to mock users
        this.mockUsers.push(newUser);
        
        // Save to localStorage
        localStorage.setItem('foodflow_user', JSON.stringify(newUser));
        
        // Update subjects
        this.currentUserSubject.next(newUser);
        this.isAuthenticatedSubject.next(true);
        
        return newUser;
      })
    );
  }

  forgotPassword(forgotData: ForgotPasswordRequest): Observable<{ message: string }> {
    return of(null).pipe(
      delay(1500),
      map(() => {
        // Check if user exists
        const user = this.mockUsers.find(u => u.email === forgotData.email);
        if (!user) {
          throw new Error('Usuário não encontrado com este email');
        }
        
        // In a real app, you would send a reset email
        return {
          message: 'Um email com instruções para redefinir sua senha foi enviado para ' + forgotData.email
        };
      })
    );
  }

  logout(): void {
    localStorage.removeItem('foodflow_user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}

