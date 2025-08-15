import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createRoadDamageReportInputSchema,
  updateRoadDamageReportInputSchema,
  getReportsQuerySchema,
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createRoadDamageReport } from './handlers/create_road_damage_report';
import { getRoadDamageReports } from './handlers/get_road_damage_reports';
import { getRoadDamageReportById } from './handlers/get_road_damage_report_by_id';
import { updateRoadDamageReport } from './handlers/update_road_damage_report';
import { getUserReports } from './handlers/get_user_reports';
import { uploadPhoto } from './handlers/upload_photo';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Road damage report routes
  createRoadDamageReport: publicProcedure
    .input(createRoadDamageReportInputSchema.extend({
      user_id: z.string(), // Add user_id for authentication context
    }))
    .mutation(({ input }) => {
      const { user_id, ...reportInput } = input;
      return createRoadDamageReport(reportInput, user_id);
    }),

  getRoadDamageReports: publicProcedure
    .input(getReportsQuerySchema)
    .query(({ input }) => getRoadDamageReports(input)),

  getRoadDamageReportById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getRoadDamageReportById(input.id)),

  updateRoadDamageReport: publicProcedure
    .input(updateRoadDamageReportInputSchema)
    .mutation(({ input }) => updateRoadDamageReport(input)),

  getUserReports: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserReports(input.userId)),

  // Photo upload route (placeholder - would need multipart handling in real implementation)
  uploadPhoto: publicProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      // Note: In real implementation, this would handle multipart form data
      // This is a simplified version for the schema
    }))
    .mutation(({ input }) => {
      // Placeholder implementation - real version would extract file from request
      return uploadPhoto({
        file: Buffer.from('placeholder'),
        fileName: input.fileName,
        mimeType: input.mimeType,
      });
    }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors({
        origin: true, // Allow all origins for development
        credentials: true,
      })(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`🚧 JalanMa TRPC server listening at port: ${port}`);
  console.log(`📍 Road damage reporting API is ready!`);
}

start();