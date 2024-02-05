import { Logo } from "./logo";
import Socials from "./social";
import Github from "./github";
import { Typography } from "@mui/material";
import Link from "next/link";

export const Text = ({text}: {text:string}) => (
    <Typography variant="footer"><b>{text}</b></Typography>
)

export const TextLink = ({text, href}: {text:string, href: string}) => (
    <Link href={href}>
        <Typography variant="footer">{text}</Typography>
    </Link>
)

const MiscComponent = ({component, props}) => {
    if (component === 'logo') return <Logo {...props}/>
    else if (component === 'github') return <Github {...props}/>
    // else if (component === 'social') return <Socials {...props}/>
    else if (component === 'text') return <Text {...props}/>
    else if (component === 'link') return <TextLink {...props}/>
    else return null
}

export default MiscComponent