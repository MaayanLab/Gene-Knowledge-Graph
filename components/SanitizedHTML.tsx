import sanitizeHtml from 'sanitize-html';
const options = {
    allowedTags: false,
    allowedAttributes: false
  };
  
const SanitizedHTML = async ({src}: {src?: string}) => {
	const fetch_html = async (src:string) => {
		const html = await (await fetch(src, { next: { revalidate: 3600 } })).text()
		if (html) return(html)
		else return('<div></div>')
	}
	const html = await fetch_html(src)
    const sanitize = (dirty) => ({
        __html: sanitizeHtml(
            dirty, 
            options
          ),
      });
    return (<div dangerouslySetInnerHTML={sanitize(html)} />)
}

export default SanitizedHTML