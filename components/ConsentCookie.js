import dynamic from 'next/dynamic'
const Alert = dynamic(()=>import('@mui/material/Alert'))
const AlertTitle = dynamic(()=>import('@mui/material/AlertTitle'))
const Button = dynamic(()=>import('@mui/material/Button'))
const Grid = dynamic(()=>import('@mui/material/Grid'))
const Typography = dynamic(()=>import('@mui/material/Typography'))

export const ConsentCookie = ({consentCookie, setConsentCookie}) => {
    if (consentCookie !== undefined) return null
    else {
        return(
            <Alert severity="info" id="cookieConsent">
                <AlertTitle>Cookie Policy</AlertTitle>
                <Grid container alignItems={"center"} spacing={2}>
                    <Grid item>
                        <Typography>Are you ok with us using Google Analytics while you use our website?</Typography>
                    </Grid>
                    <Grid item>
                        <Button onClick={() => {
                            setConsentCookie('allow')
                        }} variant='outlined'>I agree</Button>
                    </Grid>
                    <Grid item>
                        <Button onClick={() => {
                            setConsentCookie('deny')
                        }} variant='outlined'>Decline</Button>
                    </Grid>
                </Grid>
            </Alert>
        )
    }
}


export default ConsentCookie