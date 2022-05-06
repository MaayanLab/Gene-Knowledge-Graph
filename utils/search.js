export const fetch_workflow_of_node = async (params) => {
	const curr_url = window.location;
	const base_url = curr_url .protocol + "//" + curr_url.host + "/" + curr_url.pathname.split('/')[1];

	const request = await fetch(
		base_url + `/api/workflows?`+ new URLSearchParams(params),
	  	{
		  method: 'GET',
		  headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			// 'Authorization': auth,
		  },
		}
	)
	if (request.status === 404) {
		return {
			"error": `workflow not found`
		}
	} else if (request.ok !== true) {
	  throw new Error(`Error communicating with API at /api/workflows`)
	}
	return await request.json()
}