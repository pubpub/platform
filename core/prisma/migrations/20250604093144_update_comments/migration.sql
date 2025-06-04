-- generator-version: 1.0.0

-- Model invites_history comments



-- Model pub_values_history comments



-- Model users comments

COMMENT ON COLUMN "users"."isProvisional" IS 'Indicates whether a user is provisional, meaning they were added through an invite and need to accept it to become a full user';


-- Model sessions comments

COMMENT ON COLUMN "sessions"."type" IS 'With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page.';


-- Model auth_tokens comments



-- Model communities comments



-- Model pubs comments



-- Model pub_fields comments



-- Model PubFieldSchema comments

COMMENT ON COLUMN "PubFieldSchema"."schema" IS '@type(JSONSchemaType<any>, ''ajv'', true, false, true)';


-- Model pub_values comments

COMMENT ON COLUMN "pub_values"."lastModifiedBy" IS '@type(LastModifiedBy, ''../types'', true, false, true)';


-- Model pub_types comments



-- Model _PubFieldToPubType comments



-- Model stages comments



-- Model PubsInStages comments



-- Model move_constraint comments



-- Model member_groups comments



-- Model community_memberships comments



-- Model pub_memberships comments



-- Model stage_memberships comments



-- Model action_instances comments



-- Model action_runs comments



-- Model rules comments



-- Model forms comments



-- Model form_inputs comments



-- Model form_structural_elements comments



-- Model form_buttons comments



-- Model api_access_tokens comments



-- Model api_access_logs comments



-- Model api_access_permissions comments

COMMENT ON COLUMN "api_access_permissions"."constraints" IS '@type(ApiAccessPermissionConstraints, ''../types'', true, false, true)';


-- Model membership_capabilities comments



-- Model invites comments

COMMENT ON COLUMN "invites"."lastModifiedBy" IS '@type(LastModifiedBy, ''../types'', true, false, true)';


-- Model invite_forms comments



-- Enum AuthTokenType comments

COMMENT ON TYPE "AuthTokenType" IS '@property generic - For most use-cases. This will just authenticate you with a regular session.
@property passwordReset - For resetting your password only
@property signup - For signing up, but also when you''re invited to a community
@property verifyEmail - For verifying your email address';


-- Enum CoreSchemaType comments




-- Enum OperationType comments




-- Enum MemberRole comments




-- Enum Action comments




-- Enum ActionRunStatus comments




-- Enum Event comments




-- Enum FormAccessType comments




-- Enum StructuralFormElement comments




-- Enum InputComponent comments




-- Enum ApiAccessType comments




-- Enum ApiAccessScope comments




-- Enum Capabilities comments




-- Enum MembershipType comments




-- Enum InviteStatus comments

COMMENT ON TYPE "InviteStatus" IS 'Status of an invite
@property created - The invite has been created, but not yet sent
@property pending - The invite has been sent, but not yet accepted
@property accepted - The invite has been accepted, but the relevant signup step has not been completed
@property completed - The invite has been accepted, and the relevant signup step has been completed
@property rejected - The invite has been rejected
@property revoked - The invite has been revoked by the user who created it, or by a sufficient authority';
