'use client'
import {useState, useEffect} from 'react'
import { delay } from '@/utils/helper';
import { Stack, Typography } from '@mui/material';

export const Counter = () => {
    const [count, setCount] = useState(0)
    const [timer, setTimer] = useState(0)
    const query_counter = async (delay_time=5000) => {
        try {
            await delay(delay_time)
            const {count} = await ( await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter`)).json()
            setCount(count)
            setTimer(timer + 1)
        } catch (error) {
            console.log(error)
            console.error(error)
        }
    }

    useEffect(()=>{
        if (timer === 0) query_counter(0)
        else query_counter()
    }, [timer])

    return (
        <Stack direction={"row"} spacing={1}>
            <Typography variant="nav">Queries Submitted: </Typography> <Typography><b>{count}</b></Typography>
        </Stack>
    )
}

export default Counter