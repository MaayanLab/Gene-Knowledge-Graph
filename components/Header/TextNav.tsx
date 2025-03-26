'use client'
import { useState } from "react"
import Link from "next/link"
import { Typography, Menu, MenuItem, ButtonBase, List, ListItem, Collapse } from "@mui/material"
import { usePathname } from "next/navigation"

export  function TextNav({title, path, props}:  {
	title: string, 
	path: string,
	props?: {
		"submenu"?: Array<{
			name: string,
			href: string,
		}>
	} 
}) {
	const pathname = `/${usePathname().split("/")[1]}`
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [clicked, setClicked] = useState<null | string>(null);
  	const open = Boolean(anchorEl);
	let sx
	if (pathname === path) {
		// sx = {textDecoration: "underline", textDecorationThickness: 0}
		sx = {textDecoration: "none"}; 
	}
	if (props !== undefined && props.submenu !== undefined) {
		const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			if (anchorEl) setAnchorEl(null)
			else setAnchorEl(event.currentTarget);
		};
		const handleClose = () => {
			setAnchorEl(null);
		};
		return (
			<>
				<ButtonBase
					id="basic-button"
					aria-controls={open ? 'basic-menu' : undefined}
					aria-haspopup="true"
					aria-expanded={open ? 'true' : undefined}
					onClick={handleClick}
					sx={{padding: 0, marginLeft: 0, display: {xs: "none", sm: "none", md: "block"}}}
				>
					<Typography variant="nav" sx={sx}>{title}</Typography>
				</ButtonBase>
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
							backgroundColor: "primary.main"
						},
						display: {xs: "none", sm: "none", md: "block"}
					}}
				>
					{props.submenu.map(({name, href})=>(
						<MenuItem key={name} onClick={handleClose}>
							<Link href={href}>
								<Typography variant="nav">{name}</Typography>
							</Link>
						</MenuItem>
					))}
				</Menu>
				<ListItem sx={{display: {xs: "block", sm: "block", md: "none", lg: "none", xl: "none"}}}>
					<ButtonBase
						id="basic-button"
						aria-controls={open ? 'basic-menu' : undefined}
						aria-haspopup="true"
						aria-expanded={open ? 'true' : undefined}
						onClick={()=>clicked===title?setClicked(null): setClicked(title)}
						sx={{padding: 0, marginLeft: 0}}
					>
						<Typography variant="nav" sx={sx}>{title}</Typography>
					</ButtonBase>
				</ListItem>
				<Collapse in={clicked===title} timeout="auto" unmountOnExit  sx={{display: {xs: "block", sm: "block", md: "none", lg: "none", xl: "none"}}}>
					<List component="div" disablePadding>
						{props.submenu.map(({name, href})=>(
							<ListItem key={name} onClick={handleClose}>
								<Link href={href}>
									<Typography variant="nav">{name}</Typography>
								</Link>
							</ListItem>
						))}
					</List>
				</Collapse>
			</>
		)
	} else {
		return(
			<>
				<Link href={path}>
					<Typography sx={{display: {xs: "none", sm: "none", md: "block"}, ...sx}} variant="nav">{title}</Typography>
				</Link>
				<ListItem sx={{display: {xs: "block", sm: "block", md: "none", lg: "none", xl: "none"}}}>
					<Link href={path}>
						<Typography variant="nav" sx={{color: {xs: "#000", sm: "#000", md: "#FFF", lg: "#FFF", xl: "#FFF"}}}>{title}</Typography>
					</Link>
				</ListItem>
			</>
		)
	} 
}