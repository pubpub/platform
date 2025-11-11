-- migrate docUrl to folderUrl and remove outputField in googleDriveImport action configs
UPDATE
    action_instances
SET
    config =(config::jsonb - 'docUrl' - 'outputField' || jsonb_build_object('folderUrl', config::jsonb -> 'docUrl'))::json
WHERE
    action = 'googleDriveImport'
    AND config IS NOT NULL
    AND config::jsonb ? 'docUrl';

UPDATE
    action_config_defaults
SET
    config =(config::jsonb - 'docUrl' - 'outputField' || jsonb_build_object('folderUrl', config::jsonb -> 'docUrl'))::json
WHERE
    action = 'googleDriveImport'
    AND config IS NOT NULL
    AND config::jsonb ? 'docUrl';

