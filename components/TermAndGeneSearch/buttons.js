import dynamic from "next/dynamic"
import { withRouter } from "next/router";
import { process_filter } from "./form";

const Button = dynamic(() => import('@mui/material/Button'));
const Typography = dynamic(() => import('@mui/material/Typography'));

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
        router.push({
            pathname: `/${page || ''}`,
            query: process_filter(query)
        }, undefined, {shallow: true})
    }} 
    color="secondary"
    startIcon={<AddBoxIcon />}
    >
        <Typography variant="body2" color="secondary">Find Shortest Paths between Two Nodes</Typography>
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

    }} 
        color="secondary"
        startIcon={<IndeterminateCheckBoxIcon />}>
        <Typography variant="body2" color="secondary">Collapse to Focus the Search on a Single Node</Typography>
    </Button>
))