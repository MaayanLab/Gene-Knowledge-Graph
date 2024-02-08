export function toNumber(value:{low: number, high: number} ) {
    if (typeof value !== 'object') return value
    const { low, high } = value
    let res = high

    for (let i = 0; i < 32; i++) {
        res *= 2
    }

    return low + res
}

export const precise = (value: number | string) => {
	if (typeof value === 'number' && isNaN(value)) return value
	if (Number.isInteger(Number(value))) return value
  if (typeof value === 'string') {
    const val = Number.parseFloat(value)
    if (isNaN(val)) return value
    else {
      let v = val.toPrecision(4);
      if (Math.abs(val) < 0.0001 && v.length > 5){
        return Number.parseFloat(v).toExponential(4);
      } else {
        return val
      }
    }
  } 
  }