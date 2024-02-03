import cache from "memory-cache";
import { fetch_kg_schema } from "@/utils/initialize"
import { NextResponse } from "next/server";

export interface UISchema {
    nodes: Array<{
        node: string,
        example?: Array<string>,
        relation?: Array<string>,
        display: Array<{
            label: string,
            text: string,
            type: string
        }>,
        search?: Array<string>,
        color?: string
    }>,
    edges: Array<{
        match: Array<string>,
        selected?: Boolean,
        templates?: {
            multiple?: string,
            singular?: string
        },
        display: Array<{
            label: string,
            text: string,
            type: string
        }>,
        gene_link: Boolean
    }>,
    header: {
        title: string,
        icon: {
            src: string,
            favicon: string,
            faviconTitle: string,
            alt: string,
            width: number,
            height: number,
        },
        tabs: Array<{
            endpoint: string,
            label: string,
            type: string,
            component: string,
            position?: 'top' | 'bottom',
            props?: {
                [key: string]: any
            }
        }>,
        subheader?: Array<{
            label: string,
            icon: string,
            height: number,
            width: number,
            props: {
                [key: string]: any
            },
            href: string
        }>
    },
    ui_theme?: string,
}

export async function GET() {
    const cached = cache.get("schema3")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const schema = await fetch_kg_schema()
        cache.put("schema3", schema);
        return NextResponse.json(schema, {status: 200})
    }
}