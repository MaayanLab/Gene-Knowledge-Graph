'use client'
import { Stack, Typography } from '@mui/material';
import useSWR from 'swr';
const fetcher = (url) => fetch(url).then(r => r.json())
export const Counter = ({ui_theme}: {ui_theme?: string}) => {  

    const { data } = useSWR('/api/counter', fetcher, { refreshInterval: 5000 })

    return (
        <Stack direction={"row"} spacing={1}>
            <Typography variant="nav">Queries Submitted: </Typography> 
            {ui_theme === undefined || ui_theme === 'cfde_theme' ?
            <Typography><b>{(data || {}).count}</b></Typography>:
            <Typography variant={'nav'}><b>{(data || {}).count}</b></Typography>
            }
        </Stack>
    )
}

export default Counter