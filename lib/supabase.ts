import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shqackwkrnerwvwfphui.supabase.co';
const supabaseAnonKey = 'sb_publishable_2prlyludx0s2S32DG5CKmQ_wQG9qAKK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);