import { createTheme } from "@mui/material"
import { Inter, DM_Sans, Montserrat, Hanken_Grotesk } from 'next/font/google'

export const dm_sans = DM_Sans({ 
    weight: ['500', '700'],
    subsets: ['latin'],
    display: 'swap',
})
export const inter = Inter({ 
    weight: ['400', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
})
export const montserrat = Montserrat({ 
    weight: ['600'],
    subsets: ['latin'],
    display: 'swap',
})

export const hanken_grotesk = Hanken_Grotesk({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
})


export const cfde_theme = createTheme({
    typography: {
        fontFamily: hanken_grotesk.style.fontFamily,
        h1: {
            fontSize: 40,
            fontStyle: "normal",
            fontWeight: 500,
        },
        h2: {
            fontSize: 32,
            fontWeight: 500,
            fontStyle: "normal",
        },
        h3: {
            fontSize: 24,
            fontStyle: "normal",
            fontWeight: 500,
        },
        h4: {
            fontSize: 22,
            fontStyle: "normal",
            fontWeight: 500,
        },
        h5: {
            fontSize: 20,
            fontStyle: "normal",
            fontWeight: 500,
        },
        cfde: {
            fontSize: "40px",
            fontStyle: "normal",
            fontWeight: 500,
            textTransform: "uppercase"
        },
        cfde_small: {
            fontSize: 24,
            fontStyle: "normal",
            fontWeight: 500,
            textTransform: "uppercase"
        },
        subtitle1: {
            fontSize: 16,
            fontWeight: 500,
        },
        subtitle2: {
            fontSize: 15,
            fontWeight: 500,
        },
        body1: {
            fontFamily: dm_sans.style.fontFamily,
            fontSize: 16,
            fontWeight: 500,
        },
        body2: {
            fontFamily: dm_sans.style.fontFamily,
            fontSize: 15,
            fontWeight: 500,
        },
        caption: {
            fontSize: 14,
            fontStyle: "normal",
            fontWeight: 500,
        },
        nav: {
            fontSize: 16,
            fontStyle: "normal",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "#336699"
        },
        footer: {
            fontFamily: dm_sans.style.fontFamily,
            fontSize: 16,
            fontStyle: "normal",
            fontWeight: 400,
        },
        stats_h3: {
            fontSize: 24,
            fontStyle: "normal",
            fontWeight: 500,
            color: "#9E9E9E"
        },
        stats_sub: {
            fontSize: 16,
            fontStyle: "normal",
            fontWeight: 500,
            color: "#9E9E9E"
        },
    },
    palette: {
        primary: {
            main: "#C3E1E6",
            light: "#DBEDF0",
            dark: "#84A9AE"
        },
        secondary: {
            main: "#336699",
            light: "#81A1C1",
            dark: "#1F3D5C"
        },
        tertiary: {
            main: "#7187C3"
        },
        paperGray: {
            main: "#FAFAFA",
            light: "#fdfdfd",
            dark: "#afafaf"
        }
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                // Name of the slot
                root: {
                  // Some CSS
                  background: "#FFF",
                  boxShadow: "none",
                },
              },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    borderRadius: "0px 0px 0px 0px",
                    background: "#C9D2E9"
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                notchedOutline: {
                    borderColor: '#336699',
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    background: 'white',
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: "#B7C3E2",
                    '&.Mui-checked': {
                        color: "#336699",
                    },
                    '& .MuiSvgIcon-root': { 
                        fontSize: 20,
                    }
                }
            }
        },
        MuiTypography: {
            styleOverrides: {
                root: ({ ownerState }) => ({
                    ...(ownerState.color === 'tertiary' &&
                     {
                        color: '#7187C3',
                      }),
                  }),
            }
        },
        MuiButton: {
            styleOverrides: {
                // Name of the slot
                root: ({ ownerState }) => ({
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    padding: "8px 16px",
                    ...(ownerState.variant === 'contained' &&
                      ownerState.color === 'primary' && {
                        backgroundColor: '#C3E1E6',
                        color: '#336699',
                      }),
                    ...(ownerState.variant === 'contained' &&
                      ownerState.color === 'tertiary' && {
                        backgroundColor: '#7187C3',
                        color: '#FFFFFF',
                      }),
                  }),
              },
        },
        MuiChip: {
            styleOverrides: {
                // Name of the slot
                root: ({ ownerState }) => ({
                    textTransform: "none",
                    borderRadius: 120,
                    fontWeight: 600,
                    padding: "10px 16px",
                    ...(ownerState.variant === 'filled' &&
                      ownerState.color === 'primary' && {
                        backgroundColor: '#C3E1E6',
                        color: '#336699',
                      }),
                    ...(ownerState.variant === 'filled' &&
                      ownerState.color === 'tertiary' && {
                        backgroundColor: '#7187C3',
                        color: '#FFFFFF',
                      }),
                  }),
              },
        }, 
        MuiTablePagination: {
            styleOverrides: {
                root: {
                    "& .MuiInputBase-root, & .MuiInputLabel-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                      fontSize: "1rem"
                    },
              },
            },
        },
        MuiPaper: {
            variants: [
                {
                    props: {
                        variant: 'rounded-top'
                    },
                    style: {
                        borderTopLeftRadius: '1rem',
                        borderTopRightRadius: '1rem',
                    },
                }
            ],
        },
    }
})

declare module '@mui/material/styles' {
    interface TypographyVariants {
      cfde: React.CSSProperties;
      cfde_small: React.CSSProperties;
      nav: React.CSSProperties;
      footer: React.CSSProperties;
      stats_h3: React.CSSProperties;
      stats_sub: React.CSSProperties;
    }
  
    // allow configuration using `createTheme`
    interface TypographyVariantsOptions {
      cfde?: React.CSSProperties;
      cfde_small?: React.CSSProperties;
      nav?: React.CSSProperties;
      footer?: React.CSSProperties;
      stats_h3?: React.CSSProperties;
      stats_sub?: React.CSSProperties;
    }

    interface Palette {
        paperGray: Palette['primary'];
        tertiary: Palette['primary'];
    }

    interface PaletteOptions {
        paperGray?: PaletteOptions['primary'];
        tertiary?: PaletteOptions['primary'];
    }
  }

  declare module "@mui/material" {
    interface ButtonPropsColorOverrides {
        tertiary: true;
    }

    interface ChipPropsColorOverrides {
        tertiary: true;
    }
  }
  
  // Update the Typography's variant prop options
  declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
      cfde: true;
      cfde_small: true;
      nav: true;
      footer: true;
      stats_h3: true;
      stats_sub: true;
    }
  }

  
  declare module '@mui/material/Paper' {
    interface PaperPropsVariantOverrides {
      "rounded-top": true;
    }
  }
