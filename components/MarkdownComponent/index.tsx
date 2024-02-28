import ClientSide from "./client_side"

export const get_path = (src) => {
    if (src.startsWith("/")) {
        return `${process.env.NEXT_PUBLIC_HOST}${src}`
    } else {
        return src
    }
}



const Markdown = async ({src, markdown}: {src?:string, markdown?:string}) => {
    let md = null
    if (markdown) md=markdown
    if (src) md = await (await fetch(src)).text()
    if (md === null) return null
    return <ClientSide md={md}/>
}

export default Markdown