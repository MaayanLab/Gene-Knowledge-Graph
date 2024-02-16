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
        color?: string,
        order?: Array<string>
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
        gene_link: Boolean,
        color?: string,
        order?: Array<string>
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
    footer: {
        style?: {
            [key: string]: string | number
        },
        layout: Array<Array<
            {
                component: string,
                props?: {
                    [key:string]: string|number
                }
            }
        >>
    }
}

export async function GET() {
    const cached = cache.get("schema")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const schema = await fetch_kg_schema()
        cache.put("schema", schema, 10000);
        return NextResponse.json(schema, {status: 200})
    }
    // const schema = await fetch_kg_schema()
    //     // cache.put("schemaz", schema, 10000);
    // return NextResponse.json(schema, {status: 200})
}