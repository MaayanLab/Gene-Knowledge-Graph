import Link from "next/link"
import Image from "next/image"
import { Typography } from "@mui/material"
import { ElevatedIconButton } from "../Header/buttons"
import { sanitize } from "../SanitizedHTML"
export const Logo = ({src, alt, title, color="secondary", size}: {src: string, alt: string, title: string, color: "primary"| "secondary" | "inherit", size?: "small" | "large"}) => (
    <Link href={"/"} className='flex items-center space-x-3'>
        <div>
			<ElevatedIconButton
				aria-label="menu"
				sx={{width: size === 'large' ? 56: 35, height: size === 'large' ? 56: 35}}
			>
				<Image style={{marginLeft: -2, padding: 2,  objectFit: "contain"}} fill={true} alt={alt} src={src} />
			</ElevatedIconButton>
        </div>
        <div>
            <Typography variant={size==='large'?'cfde':'cfde_small'} color={color} dangerouslySetInnerHTML={sanitize(title)}></Typography>
        </div>
    </Link>
)