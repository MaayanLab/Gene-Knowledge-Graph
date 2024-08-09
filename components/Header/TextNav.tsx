'use client'
import { useState } from "react"
import Link from "next/link"
import { Typography, Menu, MenuItem, ButtonBase } from "@mui/material"
import { usePathname } from "next/navigation"

export  function TextNav({title, path, props}: {
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
  	const open = Boolean(anchorEl);
	let sx
	if (pathname === path) {
		// sx = {textDecoration: "underline", textDecorationThickness: 0}
		sx = {textDecoration: "none"}; 
	}
	if (props !== undefined && props.submenu !== undefined) {
		const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			setAnchorEl(event.currentTarget);
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
					sx={{padding: 0, marginLeft: 0}}
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
						}
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
			</>
		)
	} else {
		return(
			<Link href={path}>
				<Typography variant="nav" sx={sx}>{title}</Typography>
			</Link>
		)
	} 
}