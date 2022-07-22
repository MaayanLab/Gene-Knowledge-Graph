import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import { makeTemplate } from '../utils/helper'
const get_path = (src) => {
    console.log(src)
    if (src.startsWith("/")) {
        const getUrl = window.location;
        const baseUrl = getUrl .protocol + "//" + getUrl.host
        return `${baseUrl}${src}`
    } else {
        return src
    }
}

const LinkRenderer = (props) => {
    return (
        <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
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
    }, [])

    if (md === null) return null
    else {
        return <div className='markdown'><ReactMarkdown remarkPlugins={[gfm]} components={{a: LinkRenderer}}>{md}</ReactMarkdown></div>
    }
}

export default Markdown