export const fetch_workflow_of_node = async (params) => {
	const curr_url = window.location;
	const base_url = curr_url .protocol + "//" + curr_url.host + curr_url.pathname.split('/')[1];

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

export const fetch_resource_of_node = async (params) => {
	const curr_url = window.location;
	const base_url = curr_url .protocol + "//" + curr_url.host + curr_url.pathname.split('/')[1];

	const request = await fetch(
		base_url + `/api/resources/workflow?`+ new URLSearchParams(params),
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
			"error": `Not found`
		}
	} else if (request.ok !== true) {
	  throw new Error(`Error communicating with API at /api/workflows/resource`)
	}
	return await request.json()
}

export const fetch_nodes_of_resource = async (resource) => {
	const curr_url = window.location;
	const base_url = curr_url .protocol + "//" + curr_url.host + curr_url.pathname.split('/')[1];

	const request = await fetch(
		base_url + `/api/workflows/resource/${resource}`,
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
			"error": `resource not found`
		}
	} else if (request.ok !== true) {
	  throw new Error(`Error communicating with API at ${base_url}/api/workflows/resource/${resource}`)
	}
	return await request.json()
}

export const update_counter = async (params) => {
	const curr_url = window.location;
	const base_url = curr_url .protocol + "//" + curr_url.host + "/" + curr_url.pathname.split('/')[1];

	const request = await fetch(
		base_url + `/api/workflows/counter?`+ new URLSearchParams(params),
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
	  throw new Error(`Error communicating with API at /api/workflows/counter`)
	}
	return await request.json()
}