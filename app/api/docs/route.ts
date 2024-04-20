import { getApiDocs } from '@/utils/swagger';
import { NextResponse } from 'next/server';


export async function GET() {
	const spec = await getApiDocs()
    return NextResponse.json(spec, {status: 200})
}
