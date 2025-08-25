export const grossRobuxNeeded = (liquid: number) => Math.ceil(liquid / 0.7)
export const liquidCostPerRobux = (cBruto: number) => cBruto / 0.7
export const priceInBRL = (liquidRobux: number, pricePerRobux: number) =>
  Math.round(liquidRobux * pricePerRobux * 100)
export const margin = (pricePerRobux: number, cBruto: number) => {
  const cL = liquidCostPerRobux(cBruto)
  return (pricePerRobux - cL) / pricePerRobux
}


