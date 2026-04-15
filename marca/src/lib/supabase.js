import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mfbsymubromhwljotrca.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYnN5bXVicm9taHdsam90cmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE3NTMsImV4cCI6MjA5MDU1Nzc1M30.Y7pbjwByvOcSHroKSrCDyXZnmjSfxCSavUflvZJCq1U'

export const db = createClient(SUPABASE_URL, SUPABASE_KEY)
export { SUPABASE_URL }
