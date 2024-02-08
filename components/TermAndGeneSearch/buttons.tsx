'use client'
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { process_filter } from "@/utils/helper";
import { Button, Typography } from "@mui/material";
import AddBox from "@mui/icons-material/AddBox";
import IndeterminateCheckBox from "@mui/icons-material/IndeterminateCheckBox";
import { router_push } from "@/utils/client_side";
import { FilterSchema } from "@/utils/helper";
export const StartButton = ({nodes}: {nodes: {[key:string]: {[key:string]: any}}} ) => {
    const router = useRouter()
    return (
        <Button onClick={(e)=>{
            const pathname = usePathname()
            const searchParams: {filter: string, [key:string]: string | number} = {filter: '{}'}
            useSearchParams().forEach((value, key) => {
                searchParams[key] = value;
            });
            const {filter, ...rest} = searchParams
            const {relation, ...f}: {
                start?: string,
                start_field?: string,
                start_term?: string,
                end?: string,
                end_field?: string,
                end_term?: string,
                relation?: string| Array<string | {name?: string, limit?: string}>,
                limit?: number,
                page?: number,
                filter?: FilterSchema,
                [key: string]: any
            } = JSON.parse(filter)
            const query = process_filter({
                ...rest,
                filter: {
                    ...f,
                    end: nodes['Gene'] !== undefined ? 'Gene': Object.keys(nodes)[0],
                    end_field: 'label'
                }
            })
            router_push(router, pathname, query)
        }} 
        color="secondary"
        startIcon={<AddBox />}
        >
            <Typography variant="body2" color="secondary">Find Shortest Paths between Two Nodes</Typography>
        </Button>
    )
}

export const EndButton = () => {
    const router = useRouter()
    return (
        <Button onClick={()=>{
            const pathname = usePathname()
            const searchParams: {filter: string, [key:string]: string | number} = {filter: '{}'}
            useSearchParams().forEach((value, key) => {
                searchParams[key] = value;
            });
            const {filter, ...rest} = searchParams
            const {relation, end, end_term, end_field, ...filt} = JSON.parse(filter)
    
            const query = process_filter({
                ...rest,
                filter: filt
            })
            router_push(router, pathname, query)
    
        }} 
            color="secondary"
            startIcon={<IndeterminateCheckBox />}>
            <Typography variant="body2" color="secondary">Collapse to Focus the Search on a Single Node</Typography>
        </Button>
    )
}