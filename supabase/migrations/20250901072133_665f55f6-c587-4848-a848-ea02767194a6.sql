-- Update OTP expiry time to 15 minutes (900 seconds)
UPDATE auth.config 
SET value = '900' 
WHERE parameter = 'OTP_EXPIRY';