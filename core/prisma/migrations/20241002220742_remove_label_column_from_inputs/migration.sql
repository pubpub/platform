-- Move existing labels into the config object
UPDATE "form_elements"
  SET config = jsonb_build_object('label', "form_elements"."label")
  WHERE component != 'checkbox'::"InputComponent" AND type = 'pubfield'::"ElementType";
UPDATE "form_elements"
  SET config = jsonb_build_object('groupLabel', "form_elements"."label")
  WHERE component = 'checkbox'::"InputComponent" AND type = 'pubfield'::"ElementType";
