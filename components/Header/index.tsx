import Image from 'next/image'
import Link from 'next/link';
import { makeTemplate } from "../../utils/helper";
import {
	Grid, 
	Typography, 
	Stack, 
	IconButton, 
	AppBar, 
	Toolbar
} from "@mui/material";
import { UISchema } from '@/app/api/schema/route';
import { ElevatedIconButton } from './buttons';

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
            <Typography variant={size==='large'?'cfde':'cfde_small'} color={color}>{title}</Typography>
        </div>
    </Link>
)

export const Nav = ({tabs}:
	{tabs: Array<{
	endpoint: string,
	label: string,
	type: string,
	component: string,
	position?:  'top' | 'bottom',
	props?: {
		[key: string]: any
	}
}>}) => {
	const tab_component = {top: [], bottom:[]}
	for (const tab of tabs) {
		console.log(tab)
		const position = tab.position || 'top'
		tab_component[position].push(
			<Link href={tab.endpoint}>
				<Typography variant="nav">{tab.label}</Typography>
			</Link>
		)
	}
	return (
		<>
			<Grid item>
				<Stack direction={"row"} alignItems={"center"} spacing={2}>
					{tab_component.top}		
				</Stack>
			</Grid>
			{tab_component.bottom.length > 0 &&
				<Grid item xs={12}>
					<Stack direction={"row"} alignItems={"center"} spacing={2}>
						{tab_component.bottom}		
					</Stack>
				</Grid>
			}
		</>
	)
}

export default function Header ({schema}: {schema: UISchema}) {
	const {title, icon, tabs} = schema.header
	return  (
		<AppBar position="static" sx={{color: "#000"}}>
			<Toolbar>
				<Grid container justifyContent={"space-between"} alignItems={"center"} spacing={2}>
					<Grid item>
						<Logo alt={icon.alt} src={icon.favicon} title="CFDE Workbench" size='large' color="secondary"/>
					</Grid>
					<Nav tabs={tabs}/>
				</Grid>
			</Toolbar>
		</AppBar>
	)
}