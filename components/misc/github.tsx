import Link from "next/link"
import Icon from '@mdi/react'
import { mdiGithub, mdiBugOutline} from '@mdi/js';
import { Stack, Typography } from "@mui/material";

const Github = ({code, issues}: {code: string, issues:string}) => (
    <Stack spacing={2}>
        <Link href={code}
            target="_blank"
            rel="noopener noreferrer"
        >
            <div className='flex items-center space-x-1'>
                <Icon path={mdiGithub} size={1} /> 
                <Typography variant='footer' className='flex'>
                Github Repository
                </Typography>
            </div>
        </Link>
        <Link href={issues}
            target="_blank"
            rel="noopener noreferrer"
        >
            <div className='flex items-center space-x-1'>
                <Icon path={mdiBugOutline} size={1} /> 
                <Typography variant='footer' className='flex'>
                Report a bug
                </Typography>
            </div>
        </Link>
    </Stack>
)

export default Github