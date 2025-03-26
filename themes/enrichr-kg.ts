import { createTheme } from "@mui/material"
import { Noto_Sans_Display } from 'next/font/google'

export const noto_sans = Noto_Sans_Display({ 
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
})

export const enrichr_kg_theme = createTheme({
    typography: {
        fontFamily: noto_sans.style.fontFamily,
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
        },
        cfde_small: {
            fontSize: 24,
            fontStyle: "normal",
            fontWeight: 500,
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
            fontFamily: noto_sans.style.fontFamily,
            fontSize: 16,
            fontWeight: 500,
        },
        body2: {
            fontFamily: noto_sans.style.fontFamily,
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
            fontWeight: 400,
            color: "#FFF"
        },
        nav_small: {
            fontSize: 16,
            fontStyle: "normal",
            fontWeight: 600,
            color: "#000"
        },
        footer: {
            fontFamily: noto_sans.style.fontFamily,
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
            main: "#C5F8F8",
            light: "#e8fcfc",
            dark: "#139f9f"
        },
        secondary: {
            main: "#3F51B5",
            light: "#b0b8e4",
            dark: "#192048"
        },
        tertiary: {
            main: "#C5F8F8",
            light: "#e8fcfc",
            dark: "#139f9f"
        },
        paperGray: {
            main: "#FAFAFA",
            light: "#fdfdfd",
            dark: "#afafaf"
        },
        dataGrid: {
            main: "#C9D2E9",
            contrastText: "#336699"
        }
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                // Name of the slot
                root: {
                  // Some CSS
                  background: "#000",
                  boxShadow: "none",
                  paddingTop: 3, 
                  paddingBottom: 3, 
                  mb: 2
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
                root: ({ ownerState, theme }) => ({
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
      nav_small: React.CSSProperties;
      footer: React.CSSProperties;
      stats_h3: React.CSSProperties;
      stats_sub: React.CSSProperties;
    }
  
    // allow configuration using `createTheme`
    interface TypographyVariantsOptions {
      cfde?: React.CSSProperties;
      cfde_small?: React.CSSProperties;
      nav?: React.CSSProperties;
      nav_small?: React.CSSProperties;
      footer?: React.CSSProperties;
      stats_h3?: React.CSSProperties;
      stats_sub?: React.CSSProperties;
    }

    interface Palette {
        paperGray: Palette['primary'];
        dataGrid: Palette['primary'];
        tertiary: Palette['primary'];
    }

    interface PaletteOptions {
        paperGray?: PaletteOptions['primary'];
        dataGrid?: PaletteOptions['primary'];
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
      nav_small: true;
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
