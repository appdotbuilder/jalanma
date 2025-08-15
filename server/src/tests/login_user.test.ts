import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type CreateUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  provider: 'google',
};

const testUserEmail: CreateUserInput = {
  email: 'test2@example.com',
  name: 'Test User 2',
  avatar_url: null,
  provider: 'email',
};

// Helper function to create a user directly in the database for testing
const createTestUser = async (userData: CreateUserInput): Promise<string> => {
  const result = await db.insert(usersTable)
    .values({
      email: userData.email,
      name: userData.name,
      avatar_url: userData.avatar_url,
      provider: userData.provider,
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when valid email and provider match', async () => {
    // Create a user first
    const userId = await createTestUser(testUser);

    // Login with matching credentials
    const loginInput: LoginInput = {
      email: 'test@example.com',
      provider: 'google',
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(userId);
    expect(result?.email).toEqual('test@example.com');
    expect(result?.name).toEqual('Test User');
    expect(result?.provider).toEqual('google');
    expect(result?.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return user for email provider', async () => {
    // Create a user with email provider
    const userId = await createTestUser(testUserEmail);

    // Login with email provider
    const loginInput: LoginInput = {
      email: 'test2@example.com',
      provider: 'email',
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(userId);
    expect(result?.email).toEqual('test2@example.com');
    expect(result?.provider).toEqual('email');
    expect(result?.avatar_url).toBeNull();
  });

  it('should return null when user does not exist', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      provider: 'google',
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null when provider does not match', async () => {
    // Create user with Google provider
    await createTestUser(testUser);

    // Try to login with email provider
    const loginInput: LoginInput = {
      email: 'test@example.com',
      provider: 'email',
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create user with lowercase email
    await createTestUser(testUser);

    // Try to login with uppercase email
    const loginInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      provider: 'google',
    };

    const result = await loginUser(loginInput);

    // Should return null because email case doesn't match
    expect(result).toBeNull();
  });

  it('should verify database state remains unchanged after login', async () => {
    // Create a user
    const userId = await createTestUser(testUser);

    // Get initial user data
    const initialUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    const initialUser = initialUsers[0];

    // Login
    const loginInput: LoginInput = {
      email: 'test@example.com',
      provider: 'google',
    };

    await loginUser(loginInput);

    // Verify user data in database is unchanged
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(dbUsers).toHaveLength(1);
    expect(dbUsers[0].email).toEqual('test@example.com');
    expect(dbUsers[0].name).toEqual('Test User');
    expect(dbUsers[0].provider).toEqual('google');
    expect(dbUsers[0].updated_at).toEqual(initialUser.updated_at);
  });

  it('should handle login with provider token', async () => {
    // Create user
    await createTestUser(testUser);

    // Login with provider token (simulating OAuth)
    const loginInput: LoginInput = {
      email: 'test@example.com',
      provider: 'google',
      provider_token: 'valid-oauth-token',
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result?.email).toEqual('test@example.com');
    expect(result?.provider).toEqual('google');
  });
});