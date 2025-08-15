import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<User | null> {
  try {
    // Query for existing user by email and provider
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    // Check if user exists
    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // Verify provider matches
    if (user.provider !== input.provider) {
      return null;
    }

    // For Google OAuth, we would typically verify the provider_token here
    // For email provider, additional password verification would be needed
    // For this implementation, we assume the token/credentials are valid if provided

    return user;
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
}