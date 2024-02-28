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

const header: GridColDef[] = [
    {
        field: 'source',
        headerName: "Source",
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
        field: 'terms',
        headerName: "Nodes",
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

export function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{padding: 2}}>
        <GridToolbarQuickFilter variant="outlined" placeholder="Search Results"/>
      </GridToolbarContainer>
    );
  }

const ClientSide = ({download}: {download: Array<{
	source: string,
	description?: string,
	terms: number,
	edges: number,
	url: string,
	size: string
}>}) => {
	return (
		<DataGrid
				components={{ Toolbar: CustomToolbar }}
				sortingOrder={['desc', 'asc']}
				rows={download}
				columns={header}
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