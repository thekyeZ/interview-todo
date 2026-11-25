export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly isDemo?: boolean;
}

export type AuthUser = Omit<User, 'password'>;

export interface AuthCredentials {
  readonly email: string;
  readonly password: string;
}

export type CreateUserPayload = Omit<User, 'id'>;
