'use client'
import { useState } from 'react';
import {
	Grid, 
	Button, 
	Menu,
	MenuItem,
} from "@mui/material";
import Counter from '../Counter';
import MenuIcon from '@mui/icons-material/Menu';
import { ReactNode } from 'react';

export const SmallNav = ({tab_component, ui_theme,  counter}:
	{
		tab_component: {top?: ReactNode[], bottom?: ReactNode[]}	
		ui_theme?: string,
		counter?: Boolean
	}) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (anchorEl) setAnchorEl(null)
		else setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	return (
		<>		
			{/* {counter && <Counter ui_theme={ui_theme}/>} */}
			<Button color="tertiary" onClick={handleClick}><MenuIcon/></Button>
			<Menu
				id="basic-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
				'aria-labelledby': 'basic-button',
				}}
				sx={{
					"& .MuiMenu-paper": {
						// backgroundColor: "primary.main",
						padding: '15px'
					},
					width: '100%',
				}}
				
			>
				{/* {counter && <MenuItem><Counter ui_theme={ui_theme}/></MenuItem>} */}
				{tab_component.top.map((c,i)=><MenuItem key={i}>{c}</MenuItem>)}
				{tab_component.bottom.map((c,i)=><MenuItem key={i}>{c}</MenuItem>)}
				{/* {...tab_component.bottom} */}
			</Menu>
		</>
	)
}

export default SmallNav