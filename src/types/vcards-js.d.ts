declare module 'vcards-js' {
  interface VCard {
    firstName: string
    lastName: string
    organization: string
    title: string
    email: string
    cellPhone: string
    url: string
    version: string
    workAddress: {
      label: string
      street: string
      city: string
      stateProvince: string
      postalCode: string
      countryRegion: string
    }
    photo: {
      embedFromString(data: string, type: string): void
      embedFromFile(path: string): void
    }
    getFormattedString(): string
  }

  function vCardsJS(): VCard

  export = vCardsJS
}
