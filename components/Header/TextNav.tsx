'use client'
import { Typography } from "@mui/material"
import { usePathname } from "next/navigation"

export  function TextNav({title, path}: {title: string, path: string}) {
	const pathname = `/${usePathname().split("/")[1]}`
	let sx
	if (pathname === path) {
		// sx = {textDecoration: "underline", textDecorationThickness: 0}
		sx = {textDecoration: "none"}; 
	}
	return(
		<Typography variant="nav" sx={sx}>{title}</Typography>
	)
}