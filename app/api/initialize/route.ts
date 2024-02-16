import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import cache from "memory-cache";
import fetch from "node-fetch";
import { default_color } from "@/utils/colors";
import { NextResponse } from "next/server";
import { fetch_kg_schema } from "@/utils/initialize";
import {initialize} from './helper'

export interface Initialize_Type {
    aggr_scores?: {[key:string]: {max: number, min: number}},
    colors?: {[key:string]: {color?: string, aggr_field?: string, field?: string, aggr_type?: string}},
    edges?: Array<string>
}

export async function GET() {
    const cached = cache.get("initialize")
    // const cached = false
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        try {
            const val = await initialize()
            cache.put("initialize", val);
            return NextResponse.json(val, {status: 200})
        } catch (error) {
            console.log(error)
            return NextResponse.error()
        }
    }
}

