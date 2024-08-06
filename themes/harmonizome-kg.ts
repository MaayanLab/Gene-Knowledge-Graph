import { createTheme } from "@mui/material"
import { DM_Sans } from 'next/font/google'

export const sans = DM_Sans({ 
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
})

export const harmonizome_kg_theme = createTheme({
    typography: {
        fontFamily: sans.style.fontFamily,
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
            fontFamily: sans.style.fontFamily,
            fontSize: 16,
            fontWeight: 500,
        },
        body2: {
            fontFamily: sans.style.fontFamily,
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
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#FFF"
        },
        footer: {
            fontFamily: sans.style.fontFamily,
            fontSize: 16,
            fontStyle: "normal",
            fontWeight: 400,
        },
        stats_h3: {
            fontSize: 24,
            fontStyle: "normal",
            fontWeight: 500,
            color: "#339eac"
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
            main: "#1d2c58", // keep
            light: "#1d2c58",
            dark: "#139f9f"
        },
        secondary: {
            main: "#1d2c58", // text color
            light: "#1d2c58",
            dark: "#192048"
        },
        tertiary: {
            main: "#eeeeee",
            light: "#c9d2e9",
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
        MuiToolbar: {
            styleOverrides: {
                // Name of the slot
                root: {
                  // Some CSS
                  maxWidth: 1200,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0',  
                  marginLeft: 'auto',
                  marginRight: 'auto'    
                },
              },
        },
        MuiAppBar: {
            styleOverrides: {
                // Name of the slot
                root: {
                  // Some CSS
                  height: '50px',
                  background: "#132457",
                  boxShadow: "none",
                },
              },
        },

        MuiTableHead: {
            styleOverrides: {
                root: {
                    borderRadius: "0px 0px 0px 0px",
                    background: "#FFF"
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                notchedOutline: {
                    borderColor: '#070707',
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