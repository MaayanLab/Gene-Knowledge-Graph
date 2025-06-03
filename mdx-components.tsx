import type { MDXComponents } from 'mdx/types'
import { Typography, Button, Table, TableBody, TableCell, TableContainer, Link } from '@mui/material'
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    a: (props) => <Link href={props.href} color="secondary" variant='body1'>{props.children}</Link>,
    h1: (props) => <Typography sx={{marginBottom: 2}} variant='h1'>{props.children}</Typography>,
    h2: (props) => <Typography sx={{marginBottom: 2}} variant='h2'>{props.children}</Typography>,
    h3: (props) => <Typography sx={{marginBottom: 2}} variant='h3'>{props.children}</Typography>,
    h4: (props) => <Typography sx={{marginBottom: 2}} variant='h4'>{props.children}</Typography>,
    h5: (props) => <Typography sx={{marginBottom: 2}} variant='h5'>{props.children}</Typography>,
    li: (props) => <li className="prose list-item my-2" {...props} />,
    p: (props) => <Typography variant='body1' sx={{marginBottom: 2}}>{props.children}</Typography>,
    table: (props) => <TableContainer sx={{marginBottom: 2}}><Table sx={{ minWidth: 650 }} aria-label="simple table">{props.children}</Table></TableContainer>,
    td: (props) => <TableCell><Typography variant="body1">{props.children}</Typography></TableCell>,
    th: (props) => <TableCell><Typography variant="body1" sx={{fontWeight: "bold"}}>{props.children}</Typography></TableCell>,
    ul: (props) => <ul className="prose list-disc list-inside [&_p]:inline" {...props} />,
    ol: (props) => <ol className="prose list-decimal list-inside [&_p]:inline" {...props} />,
    code: (props) => <code className="font-mono my-4" {...props} />,
    blockquote: (props) => <blockquote className="prose before:prose-p:content-none after:prose-p:content-none bg-white p-4 my-4 border-s-4" {...props} />,
    img: (props) => <img className="my-4" {...props} />  
  }
}
