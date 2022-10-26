import dynamic from "next/dynamic";

const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));


export default function Error() {
    return (
        <Typography>Error</Typography>
    )
}