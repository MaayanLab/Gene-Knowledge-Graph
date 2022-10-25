import {useState, useEffect} from 'react'
import dynamic from 'next/dynamic'
import { delay } from './Enrichment'

const Stack = dynamic(() => import('@mui/material/Stack'));
const Typography = dynamic(() => import('@mui/material/Typography'));

export const Counter = () => {
    const [count, setCount] = useState(0)
    const [timer, setTimer] = useState(0)


    const query_counter = async () => {
        await delay(5000)
        const {count} = await ( await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter`)).json()
        setCount(count)
        setTimer(timer + 1)
    }

    useEffect(()=>{
        query_counter()
    }, [timer])

    return (
        <Stack direction={"row"}>
            <Typography>Queries Submitted: <b>{count}</b></Typography>
        </Stack>
    )
}

export default Counter