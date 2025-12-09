'use client'
import { Button } from "@mui/material"
import { 
	GridColDef, 
	GridRenderCellParams, 
	DataGrid,
	GridToolbarContainer,
	GridToolbarQuickFilter
} from "@mui/x-data-grid"
import DownloadIcon from '@mui/icons-material/Download';
import Link from "next/link";

const default_header: GridColDef[] = [
    {
        field: 'source',
        headerName: "Source",
        // flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'description',
        headerName: "Description",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
    {
        field: 'size',
        headerName: "File size",
        align: "left"
    },
    {
        field: 'nodes',
        headerName: "Nodes",
        align: "left"
    },
    {
        field: 'edges',
        headerName: "Edges",
        align: "left"
    },
    {
        field: 'updated',
        headerName: "Last Updated",
        align: "left",
		minWidth: 120
    },
    {
        field: 'url',
        headerName: "Download",
        align: "left",
		renderCell: (params: GridRenderCellParams<any, String>) => (
			<Link href={params.value}>
			<Button
				size="small"
				color="secondary"
			>
				<DownloadIcon/>
			</Button>
			</Link>
		),
    }
]

const node_header: GridColDef[] = [
	{
        field: 'node_type',
        headerName: "Node Type",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'description',
        headerName: "Description",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
    {
        field: 'size',
        headerName: "File size",
        align: "left"
    },
    {
        field: 'nodes',
        headerName: "Nodes",
        align: "left"
    },
    {
        field: 'url',
        headerName: "Download",
        align: "left",
		renderCell: (params: GridRenderCellParams<any, String>) => (
			<Link href={params.value}>
			<Button
				size="small"
				color="secondary"
			>
				<DownloadIcon/>
			</Button>
			</Link>
		),
    }
]

const edge_header: GridColDef[] = [
	{
        field: 'source',
        headerName: "Source",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'relation',
        headerName: "Relation",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'target',
        headerName: "Target",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
    {
        field: 'size',
        headerName: "File size",
        align: "left"
    },
    {
        field: 'edges',
        headerName: "Edges",
        align: "left"
    },
    {
        field: 'url',
        headerName: "Download",
        align: "left",
		renderCell: (params: GridRenderCellParams<any, String>) => (
			<Link href={params.value}>
			<Button
				size="small"
				color="secondary"
			>
				<DownloadIcon/>
			</Button>
			</Link>
		),
    }
]

const edge_header_with_coverage: GridColDef[] = [
    {
        field: 'resource',
        headerName: "Resource",
        // flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'source',
        headerName: "Source",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'relation',
        headerName: "Relation",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'target',
        headerName: "Target",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
    {
        field: 'size',
        headerName: "File size",
        align: "left"
    },
    {
        field: 'edges',
        headerName: "Edges",
        align: "left"
    },
	{
        field: 'gene_coverage',
        headerName: "Gene Coverage",
        align: "left"
    },
    {
        field: 'url',
        headerName: "Download",
        align: "left",
		renderCell: (params: GridRenderCellParams<any, String>) => (
			<Link href={params.value}>
			<Button
				size="small"
				color="secondary"
			>
				<DownloadIcon/>
			</Button>
			</Link>
		),
    }
]

export function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{padding: 2}}>
        <GridToolbarQuickFilter variant="outlined" placeholder="Search Results"/>
      </GridToolbarContainer>
    );
  }

  const headers = {
	default: default_header,
	nodes: node_header,
	edges: edge_header,
	"gene edges": edge_header_with_coverage
  }
const ClientSide = ({download, type}: {download: Array<{
	source: string,
	description?: string,
	terms: number,
	edges: number,
	url: string,
	size: string
}> | Array<{
	node_type: string,
	description?: string,
	terms: number,
	url: string,
	size: string
}> | Array<{

	source: string,
	relation: string,
	target: string,
	description?: string,
	edges: number,
	gene_coverage?: number,
	url: string,
	size: string
}>
type: 'default' | 'nodes' | 'edges' | 'gene edges'
}) => {
	
	return (
		<DataGrid
				components={{ Toolbar: CustomToolbar }}
				sortingOrder={['desc', 'asc']}
				rows={download}
				columns={headers[type]}
				autoPageSize
				disableColumnMenu
				autoHeight
				pageSize={10}
				rowsPerPageOptions={[5, 10, 25]}
				sx={{
					'.MuiDataGrid-columnHeaders': {
						color: 'dataGrid.contrastText',
						backgroundColor: 'dataGrid.main',
						borderRadius: "1rem 1rem 0 0",
					},
					borderRadius: "0 0 4px 4px",
					'.MuiDataGrid-columnSeparator': {
						display: 'none',
					},
					border: 0
				}}
			/>
	)
}

export default ClientSide