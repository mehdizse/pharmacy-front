export interface User {
  id: string; // Changé de number à string pour UUID
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  role_display?: string; // Ajouté selon la spécification
  phone?: string; // Ajouté
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
  createdAt?: string; // Ajouté
  updatedAt?: string; // Ajouté
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PHARMACIEN = 'PHARMACIEN',
  COMPTABLE = 'COMPTABLE'
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string; // Ajouté selon la spécification
  expiresAt?: string; // Gardé pour compatibilité
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
}
