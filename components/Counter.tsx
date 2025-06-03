'use client'
import { Stack, Typography } from '@mui/material';
import useSWR from 'swr';
const fetcher = (url) => fetch(url).then(r => r.json())
export const Counter = ({ui_theme}: {ui_theme?: string}) => {  

    const { data } = useSWR(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/counter`, fetcher, { refreshInterval: 5000 })

    return (
        <Stack direction={"row"} spacing={1}>
            <Typography variant="nav">Queries Submitted: </Typography> 
            {ui_theme === undefined || ui_theme === 'cfde_theme' ?
            <Typography><b>{(data || {}).count}</b></Typography>:
            <Typography variant={'nav'} sx={{display: {xs: "#000", sm: "#000", md: "#FFF", lg: "#FFF", xl: "#FFF"}}}><b>{(data || {}).count}</b></Typography>
            }
        </Stack>
    )
}

export default Counter