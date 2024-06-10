import { z } from 'zod';

/** Represents the enum public.ActionRunStatus */
enum ActionRunStatus {
  success = 'success',
  failure = 'failure',
  scheduled = 'scheduled',
};

export default ActionRunStatus;

/** Zod schema for ActionRunStatus */
export const actionRunStatusSchema = z.enum([
  'success',
  'failure',
  'scheduled',
]);