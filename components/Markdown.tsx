import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import { makeTemplate } from '../utils/helper'

export const get_path = (src) => {
    if (src.startsWith("/")) {
        return `${process.env.NEXT_PUBLIC_HOST}${src}`
    } else {
        return src
    }
}

const LinkRenderer = (props) => {
    return (
        <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
    )
}

const Image = (props) => {
    return (
        <img src={props.src} alt={props.alt} width={'100%'}/>
    )
}

const Markdown = async ({src, markdown}: {src?:string, markdown?:string}) => {
    let md = null
    if (markdown) md=markdown
    if (src) md = await (await fetch(get_path(makeTemplate(src, {})))).text()
    if (md === null) return null
    else {
        return <div className='markdown'><ReactMarkdown remarkPlugins={[gfm]} components={{a: LinkRenderer, img:Image}}>{md}</ReactMarkdown></div>
    }
}

export default Markdown