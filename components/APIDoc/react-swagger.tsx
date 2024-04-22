"use client"
import { CircularProgress } from "@mui/material"
import { useEffect, useState } from "react"
import SwaggerUI from "swagger-ui-react"

import "swagger-ui-react/swagger-ui.css"

type Props = {
  spec: Record<string, any>
}

function ReactSwagger({ spec }: Props) {
  const [specs, setSpecs] = useState(null)
  useEffect(()=>{
    const resolve_specs = async () => {
      const specs = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/docs`)).json()
      setSpecs(specs)
    }
    resolve_specs()
  }, [])
  if (specs === null) return <CircularProgress/>
  // @ts-ignore - SwaggerUI is not typed
  return <SwaggerUI spec={specs} />
}

export default ReactSwagger