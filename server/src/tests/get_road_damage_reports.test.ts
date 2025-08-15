import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, roadDamageReportsTable } from '../db/schema';
import { type GetReportsQuery, type CreateUserInput } from '../schema';
import { getRoadDamageReports } from '../handlers/get_road_damage_reports';

// Test data setup
const testUser1: CreateUserInput = {
  email: 'user1@example.com',
  name: 'Test User 1',
  avatar_url: null,
  provider: 'email',
};

const testUser2: CreateUserInput = {
  email: 'user2@example.com',
  name: 'Test User 2',
  avatar_url: null,
  provider: 'email',
};

describe('getRoadDamageReports', () => {
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const user1Result = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();
    user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();
    user2Id = user2Result[0].id;

    // Create test reports
    await db.insert(roadDamageReportsTable)
      .values([
        {
          user_id: user1Id,
          reporter_name: 'John Doe',
          reporter_phone: '081234567890',
          reporter_address: 'Jl. Sudirman No. 1, Jakarta',
          report_date: new Date('2024-01-15'),
          damage_description: 'Lubang besar di tengah jalan',
          photo_url: 'https://example.com/photo1.jpg',
          latitude: -6.2088,
          longitude: 106.8456,
          status: 'pending',
          created_at: new Date('2024-01-15T10:00:00Z'),
        },
        {
          user_id: user1Id,
          reporter_name: 'Jane Smith',
          reporter_phone: '081234567891',
          reporter_address: 'Jl. Thamrin No. 5, Jakarta',
          report_date: new Date('2024-01-16'),
          damage_description: 'Jalan retak-retak',
          photo_url: 'https://example.com/photo2.jpg',
          latitude: -6.1951,
          longitude: 106.8211,
          status: 'in_progress',
          created_at: new Date('2024-01-16T10:00:00Z'),
        },
        {
          user_id: user2Id,
          reporter_name: 'Bob Johnson',
          reporter_phone: '081234567892',
          reporter_address: 'Jl. Gatot Subroto No. 10, Jakarta',
          report_date: new Date('2024-01-17'),
          damage_description: null,
          photo_url: 'https://example.com/photo3.jpg',
          latitude: -6.2297,
          longitude: 106.8253,
          status: 'resolved',
          created_at: new Date('2024-01-17T10:00:00Z'),
        },
        {
          user_id: user2Id,
          reporter_name: 'Alice Brown',
          reporter_phone: '081234567893',
          reporter_address: 'Jl. Kuningan No. 15, Jakarta',
          report_date: new Date('2024-01-18'),
          damage_description: 'Jalan berlubang kecil',
          photo_url: 'https://example.com/photo4.jpg',
          latitude: -6.2378,
          longitude: 106.8308,
          status: 'rejected',
          created_at: new Date('2024-01-18T10:00:00Z'),
        },
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all reports without filters', async () => {
    const query: GetReportsQuery = {};
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(4);
    expect(results[0].reporter_name).toBeDefined();
    expect(results[0].user_id).toBeDefined();
    expect(typeof results[0].latitude).toBe('number');
    expect(typeof results[0].longitude).toBe('number');
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter reports by status', async () => {
    const query: GetReportsQuery = {
      status: 'pending',
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(1);
    expect(results[0].status).toEqual('pending');
    expect(results[0].reporter_name).toEqual('John Doe');
  });

  it('should filter reports by user_id', async () => {
    const query: GetReportsQuery = {
      user_id: user1Id,
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.user_id === user1Id)).toBe(true);
    expect(results.map(r => r.reporter_name)).toContain('John Doe');
    expect(results.map(r => r.reporter_name)).toContain('Jane Smith');
  });

  it('should apply pagination with limit and offset', async () => {
    const queryPage1: GetReportsQuery = {
      limit: 2,
      offset: 0,
    };
    const resultsPage1 = await getRoadDamageReports(queryPage1);

    expect(resultsPage1).toHaveLength(2);

    const queryPage2: GetReportsQuery = {
      limit: 2,
      offset: 2,
    };
    const resultsPage2 = await getRoadDamageReports(queryPage2);

    expect(resultsPage2).toHaveLength(2);

    // Ensure no overlap between pages
    const page1Ids = resultsPage1.map(r => r.id);
    const page2Ids = resultsPage2.map(r => r.id);
    expect(page1Ids.every(id => !page2Ids.includes(id))).toBe(true);
  });

  it('should filter by location within radius', async () => {
    // Search around Jakarta center (-6.2088, 106.8456) with 5km radius
    const query: GetReportsQuery = {
      latitude: -6.2088,
      longitude: 106.8456,
      radius_km: 5,
    };
    const results = await getRoadDamageReports(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(4);
    
    // All results should have valid coordinates
    results.forEach(report => {
      expect(typeof report.latitude).toBe('number');
      expect(typeof report.longitude).toBe('number');
      expect(report.latitude).toBeGreaterThan(-90);
      expect(report.latitude).toBeLessThan(90);
      expect(report.longitude).toBeGreaterThan(-180);
      expect(report.longitude).toBeLessThan(180);
    });
  });

  it('should combine multiple filters', async () => {
    const query: GetReportsQuery = {
      status: 'in_progress',
      user_id: user1Id,
      limit: 10,
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(1);
    expect(results[0].status).toEqual('in_progress');
    expect(results[0].user_id).toEqual(user1Id);
    expect(results[0].reporter_name).toEqual('Jane Smith');
  });

  it('should return empty array when no reports match filters', async () => {
    const query: GetReportsQuery = {
      status: 'pending',
      user_id: user2Id, // user2Id has no pending reports
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(0);
  });

  it('should order results by created_at descending', async () => {
    const query: GetReportsQuery = {};
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(4);
    
    // Check if results are ordered by created_at descending
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
    }
  });

  it('should handle location search with no results', async () => {
    // Search in a location far from Jakarta (e.g., Bali coordinates)
    const query: GetReportsQuery = {
      latitude: -8.3405,
      longitude: 115.0920,
      radius_km: 1, // Small radius
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(0);
  });

  it('should handle null damage_description correctly', async () => {
    const query: GetReportsQuery = {
      status: 'resolved',
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(1);
    expect(results[0].damage_description).toBeNull();
    expect(results[0].reporter_name).toEqual('Bob Johnson');
  });

  it('should convert numeric coordinates correctly', async () => {
    const query: GetReportsQuery = {
      limit: 1,
    };
    const results = await getRoadDamageReports(query);

    expect(results).toHaveLength(1);
    const report = results[0];
    
    // Verify coordinates are numbers, not strings
    expect(typeof report.latitude).toBe('number');
    expect(typeof report.longitude).toBe('number');
    
    // Since results are ordered by created_at descending, we get the newest report first
    // Alice Brown was inserted last, so her coordinates should be first
    expect(report.latitude).toBeCloseTo(-6.2378, 4); 
    expect(report.longitude).toBeCloseTo(106.8308, 4);
    expect(report.reporter_name).toEqual('Alice Brown');
  });
});