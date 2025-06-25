-- For all new pub memberships that specify a form, make sure that the form's pub type is the same
-- as the pub's pub type
CREATE OR REPLACE FUNCTION check_pub_membership_pubtype_agreement () RETURNS TRIGGER AS $$
    DECLARE
        pub_pub_type RECORD;
        form_pub_type RECORD;
    BEGIN
        IF (NEW."formId" IS NULL) THEN
            RETURN NEW;
        END IF;

        SELECT pt.id, pt.name INTO pub_pub_type
        FROM pubs JOIN pub_types pt ON pt.id = pubs."pubTypeId"
        WHERE pubs.id = NEW."pubId";

        SELECT pt.id, pt.name INTO form_pub_type
        FROM forms JOIN pub_types pt ON pt.id = forms."pubTypeId"
        WHERE forms.id = NEW."formId";

        IF (pub_pub_type.id != form_pub_type.id) THEN
            RAISE EXCEPTION 'Pub membership creation failed. The specified form is for % pubs but this pub''s type is %', form_pub_type.name, pub_pub_type.name;
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pub_membership_pubtype_agreement
AFTER INSERT ON "pub_memberships" FOR EACH ROW
EXECUTE FUNCTION check_pub_membership_pubtype_agreement ();

-- For all new invites that create a pub membership with a form, make sure that the form's pub type
-- is the same as the pub's pub type The above trigger would also fire in this situation, but not
-- until the user claims the invite. This error message is intended for an admin, so we use an
-- additional trigger to raise it when the invite is created
CREATE OR REPLACE FUNCTION check_invite_pubtype_agreement () RETURNS TRIGGER AS $$
    DECLARE
        pub_pub_type RECORD;
        form_pub_type RECORD;
    BEGIN
        IF (NEW.type != 'pub') THEN
            RETURN NEW;
        END IF;

        SELECT pt.id, pt.name INTO pub_pub_type FROM invites
        JOIN pubs ON invites."pubId" = pubs.id
        JOIN pub_types pt ON pt.id = pubs."pubTypeId"
        WHERE invites.id = NEW."inviteId";

        SELECT pt.id, pt.name INTO form_pub_type
        FROM forms JOIN pub_types pt ON pt.id = forms."pubTypeId"
        WHERE forms.id = NEW."formId";

        IF (pub_pub_type.id != form_pub_type.id) THEN
            RAISE EXCEPTION 'Invitation failed. The specified form is for % pubs but this pub''s type is %', form_pub_type.name, pub_pub_type.name;
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_invite_pubtype_agreement
AFTER INSERT ON "invite_forms" FOR EACH ROW
EXECUTE FUNCTION check_invite_pubtype_agreement ();