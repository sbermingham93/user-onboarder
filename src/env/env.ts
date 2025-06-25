import * as dotenv from 'dotenv'

// config .env
dotenv.config()

export const OPEN_AI_KEY = process.env.OPEN_AI_KEY
export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY