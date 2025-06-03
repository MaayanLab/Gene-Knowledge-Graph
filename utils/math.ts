export function toNumber(value:{low: number, high: number} ) {
    if (typeof value !== 'object') return value
    const { low, high } = value
    let res = high

    for (let i = 0; i < 32; i++) {
        res *= 2
    }

    return low + res
}

const convert_float = (value: number) => {
  if (isNaN(value)) return ''
  else {
    const v = value.toPrecision(4)
    if (Math.abs(value) < 0.0001 && v.length > 5){
      return `${Number.parseFloat(v).toExponential(4)}`;
    } else {
      return v
    }
  }
}

export const precise = (value: number | string) => {
	// if (typeof value === 'number' && isNaN(value)) return `${value}`
  if (typeof value === 'number') {
    if (isNaN(value)) return ''
    if (Number.isInteger(value)) return `${value}`
    else {
      return convert_float(value)
    }
  } else if (value) {
    if (value.split(".").length === 1) return value
    const val = Number.parseFloat(value)
    return convert_float(val)
  } else return ''
}