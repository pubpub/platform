-- Trigger and function for updated User
-- update a row in public."Users" when the email is updated
CREATE OR REPLACE FUNCTION handle_updated_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET email = new.email
  WHERE id = new.id::text;
  RETURN new;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- trigger the function every time a user is updated
DROP TRIGGER IF EXISTS on_user_updated on auth.users;
CREATE TRIGGER on_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_updated_user();