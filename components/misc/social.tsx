import React from "react"
import Link from "next/link"
import IconButton from "@mui/material/IconButton"
import Twitter from "@/public/img/Twitter.svg"
import Email from "@/public/img/email.svg"
import Facebook from "@/public/img/Facebook.svg"
import Linkedin from "@/public/img/Linkedin.svg"
import Youtube from "@/public/img/Youtube.svg"

const Logo = ({name}: {name: string}) => {
    if (name === 'email') return <Email/>
    else if (name === 'facebook') return <Facebook/>
    else if (name === 'twitter') return <Twitter/>
    else if (name === 'youtube') return <Youtube/>
    else if (name === 'linkedin') return <Linkedin/>
    else return null
}
const Socials = (props:{[key:string]: string}) => (
    <div className='flex items-center space-x-2'>
        {Object.entries(props).map(([k, v])=>{
            return (
                <Link key={k} href={v}>
                    <IconButton color={"secondary"}>
                        <Logo name={k}/>
                    </IconButton>
                </Link>
            )
        })}
    </div>
)
export default Socials