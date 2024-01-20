export const actualSessionId = (urlEncodedSessionIdentifier) => {
  const regexPattern = /[. =]/;


 

  arr = urlEncodedSessionIdentifier.split(regexPattern);

  return (actualSessionIdentifier = arr[1]);
};
