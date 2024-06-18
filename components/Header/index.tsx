import Link from 'next/link';
import {
	Grid, 
	Typography, 
	Stack, 
	AppBar, 
	Toolbar,
	Divider
} from "@mui/material";
import { UISchema } from '@/app/api/schema/route';
import { Logo } from '../misc/logo';
import Counter from '../Counter';
import { TextNav } from './TextNav';
export const Nav = ({tabs, ui_theme, divider, title, icon}:
	{
		ui_theme?: string,
		divider?: boolean,
		title: string,
		icon: {
			favicon: string,
			alt: string,
			avatar?: boolean
		},
		tabs: Array<{
			endpoint: string,
			label: string,
			type: string,
			component: string,
			position?:  string,
			props?: {
				[key: string]: any
			}
		}>}) => {
	const tab_component = {top: [], bottom:[]}
	for (const tab of tabs) {
		const position = tab.position || 'top'
		tab_component[position].push(
			<Link href={tab.endpoint} key={tab.label}>
				<TextNav path={tab.endpoint} title={tab.label}/>
			</Link>
		)
		if (divider) tab_component[position].push(<Divider orientation='vertical' flexItem sx={{borderColor: "#000"}}/>)
	}
	if (divider) {
		for (const position of Object.keys(tab_component)) {
			tab_component[position].pop()
		}
	}
	return (
		<Grid container justifyContent={"space-between"} alignItems={"center"}>
			<Grid item sx={{ flexGrow: 1 }}>
				<Logo alt={icon.alt} src={icon.favicon} title={title} avatar={icon.avatar} size='large' color="secondary"/>
			</Grid>
			<Grid item>
				<Stack direction={"row"} alignItems={"center"} spacing={2}>
					{tab_component.top}
					{/* {tab_component.bottom.length === 0 && 
						<Counter ui_theme={ui_theme}/>
					} */}
				</Stack>
			</Grid>
			{tab_component.bottom.length > 0 &&
				<Grid item>
					<Stack direction={"row"} alignItems={"center"} spacing={2}>
						{tab_component.bottom}		
					</Stack>
				</Grid>
			}
			{tab_component.bottom.length > 0 ?
				<Grid item>		
					<Counter ui_theme={ui_theme}/>
				</Grid>:
				<Grid item xs={12} className='flex justify-end'>		
					<Counter ui_theme={ui_theme}/>
				</Grid>
			}
		</Grid>
	)
}

export default function Header ({schema}: {schema: UISchema}) {
	const {title, icon, tabs, divider} = schema.header
	return  (
		<AppBar position="static" sx={{color: "#000", paddingTop: 3, paddingBottom: 3, mb: 2}}>
			<Toolbar>
				<Nav tabs={tabs} divider={divider} ui_theme={schema.ui_theme} title={title} icon={icon}/>
			</Toolbar>
		</AppBar>
	)
}