import React from 'react'

export default function Background({children}) {
    return(
        <div  style={{background: "linear-gradient(180deg, #FFFFFF 0%, #DBE0ED 100%)", flexGrow: 1, minHeight: "80vh"}}>
            {children}
        </div>
    )
    
  }