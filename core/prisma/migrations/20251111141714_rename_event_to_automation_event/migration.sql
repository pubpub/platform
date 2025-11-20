/*
 Warnings:

 - The `Event` enum type is being renamed to `AutomationEvent` to avoid conflicts with DOM Event type
 - The value `manual` is being added to the `AutomationEvent` enum
 */
-- this needs to be separate from the next migration bc you cannot update and use a new enum value in the same transaction
-- Step 1: Rename the Event enum to AutomationEvent
ALTER TYPE "Event" RENAME TO "AutomationEvent";

-- Step 2: Rename the actionSucceeded value to automationSucceeded
ALTER TYPE "AutomationEvent" RENAME VALUE 'actionSucceeded' TO 'automationSucceeded';

-- Step 3: Rename the actionFailed value to automationFailed
ALTER TYPE "AutomationEvent" RENAME VALUE 'actionFailed' TO 'automationFailed';

-- Step 2: Add 'manual' value to AutomationEvent enum
ALTER TYPE "AutomationEvent"
    ADD VALUE 'manual';

