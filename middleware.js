import { NextResponse } from "next/server";

export function middleware(request) {
    if (request.nextUrl.pathname === request.nextUrl.pathname.toLocaleLowerCase())
        return NextResponse.next();
    return NextResponse.redirect(`${request.nextUrl.origin}${request.nextUrl.pathname.toLocaleLowerCase()}${request.nextUrl.search}`);
}
