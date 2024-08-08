import Link from "next/link"
import Image from "next/image"
import { Typography, Box } from "@mui/material"
import { ElevatedIconButton } from "../Header/buttons"
import { sanitize } from "../SanitizedHTML"
export const Logo = ({src, alt, title, color="secondary", size, avatar, width, height}: {src: string, alt: string, title: string, color: "primary"| "secondary" | "inherit", size?: "small" | "large", avatar?: boolean, width?: number, height?: number}) => {
    return (
        <Link href={"/"} className='flex items-center space-x-3'>
            {avatar ?
            <div>
                <ElevatedIconButton
                    aria-label="menu"
                    sx={{width: width ? width: size === 'large' ? 56: 35, height: height ? height: size === 'large' ? 56: 35, backgroundColor: "inherit"}}
                >
                    <Image style={{marginLeft: -2, padding: 2,  objectFit: "contain"}} fill={true} alt={alt} src={src} />
                </ElevatedIconButton>
            </div>:
                <Box sx={{width: width ? width: size === 'large' ? 56: 35, height: height ? height: size === 'large' ? 56: 35, backgroundColor: "inherit", position: "relative"}}>
                    <Image style={{marginLeft: -2, padding: 2,  objectFit: "contain"}} fill={true} alt={alt} src={src} />
                </Box>
            }
            <div>
                <Typography variant={size==='large'?'cfde':'cfde_small'} color={color} dangerouslySetInnerHTML={sanitize(title)}></Typography>
            </div>
        </Link>
    )
}