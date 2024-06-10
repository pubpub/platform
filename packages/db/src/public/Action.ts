import { z } from 'zod';

/** Represents the enum public.Action */
enum Action {
  log = 'log',
  pdf = 'pdf',
  email = 'email',
  pushToV6 = 'pushToV6',
  move = 'move',
};

export default Action;

/** Zod schema for Action */
export const actionSchema = z.enum([
  'log',
  'pdf',
  'email',
  'pushToV6',
  'move',
]);