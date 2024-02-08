'use client'
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { makeTemplate} from "@/utils/helper"
import { router_push } from "@/utils/client_side"
import { UISchema } from "@/app/api/schema/route"
import { Typography, 
	Button,
	Box,
	Card,
	CardHeader,
	CardContent,
	CardActions,
	IconButton,
	Tooltip
} from "@mui/material"
import { precise } from "@/utils/math"
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import HubIcon from '@mui/icons-material/Hub';
import AllOutIcon from '@mui/icons-material/AllOut';
export const TooltipCard = ({node, 
	tooltip_templates, 
	setFocused, 
	schema, 
	top=25, 
	left=25, 
	endpoint="/", 
	expand=true,
	reset=null
}: {
	node: {
        id: string,
		kind: string,
		label: string,
		[key: string]: string | number | boolean,
    },
	tooltip_templates: {[key: string]: Array<{[key: string]: string}>}, 
	setFocused: Function, 
	schema: UISchema, 
	top: number, 
	left: number, 
	endpoint: string, 
	expand: boolean,
	reset: null | Function
}) => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const elements = []
    const field = node.kind === "Relation" ? node.label : node.kind.replace("Co-expressed Gene", "Gene")
    for (const i of tooltip_templates[field] || []) {
      if (i.type === "link") {
        const text = makeTemplate(i.text, node)
        const href = makeTemplate(i.href, node)
        if (text !== 'undefined') {
          elements.push(
            <Typography key={i.label} variant="subtitle2">
              <b>{i.label}</b> <Button size='small' 
                  style={{padding: 0}} 
                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
              >{text}</Button>
            </Typography>  
          )
        }
      } else {
        let e = makeTemplate(i.text, node)
        if (e !== 'undefined') {
          elements.push(
            <Typography key={i.label} variant="subtitle2">
              <b>{i.label}</b> {i.type === "text" ? e: precise(e)}
            </Typography>  
          )
        }
      }
    }
	const end_term = searchParams.get('end_term')
    return(
      <Box sx={{
        zIndex: 2,
        position: 'absolute',
        top,
        left,
        maxWidth: 400
      }}
      border={1}
      >
        <Card>
          <CardHeader
            action={
              <IconButton aria-label="settings" onClick={ ()=>{
                  if (reset) reset()
              }}>
                <CloseIcon />
              </IconButton>
            }
            title={node.label}
          />

          <CardContent>
            {elements}
          </CardContent>
          {node.kind !== "Relation" &&
            <CardActions>
              {!end_term && <Tooltip title="Delete Node">
                <IconButton
                  onClick={()=>{
                    setFocused(null)
                    const searchParams: {filter: string, [key:string]: string} = {filter: '{}'}
					useSearchParams().forEach((value, key) => {
						searchParams[key] = value;
					});
					const {page, remove: r, ...rest} = searchParams
					const remove = r !== undefined ? JSON.parse(r) : []
					const query = {
                        ...rest,
                        remove: JSON.stringify([...remove, node.id])
                      }
					router_push(router, pathname, query)
                  }}
                ><DeleteIcon/></IconButton>
              </Tooltip>}
              { expand && <Tooltip title="Expand Node">
                <IconButton
                  onClick={()=>{
                    setFocused(null)
					const searchParams: {filter: string, [key:string]: string} = {filter: '{}'}
					useSearchParams().forEach((value, key) => {
						searchParams[key] = value;
					});
					const {page, expand: e, ...rest} = searchParams
					const expand = e !== undefined ? JSON.parse(e) : []
					const query = {
                        ...rest,
                        expand: JSON.stringify([...expand, node.id])
                      }
					router_push(router, pathname, query)
                  }}
                ><AllOutIcon/></IconButton>
              </Tooltip>}
              <Tooltip title="Open in Term & Gene Search">
                <IconButton
                  onClick={()=>{
                    setFocused(null)
					const pathname = (schema.header.tabs.filter(i=>i.component === 'KnowledgeGraph')[0] || {}).endpoint || '/'
					const query = {
                        start: node.kind,
                        start_term: node.label
                      }
					router_push(router, pathname, query)
                  }}
                ><HubIcon sx={{transform: "scaleX(-1)"}}/></IconButton>
              </Tooltip>
            </CardActions>
          }
        </Card>
      </Box>
    )
  }