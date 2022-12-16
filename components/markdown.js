import { useState, useEffect } from 'react'
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

const Markdown = ({src, markdown}) => {
    const [md, setMD] = useState(null)
    useEffect(()=>{
        const fetch_markdown = async (src) => {
            const md = await (await fetch(get_path(makeTemplate(src, {})))).text()
            setMD(md)
        }
        if (markdown) setMD(markdown)
        else if (src) {
            fetch_markdown(src)
        }
    }, [src, markdown])

    if (md === null) return null
    else {
        return <div className='markdown'><ReactMarkdown remarkPlugins={[gfm]} components={{a: LinkRenderer, img:Image}}>{md}</ReactMarkdown></div>
    }
}

export default Markdown