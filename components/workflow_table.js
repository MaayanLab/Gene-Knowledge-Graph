import dynamic from 'next/dynamic'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid';
import { update_counter } from '../utils/search';


const WorkFlowTable = ({workflows}) => {
	const [rows, setRows] = useState({})
	const router = useRouter()
	useEffect(()=>{
		const rows = {}
		for (const workflow of workflows) {
			rows[workflow.id] = workflow
		}
		setRows(rows)
	},[workflows])

	const update_rows = async ({start, end, endpoint, id}) => {
		if (endpoint && start && end && id) {
			const workflow = await update_counter({endpoint, start, end, id})
			const r = {...rows}
			r[id] = {id, ...workflow}
			setRows(r)
		}
	}
	
	const headers = [
		{
			field: 'type',
			numeric: false,
			headerName: "Type",
			align: "left",
			width: 180,
			renderCell: (params)=>{
				if (params.value === undefined) return null
				const icon = params.row.icon
				return (
					<React.Fragment>
						<Avatar variant="square" src={`${process.env.NEXT_PUBLIC_PREFIX}${icon}`} alt={params.value} style={{marginRight: 5}}/>
						<Typography variant="caption">{params.value}</Typography>
					</React.Fragment>
					
				)
			}
		},
		{
			field: 'name',
			numeric: false,
			headerName: "Title",
			flex: 1,
			style: {flexDirection: "row"},
			align: "left",
			renderCell: (params)=>{
				if (params.value === undefined) return null
				return (
					<Tooltip title={params.value}>
						<Typography variant="caption">{params.value}</Typography>
					</Tooltip>
				)
			}
		},
		{
			field: 'description',
			numeric: false,
			headerName: "Description",
			flex: 1,
			style: {flexDirection: "row"},
			align: "left",
			renderCell: (params)=>{
				if (params.value === undefined) return null
				return (
					<Tooltip title={params.value}>
						<Typography variant="caption">{params.value}</Typography>
					</Tooltip>
				)
			}
		},
		{
			field: 'start',
			numeric: false,
			headerName: "Start",
			width: 100,
			renderCell: (params)=>{
				if (params.value === undefined) return null
				const type = params.row.type
				return (
					<Typography variant="caption">{params.value.name}</Typography>
				)
			}
		},
		{
			field: 'end',
			numeric: false,
			headerName: "End",
			width: 100,
			align: "left",
			renderCell: (params)=>{
				if (params.value === undefined) return null
				return (
					<Typography variant="caption">{params.value.name}</Typography>
				)
			}
		},
		{
			field: 'counter',
			numeric: true,
			headerName: "Clicks",
			renderCell: (params)=>{
				if (params.value === undefined) return null
				return (
					<Typography variant="caption">{params.value}</Typography>
				)
			}
		},
		{
			field: 'endpoint',
			numeric: true,
			headerName: "Link",
			renderCell: (params)=>{
				if (params.value === undefined) return null
				if (params.value.startsWith("/")) {
					return <Button 
							variant="contained"
							size="small"
							style={{
								textTransform: 'none'
							}}
							color="default"
							onClick={async ()=>{
								await update_rows({
									start: params.row.start.id,
									end: params.row.end.id,
									endpoint: params.row.endpoint,
									id: params.row.id
								})
								router.push(params.value)
							}}
							style={{
								textTransform: 'none'
							}}
						>
							<Typography variant="caption">Launch</Typography>
						</Button>
				} else {
					return <Button 
								variant="contained"
								size="small"
								href={params.value}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									textTransform: 'none'
								}}
								color="default"
								onClick={async ()=>{
									await update_rows({
										start: params.row.start.id,
										end: params.row.end.id,
										endpoint: params.row.endpoint,
										id: params.row.id
									})
								}}
							>
								<Typography variant="caption">Launch</Typography>
							</Button>
				}
			}
		},
	]
	return (
		<div>
			<DataGrid 
				sortingOrder={['desc', 'asc']}
				rows={Object.values(rows)}
				columns={headers}
				autoPageSize
				disableColumnMenu
				autoHeight
				pageSize={10}
				rowsPerPageOptions={[5, 10, 25]}
			/>
		</div>
	)
}

export default WorkFlowTable