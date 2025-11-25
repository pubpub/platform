# Automations Migration Validation Rubric

This document provides SQL queries to validate the success of the automations database migration.

## 1. Count Checks

### 1.1 Verify all action_instances have an automationId

```sql
SELECT COUNT(*) as orphaned_action_instances
FROM action_instances
WHERE "automationId" IS NULL;
```

**Expected**: 0

### 1.2 Verify all action_runs have an automationRunId (where they had an actionInstanceId)

```sql
SELECT COUNT(*) as orphaned_action_runs
FROM action_runs
WHERE "actionInstanceId" IS NOT NULL
  AND "automationRunId" IS NULL;
```

**Expected**: 0

### 1.3 Verify all automations have a communityId

```sql
SELECT COUNT(*) as orphaned_automations
FROM automations
WHERE "communityId" IS NULL;
```

**Expected**: 0

### 1.4 Verify all automations have a name

```sql
SELECT COUNT(*) as nameless_automations
FROM automations
WHERE name IS NULL OR name = '';
```

**Expected**: 0

### 1.5 Verify AutomationRun count matches action_runs with actionInstanceId

```sql
SELECT
    (SELECT COUNT(*) FROM action_runs WHERE "actionInstanceId" IS NOT NULL) as action_runs_with_instance,
    (SELECT COUNT(*) FROM "AutomationRun") as automation_runs,
    (SELECT COUNT(*) FROM action_runs WHERE "actionInstanceId" IS NOT NULL) - (SELECT COUNT(*) FROM "AutomationRun") as difference;
```

**Expected**: difference should be 0

## 2. Relationship Checks

### 2.1 Verify all action_instances reference valid automations

```sql
SELECT COUNT(*) as invalid_automation_references
FROM action_instances ai
LEFT JOIN automations a ON a.id = ai."automationId"
WHERE a.id IS NULL;
```

**Expected**: 0

### 2.2 Verify all action_runs reference valid automation_runs

```sql
SELECT COUNT(*) as invalid_automation_run_references
FROM action_runs ar
LEFT JOIN "AutomationRun" arun ON arun.id = ar."automationRunId"
WHERE ar."automationRunId" IS NOT NULL
  AND arun.id IS NULL;
```

**Expected**: 0

### 2.3 Verify all AutomationRuns reference valid automations

```sql
SELECT COUNT(*) as invalid_automation_references_from_runs
FROM "AutomationRun" arun
LEFT JOIN automations a ON a.id = arun."automationId"
WHERE a.id IS NULL;
```

**Expected**: 0

### 2.4 Verify all automations reference valid communities

```sql
SELECT COUNT(*) as invalid_community_references
FROM automations a
LEFT JOIN communities c ON c.id = a."communityId"
WHERE c.id IS NULL;
```

**Expected**: 0

### 2.5 Verify all automations with stageId reference valid stages

```sql
SELECT COUNT(*) as invalid_stage_references
FROM automations a
LEFT JOIN stages s ON s.id = a."stageId"
WHERE a."stageId" IS NOT NULL
  AND s.id IS NULL;
```

**Expected**: 0

## 3. Dummy Automation Checks

### 3.1 Verify exactly one dummy automation per community

```sql
SELECT
    c.id as community_id,
    c.name as community_name,
    COUNT(a.id) as dummy_automation_count
FROM communities c
LEFT JOIN automations a ON a."communityId" = c.id
    AND a."stageId" IS NULL
    AND a.name = 'Deleted Automations'
GROUP BY c.id, c.name
HAVING COUNT(a.id) != 1;
```

**Expected**: No rows (each community should have exactly 1 dummy automation)

### 3.2 Verify dummy automations have correct properties

```sql
SELECT
    a.id,
    a.name,
    a."stageId",
    a."communityId",
    array_length(a.events, 1) as events_count,
    c.name as community_name
FROM automations a
INNER JOIN communities c ON c.id = a."communityId"
WHERE a.name = 'Deleted Automations'
  AND (
    a."stageId" IS NOT NULL
    OR array_length(a.events, 1) IS NOT NULL
  );
```

**Expected**: No rows (dummy automations should have null stageId and empty events array)

### 3.3 Verify unique constraint on null stageId per community

```sql
SELECT "communityId", COUNT(*) as null_stage_count
FROM automations
WHERE "stageId" IS NULL
GROUP BY "communityId"
HAVING COUNT(*) > 1;
```

**Expected**: No rows

## 4. Data Integrity Checks

### 4.1 Verify automations with 'manual' event exist

```sql
SELECT COUNT(*) as manual_automations
FROM automations
WHERE 'manual' = ANY(events);
```

**Expected**: > 0 (should have at least some manually-triggered automations)

### 4.2 Verify action_instance names were migrated to automations

```sql
-- this checks if there are any automations without action instances that have names
-- (they should all have been migrated)
SELECT COUNT(*) as automations_with_action_instances
FROM automations a
WHERE EXISTS (
    SELECT 1 FROM action_instances ai WHERE ai."automationId" = a.id
);
```

**Expected**: Should match or be close to the number of automations minus dummy automations

### 4.3 Verify no orphaned event types in automations.events

```sql
SELECT DISTINCT unnest(events) as event_type
FROM automations
WHERE events IS NOT NULL;
```

**Expected**: Only valid Event enum values: pubEnteredStage, pubLeftStage, pubInStageForDuration, automationSucceeded, automationFailed, webhook, manual

### 4.4 Verify automation_runs are properly linked to dummy automations

```sql
SELECT
    a.name as automation_name,
    a."stageId",
    COUNT(arun.id) as run_count
FROM "AutomationRun" arun
INNER JOIN automations a ON a.id = arun."automationId"
WHERE a.name = 'Deleted Automations'
GROUP BY a.id, a.name, a."stageId";
```

**Expected**: Should show runs linked to dummy automations (legacy runs)

### 4.5 Verify no action_runs are completely orphaned

```sql
SELECT COUNT(*) as completely_orphaned_runs
FROM action_runs ar
WHERE ar."actionInstanceId" IS NULL
  AND ar."automationRunId" IS NULL;
```

**Expected**: Number of action_runs that existed without an actionInstanceId before migration

## 5. Constraint Verification

### 5.1 Test unique constraint on null stageId per community (should fail)

```sql
-- this should fail with a unique constraint violation
INSERT INTO automations (id, name, "communityId", "stageId", events, "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    'Test Duplicate Dummy',
    id,
    NULL,
    ARRAY[]::("Event"[]),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM communities
LIMIT 1;
```

**Expected**: ERROR: duplicate key value violates unique constraint "automations_null_stageId_per_community"

### 5.2 Verify foreign key constraints are in place

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('automations', 'action_instances', 'AutomationRun', 'action_runs')
ORDER BY tc.table_name, tc.constraint_name;
```

**Expected**: Should show:

- action_instances.automationId -> automations.id
- automations.stageId -> stages.id
- automations.communityId -> communities.id
- automations.sourceAutomationId -> automations.id
- AutomationRun.automationId -> automations.id
- AutomationRun.sourceAutomationRunId -> AutomationRun.id
- action_runs.automationRunId -> AutomationRun.id

## 6. Trigger Verification

### 6.1 Verify dummy automation creation trigger exists

```sql
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'create_dummy_automation_after_community_insert';
```

**Expected**: 1 row showing the trigger on communities table

### 6.2 Verify re-parenting trigger exists

```sql
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'reparent_automation_runs_before_automation_delete';
```

**Expected**: 1 row showing the trigger on automations table

### 6.3 Test dummy automation creation trigger (create test community)

```sql
-- create a test community
INSERT INTO communities (id, name, slug, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Test Community', 'test-community-validation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id;

-- verify dummy automation was created
SELECT COUNT(*) as dummy_count
FROM automations
WHERE "communityId" = (SELECT id FROM communities WHERE slug = 'test-community-validation')
  AND "stageId" IS NULL
  AND name = 'Deleted Automations';

-- cleanup
DELETE FROM communities WHERE slug = 'test-community-validation';
```

**Expected**: dummy_count should be 1

### 6.4 Test re-parenting trigger (delete automation and verify runs move)

```sql
-- create test data
WITH test_community AS (
    INSERT INTO communities (id, name, slug, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Test Community 2', 'test-community-validation-2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id
),
test_stage AS (
    INSERT INTO stages (id, name, "order", "communityId", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), 'Test Stage', 'a0', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM test_community
    RETURNING id, "communityId"
),
test_automation AS (
    INSERT INTO automations (id, name, "communityId", "stageId", events, "createdAt", "updatedAt")
    SELECT gen_random_uuid(), 'Test Automation', ts."communityId", ts.id, ARRAY['manual']::"Event"[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM test_stage ts
    RETURNING id, "communityId"
),
test_automation_run AS (
    INSERT INTO "AutomationRun" (id, "automationId", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM test_automation
    RETURNING id, "automationId"
)
SELECT
    ta.id as automation_id,
    tar.id as run_id,
    (SELECT id FROM automations WHERE "communityId" = ta."communityId" AND "stageId" IS NULL AND name = 'Deleted Automations') as dummy_id
FROM test_automation ta, test_automation_run tar;

-- delete the automation and verify run was re-parented
DELETE FROM automations WHERE name = 'Test Automation' AND "communityId" IN (SELECT id FROM communities WHERE slug = 'test-community-validation-2');

SELECT
    arun."automationId",
    a.name as automation_name
FROM "AutomationRun" arun
INNER JOIN automations a ON a.id = arun."automationId"
WHERE a."communityId" IN (SELECT id FROM communities WHERE slug = 'test-community-validation-2')
  AND a.name = 'Deleted Automations';

-- cleanup
DELETE FROM communities WHERE slug = 'test-community-validation-2';
```

**Expected**: The automation_run should be re-parented to the dummy automation

## 7. Summary Query

### 7.1 Overall migration summary

```sql
SELECT
    'Communities' as entity,
    COUNT(*) as count
FROM communities
UNION ALL
SELECT
    'Automations (total)',
    COUNT(*)
FROM automations
UNION ALL
SELECT
    'Automations (dummy)',
    COUNT(*)
FROM automations
WHERE "stageId" IS NULL AND name = 'Deleted Automations'
UNION ALL
SELECT
    'Automations (with manual event)',
    COUNT(*)
FROM automations
WHERE 'manual' = ANY(events)
UNION ALL
SELECT
    'Action Instances',
    COUNT(*)
FROM action_instances
UNION ALL
SELECT
    'Action Runs',
    COUNT(*)
FROM action_runs
UNION ALL
SELECT
    'Automation Runs',
    COUNT(*)
FROM "AutomationRun"
UNION ALL
SELECT
    'Action Runs linked to AutomationRun',
    COUNT(*)
FROM action_runs
WHERE "automationRunId" IS NOT NULL;
```

**Expected**: Summary of all entities with reasonable counts

## Pass Criteria

The migration is considered successful if:

1. All count checks return 0 for orphaned/missing records
2. All relationship checks return 0 for invalid references
3. Each community has exactly 1 dummy automation
4. All dummy automations have null stageId and empty events array
5. The unique constraint on null stageId per community works correctly
6. All expected foreign key constraints exist
7. Both triggers exist and function correctly
8. All action_instances have been properly linked to automations
9. All action_runs have been properly linked to automation_runs
10. No data has been lost during the migration
