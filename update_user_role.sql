-- To change a user's role to 'ADMIN', execute the following SQL command.
-- Replace 'user@example.com' with the email address of the user you want to grant admin privileges to.

UPDATE users
SET role = 'ADMIN'
WHERE email = 'user@example.com';