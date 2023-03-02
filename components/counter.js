import {useState, useEffect} from 'react'
import dynamic from 'next/dynamic'
import { delay } from './Enrichment'

const Stack = dynamic(() => import('@mui/material/Stack'));
const Typography = dynamic(() => import('@mui/material/Typography'));

export const Counter = ({fontColor}) => {
    const [count, setCount] = useState(0)
    const [timer, setTimer] = useState(0)
    const query_counter = async (delay_time=5000) => {
        try {
            await delay(delay_time)
            const {count} = await ( await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter`)).json()
            setCount(count)
            setTimer(timer + 1)
        } catch (error) {
            console.error(error)
        }
    }
    useEffect(()=>{
        query_counter(0)
    }, [])

    useEffect(()=>{
        query_counter()
    }, [timer])

    return (
        <Stack direction={"row"}>
            <Typography variant="subtitle1" color={fontColor}>Queries Submitted: <b>{count}</b></Typography>
        </Stack>
    )
}

export default Counter