'use client'
import { Typography } from '@mui/material';
import { MuiMarkdown, getOverrides } from 'mui-markdown';
const ClientSide = async ({md}: {md?:string,}) => {
    return <MuiMarkdown
		overrides={{
			...getOverrides({}), // This will keep the other default overrides.
			h2: {
				component: ({children, style, ...props})=><Typography sx={{...style}} {...props} variant="h2">{children}</Typography>,
				props: {
					style: { marginBottom: 2, },
				},
			},
			p: {
				component: ({children, style, ...props})=><Typography sx={{...style}} {...props} variant="body1">{children}</Typography>,
				props: {
					style: { marginBottom: 2, },
				},
			},
      }}
	>{md}</MuiMarkdown>
}

export default ClientSide