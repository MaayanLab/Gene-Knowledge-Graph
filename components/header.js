import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
import * as default_schema from '../public/schema.json'
import { useRouter } from 'next/router'

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Stack = dynamic(() => import('@mui/material/Stack'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Button = dynamic(() => import('@mui/material/Button'));
const MenuIcon = dynamic(import('@mui/icons-material/Menu'));
const Counter = dynamic(import('./counter'));

const function_mapper = {
	filter_relation: ({router, relation})=>{
		const {page, relation: old_rel, ...query} = router.query
		const old_relation = old_rel ? old_rel.split(","): []

		const updated_relation = []
		for (const i of old_relation) {
			if (relation.indexOf(i) === -1) {
				updated_relation.push(i)
			}
		}
		for (const i of relation) {
			if (old_relation.indexOf(i) === -1) {
				updated_relation.push(i)
			}
		}

		if (updated_relation.length) query.relation = updated_relation.join(",")
		router.push({
			pathname: `/${page || ''}`,
			query
		}, undefined, {shallow: true})
	},
	add_library: ({router, libraries}) => {
		const {page, libraries: old_lib, ...query} = router.query
		const old_libraries = JSON.parse(old_lib || "[]").reduce((acc, i)=>({
			...acc,
			[i.library]: i
		}), {})
		const new_libraries = libraries.reduce((acc, i)=>({
			...acc,
			[i.library]: i
		}), {})
		const updated_libraries = []
		for (const i of Object.keys(old_libraries)) {
			if (new_libraries[i] === undefined) {
				updated_libraries.push(old_libraries[i])
			}
		}
		for (const i of Object.keys(new_libraries)) {
			if (old_libraries[i] === undefined) {
				updated_libraries.push(new_libraries[i])
			}
		}
		if (updated_libraries.length) {
			query.libraries = JSON.stringify(updated_libraries)
			router.push({
				pathname: `/${page || ''}`,
				query
			}, undefined, {shallow: true})
		} else {
			router.push({
				pathname: `/${page || ''}`,
			}, undefined, {shallow: true})
		}
	}
}

const styles = {
	disabled: {
		opacity: .4
	},
	enabled: {
		opacity: 1,
	},
	active: {
		opacity: 1,
		background: "#e0e0e0",
		"&:hover": {
			background: "#9e9e9e",
		}
	}
  }

const IconRenderer = ({label, icon, height=100, width=100, href, router, relation, subheader={}, props}) => {
	let selected
	let for_selection
	if (subheader.field) {
		if (subheader.list_field) {
			selected = []
			for_selection = []
			for (const i of JSON.parse(router.query[subheader.field] || "[]")) {
				selected.push(i[subheader.list_field])
			}
			for (const i of props[subheader.field]) {
				for_selection.push(i[subheader.list_field])
			}
		} else {
			selected = router.query[subheader.field] ? router.query[subheader.field].split(","): []
			for_selection = props[subheader.field]
		}
	}
	let buttonStyle = styles.enabled
	if (selected !== undefined) {
		const isSelected = selected.filter(i=>for_selection.indexOf(i) > -1)
		if (selected.length && isSelected.length > 0) buttonStyle = styles.active
		else if (selected.length && isSelected.length === 0) buttonStyle = styles.disabled	
	}
	if (subheader.onClick !== undefined) {
		return (
			<Button 
				onClick={()=>{
					function_mapper[subheader.onClick](({router, ...props}))
					
				}}
				sx={buttonStyle}
			>
				<div style={{height, minWidth: width, ...buttonStyle}}>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(icon, {})}
						height={height}
						width={width}
						layout="responsive"
						objectFit="contain"
						alt={label}
					/>
				</div>
			</Button>
		)
	} else if (href !== undefined) {
		return (
			<Button 
				href={href}
				target="_blank"
				rel="noopener noreferrer"
			>
				<div style={{height, minWidth: width}}>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(icon, {})}
						height={height}
						width={width}
						layout="responsive"
						objectFit="contain"
						alt={label}
					/>
				</div>
			</Button>
		)
	} else {
		return (
			<Button 
				sx={buttonStyle}
				href={"/"}
			>
				<div style={{height, minWidth: width}}>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(icon, {})}
						height={height}
						width={width}
						layout="responsive"
						objectFit="contain"
						alt={label}
					/>
				</div>
			</Button>
		)
	}
}


const Header = ({schema, ...rest}) => {
	const [selected, setSelected] = useState([])
	const [anchorEl, setAnchorEl] = useState(null);
  	const open = Boolean(anchorEl);
	const router = useRouter()
	const relation = router.query.relation
	
	useEffect(()=>{
		if (relation === undefined) setSelected([])
	}, [relation])

	const handleClickMenu = (e) => {
		setAnchorEl(e.currentTarget);
	  };
	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

	if (!schema) schema = default_schema
	const icon_buttons = []
	const selection_rules = {}
	for (const i of ((schema.header || {}).subheader||[])) {
		icon_buttons.push(
			<IconRenderer
				router={router}
				setSelected={setSelected}
				selected={selected}
				relation={relation}
				key={i}
				{...i}
				{...rest}
			/>
		)
		for (const s of (i.props || {}).selected || []) {
			selection_rules[s] = i.label
		}
	}
	useEffect(()=>{
		const new_selected = []
		if (relation) {
			for (const i of (relation).split(",")) {
				new_selected.push(selection_rules[i])
			}	
		}
		setSelected(new_selected)
	},[relation])

	useEffect(()=>{
		const libraries = JSON.parse(router.query.libraries || '[]')
		if (libraries.length) {
			const new_selected = []
			for (const {library} of libraries) {
				new_selected.push(library)
			}
			setSelected(new_selected)
		}
	}, [router.query.libraries])
	if (schema === undefined || schema.header === undefined) return null
	
	return(
	<Grid container style={{paddingBottom: 20, paddingTop: 20}}>
		<Grid item xs={12} align="center">
			{ schema.header.icon ?
				<Grid container justifyContent={"center"} alignItems={"center"} spacing={2} style={{marginBottom: 5}}>
					<Grid item>
						<div style={{height: schema.header.icon.height || 30, 
							minWidth: schema.header.icon.width || 30}}>
							<Image 
								layout="responsive"
								objectFit="contain"
								width={schema.header.icon.width || 30}
								height={schema.header.icon.height || 30}
								src={makeTemplate(schema.header.icon.src, {})}
								alt={makeTemplate(schema.header.icon.alt, {})}
							/>
						</div>
					</Grid>
					<Grid item>
						<Typography variant="h4"><b>{schema.header.title}</b></Typography>
					</Grid>
					{schema.header.tabs && 
						<Grid item align="left">
							<Button onClick={handleClickMenu}
								aria-controls={open ? 'basic-menu' : undefined}
								aria-haspopup="true"
								aria-expanded={open ? 'true' : undefined}
							><MenuIcon/></Button>
							<Menu
								id="basic-menu"
								anchorEl={anchorEl}
								open={open}
								onClose={handleCloseMenu}
								MenuListProps={{
									'aria-labelledby': 'basic-button',
								}}
							>
								{schema.header.tabs.map(t=>(
									<MenuItem key={t.label} onClick={()=> {
										handleCloseMenu()
										router.push(t.endpoint)
									}}>{t.label}</MenuItem>
								))}
							</Menu>
						</Grid>
					}
				</Grid>:<Typography variant="h4"><b>{schema.header.title}</b></Typography>
			}
			
		</Grid>
		<Grid item xs={12} align="center">
			<Stack direction={"row"} sx={{ display: { xs: 'block'} }} spacing={1}>{icon_buttons}</Stack>
		</Grid>
		<Grid item xs={12}>
			<Grid container justifyContent={"flex-start"}>
				<Grid item><Counter/></Grid>
			</Grid>
		</Grid>
	</Grid>
)}
export default Header