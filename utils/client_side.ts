'use client'
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useRef, useEffect } from "react"
export const router_push = (router: AppRouterInstance, pathname:string, query: {[key: string]: string }) => {
	const newSearchParams = new URLSearchParams(query)
	router.push(pathname + '?' + newSearchParams.toString())
}

export const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value; //assign the value of ref to the argument
    },[value]); //this code will run when the value of 'value' changes
    return ref.current; //in the end, return the current ref value.
  }
  