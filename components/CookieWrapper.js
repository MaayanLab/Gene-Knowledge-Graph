import { useState, useEffect } from "react"
import Cookies from 'js-cookie'

const consent_cookie_name = 'consentCookie'


export const withCookie = (Component) => (props) => {
    const [consentCookie, setConsentCookie] = useState(Cookies.get(consent_cookie_name))
    
    useEffect(()=>{
        Cookies.set(consent_cookie_name, consentCookie)
    }, [consentCookie])
    
    const resetCookie  = () => {
        Cookies.remove(consent_cookie_name)
        setConsentCookie(undefined)
    }

    return <Component {...props} consentCookie={consentCookie} setConsentCookie={setConsentCookie} resetCookie={resetCookie}/>

}