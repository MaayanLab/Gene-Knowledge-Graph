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
import { fetch_kg_schema } from '@/utils/initialize';
export const Nav = ({tabs, ui_theme, divider, title, icon, counterTop, counter}:
	{
		ui_theme?: string,
		divider?: boolean,
		title: string,
		counter?: boolean,
		counterTop?: boolean,
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
					{(counter && tab_component.bottom.length === 0 && counterTop) && 
						<Counter ui_theme={ui_theme}/>
					}
				</Stack>
			</Grid>
			{tab_component.bottom.length > 0 &&
				<Grid item xs={12}>
					<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} spacing={2}>
						<Stack direction={"row"} alignItems={"center"} spacing={2}>
							{tab_component.bottom}		
						</Stack>
						<Counter ui_theme={ui_theme}/>
					</Stack>
					
				</Grid>
			}
			{(counter && tab_component.bottom.length === 0 && !counterTop) &&
				<Grid item xs={12} className='flex justify-end'>		
					<Counter ui_theme={ui_theme}/>
				</Grid>
			}
		</Grid>
	)
}

export default async function Header ({schema}: {schema:UISchema}) {
	const {title, icon, tabs, divider, counterTop, counter} = schema.header
	return  (
		<AppBar position="static" sx={{color: "#000"}}>
			<Toolbar>
				<Nav counterTop={counterTop} counter={counter} tabs={tabs} divider={divider} ui_theme={schema.ui_theme} title={title} icon={icon}/>
			</Toolbar>
		</AppBar>
	)
}