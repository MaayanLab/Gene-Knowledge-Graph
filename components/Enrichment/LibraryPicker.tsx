'use client'
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
	Autocomplete,
	Chip,
	Grid,
	Popper,
	Slider,
	Box,
	TextField,
	Alert,
	Snackbar,
	Tooltip,
	Typography,
	FormLabel,
	Stack,
	Button
 } from "@mui/material"
import { router_push } from "@/utils/client_side"
import { mdiClose, mdiCloseCircle, mdiMinusCircleOutline, mdiPlusCircleOutline } from "@mdi/js"
import Icon from "@mdi/react"
import { EnrichmentParams } from "."
import { useQueryState, parseAsJson } from "next-usequerystate"
const LibraryPicker = ({
	parsedParams,
	libraries_list,
	default_libraries,
	disableLibraryLimit,
	fullWidth
}: {
	fullWidth: boolean,
    default_libraries: Array<{
		library: string,
		term_limit: number
	}>,
    disableLibraryLimit?: boolean,
    libraries_list: Array<string>,
    parsedParams: EnrichmentParams
}) => {
	const router = useRouter()
	const pathname = usePathname()
	const [error, setError] = useState<{message: string, type: string}>(null)
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [query, setQuery] = useQueryState('query', parseAsJson<EnrichmentParams>().withDefault({}))

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(anchorEl ? null : event.currentTarget);
	};
	const open = Boolean(anchorEl);
	const id = open ? 'simple-popper' : undefined;
	const libraries = query.libraries || parsedParams.libraries
	return (
		<Grid container spacing={1}>
			<Grid item xs={12} md={fullWidth ? 12:5}>
				<Snackbar open={error!==null}
					anchorOrigin={{ vertical:"bottom", horizontal:"left" }}
					autoHideDuration={4500}
					onClose={()=>{
                        setError(null)
                    }}
				>
                    <Alert 
                        onClose={()=>{
                            setError(null)
                        }}
                        severity={(error || {} ).type === "fail" ? "error": "warning"}
                        sx={{ width: '100%' }} 
                        variant="filled"
                        elevation={6}
                    >
                        <Typography>{( error || {}).message || ""}</Typography>
                    </Alert>
                </Snackbar>
				<Autocomplete
					multiple
					limitTags={2}
					id="multiple-limit-tags"
					options={libraries_list}
					title="Select libraries to include"
					value={libraries.map(i=>i.library)}
					renderInput={(params) => (
						<TextField 
							{...params} 
							sx={{backgroundColor: "#FFF"}}
							label="Select libraries" 
							placeholder="Select libraries" 
						/>
					)}
					sx={{ width: '350px' }}
					onChange={(e, libs)=>{
						if (libs.length <= 5) {
							const new_libraries = libs.map(library=>({library, term_limit: 5}))
							if (fullWidth) {
								setQuery({
									...query,
									libraries: new_libraries
								})
							} else {
								router_push(router, pathname, {
									q: JSON.stringify({
										...parsedParams,
										libraries: new_libraries
									})	
								})
							}
							
						} else if (libs.length > 5) {
							setError({message: "Please select up to 5 libraries", type: "fail"})
						}	
						
					}}
					renderTags={()=>null}
				/>
			</Grid>
			<Grid item xs={12} md={fullWidth ? 12: 7}>
                <Grid container spacing={1} alignItems="center">
					{libraries.map(({library, term_limit}) => (
                                <Grid item key={library} xs={fullWidth ? 12: undefined}>
                                    <Tooltip title={`Click chip to adjust limits`} key={library} placement="top">
                                        <Chip label={`${library}: ${term_limit}`}
											onClick={handleClick}
                                            color="primary"
                                            style={{padding: 0, borderRadius: "8px"}}
                                            onDelete={()=>{
												const new_libraries = libraries.filter(l=>l.library !== library)
												if (new_libraries.length === 0) setError({message: "Please select at least one library", type: "fail"})
												else {
													if (fullWidth) {
														setQuery({
															...query,
															libraries: new_libraries
														})
													} else {
														router_push(router, pathname, {
															q: JSON.stringify({
																...parsedParams,
																libraries: new_libraries
															})	
														})
													}    
												}                                             
                                        }}/>
                                    </Tooltip>
									<Popper id={id} open={open} anchorEl={anchorEl}>
										<Box sx={{ border: 1, p: 1, bgcolor: 'background.paper', width: 250 }}>
											<FormLabel>
												<Typography variant="subtitle2">Top terms to include: </Typography>
											</FormLabel>
											<Stack direction={"row"} spacing={1} alignItems={"center"}>
												<Icon path={mdiMinusCircleOutline} size={0.8} />
												<Slider 
													value={term_limit}
													onChange={(e, nv)=>{
														const new_libraries = []
														for (const i of libraries) {
															if (i.library === library) new_libraries.push({
																library,
																term_limit: nv
															})
															else new_libraries.push(i)
														}
														if (fullWidth) {
															setQuery({
																...query,
																libraries: new_libraries
															})
														} else {
															router_push(router, pathname, {
																q: JSON.stringify({
																	...parsedParams,
																	libraries: new_libraries
																})	
															})
														}
													}}
													style={{width: "100%"}}
													valueLabelDisplay='auto'
													min={1}
													max={50}
													aria-labelledby="limit-slider" />
												<Icon path={mdiPlusCircleOutline} size={0.8} />
												<Button color="secondary" onClick={handleClick}><Icon path={mdiCloseCircle} size={0.8} /></Button>
											</Stack>	
										</Box>
									</Popper>
                                </Grid>
                            ))}
				</Grid>
			</Grid>
		</Grid>
	)
}

export default LibraryPicker