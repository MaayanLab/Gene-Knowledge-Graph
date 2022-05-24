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