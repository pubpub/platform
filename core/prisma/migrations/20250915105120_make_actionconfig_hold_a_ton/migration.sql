-- Update rules table to wrap non-null config in ruleConfig
UPDATE
    "rules"
SET
    "config" = jsonb_build_object('ruleConfig', "config")
WHERE
    "config" IS NOT NULL;

