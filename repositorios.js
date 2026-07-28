export function getProduct(gs, productId) {
  return gs.products.find((p) => p.id === productId) || gs.products[0];
}

export function getField(product, fieldId) {
  return product?.fields?.find((f) => f.id === fieldId) || product?.fields?.[0];
}
