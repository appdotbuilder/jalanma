import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, roadDamageReportsTable } from '../db/schema';
import { getUserReports } from '../handlers/get_user_reports';

describe('getUserReports', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no reports', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const reports = await getUserReports(userId);
    expect(reports).toEqual([]);
  });

  it('should return all reports for a specific user', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple reports for this user with different created_at times
    const earlierTime = new Date('2024-01-15T10:00:00Z');
    const laterTime = new Date('2024-01-15T11:00:00Z');

    // Insert first report (older)
    await db.insert(roadDamageReportsTable)
      .values({
        user_id: userId,
        reporter_name: 'John Doe',
        reporter_phone: '08123456789',
        reporter_address: 'Jl. Test No. 1',
        report_date: new Date('2024-01-15'),
        damage_description: 'Pothole on main road',
        photo_url: 'https://example.com/photo1.jpg',
        latitude: -6.2088,
        longitude: 106.8456,
        status: 'pending' as const,
        created_at: earlierTime
      })
      .execute();

    // Insert second report (newer) 
    await db.insert(roadDamageReportsTable)
      .values({
        user_id: userId,
        reporter_name: 'Jane Smith',
        reporter_phone: '08987654321',
        reporter_address: 'Jl. Test No. 2',
        report_date: new Date('2024-01-16'),
        damage_description: 'Cracked pavement',
        photo_url: 'https://example.com/photo2.jpg',
        latitude: -6.2100,
        longitude: 106.8470,
        status: 'in_progress' as const,
        created_at: laterTime
      })
      .execute();

    const reports = await getUserReports(userId);

    expect(reports).toHaveLength(2);
    
    // Reports should be ordered by created_at desc (newest first)
    expect(reports[0].reporter_name).toEqual('Jane Smith');
    expect(reports[1].reporter_name).toEqual('John Doe');
    
    // Verify all fields are present and correct
    expect(reports[0].user_id).toEqual(userId);
    expect(reports[0].reporter_phone).toEqual('08987654321');
    expect(reports[0].damage_description).toEqual('Cracked pavement');
    expect(reports[0].latitude).toEqual(-6.2100);
    expect(reports[0].longitude).toEqual(106.8470);
    expect(reports[0].status).toEqual('in_progress');
    expect(reports[0].created_at).toBeInstanceOf(Date);
    expect(reports[0].updated_at).toBeInstanceOf(Date);
  });

  it('should not return reports from other users', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One',
        provider: 'email'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two',
        provider: 'google'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create reports for both users
    await db.insert(roadDamageReportsTable)
      .values([
        {
          user_id: user1Id,
          reporter_name: 'User One Report',
          reporter_phone: '08111111111',
          reporter_address: 'Address 1',
          report_date: new Date(),
          photo_url: 'https://example.com/photo1.jpg',
          latitude: -6.2088,
          longitude: 106.8456
        },
        {
          user_id: user2Id,
          reporter_name: 'User Two Report',
          reporter_phone: '08222222222',
          reporter_address: 'Address 2',
          report_date: new Date(),
          photo_url: 'https://example.com/photo2.jpg',
          latitude: -6.2100,
          longitude: 106.8470
        }
      ])
      .execute();

    // Get reports for user1 only
    const user1Reports = await getUserReports(user1Id);
    
    expect(user1Reports).toHaveLength(1);
    expect(user1Reports[0].reporter_name).toEqual('User One Report');
    expect(user1Reports[0].user_id).toEqual(user1Id);
  });

  it('should handle user with different report statuses', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create reports with different statuses
    const reportStatuses = ['pending', 'in_progress', 'resolved', 'rejected'] as const;
    
    const reportsData = reportStatuses.map((status, index) => ({
      user_id: userId,
      reporter_name: `Reporter ${index + 1}`,
      reporter_phone: `0812345678${index}`,
      reporter_address: `Address ${index + 1}`,
      report_date: new Date(),
      damage_description: `Damage ${index + 1}`,
      photo_url: `https://example.com/photo${index + 1}.jpg`,
      latitude: -6.2088 + (index * 0.001),
      longitude: 106.8456 + (index * 0.001),
      status
    }));

    await db.insert(roadDamageReportsTable)
      .values(reportsData)
      .execute();

    const reports = await getUserReports(userId);

    expect(reports).toHaveLength(4);
    
    // Verify all status types are present
    const statuses = reports.map(r => r.status).sort();
    expect(statuses).toEqual(['in_progress', 'pending', 'rejected', 'resolved']);
  });

  it('should handle nonexistent user gracefully', async () => {
    const nonexistentUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    
    const reports = await getUserReports(nonexistentUserId);
    expect(reports).toEqual([]);
  });
});