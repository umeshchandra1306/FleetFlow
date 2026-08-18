const MIN_JWT_SECRET_LENGTH = 32;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH || secret.toLowerCase() === 'secret') {
    throw new Error(`JWT_SECRET must be set and at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }
  return secret;
}

export function validateEnvironment(): void {
  getJwtSecret();
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL must be set');
  }
}
