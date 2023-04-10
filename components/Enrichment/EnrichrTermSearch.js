import { useState, useEffect } from "react";
import dynamic from "next/dynamic";


const Stack = dynamic(() => import('@mui/material/Stack'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const TextField = dynamic(() => import('@mui/material/TextField'));

export const EnrichrTermSearch = ({setInput}) => {
    const [term, setTerm] = useState('')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [options, setOptions] = useState([])
    const [controller, setController] = useState(null)


    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
    }

    useEffect(()=>{
        const searchTerm = async (term) => {
            if (term === '') {
                setOpen(false)
                setOptions([])
            }
            else {
                try {   
                    setLoading(true)
                    const controller = get_controller()
                    const {terms} = await (
                        await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/termmap?meta=${term}&json=true`, {
                            method: 'GET',
                            signal: controller.signal
                        })
                    ).json()
                    const options = []
                    for (const [library,v] of Object.entries(terms)) {
                        for (const term of v)  {
                            options.push({
                                library,
                                term
                            })
                        }
                    }
                    if (options.length) setOpen(true)
                    setLoading(false)
                    setOptions(options)
                } catch (error) {
                    console.error(error)
                }
            }
        }
        searchTerm(term)
    }, [term])

    const fetchGeneSet = async (params) => {
        try {
            if (params) {
                const {library, term} = params
                const controller = get_controller() 
                const res = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/geneSetLibrary?term=${term}&libraryName=${library}&mode=json`, {
                    method: 'GET',
                    signal: controller.signal
                })
                const results = await res.json()
                const vals = Object.entries(results)           
                if (vals) {
                    const [description, genes] = vals[0]
                    setInput({description: `${description} (${library})`, genes})
                    setOpen(false)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Stack direction={'column'} spacing={1} justifyContent={'flex-start'} alignItems={'flex-start'}>
            <Typography> Search an Enrichr term and expand it to a gene set:</Typography>
            <Autocomplete
                id="enrichr-term"
                options={options.sort((a, b) => -b.library.localeCompare(a.library))}
                groupBy={(option) => option.library}
                getOptionLabel={(option) => option.term}
                sx={{ width: "90%" }}
                loading={loading}
                renderInput={(params) => <TextField {...params} placeholder="Search Enrichr Term" onChange={(e)=>setTerm(e.target.value)} />}
                noOptionsText={`Can't find ${term}`}
                onChange={(e,v)=>{
                    fetchGeneSet(v)
                }}
                popupIcon={null}
                open={open}
                onBlur={()=>setOpen(false)}
            />
        </Stack>
    )
}

export default EnrichrTermSearch