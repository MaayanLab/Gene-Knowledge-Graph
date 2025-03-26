import React from "react";
import {
	Grid, 
	Stack, 
	AppBar, 
	Toolbar,
	Divider,
	Typography
} from "@mui/material";
import Link from "next/link";
import { UISchema } from '@/app/api/schema/route';
import { Logo } from '../misc/logo';
import Counter from '../Counter';
import { TextNav } from './TextNav';
import SmallNav from "./SmallNav";

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
			<React.Fragment key={tab.label}>
				<TextNav path={tab.endpoint} title={tab.label}/>
			</React.Fragment>
		)
		if (divider) tab_component[position].push(<Divider key={tab.label + "div"} sx={{display: {xs: "none", sm: "none", md: "block", borderColor: "#fff"}}} orientation='vertical' flexItem/>)
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
			<Grid item sx={{display: {xs: "none", sm: "none", md: "block"}}}>
					<Stack direction={"row"} alignItems={"center"} spacing={2}>
						{tab_component.top}
						{divider && <Divider sx={{display: {xs: "none", sm: "none", md: "block", borderColor: "#fff"}}} orientation='vertical' flexItem/>}
						{(counter && tab_component.bottom.length === 0 && counterTop) && 
							<Counter ui_theme={ui_theme}/>
						}
					</Stack>
					
			</Grid>
			{tab_component.bottom.length > 0 &&
				<Grid item xs={12} sx={{display: {xs: "none", sm: "none", md: "block"}}}>
					<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} spacing={2}>
						<Stack direction={"row"} alignItems={"center"} spacing={2}>
							{tab_component.bottom}		
						</Stack>
						<Counter ui_theme={ui_theme}/>
					</Stack>
					
				</Grid>
			}
			{(counter && tab_component.bottom.length === 0 && !counterTop) &&
				<Grid item xs={12} className='flex justify-end' sx={{display: {xs: "none", sm: "none", md: "block"}}}>		
					<div className="flex justify-end"><Counter ui_theme={ui_theme}/></div>
				</Grid>
			}
			<Grid item className='flex justify-end' sx={{display: {xs: "block", sm: "block", md: "none", lg: "none", xl: "none"}}}>
				<SmallNav counter={counter} tab_component={tab_component} ui_theme={ui_theme}/>
			</Grid>
		</Grid>
	)
}

export default function Header ({schema}: {schema:UISchema}) {
	const {title, icon, tabs, divider, counterTop, counter} = schema.header
	return  (
		<AppBar position="static" sx={{color: "#000", marginBottom: 1}}>
			<Toolbar>
				<Nav counterTop={counterTop} counter={counter} tabs={tabs} divider={divider} ui_theme={schema.ui_theme} title={title} icon={icon}/>
			</Toolbar>
		</AppBar>
	)
}