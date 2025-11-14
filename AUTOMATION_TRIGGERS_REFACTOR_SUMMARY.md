# Automation Triggers Refactor Summary

## Schema Changes

### Old Structure
- `automations` table had:
  - `events`: `AutomationEvent[]` array
  - `config`: JSON containing event-specific configs
  - `sourceAutomationId`: single reference for chaining
  
### New Structure
- `automations` table now has:
  - `id`, `name`, `description`, `communityId`, `stageId`, `createdAt`, `updatedAt`
  - No `events`, `config`, or `sourceAutomationId` columns
  
- `automation_triggers` table (new):
  - `id`, `automationId`, `event`, `config`, `sourceAutomationId`, `createdAt`, `updatedAt`
  - Each trigger is one event type
  - Allows multiple triggers per automation
  - Each trigger can have its own source automation (for chaining)

## Migration Files Updated

1. **`20251113141715_to_automations/migration.sql`** ✅
   - Creates `automation_triggers` table
   - Migrates existing automations to use triggers
   - Creates manual triggers for all existing action instances

2. **`20251112184000_add_automation_aware_triggers/migration.sql`** ✅
   - Updated to query `automation_triggers` instead of `events` array
   - Joins `automation_triggers` to find automations with matching events

3. **`20251113190000_add_automation_run_triggers/migration.sql`** ✅
   - Updated to query `automation_triggers.sourceAutomationId` for chaining
   - Joins `automation_triggers` to find watching automations

## Code Files That Need Updates

### 1. `/core/lib/db/queries.ts` ✅
- `getAutomationBase` function updated to:
  - Select `triggers` array instead of `events`
  - Remove `sourceAutomationId` and `config` from automations select
  - Filter by checking existence in `automation_triggers` table

### 2. `/core/lib/server/automations.ts` ⚠️ NEEDS UPDATE
- `upsertAutomation` function needs major refactor:
  - Remove `events` and `config` from automation insert
  - Add logic to upsert `automation_triggers`
  - Update `wouldCreateCycle` to check `automation_triggers.sourceAutomationId` instead of `automations.sourceActionInstanceId`
  
- Type definitions need updates:
  - `AutomationUpsertProps` should accept triggers instead of config
  - Remove references to `sourceActionInstanceId`

###3. `/core/app/c/[communitySlug]/stages/manage/actions.ts` ⚠️ NEEDS UPDATE
- `addOrUpdateAutomation` server action needs to:
  - Accept new schema with `name`, `events` array, `sourceAutomationId` for each chaining event
  - Transform the data to create/update automation + triggers
  - Call updated `upsertAutomationWithCycleCheck`

### 4. `/core/app/c/[communitySlug]/stages/manage/components/panel/actionsTab/StagePanelAutomationForm.tsx` ⚠️ PARTIALLY UPDATED
- Schema already updated to accept multiple events
- Needs to handle `sourceAutomationId` per trigger (not per automation)
- Form submission needs to structure data correctly for new backend API

## UI Changes Needed

The UI currently shows:
- Multiple events can be selected
- One `sourceAutomationId` field for chaining events

But with the new model, each chaining event trigger could theoretically watch a different automation. The UI should either:
1. Keep it simple: all chaining events watch the same source automation (current approach)
2. Allow per-trigger source configuration (more complex UI)

**Recommendation**: Keep it simple for now (option 1), but the database structure supports option 2 for future enhancement.

## Implementation Plan

1. ✅ Update migration SQL files
2. ✅ Update database triggers  
3. ✅ Update `queries.ts` to read new structure
4. ⚠️ Update `automations.ts` server-side logic
5. ⚠️ Update server actions in `stages/manage/actions.ts`
6. ⚠️ Update frontend form to submit correct structure
7. ⚠️ Test end-to-end automation creation/editing

## Breaking Changes

- Any code that reads `automation.events`, `automation.config`, or `automation.sourceAutomationId` will break
- Need to read from `automation.triggers` array instead
- Each trigger has its own `event`, `config`, and `sourceAutomationId`

