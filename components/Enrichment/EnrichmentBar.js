import React, { useCallback } from 'react'
import dynamic from 'next/dynamic';
import {
	BarChart, Bar, Cell, XAxis, YAxis, LabelList, Tooltip, ResponsiveContainer
} from 'recharts';
import Color from 'color'
import { precise } from '../../utils/helper';
import { useCurrentPng } from 'recharts-to-png';
import Button from '@mui/material/Button';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FileSaver from 'file-saver';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const Typography = dynamic(() => import('@mui/material/Typography'));

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

  const BarTooltip = ({ active, payload }) => {
	if (active) {
		const {enrichr_label, pval, qval, zscore, combined_score} = payload[0].payload
		return(
			<Card style={{opacity:"0.8", textAlign: "left"}}>
				<CardContent>
					<Typography variant="subtitle2"><b>{enrichr_label}</b></Typography>
					<Typography variant="subtitle2"><b>p-value:</b> {precise(pval)}</Typography>
					<Typography variant="subtitle2"><b>q-value:</b> {precise(qval)}</Typography>
					<Typography variant="subtitle2"><b>z-score:</b> {precise(zscore)}</Typography>
					<Typography variant="subtitle2"><b>combined score:</b> {precise(combined_score)}</Typography>
				</CardContent>
			</Card>
		)
	} return null
}

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
	//   const yWidth = data.reduce((acc, i)=>{
	// 		if (acc < i.library.length) acc = i.library.length
	// 		return acc
	// 	}, 0)
	let yWidth = 0
	const data_cells = []
	const [getPng, { ref, isLoading }] = useCurrentPng();

	for (const index in data) {
		const i = data[index]
		if (yWidth < i.library.length) yWidth = i.library.length
		data_cells.push(<Cell key={`${field}-${index}`} fill={i.gradient_color  || i.color} />)
	}

	const handleDownload = useCallback(async () => {
		const png = await getPng();
		// Verify that png is not undefined
		if (png) {
		  // Download with FileSaver
		  FileSaver.saveAs(png, 'enrichment.png');
		}
	  }, [getPng]);

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
			<Grid item xs={12} align="right"><Button onClick={handleDownload}><PhotoCameraIcon/></Button></Grid>
			<Grid item xs={12}>
				<ResponsiveContainer 
						height={height}
						width={'100%'}
				>
					<BarChart
						layout="vertical"
						height={height}
						width={width}
						data={data}
						ref={ref} // Save the ref of the chart
					>
						<Tooltip content={<BarTooltip/>} />
						<Bar dataKey="value" fill={color} barSize={barSize}>
							<LabelList dataKey="enrichr_label" position="left" content={renderCustomizedLabel} fill={fontColor}/>
							{data_cells}
						</Bar>
						<XAxis type="number" domain={[
							() => {
								if (min < 0) {
									return min
								} else {
									return 0
								}
							},
							() => {
								if (max > 0) {
									return max
								} else {
									return 0
								}
							},
						]} hide/>
						<YAxis type="category" dataKey={"library"} width={yWidth*7} axisLine={false} fontSize={12}/>
					</BarChart>
				</ResponsiveContainer>
			</Grid>
		</Grid>
	)
}
export default EnrichmentBar
