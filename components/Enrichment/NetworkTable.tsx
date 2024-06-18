'use client'
import { Stack } from "@mui/material";
import { 
    DataGrid,
    GridColDef,
    GridToolbarContainer,
    GridToolbarQuickFilter,
    GridToolbarExport,
} from "@mui/x-data-grid";
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

export function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{padding: 2}}>
        <GridToolbarQuickFilter variant="outlined" placeholder="Search Results"/>
        <GridToolbarExport sx={{color: "secondary.main"}}/>
      </GridToolbarContainer>
    );
  }


const NetworkTable = ({sorted_entries, columns}:{sorted_entries:Array<{[key:string]:any}>, columns: {[key:string]: boolean}}) => (
	<DataGrid
		components={{ Toolbar: CustomToolbar }}
		sortingOrder={['desc', 'asc']}
		rows={sorted_entries}
		columns={header.filter(i=>columns[i.field])}
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
        }}
	/>
)

export default NetworkTable