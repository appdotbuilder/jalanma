import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different scenarios
const googleUserInput: CreateUserInput = {
  email: 'test.google@example.com',
  name: 'Google Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  provider: 'google'
};

const emailUserInput: CreateUserInput = {
  email: 'test.email@example.com',
  name: 'Email Test User',
  avatar_url: null,
  provider: 'email'
};

const userWithoutAvatarInput: CreateUserInput = {
  email: 'noavatar@example.com',
  name: 'User Without Avatar',
  avatar_url: null,
  provider: 'email'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a Google OAuth user', async () => {
    const result = await createUser(googleUserInput);

    // Basic field validation
    expect(result.email).toEqual('test.google@example.com');
    expect(result.name).toEqual('Google Test User');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.provider).toEqual('google');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an email-based user', async () => {
    const result = await createUser(emailUserInput);

    // Basic field validation
    expect(result.email).toEqual('test.email@example.com');
    expect(result.name).toEqual('Email Test User');
    expect(result.avatar_url).toBeNull();
    expect(result.provider).toEqual('email');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user without avatar_url', async () => {
    const result = await createUser(userWithoutAvatarInput);

    expect(result.email).toEqual('noavatar@example.com');
    expect(result.name).toEqual('User Without Avatar');
    expect(result.avatar_url).toBeNull();
    expect(result.provider).toEqual('email');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(googleUserInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test.google@example.com');
    expect(users[0].name).toEqual('Google Test User');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].provider).toEqual('google');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique UUIDs for different users', async () => {
    const user1 = await createUser(googleUserInput);
    const user2 = await createUser({
      ...emailUserInput,
      email: 'different@example.com'
    });

    expect(user1.id).not.toEqual(user2.id);
    expect(typeof user1.id).toBe('string');
    expect(typeof user2.id).toBe('string');
    expect(user1.id.length).toBeGreaterThan(0);
    expect(user2.id.length).toBeGreaterThan(0);
  });

  it('should set created_at and updated_at to current time', async () => {
    const beforeCreate = new Date();
    const result = await createUser(googleUserInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(googleUserInput);

    // Attempt to create user with same email should fail
    await expect(createUser({
      ...googleUserInput,
      name: 'Different Name'
    })).rejects.toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should handle both provider types correctly', async () => {
    const googleUser = await createUser(googleUserInput);
    const emailUser = await createUser(emailUserInput);

    expect(googleUser.provider).toEqual('google');
    expect(emailUser.provider).toEqual('email');

    // Verify both are saved in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
    const providers = allUsers.map(u => u.provider);
    expect(providers).toContain('google');
    expect(providers).toContain('email');
  });
});