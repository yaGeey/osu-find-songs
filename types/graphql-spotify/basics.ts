export type BaseSpotifyResponse<T> = {
   data: T
}

export type UnexpectedSpotifyError = {
   errors: Array<{
      message: string
      extensions: {
         code: string
      }
   }>
}

export type ExpectedSpotifyError<T extends string = 'GenericError'> = {
   __typename: T
} & (T extends 'GenericError' ? { message?: string } : { message: string })
