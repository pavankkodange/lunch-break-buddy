-- Add comprehensive corporate identity fields to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS autorabit_gst_number TEXT,
ADD COLUMN IF NOT EXISTS autorabit_contact_primary TEXT,
ADD COLUMN IF NOT EXISTS autorabit_contact_secondary TEXT,
ADD COLUMN IF NOT EXISTS autorabit_official_address TEXT,
ADD COLUMN IF NOT EXISTS autorabit_support_hours TEXT;

-- Update existing row with some placeholders if needed
UPDATE company_settings
SET 
    autorabit_gst_number = '27AAAAA0000A1Z5',
    autorabit_contact_primary = '+91 98765 43210',
    autorabit_contact_secondary = '+91 80 1234 5678',
    autorabit_official_address = 'AutoRabit Software Pvt Ltd, Hyderabad, India',
    autorabit_support_hours = '24/7 Priority Support'
WHERE id = 1;
