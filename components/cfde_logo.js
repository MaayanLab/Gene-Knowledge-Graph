import Link from 'next/link';
import Image from 'next/image';
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/system';

export const ElevatedIconButton = styled(IconButton)({
    boxShadow: '0px 1px 3px 1px rgba(15, 31, 46, 0.15)',
    padding: 3,
    background: "#FFF"
  });


export const Logo = ({color}) => (
    <Link href={"/"}>
        <Stack direction={"row"} spacing={1}>
            <ElevatedIconButton
                aria-label="menu"
                sx={{width: 35, height: 35}}
            >
                <div style={{width: 30, height: 30, position: "relative", marginLeft: -2}}>
                    <Image style={{ padding: 2,  objectFit: "contain"}} layout='fill' alt="cfde-logo" src="https://minio.dev.maayanlab.cloud/datadistillery-kg/img/favicon.png" />
                </div>
            </ElevatedIconButton>
            <Typography variant='cfde' color={color}>CFDE Data Distillery KG</Typography>
        </Stack>
    </Link>
)

export default Logo