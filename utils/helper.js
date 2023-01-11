export const precise = (value) => {
	if (isNaN(value)) return value
	if (Number.isInteger(Number(value))) return value
	let v = Number.parseFloat(value).toPrecision(4);
	if (Math.abs(value) < 0.0001 && Math.abs(v).toString().length > 5){
	  return Number.parseFloat(value).toExponential(4);
	} else {
	  return v
	}
  }

  export function makeTemplate(
    templateString,
    templateVariables
) {
  const keys = [...Object.keys(templateVariables).map((key) => key.replace(/ /g, '_')), 'PREFIX']
  const values = [...Object.values(templateVariables), process.env.NEXT_PUBLIC_PREFIX]
  try {
    const templateFunction = new Function(...keys, `return \`${templateString}\`;`)
    return templateFunction(...values)
  } catch (error) {
    return 'undefined'
  }
}

export function toNumber(value) {
	if (typeof value !== 'object') return value
	const { low, high } = value
	let res = high
  
	for (let i = 0; i < 32; i++) {
	  res *= 2
	}
  
	return low + res
  }

  export const isIFrame = () => {
	try {
		if ( window.location !== window.parent.location ) return true
    	else false	
	} catch (error) {
		return false
	}
}