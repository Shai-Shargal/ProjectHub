export interface PersonalDetails {
  name: string;
  team: string;
  // Backend returns datetime; parse/format in the UI layer as needed.
  joinedDate: string;
  avatar: string;
}

// Backend success responses are expected to return both `token` and `personalDetails`.
// We keep them optional to support the assignment fallback: if register succeeds
// but these fields are missing, redirect the user back to `/login`.
export interface AuthResponse {
  token?: string;
  personalDetails?: PersonalDetails;
  // Backend `RegisterResponse` uses `userId` and does NOT return a `token` field.
  // Our backend also defines the assignment "token" concept as `user.Id.ToString()`,
  // so we can treat `userId` as the token source when needed.
  userId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  team: string;
  avatar: string;
}

