import { Typography, Link } from '@mui/material';
import MarkdownToJSX from 'markdown-to-jsx';
export const get_path = (src) => {
    if (src.startsWith("/")) {
        return `${process.env.NEXT_PUBLIC_HOST}${src}`
    } else {
        return src
    }
}



const overrides = {
    h1: {
        component: ({children, ...props})=><Typography {...props} variant="h1">{children}</Typography>,
        props: {
            sx: { marginBottom: 2 },
        },
    },
    h2: {
        component: ({children, ...props})=><Typography {...props} variant="h2">{children}</Typography>,
        props: {
            sx: { marginBottom: 2 },
        },
    },
    h3: {
        component: ({children, ...props})=><Typography {...props} variant="h3">{children}</Typography>,
        props: {
            sx: { marginBottom: 2 },
        },
    },
    h4: {
        component: ({children, ...props})=><Typography {...props} variant="h4">{children}</Typography>,
        props: {
            sx: { marginBottom: 2 },
        },
    },
    h5: {
        component: ({children, ...props})=><Typography {...props} variant="h5">{children}</Typography>,
        props: {
            sx: { marginBottom: 2 },
        },
    },
    p: {
        component: ({children, ...props})=><Typography {...props} variant="body1">{children}</Typography>,
        props: {
            sx: { marginBottom: 2, textAlign: "justify" },
        },
    },
    img: {
        component:  ({children, ...props})=><div className='flex justify-center'><img {...props}>{children}</img></div>
    },
    a: {
        component:  ({children, ...props})=><Link {...props} color="secondary">{children}</Link>
    }
}
const Markdown = async ({src, markdown}: {src?:string, markdown?:string}) => {
    let md = null
    if (markdown) md=markdown
    if (src) md = await (await fetch(src, { next: { revalidate: 3600 } })).text()
    if (md === null) return null
    return <MarkdownToJSX options={{wrapper: 'article', overrides}}>{md}</MarkdownToJSX>
}

export default Markdown