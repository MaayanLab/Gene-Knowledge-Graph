import Link from 'next/link';
import {
	Grid, 
	Typography, 
	Stack, 
	AppBar, 
	Toolbar
} from "@mui/material";
import { UISchema } from '@/app/api/schema/route';
import { Logo } from '../misc/logo';
import Counter from '../Couter';

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
		const position = tab.position || 'top'
		tab_component[position].push(
			<Link href={tab.endpoint} key={tab.label}>
				<Typography variant="nav">{tab.label}</Typography>
			</Link>
		)
	}
	return (
		<>
			<Grid item>
				<Stack direction={"row"} alignItems={"center"} spacing={2}>
					{tab_component.top}		
					<Counter/>
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
		<AppBar position="static" sx={{color: "#000", paddingTop: 3, paddingBottom: 3}}>
			<Toolbar>
				<Grid container justifyContent={"space-between"} alignItems={"center"} spacing={2}>
					<Grid item>
						<Logo alt={icon.alt} src={icon.favicon} title={title} size='large' color="secondary"/>
					</Grid>
					<Nav tabs={tabs}/>
				</Grid>
			</Toolbar>
		</AppBar>
	)
}