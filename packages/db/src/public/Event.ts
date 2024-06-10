import { z } from 'zod';

/** Represents the enum public.Event */
enum Event {
  pubEnteredStage = 'pubEnteredStage',
  pubLeftStage = 'pubLeftStage',
  pubInStageForDuration = 'pubInStageForDuration',
};

export default Event;

/** Zod schema for Event */
export const eventSchema = z.enum([
  'pubEnteredStage',
  'pubLeftStage',
  'pubInStageForDuration',
]);