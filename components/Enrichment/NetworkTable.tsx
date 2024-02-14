'use client'
import { DataGrid, GridToolbar, GridColDef } from "@mui/x-data-grid";
const header: GridColDef[] = [
    {
        field: 'enrichr_label',
        headerName: "Term",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'library',
        headerName: "Library",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
    {
        field: 'pval',
        headerName: "p-value",
        align: "left"
    },
    {
        field: 'qval',
        headerName: "q-value",
        align: "left"
    },
    {
        field: 'zscore',
        headerName: "z-score",
        align: "left"
    },
    {
        field: 'combined_score',
        headerName: "combined score",
        align: "left"
    }
]

const NetworkTable = ({sorted_entries}:{sorted_entries:Array<{[key:string]:any}>}) => (
	<DataGrid
		components={{ Toolbar: GridToolbar }}
		sortingOrder={['desc', 'asc']}
		rows={sorted_entries}
		columns={header}
		autoPageSize
		disableColumnMenu
		autoHeight
		pageSize={10}
		rowsPerPageOptions={[5, 10, 25]}
	/>
)

export default NetworkTable