'use client'
import React from 'react'
import {
	BarChart, Bar, Cell, XAxis, YAxis, LabelList, Tooltip, ResponsiveContainer, TooltipProps
} from 'recharts';
import {
    ValueType,
    NameType,
} from 'recharts/types/component/DefaultTooltipContent';
import Color from 'color'
import { precise } from '@/utils/math';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { cp } from 'fs';


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

  const BarTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
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

export const EnrichmentBar = (props: {
	field?: string,
	data: Array<{library: string, color: string, pval: number, [key: string]: number | string | boolean}>,
	color?: string,
	fontColor?: string,
	maxHeight?: number,
	barSize?: number,
	width?: number
	min: number,
	max: number,
}) => {
	const {
		   field="",
		   data,
		   color="#0063ff",
		   fontColor="#FFF",
		   maxHeight=300,
		   barSize=23,
		   width=500,
		   min,
		   max
		} = props
	const height = data.length === 10 ? maxHeight: maxHeight/10 * data.length
	let yWidth = 0
	const data_cells = []

	for (const index in data) {
		const i = data[index]
		if (yWidth < i.library.length) yWidth = i.library.length
		data_cells.push(<Cell key={`${field}-${index}`} fill={i.color} />)
	}

	return(
		<Grid container>
			<Grid item xs={12}>
				<ResponsiveContainer 
						height={height}
						width={'100%'}
				>
					<BarChart
						layout="vertical"
						id="kg-network"
						height={height}
						width={width}
						data={data}// Save the ref of the chart
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
