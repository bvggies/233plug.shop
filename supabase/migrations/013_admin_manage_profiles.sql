-- Allow all admins (admin, staff, super_admin) to update any profile for user management
DROP POLICY IF EXISTS "Super admin can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (is_admin());
