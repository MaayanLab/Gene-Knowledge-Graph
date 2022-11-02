import React from 'react'
import dynamic from 'next/dynamic';
import {
	BarChart, Bar, Cell, XAxis, YAxis, LabelList, Tooltip,
} from 'recharts';
import Color from 'color'
const Grid = dynamic(() => import('@mui/material/Grid'));

const renderCustomizedLabel = (props) => {
	const {
	  x, y, width, height, value, color
	} = props;
	// const radius = 10;
	const background = Color(color)
	const fontColor = background.isDark() ? "#FFF": "#000"
	const transfomedX = width < 0 ? x-5: x+5
	const textAnchor = width < 0 ? "end": "start"
	return (
	  <g>
		<text x={transfomedX} y={y+(height/2) + 4} width={width} fill={fontColor} textAnchor={textAnchor} fontSize={11}>
		  {value}
		</text>
	  </g>
	);
  };

export const EnrichmentBar = (props) => {
	const {
		   field,
		   data,
		   color="#0063ff",
		   fontColor="#FFF",
		   maxHeight=300,
		   barSize=23,
		   width=500,
		   min,
		   max
		} = props
	// const [png, ref] = useRechartToPng();
	// const handleDownload = React.useCallback(async () => {
	// 	// Use FileSaver to download the PNG
	// 	FileSaver.saveAs(png, `${filename}.png`);
	//   }, [png]);
	  const height = data.length === 10 ? maxHeight: maxHeight/10 * data.length
	return(
		<Grid container>
			{/* { download ?
				<Grid item xs={12} align="right" style={{marginRight: 10}}>
					<Downloads 
						data={[
							{
								text: `Download Bar Chart`,									
								onClick: handleDownload,
								icon: "mdi-download"
							}
						]} 
					/>
				</Grid>: null
			} */}
			<Grid item xs={12}>
				<BarChart
					layout="vertical"
					height={height}
					width={width}
					data={data}
					// ref={ref} // Save the ref of the chart
				>
					<Bar dataKey="value" fill={color} barSize={barSize}>
						<LabelList dataKey="label" position="left" content={renderCustomizedLabel} fill={fontColor}/>
						{data.map((entry, index) => {
							return <Cell key={`${field}-${index}`} fill={entry.color} />
						}
						)}
					</Bar>
					<XAxis type="number" domain={[
						() => {
							if (min < 0) {
								return min
							} else {
								return min-(min/100)
							}
						},
						() => {
							if (max > 0) {
								return max
							} else {
								return max-(max/100)
							}
						},
					]} hide/>
					<YAxis type="category" hide/>
				</BarChart>
			</Grid>
		</Grid>
	)
}
export default EnrichmentBar
