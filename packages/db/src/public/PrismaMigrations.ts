import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public._prisma_migrations */
export type PrismaMigrationsId = string & { __brand: 'PrismaMigrationsId' };

/** Represents the table public._prisma_migrations */
export default interface PrismaMigrationsTable {
  id: ColumnType<PrismaMigrationsId, PrismaMigrationsId, PrismaMigrationsId>;

  checksum: ColumnType<string, string, string>;

  finished_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  migration_name: ColumnType<string, string, string>;

  logs: ColumnType<string | null, string | null, string | null>;

  rolled_back_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  started_at: ColumnType<Date, Date | string | undefined, Date | string>;

  applied_steps_count: ColumnType<number, number | undefined, number>;
}

export type PrismaMigrations = Selectable<PrismaMigrationsTable>;

export type NewPrismaMigrations = Insertable<PrismaMigrationsTable>;

export type PrismaMigrationsUpdate = Updateable<PrismaMigrationsTable>;

export const prismaMigrationsIdSchema = z.string() as unknown as z.Schema<PrismaMigrationsId>;

export const prismaMigrationsSchema = z.object({
  id: prismaMigrationsId,
  checksum: z.string(),
  finished_at: z.date().nullable(),
  migration_name: z.string(),
  logs: z.string().nullable(),
  rolled_back_at: z.date().nullable(),
  started_at: z.date(),
  applied_steps_count: z.number(),
}) as unknown as z.Schema<PrismaMigrations>;

export const prismaMigrationsInitializerSchema = z.object({
  id: prismaMigrationsId,
  checksum: z.string(),
  finished_at: z.date().optional().nullable(),
  migration_name: z.string(),
  logs: z.string().optional().nullable(),
  rolled_back_at: z.date().optional().nullable(),
  started_at: z.date().optional(),
  applied_steps_count: z.number().optional(),
}) as unknown as z.Schema<NewPrismaMigrations>;

export const prismaMigrationsMutatorSchema = z.object({
  id: prismaMigrationsId.optional(),
  checksum: z.string().optional(),
  finished_at: z.date().optional().nullable(),
  migration_name: z.string().optional(),
  logs: z.string().optional().nullable(),
  rolled_back_at: z.date().optional().nullable(),
  started_at: z.date().optional(),
  applied_steps_count: z.number().optional(),
}) as unknown as z.Schema<PrismaMigrationsUpdate>;