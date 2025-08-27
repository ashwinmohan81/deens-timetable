import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgdisihqmdbhxzpquilu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZGlzaWhxbWRiaHh6cHF1aWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTgwMjQsImV4cCI6MjA3MTg3NDAyNH0.U3Ez3KfoXKS1X9mi3TeinxT5E_3mSyvxquOXdKV_6GA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
