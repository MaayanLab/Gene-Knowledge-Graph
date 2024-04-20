import { getApiDocs } from '@/utils/swagger';
import { NextResponse } from 'next/server';


export async function GET() {
	const specs = await getApiDocs()
	console.log(specs)
    return NextResponse.json(specs, {status: 200})
}
