import dynamic from "next/dynamic"
import { withRouter } from "next/router";
import { process_filter } from "./form";

const Button = dynamic(() => import('@mui/material/Button'));
const AddBoxIcon  = dynamic(() => import('@mui/icons-material/AddBox'));
const IndeterminateCheckBoxIcon = dynamic(() => import('@mui/icons-material/IndeterminateCheckBox'));

export const StartButton = withRouter(({router, nodes}) => (
    <Button onClick={(e)=>{
        const {page, filter, ...rest} = router.query
        const {relation, ...f} = JSON.parse(filter)
        const query = {
            ...rest,
            filter: ({
                ...f,
                end: nodes['Gene'] !== undefined ? 'Gene': Object.keys(nodes)[0],
                end_field: 'label'
            })
        }
        console.log(query)
        router.push({
            pathname: `/${page || ''}`,
            query: process_filter(query)
        }, undefined, {shallow: true})
    }} startIcon={<AddBoxIcon />}
    >
        Find Shortest Paths between Two Nodes
    </Button>
))

export const EndButton = withRouter(({router}) => (
    <Button onClick={()=>{
        const {page, filter, ...rest} = router.query
        const {relation, end, end_term, end_field, ...filt} = JSON.parse(filter)

        const query = {
            ...rest,
            filter: filt
        }
        router.push({
            pathname: `/${page || ''}`,
            query: process_filter(query)
        }, undefined, {shallow: true})

    }} startIcon={<IndeterminateCheckBoxIcon />}>
        Collapse to Focus the Search on a Single Node
    </Button>
))