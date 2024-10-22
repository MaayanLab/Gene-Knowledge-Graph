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
        border_color?: string,
        ring_label?: string,
    }>,
    edges: Array<{
        match: Array<string>,
        selected?: boolean,
        templates?: {
            multiple?: string,
            singular?: string
        },
        edge_suffix?: string,
        display: Array<{
            label: string,
            text: string,
            type: string,
            href?:string,
        }>,
        hidden?: boolean,
        color?: string,
        order?: Array<string>,
        directed?: string
    }>,
    header: {
        title: string,
        header?: string,
        divider?: boolean,
        fullWidth?:boolean,
        counterTop?: boolean,
        counter?: boolean,
        icon: {
            src: string,
            favicon: string,
            faviconTitle?: string,
            alt: string,
            width: number,
            height: number,
            avatar?: boolean
        },
        tabs: Array<{
            endpoint: string,
            label: string,
            component: string,
            position?: string,
            props?: {
                subheader?: {
                    url_field: string,
                    query_field: string,
                },
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
            href?: string
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
                    [key:string]: string|number|boolean
                }
            }
        >>,
        footer_text?: string
    }
}

/**
 * @swagger
 * /api/schema:
 *   get:
 *     description: Returns the schema
 *     responses:
 *       200:
 *         description: UI Schema
 */
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