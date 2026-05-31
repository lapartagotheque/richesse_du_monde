import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { username, password } = await request.json()

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, message: 'Identifiants incorrects' }, { status: 401 })
  }

  return NextResponse.json({ success: true, user: data })
}