// https://nextjs.org/docs/app/api-reference/functions/revalidatePath
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
 
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
 
  if (path) {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, now: Date.now() })
  }
 
  return NextResponse.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing path to revalidate',
  })
}