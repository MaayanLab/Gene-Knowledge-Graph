'use client'
import React, {useState, useEffect } from "react"
import Icon from '@mdi/react';
import { mdiBookOpenPageVariant } from '@mdi/js';
import { Box, IconButton, Tooltip, CircularProgress, Typography, Modal } from '@mui/material';

export default function ClientSummarizer({children}: {children: React.ReactElement}) {
	const [open, setOpen] = useState<boolean>(false)
	return (
		<>
                <Tooltip title="Summarize results">
                    <IconButton onClick={()=>setOpen(true)}>
                        <Icon path={mdiBookOpenPageVariant} size={1} />
                    </IconButton>
                </Tooltip>
                <Modal
                    id="summary"
                    open={open}
                    onClose={()=>setOpen(false)}
                >
                    {children}
                </Modal>
            </>
	)
}