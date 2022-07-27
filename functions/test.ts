export function helloWorld(settings: any) {
  return settings.parameterStoreItem;
}

function initialSetup() {
  const parameterStoreItem = 'hello-world';

  return {
    parameterStoreItem,
  };
}

export function lambdaHandler(_params: any) {
  const settings = initialSetup();
  return helloWorld(settings);
}
