-- generator-version: 1.0.0

-- Model users comments



-- Model sessions comments



-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments



-- Model pub_types comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model action_claim comments



-- Model action_move comments



-- Model members comments



-- Model member_groups comments



-- Model permissions comments



-- Model integrations comments



-- Model integration_instances comments



-- Model IntegrationInstanceState comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_elements comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model form_to_permissions comments

