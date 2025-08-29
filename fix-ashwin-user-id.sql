-- Fix Ashwin's manual_user_id to Ash_Moh
-- Update the specific teacher record for ashwin.mohan.81@gmail.com

UPDATE teachers 
SET manual_user_id = 'Ash_Moh'
WHERE email = 'ashwin.mohan.81@gmail.com';

-- Verify the change
SELECT id, email, manual_user_id, user_id 
FROM teachers 
WHERE email = 'ashwin.mohan.81@gmail.com';

-- Show all teachers to confirm
SELECT id, email, manual_user_id, user_id FROM teachers ORDER BY email;
