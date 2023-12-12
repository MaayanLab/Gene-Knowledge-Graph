import { useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
const options = {
    allowedTags: false,
    allowedAttributes: false
  };
  
const SanitizedHTML = ({src}) => {
    const [html, setHTML] = useState('<div></div>')
    const sanitize = (dirty) => ({
        __html: sanitizeHtml(
            dirty, 
            options
          ),
      });
    useEffect(()=>{
        const fetch_html = async (src) => {
            const html = await (await fetch(src)).text()
            if (html) setHTML(html)
            else setHTML('<div></div>')
        }
        fetch_html(src)
    },[src])
    return (<div dangerouslySetInnerHTML={sanitize(html)} />)
}

export default SanitizedHTML